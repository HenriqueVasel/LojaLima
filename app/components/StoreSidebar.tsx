"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/app/styles/loja.module.css";

export default function StoreSidebar() {
  const router = useRouter();
  const params = useSearchParams();

  const [categories, setCategories] = useState<
  {
    id: number;
    name: string;
    slug: string;
  }[]
>([]);

const [loadingCategories, setLoadingCategories] = useState(true);
const [categorySearch, setCategorySearch] = useState("");
const [showAllCategories, setShowAllCategories] = useState(false);

useEffect(() => {
  async function loadCategories() {
    try {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        throw new Error("Erro ao buscar categorias");
      }

      const data = await response.json();

      setCategories(data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setLoadingCategories(false);
    }
  }

  loadCategories();
}, []);

  const [min, setMin] = useState(
    Number(params.get("min") || 0)
  );

  const [max, setMax] = useState(
    Number(params.get("max") || 60000)
  );

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function applyFilters() {
    const searchParams = new URLSearchParams(params.toString());

    searchParams.set("min", String(min));
    searchParams.set("max", String(max));

    router.push(`/loja?${searchParams.toString()}`);
  }

  function handleMinChange(value: number) {
    if (value >= max) return;

    setMin(value);
  }

  function handleMaxChange(value: number) {
    if (value <= min) return;

    setMax(value);
  }

  const filteredCategories = categories.filter((category) =>
  category.name
    .toLowerCase()
    .includes(categorySearch.toLowerCase())
);

const visibleCategories = showAllCategories
  ? filteredCategories
  : filteredCategories.slice(0, 7);

  return (
    <aside className={styles.sidebar}>

      {/* CABEÇALHO */}

      <div className={styles.sidebarHeader}>
        <h2>Filtros</h2>

        <button
          type="button"
          onClick={() => router.push("/loja")}
          className={styles.clearFilters}
        >
          Limpar
        </button>
      </div>


     {/* CATEGORIA */}

<div className={styles.filterSection}>

  <button
    type="button"
    className={styles.filterTitle}
  >
    <span>Categoria</span>
    <span>⌃</span>
  </button>

  <div className={styles.filterContent}>

    {/* BUSCA */}

    <div className={styles.filterSearch}>

      <span className={styles.searchIcon}>
        ⌕
      </span>

      <input
        type="text"
        placeholder="Buscar categoria..."
        value={categorySearch}
        onChange={(e) =>
          setCategorySearch(e.target.value)
        }
      />

    </div>


    {/* CATEGORIAS */}

    {loadingCategories ? (

      <p className={styles.filterPlaceholder}>
        Carregando categorias...
      </p>

    ) : (

      <div className={styles.categoryList}>

        {visibleCategories.map((item) => {

          const selected =
            params.get("category") === item.slug;

          return (

            <label
              key={item.id}
              className={styles.checkboxItem}
            >

              <input
                type="checkbox"
                checked={selected}
                onChange={() => {

                  const searchParams =
                    new URLSearchParams(
                      params.toString()
                    );

                  searchParams.set(
                    "category",
                    item.slug
                  );

                  router.push(
                    `/loja?${searchParams.toString()}`
                  );

                }}
              />

              <span>
                {item.name}
              </span>

            </label>

          );

        })}

      </div>

    )}


    {/* VER MAIS */}

    {!categorySearch &&
      filteredCategories.length > 7 && (

      <button
        type="button"
        className={styles.showMoreButton}
        onClick={() =>
          setShowAllCategories(
            !showAllCategories
          )
        }
      >

        {showAllCategories
          ? "Ver menos"
          : "Ver mais"}

        <span>
          {showAllCategories ? "⌃" : "⌄"}
        </span>

      </button>

    )}

  </div>

</div>

      {/* MARCA */}

      <div className={styles.filterSection}>

        <button
          type="button"
          className={styles.filterTitle}
        >
          <span>Marca</span>
          <span>⌃</span>
        </button>

        <div className={styles.filterContent}>

          <label className={styles.checkboxItem}>
            <input type="checkbox" />
            <span>Intelbras</span>
          </label>

        </div>

      </div>


      {/* PREÇO */}

      <div className={styles.filterSection}>

        <button
          type="button"
          className={styles.filterTitle}
        >
          <span>Preço</span>
          <span>⌃</span>
        </button>

        <div className={styles.filterContent}>

          <div className={styles.priceValues}>
            <span>{formatPrice(min)}</span>
            <span>{formatPrice(max)}</span>
          </div>

          <div className={styles.slider}>

            <input
              type="range"
              min="0"
              max="60000"
              value={min}
              onChange={(e) =>
                handleMinChange(Number(e.target.value))
              }
            />

            <input
              type="range"
              min="0"
              max="60000"
              value={max}
              onChange={(e) =>
                handleMaxChange(Number(e.target.value))
              }
            />

          </div>

          <button
            type="button"
            className={styles.applyButton}
            onClick={applyFilters}
          >
            Aplicar filtros
          </button>

        </div>

      </div>


      {/* DISPONIBILIDADE */}

      <div className={styles.filterSection}>

        <button
          type="button"
          className={styles.filterTitle}
        >
          <span>Disponibilidade</span>
          <span>⌃</span>
        </button>

        <div className={styles.filterContent}>

          <label className={styles.checkboxItem}>
            <input type="checkbox" />
            <span>Em estoque</span>
          </label>

        </div>

      </div>


      {/* PROMOÇÕES */}

      <div className={styles.filterSection}>

        <button
          type="button"
          className={styles.filterTitle}
        >
          <span>Promoções</span>
          <span>⌃</span>
        </button>

        <div className={styles.filterContent}>

          <label className={styles.checkboxItem}>
            <input type="checkbox" />
            <span>Somente produtos em oferta</span>
          </label>

        </div>

      </div>

    </aside>
  );
}