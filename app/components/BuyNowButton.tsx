"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import s from "@/app/styles/product.module.css";

type Props = {
  productId: number;
  variantId?: number;
};

export default function BuyNowButton({
  productId,
  variantId,
}: Props) {

  const router = useRouter();

  async function handleBuyNow() {

    try {

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
          variantId,
          qty: 1,
        }),
      });

      const data = await res.json();

if (res.status === 401) {

  localStorage.setItem(
    "guestCart",
    JSON.stringify({
      productId,
      variantId,
      qty: 1,
    })
  );

  toast.success("Produto adicionado! Finalize a compra no carrinho.");

  router.push("/carrinho");

  return;
}

      if (!res.ok) {

        toast.error(
          data.error || "Erro ao comprar"
        );

        return;
      }

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      router.push("/carrinho");

    } catch {

      toast.error("Erro inesperado");

    }
  }

  return (
  <button
    onClick={handleBuyNow}
    className={s.buyNow}
  >
    COMPRAR AGORA
  </button>
);
}