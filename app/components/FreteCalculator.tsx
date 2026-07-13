

"use client";

import s from "@/app/styles/FreteCalculator.module.css";
import { FaTruck, FaStore } from "react-icons/fa";

import { useState, useEffect } from "react";

type CartItem = {
  id: number;
  qty: number;
  product: {
    id: number;
  };
};

type Props = {
  dark?: boolean;
  saveToCart?: boolean;
  items?: CartItem[];
};

export default function FreteCalculator({
  dark = false,
  saveToCart = false,
  items = []
}: Props) {

  const [cep, setCep] = useState("");
  const [frete, setFrete] = useState<number | null>(null);
  const [endereco, setEndereco] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  console.log("ANTES DO FETCH");
console.log(items);

console.log(
  items.map(item => ({
    productId: item.product.id,
    quantity: item.qty
  }))
);

  // 🔥 NOVO
  const [numero, setNumero] = useState("");
  const [retirada, setRetirada] = useState(false);

  const [fretes, setFretes] = useState<any[]>([]);
const [freteSelecionado, setFreteSelecionado] = useState<any>(null);


useEffect(() => {

  if (!retirada) return;

  setCep("");
  setNumero("");
  setEndereco(null);
  setFrete(null);
  setFretes([]);
  setFreteSelecionado(null);

  sessionStorage.setItem("freteCents", "0");
  sessionStorage.removeItem("shipping");

  localStorage.removeItem("cep");
  localStorage.removeItem("cidade");
  localStorage.removeItem("uf");
  localStorage.removeItem("logradouro");
  localStorage.removeItem("bairro");
  localStorage.removeItem("numero");

}, [retirada]);

 async function calcularFrete() {

  const cepLimpo = cep.replace(/\D/g, "");

  // 🔥 RETIRADA NA LOJA
  if (retirada) {

    if (cepLimpo.length !== 8) {
      alert("CEP inválido");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );

      const data = await res.json();

      if (data.erro) {
        alert("CEP não encontrado");
        return;
      }

      setEndereco(data);

      setFrete(0);

      localStorage.setItem("cep", cepLimpo);
localStorage.setItem("cidade", data.localidade);
localStorage.setItem("uf", data.uf);
localStorage.setItem("logradouro", data.logradouro || "");
localStorage.setItem("bairro", data.bairro || "");

      localStorage.setItem(
        "freteNome",
        "Retirada na loja"
      );

      if (saveToCart) {

  sessionStorage.setItem(
    "freteCents",
    "0"
  );

  window.dispatchEvent(
    new Event("freteUpdated")
  );

}

      return;

    } catch {

      alert("Erro ao validar CEP");

      return;

    } finally {

      setLoading(false);

    }
  }

    if (cepLimpo.length !== 8) {
      alert("CEP inválido");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data.erro) {
        alert("CEP não encontrado");
        return;
      }

      setEndereco(data);

     const freteRes = await fetch("/api/frete", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  cep: cepLimpo,
  items: items.map(item => ({
    productId: item.product.id,
    quantity: item.qty
  }))
}),
});

const freteData = await freteRes.json();
console.log(freteData);

console.log("FRETE:", freteData);

const opcoes = Array.isArray(freteData)
  ? freteData.filter(
      (item: any) =>
        !item.error &&
        item.price &&
        Number(item.price) > 0
    )
  : [];

if (opcoes.length === 0) {
  alert("Não foi possível calcular o frete");
  return;
}

const opcoesOrdenadas = [...opcoes].sort(
  (a, b) => Number(a.price) - Number(b.price)
);

setFretes(opcoesOrdenadas);

// Continua selecionando automaticamente a primeira
// para não quebrar o checkout atual.
const primeira = opcoesOrdenadas[0];

setFreteSelecionado(primeira);

const valor = Math.round(
  Number(primeira.price) * 100
);

setFrete(valor);

localStorage.setItem(
  "freteNome",
  primeira.name
);

sessionStorage.setItem(
  "shipping",
  JSON.stringify(primeira)
);

if (saveToCart) {

  sessionStorage.setItem(
    "freteCents",
    String(valor)
  );

  window.dispatchEvent(
    new Event("freteUpdated")
  );

}

     

      // 🔥 SALVA
      sessionStorage.setItem("freteCents", String(valor));
      localStorage.setItem("cep", cepLimpo);
      localStorage.setItem("cidade", data.localidade);
      localStorage.setItem("uf", data.uf);
      localStorage.setItem("logradouro", data.logradouro || "");
      localStorage.setItem("bairro", data.bairro || "");

    } catch {
      alert("Erro ao calcular frete");
    } finally {
      setLoading(false);
    }
  }


  function nomeTransportadora(item:any){

  return item.company?.name ||
         item.company?.company_name ||
         "Transportadora";

}

function nomeServico(item:any){

  switch(item.name){

    case "Package":
      return "Package";

    case "Package Centralizada":
      return "Package Econômico";

    case "Com":
      return "Convencional";

    case "Standard":
      return "Standard";

    default:
      return item.name;

  }

}

