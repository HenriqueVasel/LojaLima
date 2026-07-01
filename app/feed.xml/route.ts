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
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

      if (!image) return "";

      const additionalImages = product.productimage
        .slice(1)
        .map(
          (img) =>
            `<g:additional_image_link>${escapeXml(
              img.url.startsWith("http")
                ? img.url
                : `https://lojalimaelima.com.br${img.url}`
            )}</g:additional_image_link>`
        )
        .join("");

      const category =
        product.productcategory
          .map((c) => c.category.name)
          .join(" > ") || "Produtos";

      const price = (product.priceCents / 100).toFixed(2);

      return `
      <item>

        <g:id>${product.id}</g:id>

        <title>${escapeXml(product.name)}</title>

        <description>${escapeXml(
          cleanHtml(product.description ?? "")
        )}</description>

        <link>https://lojalimaelima.com.br/produto/${product.slug}</link>

        <g:image_link>${escapeXml(
          image.url.startsWith("http")
            ? image.url
            : `https://lojalimaelima.com.br${image.url}`
        )}</g:image_link>

        ${additionalImages}

        <g:brand>${escapeXml(product.brand ?? "Intelbras")}</g:brand>

        ${
          product.ean
            ? `<g:gtin>${product.ean}</g:gtin>`
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

        <g:product_type>${escapeXml(category)}</g:product_type>

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