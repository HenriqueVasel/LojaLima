import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import {
  classifyProduct,
  calculateScore,
  getStatus,
} from "@/app/lib/product-classifier";
import {
  extractProductAttributes,
} from "@/app/lib/product-attributes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function slugify(value: string): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function familyLabel(family: string): string {
  const labels: Record<string, string> = {
    cftv: "CFTV",
    alarmes: "Alarmes",
    "controle-acesso": "Controle de Acesso",
    porteiros: "Porteiros",
    redes: "Redes",
    telefonia: "Telefonia",
    energia: "Energia",
    automatizadores: "Automatizadores",
    fechaduras: "Fechaduras",
    cabeamento: "Cabeamento",
    antenas: "Antenas",
    ferramentas: "Ferramentas",
    monitores: "Monitores",
    "automacao": "Automação",
    acessorios: "Acessórios",
    informatica: "Informática",
  };

  return labels[family] ?? family;
}

function cleanParts(parts: Array<string | null | undefined>): string[] {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
}

/**
 * Cria/encontra uma categoria mantendo a árvore:
 *
 * Família
 *   └── Tipo
 *       └── Subtipo
 *
 * Para DVR/NVR, a linha também vira nível final quando existir
 * (ex.: MHDX, NVD), pois esses segmentos serão usados nos links.
 */
async function ensureCategoryPath(
  classification: {
    family: string | null;
    type: string | null;
    subtype: string | null;
    line: string | null;
  }
) {
  if (!classification.family) {
    return null;
  }

  const familyName = familyLabel(classification.family);

  const levels = cleanParts([
    familyName,
    classification.type,
    classification.subtype,
  ]);

  // Linhas são úteis como segmento final principalmente para
  // famílias de CFTV/Telefonia/Redes/Automatizadores quando
  // o classificador realmente identificou uma linha.
  const useLineAsCategory =
    Boolean(classification.line) &&
    (
      classification.family === "cftv" ||
      classification.family === "telefonia" ||
      classification.family === "redes" ||
      classification.family === "automatizadores" ||
      classification.family === "porteiros" ||
      classification.family === "controle-acesso"
    );

  if (useLineAsCategory) {
    levels.push(String(classification.line));
  }

  let parentId: number | null = null;
  let currentCategory: { id: number; name: string; slug: string } | null =
    null;

  for (const levelName of levels) {
    const slug = slugify(levelName);

    if (!slug) continue;

    let category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: levelName,
          slug,
          active: true,
          parentId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
        },
      });
    } else if (
      parentId !== null &&
      category.parentId !== parentId
    ) {
      /*
       * Não move uma categoria existente automaticamente.
       * Se o slug já existe em outra parte da árvore, usamos
       * a categoria existente para não quebrar links atuais.
       */
    }

    parentId = category.id;
    currentCategory = category;
  }

  return currentCategory;
}

function attributeSlug(value: string): string {
  return slugify(value);
}

async function applyAttributes(
  productId: number,
  name: string,
  description: string | null | undefined
) {
  const attributes = extractProductAttributes(
    name,
    description
  );

  let createdLinks = 0;

  for (const [attributeName, value] of Object.entries(attributes)) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      continue;
    }

    const aSlug = attributeSlug(attributeName);

    if (!aSlug) continue;

    const attribute = await prisma.attribute.upsert({
      where: {
        slug: aSlug,
      },
      update: {
        active: true,
      },
      create: {
        name: attributeName,
        slug: aSlug,
        active: true,
      },
    });

    const stringValue = String(value).trim();
    const vSlug = attributeSlug(stringValue);

    if (!vSlug) continue;

    const attributeValue =
      await prisma.attributeValue.upsert({
        where: {
          attributeId_slug: {
            attributeId: attribute.id,
            slug: vSlug,
          },
        },
        update: {
          value: stringValue,
        },
        create: {
          attributeId: attribute.id,
          value: stringValue,
          slug: vSlug,
        },
      });

    await prisma.productAttribute.upsert({
      where: {
        productId_attributeValueId: {
          productId,
          attributeValueId: attributeValue.id,
        },
      },
      update: {},
      create: {
        productId,
        attributeValueId: attributeValue.id,
      },
    });

    createdLinks++;
  }

  return createdLinks;
}

