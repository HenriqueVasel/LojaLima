import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import client from "@/app/lib/mercadopago";
import { Payment } from "mercadopago";
import { sendPurchaseGA4 } from "@/app/lib/ga4";

import { payment_status } from "@prisma/client";
import { sendOrderEmail } from "@/app/lib/email";


/* =========================
🔥 MAPEAMENTO
========================= */
function mapPayment_status(
  status: string | undefined
): payment_status {

  switch (status) {

    case "approved":
      return payment_status.approved;

    case "pending":
    case "in_process":
      return payment_status.pending;

    case "rejected":
    case "cancelled":
      return payment_status.rejected;

    default:
      return payment_status.pending;
  }
}

export async function POST(req: Request) {

try {

  console.log(
    "🔥 WEBHOOK CHEGOU"
  );

  console.log(
    "🚀 NOVO WEBHOOK V2"
  );

    /* =========================
    🔒 RAW BODY
    ========================= */
    const rawBody = await req.text();

    



    /* =========================
    📦 BODY
    ========================= */
    const body = JSON.parse(
      rawBody
    );

     
await processWebhook(body);

return NextResponse.json({
  ok: true,
});

  } catch (error) {

    console.error(
      "❌ Erro webhook:",
      error
    );

    return NextResponse.json({
      ok: true,
    });
  }
}

async function processWebhook(
  body: any
) {

  try {

    /* =========================
    🔥 FILTRO FLEXÍVEL
    ========================= */
    

  /* =========================
🔥 ACEITA TODOS OS FORMATOS DO MP
========================= */

const isPayment =
  body.type === "payment" ||
  body.topic === "payment" ||
  body.action === "payment.created" ||
  body.action === "payment.updated";

if (!isPayment) {

  console.log(
    "⛔ Evento ignorado:",
    body
  );

  return;
}

const paymentId =
  body?.data?.id ||
  body?.id ||
  body?.resource;

    /* =========================
    💳 BUSCA PAGAMENTO
    ========================= */
    const paymentClient =
      new Payment(client);

    const payment =
      await paymentClient.get({
        id: paymentId,
      });

    if (!payment.status) {

      console.log(
        "❌ Payment sem status"
      );

      return;
    }

   console.log(
  "📌 STATUS:",
  payment.status
);

console.log(
  "🧾 EXTERNAL REF:",
  payment.external_reference
);

    const orderId =
      payment.external_reference;

    if (!orderId) {

      console.log(
        "❌ Sem orderId (external_reference vazio)"
      );

      return;
    }

    /* =========================
    📦 BUSCA PEDIDO
    ========================= */
    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },

        include: {
          orderitem: true,
          user: true,
        },
      });

    if (!order) {

      console.log(
        "❌ Pedido não encontrado:",
        orderId
      );

      return;
    }

    const status =
      mapPayment_status(
        payment.status
      );

    let shouldSendEmail =
      false;

    /* =========================
    🔥 TRANSACTION
    ========================= */
    await prisma.$transaction(
      async (tx) => {

        /* =========================
        💳 UPSERT PAYMENT
        ========================= */
        await tx.payment.upsert({

          where: { orderId },

          update: {
            status,
            externalId:
              String(paymentId),
          },

          create: {
            orderId,

            provider:
              "mercadopago",

            status,

            amountCents:
              order.totalCents,

            externalId:
              String(paymentId),
          },
        });

        /* =========================
        ✅ PAGAMENTO APROVADO
        ========================= */
        if (
          status ===
          payment_status.approved
        ) {

          /* =========================
          🔒 UPDATE ATÔMICO
          ========================= */
          const updatedOrder =
            await tx.order.updateMany({
              where: {
                id: orderId,

                status: {
                  not: "paid",
                },
              },

              data: {
                status: "paid",
              },
            });

          // já estava pago
          if (
            updatedOrder.count === 0
          ) {

            console.log(
              "⚠️ Pedido já estava pago"
            );

            return;
          }

          console.log(
            "✅ Pagamento aprovado:",
            paymentId
          );

          /* =========================
          📦 BAIXA ESTOQUE
          ========================= */
          for (const item of order.orderitem) {

            if (item.variantId) {

              await tx.stock.updateMany({
                where: {
                  variantId:
                    item.variantId,
                },

                data: {
                  quantity: {
                    decrement:
                      item.qty,
                  },
                },
              });

            } else {

              await tx.stock.updateMany({
                where: {
                  productId:
                    item.productId,
                },

                data: {
                  quantity: {
                    decrement:
                      item.qty,
                  },
                },
              });
            }
          }

          /* =========================
          🛒 LIMPA CARRINHO
          ========================= */
          await tx.cartitem.deleteMany({
            where: {
              userId:
                order.userId,
            },
          });

          shouldSendEmail =
            true;
        }
      }
    );

    /* =========================
    📧 EMAIL
    ========================= */
    if (shouldSendEmail) {

      const fullOrder =
        await prisma.order.findUnique({
          where: {
            id: orderId,
          },

          include: {
            orderitem: true,
          },
        });
if (fullOrder) {

  console.log("📧 Enviando email...");

  const emailResult =
    await sendOrderEmail(fullOrder);

  console.log("📧 RESULTADO EMAIL:", emailResult);

  // 🔥 Envia purchase para o GA4
  await sendPurchaseGA4(fullOrder);

} else {

  console.log(
    "❌ Pedido não encontrado para email"
  );

}

    } else {

      console.log(
        "⛔ Email não enviado (status não aprovado)"
      );
    }

  } catch (err) {

    console.error(
      "❌ Erro async webhook:",
      err
    );
  }
}