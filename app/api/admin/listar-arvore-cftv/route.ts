import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cftv = await prisma.category.findUnique({
      where: {
        id: 92,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        active: true,
      },
    });

    if (!cftv) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "CFTV ID 92 não encontrado.",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // TODAS AS CATEGORIAS
    // ========================================================

    const todasCategorias = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        active: true,
      },

      orderBy: {
        id: "asc",
      },
    });

    // ========================================================
    // DESCOBRIR TODAS AS DESCENDENTES DE CFTV
    // ========================================================

    const cftvIds = new Set<number>();

    cftvIds.add(cftv.id);

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
    // ÁRVORE FINAL DE CFTV
    // ========================================================

    const categoriasCFTV = todasCategorias.filter((categoria) =>
      cftvIds.has(categoria.id)
    );

    return NextResponse.json({
      sucesso: true,

      totalCategoriasCFTV: categoriasCFTV.length,

      cftv,

      categorias: categoriasCFTV,
    });
  } catch (error) {
    console.error(
      "Erro ao listar árvore CFTV:",
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
