import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/*
=========================================================
V7 — ANÁLISE INTELIGENTE DE TAXONOMIA

OBJETIVO:

Produto
  ↓
Família
  ↓
Tipo
  ↓
Subtipo
  ↓
Linha
  ↓
Atributos

IMPORTANTE:
- NÃO grava nada no banco
- apenas analisa
- utiliza nome + SKU + categoria atual
=========================================================
*/

type Confidence = "alta" | "media" | "baixa";

type Classification = {
  family: string | null;
  type: string | null;
  subtype: string | null;
  line: string | null;
  attributes: Record<string, any>;
  confidence: Confidence;
  reason: string;
};

function clean(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function has(text: string, terms: string[]) {
  return terms.some((term) => text.includes(clean(term)));
}

function numberAfter(text: string, pattern: RegExp) {
  const match = text.match(pattern);

  if (!match) return null;

  return Number(match[1]);
}

function classifyProduct(product: any): Classification {

  const name = clean(product.name);

  const categories = (product.productcategory || [])
    .map((pc: any) => clean(pc.category?.name))
    .filter(Boolean);

  const categoryText = categories.join(" ");

  const text = `${name} ${categoryText}`;

  /*
  ========================================================
  ATRIBUTOS BASE
  ========================================================
  */

  const attributes: Record<string, any> = {};

  /*
  ========================================================
  1. CFTV — GRAVADORES
  ========================================================
  */

  if (
    has(name, ["MHDX", "IMHDX", "MHDX"])
    ||
    /\bDVR\b/.test(name)
    ||
    has(name, ["GRAVADOR DIGITAL DE VIDEO"])
  ) {

    const canais =
      numberAfter(name, /\b(\d{1,3})\s*(?:CANAIS|CH)\b/) ||
      numberAfter(name, /\bMHDX\s*(\d{2,4})\b/)?.toString().slice(-2);

    /*
    Alguns modelos MHDX possuem o número de canais
    diretamente no código do modelo.
    */

    let channelCount: number | null = null;

    if (/\bMHDX\s*1304\b/.test(name)) channelCount = 4;
    if (/\bMHDX\s*1308\b/.test(name)) channelCount = 8;
    if (/\bMHDX\s*1316\b/.test(name)) channelCount = 16;
    if (/\bMHDX\s*1332\b/.test(name)) channelCount = 32;

    if (/\bMHDX\s*3104\b/.test(name)) channelCount = 4;
    if (/\bMHDX\s*3108\b/.test(name)) channelCount = 8;
    if (/\bMHDX\s*3116\b/.test(name)) channelCount = 16;
    if (/\bMHDX\s*3132\b/.test(name)) channelCount = 32;

    if (/\bIMHDX\s*3104\b/.test(name)) channelCount = 4;
    if (/\bIMHDX\s*3108\b/.test(name)) channelCount = 8;
    if (/\bIMHDX\s*3116\b/.test(name)) channelCount = 16;
    if (/\bIMHDX\s*3132\b/.test(name)) channelCount = 32;

    if (canais && typeof canais === "number") {
      channelCount = canais;
    }

    if (channelCount) {
      attributes.canais = channelCount;
    }

    return {
      family: "cftv",
      type: "DVR",
      subtype: "Gravadores DVR",
      line: has(name, ["IMHDX"])
        ? "IMHDX"
        : "MHDX",
      attributes,
      confidence: channelCount ? "alta" : "media",
      reason: "Produto identificado como gravador DVR."
    };
  }

  /*
  ========================================================
  2. CFTV — NVR / NVD / INVD
  ========================================================
  */

  if (
    has(name, ["NVD", "INVD"])
    ||
    /\bNVR\b/.test(name)
  ) {

    let channelCount: number | null = null;

    /*
    Modelos conhecidos
    */

    if (/\bNVD\s*1516\b/.test(name)) channelCount = 16;
    if (/\bNVD\s*1532\b/.test(name)) channelCount = 32;

    if (/\bINVD\s*5232\b/.test(name)) channelCount = 32;

    const explicitChannels =
      numberAfter(name, /\b(\d{1,3})\s*(?:CANAIS|CH)\b/);

    if (explicitChannels) {
      channelCount = explicitChannels;
    }

    if (channelCount) {
      attributes.canais = channelCount;
    }

    return {
      family: "cftv",
      type: "NVR",
      subtype: "Gravadores NVR",
      line: has(name, ["INVD"])
        ? "INVD"
        : "NVD",
      attributes,
      confidence: channelCount ? "alta" : "media",
      reason: "Produto identificado como gravador NVR."
    };
  }

  /*
  ========================================================
  3. CFTV — CÂMERAS IP
  ========================================================
  */

  if (
    has(name, [
      "CAMERA IP",
      "CÂMERA IP",
      "VIP ",
      "VIPW",
      "CAMERA VIP"
    ])
  ) {

    let line: string | null = null;

    if (/\bVIPW\b/.test(name)) line = "VIPW";
    else if (/\bVIP\b/.test(name)) line = "VIP";

    return {
      family: "cftv",
      type: "Câmeras",
      subtype: "IP",
      line,
      attributes,
      confidence: "alta",
      reason: "Câmera identificada como IP."
    };
  }

  /*
  ========================================================
  4. CFTV — CÂMERAS WI-FI
  ========================================================
  */

  if (
    has(name, [
      "CAMERA WI-FI",
      "CAMERA WIFI",
      "CÂMERA WI-FI",
      "CÂMERA WIFI"
    ])
  ) {

    attributes.tecnologia = "Wi-Fi";

    return {
      family: "cftv",
      type: "Câmeras",
      subtype: "Câmeras Wi-Fi",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Câmera identificada como modelo Wi-Fi."
    };
  }

  /*
  ========================================================
  5. CFTV — MULTI-HD / VHD
  ========================================================
  */

  if (
    has(name, [
      "VHD ",
      "VHDM",
      "MULTI-HD",
      "MULTI HD"
    ])
    &&
    has(name, ["CAMERA", "CÂMERA"])
  ) {

    let line: string | null = null;

    if (/\bVHDM\b/.test(name)) line = "VHDM";
    else if (/\bVHD\b/.test(name)) line = "VHD";

    return {
      family: "cftv",
      type: "Câmeras",
      subtype: "Multi-HD",
      line,
      attributes,
      confidence: "alta",
      reason: "Câmera identificada como Multi-HD."
    };
  }

  /*
  ========================================================
  6. CFTV — HDs
  ========================================================
  */

  if (
    has(name, [
      "HD 1TB",
      "HD 2TB",
      "HD 4TB",
      "HD 6TB",
      "WD PURPLE",
      "WD PURPLE"
    ])
    &&
    has(categoryText, ["CFTV"])
  ) {

    const tb =
      numberAfter(name, /\bHD\s*(\d+)\s*TB\b/);

    if (tb) {
      attributes.capacidadeTB = tb;
    }

    return {
      family: "cftv",
      type: "Armazenamento",
      subtype: "HDs para CFTV",
      line: null,
      attributes,
      confidence: "alta",
      reason: "HD identificado como armazenamento para CFTV."
    };
  }

  /*
  ========================================================
  7. ENERGIA — NOBREAKS
  ========================================================
  */

  if (
    has(name, [
      "NOBREAK",
      "NO-BREAK",
      "UPS"
    ])
  ) {

    const potencia =
      numberAfter(name, /(\d+)\s*VA\b/);

    const tensao =
      numberAfter(name, /(\d+)\s*V\b/);

    if (potencia) {
      attributes.potenciaVA = potencia;
    }

    if (tensao) {
      attributes.tensao = `${tensao}V`;
    }

    return {
      family: "energia",
      type: "Nobreaks",
      subtype: "Nobreak",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como nobreak."
    };
  }

  /*
  ========================================================
  8. ENERGIA — FONTES
  ========================================================
  */

  if (
    has(name, [
      "FONTE",
      "FONTE DE ALIMENTACAO",
      "FONTE INTELBRAS"
    ])
  ) {

    return {
      family: "energia",
      type: "Fontes",
      subtype: "Fontes de Alimentação",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como fonte de alimentação."
    };
  }

  /*
  ========================================================
  9. ENERGIA — BATERIAS / PILHAS
  ========================================================
  */

  if (
    has(name, [
      "BATERIA",
      "PILHA",
      "CR2016",
      "CR2025",
      "CR2032",
      "CR123"
    ])
  ) {

    const tensao =
      numberAfter(name, /(\d+(?:[.,]\d+)?)\s*V\b/);

    if (tensao) {
      attributes.tensao = `${String(tensao).replace(",", ".")}V`;
    }

    return {
      family: "energia",
      type: "Baterias",
      subtype: "Baterias e Pilhas",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como bateria ou pilha."
    };
  }

  /*
  ========================================================
  10. REDES — SWITCH
  ========================================================
  */

  if (
    has(name, [
      "SWITCH",
      "SWITCH GERENCIAVEL",
      "SWITCH NAO GERENCIAVEL"
    ])
  ) {

    const portas =
      numberAfter(name, /\b(\d+)\s*P(?:ORTAS)?\b/);

    if (portas) {
      attributes.portas = portas;
    }

    let subtype: string | null = null;

    if (has(name, ["NAO GERENCIAVEL"])) {
      subtype = "Switch Não Gerenciável";
    }

    if (has(name, ["GERENCIAVEL"])) {
      subtype = "Switch Gerenciável";
    }

    return {
      family: "redes",
      type: "Switches",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como switch."
    };
  }

  /*
  ========================================================
  11. REDES — ROTEADORES
  ========================================================
  */

  if (
    has(name, [
      "ROTEADOR",
      "ROUTER"
    ])
  ) {

    return {
      family: "redes",
      type: "Roteadores",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como roteador."
    };
  }

  /*
  ========================================================
  12. REDES — ACCESS POINT
  ========================================================
  */

  if (
    has(name, [
      "ACCESS POINT",
      "AP ",
      "UNIFI"
    ])
  ) {

    return {
      family: "redes",
      type: "Access Points",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como Access Point."
    };
  }

  /*
  ========================================================
  13. REDES — RACK
  ========================================================
  */

  if (
    has(name, [
      "RACK",
      "BANDEJA",
      "PATCH PANEL",
      "FRENTE FALSA"
    ])
  ) {

    return {
      family: "redes",
      type: "Racks e Acessórios",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como equipamento ou acessório de rack."
    };
  }

  /*
  ========================================================
  14. CABEAMENTO — CAT5
  ========================================================
  */

  if (
    has(name, [
      "CAT5",
      "CAT5E"
    ])
    &&
    has(name, ["CABO", "PATCH CORD"])
  ) {

    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: "Cabos de Rede CAT5",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Cabo identificado como CAT5/CAT5E."
    };
  }

  /*
  ========================================================
  15. CABEAMENTO — CAT6
  ========================================================
  */

  if (
    has(name, [
      "CAT6",
      "CAT6A"
    ])
    &&
    has(name, ["CABO", "PATCH CORD"])
  ) {

    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: "Cabos de Rede CAT6",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Cabo identificado como CAT6."
    };
  }

  /*
  ========================================================
  16. CABEAMENTO — HDMI
  ========================================================
  */

  if (
    has(name, ["HDMI"])
    &&
    has(name, ["CABO"])
  ) {

    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: "Cabos HDMI",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Cabo HDMI identificado."
    };
  }

  /*
  ========================================================
  17. CONECTORES
  ========================================================
  */

  if (
    has(name, [
      "CONECTOR",
      "RJ45",
      "RJ11",
      "BNC",
      "MC4",
      "SC/UPC",
      "SC/APC"
    ])
  ) {

    let subtype: string | null = null;

    if (has(name, ["RJ45"])) subtype = "RJ45";
    else if (has(name, ["RJ11"])) subtype = "RJ11";
    else if (has(name, ["BNC"])) subtype = "BNC";
    else if (has(name, ["MC4"])) subtype = "MC4";
    else if (has(name, ["SC/UPC", "SC/APC"])) subtype = "Fibra Óptica";

    return {
      family: "conectividade",
      type: "Conectores",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como conector."
    };
  }

  /*
  ========================================================
  18. CONTROLE DE ACESSO — FECHADURAS
  ========================================================
  */

  if (
    has(name, [
      "FECHADURA DIGITAL",
      "FECHADURA SMART",
      "FECHADURA ELETRICA",
      "FECHADURA ELÉTRICA",
      "FECHADURA SOLENOIDE"
    ])
  ) {

    let subtype = "Fechaduras";

    if (has(name, ["DIGITAL", "SMART"])) {
      subtype = "Fechaduras Digitais";
    }

    if (
      has(name, [
        "ELETRICA",
        "ELÉTRICA",
        "SOLENOIDE"
      ])
    ) {
      subtype = "Fechaduras Elétricas";
    }

    return {
      family: "controle-acesso",
      type: "Fechaduras",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como fechadura."
    };
  }

  /*
  ========================================================
  19. CONTROLE DE ACESSO — CONTROLADORES
  ========================================================
  */

  if (
    has(name, [
      "CONTROLADOR DE ACESSO",
      "CONTROLE DE ACESSO"
    ])
  ) {

    let subtype: string | null = null;

    if (
      has(name, [
        "FACIAL",
        "BIOMETRICO",
        "BIOMÉTRICO"
      ])
    ) {
      subtype = "Controladores Biométricos";
    }

    return {
      family: "controle-acesso",
      type: "Controladores",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como controlador de acesso."
    };
  }

  /*
  ========================================================
  20. RFID
  ========================================================
  */

  if (
    has(name, [
      "RFID",
      "MIFARE",
      "CARTAO DE PROXIMIDADE",
      "CHAVEIRO RFID",
      "PULSEIRA RFID"
    ])
  ) {

    let subtype = "Credenciais RFID";

    if (has(name, ["CARTAO"])) {
      subtype = "Cartões RFID";
    }

    if (has(name, ["CHAVEIRO"])) {
      subtype = "Chaveiros RFID";
    }

    if (has(name, ["PULSEIRA"])) {
      subtype = "Pulseiras RFID";
    }

    attributes.tecnologia = "RFID";

    return {
      family: "controle-acesso",
      type: "Credenciais",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como credencial RFID."
    };
  }

  /*
  ========================================================
  21. CONTROLE DE ACESSO — BOTOEIRAS
  ========================================================
  */

  if (
    has(name, [
      "BOTOEIRA",
      "BOTAO DE SAIDA",
      "BOTÃO DE SAÍDA"
    ])
  ) {

    return {
      family: "controle-acesso",
      type: "Acessórios de Controle de Acesso",
      subtype: "Botoeiras",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como botoeira."
    };
  }

  /*
  ========================================================
  22. ALARMES — CENTRAL
  ========================================================
  */

  if (
    has(name, [
      "CENTRAL DE ALARME",
      "CENTRAL ALARME",
      "AMT "
    ])
  ) {

    let subtype = "Centrais de Alarme";

    if (
      has(name, [
        "INCENDIO",
        "INCÊNDIO",
        "CIE "
      ])
    ) {
      subtype = "Centrais de Incêndio";
    }

    return {
      family: "alarmes",
      type: "Centrais de Alarme",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como central de alarme."
    };
  }

  /*
  ========================================================
  23. ALARMES — SIRENES
  ========================================================
  */

  if (
    has(name, [
      "SIRENE",
      "SIR 2000"
    ])
  ) {

    return {
      family: "alarmes",
      type: "Sirenes",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como sirene."
    };
  }

  /*
  ========================================================
  24. ALARMES — DETECTORES
  ========================================================
  */

  if (
    has(name, [
      "DETECTOR DE FUMACA",
      "DETECTOR DE FUMAÇA",
      "DETECTOR"
    ])
  ) {

    let subtype: string | null = null;

    if (
      has(name, [
        "FUMACA",
        "FUMAÇA"
      ])
    ) {
      subtype = "Detectores de Fumaça";
    }

    return {
      family: "alarmes",
      type: "Detectores",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como detector."
    };
  }

  /*
  ========================================================
  25. SENSORES
  ========================================================
  */

  if (
    has(name, [
      "SENSOR",
      "IVP",
      "IVA",
      "REED"
    ])
  ) {

    let subtype = "Sensores";

    if (
      has(name, [
        "IVP",
        "INFRAVERMELHO",
        "PRESENCA",
        "PRESENÇA"
      ])
    ) {
      subtype = "Sensores de Presença";
    }

    if (
      has(name, [
        "REED",
        "MAGNETICO",
        "MAGNÉTICO"
      ])
    ) {
      subtype = "Sensores Magnéticos";
    }

    if (
      has(name, [
        "IVA",
        "BARREIRA"
      ])
    ) {
      subtype = "Sensores de Barreira";
    }

    return {
      family: "sensores",
      type: "Sensores",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como sensor."
    };
  }

  /*
  ========================================================
  26. PORTEIROS
  ========================================================
  */

  if (
    has(name, [
      "VIDEO PORTEIRO",
      "VÍDEO PORTEIRO",
      "PORTEIRO ELETRONICO",
      "PORTEIRO ELETRÔNICO"
    ])
  ) {

    let subtype = "Vídeo Porteiros";

    if (
      has(name, [
        "MODULO EXTERNO",
        "MÓDULO EXTERNO"
      ])
    ) {
      subtype = "Módulo Externo";
    }

    if (
      has(name, [
        "KIT VIDEO PORTEIRO",
        "KIT VÍDEO PORTEIRO"
      ])
    ) {
      subtype = "Kit Vídeo Porteiro";
    }

    return {
      family: "porteiros",
      type: "Vídeo Porteiros",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como vídeo porteiro."
    };
  }

  /*
  ========================================================
  27. PORTEIRO
  ========================================================
  */

  if (
    has(name, [
      "PORTEIRO RESIDENCIAL",
      "PORTEIRO ELETRONICO",
      "PORTEIRO ELETRÔNICO"
    ])
  ) {

    return {
      family: "porteiros",
      type: "Porteiros",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como porteiro eletrônico."
    };
  }

  /*
  ========================================================
  28. TELEFONIA — TELEFONES
  ========================================================
  */

  if (
    has(name, [
      "TELEFONE COM FIO",
      "TELEFONE SEM FIO",
      "TELEFONE IP",
      "TELEFONE"
    ])
  ) {

    let subtype: string | null = null;

    if (has(name, ["SEM FIO"])) {
      subtype = "Telefones Sem Fio";
    }

    else if (has(name, ["COM FIO"])) {
      subtype = "Telefones Com Fio";
    }

    else if (has(name, ["TELEFONE IP", "TIP ", "TDMI"])) {
      subtype = "Telefones IP";
    }

    return {
      family: "telefonia",
      type: "Telefones",
      subtype,
      line: null,
      attributes,
      confidence: subtype ? "alta" : "media",
      reason: "Produto identificado como telefone."
    };
  }

  /*
  ========================================================
  29. TELEFONIA — CENTRAIS
  ========================================================
  */

  if (
    has(name, [
      "CENTRAL TELEFONICA",
      "CENTRAL TELEFÔNICA",
      "IMPACTA",
      "COMUNIC 48",
      "COMUNIC 80"
    ])
  ) {

    return {
      family: "telefonia",
      type: "Centrais Telefônicas",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como central telefônica."
    };
  }

  /*
  ========================================================
  30. AUTOMATIZADORES
  ========================================================
  */

  if (
    has(name, [
      "AUTOMATIZADOR",
      "CREMALHEIRA",
      "CREM ",
      "ENGRENAGEM",
      "COROA",
      "FUSO",
      "MOTOR",
      "POLIA"
    ])
    &&
    (
      has(categoryText, ["AUTOMATIZADORES", "CONTROLE DE ACESSO"])
      ||
      has(name, [
        "GATTER",
        "NICE",
        "DESL",
        "DZ ",
        "PIVOT"
      ])
    )
  ) {

    return {
      family: "automatizadores",
      type: "Automatizadores",
      subtype: "Automatizadores de Portão",
      line: null,
      attributes,
      confidence: "media",
      reason: "Produto identificado como automatizador ou componente de automatizador."
    };
  }

  /*
  ========================================================
  31. CERCA ELÉTRICA
  ========================================================
  */

  if (
    has(name, [
      "CERCA ELETRICA",
      "CERCA ELÉTRICA",
      "CERCA ELETRICA"
    ])
  ) {

    return {
      family: "cerca-eletrica",
      type: "Cerca Elétrica",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como equipamento de cerca elétrica."
    };
  }

  /*
  ========================================================
  32. FALLBACK POR CATEGORIA
  ========================================================
  */

  if (has(categoryText, ["CFTV"])) {

    return {
      family: "cftv",
      type: "CFTV",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica CFTV, mas o nome não permitiu classificação específica."
    };
  }

  if (has(categoryText, ["ALARMES"])) {

    return {
      family: "alarmes",
      type: "Alarmes",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica alarmes, mas o nome não permitiu classificação específica."
    };
  }

  if (has(categoryText, ["REDES"])) {

    return {
      family: "redes",
      type: "Redes",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica redes, mas o nome não permitiu classificação específica."
    };
  }

  if (has(categoryText, ["ENERGIA"])) {

    return {
      family: "energia",
      type: "Energia",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica energia, mas o nome não permitiu classificação específica."
    };
  }

  if (has(categoryText, ["TELEFONIA"])) {

    return {
      family: "telefonia",
      type: "Telefonia",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica telefonia, mas o nome não permitiu classificação específica."
    };
  }

  /*
  ========================================================
  33. NÃO CLASSIFICADO
  ========================================================
  */

  return {
    family: null,
    type: null,
    subtype: null,
    line: null,
    attributes: {},
    confidence: "baixa",
    reason: "Produto precisa de revisão manual."
  };
}


