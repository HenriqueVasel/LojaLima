"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

export default function RetornoPagamento() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "paid" | "pending">("loading");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const purchaseSentRef = useRef(false);

  // 🔹 pega orderId
  useEffect(() => {
    const id = searchParams.get("orderId");
    if (id) setOrderId(id);
  }, [searchParams]);

  // 🔹 contador de tempo
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 🔹 verifica status
  useEffect(() => {
    if (!orderId) return;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/order-status?orderId=${orderId}`);

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          console.error("Erro na API");
          setStatus("pending");
          return;
        }

        const order = await res.json();
        console.log("ORDER:", order);

        if (order.status === "paid" || order.status === "approved") {
          console.log("STATUS PAGO");

  if (!purchaseSentRef.current) {

    console.log("ENTROU NO IF");

    purchaseSentRef.current = true;
    console.log("ENVIANDO PURCHASE");

    console.log("ENVIANDO PURCHASE");

console.log("gtag:", (window as any).gtag);
console.log("dataLayer:", (window as any).dataLayer);

(window as any).gtag?.("event", "purchase", {
  transaction_id: String(order.id),
  value: order.totalCents / 100,
  currency: "BRL",

  items: order.orderitem.map((item: any) => ({
    item_id: String(item.productId),
    item_name: item.name,
    price: item.priceCents / 100,
    quantity: item.qty,
  })),
});



if (typeof window !== "undefined" && (window as any).fbq) {
  (window as any).fbq("track", "Purchase", {
    value: order.totalCents / 100,
    currency: "BRL",
  });
}

console.log("ORDER RECEBIDA:", order);
  }

  setStatus("paid");

  if (intervalRef.current) {
    clearInterval(intervalRef.current);
  }
} else {
          setStatus("pending");
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
        setStatus("pending");
      }
    }

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId, router]);

  // 🔹 redirect após pagamento
  useEffect(() => {
    if (status === "paid") {
      setTimeout(() => {
        router.push("/meus-pedidos");
      }, 2500);
    }
  }, [status, router]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>

      {status === "loading" && (
        <p>🔄 Verificando pagamento...</p>
      )}

      {status === "pending" && (
        <>
          <h2>⏳ Aguardando pagamento...</h2>
          <p>Pague o PIX na outra aba. Esta tela atualizará automaticamente.</p>

          <br />

          <p>⏳ Confirmação geralmente leva até 10 segundos</p>
          <p>⏱️ Tempo aguardando: {seconds}s</p>

          {seconds > 10 && (
            <p style={{ color: "#ffaa00", marginTop: 10 }}>
              Isso está demorando um pouco mais que o normal...
            </p>
          )}

          <br />

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#00aa55",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Já paguei, atualizar
          </button>
        </>
      )}

      {status === "paid" && (
        <>
          <h2>✅ Pedido realizado com sucesso!</h2>
          <p>Pagamento confirmado 🎉</p>
          <p>Redirecionando...</p>
        </>
      )}

    </div>
  );
}