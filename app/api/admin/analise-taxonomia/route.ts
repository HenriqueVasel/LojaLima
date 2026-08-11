import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";


// ============================================================
// NORMALIZAÇÃO
// ============================================================

function normalize(text: string | null | undefined): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}


// ============================================================
// DETECTAR TIPO DO PRODUTO
// ============================================================
//
// IMPORTANTE:
// A ordem importa.
//
// Exemplo:
// "NOBREAK ... ACOMPANHA BATERIA"
// não pode virar BATERIA.
//
// "GRAVADOR MHDX"
// não pode virar CAMERA.
//

const TYPE_RULES: Array<{
  type: string;
  keywords: string[];
}> = [

  // ==========================================================
  // CFTV
  // ==========================================================

  {
    type: "DVR",
    keywords: [
      "DVR",
      "MHDX",
      "HDCVI",
      "GRAVADOR DIGITAL DE VIDEO",
      "GRAVADOR DIGITAL",
    ],
  },

  {
    type: "NVR",
    keywords: [
      "NVR",
      "NVD",
      "GRAVADOR DE VIDEO DE REDE",
      "GRAVADOR IP",
    ],
  },

  {
    type: "Câmeras Wi-Fi",
    keywords: [
      "CAMERA WI-FI",
      "CAMERA WIFI",
      "CAMERA DE VIDEO WI-FI",
      "CAMERA VIDEO WI-FI",
    ],
  },

  {
    type: "Câmeras",
    keywords: [
      "CAMERA",
      "CÂMERA",
      "VHD",
      "VIP",
    ],
  },

  {
    type: "HD",
    keywords: [
      "HD 1TB",
      "HD 2TB",
      "HD 4TB",
      "HDD",
      "DISCO RIGIDO",
      "DISCO RÍGIDO",
    ],
  },

  // ==========================================================
  // ALARMES
  // ==========================================================

  {
    type: "Sensores",
    keywords: [
      "SENSOR",
      "IVP",
      "IVA",
      "MAGNETICO",
      "MAGNÉTICO",
      "REED",
    ],
  },

  {
    type: "Centrais de Alarme",
    keywords: [
      "CENTRAL DE ALARME",
      "CENTRAL ALARME",
      "AMT",
      "ANM",
    ],
  },

  {
    type: "Sirenes",
    keywords: [
      "SIRENE",
      "ACIONADOR MANUAL",
    ],
  },

  {
    type: "Cerca Elétrica",
    keywords: [
      "CERCA ELETRICA",
      "CERCA ELÉTRICA",
      "ELC",
    ],
  },

  // ==========================================================
  // CONTROLE DE ACESSO
  // ==========================================================

  {
    type: "Controle de Acesso",
    keywords: [
      "CONTROLADOR DE ACESSO",
      "CONTROLE DE ACESSO",
    ],
  },

  {
    type: "Leitores",
    keywords: [
      "LEITOR RFID",
      "LEITOR BIOMETRICO",
      "LEITOR BIOMÉTRICO",
      "LEITOR DE CARTAO",
      "LEITOR DE CARTÃO",
      "LEITOR CADASTRADOR",
      "DIGIPROX",
    ],
  },

  {
    type: "Biometria",
    keywords: [
      "BIOMETRICO",
      "BIOMÉTRICO",
      "BIOMETRIA",
      "FACIAL",
      "RECONHECIMENTO FACIAL",
    ],
  },

  // ==========================================================
  // PORTEIROS
  // ==========================================================

  {
    type: "Vídeo Porteiro",
    keywords: [
      "VIDEO PORTEIRO",
      "VIDEOPORTEIRO",
      "VÍDEO PORTEIRO",
      "TVIP",
      "IVR",
      "XPE",
    ],
  },

  {
    type: "Porteiros",
    keywords: [
      "PORTEIRO",
      "EXTENSAO PORTEIRO",
      "EXTENSÃO PORTEIRO",
    ],
  },

  // ==========================================================
  // FECHADURAS
  // ==========================================================

  {
    type: "Fechaduras Digitais",
    keywords: [
      "FECHADURA DIGITAL",
      "FECHADURA SMART",
      "FECHADURA INTELIGENTE",
      "MFD",
      "MFR",
      "FR200",
      "FR210",
      "FR331",
    ],
  },

  {
    type: "Fechaduras",
    keywords: [
      "FECHADURA",
      "ELETROIMA",
      "ELETROIMÃ",
      "SOLENOIDE",
    ],
  },

  // ==========================================================
  // REDES
  // ==========================================================

  {
    type: "Switches",
    keywords: [
      "SWITCH",
      "S110",
      "S111",
      "S112",
      "S211",
      "S232",
      "S302",
      "S332",
      "SF 800",
    ],
  },

  {
    type: "Access Points",
    keywords: [
      "ACCESS POINT",
      "AP ",
      "U6-",
      "U7-",
      "UAP-",
      "UNIFI",
    ],
  },

  {
    type: "Roteadores",
    keywords: [
      "ROTEADOR",
      "ROUTER",
      "W4-",
      "W5-",
      "W6-",
      "RW ",
    ],
  },

  {
    type: "Cabos de Rede",
    keywords: [
      "CABO LAN",
      "CABO UTP",
      "CABO CAT5",
      "CABO CAT6",
      "CAT5E",
      "CAT6",
      "PATCH CORD",
    ],
  },

  {
    type: "Fibra Óptica",
    keywords: [
      "FIBRA OPTICA",
      "FIBRA ÓPTICA",
      "FIBER",
      "FTTH",
      "OLT",
      "ONU",
      "ONT",
    ],
  },

  {
    type: "Racks",
    keywords: [
      "RACK",
      "MINI RACK",
      "RACK PAREDE",
      "RACK DE PISO",
    ],
  },

  // ==========================================================
  // ENERGIA
  // ==========================================================

  {
    type: "Nobreaks",
    keywords: [
      "NOBREAK",
      "NO-BREAK",
      "UPS",
    ],
  },

  {
    type: "Baterias",
    keywords: [
      "BATERIA",
      "BATERIAS",
      "VRLA",
      "SELADA",
    ],
  },

  {
    type: "Fontes",
    keywords: [
      "FONTE",
      "FONTE DE ALIMENTACAO",
      "FONTE DE ALIMENTAÇÃO",
      "AC/DC",
      "DC/DC",
    ],
  },

  {
    type: "Estabilizadores",
    keywords: [
      "ESTABILIZADOR",
    ],
  },

  // ==========================================================
  // AUTOMATIZADORES
  // ==========================================================

  {
    type: "Automatizadores",
    keywords: [
      "AUTOMATIZADOR",
      "MOTOR DE PORTAO",
      "MOTOR DE PORTÃO",
      "MOTOR PORTAO",
      "MOTOR PORTÃO",
    ],
  },

  {
    type: "Controles Remotos",
    keywords: [
      "CONTROLE REMOTO",
      "TX ",
      "RECEPTOR",
    ],
  },

  {
    type: "Cremalheiras",
    keywords: [
      "CREMALHEIRA",
      "CREMALHEIRA DE ALUMINIO",
      "CREMALHEIRA DE ALUMÍNIO",
    ],
  },

  // ==========================================================
  // TELEFONIA
  // ==========================================================

  {
    type: "Telefones",
    keywords: [
      "TELEFONE",
      "TELEFONE IP",
      "TIP ",
      "TS ",
      "TC ",
    ],
  },

  {
    type: "PABX",
    keywords: [
      "PABX",
      "IMPACTA",
      "MODULARE",
      "CONECTA",
      "UNNITI",
    ],
  },

  // ==========================================================
  // CABEAMENTO
  // ==========================================================

  {
    type: "Conectores",
    keywords: [
      "CONECTOR",
      "RJ45",
      "RJ11",
      "EMENDA RJ",
      "PLUG",
    ],
  },
];


