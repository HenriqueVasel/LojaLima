import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        {
          parentId: "asc",
        },
        {
          sortOrder: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        active: true,
        sortOrder: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}