import { prisma } from "@/app/lib/prisma";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductImage from "@/app/components/ProductImage";
import s from "@/app/styles/product.module.css";
import ProductGallery from "@/app/components/ProductGallery";
import FreteCalculator from "@/app/components/FreteCalculator";
import { calcularPrecoVenda } from "@/app/lib/pricing";
import Link from "next/link";
import { getFinalPrice } from "@/app/lib/price";
import { FaWhatsapp } from "react-icons/fa";
import ProductAnalytics from "@/app/components/ProductAnalytics";
import Script from "next/script";
import BuyNowButton from "@/app/components/BuyNowButton";

import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Truck,
  MessageSquare,
  BadgeCheck
} from "lucide-react";





export default async function ProdutoPage({ params }: any) {

  const { slug } = await params;

 const produto = await prisma.product.findUnique({
  where: { slug },
include: {

  promotion: true,

  productimage: {
    orderBy: {
      sortOrder: "asc"
    }
  },

  productcategory: true
}
});

  if (!produto) {
    return (
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 20px",
          color: "var(--text)"
        }}
      >
        <h2>Produto não encontrado</h2>
        <p>
          Slug recebido: <b>{slug}</b>
        </p>
      </div>
    );
  }

  /* =========================
  PRODUTOS RELACIONADOS
  ========================= */

const relacionados = await prisma.product.findMany({
  where: {
    active: true,
    id: { not: produto.id },

    
    productcategory: produto.productcategory?.length
      ? {
          some: {
            categoryId: produto.productcategory[0].categoryId
          }
        }
      : undefined
  },

  include: {
    productimage: {
      orderBy: {
        sortOrder: "asc"
      }
    }
  },

  take: 4,
});

// 🔥 KIT USA PREÇO FIXO
const precoOriginalCents =

  produto.isKit

    ? produto.priceCents

    : calcularPrecoVenda(
        produto.priceCents
      );

// 🔥 KIT NÃO APLICA PROMO
const precoFinalCents =

  produto.isKit

    ? produto.priceCents

    : getFinalPrice({
        ...produto,
        priceCents: precoOriginalCents,
      });

const hasPromotion =
  precoFinalCents < precoOriginalCents;

const preco =
  precoOriginalCents / 100;

const precoFinal =
  precoFinalCents / 100;

// 🔥 KIT NÃO TEM DESCONTO PIX
const descontoPix =

  produto.isKit

    ? 0

    : Math.round(
        precoFinal * 0.05 * 100
      ) / 100;

const precoPix =
  precoFinal - descontoPix;

  const WHATSAPP_LINK =
    "https://wa.me/554738423235?text=" +
    encodeURIComponent(
      `Olá! Quero informações sobre o produto: ${produto.name}`
    );

    const descricaoLimpa = (produto.description || "")
  .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");

  return (
    <div className="lightTheme">

          <ProductAnalytics
      id={produto.id}
      name={produto.name}
      price={precoFinal}
    />

      
    <div className={s.page}>

      <div className={s.grid}>

      {/* COLUNA ESQUERDA */}

<div className={s.leftColumn}>

  {/* IMAGEM */}
  <div className={s.imageWrap}>

    <ProductGallery
  images={
    produto.productimage.length > 0
      ? produto.productimage
      : [
          {
            url: "/produtos/placeholder.jpg",
          },
        ]
  }
  name={produto.name}
  sku={produto.sku}
/>

  </div>



 

</div>
        {/* INFORMAÇÕES */}

        <div className={s.infoColumn}>

  <div className={s.breadcrumb}>
    <Link href="/">Início</Link>
    <span>›</span>
    <span>Câmeras</span>
    <span>›</span>
    <span>{produto.name}</span>
  </div>

  <h1 className={s.title}>
    {produto.name}
  </h1>

<div className={s.topInfo}>
  <span>⭐⭐⭐⭐⭐ 4.9 (18 avaliações)</span>
  <span>•</span>
  <span>Código: {produto.id}</span>
  <span>•</span>
  <span>Intelbras</span>
</div>

{/* PREÇO + PAGAMENTO */}

<div
  className={s.priceCard}
  style={{
    marginTop: 0,
  }}
>

 

{/* preço antigo */}
{hasPromotion && (
  <div
    style={{
      color: "#999",
      fontSize: 20,
      textDecoration: "line-through",
      marginBottom: 6,
      fontWeight: 500,
    }}
  >
    {preco.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}
  </div>
)}

{/* preço PIX destaque */}
<div
  style={{
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: 4,
    color: "#111",
  }}
>
  {precoPix.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}
</div>

<div
  style={{
    fontSize: 14,
    color: "#16a34a",
    fontWeight: 700,
    marginBottom: 12,
  }}
>
  {produto.isKit
  ? "Preço promocional à vista"
  : "no PIX com 5% OFF"}
</div>

{!produto.isKit && (

  <div
    style={{
      fontSize: 14,
      marginTop: 4,
      color: "#444",
    }}
  >
    ou{" "}
    <strong>
      {precoFinal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}
    </strong>{" "}
    em até 3x sem juros
  </div>

)}


{/* badge OFF */}
{hasPromotion && produto.promotion && (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "#16a34a",
      color: "#fff",
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 10,
    }}
  >
    {produto.promotion.discountValue}% OFF
  </div>
)}

