"use client";

import { useEffect, useState } from "react";

export default function RastreioPage() {

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [senha, setSenha] = useState("");
const [liberado, setLiberado] = useState(false);

useEffect(() => {

  carregarPedidos();

}, []);


async function entrar() {

  try {

    const res = await fetch("/api/admin/login-import", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        password: senha
      })

    });

    const data = await res.json();

    if (!res.ok) {

      alert(data.error || "Senha incorreta.");

      return;

    }

    setLiberado(true);

  } catch {

    alert("Erro ao autenticar.");

  }

}

async function salvarPedido(orderId: string) {

  const carrier = (
    document.getElementById(
      `carrier-${orderId}`
    ) as HTMLInputElement
  ).value;

  const trackingCode = (
    document.getElementById(
      `tracking-${orderId}`
    ) as HTMLInputElement
  ).value;

  const trackingUrl = (
    document.getElementById(
      `url-${orderId}`
    ) as HTMLInputElement
  ).value;

  const shippingStatus = (
    document.getElementById(
      `status-${orderId}`
    ) as HTMLSelectElement
  ).value;

  const res = await fetch(
    "/api/admin/orders/update",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderId,
        carrier,
        trackingCode,
        trackingUrl,
        shippingStatus
      })
    }
  );

  const data = await res.json();

  if (!res.ok) {

    alert(data.error);

    return;

  }

  alert("Pedido atualizado!");

  carregarPedidos();

}

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

  if (!liberado) {

  return (

    <div
      style={{
        maxWidth:400,
        margin:"120px auto",
        background:"#111827",
        padding:30,
        borderRadius:12,
        color:"#fff"
      }}
    >

      <h2>Área Administrativa</h2>

      <p
        style={{
          opacity:.7,
          marginBottom:20
        }}
      >
        Digite a senha para acessar.
      </p>

      <input

        type="password"

        value={senha}

        onChange={(e)=>
          setSenha(e.target.value)
        }

        placeholder="Senha"

        style={{
          width:"100%",
          height:45,
          borderRadius:8,
          border:"1px solid #444",
          background:"#1f2937",
          color:"#fff",
          padding:"0 12px"
        }}

      />

      <button

        onClick={entrar}

        style={{
          marginTop:20,
          width:"100%",
          height:45,
          background:"#00c853",
          color:"#fff",
          border:0,
          borderRadius:8,
          cursor:"pointer",
          fontWeight:700
        }}

      >

        Entrar

      </button>

    </div>

  );

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

  <button

  onClick={() => salvarPedido(pedido.id)}

  style={{

    marginTop:20,

    width:"100%",

    height:45,

    background:"#00c853",

    border:0,

    borderRadius:8,

    color:"#fff",

    cursor:"pointer",

    fontWeight:700

  }}

>

  Salvar Alterações

</button>

</div>

        </div>

      ))}

    </div>

  );

}