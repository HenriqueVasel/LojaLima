"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import React from "react";
import styles from "@/app/styles/loja.module.css";

type Props = {
  title: string;
  endpoint: string;
  itemsPerRow?: number;
  insertComponent?: React.ReactNode;
  insertEvery?: number;
};

export default function ProductGrid({
  title,
  endpoint,
  itemsPerRow = 2,
  insertComponent,
  insertEvery = 2,
}: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  async function load(pageToLoad = 1) {
    setLoading(true);

    try {
      const url = `${endpoint}${
        endpoint.includes("?") ? "&" : "?"
      }page=${pageToLoad}&limit=20`;

      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erro na API");
      }

      const data = await res.json();

      console.table(
        data.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          nome: p.name,
        }))
      );

      if (pageToLoad === 1) {
        setProducts(data);
      } else {
        setProducts((prev) => [...prev, ...data]);
      }

      if (data.length < 20) {
        setHasMore(false);
      }
    } catch (err) {
      console.log("Erro carregando produtos", err);
      setProducts([]);
      setHasMore(false);
    }

    setLoading(false);
  }

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    load(1);
  }, [endpoint]);

  return (
    <section className="gridSection">

      <h2
        style={{
          marginBottom: 30,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {title}
      </h2>

      <div className="productsGrid">

        {/* LOADING INICIAL */}
        {loading &&
          products.length === 0 &&
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 300,
                borderRadius: 18,
                background: "#f3f3f3",
                border: "1px solid #e5e5e5",
              }}
            />
          ))}

        {/* ESTADO VAZIO */}
        {!loading && products.length === 0 ? (
          <div className={styles.emptyProducts}>

            <div className={styles.emptyProductsIcon}>
              🔎
            </div>

            <h3>
              Nenhum produto encontrado
            </h3>

            <p>
              Não encontramos produtos para os filtros selecionados.
              <br />
              Tente escolher outra marca, categoria ou remover algum filtro.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Limpar filtros
            </button>

          </div>
        ) : (

          /* PRODUTOS */
          products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
            />
          ))

        )}

      </div>

      {/* BOTÃO VER MAIS */}
      {hasMore && !loading && products.length > 0 && (
        <div
          style={{
            textAlign: "center",
            marginTop: 30,
          }}
        >
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              load(nextPage);
            }}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: "#000",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Ver mais
          </button>
        </div>
      )}

      {/* LOADING AO CARREGAR MAIS */}
      {loading && products.length > 0 && (
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Carregando mais produtos...
        </p>
      )}

    </section>
  );
}