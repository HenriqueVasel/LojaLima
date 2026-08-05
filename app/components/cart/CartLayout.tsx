"use client";

import s from "@/app/styles/carinho.module.css";

type Props = {
  productsSlot: React.ReactNode;
  summarySlot: React.ReactNode;
};

// OBS: a imagem de referência tem um stepper no topo
// (Carrinho -> Entrega -> Pagamento). Essa página é só o step 1,
// então não há lógica de "etapa atual" hoje. Se quiser esse
// indicador aqui, dá pra criar um componente visual estático
// (sem novo state) marcando sempre "Carrinho" como ativo.
export function CartLayout({ productsSlot, summarySlot }: Props) {
  return (
    <div className={s.page}>
      <h1 className={s.title}>Carrinho</h1>

      <div className={s.grid}>
        <div className={s.left}>{productsSlot}</div>
        {summarySlot}
      </div>
    </div>
  );
}