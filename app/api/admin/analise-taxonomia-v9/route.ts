import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/*
|--------------------------------------------------------------------------
| V9 — MOTOR FINAL DE CLASSIFICAÇÃO
|--------------------------------------------------------------------------
|
| Esta rota NÃO grava nada no banco.
|
| Ela analisa os produtos e produz uma classificação FINAL:
|
| família
| tipo
| subtipo
| linha
| atributos
|
| Depois de validarmos o resultado, criaremos a rota de aplicação.
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
| Extração de canais
|--------------------------------------------------------------------------
*/

function extractChannels(text: string): number | null {

  const patterns = [
    /(?:^|\s)(4|8|16|32|64|128|256)\s*(?:CANAIS|CH|CHS)(?:\s|$)/,
    /(?:DVR|NVR|MHDX|NVD|IMHDX|INVD)[^\d]{0,10}(4|8|16|32|64|128|256)/,
  ];

  for (const pattern of patterns) {

    const match = text.match(pattern);

    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Extração de tensão
|--------------------------------------------------------------------------
*/

function extractVoltage(text: string): string | null {

  const match = text.match(
    /\b(12V|24V|110V|120V|127V|220V|230V|240V)\b/
  );

  return match?.[1] || null;
}

/*
|--------------------------------------------------------------------------
| Classificação V9
|--------------------------------------------------------------------------
*/

function classifyProduct(product: ProductInput): Classification {

  const name = normalize(product.name);
  const description = normalize(product.description || "");
  const categories = normalize(
    (product.categories || []).join(" ")
  );

  /*
  |--------------------------------------------------------------------------
  | CONTEXTO
  |--------------------------------------------------------------------------
  */

  const text = `${name} ${description}`;

  /*
  |--------------------------------------------------------------------------
  | REGRAS DE EXCLUSÃO
  |--------------------------------------------------------------------------
  |
  | Algumas palavras NÃO podem determinar a família.
  |
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
  | 1. CFTV
  |--------------------------------------------------------------------------
  */

  // DVR
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
      MHDX: "MHDX",
      IMHDX: "IMHDX",
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

  // NVR
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
      NVD: "NVD",
      INVD: "INVD",
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
  | Câmeras
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CAMERA",
      "CÂMERA",
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
        "VIPW",
        "VIP"
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

    return {
      family: "cftv",
      type: "Câmeras",
      subtype,
      line,
      attributes: {
        ...(has(name, "WI-FI", "WIFI")
          ? { tecnologia: "Wi-Fi" }
          : {}),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | VÍDEO PORTEIRO
  |--------------------------------------------------------------------------
  |
  | IMPORTANTE:
  | Isso vem ANTES de IP.
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "VIDEO PORTEIRO",
      "VÍDEO PORTEIRO",
      "TVIP",
      "PORTEIRO VIDEO",
      "PORTEIRO ELETRONICO"
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
  | ALARMES
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "ALARME",
      "CENTRAL DE ALARME",
      "SIRENE",
      "RECEPTOR XAR",
      "TECLADO XAT"
    )
  ) {

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

      if (has(name, "IVP")) {
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
        family: "sensores",
        type: "Sensores",
        subtype,
        line: null,
        attributes: {},
      };
    }

    if (
      has(
        name,
        "SIRENE",
        "SIR "
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

    return {
      family: "alarmes",
      type: "Alarmes",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CONTROLE DE ACESSO
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
  | RFID / CREDENCIAIS
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
  | FECHADURAS
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "FECHADURA",
      "FECHADURA DIGITAL",
      "FECHADURA ELETRICA",
      "FECHADURA ELÉTRICA",
      "SOLENOIDE"
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
  | ENERGIA
  |--------------------------------------------------------------------------
  */

  /*
  | IMPORTANTE:
  | "ACOMPANHA BATERIA" não transforma nobreak em bateria.
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
          ? { tensao: extractVoltage(text) }
          : {}),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | BATERIAS
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
  | FONTES
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
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | REDES
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "SWITCH",
      "SWITCHES"
    )
  ) {

    return {
      family: "redes",
      type: "Switches",
      subtype: has(
        name,
        "NAO GERENCIAVEL",
        "NÃO GERENCIÁVEL"
      )
        ? "Switch Não Gerenciável"
        : has(name, "GERENCIAVEL", "GERENCIÁVEL")
          ? "Switch Gerenciável"
          : null,
      line: null,
      attributes: {},
    };
  }

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
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CABEAMENTO
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
  | CONECTORES
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
  | TELEFONIA
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CENTRAL TELEFONICA",
      "CENTRAL TELEFÔNICA",
      "IMPACTA",
      "COMUNIC 48",
      "COMUNIC 80",
      "CP112",
      "CP4030"
    )
  ) {

    return {
      family: "telefonia",
      type: "Centrais Telefônicas",
      subtype: null,
      line: firstMatch(name, {
        IMPACTA: "IMPACTA",
        "COMUNIC 48": "COMUNIC",
        "COMUNIC 80": "COMUNIC",
      }),
      attributes: {},
    };
  }

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
  | AUTOMATIZADORES
  |--------------------------------------------------------------------------
  */

  if (
    has(
      name,
      "CREMALHEIRA",
      "ENGRENAGEM",
      "ENGRENAGEM CREM",
      "POLIA",
      "COROA",
      "MANCAL",
      "FUSO",
      "MOTOR",
      "REPOSICAO",
      "REPOSIÇÃO",
      "SUPORTE",
      "ROLAMENTO"
    ) &&
    (
      has(
        name,
        "DZ",
        "GATTER",
        "LIGHT",
        "SUPER",
        "DESLIZANTE",
        "PIVOTANTE",
        "AUTOMATIZADOR"
      ) ||
      categories.includes("AUTOMATIZADORES")
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
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK CONTROLADO
  |--------------------------------------------------------------------------
  |
  | Não vamos inventar classificação.
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

function calculateScore(classification: Classification) {

  let score = 0;

  if (classification.family) score += 40;

  if (classification.type) score += 25;

  if (classification.subtype) score += 20;

  if (classification.line) score += 10;

  if (
    Object.keys(classification.attributes).length > 0
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

    const { searchParams } = new URL(req.url);

    const page = Math.max(
      Number(searchParams.get("page") || "1"),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit") || "500"),
        1
      ),
      500
    );

    const skip = (page - 1) * limit;

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

    const produtos = products.map((product) => {

      const categories =
        product.productcategory?.map(
          (item) => item.category.name
        ) || [];

      const classification =
        classifyProduct({
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description,
          categories,
        });

      const score =
        calculateScore(classification);

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
        (p) => p.status === "APROVADO"
      ).length;

    const revisar =
      produtos.filter(
        (p) => p.status === "REVISAR"
      ).length;

    const corrigir =
      produtos.filter(
        (p) => p.status === "CORRIGIR"
      ).length;

    return NextResponse.json({

      sucesso: true,

      versao: "9.0",

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
        "V9 classifica os produtos sem gravar alterações no banco.",

    });

  } catch (error) {

    console.error(
      "Erro na análise V9:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro ao executar análise V9",
      },
      {
        status: 500,
      }
    );

  }

}