{hasPromotion && (
  <div
    style={{
      fontSize: 14,
      color: "#666",
      marginTop: 6,
      marginBottom: 10,
    }}
  >
    De{" "}
    <strong>
      {preco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}
    </strong>{" "}
    por{" "}
    <strong>
      {precoFinal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}
    </strong>
  </div>
)}
  

  {/* parcelamento */}


<div className={s.paymentBox}>

  <div className={s.paymentTop}>

    <div className={s.paymentItem}>
      <CreditCard size={18} color="#22c55e" />

      <div>
        <div style={{fontWeight:600}}>
          {precoPix.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })} no boleto
        </div>

        <div style={{fontSize:12,color:"#666"}}>
          com 5% de desconto
        </div>
      </div>
    </div>

    <div className={s.paymentItem}>
      <QrCode size={18} color="#22c55e" />

      <div>
        <div style={{fontWeight:600}}>
          {precoPix.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })} no pix
        </div>

        <div style={{fontSize:12,color:"#666"}}>
          com 5% de desconto
        </div>
      </div>
    </div>

  </div>

  <div className={s.paymentBottom}>
    <CreditCard size={18} color="#22c55e" />

    <div>
      <div style={{fontWeight:600}}>
        {precoFinal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })} em até 3x sem juros
      </div>

      <div style={{fontSize:12,color:"#666"}}>
        no cartão de crédito
      </div>
    </div>
  </div>

</div>



  </div>





          {/* BOTÃO COMPRAR */}

          <div className={s.buyButtonWrap}>
     <AddToCartButton
  productId={produto.id}
  productName={produto.name}
  productPrice={precoFinal}
  productSlug={produto.slug}
  productImage={
    produto.productimage?.[0]?.url ||
    "/produtos/placeholder.jpg"
  }
/>

<BuyNowButton
  productId={produto.id}
/>


<div className={s.trustRow}>

  <div className={s.trustItem}>
    <ShieldCheck size={22} />
    <small>Compra 100% segura</small>
  </div>

  <div className={s.trustItem}>
    <Truck size={22} />
    <small>Entrega rápida para todo Brasil</small>
  </div>

 <div className={s.trustItem}>
  <BadgeCheck size={22} />
  <small>Suporte técnico especializado</small>
</div>

<div className={s.trustItem}>
  <MessageSquare size={22} />
  <small>Atendimento via WhatsApp</small>
</div>

</div>
          </div>

         

            <div className={s.freteCard}>
 <FreteCalculator
  simple
  items={[
    {
      id: produto.id,
      qty: 1,
      product: {
        id: produto.id,
      },
    },
  ]}
