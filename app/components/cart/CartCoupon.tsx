"use client";

import s from "@/app/styles/carinho.module.css";

type Props = {
  coupon: string;
  setCoupon: (value: string) => void;
  onApply: () => void;
  loading: boolean;
  discount: number;
  couponCode: string;
};

export function CartCoupon({
  coupon,
  setCoupon,
  onApply,
  loading,
  discount,
  couponCode,
}: Props) {
  return (
    <div className={s.couponBox}>
      <div className={s.couponRow}>
        <input
          type="text"
          placeholder="Cupom"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          className={s.couponInput}
        />

        <button onClick={onApply} disabled={loading} className={s.couponButton}>
          {loading ? "..." : "Aplicar"}
        </button>
      </div>

      {discount > 0 && (
        <div className={s.couponApplied}>
          Cupom {couponCode} aplicado (-R$ {discount.toFixed(2)})
        </div>
      )}

      {couponCode === "WIFI25" && discount > 0 && (
        <div className={s.wifiBanner}>
          🎉 Este produto já está com a condição promocional máxima disponível.
        </div>
      )}
    </div>
  );
}