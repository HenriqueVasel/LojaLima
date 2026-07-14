const MEASUREMENT_ID = "G-3CYH2XHY6X";
const API_SECRET = "mK-V7nQITWmSuS6OV8AWlw";

export async function sendPurchaseGA4(order: any) {
  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: `${Date.now()}.${Math.floor(Math.random() * 1000000)}`,

          events: [
            {
              name: "purchase",

              params: {
                transaction_id: order.id,
                currency: "BRL",
                value: order.totalCents / 100,

                items: order.orderitem.map((item: any) => ({
                  item_id: String(item.productId),
                  item_name: item.name,
                  price: item.priceCents / 100,
                  quantity: item.qty,
                })),
              },
            },
          ],
        }),
      }
    );
  } catch (err) {
    console.error("Erro ao enviar Purchase para o GA4:", err);
  }
}