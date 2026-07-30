"use client";

import { ChevronRight, Wrench } from "lucide-react";
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

const message = `Olá!

Tenho interesse em adquirir o seguinte equipamento com instalação:

Produto: ${productName}

Link:
https://lojalimaelima.com.br/produto/${productSlug}

Gostaria de receber um orçamento contendo:

• Valor do equipamento;
• Valor da instalação;
• Prazo para instalação.


Obrigado!`;

    window.open(
      `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <div className={s.card}>
      <div className={s.header}>
        <Wrench size={18} />

        <span>Equipamento + Instalação</span>
      </div>

      <p>
  Adquira este equipamento com instalação profissional realizada por nossa equipe.
</p>

      <button
        type="button"
        onClick={handleClick}
        className={s.link}
      >
        Solicitar orçamento
        <ChevronRight size={16} />
      </button>
    </div>
  );
}