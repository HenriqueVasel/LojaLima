import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/getUserId";
import { calcularPrecoVenda } from "@/app/lib/pricing";
import { getFinalPrice } from "@/app/lib/price";

/* ==========================
GET - Buscar carrinho
========================== */
export async function GET() {

  try {

    const userId =
      await getUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const cartItems =
      await prisma.cartitem.findMany({
        where: {
          userId,
        },

        include: {
          product: {
           include: {
  promotion: true,
  productimage: true,
  stock: true,
},
          },

          productvariant: true,
        },
      });

    /* ==========================
    PREÇOS BACKEND
    ========================== */
    const cartWithMarkup =
      cartItems.map((item) => {

        const basePrice =
          item.productvariant
            ?.priceCents ??
          item.product.priceCents;

       let priceCents = 0;

// 🔥 KIT USA PREÇO FIXO
if (item.product.isKit) {

  priceCents =
    item.product.priceCents;

}

// 🔥 PRODUTO NORMAL
else {

  const originalPrice =
    calcularPrecoVenda(
      basePrice
    );

  priceCents =
    getFinalPrice({
      ...item.product,
      priceCents:
        originalPrice,
    });

}
        return {
          ...item,

          // preço final item
          priceCents,

          // produto atualizado
         product: {
  ...item.product,

  stock:
    item.product.stock?.quantity || 0,

  slug: item.product.slug,

  sku:
    item.product.sku,

  images:
    item.product
      .productimage,

  priceCents:

    item.product.isKit

      ? item.product.priceCents

      : getFinalPrice({
          ...item.product,

          priceCents:
            calcularPrecoVenda(
              item.product.priceCents
            ),
        }),
},

          // variante
          productvariant:
            item.productvariant
              ? {
                  ...item.productvariant,

                  priceCents:
                    getFinalPrice({
                      ...item.product,

                      priceCents:
                        calcularPrecoVenda(
                          item
                            .productvariant
                            .priceCents ??
                            0
                        ),
                    }),
                }
              : null,
        };
      });

    return NextResponse.json(
      cartWithMarkup
    );

  } catch (error: any) {

    if (
      error.message ===
        "UNAUTHORIZED" ||
      error.message ===
        "INVALID_TOKEN"
    ) {
      return NextResponse.json(
        {
          error:
            "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Erro ao buscar carrinho",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================
POST - Adicionar item
========================== */
export async function POST(
  req: Request
) {

  try {

    const userId =
      await getUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json();

    const {
      productId,
      variantId,
      qty,
    } = body;

    /* ==========================
    QUANTIDADE
    ========================== */
    const quantity = Number(
      qty || 1
    );

    if (
      isNaN(quantity) ||
      quantity <= 0 ||
      quantity > 20
    ) {
      return NextResponse.json(
        {
          error:
            "Quantidade inválida",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================
    PRODUCT ID
    ========================== */
    if (!productId) {
      return NextResponse.json(
        {
          error:
            "Produto inválido",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================
    PRODUTO EXISTE?
    ========================== */
    const product =
      await prisma.product.findUnique({
        where: {
          id: Number(productId),
        },

        include: {
          stock: true,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Produto não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    /* ==========================
    ESTOQUE
    ========================== */
const stockQty =
  product.stock?.quantity || 0;

// 🔥 KIT IGNORA ESTOQUE
if (!product.isKit) {

  if (quantity > stockQty) {

    return NextResponse.json(
      {
        error:
          "Estoque insuficiente",
      },
      {
        status: 400,
      }
    );
  }

}

    /* ==========================
    ITEM EXISTENTE
    ========================== */
    const existing =
      await prisma.cartitem.findFirst({
        where: {
          userId,

          productId,

          variantId:
            variantId || null,
        },
      });

    if (existing) {

      const newQty =
        existing.qty +
        quantity;

      // evita ultrapassar estoque
      if (
        newQty > stockQty
      ) {
        return NextResponse.json(
          {
            error:
              "Quantidade maior que estoque",
          },
          {
            status: 400,
          }
        );
      }

      await prisma.cartitem.update({
        where: {
          id: existing.id,
        },

        data: {
          qty: newQty,
        },
      });

    } else {

      await prisma.cartitem.create({
        data: {
          userId,

          productId,

          variantId:
            variantId || null,

          qty: quantity,
        },
      });
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {

    if (
      error.message ===
        "UNAUTHORIZED" ||
      error.message ===
        "INVALID_TOKEN"
    ) {
      return NextResponse.json(
        {
          error:
            "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Erro ao adicionar item",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================
DELETE - Limpar carrinho
========================== */
export async function DELETE() {

  try {

    const userId =
      await getUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    await prisma.cartitem.deleteMany({
      where: {
        userId,
      },
    });

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {

    if (
      error.message ===
        "UNAUTHORIZED" ||
      error.message ===
        "INVALID_TOKEN"
    ) {
      return NextResponse.json(
        {
          error:
            "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Erro ao limpar carrinho",
      },
      {
        status: 500,
      }
    );
  }
}