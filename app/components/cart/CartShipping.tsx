"use client";

import s from "@/app/styles/carinho.module.css";
import FreteCalculator from "@/app/components/FreteCalculator";
import type { CartItem } from "@/app/types/cart";

type Props = {
  items: CartItem[];
};

// OBS: nesta página (carrinho) a UI de "opções de entrega" em radio,
// igual à da imagem de referência, não existe hoje — quem controla
// isso é o FreteCalculator internamente. Se no futuro quiser exibir
// as opções (transportadora / retirada / sob consulta) aqui fora,
// vai precisar expor esse estado do FreteCalculator (callback ou
// contexto), o que é uma mudança de lógica e não só de layout.
export function CartShipping({ items }: Props) {
  return (
    <div className={s.freteWrapper}>
      <FreteCalculator dark saveToCart items={items} />
    </div>
  );
}