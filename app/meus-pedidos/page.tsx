"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/app/styles/meus-pedidos.module.css";

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
    order.status === "paid"
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