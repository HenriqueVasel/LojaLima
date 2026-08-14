import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const telefonia = await prisma.category.findFirst({
      where: {
        OR: [
          {
            slug: "telefonia",
          },
          {
            name: "Telefonia",
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        active: true,
      },
    });

    if (!telefonia) {
      return NextResponse.json({
        sucesso: false,
        erro: "Categoria Telefonia não encontrada.",
      });
    }

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

    const telefoniaIds = new Set<number>();

    telefoniaIds.add(telefonia.id);

    let encontrou = true;

    while (encontrou) {
      encontrou = false;

      for (const categoria of todasCategorias) {
        if (
          categoria.parentId !== null &&
          telefoniaIds.has(categoria.parentId) &&
          !telefoniaIds.has(categoria.id)
        ) {
          telefoniaIds.add(categoria.id);
          encontrou = true;
        }
      }
    }

    const categoriasTelefonia = todasCategorias.filter((categoria) =>
      telefoniaIds.has(categoria.id)
    );

    return NextResponse.json({
      sucesso: true,

      totalCategoriasTelefonia:
        categoriasTelefonia.length,

      telefonia,

      categorias: categoriasTelefonia,
    });
  } catch (error) {
    console.error(
      "Erro ao listar árvore Telefonia:",
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