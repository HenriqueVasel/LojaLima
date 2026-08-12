import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ========================================================
    // CFTV
    // ========================================================

    const cftv = await prisma.category.findUnique({
      where: {
        id: 92,
      },

      select: {
        id: true,
        name: true,
        slug: true,
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
    // CÂMERAS
    // ========================================================

    const cameras = await prisma.category.findUnique({
      where: {
        id: 99,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });

    if (!cameras) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Câmeras ID 99 não encontrada.",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // NÃO ALTERA NADA
    //
    // PRIMEIRO APENAS MOSTRA O QUE SERÁ FEITO
    // ========================================================

    const filhasAtuais =
      await prisma.category.findMany({
        where: {
          parentId: cameras.id,
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

    return NextResponse.json({
      sucesso: true,

      modo: "PREPARACAO_SEM_GRAVACAO",

      cftv,

      cameras,

      filhasAtuais,

      alteracoesPlanejadas: {
        camerasParentId: {
          atual: cameras.parentId,
          novo: cftv.id,
        },

        criarCategorias: [
          {
            name: "Analógicas",
            slug: "analogicas",
            parentId: cameras.id,
          },
          {
            name: "Speed Dome",
            slug: "speed-dome",
            parentId: cameras.id,
          },
        ],
      },

      observacao:
        "Nenhuma alteração foi realizada no banco.",
    });
  } catch (error) {
    console.error(
      "Erro ao preparar CFTV:",
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