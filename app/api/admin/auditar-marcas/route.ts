import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ========================================================
    // 1. MARCAS DA TABELA BRAND
    // ========================================================

    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        _count: {
          select: {
            products: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    // ========================================================
    // 2. PRODUTOS COM BRAND ANTIGO
    // ========================================================

    const produtosComBrandAntigo =
      await prisma.product.findMany({
        where: {
          brand: {
            not: null,
          },
        },

        select: {
          id: true,
          name: true,
          brand: true,
          brandRefId: true,
        },

        orderBy: {
          brand: "asc",
        },
      });

    // ========================================================
    // 3. PRODUTOS COM BRANDREF
    // ========================================================

    const produtosComBrandRef =
      await prisma.product.findMany({
        where: {
          brandRefId: {
            not: null,
          },
        },

        select: {
          id: true,
          name: true,
          brand: true,
          brandRefId: true,
          brandRef: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
            },
          },
        },

        orderBy: {
          brandRefId: "asc",
        },
      });

    // ========================================================
    // 4. PRODUTOS SEM NENHUMA MARCA
    // ========================================================

    const produtosSemMarca =
      await prisma.product.findMany({
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

        select: {
          id: true,
          name: true,
          sku: true,
        },

        orderBy: {
          name: "asc",
        },
      });

    // ========================================================
    // 5. RESUMO
    // ========================================================

    const totalProdutos =
      await prisma.product.count();

    const totalComBrandAntigo =
      produtosComBrandAntigo.length;

    const totalComBrandRef =
      produtosComBrandRef.length;

    const totalSemMarca =
      produtosSemMarca.length;

    return NextResponse.json({
      sucesso: true,

      resumo: {
        totalProdutos,
        totalMarcasCadastradas: brands.length,
        totalComBrandAntigo,
        totalComBrandRef,
        totalSemMarca,
      },

      marcas: brands,

      produtosComBrandAntigo,

      produtosComBrandRef,

      produtosSemMarca,
    });
  } catch (error) {
    console.error(
      "Erro ao auditar marcas:",
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