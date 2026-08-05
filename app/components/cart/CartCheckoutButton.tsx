"use client";

import s from "@/app/styles/carinho.module.css";

type Props = {
  disabled: boolean;
  onClick: () => void;
};

export function CartCheckoutButton({ disabled, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={disabled ? `${s.checkoutBtn} ${s.checkoutBtnDisabled}` : s.checkoutBtn}
    >
      Finalizar compra
    </button>
  );
}