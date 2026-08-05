"use client";

import s from "@/app/styles/carinho.module.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import FreteCalculator from "@/app/components/FreteCalculator";


type CartItem = {
  id: number;
  qty: number;
product: {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  sku: string;
  stock: number;
  isKit: boolean;
  images?: { url: string }[];
}
};

export default function CarrinhoPage() {

  

  const [items, setItems] = useState<CartItem[]>([]);
  
  const [coupon,setCoupon] = useState("");
const [discount,setDiscount] = useState(0);
const [couponLoading,setCouponLoading] = useState(false);
const [couponCode,setCouponCode] = useState("");
const [isMobile, setIsMobile] = useState(false);
const [isGuest, setIsGuest] = useState(false);
const [frete, setFrete] = useState(0);

const hasKit =
    items.some(
      item => (item.product as any).isKit
    );

useEffect(() => {

  // limpa dados antigos
  sessionStorage.removeItem("freteCents");
  sessionStorage.removeItem("retiradaLoja");

  localStorage.removeItem("cep");
  localStorage.removeItem("numero");
  localStorage.removeItem("cidade");
  localStorage.removeItem("uf");
  localStorage.removeItem("logradouro");
  localStorage.removeItem("bairro");

  function updateFrete() {

    const saved =
      sessionStorage.getItem("freteCents");

    setFrete(Number(saved || 0));
  }

  updateFrete();

  window.addEventListener(
    "freteUpdated",
    updateFrete
  );

  

  return () => {

    window.removeEventListener(
      "freteUpdated",
      updateFrete
    );

  };

}, []);

async function fetchCart() {

  const res = await fetch("/api/cart", {
    credentials: "include",
  });

  // Visitante
  if (res.status === 401) {

    setIsGuest(true);

    const guestCart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    if (guestCart.length === 0) {
      setItems([]);
      return;
    }

    const guestRes = await fetch("/api/cart/guest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestCart,
      }),
    });

    const guestItems = await guestRes.json();

    setItems(guestItems);

    return;
  }

  // Usuário logado
  setIsGuest(false);

  const data = await res.json();

  if (Array.isArray(data)) {
    setItems(data);
  } else {
    setItems([]);
  }
}

  // 🔥 pega frete do localStorage
  useEffect(() => {
    
    const savedCoupon =
  sessionStorage.getItem("coupon");

if(savedCoupon){

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

  // 👤 Visitante
  if (res.status === 401 ) {

    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    if (res.status === 401) {

  const cart = JSON.parse(
    localStorage.getItem("cart") || "[]"
  );

  const novoCarrinho = cart.filter(
    (item: any) => item.id !== id
  );

  localStorage.setItem(
    "cart",
    JSON.stringify(novoCarrinho)
  );

  if (novoCarrinho.length === 0) {

    setItems([]);

  } else {

    const guestRes = await fetch("/api/cart/guest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestCart: novoCarrinho,
      }),
    });

    const guestItems = await guestRes.json();

    setItems(guestItems);

  }

  window.dispatchEvent(
    new Event("cartUpdated")
  );

  return;
}

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    return;
  }

  // 👤 Logado
  await fetch(`/api/cart/item/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  window.dispatchEvent(
    new Event("cartUpdated")
  );

  fetchCart();
}

async function updateQty(id:number, qty:number){

  if(qty <= 0){
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

  const cart = JSON.parse(
    localStorage.getItem("cart") || "[]"
  );

  const index = cart.findIndex(
    (item: any) => item.id === id
  );

  if (index >= 0) {

    cart[index].qty = qty;

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );

    const guestRes = await fetch("/api/cart/guest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestCart: cart,
      }),
    });

    const guestItems = await guestRes.json();

    setItems(guestItems);

    window.dispatchEvent(
      new Event("cartUpdated")
    );

  }

  return;

}

 // Guarda o estado antigo caso a API dê erro
const oldItems = items;

// Atualiza a tela imediatamente
setItems(prev =>
  prev.map(item =>
    item.id === id
      ? { ...item, qty }
      : item
  )
);

const res = await fetch(`/api/cart/item/${id}`, {
  method: "PUT",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ qty }),
});

const data = await res.json();

if (!res.ok) {
  // Se der erro, volta o estado anterior
  setItems(oldItems);
  alert(data.error);
  return;
}

window.dispatchEvent(new Event("cartUpdated"));

fetchCart();

}

async function aplicarCupom(){

  if(!coupon){
    alert("Digite um cupom");
    return;
  }

  try {

    setCouponLoading(true);

    const res = await fetch("/api/coupons", {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
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

    if(!data.valid){
      alert(data.message || "Cupom inválido");
      return;
    }

    setDiscount(data.discount);
    setCouponCode(data.code);

sessionStorage.setItem(
  "coupon",
  JSON.stringify({
    code:data.code
  })
);

if (data.code === "WIFI25") {

  alert("🎉 WIFI25 aplicado com sucesso!");

} else {

  alert("Cupom aplicado com sucesso!");

}

  } catch (error){

    console.error(error);
    alert("Erro ao aplicar cupom");

  } finally {

    setCouponLoading(false);

  }
}

  const total = items.reduce(
    (acc,item)=>acc+(item.product.priceCents/100)*item.qty,
    0
  );

const totalFinal = Math.max(
  total + (frete / 100) - discount,
  0
);

  function handleCheckout() {

    if (!items || items.length === 0) {
      alert("Seu carrinho está vazio");
      return;
    }
 const retirada =
  sessionStorage.getItem("retiradaLoja") === "true";

const frete =
  Number(
    sessionStorage.getItem("freteCents") || 0
  );

  const manualFreight =
  sessionStorage.getItem("manualFreight") === "true";

  const cep =
  localStorage.getItem("cep");

const numero =
  localStorage.getItem("numero");

if (!cep) {

  alert("Informe o CEP");

  return;

}

if (!retirada && manualFreight) {

  const telefone = "554738423235";

const cep = localStorage.getItem("cep") || "";

const produtos = items
  .map(
    item =>
      `• ${item.product.name} (Qtd: ${item.qty})`
  )
  .join("\n");

const mensagem = encodeURIComponent(
`Olá!

Gostaria de solicitar uma cotação de frete para os seguintes produtos:

${produtos}

CEP: ${cep}`
);

  window.open(
    `https://wa.me/${telefone}?text=${mensagem}`,
    "_blank"
  );

  return;

}

