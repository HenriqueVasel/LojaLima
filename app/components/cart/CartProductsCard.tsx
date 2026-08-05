"use client";

import s from "@/app/styles/carinho.module.css";
import type { CartItem } from "@/app/types/cart";
import { CartItemRow } from "./CartItemRow";

type Props = {
  items: CartItem[];
  onUpdateQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
};

export function CartProductsCard({ items, onUpdateQty, onRemove }: Props) {
  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div>
          <div className={s.cardTitle}>Produtos no carrinho</div>
          <p className={s.cardSubtitle}>
            {items.length} {items.length === 1 ? "item adicionado" : "itens adicionados"}
          </p>
        </div>
      </div>

      <div className={s.products}>
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQty={onUpdateQty}
            onRemove={onRemove}
          />
        ))}

        {items.length === 0 && (
          <p className={s.emptyCart}>Seu carrinho está vazio</p>
        )}
      </div>
    </div>
  );
}