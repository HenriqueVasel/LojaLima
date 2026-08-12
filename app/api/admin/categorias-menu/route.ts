import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categorias = await prisma.category.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,

        _count: {
          select: {
            productcategory: true,
          },
        },
      },

      orderBy: [
        {
          parentId: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      sucesso: true,

      totalCategorias: categorias.length,

      categorias: categorias.map((categoria) => ({
        id: categoria.id,
        nome: categoria.name,
        slug: categoria.slug,
        parentId: categoria.parentId,
        produtos: categoria._count.productcategory,
      })),
    });
  } catch (error) {
    console.error(
      "Erro ao carregar categorias do menu:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro ao carregar categorias",
      },
      {
        status: 500,
      }
    );
  }
}