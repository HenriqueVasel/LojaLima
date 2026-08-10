import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {

  try {

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

    productcategory: {
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

      select: {
        productId: true,
      },
    },
  },
});

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

    productcategory: {
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

      select: {
        productId: true,
      },
    },
  },
});

    return NextResponse.json(categories);

  } catch (error) {

    console.error("Erro ao buscar categorias", error);

    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );

  }

}