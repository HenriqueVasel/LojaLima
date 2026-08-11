import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import {
  classifyProduct,
} from "@/app/lib/product-classifier";

export const dynamic =
  "force-dynamic";

export async function GET(
  req: Request
) {

  try {

    const { searchParams } =
      new URL(req.url);

    const page = Math.max(
      Number(
        searchParams.get("page") || "1"
      ),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(
          searchParams.get("limit") || "500"
        ),
        1
      ),
      500
    );

    const skip =
      (page - 1) * limit;

    const total =
      await prisma.product.count({
        where: {
          active: true,
        },
      });

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

        skip,

        take: limit,
      });

    const analisados =
      products.map(
        (product) => {

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

          return {

            id:
              product.id,

            name:
              product.name,

            sku:
              product.sku,

            categories,

            classification,
          };
        }
      );

    const aprovados =
      analisados.filter(
        (item) =>
          item.classification
            .status === "APROVADO"
      ).length;

    const revisar =
      analisados.filter(
        (item) =>
          item.classification
            .status === "REVISAR"
      ).length;

    const corrigir =
      analisados.filter(
        (item) =>
          item.classification
            .status === "CORRIGIR"
      ).length;

    return NextResponse.json({

      sucesso: true,

      modo:
        "AUDITORIA_SEM_GRAVACAO",

      pagina: page,

      limite: limit,

      totalProdutos: total,

      produtosAnalisados:
        analisados.length,

      resumo: {

        aprovados,

        revisar,

        corrigir,

        percentualAprovado:
          analisados.length
            ? Number(
                (
                  (aprovados /
                    analisados.length) *
                  100
                ).toFixed(1)
              )
            : 0,
      },

      produtos:
        analisados,

      proximaPagina:
        skip +
          analisados.length <
        total
          ? page + 1
          : null,

    });

  } catch (error) {

    console.error(
      "Erro ao analisar produtos:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          "Erro ao analisar produtos",
      },
      {
        status: 500,
      }
    );
  }
}