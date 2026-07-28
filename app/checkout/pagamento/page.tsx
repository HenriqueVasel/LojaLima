"use client";

import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/app/styles/form.module.css";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { sendGAEvent } from "@next/third-parties/google";

export default function PagamentoPage(){

const router = useRouter();

const [customer,setCustomer]=useState<any>(null);

const [loading,setLoading]=useState(false);

const [payment,setPayment]=useState("pix");

const [coupon,setCoupon] = useState<any>(null);



useEffect(()=>{

async function init(){

 let cart = [];

 

const res = await fetch("/api/cart", {
  credentials: "include",
});

if (res.ok) {

  cart = await res.json();

} else if (res.status === 401) {

  cart = JSON.parse(
    localStorage.getItem("cart") || "[]"
  );

}

if (!Array.isArray(cart) || cart.length === 0) {
  alert("Seu carrinho está vazio");
  router.push("/carrinho");
  return;
}

  // 📦 pega dados do cliente
  const raw = sessionStorage.getItem("checkout_customer");

  if(raw){
    setCustomer(JSON.parse(raw));
    const savedCoupon =
  sessionStorage.getItem("coupon");

if(savedCoupon){
  setCoupon(JSON.parse(savedCoupon));
}
  } else {
    router.push("/checkout");
  }

}

init();

},[]);


async function finalizar(){

  if (loading) return;

  if(!customer){
    toast.error("Dados não encontrados");
    return;
  }

  const nome = customer.nome?.trim() || "";

if (nome.length < 3) {
  toast.error("Informe um nome válido.");
  return;
}

const phone = customer.whats.replace(/\D/g, "");

if (phone.length < 10 || phone.length > 11) {
  toast.error("WhatsApp inválido.");
  return;
}

if (customer.email) {

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(customer.email)) {
    toast.error("E-mail inválido.");
    return;
  }

}
  

const retiradaLoja =
  sessionStorage.getItem("retiradaLoja") === "true";



if (!retiradaLoja && !customer.endereco) {
  toast.error("Endereço não informado");
  return;
}

sendGAEvent("event", "begin_checkout", {
  currency: "BRL",
  value: 0,
});

if (typeof window !== "undefined" && (window as any).fbq) {
  (window as any).fbq("track", "InitiateCheckout");
}

  setLoading(true);

  try {

    const guestCart = JSON.parse(
  localStorage.getItem("cart") || "[]"
);

if (guestCart.length === 0) {
  toast.error("Seu carrinho está vazio.");
  setLoading(false);
  return;
}

    const res = await fetch("/api/checkout", {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      credentials:"include",
body: JSON.stringify({
  couponCode: coupon?.code || null,

  customerName: customer.nome,
  customerWhats: customer.whats,
  customerEmail: customer.email,

  customerType: customer.tipoPessoa,

  customerCpf: customer.cpf,
  customerCnpj: customer.cnpj,
  customerIe: customer.inscricaoEstadual,

  customerObs: customer.obs || "",

  paymentMethod: payment,

  retiradaLoja:
    sessionStorage.getItem("retiradaLoja") === "true",

  endereco: customer.endereco,
  numero: customer.numero,
  guestCart,

  shipping: JSON.parse(
    sessionStorage.getItem("shipping") || "null"
    
  )
  
})
  
    });

    

    const data = await res.json();


if (data.freeOrder) {

  sessionStorage.setItem(
    "lastOrder",
    JSON.stringify(data)
  );

  router.push(
    `/pagamento/retorno?orderId=${data.orderId}`
  );

  return;
}



    // 🔴 NÃO LOGADO
    
    // 🔴 ERRO NORMAL
    if(!res.ok){
      toast.error(data.error || "Erro ao finalizar compra");
      setLoading(false);
      return;
    }

    sessionStorage.setItem(
      "lastOrder",
      JSON.stringify(data)
    );

    
    // 🔥 abre o Mercado Pago em nova aba
window.location.href = data.init_point;

// 🔥 redireciona pra sua tela de aguardando


  } catch (error) {
    console.error(error);
    toast.error("Erro inesperado");
    setLoading(false);
  }
}


if(!customer){

return(

<div className={s.page}>
<div className={s.container}>

<h1 className={s.title}>
Pagamento
</h1>

<div className={s.card}>
Dados não encontrados
</div>

</div>
</div>

);

}


return(

<div className={s.page}>
<div className={s.container}>

<h1 className={s.title}>
Pagamento
</h1>


<div className={s.card}>

<h3>Confirmar dados</h3>

<br/>

<p>
<b>Nome:</b> {customer.nome}
</p>

<p>
<b>Whats:</b> {customer.whats}
</p>

<p>
<b>Email:</b> {customer.email || "-"}
</p>

{customer.tipoPessoa === "PF" ? (

  <p>
    <b>CPF:</b> {customer.cpf}
  </p>

) : (

  <>
    <p>
      <b>CNPJ:</b> {customer.cnpj}
    </p>

    <p>
      <b>Inscrição Estadual:</b> {customer.inscricaoEstadual}
    </p>
  </>

)}
{customer.freteCents && (
  <p>
    <b>Frete:</b> R$ {(customer.freteCents / 100).toFixed(2)}
  </p>
)}

{coupon && (
  <p style={{ color:"#16a34a" }}>
    <b>Cupom:</b> {coupon.code}
    {" "}
    {coupon?.discount !== undefined && (
      <>
        (-R$ {Number(coupon.discount).toFixed(2)})
      </>
    )}
  </p>
)}

{coupon?.code === "WIFI25" && (
  <p
    style={{
      color: "#facc15",
      fontSize: "13px",
      marginTop: "6px"
    }}
  >
    🎉 O cupom WIFI25 já concede o desconto máximo desta promoção.
  </p>
)}

</div>


<br/>


<div className={s.card}>

<h3>Forma de pagamento</h3>

<br/>

{payment === "pix" && (
  <div style={{
    background: "#0f2f1f",
    border: "1px solid #1f7a4d",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  }}>
    
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <AlertCircle size={18} color="#4ade80" />
      <span style={{ color: "#4ade80", fontWeight: 500 }}>
        Pagamento via PIX
      </span>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <CheckCircle2 size={16} color="#22c55e" />
      <span style={{ color: "#d1fae5", fontSize: "14px" }}>
        Após pagar, volte para esta página
      </span>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <CheckCircle2 size={16} color="#22c55e" />
      <span style={{ color: "#d1fae5", fontSize: "14px" }}>
        O pagamento será confirmado automaticamente
      </span>
    </div>

  </div>
)}

<label>

<input
type="radio"
value="pix"
checked={payment==="pix"}
onChange={()=>setPayment("pix")}
/>

 Pix

</label>

<br/><br/>


<label>

<input
type="radio"
value="credito"
checked={payment==="credito"}
onChange={()=>setPayment("credito")}
/>

 Cartão Crédito

</label>


<br/><br/>


<label>

<input
type="radio"
value="debito"
checked={payment==="debito"}
onChange={()=>setPayment("debito")}
/>

 Cartão Débito

</label>


<br/><br/>


<button
onClick={finalizar}
className={s.button}
disabled={loading}
>

{loading
? "Processando..."
: "Finalizar Pedido"}

</button>


</div>


</div>
</div>

);

}