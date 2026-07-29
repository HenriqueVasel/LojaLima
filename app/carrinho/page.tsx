"use client";

import s from "@/app/styles/form.module.css";
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

  const qtyBtnStyle = {
  width:32,
  height:32,
  borderRadius:8,
  border:"1px solid rgba(255,255,255,0.1)",
  background:"#1a222c",
  color:"#fff",
  cursor:"pointer"
};

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
  // Logado
  const res = await fetch("/api/cart", {
    credentials: "include",
  });

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

  const cep =
  localStorage.getItem("cep");

const numero =
  localStorage.getItem("numero");

if (!cep) {

  alert("Informe o CEP");

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

  <div
  style={{
    maxWidth:1200,
    margin:"60px auto",
    padding:"0 16px",
    display:"grid",
   gridTemplateColumns: isMobile
  ? "1fr"
  : "1fr 340px",
    gap:24,
    alignItems:"start"
  }}
>

 <h1 style={{
  color:"#fff",
  marginBottom:30,
  fontSize:28,
  fontWeight:800,
  gridColumn:"1 / -1"
}}>
      Carrinho
    </h1>

    <div>

    {items.map((item)=>(

      <div
        key={item.id}
        style={{
          display:"flex",
          gap:20,
          background:"#11161d",
          padding:16,
          marginBottom:16,
          borderRadius:14,
          border:"1px solid rgba(255,255,255,0.05)",
          transition:"0.2s"
        }}
      >



<Link href={`/produto/${item.product.slug}`}>

<img
  src={
  item.product.images?.[0]?.url ||
  "/produtos/placeholder.jpg"
}
  alt={item.product.name}
  style={{
  width:100,
  height:100,
  objectFit:"contain",
  borderRadius:10,
  background:"#fff",
  padding:8
  }}
/>
</Link>

        {/* INFO */}
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>

          <div>
            <Link
  href={`/produto/${item.product.slug}`}
  style={{
    textDecoration:"none"
  }}
>

<h3 style={{
              color:"#fff",
              margin:0,
              fontSize:16,
              fontWeight:700
            }}>
              {item.product.name}
            </h3>
            </Link>

            <p style={{
              color:"#9ca3af",
              fontSize:13,
              marginTop:6
            }}>
              R$ {(item.product.priceCents/100).toFixed(2)} / unidade
            </p>
          </div>

           

          {/* QTD */}

          
          <div style={{
            display:"flex",
            alignItems:"center",
            gap:10,
            marginTop:10
          }}>


            

            <button
              onClick={()=>updateQty(item.id,item.qty-1)}
              style={qtyBtnStyle}
            >
              -
            </button>

            <span style={{color:"#fff",fontWeight:700}}>
              {item.qty}
            </span>

            <button
              onClick={()=>updateQty(item.id,item.qty+1)}
              style={qtyBtnStyle}
            >
              +
            </button>

          </div>

        </div>

        

        

        {/* PREÇO + REMOVE */}
        <div style={{
          display:"flex",
          flexDirection:"column",
          justifyContent:"space-between",
          alignItems:"flex-end"
        }}>

          <div style={{
            color:"#39ff14",
            fontWeight:800,
            fontSize:16
          }}>
            R$ {((item.product.priceCents/100)*item.qty).toFixed(2)}
          </div>

          <button
            onClick={()=>removeItem(item.id)}
           style={{
  background:"transparent",
  border:"none",
  color:"#888",
  cursor:"pointer",
  fontSize:13,
  transition:"0.2s"
}}
onMouseEnter={(e)=>(
  e.currentTarget.style.color="#ef4444"
)}
onMouseLeave={(e)=>(
  e.currentTarget.style.color="#888"
)}
          >
            Remover
          </button>

        </div>

      </div>

    ))}

    </div>

    {/* RESUMO */}
<div
  style={{
    width:"100%",
    position:"sticky",
    top:20,
    height:"fit-content",
    background:"#0f141a",
    padding:24,
    borderRadius:16,
    border:"1px solid rgba(255,255,255,0.05)"
  }}
>

  {/* CUPOM */}
  <div style={{ marginBottom:20 }}>

    <div
      style={{
        display:"flex",
        gap:10
      }}
    >

      <input
        type="text"
        placeholder="Cupom"
        value={coupon}
        onChange={(e)=>
          setCoupon(e.target.value.toUpperCase())
        }
        style={{
          flex:1,
          height:44,
          borderRadius:10,
          border:"1px solid rgba(255,255,255,0.08)",
          background:"#11161d",
          color:"#fff",
          padding:"0 12px",
          fontSize:14
        }}
      />

      <button
        onClick={aplicarCupom}
        disabled={couponLoading}
        style={{
          border:"none",
          padding:"0 18px",
          borderRadius:10,
          background:"#22c55e",
          color:"#022c22",
          fontWeight:700,
          cursor:"pointer"
        }}
      >
        {couponLoading
          ? "..."
          : "Aplicar"}
      </button>

    </div>

    {discount > 0 && (
      <div
        style={{
          marginTop:10,
          color:"#22c55e",
          fontSize:13,
          fontWeight:700
        }}
      >
        Cupom {couponCode} aplicado
        {" "}
        (-R$ {discount.toFixed(2)})
      </div>
    )}

 {couponCode === "WIFI25" && discount > 0 && (
  <div
    style={{
      marginTop:8,
      padding:"10px 12px",
      borderRadius:"8px",
      background:"rgba(250,204,21,0.08)",
      border:"1px solid rgba(250,204,21,0.2)",
      color:"#facc15",
      fontSize:"12px",
      lineHeight:1.5
    }}
  >
    🎉 Este produto já está com a condição promocional máxima disponível.
  </div>
)}

  </div>
  
  <FreteCalculator
  dark
  saveToCart
  items={items}
/>
  {/* FRETE */}
  


  {/* SUBTOTAL */}
  <div
    style={{
      display:"flex",
      justifyContent:"space-between",
      marginBottom:8,
      color:"#9ca3af",
      fontSize:14
    }}
  >
    <span>Subtotal</span>

    <span style={{ color:"#fff" }}>
      R$ {total.toFixed(2)}
    </span>
  </div>

  {/* DESCONTO */}
  {discount > 0 && (
    <div
      style={{
        display:"flex",
        justifyContent:"space-between",
        marginBottom:8,
        color:"#22c55e",
        fontSize:14,
        fontWeight:700
      }}
    >
      <span>Desconto</span>

      <span>
        -R$ {discount.toFixed(2)}
      </span>
    </div>
  )}

  {/* TOTAL */}
  <div
    style={{
      display:"flex",
      justifyContent:"space-between",
      alignItems:"flex-end",
      borderTop:"1px solid rgba(255,255,255,0.06)",
      paddingTop:16,
      marginTop:14
    }}
  >

    <div
      style={{
        color:"#fff",
        fontSize:15,
        fontWeight:700
      }}
    >
      Total
    </div>

    <div
      style={{
        color:"#fff",
        fontSize:32,
        fontWeight:900,
        lineHeight:1
      }}
    >
      R$ {totalFinal.toFixed(2)}
    </div>

  </div>

  {items.length === 0 && (
    <p style={{ color: "#888", marginTop: 20 }}>
      Seu carrinho está vazio
    </p>
  )}

  {/* PIX */}
<div
  style={{
    marginTop:16,
    padding:14,
    borderRadius:14,
    background:"rgba(34,197,94,0.08)",
    border:"1px solid rgba(34,197,94,0.16)"
  }}
>

  <div
    style={{
      color:"#22c55e",
      fontWeight:700,
      fontSize:13,
      marginBottom:6
    }}
  >
    {hasKit
      ? "Pagamento à vista"
      : "À vista no PIX"}
  </div>

  <div
    style={{
      color:"#22c55e",
      fontSize:28,
      fontWeight:900,
      lineHeight:1
    }}
  >
    R$ {

      (
        hasKit

          ? total + (frete / 100)

          : ((total - discount) * 0.95 + (frete / 100))

      ).toFixed(2)

    }
  </div>

  <div
    style={{
      color:"#888",
      fontWeight:400,
      fontSize:11,
      marginTop:6
    }}
  >
    {hasKit
      ? "Pagamento sem desconto adicional"
      : "Economia instantânea de 5%"}
  </div>

</div>
  {/* BOTÃO */}
  <button
    onClick={handleCheckout}
    disabled={items.length === 0}
    style={{
      marginTop:20,
      width:"100%",
      height:50,
      borderRadius:12,
      border:"none",
      fontWeight:700,
      fontSize:16,
      background: items.length === 0 ? "#333" : "#22c55e",
      color:"#022c22",
      cursor: items.length === 0 ? "not-allowed" : "pointer",
      transition:"0.2s"
    }}
  >
    Finalizar compra
  </button>

</div>

  </div>

);


}