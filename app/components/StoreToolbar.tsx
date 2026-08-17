"use client";

import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/app/styles/loja.module.css";

type Props = {
  onOpenFilters?: () => void;
};

export default function StoreToolbar({
  onOpenFilters,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const sort = params.get("sort") || "recent";

  function changeSort(value: string) {
    const searchParams = new URLSearchParams(params.toString());

    searchParams.set("sort", value);

    router.push(`/loja?${searchParams.toString()}`);
  }

  return (
    <div className={styles.storeToolbar}>

      {/* BOTÃO FILTROS — MOBILE */}
      <button
        type="button"
        className={styles.mobileFilterButton}
        onClick={onOpenFilters}
      >
        ☰ Filtros
      </button>

      <div className={styles.sortBlock}>

        <label htmlFor="sort">
          Ordenar por
        </label>

        <select
          id="sort"
          value={sort}
          onChange={(e) => changeSort(e.target.value)}
        >
          <option value="recent">
            Mais recentes
          </option>

          <option value="bestsellers">
            Mais vendidos
          </option>

          <option value="price_asc">
            Menor preço
          </option>

          <option value="price_desc">
            Maior preço
          </option>
        </select>

      </div>

    </div>
  );
}