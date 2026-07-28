import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";
import { limparCarrinho } from "@/app/lib/cart";
import client from "@/app/lib/mercadopago";
import { Preference } from "mercadopago";
import { cookies } from "next/headers";
import { getUserId } from "@/app/lib/getUserId";
import { calcularPrecoVenda } from "@/app/lib/pricing";
import { sendOrderEmail } from "@/app/lib/email";
import { getFinalPrice } from "@/app/lib/price";


export async function POST(req: Request) {

  try {

    // ================= AUTENTICAÇÃO =================

const userId = await getUserId();

  

    

    // ================= BODY =================

    const body = await req.json();

const {
    customerName,
    customerEmail,
    customerWhats,

    customerType,
    customerCpf,
    customerCnpj,
    customerIe,

    customerObs,
    paymentMethod,
    retiradaLoja,
    endereco,
    numero,
    couponCode,
    shipping,

    guestCart = []

} = body;
    



    if (
  !retiradaLoja &&
  (!endereco || !endereco.cep)
){
  return NextResponse.json(
    { error: "Endereço não informado" },
    { status: 400 }
  );
}

    if (!customerName || !customerWhats) {
  return NextResponse.json(
    { error: "Dados obrigatórios faltando" },
    { status: 400 }
  );
}

if (customerType === "PF" && !customerCpf) {
  return NextResponse.json(
    { error: "CPF obrigatório" },
    { status: 400 }
  );
}

if (customerType === "PJ" && (!customerCnpj || !customerIe)) {
  return NextResponse.json(
    { error: "CNPJ e Inscrição Estadual são obrigatórios" },
    { status: 400 }
  );
}

    const allowedMethods = ["pix", "credito", "debito"];

    if (!allowedMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Método de pagamento inválido" },
        { status: 400 }
      );
    }


    // ================= CARRINHO =================

  let cartItems: any[] = [];

if (userId) {

  cartItems = await prisma.cartitem.findMany({
    where: { userId },
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

} else {

  if (!Array.isArray(guestCart) || guestCart.length === 0) {
    return NextResponse.json(
      { error: "Carrinho vazio" },
      { status: 400 }
    );
  }

  cartItems = await Promise.all(

    guestCart.map(async (item: any) => {

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

      if (!product) {
        throw new Error("Produto não encontrado");
      }

      let productvariant = null;

      if (item.variantId) {
        productvariant =
          await prisma.productvariant.findUnique({
            where: {
              id: item.variantId,
            },
          });
      }

      return {
        id: item.id,
        qty: item.qty,
        productId: product.id,
        variantId: item.variantId,
        product,
        productvariant,
      };

    })

  );

}

if (!cartItems.length) {

  return NextResponse.json(
    {
      error: "Carrinho vazio",
    },
    {
      status: 400,
    }
  );

}
    

let freteCents = 0;

if (!retiradaLoja) {

  if (!shipping) {
    return NextResponse.json(
      {
        error: "Frete não selecionado"
      },
      {
        status: 400
      }
    );
  }

  freteCents = Math.round(
    Number(shipping.price) * 100
  );

}

    // ================= TOTAL =================
    let discountCents = 0;
    let totalCents = 0;

    

    for (const item of cartItems) {

    // 🔥 KIT IGNORA ESTOQUE
if (!item.product.isKit) {

  const stockQty =
    item.product.stock?.quantity || 0;

  if (stockQty < item.qty) {

    return NextResponse.json(
      {
        error: `Produto ${item.product.name} sem estoque`
      },
      { status: 400 }
    );

  }

}

   const basePrice =
  item.productvariant?.priceCents ??
  item.product.priceCents;

// 🔥 KIT USA PREÇO FIXO
if (item.product.isKit) {

  totalCents +=
    item.product.priceCents *
    item.qty;

}

// 🔥 PRODUTO NORMAL
else {

  const originalPrice =
    calcularPrecoVenda(basePrice);

  const finalPrice =
    getFinalPrice({
      ...item.product,
      priceCents: originalPrice,
    });

  totalCents +=
    finalPrice *
    item.qty;

}

    }

    const subtotalCents = totalCents;

    totalCents += freteCents || 0;

    if (couponCode) {

  const coupon = await prisma.coupon.findUnique({
    where: {
      code: couponCode
    }
  });
if (
  coupon &&
  coupon.code === "WIFI25" &&
  paymentMethod !== "pix"
) {
  return NextResponse.json(
    {
      error: "Cupom WIFI25 válido apenas para PIX"
    },
    {
      status: 400
    }
  );
}



  if (
    coupon &&
    coupon.active
  ) {

    const subtotal = totalCents;

    // validade
    if (
      coupon.expires_at &&
      new Date(coupon.expires_at) < new Date()
    ) {
      throw new Error("Cupom expirado");
    }

    // mínimo
    if (
      subtotal >= Number(coupon.min_purchase)
    ) {

   if (coupon.type === "percent") {

  // CUPOM DE PRODUTO ESPECÍFICO
  if (coupon.product_id) {

    const itemCupom = cartItems.find(
      item => item.productId === coupon.product_id
    );

    if (itemCupom) {

      const basePrice =
        itemCupom.productvariant?.priceCents ??
        itemCupom.product.priceCents;

      const finalPrice =
        itemCupom.product.isKit
          ? itemCupom.product.priceCents
          : getFinalPrice({
              ...itemCupom.product,
              priceCents: calcularPrecoVenda(basePrice),
            });

      discountCents =
        Math.round(
          finalPrice *
          itemCupom.qty *
          (Number(coupon.value) / 100)
        );

    }

  }

  // CUPOM DE GRUPO
  else if (coupon.coupon_group) {

    let groupTotal = 0;

    for (const item of cartItems) {

      if (
        item.product.coupon_group ===
        coupon.coupon_group
      ) {

        const basePrice =
          item.productvariant?.priceCents ??
          item.product.priceCents;

        const finalPrice =
          item.product.isKit
            ? item.product.priceCents
            : getFinalPrice({
                ...item.product,
                priceCents:
                  calcularPrecoVenda(basePrice),
              });

        groupTotal +=
          finalPrice * item.qty;

      }

    }

    discountCents =
      Math.round(
        groupTotal *
        (Number(coupon.value) / 100)
      );

  }

  else {

    discountCents =
      Math.round(
        subtotal *
        (Number(coupon.value) / 100)
      );

  }

}

      if (coupon.type === "fixed") {

        discountCents =
          Number(coupon.value) * 100;

      }

    }

  }

}

   

    totalCents =
  Math.max(
    totalCents - discountCents,
    0
  );

  const isFreeOrder = totalCents === 0;

// 🔥 KIT NÃO TEM DESCONTO PIX
if (
  paymentMethod === "pix" &&
  couponCode !== "WIFI25" &&
  !cartItems.some(
    item => item.product.isKit
  )
) {

  const subtotalComDesconto =
    Math.round(
      (subtotalCents - discountCents) * 0.95
    );

  totalCents =
    subtotalComDesconto + freteCents;

}

    // ================= TRANSACTION =================

   const result = await prisma.$transaction(async (tx) => {

  const orderItemsData = [];

  for (const item of cartItems) {

    const fullProduct = await tx.product.findUnique({
      where: {
        id: item.productId
      },

      include: {
        kitItems: {
          include: {
            product: {
              include: {
                productimage: true
              }
            }
          }
        }
      }
    });

    // 🔥 KIT
    if (
      fullProduct?.isKit &&
      fullProduct.kitItems.length > 0
    ) {

      for (const kitItem of fullProduct.kitItems) {

        orderItemsData.push({

          productId: kitItem.product.id,

          variantId: null,

          slug: kitItem.product.slug,

          name: kitItem.product.name,

          priceCents: Math.round(
            item.product.priceCents /
            fullProduct.kitItems.length
          ),

          qty:
            kitItem.quantity *
            item.qty,

          imageUrl:
            kitItem.product.productimage[0]?.url || ""
        });
      }

    }

    // 🔥 NORMAL
    else {

      orderItemsData.push({

        productId: item.productId,

        variantId: item.variantId,

        slug: item.product.slug,

        name: item.product.name,

        priceCents: getFinalPrice({
          ...item.product,

          priceCents:
            calcularPrecoVenda(
              item.productvariant?.priceCents ??
              item.product.priceCents
            ),
        }),

        qty: item.qty,

        imageUrl:
          item.product.productimage[0]?.url || ""
      });
    }
  }

  const order = await tx.order.create({
    data: {

      userId,
      status: "pending",
      totalCents,
      shippingCents: freteCents || 0,

      customerName,
      customerEmail: customerEmail || "",

      customerWhats,

customerCpf: customerCpf || "",
customerType,
customerCnpj,
customerIe,

customerObs: customerObs || "",

      // 🔥 ENDEREÇO
      cep: endereco?.cep || "",
      city: endereco?.cidade || "",
      state: endereco?.uf || "",
      street: endereco?.logradouro || "",
      neighborhood: endereco?.bairro || "",
      number: numero || "",

      orderitem: {
        create: orderItemsData
      }

    }
  });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "mercadopago",
          status: "pending",
          amountCents: totalCents
        }
      });

      

      return { order, payment };

    });

    const fullOrder = await prisma.order.findUnique({
  where: { id: result.order.id },
  include: { orderitem: true }
});


