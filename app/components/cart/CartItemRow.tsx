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
  const unitPrice = item.product.priceCents / 100;
  const totalPrice = unitPrice * item.qty;

  return (
    <article className={s.productCard}>
      {/* FOTO */}
      <Link href={`/produto/${item.product.slug}`} className={s.productImage}>
        <img
          src={item.product.images?.[0]?.url || "/produtos/placeholder.jpg"}
          alt={item.product.name}
        />
      </Link>


      <div className={s.productBrand}>
    Intelbras
</div>

<div className={s.productSku}>
    SKU: {item.product.sku}
</div>

<div className={s.productBadges}>

    <span className={s.badgeGreen}>
        ✔ Produto Original
    </span>

    <span className={s.badgeBlue}>
        📦 Em estoque
    </span>

</div>

      {/* INFORMAÇÕES */}
      <div className={s.productInfo}>
        <div>
          <Link
            href={`/produto/${item.product.slug}`}
            className={s.productName}
          >
            {item.product.name}
          </Link>

          <div className={s.productBrand}>
            Intelbras
          </div>

          <div className={s.productSku}>
            SKU: {item.product.sku}
          </div>

          <div className={s.productBadges}>
            <span className={s.badgeGreen}>
              ✔ Produto Original
            </span>

            <span className={s.badgeBlue}>
              🚚 Em estoque
            </span>
          </div>
        </div>

        <div className={s.productBottom}>
          <div className={s.quantityBox}>
            <button
              onClick={() => onUpdateQty(item.id, item.qty - 1)}
            >
              −
            </button>

            <span>{item.qty}</span>

            <button
              onClick={() => onUpdateQty(item.id, item.qty + 1)}
            >
              +
            </button>
          </div>

          <button
            className={s.removeButton}
            onClick={() => onRemove(item.id)}
          >
            🗑 Remover
          </button>
        </div>
      </div>

      {/* PREÇO */}
      <div className={s.productPrice}>

<div className={s.priceLabel}>
Preço total
</div>

<div className={s.priceValue}>
R$ {totalPrice.toFixed(2)}
</div>

<div className={s.unitValue}>
R$ {unitPrice.toFixed(2)} / unidade
</div>

</div>
    </article>
  );
}