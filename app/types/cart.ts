export type CartProduct = {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  sku: string;
  stock: number;
  isKit: boolean;
  images?: { url: string }[];
};

export type CartItem = {
  id: number;
  qty: number;
  product: CartProduct;
};