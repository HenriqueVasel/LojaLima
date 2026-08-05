"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/app/types/cart";
import { CartLayout } from "@/app/components/cart/CartLayout";
import { CartProductsCard } from "@/app/components/cart/CartProductsCard";
import { CartSummaryCard } from "@/app/components/cart/CartSummaryCard";

export default function CarrinhoPage() {

  const [items, setItems] = useState<CartItem[]>([]);

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [frete, setFrete] = useState(0);

  const hasKit = items.some(item => (item.product as any).isKit);

  useEffect(() => {

    sessionStorage.removeItem("freteCents");
    sessionStorage.removeItem("retiradaLoja");

    localStorage.removeItem("cep");
    localStorage.removeItem("numero");
    localStorage.removeItem("cidade");
    localStorage.removeItem("uf");
    localStorage.removeItem("logradouro");
    localStorage.removeItem("bairro");

    function updateFrete() {
      const saved = sessionStorage.getItem("freteCents");
      setFrete(Number(saved || 0));
    }

    updateFrete();

    window.addEventListener("freteUpdated", updateFrete);

    return () => {
      window.removeEventListener("freteUpdated", updateFrete);
    };

  }, []);

  async function fetchCart() {

    const res = await fetch("/api/cart", {
      credentials: "include",
    });

    if (res.status === 401) {

      setIsGuest(true);

      const guestCart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (guestCart.length === 0) {
        setItems([]);
        return;
      }

      const guestRes = await fetch("/api/cart/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestCart }),
      });

      const guestItems = await guestRes.json();

      setItems(guestItems);

      return;
    }

    setIsGuest(false);

    const data = await res.json();

    if (Array.isArray(data)) {
      setItems(data);
    } else {
      setItems([]);
    }
  }

  useEffect(() => {

    const savedCoupon = sessionStorage.getItem("coupon");

    if (savedCoupon) {
      const parsed = JSON.parse(savedCoupon);
      setCouponCode(parsed.code || "");
    }

  }, []);

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {

    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };

  }, []);

  async function removeItem(id: number) {

    const res = await fetch("/api/cart", {
      credentials: "include"
    });

    if (res.status === 401) {

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      const novoCarrinho = cart.filter((item: any) => item.id !== id);

      localStorage.setItem("cart", JSON.stringify(novoCarrinho));

      if (novoCarrinho.length === 0) {
        setItems([]);
      } else {

        const guestRes = await fetch("/api/cart/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestCart: novoCarrinho }),
        });

        const guestItems = await guestRes.json();

        setItems(guestItems);
      }

      window.dispatchEvent(new Event("cartUpdated"));

      return;
    }

    await fetch(`/api/cart/item/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    window.dispatchEvent(new Event("cartUpdated"));
  }

  async function updateQty(id: number, qty: number) {

    if (qty <= 0) {
      removeItem(id);
      return;
    }

    const item = items.find(i => i.id === id);

    console.log("ITEM DO CARRINHO:", item);

    if (!item) return;

    if (!item.product.isKit && qty > item.product.stock) {
      alert(
        `Apenas ${item.product.stock} unidade${item.product.stock !== 1 ? "s" : ""} disponível${item.product.stock !== 1 ? "is" : ""} em estoque.`
      );
      return;
    }

    if (isGuest) {

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      const index = cart.findIndex((item: any) => item.id === id);

      if (index >= 0) {

        cart[index].qty = qty;

        localStorage.setItem("cart", JSON.stringify(cart));

        const guestRes = await fetch("/api/cart/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestCart: cart }),
        });

        const guestItems = await guestRes.json();

        setItems(guestItems);

        window.dispatchEvent(new Event("cartUpdated"));
      }

      return;
    }

    const oldItems = items;

    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, qty } : item))
    );

    const res = await fetch(`/api/cart/item/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty }),
    });

    const data = await res.json();

    if (!res.ok) {
      setItems(oldItems);
      alert(data.error);
      return;
    }

    window.dispatchEvent(new Event("cartUpdated"));

    fetchCart();
  }

  async function aplicarCupom() {

    if (!coupon) {
      alert("Digite um cupom");
      return;
    }

    try {

      setCouponLoading(true);

      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: coupon,
          subtotal: total,
          items: items.map(item => ({
            id: item.product.id,
            price: item.product.priceCents / 100,
            qty: item.qty
          }))
        })
      });

      const data = await res.json();

      if (!data.valid) {
        alert(data.message || "Cupom inválido");
        return;
      }

      setDiscount(data.discount);
      setCouponCode(data.code);

      sessionStorage.setItem("coupon", JSON.stringify({ code: data.code }));

      if (data.code === "WIFI25") {
        alert("🎉 WIFI25 aplicado com sucesso!");
      } else {
        alert("Cupom aplicado com sucesso!");
      }

    } catch (error) {

      console.error(error);
      alert("Erro ao aplicar cupom");

    } finally {

      setCouponLoading(false);
    }
  }

  const total = items.reduce(
    (acc, item) => acc + (item.product.priceCents / 100) * item.qty,
    0
  );

  const totalFinal = Math.max(total + frete / 100 - discount, 0);

  function handleCheckout() {

    if (!items || items.length === 0) {
      alert("Seu carrinho está vazio");
      return;
    }

    const retirada = sessionStorage.getItem("retiradaLoja") === "true";

    const frete = Number(sessionStorage.getItem("freteCents") || 0);

    const manualFreight = sessionStorage.getItem("manualFreight") === "true";

    const cep = localStorage.getItem("cep");

    const numero = localStorage.getItem("numero");

    if (!cep) {
      alert("Informe o CEP");
      return;
    }

    if (!retirada && manualFreight) {

      const telefone = "554738423235";

      const cepWpp = localStorage.getItem("cep") || "";

      const produtos = items
        .map(item => `• ${item.product.name} (Qtd: ${item.qty})`)
        .join("\n");

      const mensagem = encodeURIComponent(
        `Olá!\n\nGostaria de solicitar uma cotação de frete para os seguintes produtos:\n\n${produtos}\n\nCEP: ${cepWpp}`
      );

      window.open(`https://wa.me/${telefone}?text=${mensagem}`, "_blank");

      return;
    }

    if (!retirada && frete <= 0) {
      alert("Calcule o frete");
      return;
    }

    if (!retirada && !numero) {
      alert("Informe o número da casa");
      return;
    }

    window.location.href = "/checkout";
  }

  return (
    <CartLayout
      productsSlot={
        <CartProductsCard
          items={items}
          onUpdateQty={updateQty}
          onRemove={removeItem}
        />
      }
      summarySlot={
        <CartSummaryCard
          items={items}
          coupon={coupon}
          setCoupon={setCoupon}
          aplicarCupom={aplicarCupom}
          couponLoading={couponLoading}
          discount={discount}
          couponCode={couponCode}
          total={total}
          totalFinal={totalFinal}
          hasKit={hasKit}
          frete={frete}
          onCheckout={handleCheckout}
        />
      }
    />
  );
}