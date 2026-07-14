"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/app/styles/meus-pedidos.module.css";
import { sendGAEvent } from "@next/third-parties/google";

export default function MeusPedidos() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/orders", {
          credentials: "include",
        });

        if (res.status === 401) {
          router.push("/login?redirect=/meus-pedidos");
          return;
        }

        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);

        if (Array.isArray(data)) {

  for (const order of data) {

    if (order.status !== "paid") continue;

    const key = `purchase_${order.id}`;

    if (localStorage.getItem(key)) continue;

    console.log("🚀 ENVIANDO PURCHASE:", order.id);

    sendGAEvent("event", "purchase", {
  debug_mode: true,
  transaction_id: String(order.id),
  currency: "BRL",
  value: order.totalCents / 100,

      items: (order.orderitem || []).map((item: any) => ({
        item_id: String(item.productId),
        item_name: item.name,
        price: item.priceCents / 100,
        quantity: item.qty,
      })),
    });

    if ((window as any).fbq) {
      (window as any).fbq("track", "Purchase", {
        value: order.totalCents / 100,
        currency: "BRL",
      });
    }

    localStorage.setItem(key, "1");
  }
}
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <div className={s.page}>
      <div className={s.container}>
        <h1 className={s.title}>Meus Pedidos</h1>

        {loading && (
          <div className={s.card}>
            Carregando pedidos...
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className={s.card}>
            <div className={s.empty}>
              <p>Você ainda não fez nenhum pedido.</p>

              <button
                onClick={() => router.push("/")}
                className={s.button}
              >
                Começar a comprar
              </button>
            </div>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className={s.card}>

            {/* TOPO */}
            <div className={s.topCard}>

              <div className={s.leftSide}>

                <div className={s.orderNumber}>
                  Pedido #{order.id.slice(0, 8)}
                </div>

                <div className={s.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                </div>

                <div className={s.topBadges}>

                  <span className={`${s.status} ${s[order.status]}`}>
                    {order.status === "pending"
                      ? "Pendente"
                      : order.status === "paid"
                      ? "Pago"
                      : order.status === "shipped"
                      ? "Enviado"
                      : order.status === "completed"
                      ? "Entregue"
                      : order.status}
                  </span>

                  <span className={s.itemsCount}>
                    {order.orderitem?.length || 0} itens
                  </span>

                </div>
              </div>

              <div className={s.rightSide}>

                {order.shippingCents > 0 && (
                  <div className={s.shipping}>
                    Frete:{" "}
                    {(order.shippingCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                )}

                <div className={s.totalPrice}>
                  {(order.totalCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>

                <button
                  onClick={() =>
                    router.push(`/meus-pedidos/${order.id}`)
                  }
                  className={s.detailsBtn}
                >
                  Ver detalhes
                </button>

              </div>
            </div>

            {/* TIMELINE */}
            <div className={s.timeline}>

              <div className={`${s.step} ${s.active}`}>
                <div className={s.stepCircle}>✓</div>
                <div className={s.stepLabel}>Pedido</div>
              </div>

              <div
  className={`${s.step} ${
    order.status !== "pending"
      ? s.active
      : ""
  }`}
>
                <div className={s.stepCircle}>✓</div>
                <div className={s.stepLabel}>Pago</div>
              </div>

              <div
  className={`${s.step} ${
    order.shippingStatus === "shipped" ||
    order.shippingStatus === "delivered"
      ? s.active
      : ""
  }`}
>
                <div className={s.stepCircle}>✓</div>
                <div className={s.stepLabel}>Enviado</div>
              </div>

              <div
  className={`${s.step} ${
    order.shippingStatus === "delivered"
      ? s.active
      : ""
  }`}
>
                <div className={s.stepCircle}>✓</div>
                <div className={s.stepLabel}>Entregue</div>
              </div>

            </div>
{(order.carrier || order.trackingCode || order.shippingStatus) && (

  <div
    className={s.address}
    style={{ marginTop: 20 }}
  >

    <div className={s.addressTitle}>
      🚚 Informações da entrega
    </div>

    <div className={s.addressText}>

      <strong>Transportadora:</strong>{" "}
      {order.carrier}

      <br />
      <br />

      <strong>Código de rastreio:</strong>{" "}
      {order.trackingCode || "-"}

      <br />
      <br />

      <strong>Status:</strong>{" "}

      {
        order.shippingStatus === "processing"
          ? "🟡 Preparando pedido"
          : order.shippingStatus === "shipped"
          ? "🚚 Pedido enviado"
          : order.shippingStatus === "delivered"
          ? "✅ Pedido entregue"
          : "-"
      }

      {order.trackingUrl && (

        <>

          <br />
          <br />

          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.detailsBtn}
            style={{
              display: "inline-block",
              textDecoration: "none"
            }}
          >
            📦 Rastrear Pedido
          </a>

        </>

      )}

    </div>

  </div>

)}

            {/* ENDEREÇO */}
            <div className={s.address}>
              <div className={s.addressTitle}>
                📍 Endereço de entrega
              </div>

              <div className={s.addressText}>
                {order.street || "-"},{" "}
                {order.number || "-"}
                <br />

                {order.neighborhood || "-"}
                <br />

                {order.city || "-"} -{" "}
                {order.state || "-"}
                <br />

                CEP: {order.cep || "-"}
              </div>
            </div>

            {/* ITENS */}
            <div className={s.items}>

              {(order.orderitem || []).map((item: any) => (

                <div
                  key={item.id}
                  className={s.productCard}
                >

                  {/* IMAGEM */}
                  <div className={s.productImage}>

                    <img
                      src={
  item.imageUrl ||
  "/placeholder.png"
}
                      alt={item.name}
                    />

                  </div>

                  {/* INFO */}
                  <div className={s.productInfo}>

                    <div className={s.productName}>
                      {item.name}
                    </div>

                    <div className={s.productMeta}>
                      Quantidade: {item.qty}
                    </div>

                  </div>

                  {/* PREÇO */}
                  <div className={s.productPrice}>
                    {(item.priceCents / 100).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )}
                  </div>

                </div>

              ))}

            </div>

          </div>
        ))}
      </div>
    </div>
  );
}