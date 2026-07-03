

"use client";

import s from "@/app/styles/FreteCalculator.module.css";
import { FaTruck, FaStore } from "react-icons/fa";

import { useState } from "react";

type Props = {
  dark?: boolean;
  saveToCart?: boolean;
};

export default function FreteCalculator({
  dark = false,
  saveToCart = false
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
  }),
});

const freteData = await freteRes.json();

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

setFretes(opcoes);

// Continua selecionando automaticamente a primeira
// para não quebrar o checkout atual.
const primeira = opcoes[0];

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
    sessionStorage.removeItem("freteCents");

    setFrete(null);

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

    setFrete(0);

    sessionStorage.setItem(
      "freteCents",
      "0"
    );

    window.dispatchEvent(
      new Event("freteUpdated")
    );

    sessionStorage.setItem(
      "retiradaLoja",
      "true"
    );

    localStorage.setItem(
      "freteNome",
      "Retirada na loja"
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
{frete !== null && (endereco || retirada) && (

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
            freteSelecionado?.id === item.id;

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
                  ? "2px solid #0bc15c"
                  : "1px solid #444",
                borderRadius: 12,
                padding: 15,
                background: ativo
                  ? "rgba(11,193,92,.12)"
                  : "#1b1b1b",
                transition: ".2s"
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

                  <strong>
                    {item.name}
                  </strong>

                  <div
                    style={{
                      fontSize: 13,
                      opacity: .75,
                      marginTop: 3
                    }}
                  >
                    Entrega em{" "}
                    {item.delivery_time} dias
                  </div>

                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18
                  }}
                >
                  R$ {Number(item.price).toFixed(2)}
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