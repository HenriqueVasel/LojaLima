"use client";

import { useState } from "react";
import s from "@/app/styles/ProductFrete.module.css";
import { Truck, MapPin, Loader2 } from "lucide-react";

type CartItem = {
  id: number;
  qty: number;
  product: {
    id: number;
  };
};

type Props = {
  items: CartItem[];
};

export default function ProductFrete({ items }: Props) {

  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);

  const [endereco, setEndereco] = useState<any>(null);

  const [fretes, setFretes] = useState<any[]>([]);

  const [freteSelecionado, setFreteSelecionado] =
    useState<any>(null);


    function nomeTransportadora(item: any) {

  return (
    item.company?.name ||
    item.company?.company_name ||
    "Transportadora"
  );

}

function nomeServico(item: any) {

  switch (item.name) {

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

async function calcularFrete() {

  const cepLimpo = cep.replace(/\D/g, "");

  if (cepLimpo.length !== 8) {
    alert("Digite um CEP válido.");
    return;
  }

  setLoading(true);

  try {

    // Busca endereço
    const viaCep = await fetch(
      `https://viacep.com.br/ws/${cepLimpo}/json/`
    );

    const enderecoData = await viaCep.json();

    if (enderecoData.erro) {
      alert("CEP não encontrado.");
      return;
    }

    setEndereco(enderecoData);

    // Calcula frete
    const res = await fetch("/api/frete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cep: cepLimpo,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.qty,
        })),
      }),
    });

    const data = await res.json();

    const opcoes = Array.isArray(data)
      ? data.filter(
          (item: any) =>
            !item.error &&
            item.price &&
            Number(item.price) > 0
        )
      : [];

    if (!opcoes.length) {
      alert("Não foi possível calcular o frete.");
      return;
    }

    const ordenadas = [...opcoes].sort(
      (a, b) => Number(a.price) - Number(b.price)
    );

    setFretes(ordenadas);

  } catch (err) {

    console.error(err);

    alert("Erro ao calcular o frete.");

  } finally {

    setLoading(false);

  }

}

function selecionarFrete(item: any) {

  setFreteSelecionado(item);

  sessionStorage.setItem(
    "shipping",
    JSON.stringify(item)
  );

  sessionStorage.setItem(
    "freteCents",
    String(Math.round(Number(item.price) * 100))
  );

  localStorage.setItem(
    "freteNome",
    item.name
  );

  window.dispatchEvent(
    new Event("freteUpdated")
  );

}

return (
  <div className={s.wrapper}>

    <div className={s.header}>
      <Truck size={20} />
      <div>
        <h3>Calcule o frete</h3>
        <p>Consulte prazo e valor para sua região.</p>
      </div>
    </div>

    <div className={s.searchBox}>

      <input
        type="text"
        placeholder="Digite seu CEP"
        value={cep}
        onChange={(e) => setCep(e.target.value)}
        className={s.input}
      />

      <button
        onClick={calcularFrete}
        disabled={loading}
        className={s.button}
      >
        {loading ? (
          <Loader2
            size={18}
            className={s.loading}
          />
        ) : (
          "Calcular"
        )}
      </button>

    </div>

    {endereco && (

      <div className={s.address}>

        <MapPin size={16} />

        <span>

          {endereco.localidade} - {endereco.uf}

        </span>

      </div>

    )}

    {fretes.length > 0 && (

      <div className={s.shippingList}>

        {fretes.map((item, index) => {

          const ativo =
            freteSelecionado?.name === item.name &&
            freteSelecionado?.price === item.price;

          return (

            <div
              key={index}
              onClick={() =>
                selecionarFrete(item)
              }
              className={`${s.shippingCard} ${
                ativo ? s.active : ""
              }`}
            >

              {index === 0 && (
                <div className={s.bestBadge}>
                  Melhor opção
                </div>
              )}

              <div className={s.cardLeft}>

                <img
                  src={logoTransportadora(item)}
                  alt=""
                  className={s.logo}
                />

                <div>

                  <div className={s.company}>
                    {nomeTransportadora(item)}
                  </div>

                  <div className={s.service}>
                    {nomeServico(item)}
                  </div>

                  <div className={s.time}>
                    Entrega em até{" "}
                    {item.delivery_time} dias úteis
                  </div>

                </div>

              </div>

              <div className={s.cardRight}>

                <div className={s.price}>
                  {Number(item.price).toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  )}
                </div>

                {ativo && (
                  <div className={s.selected}>
                    Selecionado
                  </div>
                )}

              </div>

            </div>

          );

        })}

      </div>

    )}

  </div>
);
}