/>
</div>
            

        

       


          {/* BLOCO CONFIANÇA */}

         

        </div>

      </div>

         {/* DESCRIÇÃO */}
<div className={s.description}>

  <h3 style={{ marginBottom: 10 }}>
    Descrição
  </h3>

  <div
    style={{
      opacity: 0.9,
      
    }}
   dangerouslySetInnerHTML={{
  __html:
    descricaoLimpa ||
    "Produto profissional com alto desempenho.",
}}
  />

</div>


 {/* =========================
PRODUTOS RELACIONADOS
========================= */}

<div className={s.relatedSection}>
  <h2 className={s.relatedTitle}>
    Você também pode gostar
  </h2>

  <div className={s.relatedGrid}>
    {relacionados.map((p) => {

      const img =
        p.productimage?.[0]?.url ||
        "/produtos/placeholder.jpg";

      return (
        <Link
          key={p.id}
          href={`/produto/${p.slug}`}
          style={{ textDecoration: "none" }}
        >
          <div
            className={s.relatedCard}
            style={{
              padding: 0,
              borderRadius: 18,
          
              overflow: "hidden",
            }}
          >

            {/* IMAGEM */}
            <div
              className={s.relatedImageWrap}
              style={{
                height: 140,
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={img}
                alt={p.name}
                className={s.relatedImage}
                style={{
                  width: "120%",
                  height: "120%",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* CONTEÚDO */}
            <div
              className={s.relatedContent}
              style={{
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >

              {/* MARCA */}
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  marginBottom: 2,
                  fontWeight: 700,
                  letterSpacing: ".5px",
                }}
              >
                INTELBRAS
              </div>

              {/* TÍTULO */}
              <div
                className={s.relatedTitle}
                style={{
                  fontSize: 15,
                  lineHeight: 1.35,
                  fontWeight: 500,
                  color: "#222",
                  minHeight: 50,
                }}
              >
                {p.name}
              </div>

              {/* DESCRIÇÃO */}
              <div
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                  marginTop: 2,
                  lineHeight: 1.4,
                  fontWeight: 500,
                }}
              >
                {(p.description || "Produto profissional de alta qualidade.")
                  .replace(/<[^>]+>/g, "")
                  .slice(0, 58)}
                ...
              </div>

              {/* PREÇO */}
              <div
                style={{
                  color: "#16a34a",
                  fontSize: 18,
                  fontWeight: 800,
                  marginTop: 8,
                }}
              >
                {(
  (
    p.isKit
      ? p.priceCents
      : calcularPrecoVenda(
          p.priceCents
        )
  ) / 100
).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>

              {/* PARCELAMENTO */}
              <div
                style={{
                  marginTop: 0,
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
{p.isKit

  ? "Parcelamento disponível"

  : `3x de ${(
      calcularPrecoVenda(
        p.priceCents
      ) /
      100 /
      3
    ).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })} sem juros`
}
              </div>

            </div>
          </div>
        </Link>
      );
    })}
   </div>
</div>
<Script
  id="product-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",

      name: produto.name,

      image:
        produto.productimage?.length > 0
          ? produto.productimage.map((img) => img.url)
          : [],

      description:
        (produto.description || "")
          .replace(/<[^>]*>/g, "")
          .slice(0, 500),

      sku: produto.sku,

      gtin13: produto.ean,

     

      brand: {
        "@type": "Brand",
        name: produto.brand || "Intelbras",
      },

      manufacturer: {
        "@type": "Organization",
        name: produto.brand || "Intelbras",
      },

      weight: produto.weight
        ? {
            "@type": "QuantitativeValue",
            value: produto.weight,
            unitCode: "KGM",
          }
        : undefined,

      offers: {
        "@type": "Offer",
        url: `https://lojalimaelima.com.br/produto/${produto.slug}`,
        priceCurrency: "BRL",
        price: precoFinal,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",

        seller: {
          "@type": "Organization",
          name: "Lima e Lima",
        },
      },
    }),
  }}
/>

    </div>
  </div>
);
}