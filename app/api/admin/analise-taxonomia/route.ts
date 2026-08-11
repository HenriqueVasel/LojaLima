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

  // ==========================================================
  // MATCH SEGURO
  // ==========================================================

  function matchesKeyword(keyword: string): boolean {

    const normalizedKeyword = normalize(keyword);

    // Palavras muito curtas/códigos precisam ser tratados
    // como tokens inteiros.
    if (
      normalizedKeyword.length <= 4 ||
      /^[A-Z0-9-]+$/.test(normalizedKeyword)
    ) {
      const escaped = normalizedKeyword
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\s+/g, "\\s+");

      return new RegExp(
        `(^|\\s|[-_/().])${escaped}(?=\\s|[-_/().]|$)`
      ).test(text);
    }

    // Expressões maiores podem usar busca normal.
    return text.includes(normalizedKeyword);
  }


  // ==========================================================
  // EXCEÇÕES
  // ==========================================================

  // Produto claramente relacionado a DVR/NVR.
  // Evita que "CAMERA" apareça primeiro por causa da descrição.
  const isRecorder =
    matchesKeyword("DVR") ||
    matchesKeyword("NVR") ||
    matchesKeyword("MHDX") ||
    matchesKeyword("NVD") ||
    text.includes("GRAVADOR DIGITAL DE VIDEO") ||
    text.includes("GRAVADOR DIGITAL") ||
    text.includes("GRAVADOR DE VIDEO DE REDE") ||
    text.includes("GRAVADOR IP");


  // ==========================================================
  // REGRAS DE ALTA PRIORIDADE
  // ==========================================================

  // ----------------------------------------------------------
  // DVR
  // ----------------------------------------------------------

  if (
    matchesKeyword("DVR") ||
    matchesKeyword("MHDX") ||
    text.includes("GRAVADOR DIGITAL DE VIDEO") ||
    text.includes("GRAVADOR DIGITAL")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "DVR")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "DVR",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // NVR
  // ----------------------------------------------------------

  if (
    matchesKeyword("NVR") ||
    matchesKeyword("NVD") ||
    text.includes("GRAVADOR DE VIDEO DE REDE") ||
    text.includes("GRAVADOR IP")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "NVR")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "NVR",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CÂMERAS WI-FI
  // ----------------------------------------------------------

  if (
    text.includes("CAMERA WI-FI") ||
    text.includes("CAMERA WIFI") ||
    text.includes("CAMERA DE VIDEO WI-FI") ||
    text.includes("CAMERA VIDEO WI-FI")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Câmeras Wi-Fi")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Câmeras Wi-Fi",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // VÍDEO PORTEIRO
  // ----------------------------------------------------------

  if (
    text.includes("VIDEO PORTEIRO") ||
    text.includes("VIDEOPORTEIRO") ||
    matchesKeyword("TVIP") ||
    matchesKeyword("IVR") ||
    matchesKeyword("XPE")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Vídeo Porteiro")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Vídeo Porteiro",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // PORTEIRO
  // ----------------------------------------------------------

  if (
    matchesKeyword("PORTEIRO") ||
    text.includes("EXTENSAO PORTEIRO")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Porteiros")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Porteiros",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // FECHADURA DIGITAL
  // ----------------------------------------------------------

  if (
    text.includes("FECHADURA DIGITAL") ||
    text.includes("FECHADURA SMART") ||
    text.includes("FECHADURA INTELIGENTE") ||
    matchesKeyword("FR200") ||
    matchesKeyword("FR210") ||
    matchesKeyword("FR331")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Fechaduras Digitais")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Fechaduras Digitais",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // FECHADURAS
  // ----------------------------------------------------------

  if (
    matchesKeyword("FECHADURA") ||
    matchesKeyword("ELETROIMA") ||
    matchesKeyword("SOLENOIDE")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Fechaduras")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Fechaduras",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // SENSORES
  // ----------------------------------------------------------

  if (
    matchesKeyword("SENSOR") ||
    matchesKeyword("IVP") ||
    matchesKeyword("IVA") ||
    matchesKeyword("REED") ||
    text.includes("SENSOR MAGNETICO") ||
    text.includes("SENSOR MAGNETICO")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Sensores")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Sensores",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CENTRAIS DE ALARME
  // ----------------------------------------------------------

  if (
    text.includes("CENTRAL DE ALARME") ||
    text.includes("CENTRAL ALARME") ||
    matchesKeyword("AMT") ||
    matchesKeyword("ANM")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Centrais de Alarme")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Centrais de Alarme",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // SIRENES
  // ----------------------------------------------------------

  if (
    matchesKeyword("SIRENE") ||
    text.includes("ACIONADOR MANUAL")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Sirenes")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Sirenes",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CERCA ELÉTRICA
  // ----------------------------------------------------------

  if (
    text.includes("CERCA ELETRICA") ||
    matchesKeyword("ELC")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Cerca Elétrica")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Cerca Elétrica",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CONTROLE DE ACESSO
  // ----------------------------------------------------------

  if (
    text.includes("CONTROLADOR DE ACESSO") ||
    text.includes("CONTROLE DE ACESSO")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Controle de Acesso")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Controle de Acesso",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // LEITORES
  // ----------------------------------------------------------

  if (
    text.includes("LEITOR RFID") ||
    text.includes("LEITOR BIOMETRICO") ||
    text.includes("LEITOR DE CARTAO") ||
    text.includes("LEITOR CADASTRADOR") ||
    matchesKeyword("DIGIPROX")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Leitores")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Leitores",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // BIOMETRIA
  // ----------------------------------------------------------

  if (
    text.includes("BIOMETRICO") ||
    text.includes("BIOMETRIA") ||
    text.includes("RECONHECIMENTO FACIAL") ||
    matchesKeyword("FACIAL")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Biometria")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Biometria",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // SWITCH
  // ----------------------------------------------------------

  if (
    matchesKeyword("SWITCH") ||
    matchesKeyword("S110") ||
    matchesKeyword("S111") ||
    matchesKeyword("S112") ||
    matchesKeyword("S211") ||
    matchesKeyword("S232") ||
    matchesKeyword("S302") ||
    matchesKeyword("S332") ||
    matchesKeyword("SF 800")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Switches")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Switches",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // ACCESS POINT
  // ----------------------------------------------------------

  if (
    text.includes("ACCESS POINT") ||
    matchesKeyword("AP") ||
    matchesKeyword("U6-") ||
    matchesKeyword("U7-") ||
    matchesKeyword("UAP-") ||
    matchesKeyword("UNIFI")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Access Points")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Access Points",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // ROTEADORES
  // ----------------------------------------------------------

  if (
    matchesKeyword("ROTEADOR") ||
    matchesKeyword("ROUTER") ||
    matchesKeyword("W4-") ||
    matchesKeyword("W5-") ||
    matchesKeyword("W6-") ||
    matchesKeyword("RW")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Roteadores")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Roteadores",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CABOS DE REDE
  // ----------------------------------------------------------

  if (
    text.includes("CABO LAN") ||
    text.includes("CABO UTP") ||
    text.includes("CABO CAT5") ||
    text.includes("CABO CAT6") ||
    matchesKeyword("CAT5E") ||
    matchesKeyword("CAT6") ||
    text.includes("PATCH CORD")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Cabos de Rede")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Cabos de Rede",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // FIBRA ÓPTICA
  // ----------------------------------------------------------

  if (
    text.includes("FIBRA OPTICA") ||
    matchesKeyword("FIBER") ||
    matchesKeyword("FTTH") ||
    matchesKeyword("OLT") ||
    matchesKeyword("ONU") ||
    matchesKeyword("ONT")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Fibra Óptica")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Fibra Óptica",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // RACKS
  // ----------------------------------------------------------

  if (
    matchesKeyword("RACK") ||
    text.includes("MINI RACK") ||
    text.includes("RACK PAREDE") ||
    text.includes("RACK DE PISO")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Racks")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Racks",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // NOBREAK
  // ----------------------------------------------------------

  if (
    matchesKeyword("NOBREAK") ||
    matchesKeyword("NO-BREAK") ||
    matchesKeyword("UPS")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Nobreaks")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Nobreaks",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // BATERIAS
  // ----------------------------------------------------------

  // IMPORTANTE:
  // Não usar SELADA sozinha.
  // "BATERIA SELADA" é bateria, mas "FONTE SELADA"
  // não deve virar bateria.

  if (
    matchesKeyword("BATERIA") ||
    matchesKeyword("BATERIAS") ||
    matchesKeyword("VRLA") ||
    text.includes("BATERIA SELADA")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Baterias")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Baterias",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // FONTES
  // ----------------------------------------------------------

  if (
    matchesKeyword("FONTE") ||
    text.includes("FONTE DE ALIMENTACAO") ||
    matchesKeyword("AC/DC") ||
    matchesKeyword("DC/DC")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Fontes")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Fontes",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // ESTABILIZADORES
  // ----------------------------------------------------------

  if (matchesKeyword("ESTABILIZADOR")) {

    return {
      type: "Estabilizadores",
      matchedKeywords: ["ESTABILIZADOR"],
    };
  }


  // ----------------------------------------------------------
  // AUTOMATIZADORES
  // ----------------------------------------------------------

  if (
    matchesKeyword("AUTOMATIZADOR") ||
    text.includes("MOTOR DE PORTAO") ||
    text.includes("MOTOR PORTAO")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Automatizadores")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Automatizadores",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CREMALHEIRAS
  // ----------------------------------------------------------

  if (
    matchesKeyword("CREMALHEIRA") ||
    text.includes("CREMALHEIRA DE ALUMINIO")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Cremalheiras")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Cremalheiras",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CONTROLES REMOTOS
  // ----------------------------------------------------------

  if (
    text.includes("CONTROLE REMOTO") ||
    matchesKeyword("TX")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Controles Remotos")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Controles Remotos",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // TELEFONES
  // ----------------------------------------------------------

  if (
    text.includes("TELEFONE") ||
    text.includes("TELEFONE IP")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Telefones")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Telefones",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // PABX
  // ----------------------------------------------------------

  if (
    matchesKeyword("PABX") ||
    matchesKeyword("IMPACTA") ||
    matchesKeyword("MODULARE") ||
    matchesKeyword("CONECTA") ||
    matchesKeyword("UNNITI")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "PABX")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "PABX",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CONECTORES
  // ----------------------------------------------------------

  if (
    matchesKeyword("CONECTOR") ||
    matchesKeyword("RJ45") ||
    matchesKeyword("RJ11") ||
    text.includes("EMENDA RJ") ||
    matchesKeyword("PLUG")
  ) {

    const matchedKeywords = TYPE_RULES
      .find(rule => rule.type === "Conectores")!
      .keywords
      .filter(matchesKeyword);

    return {
      type: "Conectores",
      matchedKeywords,
    };
  }


  // ----------------------------------------------------------
  // CÂMERAS
  // ----------------------------------------------------------

  // Câmera fica por último porque "CAMERA" é extremamente
  // genérico e não pode ganhar de DVR/NVR/Wi-Fi etc.

  if (
    matchesKeyword("CAMERA") ||
    matchesKeyword("VHD") ||
    matchesKeyword("VIP")
  ) {

    // Se já sabemos que é gravador, nunca chamar de câmera.
    if (!isRecorder) {

      const matchedKeywords = TYPE_RULES
        .find(rule => rule.type === "Câmeras")!
        .keywords
        .filter(matchesKeyword);

      return {
        type: "Câmeras",
        matchedKeywords,
      };
    }
  }


  // ==========================================================
  // NÃO IDENTIFICADO
  // ==========================================================

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
    [
      product.description,
      product.shortDescription,
      product.brand,
      product.brandRef?.name,
      product.line?.name,
    ]
      .filter(Boolean)
      .join(" ")
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
      [
        product.description,
        product.shortDescription,
        product.brand,
        product.brandRef?.name,
        product.line?.name,
      ]
        .filter(Boolean)
        .join(" ")
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