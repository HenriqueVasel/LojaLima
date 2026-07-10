import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {

  try {

    const orders = await prisma.order.findMany({

      include: {

        orderitem: true,

        payment: true,

        user: {
          select: {
            name: true,
            email: true
          }
        }

      },

      orderBy: {
        createdAt: "desc"
      }

    });

    return NextResponse.json(orders);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Erro ao buscar pedidos."
      },
      {
        status: 500
      }
    );

  }

}