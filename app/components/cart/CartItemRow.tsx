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
  const inStock = item.product.stock > 0;

  return (
    <div className={s.productCard}>

      <Link href={`/produto/${item.product.slug}`} className={s.productImage}>
        <img
          src={item.product.images?.[0]?.url || "/produtos/placeholder.jpg"}
          alt={item.product.name}
        />
      </Link>

      <div className={s.productInfo}>
        <div>
          <Link href={`/produto/${item.product.slug}`} className={s.productName}>
            {item.product.name}
          </Link>

          <p className={s.productSku}>SKU: {item.product.sku}</p>

          <div className={s.productBadges}>
            {/* OBS: "Produto Original" é estático — não existe campo
                equivalente no CartProduct hoje. Troque por um campo
                real (ex: item.product.isOriginal) se o backend expuser isso. */}
            <span className={s.badgeGreen}>✓ Produto Original</span>

            <span className={s.badgeBlue}>
              {inStock ? "Em estoque" : "Sem estoque"}
            </span>
          </div>
        </div>

        <div className={s.quantityBox}>
          <button onClick={() => onUpdateQty(item.id, item.qty - 1)}>-</button>
          <span>{item.qty}</span>
          <button onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
        </div>
      </div>

      <div className={s.priceArea}>
        <div>
          <div className={s.priceLabel}>Preço total</div>
          <div className={s.priceValue}>
            R$ {((item.product.priceCents / 100) * item.qty).toFixed(2)}
          </div>
          <div className={s.unitValue}>
            R$ {(item.product.priceCents / 100).toFixed(2)} / unidade
          </div>
        </div>

        <button onClick={() => onRemove(item.id)} className={s.removeButton}>
          🗑 Remover
        </button>
      </div>

    </div>
  );
}