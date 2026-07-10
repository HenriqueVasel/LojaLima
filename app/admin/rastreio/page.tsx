"use client";

import { useEffect, useState } from "react";

export default function RastreioPage() {

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    carregarPedidos();

  }, []);

  async function carregarPedidos() {

    try {

      const res = await fetch("/api/admin/orders");

      const data = await res.json();

      setOrders(data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (
      <div style={{ padding: 40 }}>
        Carregando...
      </div>
    );

  }

  return (

    <div
      style={{
        maxWidth: 1200,
        margin: "40px auto",
        color: "#fff"
      }}
    >

      <h1
        style={{
          marginBottom: 30
        }}
      >
        Pedidos
      </h1>

      {orders.map((pedido) => (

        <div
          key={pedido.id}
          style={{
            background: "#1f2937",
            padding: 20,
            borderRadius: 10,
            marginBottom: 15
          }}
        >

          <h3>Pedido #{pedido.id}</h3>

          <p>
            <strong>Cliente:</strong> {pedido.customerName}
          </p>

          <p>
            <strong>Email:</strong> {pedido.customerEmail}
          </p>

          <p>
            <strong>Status:</strong> {pedido.status}
          </p>

          <p>
            <strong>Envio:</strong> {pedido.shippingStatus ?? "processing"}
          </p>

          <p>
            <strong>Transportadora:</strong> {pedido.carrier ?? "-"}
          </p>

          <p>
            <strong>Rastreio:</strong> {pedido.trackingCode ?? "-"}
          </p>

        </div>

      ))}

    </div>

  );

}