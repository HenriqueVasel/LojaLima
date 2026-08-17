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
        products: [],
        brands: [],
      });
    }

    const terms = expandTerms(q).slice(0, 5);

    // ========================================================
    // PRODUTOS
    // ========================================================

    const conditions = terms.flatMap((term) => [
      {
        name: {
          contains: term,
          mode: "insensitive" as const,
        },
      },
      {
        brand: {
          contains: term,
          mode: "insensitive" as const,
        },
      },
      {
        slug: {
          contains: term,
          mode: "insensitive" as const,
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

    // ========================================================
    // MARCAS
    // ========================================================

    const brands = await prisma.brand.findMany({
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

          ...terms.map((term) => ({
            name: {
              contains: term,
              mode: "insensitive" as const,
            },
          })),
        ],
      },

      select: {
        id: true,
        name: true,
        slug: true,
      },

      orderBy: {
        name: "asc",
      },

      take: 5,
    });

    // ========================================================
    // RETORNO
    // ========================================================

    return NextResponse.json({
      products,
      brands,
    });

  } catch (error) {
    console.error("Erro na busca de sugestões:", error);

    return NextResponse.json(
      {
        products: [],
        brands: [],
      },
      {
        status: 500,
      }
    );
  }
}