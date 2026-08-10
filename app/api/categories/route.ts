import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Busca todas as categorias ativas
    const categories = await prisma.category.findMany({
      where: {
        active: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    // Busca quantos produtos válidos existem em cada categoria
    const productCounts = await prisma.productcategory.groupBy({
      by: ["categoryId"],

      where: {
        product: {
          active: true,

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
      },

      _count: {
        productId: true,
      },
    });

    // Cria um mapa:
    // categoryId -> quantidade de produtos
    const countMap = new Map(
      productCounts.map((item) => [
        item.categoryId,
        item._count.productId,
      ])
    );

    // Junta categorias + quantidade
    const categoriesWithCount = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        productCount: countMap.get(category.id) || 0,
      }))
      .filter((category) => category.productCount > 0);

    return NextResponse.json(categoriesWithCount);

  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar categorias",
      },
      {
        status: 500,
      }
    );
  }
}