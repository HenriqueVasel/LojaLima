import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendTrackingUpdateEmail } from "@/app/lib/email";

export async function POST(req: NextRequest) {

  try {

    const body = await req.json();

    const {
      orderId,
      carrier,
      trackingCode,
      trackingUrl,
      shippingStatus
    } = body;

    if (!orderId) {

      return NextResponse.json(
        {
          error: "Pedido não informado."
        },
        {
          status: 400
        }
      );

    }

const order = await prisma.order.update({

  where: {
    id: orderId
  },

  data: {

    carrier,

    trackingCode,

    trackingUrl,

    shippingStatus,

    lastTrackingUpdate: new Date()

  },

  include: {

    orderitem: true

  }

});


console.log("📧 Enviando atualização de rastreio...");

const resultado = await sendTrackingUpdateEmail(order);

console.log("EMAIL DESTINO:", order.customerEmail);

console.log("STATUS:", order.shippingStatus);

console.log("TRACKING:", order.trackingCode);

console.log("📧 Resultado:", resultado);



    return NextResponse.json({

      success: true,

      order

    });

  } catch (error) {

    console.error(error);

    

    return NextResponse.json(
      {
        error: "Erro ao atualizar pedido."
      },
      {
        status: 500
      }
    );

  }

}