import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        brand: true,
        description: true,
        shortDescription: true,
        ean: true,
        supplier: true,

        // Marca estruturada
        brandRef: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        // Linha do produto
        line: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        // Categorias atuais
        productcategory: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
              },
            },
          },
        },

        // Atributos que já existem
        attributes: {
          select: {
            attributeValue: {
              select: {
                id: true,
                value: true,
                slug: true,

                attribute: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        id: "asc",
      },
    });

    // =====================================================
    // ORGANIZA OS PRODUTOS
    // =====================================================

    const produtos = products.map((product) => ({
      id: product.id,

      nome: product.name,

      slug: product.slug,

      sku: product.sku,

      ean: product.ean,

      marcaTexto: product.brand,

      marca: product.brandRef
        ? {
            id: product.brandRef.id,
            nome: product.brandRef.name,
            slug: product.brandRef.slug,
          }
        : null,

      linha: product.line
        ? {
            id: product.line.id,
            nome: product.line.name,
            slug: product.line.slug,
          }
        : null,

      categorias: product.productcategory.map((item) => ({
        id: item.category.id,
        nome: item.category.name,
        slug: item.category.slug,
        parentId: item.category.parentId,
      })),

      atributos: product.attributes.map((item) => ({
        atributo: {
          id: item.attributeValue.attribute.id,
          nome: item.attributeValue.attribute.name,
          slug: item.attributeValue.attribute.slug,
        },

        valor: {
          id: item.attributeValue.id,
          nome: item.attributeValue.value,
          slug: item.attributeValue.slug,
        },
      })),

      descricao: product.description,

      descricaoCurta: product.shortDescription,

      fornecedor: product.supplier,
    }));

    // =====================================================
    // RESUMO POR CATEGORIA
    // =====================================================

    const categoriasMap = new Map<
      string,
      {
        id: number;
        nome: string;
        slug: string;
        quantidade: number;
      }
    >();

    for (const product of produtos) {
      for (const category of product.categorias) {
        const existente = categoriasMap.get(category.slug);

        if (existente) {
          existente.quantidade++;
        } else {
          categoriasMap.set(category.slug, {
            id: category.id,
            nome: category.nome,
            slug: category.slug,
            quantidade: 1,
          });
        }
      }
    }

    const categorias = Array.from(categoriasMap.values()).sort(
      (a, b) => b.quantidade - a.quantidade
    );

    // =====================================================
    // RESUMO POR MARCA
    // =====================================================

    const marcasMap = new Map<string, number>();

    for (const product of produtos) {
      const marca =
        product.marca?.nome ||
        product.marcaTexto ||
        "Sem marca";

      marcasMap.set(
        marca,
        (marcasMap.get(marca) || 0) + 1
      );
    }

    const marcas = Array.from(marcasMap.entries())
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // =====================================================
    // RESUMO POR LINHA
    // =====================================================

    const linhasMap = new Map<string, number>();

    for (const product of produtos) {
      const linha = product.linha?.nome;

      if (!linha) continue;

      linhasMap.set(
        linha,
        (linhasMap.get(linha) || 0) + 1
      );
    }

    const linhas = Array.from(linhasMap.entries())
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // =====================================================
    // RESUMO DE ATRIBUTOS
    // =====================================================

    const atributosMap = new Map<
      string,
      {
        atributo: string;
        valores: Map<string, number>;
      }
    >();

    for (const product of produtos) {
      for (const item of product.atributos) {
        const nomeAtributo = item.atributo.nome;
        const valor = item.valor.nome;

        if (!atributosMap.has(nomeAtributo)) {
          atributosMap.set(nomeAtributo, {
            atributo: nomeAtributo,
            valores: new Map(),
          });
        }

        const atributo = atributosMap.get(nomeAtributo)!;

        atributo.valores.set(
          valor,
          (atributo.valores.get(valor) || 0) + 1
        );
      }
    }

    const atributos = Array.from(
      atributosMap.values()
    ).map((item) => ({
      atributo: item.atributo,

      valores: Array.from(item.valores.entries())
        .map(([valor, quantidade]) => ({
          valor,
          quantidade,
        }))
        .sort((a, b) => b.quantidade - a.quantidade),
    }));

    // =====================================================
    // RESPOSTA
    // =====================================================

    return NextResponse.json({
      sucesso: true,

      resumo: {
        totalProdutos: produtos.length,
        totalCategorias: categorias.length,
        totalMarcas: marcas.length,
        totalLinhas: linhas.length,
        totalTiposAtributos: atributos.length,
      },

      categorias,

      marcas,

      linhas,

      atributos,

      produtos,
    });
  } catch (error) {
    console.error(
      "ERRO NA ANÁLISE DOS PRODUTOS:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro ao analisar produtos.",
      },
      {
        status: 500,
      }
    );
  }
}