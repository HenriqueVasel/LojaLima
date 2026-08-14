import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ========================================================
    // 1. PROCURAR CATEGORIAS RELACIONADAS A TELEFONIA
    // ========================================================

    const candidatasTelefonia =
      await prisma.category.findMany({
        where: {
          OR: [
            {
              name: {
                contains: "telefon",
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: "telefon",
                mode: "insensitive",
              },
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

        orderBy: {
          id: "asc",
        },
      });

    // ========================================================
    // 2. SE NÃO ENCONTROU NADA
    // ========================================================

    if (candidatasTelefonia.length === 0) {
      return NextResponse.json({
        sucesso: false,

        erro:
          "Nenhuma categoria relacionada a Telefonia foi encontrada.",

        categoriasEncontradas: [],
      });
    }

    // ========================================================
    // 3. BUSCAR TODAS AS CATEGORIAS
    // ========================================================

    const todasCategorias =
      await prisma.category.findMany({
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
    // 4. DESCOBRIR TODAS AS CATEGORIAS DESCENDENTES
    //    DAS CATEGORIAS ENCONTRADAS
    // ========================================================

    const telefoniaIds = new Set<number>();

    for (const categoria of candidatasTelefonia) {
      telefoniaIds.add(categoria.id);
    }

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

    // ========================================================
    // 5. MONTAR RESULTADO
    // ========================================================

    const categoriasEncontradas =
      todasCategorias.filter((categoria) =>
        telefoniaIds.has(categoria.id)
      );

    // ========================================================
    // 6. RETORNO
    // ========================================================

    return NextResponse.json({
      sucesso: true,

      totalCategoriasEncontradas:
        candidatasTelefonia.length,

      candidatasTelefonia,

      totalCategoriasArvore:
        categoriasEncontradas.length,

      categorias: categoriasEncontradas,
    });
  } catch (error) {
    console.error(
      "Erro ao listar categorias de Telefonia:",
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