// ============================================================
// DETECTAR TIPO
// ============================================================

function detectType(
  name: string,
  description?: string | null
): {
  type: string | null;
  matchedKeywords: string[];
} {

  const text = normalize(
    `${name} ${description || ""}`
  );

  for (const rule of TYPE_RULES) {

    const matches = rule.keywords.filter(
      keyword =>
        text.includes(normalize(keyword))
    );

    if (matches.length > 0) {

      return {
        type: rule.type,
        matchedKeywords: matches,
      };

    }
  }

  return {
    type: null,
    matchedKeywords: [],
  };
}


// ============================================================
// EXTRAIR CANAIS
// ============================================================

function extractChannels(
  text: string
): number[] {

  const normalized = normalize(text);

  const values = new Set<number>();

  const patterns = [
    /\b(4|8|16|32|64|128)\s*CAN(?:AIS)?\b/,
    /\b(4|8|16|32|64|128)CH\b/,
  ];

  for (const pattern of patterns) {

    const match = normalized.match(pattern);

    if (match) {
      values.add(Number(match[1]));
    }
  }

  return Array.from(values);
}


// ============================================================
// EXTRAIR RESOLUÇÃO
// ============================================================

function extractResolution(
  text: string
): string[] {

  const normalized = normalize(text);

  const values = new Set<string>();

  const patterns = [
    /\b(1MP|2MP|3MP|4MP|5MP|6MP|8MP|12MP)\b/g,
    /\b(720P|1080P|2K|4K|8K)\b/g,
  ];

  for (const pattern of patterns) {

    const matches =
      normalized.matchAll(pattern);

    for (const match of matches) {
      values.add(match[1]);
    }
  }

  return Array.from(values);
}