if (isFreeOrder) {

  await prisma.order.update({
    where: {
      id: result.order.id
    },
    data: {
      status: "paid"
    }
  });

  return NextResponse.json({
    success: true,
    freeOrder: true,
    orderId: result.order.id
  });

}

    // ================= MERCADO PAGO =================

    const preference = new Preference(client);

const baseUrl = "https://lojalimaelima.com.br";

const preferenceData = await preference.create({
  body: {
    items: [

  ...cartItems.map(item => ({
    id: String(item.productId),
    title: item.product.name,
    quantity: item.qty,

unit_price:

  item.product.isKit

    ? item.product.priceCents / 100

    : (

     paymentMethod === "pix" &&
couponCode !== "WIFI25"

  ? Math.round(
      getFinalPrice({
        ...item.product,
        priceCents: calcularPrecoVenda(
          item.productvariant?.priceCents ??
          item.product.priceCents
        ),
      }) * 0.95
    )

  : getFinalPrice({
      ...item.product,
      priceCents: calcularPrecoVenda(
        item.productvariant?.priceCents ??
        item.product.priceCents
      ),
    })
      ) / 100,

    currency_id: "BRL"
  })),

  {
    id: "frete",
    title: "Frete",
    quantity: 1,
    unit_price: (freteCents || 0) / 100,
    currency_id: "BRL"
  },

  ...(discountCents > 0
    ? [{
        id: "discount",
        title: "Cupom de desconto",
        quantity: 1,
        unit_price: -(discountCents / 100),
        currency_id: "BRL"
      }]
    : []),

   
],



  payer: {
  email: customerEmail,
 identification: {
  type: customerType === "PJ" ? "CNPJ" : "CPF",
number:
  customerType === "PJ"
    ? (customerCnpj || "").replace(/\D/g, "")
    : (customerCpf || "").replace(/\D/g, "")
}
},

payment_methods:

  cartItems.some(
    item => item.product.isKit
  )

    ? {

        installments: 1,

        default_installments: 1,

      }

    : (

        paymentMethod === "pix"

          ? {
              default_payment_method_id: "pix"
            }

          : undefined

      ),

   

    external_reference: String(result.order.id),

    // 🔥 ESSENCIAL (webhook)
    notification_url: `${baseUrl}/api/payment/webhook`,

    // 🔥 ESSENCIAL (retorno correto)
    back_urls: {
      success: `${baseUrl}/pagamento/retorno?orderId=${result.order.id}`,
      failure: `${baseUrl}/pagamento/retorno?orderId=${result.order.id}`,
      pending: `${baseUrl}/pagamento/retorno?orderId=${result.order.id}`
    },

    
  }
});

    // ================= RESPONSE =================

    return NextResponse.json({
  success: true,
  orderId: result.order.id,
  paymentId: result.payment.id,
  totalCents,

  customerType,
  customerCpf,
  customerCnpj,
  customerIe,

  paymentMethod,
  init_point: preferenceData.init_point
});

  } catch (error) {

    console.error("ERRO CHECKOUT:");
console.error(error);

if (error instanceof Error) {
  console.error(error.message);
}

console.error(JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Erro no checkout" },
      { status: 500 }
    );

  }

}