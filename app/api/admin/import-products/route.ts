import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { prisma } from "@/lib/prisma";
import { analyzeProduct } from "@/app/lib/catalogEngine";

/* =========================
FORÇA RUNTIME (não roda no build)
========================= */
export const dynamic = "force-dynamic";

/* =========================
FUNÇÃO DE CATEGORIA
========================= */
function getCategorySlug(name: string) {
  const n = name.toLowerCase();

  if (
    n.includes("camera") ||
    n.includes("vhd") ||
    n.includes("vhl") ||
    n.includes("vip") ||
    n.includes("mhdx") ||
    n.includes("imhdx") ||
    n.includes("invd") ||
    n.includes("invu") ||
    n.includes("nvd") ||
    n.includes("nvr")
  ) return "cameras";

  if (
    n.includes("acionador") ||
    n.includes("fechadura") ||
    n.includes("controle de acesso") ||
    n.includes("portao") ||
    n.includes("alarme")
  ) return "seguranca";

  if (
    n.includes("roteador") ||
    n.includes("switch") ||
    n.includes("wifi")
  ) return "redes";

  if (
    n.includes("nobreak") ||
    n.includes("fonte") ||
    n.includes("inversor") ||
    n.includes("bateria") ||
    n.includes("energia") ||
    n.includes("power")
  ) return "energia";

  if (
    n.includes("arandela") ||
    n.includes("acustica")
  ) return "audio";

  const acessoriosTerms = [
    "cabo",
    "conector",
    "plug",
    "adaptador",
    "extensao",
    "extensão",
    "patch",
    "cord",
    "keystone",
    "rj45",
  ];

  if (acessoriosTerms.some((term) => n.includes(term))) {
    return "acessorios";
  }

  return "acessorios";
}

/* =========================
IMPORTAÇÃO VIA UPLOAD
========================= */
export async function POST(req: Request) {

  /* =========================
  🔒 AUTENTICAÇÃO
  ========================= */
  const authHeader = req.headers.get("authorization");

  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {

    const formData = await req.formData();

    const file = formData.get("file") as File;

    /* =========================
    📁 VALIDAÇÕES
    ========================= */

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 }
      );
    }

    // limite 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande" },
        { status: 400 }
      );
    }

    // valida extensão
    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      return NextResponse.json(
        { error: "Formato inválido" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const workbook = xlsx.read(buffer, {
      type: "buffer",
    });

    const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const data: any[] =
      xlsx.utils.sheet_to_json(sheet);

    /* =========================
    🔥 CACHE DE CATEGORIAS
    ========================= */
    const categoryCache = new Map<
      string,
      any
    >();

    /* =========================
    🔥 LOTE CONTROLADO
    ========================= */
    const BATCH_SIZE = 2;

    for (
      let i = 0;
      i < data.length;
      i += BATCH_SIZE
    ) {

      const batch = data.slice(
        i,
        i + BATCH_SIZE
      );

      for (const item of batch) {

        if (
          !item.CODPROD ||
          !item.DESCRPROD
        ) continue;

        const name = String(
          item.DESCRPROD
        ).trim();

        const sku = String(
          item.CODPROD
        ).trim();

        const baseSlug = name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const slug = `${baseSlug}-${sku}`;

        const categorySlug =
          getCategorySlug(name);

          const catalog = analyzeProduct({
  name,
  brand: item.MARCA,
});

let brandId: number | null = null;

if (catalog.brand) {

  const slug = catalog.brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const brand = await prisma.brand.upsert({

    where: {
      slug,
    },

    update: {},

    create: {
      name: catalog.brand,
      slug,
    },

  });

  brandId = brand.id;

}

console.log("CATALOG:", {
  produto: name,
  resultado: catalog,
});

        /* =========================
        🔥 CACHE CATEGORY
        ========================= */
        let category =
          categoryCache.get(
            categorySlug
          );

        if (!category) {

          category =
            await prisma.category.upsert({
              where: {
                slug: categorySlug,
              },

              update: {},

              create: {
                name: categorySlug,
                slug: categorySlug,
                active: true,
              },
            });

          categoryCache.set(
            categorySlug,
            category
          );
        }

        /* =========================
        💰 PREÇO
        ========================= */
        const price = Number(
          String(
            item.PRECO || "0"
          ).replace(",", ".")
        );

        // evita NaN
        if (isNaN(price)) continue;

        const priceCents = Math.round(
          price * 100
        );

        /* =========================
        🚀 UPSERT PRODUTO
        ========================= */
        await prisma.product.upsert({

          where: { sku },

          update: {
            name,
            slug,
            priceCents,

            brand: item.MARCA,
            brandRefId: brandId,

            active:
              item.FORA_LINHA !== "S",

            productcategory: {
              deleteMany: {},

              create: [
                {
                  categoryId:
                    category.id,
                },
              ],
            },
          },

          create: {
            name,
            slug,

            description: name,

            priceCents,

            brand: item.MARCA,
            brandRefId: brandId,

            sku,

            active: true,

            productcategory: {
              create: [
                {
                  categoryId:
                    category.id,
                },
              ],
            },
          },
        });
      }

      /* =========================
      🪵 LOGS
      ========================= */
      if (
        process.env.NODE_ENV !==
        "production"
      ) {
        console.log(
          `✅ Lote ${i} - ${
            i + BATCH_SIZE
          }`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Importação concluída 🚀",
    });

  } catch (error: any) {

    console.error(
      "ERRO REAL:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Erro ao importar",
      },
      { status: 500 }
    );
  }
}