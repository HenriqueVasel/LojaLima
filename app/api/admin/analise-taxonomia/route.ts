import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ============================================================
// NORMALIZAÇÃO
// ============================================================

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function has(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(normalize(value)));
}

function hasWord(text: string, value: string): boolean {
  const normalized = normalize(value);

  return new RegExp(
    `(^|\\s|[-_/().])${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|[-_/().]|$)`
  ).test(text);
}

// ============================================================
// EXTRAÇÃO DE ATRIBUTOS
// ============================================================

function extractChannels(text: string): number | null {

  // Exemplos:
  // 4 canais
  // 8 canais
  // 16 canais
  // 32CH
  // 16CH
  const explicit = text.match(
    /\b(4|8|16|24|32|64)\s*(?:CANAIS?|CH)\b/i
  );

  if (explicit) {
    return Number(explicit[1]);
  }

  // MHDX 1304 -> 4 canais
  // MHDX 1116 -> 16 canais
  // NVD 1532 -> 32 canais
  const model = text.match(
    /\b(?:IM?HDX|MHDX|NVD|NVR|DVR)[\s-]*\d{2,4}[-A-Z]?\b/i
  );

  if (model) {

    const digits = model[0].replace(/\D/g, "");

    if (digits.length >= 4) {

      const lastTwo = Number(
        digits.slice(-2)
      );

      if ([4, 8, 16, 24, 32, 64].includes(lastTwo)) {
        return lastTwo;
      }

    }
  }

  return null;
}

function extractVA(text: string): number | null {

  const match = text.match(
    /\b(\d{3,5})\s*(?:VA|KVA)\b/i
  );

  if (!match) return null;

  const value = Number(match[1]);

  if (text.includes("KVA")) {
    return value * 1000;
  }

  return value;
}

function extractVoltage(text: string): string | null {

  if (/\b220\s*V\b/i.test(text)) return "220V";

  if (/\b127\s*V\b/i.test(text)) return "127V";

  if (/\b120\s*V\b/i.test(text)) return "120V";

  if (/\b110\s*V\b/i.test(text)) return "110V";

  if (/\b12\s*V\b/i.test(text)) return "12V";

  if (/\b24\s*V\b/i.test(text)) return "24V";

  if (/\b5\s*V\b/i.test(text)) return "5V";

  return null;
}

function extractPorts(text: string): number | null {

  const match = text.match(
    /\b(\d{1,3})\s*(?:PORTAS?|PORTS?)\b/i
  );

  if (!match) return null;

  return Number(match[1]);
}

function extractResolution(text: string): string | null {

  const match = text.match(
    /\b(4K|8K|2K|1080P|720P|\d+(?:\.\d+)?MP)\b/i
  );

  return match ? match[1].toUpperCase() : null;
}

// ============================================================
// RESULTADO
// ============================================================

type Classification = {
  type: string | null;
  subtype: string | null;
  confidence: number;
  reasons: string[];
  attributes: Record<string, string | number | boolean>;
};

// ============================================================
// CLASSIFICADOR
// ============================================================

