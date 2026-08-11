import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Classification = {
  type: string;
  subtype: string | null;
  line: string | null;
  attributes: Record<string, any>;
  confidence: number;
  status: "classificado" | "revisao";
  reasons: string[];
};

/* =========================================================
   NORMALIZAÇÃO
========================================================= */

function normalize(value: any): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function has(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function extractNumber(
  text: string,
  regex: RegExp
): number | null {
  const match = text.match(regex);

  if (!match) return null;

  const value = Number(match[1]);

  return Number.isFinite(value) ? value : null;
}

/* =========================================================
   ATRIBUTOS GERAIS
========================================================= */

function extractGeneralAttributes(text: string) {

  const attributes: Record<string, any> = {};

  // -------------------------------------------------------
  // TENSÃO
  // -------------------------------------------------------

  const tensao =
    text.match(
      /(?:^|[^0-9])(110|115|120|127|220|230|240|12|24|48|36)(?:V)(?![A-Z0-9])/i
    );

  if (tensao) {
    attributes.tensao = `${tensao[1]}V`;
  }

  // -------------------------------------------------------
  // CANAIS
  // -------------------------------------------------------

  const canais =
    text.match(
      /(?:^|\s)(4|8|16|32|64|128)\s*(?:CANAIS|CH)(?:\s|$)/i
    );

  if (canais) {
    attributes.canais = Number(canais[1]);
  }

  // -------------------------------------------------------
  // PORTAS
  // -------------------------------------------------------

  const portas =
    text.match(
      /(?:^|\s)(4|5|8|10|16|24|26|28|48)\s*(?:PORTAS|P)(?:\s|$)/i
    );

  if (portas) {
    attributes.portas = Number(portas[1]);
  }

  // -------------------------------------------------------
  // VA / KVA
  // -------------------------------------------------------

  const potenciaVA =
    text.match(
      /(\d+(?:[.,]\d+)?)\s*(KVA|VA)\b/i
    );

  if (potenciaVA) {

    let value = Number(
      potenciaVA[1].replace(",", ".")
    );

    if (potenciaVA[2].toUpperCase() === "KVA") {
      value *= 1000;
    }

    attributes.potenciaVA = value;
  }

  // -------------------------------------------------------
  // RESOLUÇÃO
  // -------------------------------------------------------

  const resolucao =
    text.match(
      /(\d+(?:[.,]\d+)?)\s*(MP|MEGAPIXEL|K|4K|1080P|720P)/i
    );

  if (resolucao) {

    const raw = resolucao[0]
      .replace(/\s+/g, "")
      .toUpperCase();

    attributes.resolucao = raw;
  }

  // -------------------------------------------------------
  // POE
  // -------------------------------------------------------

  if (
    /\bPOE\b/.test(text) ||
    /\bHI-POE\b/.test(text)
  ) {
    attributes.poe = true;
  }

  return attributes;
}

/* =========================================================
   CFTV
========================================================= */

function classifyCFTV(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  // -------------------------------------------------------
  // DVR
  // -------------------------------------------------------

  if (
    /\bMHDX\b/.test(text) ||
    /\bIMHDX\b/.test(text) ||
    /\bDVR\b/.test(text) ||
    /GRAVADOR.*MULTI.?HD/.test(text)
  ) {

    let line: string | null = null;

    if (/\bIMHDX\b/.test(text)) {
      line = "IMHDX";
    } else if (/\bMHDX\b/.test(text)) {
      line = "MHDX";
    }

    const confidence =
      attributes.canais
        ? 0.99
        : line
          ? 0.96
          : 0.90;

    return {
      type: "DVR",
      subtype: "Gravador de vídeo",
      line,
      attributes,
      confidence,
      status: "classificado",
      reasons: [
        "Produto identificado como DVR pelo nome",
        ...(line ? [`Linha ${line} identificada`] : []),
        ...(attributes.canais
          ? [`${attributes.canais} canais identificados`]
          : []),
      ],
    };
  }

  // -------------------------------------------------------
  // NVR
  // -------------------------------------------------------

  if (
    /\bNVD\b/.test(text) ||
    /\bINVD\b/.test(text) ||
    /\bNVR\b/.test(text)
  ) {

    let line: string | null = null;

    if (/\bINVD\b/.test(text)) {
      line = "INVD";
    } else if (/\bNVD\b/.test(text)) {
      line = "NVD";
    }

    return {
      type: "NVR",
      subtype: "Gravador de vídeo IP",
      line,
      attributes,
      confidence: attributes.canais ? 0.99 : 0.96,
      status: "classificado",
      reasons: [
        "Produto identificado como NVR pelo nome",
        ...(line ? [`Linha ${line} identificada`] : []),
        ...(attributes.canais
          ? [`${attributes.canais} canais identificados`]
          : []),
      ],
    };
  }

  // -------------------------------------------------------
  // CÂMERAS WI-FI
  // -------------------------------------------------------

  if (
    /\bWI[- ]?FI\b/.test(text) ||
    /\bIM[0-9]/.test(text) ||
    /\bIZC\b/.test(text)
  ) {

    let line: string | null = null;

    const lineMatch = text.match(
      /\b(IM\d+(?:\+?ZOOM)?|IMX\d+C?|IZC\s*\d+)\b/
    );

    if (lineMatch) {
      line = lineMatch[1].replace(/\s+/g, "");
    }

    return {
      type: "Câmera",
      subtype: "Wi-Fi",
      line,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Câmera Wi-Fi identificada",
        ...(line ? [`Linha ${line} identificada`] : []),
      ],
    };
  }

  // -------------------------------------------------------
  // CÂMERA IP
  // -------------------------------------------------------

  if (
    /\bCAMERA IP\b/.test(text) ||
    /\bCÂMERA IP\b/.test(text) ||
    /\bVIP\b/.test(text)
  ) {

    let line: string | null = null;

    const lineMatch = text.match(
      /\b(VIPW?\s*\d+[A-Z0-9]*|VIP\s*\d+[A-Z0-9]*)\b/
    );

    if (lineMatch) {
      line = lineMatch[1].replace(/\s+/g, "");
    }

    return {
      type: "Câmera",
      subtype: "IP",
      line,
      attributes,
      confidence: 0.96,
      status: "classificado",
      reasons: [
        "Câmera IP identificada",
        ...(line ? [`Linha ${line} identificada`] : []),
      ],
    };
  }

  // -------------------------------------------------------
  // CÂMERA MULTI-HD
  // -------------------------------------------------------

  if (
    /\bVHD\b/.test(text) ||
    /\bVHDM\b/.test(text) ||
    /\bMULTI[- ]?HD\b/.test(text)
  ) {

    return {
      type: "Câmera",
      subtype: "Multi-HD",
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Câmera Multi-HD identificada",
      ],
    };
  }

  // -------------------------------------------------------
  // HD / DISCO
  // -------------------------------------------------------

  if (
    /\bHD\s*\d+\s*TB\b/.test(text) ||
    /\bHARD DISK\b/.test(text)
  ) {

    return {
      type: "Armazenamento",
      subtype: "HD para CFTV",
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "HD identificado como armazenamento para CFTV",
      ],
    };
  }

  // -------------------------------------------------------
  // ACESSÓRIOS
  // -------------------------------------------------------

  if (
    has(text, [
      "CONECTOR",
      "EXTENSOR HDMI",
      "EXTENSOR",
      "FONTE",
      "BALUN",
      "SUPORTE",
      "CABO",
    ])
  ) {

    return {
      type: "Acessórios",
      subtype: "Acessórios CFTV",
      line: null,
      attributes,
      confidence: 0.88,
      status: "classificado",
      reasons: [
        "Produto identificado como acessório de CFTV",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a CFTV mas não foi possível identificar o tipo com segurança",
    ],
  };
}

