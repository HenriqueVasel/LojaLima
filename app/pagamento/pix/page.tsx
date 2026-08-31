"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Copy,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import s from "@/app/styles/pix.module.css";

export default function PixPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const savedPix = sessionStorage.getItem("pixPayment");

    if (!savedPix) {
      router.push("/carrinho");
      return;
    }

    try {
      setPixData(JSON.parse(savedPix));
    } catch {
      router.push("/carrinho");
    }
  }, [router]);

  // 🔄 Verifica automaticamente o status do pedido
  useEffect(() => {
    if (!orderId) return;

    const checkPayment = async () => {
      try {
        setChecking(true);

        const res = await fetch(
          `/api/order-status?orderId=${orderId}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "paid") {
          sessionStorage.removeItem("pixPayment");

          toast.success("Pagamento confirmado! 🎉");

          router.push(
            `/pagamento/retorno?orderId=${orderId}`
          );
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      } finally {
        setChecking(false);
      }
    };

    // verifica imediatamente
    checkPayment();

    // verifica a cada 3 segundos
    const interval = setInterval(
      checkPayment,
      3000
    );

    return () => clearInterval(interval);
  }, [orderId, router]);

  async function copiarPix() {
    if (!pixData?.qr_code) {
      toast.error("Código PIX não encontrado.");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        pixData.qr_code
      );

      setCopied(true);

      toast.success("Código PIX copiado!");

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  }

  if (!pixData) {
    return (
      <div className={s.page}>
        <div className={s.loading}>
          <Clock size={32} />
          <p>Carregando pagamento PIX...</p>
        </div>
      </div>
    );
  }

  const total =
    pixData.totalCents
      ? (pixData.totalCents / 100).toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL",
          }
        )
      : "";

  return (
    <main className={s.page}>
      <div className={s.container}>

        {/* VOLTAR */}
        <button
          className={s.backButton}
          onClick={() => router.push("/carrinho")}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        {/* CARD PRINCIPAL */}
        <section className={s.card}>

          {/* HEADER */}
          <div className={s.header}>
            <div className={s.icon}>
              <QrCode size={32} />
            </div>

            <div>
              <h1>Pagamento via PIX</h1>

              <p>
                Escaneie o QR Code ou copie o código PIX
                para realizar o pagamento.
              </p>
            </div>
          </div>

          {/* VALOR */}
          <div className={s.priceBox}>
            <span>Total a pagar</span>

            <strong>{total}</strong>

            <div className={s.discount}>
              <CheckCircle2 size={16} />
              Desconto PIX aplicado
            </div>
          </div>

          {/* QR CODE */}
          <div className={s.qrSection}>

            <p className={s.qrTitle}>
              Escaneie o QR Code
            </p>

            {pixData.qr_code_base64 ? (
              <div className={s.qrBox}>
                <img
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="QR Code PIX"
                  className={s.qrCode}
                />
              </div>
            ) : (
              <div className={s.qrFallback}>
                <QrCode size={80} />

                <p>
                  QR Code indisponível.
                  Use o código PIX abaixo.
                </p>
              </div>
            )}

          </div>

          {/* DIVISOR */}
          <div className={s.divider}>
            <span>ou</span>
          </div>

          {/* COPIA E COLA */}
          <div className={s.copySection}>

            <p className={s.copyTitle}>
              PIX Copia e Cola
            </p>

            <div className={s.pixCode}>
              <span>
                {pixData.qr_code}
              </span>
            </div>

            <button
              className={`${s.copyButton} ${
                copied ? s.copied : ""
              }`}
              onClick={copiarPix}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={19} />
                  Código copiado!
                </>
              ) : (
                <>
                  <Copy size={19} />
                  Copiar código PIX
                </>
              )}
            </button>

          </div>

          {/* STATUS */}
          <div className={s.statusBox}>

            <div className={s.statusIcon}>
              <Clock size={20} />
            </div>

            <div>
              <strong>
                Aguardando pagamento
              </strong>

              <p>
                Assim que identificarmos o pagamento,
                seu pedido será confirmado automaticamente.
              </p>
            </div>

          </div>

          {/* SEGURANÇA */}
          <div className={s.security}>
            <ShieldCheck size={18} />

            <span>
              Pagamento seguro processado pelo Mercado Pago
            </span>
          </div>

          {/* CHECK */}
          {checking && (
            <p className={s.checking}>
              Verificando pagamento...
            </p>
          )}

        </section>
      </div>
    </main>
  );
}