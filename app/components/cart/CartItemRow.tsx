"use client";

import Link from "next/link";
import s from "@/app/styles/carinho.module.css";
import type { CartItem } from "@/app/types/cart";

type Props = {
  item: CartItem;
  onUpdateQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
};

export function CartItemRow({ item, onUpdateQty, onRemove }: Props) {
  return (
    <div className={s.product}>
      <Link href={`/produto/${item.product.slug}`} className={s.image}>
        <img
          src={item.product.images?.[0]?.url || "/produtos/placeholder.jpg"}
          alt={item.product.name}
        />
      </Link>

      <div className={s.info}>
        <div>
          <Link href={`/produto/${item.product.slug}`} className={s.nameLink}>
            <h3 className={s.name}>{item.product.name}</h3>
          </Link>

          <p className={s.unitPrice}>
            R$ {(item.product.priceCents / 100).toFixed(2)} / unidade
          </p>
        </div>

        <div className={s.quantity}>
          <button
            onClick={() => onUpdateQty(item.id, item.qty - 1)}
            className={s.qtyBtn}
          >
            -
          </button>

          <span className={s.qtyValue}>{item.qty}</span>

          <button
            onClick={() => onUpdateQty(item.id, item.qty + 1)}
            className={s.qtyBtn}
          >
            +
          </button>
        </div>
      </div>

      <div className={s.priceArea}>
        <div className={s.price}>
          R$ {((item.product.priceCents / 100) * item.qty).toFixed(2)}
        </div>

        <button onClick={() => onRemove(item.id)} className={s.remove}>
          Remover
        </button>
      </div>
    </div>
  );
}