// ============================================================
// EXTRAIR POE
// ============================================================

function extractPoE(
  text: string
): boolean {

  const normalized = normalize(text);

  return (
    normalized.includes("POE") ||
    normalized.includes("P.O.E")
  );
}


// ============================================================
// EXTRAIR PORTAS
// ============================================================

function extractPorts(
  text: string
): number[] {

  const normalized = normalize(text);

  const values = new Set<number>();

  const patterns = [
    /\b(4|5|8|10|16|24|26|28|48|52)\s*PORTAS?\b/g,
    /\b(4|5|8|10|16|24|26|28|48|52)P\b/g,
  ];

  for (const pattern of patterns) {

    const matches =
      normalized.matchAll(pattern);

    for (const match of matches) {
      values.add(Number(match[1]));
    }
  }

  return Array.from(values);
}


// ============================================================
// GET
// ============================================================

export async function GET() {

  try {

    // ========================================================
    // BUSCAR PRODUTOS
    // ========================================================

    const products =
      await prisma.product.findMany({

        where: {
          active: true,
        },

        select: {

          id: true,

          name: true,

          description: true,

          shortDescription: true,

          sku: true,

          brand: true,

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


    // ========================================================
    // RESULTADO POR CATEGORIA
    // ========================================================

    const categories = new Map<
      string,
      {
        id: number;
        name: string;
        slug: string;

        totalProducts: number;

        types: Map<
          string,
          {
            quantity: number;

            examples: Array<{
              id: number;
              name: string;
              sku: string | null;
              brand: string | null;
              line: string | null;

              channels: number[];
              resolutions: string[];
              ports: number[];
              poe: boolean;

              matchedKeywords: string[];
            }>;
          }
        >;
      }
    >();


    // ========================================================
    // ANALISAR CADA PRODUTO
    // ========================================================

    for (const product of products) {

      const text = [
        product.name,
        product.description,
        product.shortDescription,
        product.brand,
        product.brandRef?.name,
        product.line?.name,
      ]
        .filter(Boolean)
        .join(" ");


      const detection =
        detectType(
          product.name,
          `${product.description || ""} ${
            product.shortDescription || ""
          }`
        );


      // ------------------------------------------------------
      // ATRIBUTOS ENCONTRADOS
      // ------------------------------------------------------

      const channels =
        extractChannels(text);

      const resolutions =
        extractResolution(text);

      const ports =
        extractPorts(text);

      const poe =
        extractPoE(text);


      // ------------------------------------------------------
      // CATEGORIAS DO PRODUTO
      // ------------------------------------------------------

      for (
        const relation of product.productcategory
      ) {

        const category =
          relation.category;

        const key =
          String(category.id);


        if (!categories.has(key)) {

          categories.set(key, {

            id: category.id,

            name: category.name,

            slug: category.slug,

            totalProducts: 0,

            types: new Map(),

          });

        }


        const categoryData =
          categories.get(key)!;


        categoryData.totalProducts++;


        // ----------------------------------------------------
        // SEM TIPO
        // ----------------------------------------------------

        if (!detection.type) {

          if (
            !categoryData.types.has(
              "Não identificado"
            )
          ) {

            categoryData.types.set(
              "Não identificado",
              {
                quantity: 0,
                examples: [],
              }
            );

          }


          const unknown =
            categoryData.types.get(
              "Não identificado"
            )!;


          unknown.quantity++;


          if (
            unknown.examples.length < 20
          ) {

            unknown.examples.push({

              id: product.id,

              name: product.name,

              sku: product.sku,

              brand:
                product.brand ||
                product.brandRef?.name ||
                null,

              line:
                product.line?.name ||
                null,

              channels,

              resolutions,

              ports,

              poe,

              matchedKeywords: [],

            });

          }

          continue;
        }


        // ----------------------------------------------------
        // TIPO IDENTIFICADO
        // ----------------------------------------------------

        if (
          !categoryData.types.has(
            detection.type
          )
        ) {

          categoryData.types.set(
            detection.type,
            {
              quantity: 0,
              examples: [],
            }
          );

        }


        const typeData =
          categoryData.types.get(
            detection.type
          )!;


        typeData.quantity++;


        // ----------------------------------------------------
        // EXEMPLOS
        // ----------------------------------------------------

        if (
          typeData.examples.length < 20
        ) {

          typeData.examples.push({

            id: product.id,

            name: product.name,

            sku: product.sku,

            brand:
              product.brand ||
              product.brandRef?.name ||
              null,

            line:
              product.line?.name ||
              null,

            channels,

            resolutions,

            ports,

            poe,

            matchedKeywords:
              detection.matchedKeywords,

          });

        }

      }

    }


    // ========================================================
    // CONVERTER MAP → JSON
    // ========================================================

    const result =
      Array.from(
        categories.values()
      )
        .map(category => ({

          id: category.id,

          name: category.name,

          slug: category.slug,

          totalProducts:
            category.totalProducts,

          types:
            Array.from(
              category.types.entries()
            )
              .map(
                ([type, data]) => ({

                  type,

                  quantity:
                    data.quantity,

                  examples:
                    data.examples,

                })
              )
              .sort(
                (a, b) =>
                  b.quantity -
                  a.quantity
              ),

        }))
        .sort(
          (a, b) =>
            b.totalProducts -
            a.totalProducts
        );


    // ========================================================
    // RESUMO
    // ========================================================

    const totalProducts =
      products.length;


    const productsClassified =
      products.filter(product =>
        detectType(
          product.name,
          `${product.description || ""} ${
            product.shortDescription || ""
          }`
        ).type !== null
      ).length;


    const productsWithoutType =
      totalProducts -
      productsClassified;


    // ========================================================
    // RESPOSTA
    // ========================================================

    return NextResponse.json({

      sucesso: true,

      resumo: {

        totalProdutos:
          totalProducts,

        produtosClassificados:
          productsClassified,

        produtosSemTipo:
          productsWithoutType,

        percentualClassificado:
          totalProducts > 0
            ? Number(
                (
                  productsClassified /
                  totalProducts
                * 100
                ).toFixed(2)
              )
            : 0,

        categoriasAnalisadas:
          result.length,

      },

      categorias: result,

    });

  } catch (error) {

    console.error(
      "ERRO ANALISE TAXONOMIA:",
      error
    );

    return NextResponse.json(

      {
        sucesso: false,

        erro:
          "Erro ao analisar taxonomia",

        detalhe:
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