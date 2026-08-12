import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categorias = await prisma.category.findMany({
      where: {
        OR: [
          {
            slug: {
              contains: "cftv",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "cftv",
              mode: "insensitive",
            },
          },
          {
            slug: {
              contains: "camera",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "camera",
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

    return NextResponse.json({
      sucesso: true,
      total: categorias.length,
      categorias,
    });
  } catch (error) {
    console.error(
      "Erro no diagnóstico CFTV:",
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