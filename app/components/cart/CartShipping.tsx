"use client";

import s from "@/app/styles/carinho.module.css";
import FreteCalculator from "@/app/components/FreteCalculator";
import type { CartItem } from "@/app/types/cart";

type Props = {
  items: CartItem[];
};

export function CartShipping({ items }: Props) {
  return (
    <div className={s.freteWrapper}>
      <FreteCalculator saveToCart items={items} />
    </div>
  );
}