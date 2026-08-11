import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function limparTexto(texto: string | null | undefined) {
  if (!texto) return "";

  return texto
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| REGRAS DE FAMÍLIAS
|--------------------------------------------------------------------------
|
| Aqui NÃO estamos classificando no banco.
|
| Estamos apenas procurando padrões nos produtos para descobrir
| quais famílias realmente existem.
|
*/

const familias = [
  // ============================================================
  // CFTV
  // ============================================================

  {
    familia: "Câmeras",
    palavras: [
      "camera",
      "câmera",
      "vip",
      "vhd",
      "bullet",
      "dome",
    ],
    categorias: ["cftv", "cftv-cameras", "cameras-wifi"],
  },

  {
    familia: "Câmeras Wi-Fi",
    palavras: [
      "wi-fi",
      "wifi",
      "wi fi",
    ],
    categorias: ["cameras-wifi"],
  },

  {
    familia: "DVR",
    palavras: [
      "dvr",
      "mhdx",
    ],
    categorias: ["cftv-dvr"],
  },

  {
    familia: "NVR",
    palavras: [
      "nvr",
      "nvd",
    ],
    categorias: ["cftv-nvr"],
  },

  {
    familia: "Acessórios CFTV",
    palavras: [
      "balun",
      "video balun",
      "conector bnc",
      "bnc",
      "fonte para camera",
      "fonte camera",
    ],
    categorias: ["cftv-acessorios"],
  },

  // ============================================================
  // ALARMES
  // ============================================================

  {
    familia: "Sensores",
    palavras: [
      "sensor",
      "ivp",
      "iva",
      "magnético",
      "magnetico",
      "infravermelho",
      "barreira",
    ],
    categorias: [
      "alarmes",
      "alarmes-sensores",
    ],
  },

  {
    familia: "Centrais de Alarme",
    palavras: [
      "central de alarme",
      "central alarme",
      "alarme central",
      "amt",
      "amc",
    ],
    categorias: [
      "alarmes",
      "alarmes-centrais-convencionais",
      "alarmes-centrais-monitoradas",
    ],
  },

  {
    familia: "Sirenes",
    palavras: [
      "sirene",
      "siren",
    ],
    categorias: [
      "alarmes",
      "alarmes-sirenes",
    ],
  },

  {
    familia: "Cerca Elétrica",
    palavras: [
      "cerca elétrica",
      "cerca eletrica",
      "central de choque",
      "módulo de choque",
      "modulo de choque",
    ],
    categorias: [
      "alarmes",
      "cerca-eletrica",
    ],
  },

  // ============================================================
  // CONTROLE DE ACESSO
  // ============================================================

  {
    familia: "Controle de Acesso",
    palavras: [
      "controle de acesso",
      "controlador de acesso",
      "controladora",
      "controlador",
    ],
    categorias: [
      "controle-de-acesso",
    ],
  },

  {
    familia: "Leitores",
    palavras: [
      "leitor",
      "leitor biométrico",
      "leitor biometrico",
      "rfid",
      "proximidade",
    ],
    categorias: [
      "controle-de-acesso",
    ],
  },

  {
    familia: "Biometria",
    palavras: [
      "biometria",
      "biometrico",
      "biométrico",
    ],
    categorias: [
      "controle-de-acesso",
    ],
  },

  // ============================================================
  // PORTEIROS / VÍDEO PORTEIROS
  // ============================================================

  {
    familia: "Vídeo Porteiro",
    palavras: [
      "video porteiro",
      "vídeo porteiro",
      "videoporteiro",
      "vídeoporteiro",
    ],
    categorias: [
      "video-porteiro",
      "porteiros",
    ],
  },

  {
    familia: "Porteiros",
    palavras: [
      "porteiro",
      "interfone",
      "intercomunicador",
    ],
    categorias: [
      "porteiros",
      "telefonia",
    ],
  },

  // ============================================================
  // FECHADURAS
  // ============================================================

  {
    familia: "Fechaduras Digitais",
    palavras: [
      "fechadura digital",
      "fechadura inteligente",
      "fechadura eletrônica",
      "fechadura eletronica",
    ],
    categorias: [
      "fechaduras",
      "fechaduras-eletronicas",
    ],
  },

  {
    familia: "Fechaduras",
    palavras: [
      "fechadura",
    ],
    categorias: [
      "fechaduras",
    ],
  },

  // ============================================================
  // REDES
  // ============================================================

  {
    familia: "Switches",
    palavras: [
      "switch",
      "switches",
    ],
    categorias: [
      "redes",
      "redes-racks-e-acessorios",
    ],
  },

  {
    familia: "Roteadores",
    palavras: [
      "roteador",
      "router",
    ],
    categorias: [
      "redes",
      "redes-sem-fio",
      "redes-sem-fio-profissionais",
    ],
  },

  {
    familia: "Access Points",
    palavras: [
      "access point",
      "accesspoint",
      "ponto de acesso",
    ],
    categorias: [
      "redes",
      "redes-sem-fio",
      "redes-sem-fio-profissionais",
    ],
  },

  {
    familia: "Fibra Óptica",
    palavras: [
      "fibra óptica",
      "fibra optica",
      "onu",
      "olt",
      "sfp",
    ],
    categorias: [
      "redes-fibra-optica",
    ],
  },

  {
    familia: "Cabos de Rede",
    palavras: [
      "cat5e",
      "cat6",
      "cat6a",
      "cabo de rede",
      "cabo lan",
      "patch cord",
    ],
    categorias: [
      "cabeamento",
    ],
  },

  {
    familia: "Conectores",
    palavras: [
      "conector rj45",
      "rj45",
      "keystone",
      "plug rj45",
    ],
    categorias: [
      "cabeamento",
    ],
  },

  // ============================================================
  // ENERGIA
  // ============================================================

  {
    familia: "Nobreaks",
    palavras: [
      "nobreak",
      "no-break",
      "ups",
    ],
    categorias: [
      "energia",
      "nobreak",
    ],
  },

  {
    familia: "Fontes",
    palavras: [
      "fonte chaveada",
      "fonte de alimentação",
      "fonte alimentação",
      "fonte 12v",
      "fonte 24v",
      "fonte 5v",
    ],
    categorias: [
      "energia",
      "fontes",
    ],
  },

  {
    familia: "Baterias",
    palavras: [
      "bateria",
      "bateria selada",
      "bateria estacionária",
      "bateria estacionaria",
    ],
    categorias: [
      "energia",
      "baterias",
    ],
  },

  {
    familia: "Estabilizadores",
    palavras: [
      "estabilizador",
    ],
    categorias: [
      "energia",
    ],
  },

  // ============================================================
  // AUTOMATIZADORES
  // ============================================================

  {
    familia: "Automatizadores",
    palavras: [
      "automatizador",
      "motor portão",
      "motor de portão",
      "motor para portão",
      "portão eletrônico",
      "portao eletronico",
    ],
    categorias: [
      "automatizadores",
      "automatizadores-pivotante",
      "automatizadores-basculante",
    ],
  },

  {
    familia: "Automatizadores Pivotantes",
    palavras: [
      "pivotante",
      "pivotante",
    ],
    categorias: [
      "automatizadores-pivotante",
    ],
  },

  {
    familia: "Automatizadores Basculantes",
    palavras: [
      "basculante",
    ],
    categorias: [
      "automatizadores-basculante",
    ],
  },

  // ============================================================
  // TELEFONIA
  // ============================================================

  {
    familia: "Telefones",
    palavras: [
      "telefone",
      "telefone sem fio",
      "telefone com fio",
    ],
    categorias: [
      "telefonia",
      "telefonia-telefones",
    ],
  },

  {
    familia: "PABX",
    palavras: [
      "pabx",
      "central telefônica",
      "central telefonica",
    ],
    categorias: [
      "telefonia",
    ],
  },

  // ============================================================
  // DATA CENTER
  // ============================================================

  {
    familia: "Racks",
    palavras: [
      "rack",
      "rack parede",
      "rack servidor",
    ],
    categorias: [
      "data-center",
      "redes-racks-e-acessorios",
    ],
  },

  {
    familia: "Organização de Rack",
    palavras: [
      "organizador de cabos",
      "bandeja",
      "patch panel",
      "calha",
    ],
    categorias: [
      "data-center",
      "redes-racks-e-acessorios",
    ],
  },
];

function pertenceAFamilia(
  nome: string,
  descricao: string,
  categoriaSlugs: string[],
  regra: (typeof familias)[number]
) {
  const texto = `${nome} ${descricao}`.toLowerCase();

  const categoriaCompativel =
    regra.categorias.length === 0 ||
    regra.categorias.some((cat) =>
      categoriaSlugs.includes(cat)
    );

  const palavraEncontrada = regra.palavras.some(
    (palavra) => texto.includes(palavra.toLowerCase())
  );

  return categoriaCompativel && palavraEncontrada;
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
        name: true,
        sku: true,
        brand: true,
        description: true,

        brandRef: {
          select: {
            name: true,
          },
        },

        line: {
          select: {
            name: true,
          },
        },

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

    // ============================================================
    // ANALISAR
    // ============================================================

    const resultado = familias.map((regra) => {
      const encontrados = products.filter((product) => {
        const categorias = product.productcategory.map(
          (item) => item.category.slug
        );

        return pertenceAFamilia(
          product.name,
          limparTexto(product.description),
          categorias,
          regra
        );
      });

      return {
        familia: regra.familia,
        quantidade: encontrados.length,

        exemplos: encontrados.slice(0, 15).map((product) => ({
          id: product.id,
          nome: product.name,
          sku: product.sku,
          marca:
            product.brandRef?.name ||
            product.brand ||
            null,

          linha: product.line?.name || null,

          categorias:
            product.productcategory.map(
              (item) => ({
                id: item.category.id,
                nome: item.category.name,
                slug: item.category.slug,
              })
            ),
        })),
      };
    });

    // ============================================================
    // PRODUTOS SEM FAMÍLIA
    // ============================================================

    const produtosComFamilia = new Set<number>();

    for (const regra of familias) {
      for (const product of products) {
        const categorias = product.productcategory.map(
          (item) => item.category.slug
        );

        if (
          pertenceAFamilia(
            product.name,
            limparTexto(product.description),
            categorias,
            regra
          )
        ) {
          produtosComFamilia.add(product.id);
        }
      }
    }

    const semFamilia = products
      .filter(
        (product) =>
          !produtosComFamilia.has(product.id)
      )
      .slice(0, 200)
      .map((product) => ({
        id: product.id,
        nome: product.name,
        sku: product.sku,

        marca:
          product.brandRef?.name ||
          product.brand ||
          null,

        linha: product.line?.name || null,

        categorias:
          product.productcategory.map(
            (item) => ({
              id: item.category.id,
              nome: item.category.name,
              slug: item.category.slug,
            })
          ),
      }));

    // ============================================================
    // CATEGORIAS REAIS
    // ============================================================

    const categoriasMap = new Map<
      string,
      {
        id: number;
        nome: string;
        slug: string;
        quantidade: number;
      }
    >();

    for (const product of products) {
      for (const relation of product.productcategory) {
        const category = relation.category;

        const existente =
          categoriasMap.get(category.slug);

        if (existente) {
          existente.quantidade++;
        } else {
          categoriasMap.set(category.slug, {
            id: category.id,
            nome: category.name,
            slug: category.slug,
            quantidade: 1,
          });
        }
      }
    }

    const categorias = Array.from(
      categoriasMap.values()
    ).sort(
      (a, b) =>
        b.quantidade - a.quantidade
    );

    // ============================================================
    // RESPOSTA
    // ============================================================

    return NextResponse.json({
      sucesso: true,

      resumo: {
        totalProdutos: products.length,

        familiasAnalisadas:
          familias.length,

        produtosClassificados:
          produtosComFamilia.size,

        produtosSemFamilia:
          products.length -
          produtosComFamilia.size,
      },

      familias: resultado,

      produtosSemFamilia: semFamilia,

      categorias,
    });
  } catch (error) {
    console.error(
      "ERRO NA ANÁLISE DE FAMÍLIAS:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro ao analisar famílias dos produtos.",
      },
      {
        status: 500,
      }
    );
  }
}