function logoTransportadora(item: any) {

  const nome = nomeTransportadora(item).toLowerCase();

  if (nome.includes("jadlog"))
    return "/produtos/jadlog.png";

  if (nome.includes("correios"))
    return "/produtos/correios.png";

  if (nome.includes("total"))
    return "/produtos/total-express.png";

  if (nome.includes("loggi"))
    return "/produtos/loggi.png";

  if (nome.includes("azul"))
    return "/produtos/azul-cargo.png";

  if (nome.includes("buslog"))
    return "/produtos/buslog.png";

  if (nome.includes("latam"))
    return "/produtos/latam-cargo.png";

  if (nome.includes("jet"))
    return "/produtos/jet.png";

  return "/produtos/default.png";

}

  return (
    <div
  className={`${s.wrapper} ${
    dark ? s.dark : ""
  }`}
>

     <div className={s.title}>
        Calcular frete e prazo
      </div>

      <div className={s.row}>

        <div className={s.methods}>

<button
onClick={() => {

  setRetirada(false);

sessionStorage.removeItem("retiradaLoja");
sessionStorage.removeItem("shipping");



  window.dispatchEvent(
    new Event("freteUpdated")
  );

}}
  className={`${s.methodBtn} ${!retirada ? s.active : ""}`}
>
  <div className={s.methodContent}>
    <FaTruck className={s.icon} />
    <span>Entrega</span>
  </div>
</button>

<button
 onClick={() => {
setRetirada(true);

sessionStorage.setItem("retiradaLoja", "true");
sessionStorage.setItem("freteCents", "0");
sessionStorage.removeItem("shipping");

localStorage.setItem(
  "freteNome",
  "Retirada na loja"
);

window.dispatchEvent(
  new Event("freteUpdated")
);

}}
  className={`${s.methodBtn} ${retirada ? s.active : ""}`}
>
  <div className={s.methodContent}>
    <FaStore className={s.icon} />
    <span>Retirada</span>
  </div>
</button>

</div>

       <div className={s.cepWrapper}>

  <div className={s.cepLabel}>
    {retirada
      ? "Informe seu CEP para validar a retirada"
      : "Digite seu CEP para calcular a entrega"}
  </div>

  <div className={s.cepRow}>

    <input
      placeholder={
        retirada
          ? "CEP do cliente"
          : "Digite seu CEP"
      }
      value={cep}
      onChange={(e) => setCep(e.target.value)}
      className={s.input}
    />

    <button
      onClick={calcularFrete}
      disabled={loading}
      className={s.okBtn}
    >
      {loading ? "..." : "OK"}
    </button>

  </div>

  {retirada && (
    <div className={s.pickupInfoText}>
      Necessário para validar disponibilidade da retirada.
    </div>
  )}

</div>

      </div>

      {/* ENDEREÇO */}
      {endereco && !retirada && (
        <div className={s.address}>
          {endereco.logradouro} <br />
          {endereco.bairro} <br />
          {endereco.localidade} - {endereco.uf}
        </div>
      )}

    {endereco && !retirada && (
  <input
    placeholder="Número da casa"
    value={numero}
    onChange={(e) => {
      setNumero(e.target.value);
      localStorage.setItem("numero", e.target.value);
    }}
    className={`${s.input} ${s.houseInput}`}
  />
)}
{retirada && (
  <div className={s.pickupBox}>
    <div className={s.pickupTitle}>
  <img
    src="/icons/store.png"
    className={s.icon}
  />

  Retirada na loja
</div>

    <div className={s.pickupAddress}>
      Rua Presidente Epitácio Pessoa, 723 Sala 1
      <br />
      CEP: 89251-155
    </div>

    <div className={s.pickupFree}>
  Frete grátis
</div>
  </div>
)}

      {/* RESULTADO */}
{!retirada && frete !== null && endereco && (

  <>

    {fretes.length > 0 ? (

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 20
        }}
      >

     {fretes.map((item: any, index) => {

  const ativo =
    freteSelecionado?.name === item.name &&
    freteSelecionado?.price === item.price;

  return (

    <div
      key={index}
      onClick={() => {

        setFreteSelecionado(item);

        const valor = Math.round(
          Number(item.price) * 100
        );

        setFrete(valor);

        localStorage.setItem(
          "freteNome",
          item.name
        );

        sessionStorage.setItem(
          "freteCents",
          String(valor)
        );

        sessionStorage.setItem(
          "shipping",
          JSON.stringify(item)
        );

        window.dispatchEvent(
          new Event("freteUpdated")
        );

      }}
      className={`${s.shippingCard} ${
        ativo ? s.shippingCardActive : ""
      }`}
    >

      <div className={s.shippingLeft}>

    <div className={s.radio}>
        {ativo && <div className={s.radioDot}></div>}
    </div>

    <img
        src={logoTransportadora(item)}
        className={s.shippingLogo}
        alt={nomeTransportadora(item)}
    />

    <div className={s.shippingInfo}>

        <div className={s.shippingCompany}>
            {nomeTransportadora(item)}
        </div>

        <div className={s.shippingService}>
            {nomeServico(item)}
        </div>

<div className={s.shippingTime}>
    Até {item.delivery_time} dias úteis
</div>

    </div>

</div>

      <div className={s.shippingRight}>

       <div className={s.shippingPrice}>
    {Number(item.price).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    })}
</div>

      </div>

    </div>

  );

})}

      </div>

    ) : (

      <div className={s.resultBox}>

        <div className={s.resultTop}>

          <span className={s.resultLabel}>

            <img
              src={
                retirada
                  ? "/icons/store.png"
                  : "/icons/truck.png"
              }
              className={s.iconSmall}
            />

            {localStorage.getItem("freteNome")}

          </span>

          <span className={s.price}>
            R$ {(frete / 100).toFixed(2)}
          </span>

        </div>

      </div>

    )}

  </>

)}

    </div>
  );
}