/*
=========================================================
GET
=========================================================
*/

export async function GET(req: Request) {

  try {

    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      Number(searchParams.get("limit") || 500),
      1000
    );

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({

      where: {
        active: true,
      },

      select: {

        id: true,
        name: true,
        sku: true,

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

    const result = products.map((product) => {

      const classification =
        classifyProduct(product);

      return {

        id: product.id,

        name: product.name,

        sku: product.sku,

        categories:
          product.productcategory.map(
            (pc: any) => pc.category.name
          ),

        classification,

      };

    });

    /*
    ======================================================
    ESTATÍSTICAS
    ======================================================
    */

    const classificados = result.filter(
      (p) =>
        p.classification.family &&
        p.classification.confidence !== "baixa"
    );

    const revisao = result.filter(
      (p) =>
        p.classification.confidence === "baixa"
    );

    const alta = result.filter(
      (p) =>
        p.classification.confidence === "alta"
    );

    const media = result.filter(
      (p) =>
        p.classification.confidence === "media"
    );

    /*
    ======================================================
    FAMÍLIAS
    ======================================================
    */

    const familyMap: Record<string, number> = {};

    for (const product of result) {

      const family =
        product.classification.family;

      if (!family) continue;

      familyMap[family] =
        (familyMap[family] || 0) + 1;
    }

    /*
    ======================================================
    TIPOS
    ======================================================
    */

    const typeMap: Record<string, number> = {};

    for (const product of result) {

      const type =
        product.classification.type;

      if (!type) continue;

      typeMap[type] =
        (typeMap[type] || 0) + 1;
    }

    return NextResponse.json({

      sucesso: true,

      versao: "7.0",

      modo: "SIMULACAO",

      pagina: page,

      limite: limit,

      totalProdutos: result.length,

      classificados: classificados.length,

      revisao: revisao.length,

      percentualClassificado:
        result.length > 0
          ? Number(
              (
                (classificados.length /
                  result.length) *
                100
              ).toFixed(1)
            )
          : 0,

      confianca: {
        alta: alta.length,
        media: media.length,
        baixa: revisao.length,
      },

      familias: familyMap,

      tipos: typeMap,

      produtos: result,

    });

  } catch (error) {

    console.error(
      "Erro na análise de taxonomia V7:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro ao analisar taxonomia",
      },
      {
        status: 500,
      }
    );
  }
}