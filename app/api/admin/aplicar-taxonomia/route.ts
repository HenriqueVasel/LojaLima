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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(
      () => ({})
    );

    /*
     * POR SEGURANÇA:
     * Se dryRun não for explicitamente false,
     * não grava absolutamente nada.
     */

    const dryRun =
      body?.dryRun !== false;

    if (dryRun) {
      return NextResponse.json({
        sucesso: true,

        modo: "DRY_RUN",

        mensagem:
          "Nenhuma alteração foi gravada no banco.",

        observacao:
          "Envie { dryRun: false } somente depois de validar a auditoria.",
      });
    }

    const products =
      await prisma.product.findMany({
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
      });

    let processados = 0;

    let aplicados = 0;

    let ignorados = 0;

    for (const product of products) {

      const categories =
        product.productcategory?.map(
          (item) =>
            item.category.name
        ) || [];

      /*
       * CLASSIFICA PRODUTO
       */

      const classification =
        classifyProduct({
          id: product.id,

          name: product.name,

          sku: product.sku,

          description:
            product.description,

          categories,
        });

      /*
       * SCORE
       */

      const score =
        calculateScore(
          classification
        );

      /*
       * STATUS
       */

      const status =
        getStatus(
          classification,
          score
        );

      /*
       * NÃO GRAVA CLASSIFICAÇÃO
       * INSEGURA
       */

      if (status !== "APROVADO") {
        ignorados++;

        continue;
      }

      /*
       * EXTRAI ATRIBUTOS
       */

      const attributes =
        extractProductAttributes(
          product.name,
          product.description
        );

      /*
       * SALVA ATRIBUTOS
       */

      for (
        const [attributeName, value]
        of Object.entries(attributes)
      ) {

        /*
         * SLUG DO ATRIBUTO
         */

        const attributeSlug =
          attributeName
            .toLowerCase()
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            )
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(
              /^-|-$/g,
              "");

        if (!attributeSlug) {
          continue;
        }

        /*
         * ATRIBUTO
         */

        const attribute =
          await prisma.attribute.upsert({
            where: {
              slug: attributeSlug,
            },

            update: {
              active: true,
            },

            create: {
              name: attributeName,

              slug: attributeSlug,

              active: true,
            },
          });

        /*
         * VALOR
         */

        const stringValue =
          String(value);

        const valueSlug =
          stringValue
            .toLowerCase()
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            )
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(
              /^-|-$/g,
              "");

        if (!valueSlug) {
          continue;
        }

        /*
         * ATTRIBUTE VALUE
         */

        const attributeValue =
          await prisma.attributeValue.upsert({
            where: {
              attributeId_slug: {
                attributeId:
                  attribute.id,

                slug:
                  valueSlug,
              },
            },

            update: {
              value: stringValue,
            },

            create: {
              attributeId:
                attribute.id,

              value:
                stringValue,

              slug:
                valueSlug,
            },
          });

        /*
         * RELAÇÃO PRODUTO ↔ ATRIBUTO
         */

        await prisma.productAttribute.upsert({
          where: {
            productId_attributeValueId: {
              productId:
                product.id,

              attributeValueId:
                attributeValue.id,
            },
          },

          update: {},

          create: {
            productId:
              product.id,

            attributeValueId:
              attributeValue.id,
          },
        });
      }

      processados++;

      aplicados++;
    }

    return NextResponse.json({
      sucesso: true,

      modo: "APLICACAO_REAL",

      totalProdutos:
        products.length,

      processados,

      aplicados,

      ignorados,

      mensagem:
        "Taxonomia e atributos aplicados somente aos produtos APROVADOS.",
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
          "Erro ao aplicar taxonomia",

        detalhes:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}