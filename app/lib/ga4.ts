const MEASUREMENT_ID = "G-3CYH2XHY6X";
const API_SECRET = "mK-V7nQITWmSuS6OV8AWlw";

export async function sendPurchaseGA4(order: any) {

  console.log("🔥🔥🔥 GA4 VERSÃO NOVA 🔥🔥🔥");

  console.log("ORDER RECEBIDA:", order);

  try {

    console.log("ANTES DO FETCH");

    const response = await fetch(
  `https://www.google-analytics.com/debug/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
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

    console.log("DEPOIS DO FETCH");
   const json = await response.json();

console.log("GA4 STATUS:", response.status);
console.log("GA4 DEBUG:", JSON.stringify(json, null, 2));

console.log("✅ Purchase enviado para GA4");
    console.log("✅ Purchase enviado para GA4");
  } catch (err) {
    console.error("Erro GA4:", err);
  }
}