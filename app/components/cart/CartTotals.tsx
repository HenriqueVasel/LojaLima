"use client";

import s from "@/app/styles/carinho.module.css";

type Props = {
  total: number;
  discount: number;
  totalFinal: number;
};

export function CartTotals({ total, discount, totalFinal }: Props) {
  return (
    <>
      <div className={s.summaryRow}>
        <span>Subtotal</span>
        <span className={s.summaryRowValue}>R$ {total.toFixed(2)}</span>
      </div>

      {discount > 0 && (
        <div className={s.summaryRowDiscount}>
          <span>Desconto</span>
          <span>-R$ {discount.toFixed(2)}</span>
        </div>
      )}

      <div className={s.totalRow}>
        <div className={s.totalLabel}>Total</div>
        <div className={s.totalValue}>R$ {totalFinal.toFixed(2)}</div>
      </div>
    </>
  );
}