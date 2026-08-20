"use client";

import { useState } from "react";
import Link from "next/link";
import s from "@/app/styles/carinho.module.css";
import type { CartItem } from "@/app/types/cart";

type Props = {
  item: CartItem;
  onUpdateQty: (id: number, qty: number) => void | Promise<void>;
  onRemove: (id: number) => void | Promise<void>;
};

export function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
}: Props) {
  const [processing, setProcessing] = useState(false);

  const inStock = item.product.stock > 0;

  async function handleUpdateQty(qty: number) {
    if (processing) return;

    setProcessing(true);

    try {
      await onUpdateQty(item.id, qty);
    } finally {
      setProcessing(false);
    }
  }

  async function handleRemove() {
    if (processing) return;

    setProcessing(true);

    try {
      await onRemove(item.id);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={s.productCard}>

      <Link
        href={`/produto/${item.product.slug}`}
        className={s.productImage}
      >
        <img
          src={
            item.product.images?.[0]?.url ||
            "/produtos/placeholder.jpg"
          }
          alt={item.product.name}
        />
      </Link>

      <div className={s.productInfo}>
        <div>
          <Link
            href={`/produto/${item.product.slug}`}
            className={s.productName}
          >
            {item.product.name}
          </Link>

          <p className={s.productSku}>
            SKU: {item.product.sku}
          </p>

          <div className={s.productBadges}>
            <span className={s.badgeGreen}>
              ✓ Produto Original
            </span>

            <span className={s.badgeBlue}>
              {inStock ? "Em estoque" : "Sem estoque"}
            </span>
          </div>
        </div>

        <div className={s.quantityBox}>
          <button
            type="button"
            disabled={processing}
            onClick={() =>
              handleUpdateQty(item.qty - 1)
            }
          >
            -
          </button>

          <span>{item.qty}</span>

          <button
            type="button"
            disabled={processing}
            onClick={() =>
              handleUpdateQty(item.qty + 1)
            }
          >
            +
          </button>
        </div>
      </div>

      <div className={s.priceArea}>
        <div>
          <div className={s.priceLabel}>
            Preço total
          </div>

          <div className={s.priceValue}>
            R${" "}
            {(
              (item.product.priceCents / 100) *
              item.qty
            ).toFixed(2)}
          </div>

          <div className={s.unitValue}>
            R${" "}
            {(item.product.priceCents / 100).toFixed(2)}
            {" / unidade"}
          </div>
        </div>

        <button
          type="button"
          disabled={processing}
          onClick={handleRemove}
          className={s.removeButton}
        >
          🗑 Remover
        </button>
      </div>

    </div>
  );
}