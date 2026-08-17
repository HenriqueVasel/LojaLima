import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function gerarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const executar =
      searchParams.get("executar") === "true";

    // ========================================================
    // 1. BUSCAR PRODUTOS QUE POSSUEM MARCA ANTIGA
    // ========================================================

    const produtos = await prisma.product.findMany({
      where: {
        brand: {
          not: null,
        },
      },

      select: {
        id: true,
        brand: true,
        brandRefId: true,
      },

      orderBy: {
        id: "asc",
      },
    });

    // ========================================================
    // 2. NORMALIZAR E AGRUPAR MARCAS
    // ========================================================

    const marcasMap = new Map<
      string,
      {
        nome: string;
        quantidade: number;
      }
    >();

    for (const produto of produtos) {
      if (!produto.brand) continue;

      const nome = produto.brand.trim();

      if (!nome) continue;

      const chave = nome.toUpperCase();

      const atual = marcasMap.get(chave);

      if (atual) {
        atual.quantidade++;
      } else {
        marcasMap.set(chave, {
          nome,
          quantidade: 1,
        });
      }
    }

    const marcas = Array.from(
      marcasMap.values()
    ).sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );

    // ========================================================
    // 3. VERIFICAR MARCAS JÁ EXISTENTES
    // ========================================================

    const marcasExistentes =
      await prisma.brand.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          active: true,
        },
      });

    const marcasExistentesMap = new Map<
      string,
      {
        id: number;
        name: string;
        slug: string;
        active: boolean;
      }
    >();

    for (const marca of marcasExistentes) {
      marcasExistentesMap.set(
        marca.name.trim().toUpperCase(),
        marca
      );
    }

    // ========================================================
    // 4. PREPARAR RESULTADO
    // ========================================================

    const marcasParaCriar = [];
    const marcasJaExistentes = [];

    for (const marca of marcas) {
      const existente =
        marcasExistentesMap.get(
          marca.nome.toUpperCase()
        );

      if (existente) {
        marcasJaExistentes.push({
          nome: marca.nome,
          quantidadeProdutos:
            marca.quantidade,
          marcaExistente: existente,
        });
      } else {
        marcasParaCriar.push({
          nome: marca.nome,
          quantidadeProdutos:
            marca.quantidade,
          slug: gerarSlug(marca.nome),
        });
      }
    }

    // ========================================================
    // 5. MODO PRÉVIA
    // ========================================================

    if (!executar) {
      return NextResponse.json({
        sucesso: true,

        modo: "PREVIA_SEM_ALTERACAO",

        resumo: {
          produtosComMarca:
            produtos.length,

          marcasEncontradas:
            marcas.length,

          marcasJaExistentes:
            marcasJaExistentes.length,

          marcasQueSeriamCriadas:
            marcasParaCriar.length,

          produtosJaVinculados:
            produtos.filter(
              (p) => p.brandRefId !== null
            ).length,

          produtosQuePrecisamVinculo:
            produtos.filter(
              (p) => p.brandRefId === null
            ).length,
        },

        marcas: marcas.map((marca) => {
          const existente =
            marcasExistentesMap.get(
              marca.nome.toUpperCase()
            );

          return {
            nome: marca.nome,

            quantidadeProdutos:
              marca.quantidade,

            jaExiste:
              !!existente,

            marcaExistente:
              existente ?? null,
          };
        }),
      });
    }

    // ========================================================
    // 6. APLICAÇÃO
    // ========================================================

    const resultado = {
      marcasCriadas: 0,
      marcasExistentes: 0,
      produtosVinculados: 0,
      produtosIgnorados: 0,
    };

    // ========================================================
    // 7. CRIAR / RECUPERAR MARCAS
    // ========================================================

    const marcasFinais = new Map<
      string,
      number
    >();

    for (const marca of marcas) {
      const chave =
        marca.nome.toUpperCase();

      const existente =
        marcasExistentesMap.get(chave);

      if (existente) {
        marcasFinais.set(
          chave,
          existente.id
        );

        resultado.marcasExistentes++;

        continue;
      }

      const slugBase =
        gerarSlug(marca.nome);

      let slug = slugBase;

      let contador = 2;

      while (
        await prisma.brand.findUnique({
          where: {
            slug,
          },
        })
      ) {
        slug = `${slugBase}-${contador}`;
        contador++;
      }

      const novaMarca =
        await prisma.brand.create({
          data: {
            name: marca.nome,
            slug,
            active: true,
          },
        });

      marcasFinais.set(
        chave,
        novaMarca.id
      );

      resultado.marcasCriadas++;
    }

    // ========================================================
    // 8. VINCULAR PRODUTOS
    // ========================================================

    for (const produto of produtos) {
      if (!produto.brand) {
        resultado.produtosIgnorados++;
        continue;
      }

      const chave =
        produto.brand.trim().toUpperCase();

      const brandId =
        marcasFinais.get(chave);

      if (!brandId) {
        resultado.produtosIgnorados++;
        continue;
      }

      await prisma.product.update({
        where: {
          id: produto.id,
        },

        data: {
          brandRefId: brandId,
        },
      });

      resultado.produtosVinculados++;
    }

    // ========================================================
    // 9. RETORNO FINAL
    // ========================================================

    return NextResponse.json({
      sucesso: true,

      modo: "APLICACAO_MARCAS",

      resultado,
    });

  } catch (error) {
    console.error(
      "Erro ao aplicar marcas:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,

        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
      {
        status: 500,
      }
    );
  }
}