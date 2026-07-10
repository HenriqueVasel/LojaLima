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

       <div style={{ marginTop: 15 }}>

  <label>Transportadora</label>

  <input
    defaultValue={pedido.carrier ?? ""}
    id={`carrier-${pedido.id}`}
    style={{
      width: "100%",
      height: 40,
      marginTop: 5,
      marginBottom: 15,
      borderRadius: 8,
      border: "1px solid #444",
      background: "#111827",
      color: "#fff",
      padding: "0 10px"
    }}
  />

  <label>Código de rastreio</label>

  <input
    defaultValue={pedido.trackingCode ?? ""}
    id={`tracking-${pedido.id}`}
    style={{
      width: "100%",
      height: 40,
      marginTop: 5,
      marginBottom: 15,
      borderRadius: 8,
      border: "1px solid #444",
      background: "#111827",
      color: "#fff",
      padding: "0 10px"
    }}
  />

  <label>Link do rastreio</label>

  <input
    defaultValue={pedido.trackingUrl ?? ""}
    id={`url-${pedido.id}`}
    style={{
      width: "100%",
      height: 40,
      marginTop: 5,
      marginBottom: 15,
      borderRadius: 8,
      border: "1px solid #444",
      background: "#111827",
      color: "#fff",
      padding: "0 10px"
    }}
  />

  <label>Status do envio</label>

  <select
    id={`status-${pedido.id}`}
    defaultValue={pedido.shippingStatus ?? "processing"}
    style={{
      width: "100%",
      height: 40,
      marginTop: 5,
      borderRadius: 8,
      border: "1px solid #444",
      background: "#111827",
      color: "#fff",
      padding: "0 10px"
    }}
  >
    <option value="processing">Processando</option>
    <option value="shipped">Enviado</option>
    <option value="delivered">Entregue</option>
  </select>

</div>

        </div>

      ))}

    </div>

  );

}