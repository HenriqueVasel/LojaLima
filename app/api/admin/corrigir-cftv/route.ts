import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { classifyProduct } from "@/app/lib/product-classifier";

export const dynamic = "force-dynamic";

export async function GET() {
  return executar(true);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const dryRun = body?.dryRun !== false;

  return executar(dryRun);
}

async function executar(dryRun: boolean) {
  try {
    // ========================================================
    // CFTV
    // ========================================================

    const cftv = await prisma.category.findFirst({
      where: {
        slug: "cftv",
        active: true,
      },

      select: {
        id: true,
        name: true,
      },
    });

    if (!cftv) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Categoria CFTV não encontrada.",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // BUSCAR TODAS AS CATEGORIAS
    // ========================================================

    const todasCategorias =
      await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
        },
      });

    // ========================================================
    // DESCOBRIR TODAS AS CATEGORIAS DENTRO DE CFTV
    // ========================================================

    const cftvIds = new Set<number>([
      cftv.id,
    ]);

    let encontrou = true;

    while (encontrou) {
      encontrou = false;

      for (const categoria of todasCategorias) {
        if (
          categoria.parentId !== null &&
          cftvIds.has(
            categoria.parentId
          ) &&
          !cftvIds.has(
            categoria.id
          )
        ) {
          cftvIds.add(
            categoria.id
          );

          encontrou = true;
        }
      }
    }

    // ========================================================
    // PRODUTOS QUE JÁ POSSUEM ALGUMA CATEGORIA CFTV
    // ========================================================

    const products =
      await prisma.product.findMany({
        where: {
          active: true,

          productcategory: {
            some: {
              categoryId: {
                in: Array.from(
                  cftvIds
                ),
              },
            },
          },
        },

        select: {
          id: true,
          name: true,
          sku: true,
          description: true,

          productcategory: {
            select: {
              categoryId: true,

              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },

        orderBy: {
          id: "asc",
        },
      });

    let corrigidos = 0;
    let ignorados = 0;
    let semClassificacao = 0;
    let categoriaNaoEncontrada = 0;

    const detalhes: Array<{
      id: number;
      sku: string | null;
      nome: string;
      atual: string[];
      familia: string | null;
      tipo: string | null;
      subtipo: string | null;
      nova: string | null;
      acao: string;
    }> = [];

    // ========================================================
    // PROCESSAR PRODUTOS
    // ========================================================

    for (const product of products) {
      const categoriasAtuais =
        product.productcategory
          .filter((item) =>
            cftvIds.has(
              item.categoryId
            )
          )
          .map(
            (item) =>
              item.category.name
          );

      const classification =
        classifyProduct({
          id: product.id,

          name: product.name,

          sku: product.sku,

          description:
            product.description,

          categories:
            categoriasAtuais,
        });

      // ======================================================
      // IGNORAR PRODUTOS QUE NÃO SÃO CFTV
      // ======================================================

      if (
        classification.family !==
        "cftv"
      ) {
        ignorados++;

        detalhes.push({
          id: product.id,

          sku: product.sku,

          nome: product.name,

          atual:
            categoriasAtuais,

          familia:
            classification.family ??
            null,

          tipo:
            classification.type ??
            null,

          subtipo:
            classification.subtype ??
            null,

          nova: null,

          acao:
            "IGNORADO_NAO_CFTV",
        });

        continue;
      }

      // ======================================================
      // SEM TIPO
      // ======================================================

      if (
        !classification.type
      ) {
        semClassificacao++;

        detalhes.push({
          id: product.id,

          sku: product.sku,

          nome: product.name,

          atual:
            categoriasAtuais,

          familia:
            classification.family ??
            null,

          tipo: null,

          subtipo:
            classification.subtype ??
            null,

          nova: null,

          acao:
            "SEM_TIPO",
        });

        continue;
      }

      // ======================================================
      // ENCONTRAR CATEGORIA DE DESTINO
      // ======================================================

      let categoriaDestino:
        {
          id: number;
          name: string;
          slug: string;
        } | null = null;

      // ======================================================
      // CASO 1 — CÂMERAS
      //
      // CFTV
      // └── Câmeras
      //     ├── IP
      //     ├── Wi-Fi
      //     ├── Analógicas
      //     ├── Multi-HD
      //     ├── Speed Dome
      //     └── Veiculares
      // ======================================================

      if (
        classification.type ===
        "Câmeras"
      ) {
        const camerasCategory =
          await prisma.category.findFirst({
            where: {
              name: "Câmeras",

              parentId:
                cftv.id,
            },

            select: {
              id: true,
            },
          });

        if (!camerasCategory) {
          categoriaNaoEncontrada++;

          detalhes.push({
            id: product.id,

            sku: product.sku,

            nome: product.name,

            atual:
              categoriasAtuais,

            familia:
              classification.family,

            tipo:
              classification.type,

            subtipo:
              classification.subtype ??
              null,

            nova: null,

            acao:
              "CATEGORIA_PAI_CAMERAS_NAO_ENCONTRADA",
          });

          continue;
        }

        // ----------------------------------------------------
        // TEM SUBTIPO
        // ----------------------------------------------------

        if (
          classification.subtype
        ) {
          categoriaDestino =
            await prisma.category.findFirst({
              where: {
                name:
                  classification.subtype,

                parentId:
                  camerasCategory.id,
              },

              select: {
                id: true,
                name: true,
                slug: true,
              },
            });
        }

        // ----------------------------------------------------
        // SEM SUBTIPO
        // ----------------------------------------------------

        if (
          !categoriaDestino
        ) {
          categoriaDestino =
            camerasCategory
              ? await prisma.category.findFirst({
                  where: {
                    id:
                      camerasCategory.id,
                  },

                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                })
              : null;
        }
      }

      // ======================================================
      // CASO 2 — DVR / NVR / OUTROS TIPOS DE CFTV
      //
      // Exemplo:
      //
      // CFTV
      // ├── DVR
      // │   └── Gravadores DVR
      // │
      // └── NVR
      //     └── Gravadores NVR
      // ======================================================

      else {
        const typeCategory =
          await prisma.category.findFirst({
            where: {
              name:
                classification.type,

              parentId:
                cftv.id,
            },

            select: {
              id: true,
              name: true,
              slug: true,
            },
          });

        if (!typeCategory) {
          categoriaNaoEncontrada++;

          detalhes.push({
            id: product.id,

            sku: product.sku,

            nome: product.name,

            atual:
              categoriasAtuais,

            familia:
              classification.family,

            tipo:
              classification.type,

            subtipo:
              classification.subtype ??
              null,

            nova: null,

            acao:
              "CATEGORIA_TIPO_NAO_ENCONTRADA",
          });

          continue;
        }

        // ----------------------------------------------------
        // SE EXISTIR SUBTIPO, PROCURAR DENTRO DO TIPO
        // ----------------------------------------------------

        if (
          classification.subtype
        ) {
          categoriaDestino =
            await prisma.category.findFirst({
              where: {
                name:
                  classification.subtype,

                parentId:
                  typeCategory.id,
              },

              select: {
                id: true,
                name: true,
                slug: true,
              },
            });
        }

        // ----------------------------------------------------
        // CASO NÃO ENCONTRE SUBTIPO,
        // USA O TIPO
        // ----------------------------------------------------

        if (
          !categoriaDestino
        ) {
          categoriaDestino =
            typeCategory;
        }
      }

      // ======================================================
      // CATEGORIA NÃO ENCONTRADA
      // ======================================================

      if (
        !categoriaDestino
      ) {
        categoriaNaoEncontrada++;

        detalhes.push({
          id: product.id,

          sku: product.sku,

          nome: product.name,

          atual:
            categoriasAtuais,

          familia:
            classification.family,

          tipo:
            classification.type,

          subtipo:
            classification.subtype ??
            null,

          nova:
            classification.subtype ??
            classification.type,

          acao:
            "CATEGORIA_NAO_ENCONTRADA",
        });

        continue;
      }

      // ======================================================
      // DETALHE
      // ======================================================

      detalhes.push({
        id: product.id,

        sku: product.sku,

        nome: product.name,

        atual:
          categoriasAtuais,

        familia:
          classification.family,

        tipo:
          classification.type,

        subtipo:
          classification.subtype ??
          null,

        nova:
          categoriaDestino.name,

        acao: dryRun
          ? "DRY_RUN"
          : "CORRIGIDO",
      });

      // ======================================================
      // DRY RUN
      // ======================================================

      if (dryRun) {
        corrigidos++;

        continue;
      }

      // ======================================================
      // APLICAÇÃO REAL
      //
      // REMOVE SOMENTE AS CATEGORIAS DE CFTV
      // ======================================================

      await prisma.productcategory.deleteMany({
        where: {
          productId:
            product.id,

          categoryId: {
            in: Array.from(
              cftvIds
            ),
          },
        },
      });

      // ======================================================
      // ADICIONA A CATEGORIA CORRETA
      // ======================================================

      await prisma.productcategory.upsert({
        where: {
          productId_categoryId: {
            productId:
              product.id,

            categoryId:
              categoriaDestino.id,
          },
        },

        update: {},

        create: {
          productId:
            product.id,

          categoryId:
            categoriaDestino.id,
        },
      });

      corrigidos++;
    }

    // ========================================================
    // RESPOSTA
    // ========================================================

    return NextResponse.json({
      sucesso: true,

      modo: dryRun
        ? "DRY_RUN"
        : "APLICACAO_REAL",

      totalProdutosCFTV:
        products.length,

      corrigidos,

      ignorados,

      semClassificacao,

      categoriaNaoEncontrada,

      categoriasCFTVEncontradas:
        cftvIds.size,

      detalhes,
    });
  } catch (error) {
    console.error(
      "Erro ao corrigir CFTV:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,

        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },

      {
        status: 500,
      }
    );
  }
}