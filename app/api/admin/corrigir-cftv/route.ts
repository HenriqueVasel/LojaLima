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
    // CATEGORIAS DE CFTV
    // ========================================================

    const cftv = await prisma.category.findFirst({
      where: {
        slug: "cftv",
        active: true,
      },
      select: {
        id: true,
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
    // BUSCAR TODAS AS CATEGORIAS DESCENDENTES DE CFTV
    // ========================================================

    const todasCategorias = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });

    const cftvIds = new Set<number>([cftv.id]);

    let encontrou = true;

    while (encontrou) {
      encontrou = false;

      for (const categoria of todasCategorias) {
        if (
          categoria.parentId !== null &&
          cftvIds.has(categoria.parentId) &&
          !cftvIds.has(categoria.id)
        ) {
          cftvIds.add(categoria.id);
          encontrou = true;
        }
      }
    }

    // ========================================================
    // PRODUTOS
    // ========================================================

    const products = await prisma.product.findMany({
      where: {
        active: true,

        productcategory: {
          some: {
            categoryId: {
              in: Array.from(cftvIds),
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

    const detalhes: Array<{
      id: number;
      sku: string | null;
      nome: string;
      atual: string[];
      nova: string | null;
      acao: string;
    }> = [];

    // ========================================================
    // PROCESSAR
    // ========================================================

    for (const product of products) {
      const categoriasAtuais =
        product.productcategory
          .filter((item) =>
            cftvIds.has(item.categoryId)
          )
          .map((item) => item.category.name);

      const classification = classifyProduct({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        categories: categoriasAtuais,
      });

      // ======================================================
      // SÓ CORRIGE PRODUTOS QUE O CLASSIFICADOR IDENTIFICOU
      // COMO CFTV / CÂMERAS
      // ======================================================

      if (classification.family !== "cftv") {
        ignorados++;

        detalhes.push({
          id: product.id,
          sku: product.sku,
          nome: product.name,
          atual: categoriasAtuais,
          nova: null,
          acao: "IGNORADO_NAO_CFTV",
        });

        continue;
      }

      if (!classification.type) {
        semClassificacao++;

        detalhes.push({
          id: product.id,
          sku: product.sku,
          nome: product.name,
          atual: categoriasAtuais,
          nova: null,
          acao: "SEM_CLASSIFICACAO",
        });

        continue;
      }

      // ======================================================
      // ENCONTRAR CATEGORIA FINAL
      // ======================================================

      const categoriaNome =
        classification.subtype
          ? classification.subtype
          : classification.type;

     const camerasCategory = await prisma.category.findFirst({
  where: {
    name: "Câmeras",
    parentId: cftv.id,
  },

  select: {
    id: true,
  },
});

if (!camerasCategory) {
  detalhes.push({
    id: product.id,
    sku: product.sku,
    nome: product.name,
    atual: categoriasAtuais,
    nova: categoriaNome,
    acao: "CATEGORIA_PAI_CAMERAS_NAO_ENCONTRADA",
  });

  continue;
}

const categoria = await prisma.category.findFirst({
  where: {
    name: categoriaNome,
    parentId: camerasCategory.id,
  },

  select: {
    id: true,
    name: true,
    slug: true,
  },
});

      if (!categoria) {
        detalhes.push({
          id: product.id,
          sku: product.sku,
          nome: product.name,
          atual: categoriasAtuais,
          nova: categoriaNome,
          acao: "CATEGORIA_NAO_ENCONTRADA",
        });

        continue;
      }

      detalhes.push({
        id: product.id,
        sku: product.sku,
        nome: product.name,
        atual: categoriasAtuais,
        nova: categoria.name,
        acao: dryRun
          ? "DRY_RUN"
          : "CORRIGIDO",
      });

      if (dryRun) {
        corrigidos++;
        continue;
      }

      // ======================================================
      // LIMPAR APENAS ASSOCIAÇÕES DE CFTV
      // ======================================================

      await prisma.productcategory.deleteMany({
        where: {
          productId: product.id,

          categoryId: {
            in: Array.from(cftvIds),
          },
        },
      });

      // ======================================================
      // ADICIONAR A CATEGORIA CORRETA
      // ======================================================

      await prisma.productcategory.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId: categoria.id,
          },
        },

        update: {},

        create: {
          productId: product.id,
          categoryId: categoria.id,
        },
      });

      corrigidos++;
    }

    return NextResponse.json({
      sucesso: true,

      modo: dryRun
        ? "DRY_RUN"
        : "APLICACAO_REAL",

      totalProdutosCFTV: products.length,

      corrigidos,

      ignorados,

      semClassificacao,

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