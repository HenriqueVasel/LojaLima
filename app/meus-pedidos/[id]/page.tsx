"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ROUTES } from "@/routes/routes";
import { useEffect, useState } from "react";

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function statusLabel(s: string) {
  if (s === "pending") return "Pendente";
  if (s === "paid") return "Pago";
  if (s === "shipped") return "Enviado";
  if (s === "completed") return "Entregue";
  return s;
}

function paymentLabel(method?: string) {
  if (!method) return "—";
  if (method === "pix") return "PIX";
  if (method === "cartao") return "Cartão";
  if (method === "boleto") return "Boleto";
  if (method === "whatsapp") return "WhatsApp (Projeto)";
  return method;
}

export default function PedidoDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";



const [order, setOrder] = useState<any>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadOrder() {
    try {

      const res = await fetch(`/api/orders/${id}`, {
  credentials: "include",
});

      

      const data = await res.json();

      setOrder(data);

    } catch (error) {
      console.log("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  loadOrder();
}, [id]);

if (loading) {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", color: "#fff" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "46px 20px 70px" }}>
        <h1 style={{ fontSize: 32 }}>Carregando pedido...</h1>
      </div>
    </div>
  );
}

if (!order) { 
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", color: "#fff" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "46px 20px 70px" }}>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0 }}>
          Pedido não encontrado
        </h1>

        <p style={{ opacity: 0.75, marginTop: 10, lineHeight: 1.5 }}>
          Esse pedido não foi encontrado no sistema ou o link está incorreto.
        </p>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href={ROUTES.meusPedidos}
            style={{
              display: "inline-flex",
              padding: "10px 12px",
              borderRadius: 12,
              textDecoration: "none",
              color: "#0b0b0b",
              background: "#fff",
              fontWeight: 900,
            }}
          >
            Voltar para Meus pedidos
          </Link>

          <Link
            href={ROUTES.home}
            style={{
              display: "inline-flex",
              padding: "10px 12px",
              borderRadius: 12,
              textDecoration: "none",
              color: "#fff",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontWeight: 900,
            }}
          >
            Ir para Home
          </Link>
        </div>
      </div>
    </div>
  );
}

  // ✅ seu número (55 + DDD + número, sem espaços)
  const PHONE = "554738423235";

  // monta mensagem pra WhatsApp (útil pra compra e projeto)
  const msgLines: string[] = [];
  msgLines.push(`Olá! Quero falar sobre o pedido #${order.id.slice(0, 8)}.`);
  msgLines.push(`Tipo: ${order.mode === "projeto" ? "Projeto / Instalação" : "Compra direta"}`);
  msgLines.push(`Total: ${money(order.total)}`);
  msgLines.push(`Cliente: ${order.customerName} | ${order.customerWhats}`);
  if (order.customer?.email) msgLines.push(`Email: ${order.customer.email}`);
  if (order.customer?.obs) msgLines.push(`Obs: ${order.customer.obs}`);
  msgLines.push(``);
  msgLines.push(`Itens:`);
  (order.items || []).forEach((it: any) => {
  msgLines.push(`- ${it.nome} (Qtd: ${it.qty}) - ${money(it.preco * it.qty)}`);
});
  const waUrl = `https://wa.me/${PHONE}?text=${encodeURIComponent(msgLines.join("\n"))}`;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", color: "#fff" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "46px 20px 70px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0 }}>
              Pedido #{order.id.slice(0, 8)}
            </h1>
            <p style={{ opacity: 0.75, marginTop: 10, lineHeight: 1.5 }}>
              {order.mode === "projeto"
                ? "Projeto/Instalação: este pedido abre atendimento via WhatsApp."
                : "Compra direta: este pedido é do fluxo normal da loja (sem WhatsApp obrigatório)."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Link
              href={ROUTES.meusPedidos}
              style={{
                display: "inline-flex",
                padding: "10px 12px",
                borderRadius: 12,
                textDecoration: "none",
                color: "#0b0b0b",
                background: "#fff",
                fontWeight: 900,
                height: 42,
                alignItems: "center",
              }}
            >
              Voltar
            </Link>

            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                padding: "10px 14px",
                borderRadius: 12,
                textDecoration: "none",
                background: "#00a94f",
                color: "#0b0b0b",
                fontWeight: 900,
                height: 42,
                alignItems: "center",
                boxShadow: "0 10px 24px rgba(0,169,79,0.22)",
              }}
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>

        {/* cards */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* resumo */}
          <div
            style={{
              borderRadius: 18,
              padding: 18,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Resumo</div>

            <div style={{ display: "grid", gap: 8, opacity: 0.9 }}>
              <div>
                <b>Data:</b> {formatDate(order.createdAt)}
              </div>
              <div>
                <b>Status:</b> {statusLabel(order.status)}
              </div>
              <div>
                <b>Tipo:</b> {order.mode === "projeto" ? "Projeto / Instalação" : "Compra direta"}
              </div>
              <div>
                <b>Pagamento:</b> {paymentLabel((order as any).paymentMethod)}
              </div>
              <div style={{ marginTop: 6, fontWeight: 900, fontSize: 22 }}>
                Total: {money(order.totalCents / 100)}
              </div>
            </div>
          </div>

          {/* cliente */}
          <div
            style={{
              borderRadius: 18,
              padding: 18,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Cliente</div>

            <div style={{ display: "grid", gap: 8, opacity: 0.9, lineHeight: 1.45 }}>
              <div>
  <b>Nome:</b> {order.customerName || "-"}
</div>

<div>
  <b>WhatsApp:</b> {order.customerWhats || "-"}
</div>

<div>
  <b>E-mail:</b> {order.customerEmail || "—"}
</div>

<div>
  <b>Observações:</b> {order.customerObs || "—"}
</div>
            </div>
          </div>
        </div>

        {/* itens */}
        <div
          style={{
            marginTop: 12,
            borderRadius: 18,
            padding: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>Itens</div>

          <div style={{ display: "grid", gap: 10 }}>

        {(order.items || []).map((it: any) => (
          <div
            key={it.slug}
            style={{
            display: "grid",
            gridTemplateColumns: "56px 1fr auto",
            gap: 12,
            alignItems: "center",
            padding: 12,
            borderRadius: 16,
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <img
                    src={it.imagem || "/produtos/placeholder.jpg"}
                    alt={it.nome}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900 }}>{it.nome}</div>
                  <div style={{ opacity: 0.72, fontSize: 13 }}>
                    Qtd: {it.qty} • Unit: {money(it.preco)}
                  </div>
                </div>

                <div style={{ fontWeight: 900 }}>{money(it.preco * it.qty)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* responsivo */}
        <style>{`
          @media (max-width: 980px) {
            div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