if (!retirada && frete <= 0) {

  alert(
    "Calcule o frete"
  );

  return;

}

if (!retirada && !numero) {

  alert(
    "Informe o número da casa"
  );

  return;

}



    window.location.href = "/checkout";
  }

  return (

  <div className={s.page}>

    <h1 className={s.title}>
      Carrinho
    </h1>

    <div className={s.grid}>

      {/* PRODUTOS */}
      <div className={s.left}>

        <div className={s.card}>

          <div className={s.cardHeader}>
            <div className={s.cardTitle}>
              Produtos {items.length > 0 && `(${items.length})`}
            </div>
          </div>

          <div className={s.products}>

            {items.map((item) => (

              <div key={item.id} className={s.product}>

                <Link
                  href={`/produto/${item.product.slug}`}
                  className={s.image}
                >
                  <img
                    src={
                      item.product.images?.[0]?.url ||
                      "/produtos/placeholder.jpg"
                    }
                    alt={item.product.name}
                  />
                </Link>

                {/* INFO */}
                <div className={s.info}>

                  <div>
                    <Link
                      href={`/produto/${item.product.slug}`}
                      className={s.nameLink}
                    >
                      <h3 className={s.name}>
                        {item.product.name}
                      </h3>
                    </Link>

                    <p className={s.unitPrice}>
                      R$ {(item.product.priceCents / 100).toFixed(2)} / unidade
                    </p>
                  </div>

                  {/* QTD */}
                  <div className={s.quantity}>

                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className={s.qtyBtn}
                    >
                      -
                    </button>

                    <span className={s.qtyValue}>
                      {item.qty}
                    </span>

                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className={s.qtyBtn}
                    >
                      +
                    </button>

                  </div>

                </div>

                {/* PREÇO + REMOVE */}
                <div className={s.priceArea}>

                  <div className={s.price}>
                    R$ {((item.product.priceCents / 100) * item.qty).toFixed(2)}
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className={s.remove}
                  >
                    Remover
                  </button>

                </div>

              </div>

            ))}

            {items.length === 0 && (
              <p className={s.emptyCart}>
                Seu carrinho está vazio
              </p>
            )}

          </div>

        </div>

      </div>

      {/* RESUMO */}
      <div className={s.summary}>

        <div className={s.summaryCard}>

          <div className={s.summaryHeader}>
            <h2>Resumo do Pedido</h2>
          </div>

          <div className={s.summaryContent}>

            {/* CUPOM */}
            <div className={s.couponBox}>

              <div className={s.couponRow}>

                <input
                  type="text"
                  placeholder="Cupom"
                  value={coupon}
                  onChange={(e) =>
                    setCoupon(e.target.value.toUpperCase())
                  }
                  className={s.couponInput}
                />

                <button
                  onClick={aplicarCupom}
                  disabled={couponLoading}
                  className={s.couponButton}
                >
                  {couponLoading ? "..." : "Aplicar"}
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

            {/* FRETE */}
            <div className={s.freteWrapper}>
              <FreteCalculator
                dark
                saveToCart
                items={items}
              />
            </div>

            {/* SUBTOTAL */}
            <div className={s.summaryRow}>
              <span>Subtotal</span>
              <span className={s.summaryRowValue}>
                R$ {total.toFixed(2)}
              </span>
            </div>

            {/* DESCONTO */}
            {discount > 0 && (
              <div className={s.summaryRowDiscount}>
                <span>Desconto</span>
                <span>-R$ {discount.toFixed(2)}</span>
              </div>
            )}

            {/* TOTAL */}
            <div className={s.totalRow}>
              <div className={s.totalLabel}>Total</div>
              <div className={s.totalValue}>
                R$ {totalFinal.toFixed(2)}
              </div>
            </div>

            {/* PIX */}
            <div className={s.pixCard}>

              <div className={s.pixLabel}>
                {hasKit ? "Pagamento à vista" : "À vista no PIX"}
              </div>

              <div className={s.pixValue}>
                R$ {(
                  hasKit
                    ? total + (frete / 100)
                    : ((total - discount) * 0.95 + (frete / 100))
                ).toFixed(2)}
              </div>

              <div className={s.pixNote}>
                {hasKit
                  ? "Pagamento sem desconto adicional"
                  : "Economia instantânea de 5%"}
              </div>

            </div>

            {/* BOTÃO */}
            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className={
                items.length === 0
                  ? `${s.checkoutBtn} ${s.checkoutBtnDisabled}`
                  : s.checkoutBtn
              }
            >
              Finalizar compra
            </button>

            {/* SELOS DE CONFIANÇA */}
            <div className={s.perksList}>

              <div className={s.perkItem}>
                <div className={s.perkIcon}>🛡️</div>
                <div>
                  <div className={s.perkTitle}>Compra 100% segura</div>
                  <div className={s.perkDesc}>Seus dados protegidos</div>
                </div>
              </div>

              <div className={s.perkItem}>
                <div className={s.perkIcon}>💳</div>
                <div>
                  <div className={s.perkTitle}>Parcele em até 12x</div>
                  <div className={s.perkDesc}>No cartão de crédito</div>
                </div>
              </div>

              <div className={s.perkItem}>
                <div className={s.perkIcon}>🎧</div>
                <div>
                  <div className={s.perkTitle}>Suporte especializado</div>
                  <div className={s.perkDesc}>Atendimento via WhatsApp</div>
                </div>
              </div>

            </div>

            {/* COMPRA SEGURA */}
            <div className={s.secureBox}>
              <span className={s.secureIcon}>🔒</span>
              <div>
                <div className={s.secureTitle}>Ambiente seguro</div>
                <div className={s.secureText}>
                  Seus dados estão protegidos com criptografia SSL de 256 bits.
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

  );

}
