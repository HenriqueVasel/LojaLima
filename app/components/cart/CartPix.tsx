"use client";

import s from "@/app/styles/carinho.module.css";

type Props = {
  hasKit: boolean;
  total: number;
  discount: number;
  frete: number;
};

export function CartPix({ hasKit, total, discount, frete }: Props) {
  const pixValue = hasKit
    ? total + frete / 100
    : (total - discount) * 0.95 + frete / 100;

  return (
    <div className={s.pixCard}>
      <div className={s.pixLabel}>
        {hasKit ? "Pagamento à vista" : "À vista no PIX"}
      </div>

      <div className={s.pixValue}>R$ {pixValue.toFixed(2)}</div>

      <div className={s.pixNote}>
        {hasKit
          ? "Pagamento sem desconto adicional"
          : "Economia instantânea de 5%"}
      </div>
    </div>
  );
}