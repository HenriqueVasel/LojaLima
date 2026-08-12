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
      },
    });

    const cameras = await prisma.category.findMany({
      where: {
        OR: [
          {
            id: 99,
          },
          {
            parentId: 99,
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

    const categoriasCFTV =
      await prisma.category.findMany({
        where: {
          parentId: 92,
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

      cftv,

      categoriasFilhasCFTV:
        categoriasCFTV,

      camerasEFilhas:
        cameras,
    });
  } catch (error) {
    console.error(
      "Erro no diagnóstico:",
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