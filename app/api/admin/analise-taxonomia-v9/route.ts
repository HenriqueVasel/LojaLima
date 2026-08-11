import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/*
|--------------------------------------------------------------------------
| V10 — MOTOR FINAL DE CLASSIFICAÇÃO
|--------------------------------------------------------------------------
|
| OBJETIVO:
| - Classificar produtos sem gravar no banco
| - Reduzir falsos positivos
| - Priorizar regras específicas antes das genéricas
| - Separar corretamente família / tipo / subtipo / linha
| - Extrair atributos básicos
|
| NÃO GRAVA NADA NO BANCO.
|
|--------------------------------------------------------------------------
*/

type Classification = {
  family: string | null;
  type: string | null;
  subtype: string | null;
  line: string | null;
  attributes: Record<string, string | number | boolean | null>;
};

type ProductInput = {
  id: number;
  name: string;
  sku: string | null;
  description?: string | null;
  categories?: string[];
};

/*
|--------------------------------------------------------------------------
| NORMALIZAÇÃO
|--------------------------------------------------------------------------
*/

function normalize(text: string = "") {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^\w\s./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(text: string, ...terms: string[]) {
  return terms.some((term) => text.includes(normalize(term)));
}

function hasWord(text: string, term: string) {
  const normalizedTerm = normalize(term);

  const escaped = normalizedTerm.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`).test(text);
}

function firstMatch(
  text: string,
  values: Record<string, string>
): string | null {
  for (const [key, value] of Object.entries(values)) {
    if (text.includes(normalize(key))) {
      return value;
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| ATRIBUTOS
|--------------------------------------------------------------------------
*/

function extractChannels(text: string): number | null {
  const patterns = [
    /(?:^|\s)(4|8|16|32|64|128|256)\s*(?:CANAIS|CH|CHS)(?:\s|$)/,

    /(?:DVR|NVR|MHDX|NVD|IMHDX|INVD)[^\d]{0,12}(4|8|16|32|64|128|256)/,

    /\b(4|8|16|32|64|128|256)CH\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

function extractVoltage(text: string): string | null {
  const match = text.match(
    /\b(12V|24V|110V|120V|127V|220V|230V|240V)\b/
  );

  return match?.[1] || null;
}

function extractTechnology(text: string): string | null {
  if (has(text, "WI-FI", "WIFI")) {
    return "Wi-Fi";
  }

  if (has(text, "POE", "802.3AF", "802.3AT")) {
    return "PoE";
  }

  if (has(text, "RFID", "MIFARE")) {
    return "RFID";
  }

  return null;
}

function extractResolution(text: string): string | null {
  const match = text.match(
    /\b(1MP|2MP|3MP|4MP|5MP|6MP|8MP|10MP|12MP)\b/
  );

  return match?.[1] || null;
}

/*
|--------------------------------------------------------------------------
| CLASSIFICAÇÃO
|--------------------------------------------------------------------------
*/

function classifyProduct(
  product: ProductInput
): Classification {

  const name = normalize(product.name);

  const description = normalize(
    product.description || ""
  );

  const categories = normalize(
    (product.categories || []).join(" ")
  );

  const text = `${name} ${description}`;

  /*
  |--------------------------------------------------------------------------
  | CONTEXTO DE CATEGORIA
  |--------------------------------------------------------------------------
  */

  const categoryIsCftv =
    categories.includes("CFTV");

  const categoryIsAlarm =
    categories.includes("ALARME");

  const categoryIsAccess =
    categories.includes("CONTROLE DE ACESSO");

  const categoryIsNetworks =
    categories.includes("REDES");

  const categoryIsCabos =
    categories.includes("CABEAMENTO");

  const categoryIsAutomation =
    categories.includes("AUTOMATIZADORES");

  /*
  |--------------------------------------------------------------------------
  | EXCLUSÕES
  |--------------------------------------------------------------------------
  */

  const mentionsIncludedBattery =
    has(
      name,
      "ACOMPANHA BATERIA",
      "ACOMPANHA DUAS BATERIAS",
      "ACOMPANHA UMA BATERIA",
      "COM BATERIA",
      "INCLUI BATERIA"
    );

  const mentionsNoPowerSupply =
    has(
      name,
      "SEM FONTE",
      "NAO ACOMPANHA FONTE",
      "NÃO ACOMPANHA FONTE"
    );

  /*
  |--------------------------------------------------------------------------
  | 1. CFTV — GRAVADORES
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "DVR",
      "MHDX",
      "IMHDX"
    )
  ) {

    const channels = extractChannels(text);

    const line = firstMatch(name, {
      IMHDX: "IMHDX",
      MHDX: "MHDX",
    });

    return {
      family: "cftv",
      type: "DVR",
      subtype: "Gravadores DVR",
      line,
      attributes: {
        ...(channels ? { canais: channels } : {}),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 2. CFTV — NVR
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "NVR",
      "NVD",
      "INVD"
    )
  ) {

    const channels = extractChannels(text);

    const line = firstMatch(name, {
      INVD: "INVD",
      NVD: "NVD",
    });

    return {
      family: "cftv",
      type: "NVR",
      subtype: "Gravadores NVR",
      line,
      attributes: {
        ...(channels ? { canais: channels } : {}),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 3. CFTV — CÂMERAS
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CAMERA",
      "CAM IP",
      "CAMERA IP",
      "CAMERA WI-FI",
      "CAMERA WIFI"
    )
  ) {

    let subtype = "Câmeras";

    if (
      has(
        name,
        "WI-FI",
        "WIFI"
      )
    ) {
      subtype = "Câmeras Wi-Fi";
    }

    else if (
      has(
        name,
        "IP",
        "VIP",
        "VIPW"
      )
    ) {
      subtype = "IP";
    }

    else if (
      has(
        name,
        "VHD",
        "VHDM"
      )
    ) {
      subtype = "Multi-HD";
    }

    const line = firstMatch(name, {
      VIPW: "VIPW",
      VIP: "VIP",
      VHDM: "VHDM",
      VHD: "VHD",
    });

    const resolution =
      extractResolution(text);

    const technology =
      extractTechnology(text);

    return {
      family: "cftv",
      type: "Câmeras",
      subtype,
      line,
      attributes: {
        ...(technology
          ? { tecnologia: technology }
          : {}),

        ...(resolution
          ? { resolucao: resolution }
          : {}),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 4. VÍDEO PORTEIRO
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "VIDEO PORTEIRO",
      "PORTEIRO VIDEO",
      "PORTEIRO ELETRONICO",
      "TVIP"
    )
  ) {

    return {
      family: "porteiros",
      type: "Vídeo Porteiros",
      subtype: has(name, "KIT")
        ? "Kit Vídeo Porteiro"
        : "Vídeo Porteiros",
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 5. ALARMES — SENSORES
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "SENSOR",
      "IVP",
      "IVA",
      "XAS",
      "REED"
    )
  ) {

    let subtype = "Sensores";

    if (
      has(
        name,
        "IVP",
        "PRESENCA",
        "PRESENÇA"
      )
    ) {
      subtype = "Sensores de Presença";
    }

    else if (
      has(
        name,
        "REED",
        "MAGNETICO",
        "MAGNÉTICO"
      )
    ) {
      subtype = "Sensores Magnéticos";
    }

    else if (
      has(
        name,
        "IVA",
        "BARREIRA"
      )
    ) {
      subtype = "Sensores de Barreira";
    }

    return {
      family: "alarmes",
      type: "Sensores",
      subtype,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 6. ALARMES — SIRENES
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "SIRENE",
      "SIRENA"
    )
  ) {

    return {
      family: "alarmes",
      type: "Alarmes",
      subtype: "Sirenes",
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 7. ALARMES — CENTRAIS
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CENTRAL DE ALARME",
      "CENTRAL ALARME",
      "CENTRAL MONITORADA",
      "CENTRAL DE SEGURANCA",
      "CENTRAL DE SEGURANÇA",
      "AMT",
      "ANM"
    )
  ) {

    return {
      family: "alarmes",
      type: "Centrais",
      subtype: "Centrais de Alarme",
      line: firstMatch(name, {
        AMT: "AMT",
        ANM: "ANM",
      }),
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 8. ALARMES — RECEPTOR
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "RECEPTOR XAR",
      "XAR "
    )
  ) {

    return {
      family: "alarmes",
      type: "Receptores",
      subtype: "Receptores de Alarme",
      line: firstMatch(name, {
        XAR: "XAR",
      }),
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 9. ALARMES — TECLADOS
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "TECLADO XAT",
      "XAT "
    )
  ) {

    return {
      family: "alarmes",
      type: "Teclados",
      subtype: "Teclados de Alarme",
      line: "XAT",
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 10. CONTROLE DE ACESSO
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CONTROLADOR DE ACESSO",
      "CONTROLE DE ACESSO",
      "SS 553",
      "BIOINOX"
    )
  ) {

    return {
      family: "controle-acesso",
      type: "Controladores",
      subtype: has(name, "FACIAL")
        ? "Controladores Faciais"
        : "Controladores de Acesso",
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 11. RFID / CREDENCIAIS
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "RFID",
      "MIFARE",
      "CARTAO DE PROXIMIDADE",
      "CHAVEIRO RFID",
      "PULSEIRA RFID"
    )
  ) {

    return {
      family: "controle-acesso",
      type: "Credenciais",
      subtype: "Credenciais RFID",
      line: null,
      attributes: {
        tecnologia: "RFID",
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 12. FECHADURAS
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "FECHADURA",
      "SOLENOIDE",
      "ELETROIMA",
      "ELETROIMÃ",
      "ELETROIMAN"
    )
  ) {

    let subtype = "Fechaduras";

    if (
      has(
        name,
        "DIGITAL",
        "BIOMETRIA",
        "RFID"
      )
    ) {
      subtype = "Fechaduras Digitais";
    }

    else if (
      has(
        name,
        "ELETRICA",
        "ELÉTRICA",
        "SOLENOIDE"
      )
    ) {
      subtype = "Fechaduras Elétricas";
    }

    else if (
      has(
        name,
        "ELETROIMA",
        "ELETROIMÃ",
        "ELETROIMAN"
      )
    ) {
      subtype = "Eletroímãs";
    }

    return {
      family: "controle-acesso",
      type: "Fechaduras",
      subtype,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 13. ENERGIA — NOBREAK
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "NOBREAK",
      "UPS"
    )
  ) {

    return {
      family: "energia",
      type: "Nobreaks",
      subtype: "Nobreak",
      line: firstMatch(name, {
        XNB: "XNB",
        GNB: "GNB",
      }),
      attributes: {
        ...(extractVoltage(text)
          ? {
              tensao: extractVoltage(text),
            }
          : {}),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 14. ENERGIA — BATERIAS
  |--------------------------------------------------------------------------
  */

  if (
    !mentionsIncludedBattery &&
    has(
      name,
      "BATERIA",
      "PILHA",
      "CR2016",
      "CR2032",
      "A23"
    )
  ) {

    return {
      family: "energia",
      type: "Baterias",
      subtype: "Baterias e Pilhas",
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 15. ENERGIA — FONTES
  |--------------------------------------------------------------------------
  */

  if (
    !mentionsNoPowerSupply &&
    has(
      name,
      "FONTE",
      "FONTE DE ALIMENTACAO",
      "FONTE DE ALIMENTAÇÃO"
    )
  ) {

    return {
      family: "energia",
      type: "Fontes",
      subtype: "Fontes de Alimentação",
      line: null,
      attributes: {
        ...(extractVoltage(text)
          ? {
              tensao: extractVoltage(text),
            }
          : {}),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 16. REDES — SWITCH
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "SWITCH",
      "SWITCHES"
    )
  ) {

    let subtype: string | null = null;

    if (
      has(
        name,
        "NAO GERENCIAVEL",
        "NÃO GERENCIÁVEL"
      )
    ) {
      subtype = "Switch Não Gerenciável";
    }

    else if (
      has(
        name,
        "GERENCIAVEL",
        "GERENCIÁVEL"
      )
    ) {
      subtype = "Switch Gerenciável";
    }

    return {
      family: "redes",
      type: "Switches",
      subtype,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 17. REDES — ROTEADORES
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "ROTEADOR",
      "ROUTER"
    )
  ) {

    return {
      family: "redes",
      type: "Roteadores",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 18. REDES — ACCESS POINT
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "ACCESS POINT",
      "ACCESS POINTS",
      "AP WIFI",
      "AP WI-FI"
    )
  ) {

    return {
      family: "redes",
      type: "Access Points",
      subtype: null,
      line: null,
      attributes: {
        ...(has(name, "WI-FI", "WIFI")
          ? {
              tecnologia: "Wi-Fi",
            }
          : {}),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 19. CONECTORES
  |--------------------------------------------------------------------------
  |
  | MUITO IMPORTANTE:
  | CONECTOR deve ser avaliado ANTES de CAT5/CAT6.
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CONECTOR",
      "CONECTORES",
      "RJ45",
      "RJ11",
      "MC4",
      "SC/APC",
      "SC-UPC"
    )
  ) {

    let subtype: string | null = null;

    if (has(name, "RJ45")) {
      subtype = "RJ45";
    }

    else if (has(name, "RJ11")) {
      subtype = "RJ11";
    }

    else if (has(name, "MC4")) {
      subtype = "MC4";
    }

    else if (
      has(
        name,
        "SC/APC",
        "SC-UPC"
      )
    ) {
      subtype = "Fibra Óptica";
    }

    return {
      family: "conectividade",
      type: "Conectores",
      subtype,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 20. CABEAMENTO — CAT6
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CAT6",
      "CAT 6"
    )
  ) {

    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: "Cabos de Rede CAT6",
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 21. CABEAMENTO — CAT5
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CAT5",
      "CAT5E",
      "CAT 5",
      "CAT 5E"
    )
  ) {

    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: "Cabos de Rede CAT5",
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 22. TELEFONIA — CENTRAIS
  |--------------------------------------------------------------------------
  |
  | NÃO usar CP4030 sozinho.
  | Exigimos contexto de telefonia.
  |--------------------------------------------------------------------------
  */

  const telephoneContext =
    has(
      name,
      "CENTRAL TELEFONICA",
      "CENTRAL TELEFÔNICA",
      "CENTRAL PABX",
      "PABX",
      "RAMAL",
      "TELEFONICA",
      "TELEFÔNICA",
      "IMPACTA",
      "COMUNIC"
    );

  if (
    telephoneContext
  ) {

    return {
      family: "telefonia",
      type: "Centrais Telefônicas",
      subtype: null,
      line: firstMatch(name, {
        IMPACTA: "IMPACTA",
        "COMUNIC 48": "COMUNIC",
        "COMUNIC 80": "COMUNIC",
        CP112: "CP112",
        CP4030: "CP4030",
      }),
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 23. TELEFONIA — TELEFONES
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "TELEFONE",
      "TELEFONE IP",
      "TS 311",
      "TC 50",
      "TC 60",
      "TIP 125",
      "TDMI"
    )
  ) {

    let subtype: string | null = null;

    if (
      has(
        name,
        "SEM FIO",
        "SEM FIO DIGITAL"
      )
    ) {
      subtype = "Telefones Sem Fio";
    }

    else if (
      has(
        name,
        "IP",
        "TIP ",
        "TDMI"
      )
    ) {
      subtype = "Telefones IP";
    }

    else if (
      has(
        name,
        "COM FIO"
      )
    ) {
      subtype = "Telefones Com Fio";
    }

    return {
      family: "telefonia",
      type: "Telefones",
      subtype,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 24. AUTOMATIZADORES — PRODUTO PRINCIPAL
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "AUTOMATIZADOR",
      "MOTOR PARA PORTAO",
      "MOTOR PARA PORTÃO"
    )
  ) {

    return {
      family: "automatizadores",
      type: "Automatizadores",
      subtype: has(
        name,
        "DESLIZANTE"
      )
        ? "Deslizantes"
        : has(
            name,
            "PIVOTANTE"
          )
          ? "Pivotantes"
          : null,
      line: firstMatch(name, {
        DZ: "DZ",
        GATTER: "GATTER",
        LIGHT: "LIGHT",
        SUPER: "SUPER",
      }),
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 25. AUTOMATIZADORES — ACESSÓRIOS
  |--------------------------------------------------------------------------
  */

  const automationContext =
    categoryIsAutomation ||
    has(
      name,
      "AUTOMATIZADOR",
      "PORTAO",
      "PORTÃO",
      "DZ",
      "GATTER",
      "LIGHT",
      "SUPER"
    );

  if (
    automationContext &&
    has(
      name,
      "CREMALHEIRA",
      "ENGRENAGEM",
      "POLIA",
      "COROA",
      "MANCAL",
      "FUSO",
      "ROLAMENTO",
      "REPOSICAO",
      "REPOSIÇÃO",
      "SUPORTE"
    )
  ) {

    return {
      family: "automatizadores",
      type: "Acessórios de Automatizadores",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 26. FALLBACK CONTROLADO
  |--------------------------------------------------------------------------
  */

  return {
    family: null,
    type: null,
    subtype: null,
    line: null,
    attributes: {},
  };
}

/*
|--------------------------------------------------------------------------
| SCORE
|--------------------------------------------------------------------------
*/

function calculateScore(
  classification: Classification
) {

  let score = 0;

  if (classification.family) {
    score += 40;
  }

  if (classification.type) {
    score += 25;
  }

  if (classification.subtype) {
    score += 20;
  }

  if (classification.line) {
    score += 10;
  }

  if (
    Object.keys(
      classification.attributes
    ).length > 0
  ) {
    score += 5;
  }

  return Math.min(score, 100);
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function getStatus(
  classification: Classification,
  score: number
) {

  if (!classification.family) {
    return "CORRIGIR";
  }

  if (score >= 80) {
    return "APROVADO";
  }

  if (score >= 50) {
    return "REVISAR";
  }

  return "CORRIGIR";
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(req: Request) {

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

    const totalProdutos =
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

                  name: true,

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

    const produtos =
      products.map((product) => {

        const categories =
          product.productcategory?.map(
            (item) =>
              item.category.name
          ) || [];

        const classification =
          classifyProduct({

            id: product.id,

            name: product.name,

            sku: product.sku,

            description:
              product.description,

            categories,

          });

        const score =
          calculateScore(
            classification
          );

        const status =
          getStatus(
            classification,
            score
          );

        return {

          id: product.id,

          name: product.name,

          sku: product.sku,

          categories,

          classification,

          score,

          status,

        };

      });

    const aprovados =
      produtos.filter(
        (p) =>
          p.status === "APROVADO"
      ).length;

    const revisar =
      produtos.filter(
        (p) =>
          p.status === "REVISAR"
      ).length;

    const corrigir =
      produtos.filter(
        (p) =>
          p.status === "CORRIGIR"
      ).length;

    return NextResponse.json({

      sucesso: true,

      versao: "10.0",

      modo: "AUDITORIA_FINAL",

      pagina: page,

      limite: limit,

      totalProdutos,

      produtosAnalisados:
        produtos.length,

      resumo: {

        aprovados,

        revisar,

        corrigir,

        percentualAprovado:
          produtos.length
            ? Number(
                (
                  (aprovados /
                    produtos.length) *
                  100
                ).toFixed(1)
              )
            : 0,

      },

      produtos,

      proximaPagina:
        skip + produtos.length <
        totalProdutos
          ? page + 1
          : null,

      observacao:
        "V10 classifica os produtos sem gravar alterações no banco.",

    });

  } catch (error) {

    console.error(
      "Erro na análise V10:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          "Erro ao executar análise V10",
      },
      {
        status: 500,
      }
    );
  }
}
