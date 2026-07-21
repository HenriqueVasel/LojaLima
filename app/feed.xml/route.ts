import { prisma } from "@/lib/prisma";

function escapeXml(str: string = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanHtml(text: string = "") {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;?/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getGoogleCategory(category: string) {
  const c = category.toLowerCase();

  if (c.includes("camera")) return "505825";
  if (c.includes("cftv")) return "505825";
  if (c.includes("fechadura")) return "793";
  if (c.includes("video porteiro")) return "761";
  if (c.includes("interfone")) return "761";
  if (c.includes("alarme")) return "364";
  if (c.includes("cerca")) return "364";
  if (c.includes("rede")) return "505284";
  if (c.includes("switch")) return "505284";
  if (c.includes("roteador")) return "505284";
  if (c.includes("telefonia")) return "505419";

  return "122"; // Eletrônicos
}

function optimizeTitle(product: {
  name: string;
  brand: string | null;
  productcategory: {
    category: {
      name: string;
    };
  }[];
}) {
  let title = product.name.trim();

  const brand = product.brand?.trim();

  // Adiciona a marca caso ela ainda não esteja no título
  if (
    brand &&
    !title.toLowerCase().includes(brand.toLowerCase())
  ) {
    title = `${brand} ${title}`;
  }

  const category =
    product.productcategory
      .map((c) => c.category.name.toLowerCase())
      .join(" ");

  if (
    category.includes("camera") &&
    !title.toLowerCase().includes("câmera")
  ) {
    title = `Câmera ${title}`;
  }

  if (
    category.includes("fechadura") &&
    !title.toLowerCase().includes("fechadura")
  ) {
    title = `Fechadura Digital ${title}`;
  }

  if (
    category.includes("roteador") &&
    !title.toLowerCase().includes("roteador")
  ) {
    title = `Roteador ${title}`;
  }

  if (
    category.includes("switch") &&
    !title.toLowerCase().includes("switch")
  ) {
    title = `Switch ${title}`;
  }

  if (
  category.includes("interfone") &&
  !title.toLowerCase().includes("interfone")
) {
  title = `Interfone ${title}`;
}

// Padroniza alguns termos
title = title
  .replace(/\bWI[- ]?FI\b/gi, "Wi-Fi")
  .replace(/\bFULL HD\b/gi, "Full HD")
  .replace(/\bHD\b/g, "HD");

return title.replace(/\s+/g, " ").trim();
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
    },
    include: {
      productimage: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      stock: true,
      promotion: true,
      productcategory: {
        include: {
          category: true,
        },
      },
    },
  });

  const items = products
    .map((product) => {
      const image = product.productimage[0];

// Não envia produto sem imagem
if (!image) return "";

// Não envia imagem placeholder
const imageUrl = image.url.startsWith("http")
  ? image.url
  : `https://lojalimaelima.com.br${image.url}`;

if (
  imageUrl.toLowerCase().includes("placeholder") ||
  imageUrl.toLowerCase().includes("sem-imagem") ||
  imageUrl.toLowerCase().includes("no-image")
) {
  return "";
}

      const additionalImages = product.productimage
  .slice(1)
  .filter((img) => {
    const url = img.url.toLowerCase();

    return (
      !url.includes("placeholder") &&
      !url.includes("sem-imagem") &&
      !url.includes("no-image")
    );
  })
  .map((img) => {
    const url = img.url.startsWith("http")
      ? img.url
      : `https://lojalimaelima.com.br${img.url}`;

    return `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`;
  })
  .join("");

      const category =
        product.productcategory
          .map((c) => c.category.name)
          .join(" > ") || "Produtos";

          const googleCategory = getGoogleCategory(category);

          const optimizedTitle = optimizeTitle(product);

          const description = cleanHtml(product.description ?? "").slice(0, 500);

      const finalPrice = Math.round(product.priceCents * 1.35);

const price = (finalPrice / 100).toFixed(2);

const now = new Date();

let salePrice: string | null = null;

if (
  product.promotion &&
  product.promotion.active &&
  (!product.promotion.startsAt || product.promotion.startsAt <= now) &&
  (!product.promotion.endsAt || product.promotion.endsAt >= now)
) {
  let promoPrice = product.priceCents * 1.35;

  if (product.promotion.discountType === "percentage") {
    promoPrice =
  promoPrice -
  Math.round(
    (promoPrice * product.promotion.discountValue) / 100
  );
  }

  if (product.promotion.discountType === "fixed") {
   promoPrice =
  promoPrice -
  Math.round(product.promotion.discountValue * 100);
  }

  if (promoPrice > 0 && promoPrice < product.priceCents) {
    salePrice = (promoPrice / 100).toFixed(2);
  }
}

      return `
      <item>

        <g:id>${product.id}</g:id>

       

        <title>${escapeXml(optimizedTitle)}</title>

    <description>${escapeXml(description)}</description>

        <link>https://lojalimaelima.com.br/produto/${product.slug}</link>

        <g:image_link>${escapeXml(imageUrl)}</g:image_link>

        ${additionalImages}

        <g:brand>${escapeXml(product.brand ?? "Intelbras")}</g:brand>

        ${
  product.ean
    ? `
      <g:gtin>${product.ean}</g:gtin>
      <g:identifier_exists>yes</g:identifier_exists>
    `
    : `<g:identifier_exists>no</g:identifier_exists>`
}

        ${
          product.sku
            ? `<g:mpn>${escapeXml(product.sku)}</g:mpn>`
            : ""
        }

        <g:condition>new</g:condition>

        <g:availability>${
          (product.stock?.quantity ?? 0) > 0
            ? "in_stock"
            : "out_of_stock"
        }</g:availability>

        <g:price>${price} BRL</g:price>

${
  salePrice
    ? `<g:sale_price>${salePrice} BRL</g:sale_price>`
    : ""
}

        <g:product_type>${escapeXml(category)}</g:product_type>


        <g:google_product_category>${googleCategory}</g:google_product_category>

        ${
  product.weight
    ? `<g:shipping_weight>${product.weight} kg</g:shipping_weight>`
    : ""
}

      </item>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
xmlns:g="http://base.google.com/ns/1.0">

<channel>

<title>Lima e Lima</title>

<link>https://lojalimaelima.com.br</link>

<description>Feed Google Merchant</description>

${items}

</channel>

</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}