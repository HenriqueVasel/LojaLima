import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {

  try {

    const body = await req.json();

const { cep, items } = body;

    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
  return NextResponse.json(
    { error: "Nenhum produto informado." },
    { status: 400 }
  );
}
    console.log(process.env.MELHOR_ENVIO_TOKEN);

    const products = [];

for (const item of items) {

  const produto = await prisma.product.findUnique({
    where: {
      id: item.productId
    }
  });

  if (!produto) continue;

  products.push({

    id: String(produto.id),

width: produto.width
  ? Number((produto.width / 10).toFixed(1))
  : 20,

height: produto.height
  ? Number((produto.height / 10).toFixed(1))
  : 5,

length: produto.length
  ? Number((produto.length / 10).toFixed(1))
  : 30,

    weight: produto.weight || 1,

    insurance_value: produto.priceCents / 100,

    quantity: item.quantity

  });

}

    const response = await fetch(
      "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          "Accept": "application/json",
          "User-Agent": "Lima e Lima Ecommerce (contato@lojalimaelima.com.br)"
        },

        body: JSON.stringify({

          from: {
            postal_code: "89251155" // TEU CEP
          },

          to: {
            postal_code: cepLimpo
          },

          products,

          options: {
            receipt: false,
            own_hand: false
          },

          
        })
      }
    );

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      { error: "Erro ao calcular frete" },
      { status: 500 }
    );

  }

}