/* =========================================================
   ENERGIA
========================================================= */

function classifyEnergia(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  // -------------------------------------------------------
  // NOBREAK
  // -------------------------------------------------------

  if (/\bNOBREAK\b/.test(text)) {

    let subtype = "Nobreak";

    if (/\bONLINE\b/.test(text)) {
      subtype = "Nobreak Online";
    } else if (/\bSENOIDAL\b/.test(text)) {
      subtype = "Nobreak Senoidal";
    }

    return {
      type: "Nobreaks",
      subtype,
      line: null,
      attributes,
      confidence: attributes.potenciaVA ? 0.99 : 0.97,
      status: "classificado",
      reasons: [
        "Nobreak identificado",
        ...(attributes.potenciaVA
          ? [`Potência ${attributes.potenciaVA}VA identificada`]
          : []),
        ...(attributes.tensao
          ? [`Tensão ${attributes.tensao} identificada`]
          : []),
      ],
    };
  }

  // -------------------------------------------------------
  // FONTES
  // -------------------------------------------------------

  if (
    /\bFONTE\b/.test(text) ||
    /\bEFM\b/.test(text) ||
    /\bEF\s*\d+/.test(text)
  ) {

    return {
      type: "Fontes",
      subtype: "Fonte de alimentação",
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Fonte de alimentação identificada",
      ],
    };
  }

  // -------------------------------------------------------
  // BATERIAS
  // -------------------------------------------------------

  if (
    /\bBATERIA\b/.test(text) ||
    /\bBATERIAS\b/.test(text)
  ) {

    return {
      type: "Baterias",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Bateria identificada",
      ],
    };
  }

  // -------------------------------------------------------
  // MÓDULO DE BATERIA
  // -------------------------------------------------------

  if (
    /\bMODULO DE BATERIAS\b/.test(text) ||
    /\bMÓDULO DE BATERIAS\b/.test(text) ||
    /\bMB\s*\d+/.test(text)
  ) {

    return {
      type: "Módulos de bateria",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Módulo de bateria identificado",
      ],
    };
  }

  // -------------------------------------------------------
  // PROTEÇÃO
  // -------------------------------------------------------

  if (
    /\bPROTETOR\b/.test(text) ||
    /\bPROTEÇÃO\b/.test(text) ||
    /\bREGUA\b/.test(text) ||
    /\bRÉGUA\b/.test(text)
  ) {

    return {
      type: "Proteção elétrica",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.90,
      status: "classificado",
      reasons: [
        "Produto identificado como proteção elétrica",
      ],
    };
  }

  // -------------------------------------------------------
  // SMART / TOMADA
  // -------------------------------------------------------

  if (
    /\bTOMADA\b/.test(text) ||
    /\bINTERRUPTOR\b/.test(text)
  ) {

    return {
      type: "Acessórios de energia",
      subtype: "Tomadas e interruptores",
      line: null,
      attributes,
      confidence: 0.90,
      status: "classificado",
      reasons: [
        "Produto identificado como acessório de energia",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Energia mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   REDES
========================================================= */

function classifyRedes(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  // SWITCH
  if (/\bSWITCH\b/.test(text)) {

    let subtype = "Switch";

    if (/GERENCIAVEL/.test(text)) {
      subtype = "Switch gerenciável";
    }

    if (/NAO GERENCIAVEL/.test(text)) {
      subtype = "Switch não gerenciável";
    }

    return {
      type: "Switches",
      subtype,
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Switch identificado",
        ...(attributes.portas
          ? `${attributes.portas} portas identificadas`
          : ""),
      ].filter(Boolean),
    };
  }

  // ROTEADOR
  if (
    /\bROTEADOR\b/.test(text) ||
    /\bROUTER\b/.test(text)
  ) {

    return {
      type: "Roteadores",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Roteador identificado",
      ],
    };
  }

  // ACCESS POINT
  if (
    /\bACCESS POINT\b/.test(text) ||
    /\bAP\s+\d+/.test(text) ||
    /\bU[0-9]+[- ]/.test(text)
  ) {

    return {
      type: "Access Points",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.96,
      status: "classificado",
      reasons: [
        "Access Point identificado",
      ],
    };
  }

  // FIBRA
  if (
    /\bFIBRA\b/.test(text) ||
    /\bSC\/APC\b/.test(text) ||
    /\bSC\/UPC\b/.test(text) ||
    /\bPLC\b/.test(text)
  ) {

    return {
      type: "Fibra óptica",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.95,
      status: "classificado",
      reasons: [
        "Produto de fibra óptica identificado",
      ],
    };
  }

  // RACK
  if (
    /\bRACK\b/.test(text) ||
    /\bBANDEJA\b/.test(text)
  ) {

    return {
      type: "Racks e acessórios",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.94,
      status: "classificado",
      reasons: [
        "Produto de rack identificado",
      ],
    };
  }

  // CABOS
  if (
    /\bCABO\b/.test(text) ||
    /\bPATCH CORD\b/.test(text)
  ) {

    return {
      type: "Cabeamento",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.94,
      status: "classificado",
      reasons: [
        "Produto de cabeamento identificado",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Redes mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   ALARMES
========================================================= */

function classifyAlarmes(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  if (
    /\bSENSOR\b/.test(text) ||
    /\bIVP\b/.test(text) ||
    /\bIVA\b/.test(text) ||
    /\bXAS\b/.test(text)
  ) {

    let subtype = "Sensor";

    if (
      /\bIVP\b/.test(text) ||
      /PRESENCA/.test(text)
    ) {
      subtype = "Sensor de presença";
    }

    if (
      /\bIVA\b/.test(text) ||
      /BARREIRA/.test(text)
    ) {
      subtype = "Sensor de barreira";
    }

    if (
      /MAGNETICO/.test(text) ||
      /\bXAS\b/.test(text)
    ) {
      subtype = "Sensor magnético";
    }

    return {
      type: "Sensores",
      subtype,
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Sensor identificado",
      ],
    };
  }

  if (
    /\bCENTRAL\b/.test(text) &&
    (
      /\bAMT\b/.test(text) ||
      /\bANM\b/.test(text)
    )
  ) {

    return {
      type: "Centrais de alarme",
      subtype: "Central de alarme",
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Central de alarme identificada",
      ],
    };
  }

  if (
    /\bCIE\b/.test(text) ||
    /ALARME DE INCENDIO/.test(text) ||
    /ALARME DE INCÊNDIO/.test(text)
  ) {

    return {
      type: "Alarme de incêndio",
      subtype: "Central de incêndio",
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Produto de alarme de incêndio identificado",
      ],
    };
  }

  if (
    /\bSIRENE\b/.test(text)
  ) {

    return {
      type: "Sirenes",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.99,
      status: "classificado",
      reasons: [
        "Sirene identificada",
      ],
    };
  }

  if (
    /\bDETECTOR\b/.test(text) ||
    /\bFUMACA\b/.test(text) ||
    /\bFUMAÇA\b/.test(text)
  ) {

    return {
      type: "Detectores",
      subtype: "Detector de fumaça",
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Detector identificado",
      ],
    };
  }

  if (
    /\bCERCA\b/.test(text)
  ) {

    return {
      type: "Cerca elétrica",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.90,
      status: "classificado",
      reasons: [
        "Produto relacionado a cerca elétrica",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Alarmes mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   CONTROLE DE ACESSO
========================================================= */

function classifyControleAcesso(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  if (
    /\bCONTROLADOR\b/.test(text) ||
    /\bCONTROLADORA\b/.test(text)
  ) {

    let subtype = "Controlador de acesso";

    if (
      /FACIAL/.test(text) ||
      /BIOMET/.test(text)
    ) {
      subtype = "Controlador biométrico";
    }

    return {
      type: "Controladores",
      subtype,
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Controlador de acesso identificado",
      ],
    };
  }

  if (
    /\bLEITOR\b/.test(text) ||
    /\bRFID\b/.test(text) ||
    /\bCHAVEIRO\b/.test(text) ||
    /\bCARTAO\b/.test(text) ||
    /\bCARTÃO\b/.test(text)
  ) {

    return {
      type: "Leitores",
      subtype: /RFID|CHAVEIRO|CARTAO|CARTÃO/.test(text)
        ? "RFID"
        : "Leitor",
      line: null,
      attributes,
      confidence: 0.96,
      status: "classificado",
      reasons: [
        "Leitor ou identificador de acesso identificado",
      ],
    };
  }

  if (
    /\bBOTOEIRA\b/.test(text) ||
    /\bBOTAO DE SAIDA\b/.test(text) ||
    /\bBOTÃO DE SAÍDA\b/.test(text)
  ) {

    return {
      type: "Acessórios",
      subtype: "Botoeiras e saída",
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Botoeira identificada",
      ],
    };
  }

  if (
    /\bFECHADURA\b/.test(text)
  ) {

    return {
      type: "Fechaduras",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Fechadura identificada",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Controle de Acesso mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   FECHADURAS
========================================================= */

function classifyFechaduras(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  if (
    /\bFECHADURA DIGITAL\b/.test(text) ||
    /\bFECHADURA SMART\b/.test(text) ||
    /\bFECHADURA INTELIGENTE\b/.test(text)
  ) {

    return {
      type: "Fechaduras Digitais",
      subtype: "Fechadura inteligente",
      line: null,
      attributes,
      confidence: 0.99,
      status: "classificado",
      reasons: [
        "Fechadura digital/inteligente identificada",
      ],
    };
  }

  if (
    /\bFECHADURA ELETROIMA\b/.test(text) ||
    /\bFECHADURA ELETRICA\b/.test(text) ||
    /\bFECHADURA ELÉTRICA\b/.test(text) ||
    /\bSOLENOIDE\b/.test(text)
  ) {

    return {
      type: "Fechaduras Elétricas",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Fechadura elétrica identificada",
      ],
    };
  }

  if (
    /\bTRAVA\b/.test(text)
  ) {

    return {
      type: "Travas",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.94,
      status: "classificado",
      reasons: [
        "Trava identificada",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Fechaduras mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   PORTEIROS
========================================================= */

function classifyPorteiros(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  if (
    /VIDEO PORTEIRO/.test(text) ||
    /VIDEOPORTEIRO/.test(text)
  ) {

    let subtype = "Vídeo porteiro";

    if (/EXTERNO/.test(text)) {
      subtype = "Módulo externo";
    }

    if (/INTERNO/.test(text)) {
      subtype = "Módulo interno";
    }

    if (/KIT/.test(text)) {
      subtype = "Kit vídeo porteiro";
    }

    return {
      type: "Vídeo porteiros",
      subtype,
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Vídeo porteiro identificado",
      ],
    };
  }

  if (
    /\bPORTEIRO\b/.test(text)
  ) {

    return {
      type: "Porteiros",
      subtype: "Porteiro residencial",
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Porteiro identificado",
      ],
    };
  }

  if (
    /\bRAMAL\b/.test(text) ||
    /\bEXTENSAO\b/.test(text) ||
    /\bEXTENSÃO\b/.test(text)
  ) {

    return {
      type: "Acessórios",
      subtype: "Ramal e extensão",
      line: null,
      attributes,
      confidence: 0.88,
      status: "classificado",
      reasons: [
        "Acessório de porteiro identificado",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Porteiros mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   TELEFONIA
========================================================= */

function classifyTelefonia(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  if (
    /\bTELEFONE IP\b/.test(text) ||
    /\bTIP\b/.test(text) ||
    /\bTDMI\b/.test(text)
  ) {

    return {
      type: "Telefones IP",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Telefone IP identificado",
      ],
    };
  }

  if (
    /\bTELEFONE\b/.test(text)
  ) {

    return {
      type: "Telefones",
      subtype: /\bSEM FIO\b/.test(text)
        ? "Sem fio"
        : "Com fio",
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Telefone identificado",
      ],
    };
  }

  if (
    /\bCENTRAL\b/.test(text) ||
    /\bIMPACTA\b/.test(text) ||
    /\bPABX\b/.test(text)
  ) {

    return {
      type: "Centrais telefônicas",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.94,
      status: "classificado",
      reasons: [
        "Central telefônica identificada",
      ],
    };
  }

  if (
    /\bGATEWAY\b/.test(text)
  ) {

    return {
      type: "Gateways",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Gateway identificado",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Telefonia mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   AUTOMATIZADORES
========================================================= */

function classifyAutomatizadores(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  if (
    /\bMOTOR\b/.test(text) ||
    /\bAUTOMATIZADOR\b/.test(text)
  ) {

    let subtype = "Automatizador";

    if (/DESLIZ/.test(text)) {
      subtype = "Deslizante";
    }

    if (/PIVOT/.test(text)) {
      subtype = "Pivotante";
    }

    if (/BASC/.test(text)) {
      subtype = "Basculante";
    }

    return {
      type: "Automatizadores",
      subtype,
      line: null,
      attributes,
      confidence: 0.94,
      status: "classificado",
      reasons: [
        "Automatizador identificado",
      ],
    };
  }

  if (
    /\bCREMALHEIRA\b/.test(text)
  ) {

    return {
      type: "Acessórios",
      subtype: "Cremalheira",
      line: null,
      attributes,
      confidence: 0.99,
      status: "classificado",
      reasons: [
        "Cremalheira identificada",
      ],
    };
  }

  if (
    /\bCONTROLE REMOTO\b/.test(text)
  ) {

    return {
      type: "Controles remotos",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.99,
      status: "classificado",
      reasons: [
        "Controle remoto identificado",
      ],
    };
  }

  if (
    /\bCENTRAL\b/.test(text)
  ) {

    return {
      type: "Centrais",
      subtype: "Central para automatizador",
      line: null,
      attributes,
      confidence: 0.92,
      status: "classificado",
      reasons: [
        "Central de automatizador identificada",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Automatizadores mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   CABEAMENTO
========================================================= */

function classifyCabeamento(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  if (
    /\bCABO\b/.test(text)
  ) {

    let subtype = "Cabo";

    if (/CAT5E/.test(text)) {
      subtype = "Cabo de rede CAT5E";
    }

    if (/CAT6/.test(text)) {
      subtype = "Cabo de rede CAT6";
    }

    if (/COAXIAL/.test(text)) {
      subtype = "Cabo coaxial";
    }

    if (/HDMI/.test(text)) {
      subtype = "Cabo HDMI";
    }

    if (/RCA/.test(text)) {
      subtype = "Cabo RCA";
    }

    return {
      type: "Cabos",
      subtype,
      line: null,
      attributes,
      confidence: 0.97,
      status: "classificado",
      reasons: [
        "Cabo identificado",
      ],
    };
  }

  if (
    /\bCONECTOR\b/.test(text) ||
    /\bRJ45\b/.test(text)
  ) {

    return {
      type: "Conectores",
      subtype: null,
      line: null,
      attributes,
      confidence: 0.98,
      status: "classificado",
      reasons: [
        "Conector identificado",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Cabeamento mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   MONITORES
========================================================= */

function classifyMonitores(text: string): Classification {

  const attributes = extractGeneralAttributes(text);

  if (
    /\bMONITOR\b/.test(text)
  ) {

    return {
      type: "Monitores",
      subtype: /GAMER/.test(text)
        ? "Gamer"
        : /ULTRAWIDE/.test(text)
          ? "Ultrawide"
          : "Monitor",
      line: null,
      attributes,
      confidence: 0.99,
      status: "classificado",
      reasons: [
        "Monitor identificado",
      ],
    };
  }

  return {
    type: "Não identificado",
    subtype: null,
    line: null,
    attributes,
    confidence: 0,
    status: "revisao",
    reasons: [
      "Produto pertence a Monitores mas não foi possível identificar o tipo",
    ],
  };
}

/* =========================================================
   CATEGORIA PRINCIPAL
========================================================= */

function classifyProduct(
  categorySlug: string,
  text: string
): Classification {

  switch (categorySlug) {

    case "cftv":
    case "cameras-wifi":
      return classifyCFTV(text);

    case "energia":
      return classifyEnergia(text);

    case "redes":
      return classifyRedes(text);

    case "alarmes":
      return classifyAlarmes(text);

    case "controle-de-acesso":
      return classifyControleAcesso(text);

    case "fechaduras":
      return classifyFechaduras(text);

    case "porteiros":
      return classifyPorteiros(text);

    case "telefonia":
      return classifyTelefonia(text);

    case "automatizadores":
      return classifyAutomatizadores(text);

    case "cabeamento":
      return classifyCabeamento(text);

    case "monitores":
      return classifyMonitores(text);

    default:

      return {
        type: "Não identificado",
        subtype: null,
        line: null,
        attributes: extractGeneralAttributes(text),
        confidence: 0,
        status: "revisao",
        reasons: [
          "Categoria ainda não possui regras específicas",
        ],
      };
  }
}

/* =========================================================
   GET
========================================================= */

export async function GET(req: Request) {

  try {

    const { searchParams } = new URL(req.url);

    const categoryFilter =
      searchParams.get("category");

    const statusFilter =
      searchParams.get("status");

    const limit =
      Math.min(
        Number(searchParams.get("limit") || "3622"),
        5000
      );

    /* =====================================================
       PRODUTOS
    ===================================================== */

    const products = await prisma.product.findMany({

      take: limit,

      orderBy: {
        id: "asc",
      },

      include: {

        productcategory: {

          include: {
            category: true,
          },

        },

      },

    });

    /* =====================================================
       ANALISAR
    ===================================================== */

    const analyzed = products.map((product: any) => {

      const categories =
        product.productcategory
          ?.map((pc: any) => pc.category)
          ?.filter(Boolean) || [];

      const mainCategory =
        categories[0] || null;

      const categorySlug =
        mainCategory?.slug || "";

      const text = normalize(
        [
          product.name,
          product.brand,
          product.line,
          product.description,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const classification =
        classifyProduct(
          categorySlug,
          text
        );

      return {

        id: product.id,

        name: product.name,

        sku: product.sku,

        brand: product.brand,

        category: mainCategory
          ? {
              id: mainCategory.id,
              name: mainCategory.name,
              slug: mainCategory.slug,
            }
          : null,

        classification,

      };

    });

    /* =====================================================
       FILTROS
    ===================================================== */

    let filtered = analyzed;

    if (categoryFilter) {

      filtered =
        filtered.filter(
          (product) =>
            product.category?.slug ===
            categoryFilter
        );

    }

    if (statusFilter) {

      filtered =
        filtered.filter(
          (product) =>
            product.classification.status ===
            statusFilter
        );

    }

    /* =====================================================
       RESUMO
    ===================================================== */

    const totalProdutos =
      filtered.length;

    const classificados =
      filtered.filter(
        (p) =>
          p.classification.status ===
          "classificado"
      );

    const revisao =
      filtered.filter(
        (p) =>
          p.classification.status ===
          "revisao"
      );

    /* =====================================================
       AGRUPAR POR CATEGORIA
    ===================================================== */

    const categoriasMap =
      new Map<string, any>();

    for (const product of filtered) {

      const slug =
        product.category?.slug ||
        "sem-categoria";

      const name =
        product.category?.name ||
        "Sem categoria";

      if (!categoriasMap.has(slug)) {

        categoriasMap.set(slug, {

          name,

          slug,

          total: 0,

          classificados: 0,

          revisao: 0,

          tipos: {},

        });

      }

      const category =
        categoriasMap.get(slug);

      category.total++;

      if (
        product.classification.status ===
        "classificado"
      ) {
        category.classificados++;
      } else {
        category.revisao++;
      }

      const type =
        product.classification.type;

      category.tipos[type] =
        (category.tipos[type] || 0) + 1;

    }

    /* =====================================================
       AGRUPAR POR TIPO
    ===================================================== */

    const tiposMap =
      new Map<string, number>();

    for (const product of filtered) {

      const type =
        product.classification.type;

      tiposMap.set(
        type,
        (tiposMap.get(type) || 0) + 1
      );

    }

    const tipos =
      Array.from(
        tiposMap.entries()
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .map(
          ([type, quantity]) => ({
            type,
            quantity,
          })
        );

    /* =====================================================
       RESPOSTA
    ===================================================== */

    return NextResponse.json({

      sucesso: true,

      versao: "3.0",

      resumo: {

        totalProdutos,

        produtosClassificados:
          classificados.length,

        produtosParaRevisao:
          revisao.length,

        percentualClassificado:
          totalProdutos
            ? Number(
                (
                  (classificados.length /
                    totalProdutos) *
                  100
                ).toFixed(2)
              )
            : 0,

        categoriasAnalisadas:
          categoriasMap.size,

      },

      categorias:
        Array.from(
          categoriasMap.values()
        ),

      tipos,

      produtos: filtered,

      observacao:
        "V3 somente analisa os produtos. Nenhuma alteração é gravada no banco.",

    });

  } catch (error) {

    console.error(
      "ERRO ANALISE TAXONOMIA V3:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,

        erro:
          "Erro ao analisar produtos.",

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