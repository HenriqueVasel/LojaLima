import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { calcularPrecoVenda } from "@/app/lib/pricing";
import { getFinalPrice } from "@/app/lib/price";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const guestCart: {
      productId: number;
      variantId?: number | null;
      qty: number;
    }[] = body.guestCart || [];

    if (!Array.isArray(guestCart)) {
      return NextResponse.json([], { status: 200 });
    }

    const cart = await Promise.all(
      guestCart.map(async (item, index) => {
        const product = await prisma.product.findUnique({
          where: {
            id: Number(item.productId),
          },
          include: {
  promotion: true,
  productimage: true,
  stock: true,
},
        });

        if (!product) return null;

        const variant = item.variantId
          ? await prisma.productvariant.findUnique({
              where: {
                id: item.variantId,
              },
            })
          : null;

        const basePrice =
          variant?.priceCents ?? product.priceCents;

        const priceCents = product.isKit
          ? product.priceCents
          : getFinalPrice({
              ...product,
              priceCents: calcularPrecoVenda(basePrice),
            });

        return {
          id: -(index + 1),

          qty: item.qty,

          variantId: item.variantId ?? null,

          product: {
  ...product,

  stock: product.stock?.quantity || 0,

  images: product.productimage,

  priceCents,
},
          productvariant: variant
            ? {
                ...variant,
                priceCents,
              }
            : null,
        };
      })
    );

    return NextResponse.json(
      cart.filter(Boolean)
    );

} catch (error) {

  console.error("ERRO CART GUEST:", error);

  return NextResponse.json(
    {
      error: "Erro ao montar carrinho",
    },
    {
      status: 500,
    }
  );

}
}