import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ========================================================
    // 1. BUSCAR MARCAS ATIVAS
    // ========================================================

    const brands = await prisma.brand.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
        name: true,
        slug: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    // ========================================================
    // 2. CONTAR PRODUTOS VÁLIDOS POR MARCA
    // ========================================================

    const productCounts = await prisma.product.groupBy({
      by: ["brandRefId"],

      where: {
        active: true,

        brandRefId: {
          not: null,
        },

        stock: {
          quantity: {
            gt: 0,
          },
        },

        productimage: {
          some: {
            url: {
              not: "",
            },
          },
        },
      },

      _count: {
        id: true,
      },
    });

    // ========================================================
    // 3. MAPA
    // brandId -> quantidade de produtos
    // ========================================================

    const countMap = new Map(
      productCounts
        .filter(
          (item) => item.brandRefId !== null
        )
        .map((item) => [
          item.brandRefId as number,
          item._count.id,
        ])
    );

    // ========================================================
    // 4. JUNTAR MARCAS + QUANTIDADE
    // ========================================================

    const brandsWithCount = brands
      .map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        productCount:
          countMap.get(brand.id) || 0,
      }))
      .filter(
        (brand) => brand.productCount > 0
      );

    // ========================================================
    // 5. RETORNO
    // ========================================================

    return NextResponse.json(
      brandsWithCount
    );

  } catch (error) {
    console.error(
      "Erro ao buscar marcas:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro ao buscar marcas",
      },
      {
        status: 500,
      }
    );
  }
}