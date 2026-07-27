export const MARKUP = 0.45;

export function calcularPrecoVenda(priceCents: number) {
  return Math.round(priceCents * (1 + MARKUP));
}