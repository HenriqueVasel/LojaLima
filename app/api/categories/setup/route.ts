import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {

    // Busca todas as categorias
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });

    // Mostra as categorias no terminal
    console.log("===== CATEGORIAS =====");

    categories.forEach((category) => {
      console.log(
        category.id,
        "|",
        category.name,
        "|",
        category.slug,
        "| parent:",
        category.parentId
      );
    });

    return NextResponse.json({
      success: true,
      message: "Categorias encontradas. Nenhuma alteração foi feita.",
      categories,
    });

  } catch (error) {

    console.error("Erro:", error);

    return NextResponse.json(
      {
        error: "Erro ao consultar categorias",
      },
      {
        status: 500,
      }
    );
  }
}