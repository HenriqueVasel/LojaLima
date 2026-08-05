"use client";

import s from "@/app/styles/carinho.module.css";
import type { CartItem } from "@/app/types/cart";
import { CartCoupon } from "./CartCoupon";
import { CartShipping } from "./CartShipping";
import { CartTotals } from "./CartTotals";
import { CartPix } from "./CartPix";
import { CartCheckoutButton } from "./CartCheckoutButton";
import { CartPerks } from "./CartPerks";
import { CartSecureBox } from "./CartSecureBox";

type Props = {
  items: CartItem[];
  coupon: string;
  setCoupon: (v: string) => void;
  aplicarCupom: () => void;
  couponLoading: boolean;
  discount: number;
  couponCode: string;
  total: number;
  totalFinal: number;
  hasKit: boolean;
  frete: number;
  onCheckout: () => void;
};

export function CartSummaryCard({
  items,
  coupon,
  setCoupon,
  aplicarCupom,
  couponLoading,
  discount,
  couponCode,
  total,
  totalFinal,
  hasKit,
  frete,
  onCheckout,
}: Props) {
  return (
    <div className={s.summary}>
      <div className={s.summaryCard}>
        <div className={s.summaryHeader}>
          <h2>Resumo do Pedido</h2>
        </div>

        <div className={s.summaryContent}>
          <CartCoupon
            coupon={coupon}
            setCoupon={setCoupon}
            onApply={aplicarCupom}
            loading={couponLoading}
            discount={discount}
            couponCode={couponCode}
          />

          <CartShipping items={items} />

          <CartTotals total={total} discount={discount} totalFinal={totalFinal} />

          <CartPix hasKit={hasKit} total={total} discount={discount} frete={frete} />

          <CartCheckoutButton disabled={items.length === 0} onClick={onCheckout} />

          <CartPerks />

          <CartSecureBox />
        </div>
      </div>
    </div>
  );
}