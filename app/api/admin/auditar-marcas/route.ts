import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ========================================================
// NORMALIZAÇÃO
// ========================================================

function normalizarMarca(nome: string) {
  return nome
    .trim()
    .replace(/\s+/g, " ");
}

function chaveMarca(nome: string) {
  return normalizarMarca(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ========================================================
// GET
// ========================================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const executar =
      searchParams.get("executar") === "true";

    // ======================================================
    // 1. BUSCAR PRODUTOS COM MARCA
    // ======================================================

    const produtos = await prisma.product.findMany({
      where: {
        brand: {
          not: null,
        },
      },

      select: {
        id: true,
        brand: true,
        brandRefId: true,
      },
    });

    // ======================================================
    // 2. AGRUPAR MARCAS
    // ======================================================

    const marcasMap = new Map<
      string,
      {
        nome: string;
        quantidade: number;
      }
    >();

    for (const produto of produtos) {
      if (!produto.brand) continue;

      const nome = normalizarMarca(produto.brand);
      const chave = chaveMarca(nome);

      const atual = marcasMap.get(chave);

      if (atual) {
        atual.quantidade++;
      } else {
        marcasMap.set(chave, {
          nome,
          quantidade: 1,
        });
      }
    }

    // ======================================================
    // 3. BUSCAR MARCAS JÁ EXISTENTES
    // ======================================================

    const marcasExistentes =
      await prisma.brand.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          active: true,
        },

        orderBy: {
          id: "asc",
        },
      });

    const marcasPorChave = new Map<
      string,
      (typeof marcasExistentes)[number]
    >();

    for (const marca of marcasExistentes) {
      const chave = chaveMarca(marca.name);

      if (!marcasPorChave.has(chave)) {
        marcasPorChave.set(chave, marca);
      }
    }

    // ======================================================
    // 4. MODO PRÉVIA
    // ======================================================

    if (!executar) {
      const preview = Array.from(
        marcasMap.entries()
      )
        .sort((a, b) =>
          a[1].nome.localeCompare(
            b[1].nome,
            "pt-BR"
          )
        )
        .map(([chave, dados]) => {
          const existente =
            marcasPorChave.get(chave);

          return {
            nome: dados.nome,
            quantidadeProdutos:
              dados.quantidade,
            jaExiste: !!existente,
            marcaExistente: existente
              ? {
                  id: existente.id,
                  name: existente.name,
                  slug: existente.slug,
                }
              : null,
          };
        });

      return NextResponse.json({
        sucesso: true,

        modo: "PREVIA_SEM_ALTERACAO",

        resumo: {
          produtosComMarca:
            produtos.length,

          marcasEncontradas:
            marcasMap.size,

          marcasJaExistentes:
            preview.filter(
              (marca) => marca.jaExiste
            ).length,

          marcasQueSeriamCriadas:
            preview.filter(
              (marca) => !marca.jaExiste
            ).length,

          produtosJaVinculados:
            produtos.filter(
              (produto) =>
                produto.brandRefId !== null
            ).length,

          produtosQuePrecisamVinculo:
            produtos.filter(
              (produto) =>
                produto.brand !== null &&
                produto.brandRefId === null
            ).length,
        },

        marcas: preview,
      });
    }

    // ======================================================
    // 5. EXECUÇÃO
    // ======================================================

    let marcasCriadas = 0;
    let produtosVinculados = 0;

    const resultadoMarcas: Array<{
      name: string;
      slug: string;
      id: number;
      produtos: number;
      criada: boolean;
    }> = [];

    await prisma.$transaction(
      async (tx) => {
        // --------------------------------------------------
        // 5.1 CRIAR / ENCONTRAR CADA MARCA
        // --------------------------------------------------

        for (const [
          chave,
          dados,
        ] of marcasMap.entries()) {
          let marca =
            marcasPorChave.get(chave);

          let criada = false;

          if (!marca) {
            let slug = slugify(dados.nome);

            if (!slug) {
              slug = "marca";
            }

            // ----------------------------------------------
            // Garantir slug único
            // ----------------------------------------------

            let slugFinal = slug;
            let contador = 2;

            while (
              await tx.brand.findUnique({
                where: {
                  slug: slugFinal,
                },
                select: {
                  id: true,
                },
              })
            ) {
              slugFinal = `${slug}-${contador}`;
              contador++;
            }

            marca = await tx.brand.create({
              data: {
                name: dados.nome,
                slug: slugFinal,
                active: true,
              },

              select: {
                id: true,
                name: true,
                slug: true,
                active: true,
              },
            });

            marcasPorChave.set(
              chave,
              marca
            );

            marcasCriadas++;
            criada = true;
          }

          // ------------------------------------------------
          // 5.2 VINCULAR PRODUTOS
          // ------------------------------------------------

          const produtosDaMarca =
            await tx.product.updateMany({
              where: {
                brand: {
                  not: null,
                },

                brandRefId: null,

                OR: [
                  {
                    brand: dados.nome,
                  },
                  {
                    brand: {
                      equals: dados.nome,
                    },
                  },
                ],
              },

              data: {
                brandRefId: marca.id,
              },
            });

          produtosVinculados +=
            produtosDaMarca.count;

          resultadoMarcas.push({
            name: marca.name,
            slug: marca.slug,
            id: marca.id,
            produtos:
              produtosDaMarca.count,
            criada,
          });
        }
      },
      {
        timeout: 120000,
      }
    );

    // ======================================================
    // 6. AUDITORIA FINAL
    // ======================================================

    const totalProdutos =
      await prisma.product.count();

    const totalComBrand =
      await prisma.product.count({
        where: {
          brand: {
            not: null,
          },
        },
      });

    const totalComBrandRef =
      await prisma.product.count({
        where: {
          brandRefId: {
            not: null,
          },
        },
      });

    const totalSemMarca =
      await prisma.product.count({
        where: {
          AND: [
            {
              brand: null,
            },
            {
              brandRefId: null,
            },
          ],
        },
      });

    const totalMarcas =
      await prisma.brand.count();

    return NextResponse.json({
      sucesso: true,

      modo: "MIGRACAO_CONCLUIDA",

      resumo: {
        totalProdutos,

        totalMarcas,

        totalComBrand,

        totalComBrandRef,

        totalSemMarca,

        marcasCriadas,

        produtosVinculados,
      },

      marcas: resultadoMarcas.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "pt-BR"
          )
      ),
    });
  } catch (error) {
    console.error(
      "Erro ao migrar marcas:",
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