export async function GET(req: Request) {
  /*
   * Acesso pelo navegador.
   *
   * GET nunca executa aplicação real.
   * Ele chama a mesma lógica em DRY_RUN.
   */
  const request = new Request(req.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dryRun: true,
    }),
  });

  return POST(request);
}


export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(
      Number(searchParams.get("page") || "1"),
      1
    );

    const requestedLimit = Math.max(
      Number(searchParams.get("limit") || "500"),
      1
    );

    const limit = Math.min(requestedLimit, 500);

    const body = await req.json().catch(() => ({}));

    /*
     * Segurança:
     * por padrão NÃO grava.
     *
     * Para execução real:
     * { "dryRun": false }
     */
    const dryRun = body?.dryRun !== false;

    const skip = (page - 1) * limit;

    const total = await prisma.product.count({
      where: {
        active: true,
      },
    });

    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        productcategory: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
      skip,
      take: limit,
    });

    let aprovados = 0;
    let revisar = 0;
    let corrigir = 0;
    let categoriasAplicadas = 0;
    let atributosAplicados = 0;
    let produtosAplicados = 0;

    const erros: Array<{
      id: number;
      sku: string | null;
      nome: string;
      erro: string;
    }> = [];

    const detalhes: Array<{
      id: number;
      sku: string | null;
      nome: string;
      status: string;
      score: number;
      categoria: string | null;
      categoriaSlug: string | null;
    }> = [];

    for (const product of products) {
      const categories =
        product.productcategory
          ?.map((item) => item.category.name) || [];

      const classification = classifyProduct({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        categories,
      });

      const score = calculateScore(classification);
      const status = getStatus(
        classification,
        score
      );

      if (status === "APROVADO") aprovados++;
      else if (status === "REVISAR") revisar++;
      else corrigir++;

      if (status !== "APROVADO") {
        continue;
      }

      try {
        const category = await ensureCategoryPath(
          classification
        );

        detalhes.push({
          id: product.id,
          sku: product.sku,
          nome: product.name,
          status,
          score,
          categoria: category?.name ?? null,
          categoriaSlug: category?.slug ?? null,
        });

        if (dryRun) {
          continue;
        }

        if (!category) {
          throw new Error(
            "Não foi possível determinar uma categoria."
          );
        }

        await prisma.productcategory.upsert({
          where: {
            productId_categoryId: {
              productId: product.id,
              categoryId: category.id,
            },
          },
          update: {},
          create: {
            productId: product.id,
            categoryId: category.id,
          },
        });

        categoriasAplicadas++;

        const attrCount = await applyAttributes(
          product.id,
          product.name,
          product.description
        );

        atributosAplicados += attrCount;
        produtosAplicados++;
      } catch (error) {
        erros.push({
          id: product.id,
          sku: product.sku,
          nome: product.name,
          erro:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        });
      }
    }

    const processados =
      produtosAplicados;

    return NextResponse.json({
      sucesso: true,

      modo: dryRun
        ? "DRY_RUN"
        : "APLICACAO_REAL",

      pagina: page,
      limite: limit,
      totalProdutos: total,
      produtosNaPagina: products.length,

      resumo: {
        aprovados,
        revisar,
        corrigir,
      },

      aplicacao: {
        produtosAplicados: processados,
        categoriasAplicadas,
        atributosAplicados,
        erros: erros.length,
      },

      erros,

      detalhes: dryRun
        ? detalhes
        : detalhes.slice(0, 100),

      proximaPagina:
        skip + products.length < total
          ? page + 1
          : null,

      mensagem: dryRun
        ? "DRY_RUN concluído. Nenhuma associação de produto foi gravada."
        : "Taxonomia aplicada somente aos produtos APROVADOS.",
    });
  } catch (error) {
    console.error(
      "Erro ao aplicar taxonomia:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro ao aplicar taxonomia",
      },
      {
        status: 500,
      }
    );
  }
}
