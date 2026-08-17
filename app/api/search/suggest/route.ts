import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { expandTerms, normalize } from "@/app/lib/search";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawQuery = searchParams.get("q") || "";
    const q = normalize(rawQuery);

    if (q.length < 2) {
      return NextResponse.json({
        brands: [],
        products: [],
      });
    }

    const terms = expandTerms(q).slice(0, 5);

    // ==========================================================
    // MARCAS
    // ==========================================================

    const brands = await prisma.brand.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
        name: true,
        slug: true,
      },

      orderBy: {
        name: "asc",
      },

      take: 8,
    });

    // ==========================================================
    // PRODUTOS
    // ==========================================================

  const conditions: any[] = terms.flatMap((term) => [
  {
    name: {
      contains: term,
      mode: "insensitive",
    },
  },

  {
    brand: {
      contains: term,
      mode: "insensitive",
    },
  },

  {
    slug: {
      contains: term,
      mode: "insensitive",
    },
  },

  {
    sku: {
      contains: term,
      mode: "insensitive",
    },
  },
]);

    const products = await prisma.product.findMany({
      where: {
        active: true,

        OR: [
          {
            name: {
              contains: q,
              mode: "insensitive",
            },
          },

          {
            slug: {
              contains: q,
              mode: "insensitive",
            },
          },

          {
            brand: {
              contains: q,
              mode: "insensitive",
            },
          },

          {
            sku: {
              contains: q,
              mode: "insensitive",
            },
          },

          ...conditions,
        ],
      },

      select: {
        id: true,
        name: true,
        slug: true,
        priceCents: true,

        productimage: {
          take: 1,

          select: {
            url: true,
          },
        },
      },

      take: 8,
    });

    return NextResponse.json({
      brands,
      products,
    });

  } catch (error) {
    console.error("Erro no autocomplete:", error);

    return NextResponse.json(
      {
        brands: [],
        products: [],
      },
      {
        status: 500,
      }
    );
  }
}