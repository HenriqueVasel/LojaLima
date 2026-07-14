import { NextResponse } from "next/server";
import client from "@/app/lib/mercadopago";
import { Preference } from "mercadopago";
import { prisma } from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { calcularPrecoVenda } from "@/app/lib/pricing";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "OrderId inválido" },
        { status: 400 }
      );
    }

    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // 🔥 buscar pedido real
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderitem: true
      }
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json(
        { error: "Pedido inválido" },
        { status: 403 }
      );
    }

    // 🔥 calcular total no backend
const totalCents = order.orderitem.reduce((acc, item) => {
  return acc + (item.priceCents ?? 0) * item.qty;
}, 0);

const total = totalCents / 100;

    if (total <= 0) {
      return NextResponse.json(
        { error: "Total inválido" },
        { status: 400 }
      );
    }

    const preference = new Preference(client);

   const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://lojalimaelima.com.br";

const response = await preference.create({
body: {
  items: [
    {
      id: orderId,
      title: "Pedido Loja",
      quantity: 1,
      currency_id: "BRL",
      unit_price: total
    }
  ],

  external_reference: orderId,

  notification_url: `${baseUrl}/api/payment/webhook`,

  back_urls: {
    success: `${baseUrl}/pagamento/retorno?orderId=${orderId}`,
    failure: `${baseUrl}/pagamento/retorno?orderId=${orderId}`,
    pending: `${baseUrl}/pagamento/retorno?orderId=${orderId}`
  },

  auto_return: "approved",

  binary_mode: false,

  payment_methods: {
  excluded_payment_methods: [],
  excluded_payment_types: [],
  installments: 12,
},

  
}
});

    return NextResponse.json({
      init_point: response.init_point
    });

  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Erro MercadoPago" },
      { status: 500 }
    );
  }
}