function classifyProduct(product: any): Classification {

  const name = normalize(product.name);
  const brand = normalize(product.brand);
  const line = normalize(product.line);
  const description = normalize(product.description);

  const text = `${name} ${brand} ${line} ${description}`;

  const categories =
    product.productcategory
      ?.map((pc: any) =>
        normalize(pc.category?.slug)
      )
      .filter(Boolean) ?? [];

  const attributes: Record<
    string,
    string | number | boolean
  > = {};

  const reasons: string[] = [];

  const channels = extractChannels(text);
  const va = extractVA(text);
  const voltage = extractVoltage(text);
  const ports = extractPorts(text);
  const resolution = extractResolution(text);

  if (channels) {
    attributes.canais = channels;
  }

  if (va) {
    attributes.potenciaVA = va;
  }

  if (voltage) {
    attributes.tensao = voltage;
  }

  if (ports) {
    attributes.portas = ports;
  }

  if (resolution) {
    attributes.resolucao = resolution;
  }

  if (has(text, ["POE", "POWER OVER ETHERNET"])) {
    attributes.poe = true;
  }

  // ==========================================================
  // 1. CFTV
  // ==========================================================

  if (categories.includes("cftv")) {

    // --------------------------------------------------------
    // MHDX
    // --------------------------------------------------------

    if (
      /\bI?MHDX\b/i.test(text) &&
      (
        has(text, [
          "GRAVADOR",
          "GRAVADOR DIGITAL",
          "DVR",
        ]) ||
        /\bI?MHDX\s*\d+/i.test(name)
      )
    ) {

      reasons.push("Modelo MHDX identificado");

      return {
        type: "MHDX",
        subtype: channels
          ? `${channels} canais`
          : null,
        confidence: 0.99,
        reasons,
        attributes,
      };
    }

    // --------------------------------------------------------
    // NVD / NVR
    // --------------------------------------------------------

    if (
      /\bNVD\s*\d+/i.test(text) ||
      hasWord(text, "NVR") ||
      has(text, [
        "GRAVADOR DE VIDEO EM REDE",
        "GRAVADOR DIGITAL DE VIDEO EM REDE",
      ])
    ) {

      reasons.push("Gravador de vídeo em rede identificado");

      return {
        type: "NVR",
        subtype: channels
          ? `${channels} canais`
          : null,
        confidence: 0.99,
        reasons,
        attributes,
      };
    }

    // --------------------------------------------------------
    // DVR
    // --------------------------------------------------------

    if (
      hasWord(text, "DVR") ||
      has(text, [
        "GRAVADOR DIGITAL DE VIDEO",
        "GRAVADOR DIGITAL",
        "GRAVADOR MULTI HD",
      ])
    ) {

      reasons.push("Gravador digital identificado");

      return {
        type: "DVR",
        subtype: channels
          ? `${channels} canais`
          : null,
        confidence: 0.98,
        reasons,
        attributes,
      };
    }

    // --------------------------------------------------------
    // CÂMERAS
    // --------------------------------------------------------

    const isCamera =
      has(text, [
        "CAMERA",
        "CÂMERA",
        "CAMERA IP",
        "CAMERA WI-FI",
        "CAMERA WIFI",
        "BULLET",
        "DOME",
      ]) ||
      /\bVIP\s*\d+/i.test(text) ||
      /\bVHD\s*\d+/i.test(text) ||
      /\bIM[BC]\s*\d+/i.test(text);

    if (isCamera) {

      if (
        has(text, [
          "WI-FI",
          "WIFI",
          "MIBO",
          "IM4",
          "IM5",
          "IM3",
        ])
      ) {

        reasons.push("Câmera Wi-Fi identificada");

        return {
          type: "Câmeras",
          subtype: "Wi-Fi",
          confidence: 0.98,
          reasons,
          attributes,
        };
      }

      if (
        has(text, [
          "IP",
          "VIP",
          "ONVIF",
        ])
      ) {

        reasons.push("Câmera IP identificada");

        return {
          type: "Câmeras",
          subtype: "IP",
          confidence: 0.96,
          reasons,
          attributes,
        };
      }

      if (
        has(text, [
          "VHD",
          "HDCVI",
          "MULTI-HD",
        ])
      ) {

        reasons.push("Câmera Multi-HD/HDCVI identificada");

        return {
          type: "Câmeras",
          subtype: "Multi-HD",
          confidence: 0.96,
          reasons,
          attributes,
        };
      }

      reasons.push("Câmera identificada");

      return {
        type: "Câmeras",
        subtype: null,
        confidence: 0.94,
        reasons,
        attributes,
      };
    }

    // --------------------------------------------------------
    // ACESSÓRIOS CFTV
    // --------------------------------------------------------

    if (
      has(text, [
        "CABO CFTV",
        "BALUN",
        "BNC",
        "CONECTOR BNC",
        "CAIXA DE PASSAGEM",
        "VBOX",
        "SUPORTE PARA CAMERA",
        "SUPORTE DE CAMERA",
      ])
    ) {

      reasons.push("Acessório de CFTV identificado");

      return {
        type: "Acessórios CFTV",
        subtype: null,
        confidence: 0.96,
        reasons,
        attributes,
      };
    }
  }

  // ==========================================================
  // 2. ALARMES
  // ==========================================================

  if (categories.includes("alarmes")) {

    if (
      has(text, [
        "CERCA ELETRICA",
        "CERCA ELÉTRICA",
        "ELC ",
      ])
    ) {

      reasons.push("Produto de cerca elétrica identificado");

      return {
        type: "Cerca elétrica",
        subtype: null,
        confidence: 0.97,
        reasons,
        attributes,
      };
    }

    if (
      has(text, [
        "DETECTOR DE FUMAÇA",
        "DETECTOR DE TEMPERATURA",
        "DETECTOR TERMICO",
        "DETECTOR TÉRMICO",
        "ACIONADOR MANUAL",
        "CENTRAL DE INCENDIO",
        "ALARME DE INCENDIO",
      ])
    ) {

      reasons.push("Produto de alarme de incêndio identificado");

      return {
        type: "Alarmes de incêndio",
        subtype: null,
        confidence: 0.97,
        reasons,
        attributes,
      };
    }

    if (
      has(text, [
        "SENSOR DE PRESENCA",
        "SENSOR DE PRESENÇA",
        "SENSOR IVP",
        "SENSOR IVA",
        "SENSOR MAGNETICO",
        "SENSOR MAGNÉTICO",
        "SENSOR DE ABERTURA",
        "SENSOR DE BARREIRA",
      ])
    ) {

      reasons.push("Sensor de alarme identificado");

      return {
        type: "Sensores",
        subtype: null,
        confidence: 0.98,
        reasons,
        attributes,
      };
    }

    if (
      has(text, [
        "CENTRAL DE ALARME",
        "CENTRAL ALARME",
        "CENTRAL DE ALARMES",
      ])
    ) {

      reasons.push("Central de alarme identificada");

      return {
        type: "Centrais de alarme",
        subtype: has(text, [
          "MONITORADA",
          "MONITORADO",
        ])
          ? "Monitoradas"
          : has(text, [
              "CONVENCIONAL",
              "NÃO MONITORADA",
              "NAO MONITORADA",
            ])
            ? "Não monitoradas"
            : null,
        confidence: 0.98,
        reasons,
        attributes,
      };
    }

    if (
      has(text, [
        "SIRENE",
        "SIRENA",
      ])
    ) {

      return {
        type: "Acessórios",
        subtype: "Sirenes",
        confidence: 0.96,
        reasons: ["Sirene identificada"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 3. REDES
  // ==========================================================

  if (categories.includes("redes")) {

    // ACCESS POINT
    if (
      has(text, [
        "ACCESS POINT",
        "ACCESSPOINT",
        "PONTO DE ACESSO",
        "UNIFI",
        "UNIFI ACCESS",
      ])
    ) {

      reasons.push("Access Point identificado");

      return {
        type: "Access Points",
        subtype: has(text, [
          "WIFI 6",
          "WI-FI 6",
        ])
          ? "Wi-Fi 6"
          : has(text, [
              "WIFI 7",
              "WI-FI 7",
            ])
            ? "Wi-Fi 7"
            : null,
        confidence: 0.99,
        reasons,
        attributes,
      };
    }

    // ROTEADOR
    if (
      has(text, [
        "ROTEADOR",
        "ROUTER",
      ])
    ) {

      reasons.push("Roteador identificado");

      return {
        type: "Roteadores",
        subtype: null,
        confidence: 0.99,
        reasons,
        attributes,
      };
    }

    // SWITCH
    if (
      hasWord(text, "SWITCH") ||
      has(text, [
        "SWITCH GIGABIT",
        "SWITCH POE",
        "SWITCH GERENCIAVEL",
        "SWITCH GERENCIÁVEL",
      ])
    ) {

      reasons.push("Switch identificado");

      return {
        type: "Switches",
        subtype: attributes.poe === true
          ? "PoE"
          : null,
        confidence: 0.99,
        reasons,
        attributes,
      };
    }

    // ONU / ONT
    if (
      has(text, [
        "ONU",
        "ONT",
        "GPON",
        "EPON",
        "XPON",
      ]) &&
      has(text, [
        "FIBRA",
        "PON",
        "GPON",
        "EPON",
        "XPON",
        "OPTICO",
        "ÓPTICO",
      ])
    ) {

      reasons.push("Equipamento óptico/ONU identificado");

      return {
        type: "Fibra Óptica",
        subtype: has(text, ["ONU"])
          ? "ONU"
          : "ONT",
        confidence: 0.97,
        reasons,
        attributes,
      };
    }

    // CABOS
    if (
      has(text, [
        "PATCH CORD",
        "CABO U/UTP",
        "CABO UTP",
        "CABO CAT5E",
        "CABO CAT6",
        "CABO CAT6A",
        "CABO DE REDE",
      ])
    ) {

      const categoria =
        has(text, ["PATCH CORD"])
          ? "Patch Cords"
          : "Cabos de Rede";

      reasons.push("Cabeamento de rede identificado");

      return {
        type: categoria,
        subtype: has(text, ["CAT6A"])
          ? "CAT6A"
          : has(text, ["CAT6"])
            ? "CAT6"
            : has(text, ["CAT5E"])
              ? "CAT5E"
              : null,
        confidence: 0.98,
        reasons,
        attributes,
      };
    }

    // CONECTORES
    if (
      has(text, [
        "CONECTOR RJ45",
        "CONECTOR RJ11",
        "KEYSTONE",
        "CONECTOR DE REDE",
      ])
    ) {

      return {
        type: "Conectores",
        subtype: null,
        confidence: 0.98,
        reasons: ["Conector de rede identificado"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 4. ENERGIA
  // ==========================================================

  if (categories.includes("energia")) {

    // NOBREAK
    if (
      has(text, [
        "NOBREAK",
        "NO-BREAK",
        "UPS",
      ])
    ) {

      reasons.push("Nobreak identificado");

      let subtype: string | null = null;

      if (has(text, ["SENOIDAL"])) {
        subtype = "Senoidal";
      } else if (has(text, ["ONLINE"])) {
        subtype = "Online";
      } else if (has(text, ["INTERATIVO"])) {
        subtype = "Interativo";
      } else if (has(text, ["PORTAO", "PORTÃO"])) {
        subtype = "Portão";
      }

      return {
        type: "Nobreaks",
        subtype,
        confidence: 0.99,
        reasons,
        attributes,
      };
    }

    // FONTES
    if (
      has(text, [
        "FONTE",
        "FONTE DE ALIMENTACAO",
        "FONTE DE ALIMENTAÇÃO",
        "FONTE NOBREAK",
      ]) &&
      !has(text, [
        "NOBREAK INTERATIVO",
        "NOBREAK ONLINE",
      ])
    ) {

      reasons.push("Fonte de alimentação identificada");

      return {
        type: "Fontes",
        subtype: null,
        confidence: 0.97,
        reasons,
        attributes,
      };
    }

    // BATERIAS
    if (
      has(text, [
        "BATERIA",
        "BATERIAS",
        "VRLA",
        "SELADA",
      ]) &&
      !has(text, [
        "FURADEIRA",
        "PARAFUSADEIRA",
        "MARTELETE",
      ])
    ) {

      reasons.push("Bateria identificada");

      return {
        type: "Baterias",
        subtype: null,
        confidence: 0.97,
        reasons,
        attributes,
      };
    }

    // ESTABILIZADORES
    if (
      has(text, [
        "ESTABILIZADOR",
        "ESTABILIZADORES",
      ])
    ) {

      return {
        type: "Estabilizadores",
        subtype: null,
        confidence: 0.98,
        reasons: ["Estabilizador identificado"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 5. CONTROLE DE ACESSO
  // ==========================================================

  if (categories.includes("controle-de-acesso")) {

    if (
      has(text, [
        "CONTROLADOR DE ACESSO",
        "CONTROLADORA DE ACESSO",
      ])
    ) {

      return {
        type: "Controladores",
        subtype: null,
        confidence: 0.99,
        reasons: ["Controlador de acesso identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "LEITOR RFID",
        "RFID",
        "LEITOR BIOMETRICO",
        "LEITOR BIOMÉTRICO",
        "LEITOR FACIAL",
      ])
    ) {

      return {
        type: "Leitores",
        subtype: has(text, [
          "RFID",
          "PROXIMIDADE",
        ])
          ? "RFID"
          : has(text, [
              "FACIAL",
              "FACE",
            ])
            ? "Faciais"
            : "Biométricos",
        confidence: 0.98,
        reasons: ["Leitor de acesso identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "CONTROLADOR FACIAL",
        "BIOMETRIA",
        "BIOMÉTRICO",
        "BIOMETRICO",
      ])
    ) {

      return {
        type: "Biometria",
        subtype: null,
        confidence: 0.98,
        reasons: ["Biometria identificada"],
        attributes,
      };
    }

    if (
      has(text, [
        "CARTAO DE PROXIMIDADE",
        "CARTÃO DE PROXIMIDADE",
        "TAG RFID",
        "TAG DE PROXIMIDADE",
      ])
    ) {

      return {
        type: "Acessórios",
        subtype: "Tags e cartões",
        confidence: 0.98,
        reasons: ["Tag/cartão de acesso identificado"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 6. FECHADURAS
  // ==========================================================

  if (categories.includes("fechaduras")) {

    if (
      has(text, [
        "FECHADURA DIGITAL",
        "FECHADURA ELETRONICA",
        "FECHADURA ELETRÔNICA",
        "FECHADURA INTELIGENTE",
      ])
    ) {

      return {
        type: "Fechaduras Digitais",
        subtype: has(text, ["BIOMETRIA", "BIOMETRICA", "BIOMÉTRICA"])
          ? "Biometria"
          : has(text, ["RFID", "CARTAO", "CARTÃO"])
            ? "Cartão"
            : has(text, ["SENHA"])
              ? "Senha"
              : null,
        confidence: 0.99,
        reasons: ["Fechadura digital identificada"],
        attributes,
      };
    }

    if (
      has(text, [
        "FECHADURA ELETROMAGNETICA",
        "FECHADURA ELETROIM",
        "FECHADURA ELETROÍM",
        "FECHADURA ELETRICA",
        "FECHADURA ELÉTRICA",
      ])
    ) {

      return {
        type: "Fechaduras",
        subtype: "Elétricas",
        confidence: 0.98,
        reasons: ["Fechadura elétrica/eletromagnética identificada"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 7. PORTEIROS
  // ==========================================================

  if (categories.includes("porteiros")) {

    if (
      has(text, [
        "VIDEOPORTEIRO",
        "VIDEO PORTEIRO",
        "VÍDEO PORTEIRO",
      ])
    ) {

      return {
        type: "Vídeo Porteiro",
        subtype: has(text, [
          "WI-FI",
          "WIFI",
          "IP",
        ])
          ? "IP / Wi-Fi"
          : null,
        confidence: 0.99,
        reasons: ["Vídeo porteiro identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "PORTEIRO",
        "INTERFONE",
        "CENTRAL DE PORTARIA",
        "PORTARIA",
      ])
    ) {

      return {
        type: "Porteiros",
        subtype: has(text, [
          "CENTRAL",
        ])
          ? "Centrais"
          : null,
        confidence: 0.97,
        reasons: ["Produto de portaria identificado"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 8. AUTOMATIZADORES
  // ==========================================================

  if (categories.includes("automatizadores")) {

    if (
      has(text, [
        "CANCELA",
        "CANCELAS",
      ])
    ) {

      return {
        type: "Cancelas",
        subtype: null,
        confidence: 0.99,
        reasons: ["Cancela identificada"],
        attributes,
      };
    }

    if (
      has(text, [
        "AUTOMATIZADOR",
        "MOTOR DE PORTAO",
        "MOTOR DE PORTÃO",
        "MOTOR PORTAO",
        "MOTOR PORTÃO",
      ])
    ) {

      return {
        type: "Automatizadores",
        subtype: has(text, [
          "BASCULANTE",
        ])
          ? "Basculante"
          : has(text, [
              "DESLIZANTE",
            ])
            ? "Deslizante"
            : has(text, [
                "PIVOTANTE",
              ])
              ? "Pivotante"
              : null,
        confidence: 0.99,
        reasons: ["Automatizador identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "CONTROLE REMOTO",
        "TX ",
        "TRANSMISSOR",
      ])
    ) {

      return {
        type: "Controles Remotos",
        subtype: null,
        confidence: 0.96,
        reasons: ["Controle remoto identificado"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 9. CABEAMENTO
  // ==========================================================

  if (categories.includes("cabeamento")) {

    if (
      has(text, [
        "PATCH CORD",
      ])
    ) {

      return {
        type: "Cabos",
        subtype: "Patch Cord",
        confidence: 0.99,
        reasons: ["Patch Cord identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "CABO",
        "CABLE",
      ])
    ) {

      return {
        type: "Cabos",
        subtype: has(text, ["CAT6A"])
          ? "CAT6A"
          : has(text, ["CAT6"])
            ? "CAT6"
            : has(text, ["CAT5E"])
              ? "CAT5E"
              : null,
        confidence: 0.94,
        reasons: ["Cabo identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "CONECTOR",
        "RJ45",
        "RJ11",
        "KEYSTONE",
      ])
    ) {

      return {
        type: "Conectores",
        subtype: null,
        confidence: 0.98,
        reasons: ["Conector identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "PATCH PANEL",
        "PATCH PANEL DESCARREGADO",
      ])
    ) {

      return {
        type: "Patch Panels",
        subtype: ports
          ? `${ports} portas`
          : null,
        confidence: 0.99,
        reasons: ["Patch Panel identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "FIBRA OPTICA",
        "FIBRA ÓPTICA",
        "CABO OPTICO",
        "CABO ÓPTICO",
        "SC/APC",
        "SC/UPC",
      ])
    ) {

      return {
        type: "Fibra Óptica",
        subtype: null,
        confidence: 0.97,
        reasons: ["Fibra óptica identificada"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 10. TELEFONIA
  // ==========================================================

  if (categories.includes("telefonia")) {

    if (
      has(text, [
        "TELEFONE SEM FIO",
        "TELEFONE COM FIO",
        "TELEFONE",
      ])
    ) {

      return {
        type: "Telefones",
        subtype: has(text, [
          "SEM FIO",
        ])
          ? "Sem fio"
          : "Com fio",
        confidence: 0.98,
        reasons: ["Telefone identificado"],
        attributes,
      };
    }

    if (
      has(text, [
        "PABX",
        "CENTRAL TELEFONICA",
        "CENTRAL TELEFÔNICA",
      ])
    ) {

      return {
        type: "Centrais Telefônicas",
        subtype: null,
        confidence: 0.98,
        reasons: ["Central telefônica identificada"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 11. MONITORES
  // ==========================================================

  if (categories.includes("monitores")) {

    if (
      has(text, [
        "MONITOR",
        "MONITOR LED",
        "MONITOR LCD",
      ])
    ) {

      return {
        type: "Monitores",
        subtype: resolution ?? null,
        confidence: 0.98,
        reasons: ["Monitor identificado"],
        attributes,
      };
    }
  }

  // ==========================================================
  // 12. DIVERSOS
  // ==========================================================

  // IMPORTANTE:
  //
  // Não vamos inventar classificação para DIVERSOS.
  //
  // A versão anterior estava fazendo exatamente isso
  // e colocando produtos aleatórios em Access Points,
  // Sensores, Câmeras etc.

  if (categories.includes("diversos")) {

    return {
      type: null,
      subtype: null,
      confidence: 0,
      reasons: [
        "Produto pertence a DIVERSOS e não possui classificação segura",
      ],
      attributes,
    };
  }

  // ==========================================================
  // NÃO IDENTIFICADO
  // ==========================================================

  return {
    type: null,
    subtype: null,
    confidence: 0,
    reasons: [
      "Nenhuma regra segura encontrou uma classificação",
    ],
    attributes,
  };
}

// ============================================================
// GET
// ============================================================

export async function GET() {

  try {

    const products = await prisma.product.findMany({

      select: {

        id: true,
        name: true,
        sku: true,
        brand: true,
        line: true,
        description: true,

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

      },

      orderBy: {
        id: "asc",
      },

    });

    // ========================================================
    // CLASSIFICAÇÃO
    // ========================================================

    const classified = products.map((product) => {

      const result = classifyProduct(product);

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        brand: product.brand,

        categories:
          product.productcategory?.map(
            (pc: any) => pc.category
          ) ?? [],

        ...result,
      };

    });

    // ========================================================
    // AGRUPAMENTO POR CATEGORIA
    // ========================================================

    const categoryMap = new Map<
      string,
      {
        id: number;
        name: string;
        slug: string;
        totalProducts: number;
        types: Map<
          string,
          {
            type: string;
            quantity: number;
            examples: any[];
          }
        >;
      }
    >();

    for (const product of classified) {

      for (const category of product.categories) {

        if (!categoryMap.has(category.slug)) {

          categoryMap.set(category.slug, {

            id: category.id,
            name: category.name,
            slug: category.slug,
            totalProducts: 0,
            types: new Map(),

          });

        }

        const categoryData =
          categoryMap.get(category.slug)!;

        categoryData.totalProducts++;

        const typeName =
          product.type ?? "Não identificado";

        if (!categoryData.types.has(typeName)) {

          categoryData.types.set(typeName, {

            type: typeName,
            quantity: 0,
            examples: [],

          });

        }

        const typeData =
          categoryData.types.get(typeName)!;

        typeData.quantity++;

        if (typeData.examples.length < 20) {

          typeData.examples.push({

            id: product.id,
            name: product.name,
            sku: product.sku,
            brand: product.brand,

            subtype: product.subtype,

            confidence:
              product.confidence,

            attributes:
              product.attributes,

            reasons:
              product.reasons,

          });

        }

      }

    }

    // ========================================================
    // PRODUTOS PARA REVISÃO
    // ========================================================

    const review = classified
      .filter(
        (product) =>
          !product.type ||
          product.confidence < 0.90
      )
      .slice(0, 500);

    // ========================================================
    // RESUMO
    // ========================================================

    const classifiedCount =
      classified.filter(
        (product) =>
          product.type &&
          product.confidence >= 0.90
      ).length;

    const unclassifiedCount =
      classified.length -
      classifiedCount;

    const percentage =
      classified.length > 0
        ? Number(
            (
              (classifiedCount /
                classified.length) *
              100
            ).toFixed(2)
          )
        : 0;

    const categories = Array.from(
      categoryMap.values()
    ).map((category) => ({

      id: category.id,

      name: category.name,

      slug: category.slug,

      totalProducts:
        category.totalProducts,

      types:
        Array.from(
          category.types.values()
        ).sort(
          (a, b) =>
            b.quantity - a.quantity
        ),

    }));

    // ========================================================
    // RESPOSTA
    // ========================================================

    return NextResponse.json({

      sucesso: true,

      versao: "2.0",

      resumo: {

        totalProdutos:
          products.length,

        produtosClassificados:
          classifiedCount,

        produtosParaRevisao:
          unclassifiedCount,

        percentualClassificado:
          percentage,

        categoriasAnalisadas:
          categories.length,

      },

    categories,

revisao: review,

      observacao:
        "Esta rota somente analisa os produtos. Nenhum dado é gravado no banco.",

    });

  } catch (error) {

    console.error(
      "Erro na análise de taxonomia:",
      error
    );

    return NextResponse.json(

      {
        sucesso: false,
        erro:
          "Erro ao analisar taxonomia",
      },

      {
        status: 500,
      }

    );

  }

}