"use client";

import Link from "next/link";
import s from "@/app/styles/carinho.module.css";

type Props = {
  productsSlot: React.ReactNode;
  summarySlot: React.ReactNode;
};

export function CartLayout({ productsSlot, summarySlot }: Props) {
  return (
    <div className={s.page}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Carrinho de Compras</h1>
          <p className={s.subtitle}>
            Revise seus produtos antes de finalizar o pedido.
          </p>
        </div>

        {/* OBS: link estático, sem lógica associada. Ajuste o href
            para a rota real do seu catálogo se não for "/". */}
        <Link href="/" className={s.backShopping}>
          ← Continuar comprando
        </Link>
      </div>

      <div className={s.grid}>
        <div className={s.left}>{productsSlot}</div>
        {summarySlot}
      </div>
    </div>
  );
}