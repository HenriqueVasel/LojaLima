import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const executar =
      searchParams.get("executar") === "true";

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
    // MODO CONSULTA
    // ========================================================

    if (!executar) {
      return NextResponse.json({
        sucesso: true,

        modo: "PREPARACAO_SEM_GRAVACAO",

        cftv,

        cameras,

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
          "Nenhuma alteração foi realizada. Use ?executar=true para aplicar.",
      });
    }

    // ========================================================
    // 1. MOVER CÂMERAS PARA DENTRO DE CFTV
    // ========================================================

    await prisma.category.update({
      where: {
        id: cameras.id,
      },

      data: {
        parentId: cftv.id,
      },
    });

    // ========================================================
    // 2. CRIAR CÂMERAS ANALÓGICAS
    // ========================================================

    const analogicas =
      await prisma.category.upsert({
        where: {
          slug: "analogicas",
        },

        update: {
          name: "Analógicas",
          parentId: cameras.id,
          active: true,
        },

        create: {
          name: "Analógicas",
          slug: "analogicas",
          parentId: cameras.id,
          active: true,
        },
      });

    // ========================================================
    // 3. CRIAR SPEED DOME
    // ========================================================

    const speedDome =
      await prisma.category.upsert({
        where: {
          slug: "speed-dome",
        },

        update: {
          name: "Speed Dome",
          parentId: cameras.id,
          active: true,
        },

        create: {
          name: "Speed Dome",
          slug: "speed-dome",
          parentId: cameras.id,
          active: true,
        },
      });

    // ========================================================
    // 4. BUSCAR ÁRVORE FINAL
    // ========================================================

    const categorias =
      await prisma.category.findMany({
        where: {
          OR: [
            {
              id: cftv.id,
            },
            {
              id: cameras.id,
            },
            {
              parentId: cameras.id,
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

    return NextResponse.json({
      sucesso: true,

      modo: "APLICACAO_ESTRUTURA_CFTV",

      alteracoes: {
        cameras: {
          id: cameras.id,
          parentIdAnterior:
            cameras.parentId,
          parentIdNovo:
            cftv.id,
        },

        criadasOuAtualizadas: [
          {
            id: analogicas.id,
            name: analogicas.name,
            slug: analogicas.slug,
            parentId: analogicas.parentId,
          },

          {
            id: speedDome.id,
            name: speedDome.name,
            slug: speedDome.slug,
            parentId: speedDome.parentId,
          },
        ],
      },

      categorias,
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