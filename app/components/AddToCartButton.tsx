"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { sendGAEvent } from "@next/third-parties/google";

type Props = {
  productId: number;
  productName: string;
  productPrice: number;
  productSlug: string;
  productImage: string;
  stock: number;
  variantId?: number;
};
export default function AddToCartButton({
  productId,
  productName,
  productPrice,
  productSlug,
  productImage,
  stock,
  variantId,
}: Props) {

  const router = useRouter();

  async function handleAdd() {

    if (stock <= 0) {
  toast.error("Produto sem estoque.");
  return;
}

    const retirada =
      sessionStorage.getItem("retiradaLoja") === "true";

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

      // 🔴 NÃO LOGADO
if (res.status === 401) {

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

 const index = cart.findIndex(
  (item: any) =>
    item.productId === productId &&
    item.variantId === (variantId ?? null)
);

  if (index >= 0) {

    cart[index].qty += 1;

  } else {

    cart.push({
  id: -(cart.length + 1),
  productId,
  variantId: variantId ?? null,
  qty: 1,
});

  }

localStorage.setItem("cart", JSON.stringify(cart));

window.dispatchEvent(new Event("cartUpdated"));

toast.success("Produto adicionado ao carrinho!");

return;
}
      // 🔴 ERRO
      if (!res.ok) {

        toast.error(
          data.error ||
          "Erro ao adicionar ao carrinho"
        );

        return;
      }

      // 🟢 SUCESSO
      window.dispatchEvent(
        new Event("cartUpdated")
      );

      console.log("ADD_TO_CART DISPARADO");
      console.log("GTAG EXISTE?", typeof window.gtag);

      // Google Analytics
      window.gtag?.("event", "add_to_cart", {
  debug_mode: true,
  currency: "BRL",
  value: productPrice,
  items: [
    {
      item_id: String(productId),
      item_name: productName,
      price: productPrice,
      quantity: 1,
    },
  ],
});

      // Facebook Pixel
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "AddToCart", {
          content_ids: [productId],
          content_name: productName,
          value: productPrice,
          currency: "BRL",
        });
      }

      toast.success("Adicionado ao carrinho!");

    } catch (error) {

      console.error(error);

      toast.error("Erro inesperado");

    }
  }

 return (
<button
  disabled={stock <= 0}
  type="button"
  onClick={handleAdd}
  style={{
    width: "100%",
    height: "56px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    transition: ".2s",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "#15803d";
    e.currentTarget.style.transform = "translateY(-2px)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "#16a34a";
    e.currentTarget.style.transform = "translateY(0)";
  }}
>
  {stock <= 0
  ? "PRODUTO SEM ESTOQUE"
  : "🛒 ADICIONAR AO CARRINHO"}
</button>
);
}