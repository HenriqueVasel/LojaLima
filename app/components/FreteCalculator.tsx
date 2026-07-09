

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

                const valor =
                  Math.round(
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
            style={{
  cursor: "pointer",
  border: ativo
    ? "2px solid #22c55e"
    : "1px solid #333",
  borderRadius: 16,
  padding: 20,
  background: ativo
    ? "#103320"
    : "#202020",
  transition: ".25s",
  boxShadow: ativo
    ? "0 0 18px rgba(34,197,94,.25)"
    : "none"
}}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >

                <div>

                  <strong
  style={{
    fontSize:16,
  color:"#fff"
    
  }}
>
  {nomeTransportadora(item)}
</strong>

<div
  style={{
       fontSize:14,
    color:"#c8c8c8",
    marginTop:4
  }}
>
  {nomeServico(item)}
</div>
                  <div
                   style={{
  marginTop: 8,
  fontSize: 13,
  color: "#7dd3a7",
  fontWeight: 500
}}
                  >
                    Entrega em até {item.delivery_time} dias úteis
                  </div>

                </div>

                <div
  style={{
    textAlign: "right"
  }}
>

  <div
    style={{
      fontSize: 24,
      fontWeight: 700,
      color: "#22c55e"
    }}
  >
    R$ {Number(item.price).toFixed(2)}
  </div>

  {ativo && (
    <div
      style={{
        marginTop: 8,
        background: "#16a34a",
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600
      }}
    >
      ✓ Selecionado
    </div>
  )}

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