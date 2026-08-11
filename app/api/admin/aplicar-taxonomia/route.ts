import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import {
  classifyProduct,
} from "@/app/lib/product-classifier";
import {
  extractProductAttributes,
} from "@/app/lib/product-attributes";

export const dynamic =
  "force-dynamic";

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json().catch(
        () => ({})
      );

    const dryRun =
      body?.dryRun !== false;

    if (dryRun) {

      return NextResponse.json({

        sucesso: true,

        modo:
          "DRY_RUN",

        mensagem:
          "Nenhuma alteração foi gravada no banco.",

        observacao:
          "Envie dryRun:false somente depois de validarmos a classificação.",

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

    for (
      const product of products
    ) {

      const categories =
        product.productcategory
          ?.map(
            (item) =>
              item.category.name
          ) || [];

      const classification =
        classifyProduct({

          name:
            product.name,

          sku:
            product.sku,

          description:
            product.description,

          categories,
        });

      /*
      |--------------------------------------------------------------------------
      | NÃO APLICA CLASSIFICAÇÕES INSEGURAS
      |--------------------------------------------------------------------------
      */

      if (
        classification.status !==
        "APROVADO"
      ) {

        ignorados++;

        continue;
      }

      const attributes =
        extractProductAttributes(
          product.name,
          product.description
        );

      /*
      |--------------------------------------------------------------------------
      | ATRIBUTOS
      |--------------------------------------------------------------------------
      */

      for (
        const [attributeName, value]
        of Object.entries(attributes)
      ) {

        const attributeSlug =
          attributeName
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(
              /^-|-$/g,
              ""
            );

        const attribute =
          await prisma.attribute.upsert({

            where: {
              slug:
                attributeSlug,
            },

            update: {
              active: true,
            },

            create: {

              name:
                attributeName,

              slug:
                attributeSlug,

              active: true,
            },

          });

        const stringValue =
          String(value);

        const valueSlug =
          stringValue
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(
              /^-|-$/g,
              ""
            );

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

            update: {},

            create: {

              attributeId:
                attribute.id,

              value:
                stringValue,

              slug:
                valueSlug,
            },

          });

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

      modo:
        "APLICACAO_REAL",

      totalProdutos:
        products.length,

      processados,

      aplicados,

      ignorados,

      mensagem:
        "Taxonomia aplicada somente aos produtos APROVADOS.",

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
      },
      {
        status: 500,
      }
    );
  }
}