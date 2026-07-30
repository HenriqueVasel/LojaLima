"use client";

import { Wrench, MessageCircle } from "lucide-react";
import { sendGAEvent } from "@next/third-parties/google";
import s from "@/app/styles/InstallationCard.module.css";

interface Props {
  productId: number;
  productName: string;
  productSlug: string;
}

const PHONE = "554738423235";

export default function InstallationCard({
  productId,
  productName,
  productSlug,
}: Props) {
  const handleClick = () => {
    sendGAEvent("event", "product_installation_click", {
      product_id: productId,
      product_name: productName,
    });

    const message = `Olá! 👋

Tenho interesse neste produto:

📦 ${productName}

🔗 https://lojalimaelima.com.br/produto/${productSlug}

Gostaria de solicitar um orçamento para a instalação desse equipamento.`;

    window.open(
      `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <div className={s.card}>
      <div className={s.icon}>
        <Wrench size={22} />
      </div>

      <div className={s.content}>
        <h3>Precisa da instalação?</h3>

        <p>
          Nossa equipe instala e configura este equipamento para você.
        </p>
      </div>

      <button onClick={handleClick} className={s.button}>
        <MessageCircle size={18} />
        Solicitar orçamento
      </button>
    </div>
  );
}