import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* =========================================================
   TIPOS
========================================================= */

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

/* =========================================================
   HELPERS
========================================================= */

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function has(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function extractChannels(text: string): number | null {
  const patterns = [
    /(?:MHDX|IMHDX|NVD|INVD)[\s-]*(\d{3,4})/,
    /(\d{1,3})\s*(?:CANAIS|CH|CANAIS)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) continue;

    const raw = match[1];

    if (!raw) continue;

    // MHDX 1304 -> 4
    // MHDX 1116 -> 16
    // NVD 1532 -> 32
    const lastTwo = Number(raw.slice(-2));

    if ([4, 8, 16, 32, 64, 128].includes(lastTwo)) {
      return lastTwo;
    }

    const number = Number(raw);

    if ([4, 8, 16, 32, 64, 128].includes(number)) {
      return number;
    }
  }

  return null;
}

function extractVoltage(text: string): string | null {
  const match = text.match(
    /\b(12V|24V|48V|127V|110V|120V|220V|230V|240V)\b/
  );

  return match?.[1] || null;
}

function extractVA(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*VA\b/);

  if (!match) return null;

  return Number(match[1].replace(",", "."));
}

function extractPorts(text: string): number | null {
  const patterns = [
    /\b(\d+)\s*PORTAS?\b/,
    /\b(\d+)\s*P\b/,
    /\b(\d+)\s*P\+/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) continue;

    const value = Number(match[1]);

    if (value > 0 && value <= 256) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   CLASSIFICADOR V6
========================================================= */

function classifyProduct(
  name: string,
  categories: string[]
): Classification {
  const text = normalize(name);
  const categoryText = normalize(categories.join(" "));

  const attributes: Record<string, any> = {};

  const voltage = extractVoltage(text);

  if (voltage) {
    attributes.tensao = voltage;
  }

  /* =======================================================
     1. CONTROLE REMOTO
     
     TEM QUE VIR ANTES DE AUTOMATIZADOR
  ======================================================= */

  if (
    has(text, [
      "CONTROLE REMOTO",
      "CONTROLE RF",
      "TX ",
      "TX/",
      "TRANSMISSOR",
      "XAC",
      "EP 02",
      "EP 04",
      "HOLING CODE",
    ])
  ) {
    return {
      family: "controle-acesso",
      type: "Controles Remotos",
      subtype: text.includes("AUTOMATIZADOR")
        ? "Controles para Automatizadores"
        : "Controles Remotos",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como controle ou transmissor remoto.",
    };
  }

  /* =======================================================
     2. CREDENCIAIS RFID
     
     NÃO SÃO LEITORES
  ======================================================= */

  if (
    has(text, [
      "CARTAO RFID",
      "CARTÃO RFID",
      "CARTAO DE PROXIMIDADE",
      "CARTÃO DE PROXIMIDADE",
      "CHAVEIRO RFID",
      "PULSEIRA RFID",
      "TAG RFID",
      "TAG DE PROXIMIDADE",
    ])
  ) {
    let subtype = "Credenciais RFID";

    if (text.includes("CARTAO") || text.includes("CARTÃO")) {
      subtype = "Cartões RFID";
    }

    if (text.includes("CHAVEIRO")) {
      subtype = "Chaveiros RFID";
    }

    if (text.includes("PULSEIRA")) {
      subtype = "Pulseiras RFID";
    }

    if (text.includes("TAG")) {
      subtype = "Tags RFID";
    }

    return {
      family: "controle-acesso",
      type: "Credenciais",
      subtype,
      line: null,
      attributes: {
        ...attributes,
        tecnologia: "RFID",
      },
      confidence: "alta",
      reason: "Produto identificado como credencial RFID.",
    };
  }

  /* =======================================================
     3. CFTV — DVR
     
     MHDX / IMHDX
  ======================================================= */

  if (
    has(text, [
      "MHDX",
      "IMHDX",
      "DVR",
      "GRAVADOR MHDX",
      "GRAVADOR IMHDX",
    ])
  ) {
    const channels = extractChannels(text);

    if (channels) {
      attributes.canais = channels;
    }

    const line = text.includes("IMHDX")
      ? "IMHDX"
      : text.includes("MHDX")
      ? "MHDX"
      : null;

    return {
      family: "cftv",
      type: "DVR",
      subtype: "Gravadores DVR",
      line,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como DVR.",
    };
  }

  /* =======================================================
     4. CFTV — NVR
     
     NVD / INVD
  ======================================================= */

  if (
    has(text, [
      "NVD ",
      "NVD-",
      "NVD/",
      "INVD",
      "NVR",
      "GRAVADOR NVD",
      "GRAVADOR INVD",
    ])
  ) {
    const channels = extractChannels(text);

    if (channels) {
      attributes.canais = channels;
    }

    let line: string | null = null;

    if (text.includes("INVD")) {
      line = "INVD";
    } else if (text.includes("NVD")) {
      line = "NVD";
    }

    return {
      family: "cftv",
      type: "NVR",
      subtype: "Gravadores NVR",
      line,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como NVR.",
    };
  }

  /* =======================================================
     5. CFTV — CÂMERAS WI-FI
  ======================================================= */

  if (
    has(text, [
      "CAMERA WI-FI",
      "CAMERA WIFI",
      "CÂMERA WI-FI",
      "CÂMERA WIFI",
      "IM ",
      "IM4",
      "IM5",
    ]) &&
    has(text, ["CAMERA", "CÂMERA"])
  ) {
    return {
      family: "cftv",
      type: "Câmeras",
      subtype: "Câmeras Wi-Fi",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Câmera identificada como modelo Wi-Fi.",
    };
  }

  /* =======================================================
     6. CFTV — CÂMERAS IP
  ======================================================= */

  if (
    has(text, [
      "CAMERA IP",
      "CÂMERA IP",
      "VIP ",
      "VIPW",
      "IP DE VIDEO",
      "IP DE VÍDEO",
    ])
  ) {
    return {
      family: "cftv",
      type: "Câmeras",
      subtype: "IP",
      line: text.includes("VIPW")
        ? "VIPW"
        : text.includes("VIP")
        ? "VIP"
        : null,
      attributes,
      confidence: "alta",
      reason: "Câmera identificada como IP.",
    };
  }

  /* =======================================================
     7. CFTV — CÂMERAS MULTI-HD / VHD
  ======================================================= */

  if (
    has(text, [
      "VHD ",
      "VHDM",
      "MULTI-HD",
      "MULTI HD",
    ]) &&
    has(text, ["CAMERA", "CÂMERA", "VHD", "VHDM"])
  ) {
    return {
      family: "cftv",
      type: "Câmeras",
      subtype: "Multi-HD",
      line: text.includes("VHDM")
        ? "VHDM"
        : text.includes("VHD")
        ? "VHD"
        : null,
      attributes,
      confidence: "alta",
      reason: "Câmera identificada como Multi-HD.",
    };
  }

  /* =======================================================
     8. CFTV — CÂMERA GENÉRICA
  ======================================================= */

  if (has(text, ["CAMERA", "CÂMERA"])) {
    return {
      family: "cftv",
      type: "Câmeras",
      subtype: null,
      line: null,
      attributes,
      confidence: "media",
      reason: "Produto identificado como câmera, mas o subtipo precisa de validação.",
    };
  }

  /* =======================================================
     9. SWITCH
     
     NÃO GERENCIÁVEL TEM PRIORIDADE
  ======================================================= */

  if (text.includes("SWITCH")) {
    const ports = extractPorts(text);

    if (ports) {
      attributes.portas = ports;
    }

    if (
      has(text, [
        "NAO GERENCIAVEL",
        "NÃO GERENCIÁVEL",
        "NÃO GERENCIAVEL",
      ])
    ) {
      return {
        family: "redes",
        type: "Switches",
        subtype: "Switch Não Gerenciável",
        line: null,
        attributes,
        confidence: "alta",
        reason: "Switch identificado explicitamente como não gerenciável.",
      };
    }

    if (
      has(text, [
        "GERENCIAVEL",
        "GERENCIÁVEL",
      ])
    ) {
      return {
        family: "redes",
        type: "Switches",
        subtype: "Switch Gerenciável",
        line: null,
        attributes,
        confidence: "alta",
        reason: "Switch identificado explicitamente como gerenciável.",
      };
    }

    return {
      family: "redes",
      type: "Switches",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como switch.",
    };
  }

  /* =======================================================
     10. NOBREAK
     
     TEM PRIORIDADE SOBRE BATERIA
  ======================================================= */

  if (
    has(text, [
      "NOBREAK",
      "NO-BREAK",
      "UPS",
    ])
  ) {
    const va = extractVA(text);

    if (va) {
      attributes.potenciaVA = va;
    }

    return {
      family: "energia",
      type: "Nobreaks",
      subtype: "Nobreak",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como nobreak.",
    };
  }

  /* =======================================================
     11. BATERIAS
     
     SOMENTE SE O PRODUTO FOR A BATERIA
  ======================================================= */

  if (
    has(text, [
      "BATERIA ",
      "BATERIA DE ",
      "BATERIA VRLA",
      "BATERIA ESTACIONARIA",
      "BATERIA ESTACIONÁRIA",
      "MODULO DE BATERIAS",
      "MÓDULO DE BATERIAS",
      "PILHA ",
      "PILHA MOEDA",
    ])
  ) {
    return {
      family: "energia",
      type: "Baterias",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como bateria.",
    };
  }

  /* =======================================================
     12. FONTES
     
     PLACA DE FONTE NÃO É FONTE COMUM
  ======================================================= */

  if (
    has(text, [
      "PLACA FONTE",
      "PLACA DE FONTE",
      "PLACA FONTE",
    ])
  ) {
    return {
      family: "energia",
      type: "Acessórios de Energia",
      subtype: "Placas de Fonte",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como placa de fonte.",
    };
  }

  if (
    has(text, [
      "FONTE ",
      "FONTE DE",
      "FONTE INTELBRAS",
      "POWER SUPPLY",
      "ADAPTADOR AC/DC",
      "CONVERSOR AUTOMATICO AC/DC",
      "CONVERSOR AUTOMÁTICO AC/DC",
    ])
  ) {
    return {
      family: "energia",
      type: "Fontes",
      subtype: "Fontes de Alimentação",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como fonte de alimentação.",
    };
  }

  /* =======================================================
     13. FECHADURAS
  ======================================================= */

  if (has(text, ["FECHADURA", "FECHADURA DIGITAL"])) {
    let subtype = "Fechaduras";

    if (
      has(text, [
        "DIGITAL",
        "SMART",
        "BIOMETRIA",
        "BIOMETRICA",
        "BIOMÉTRICA",
      ])
    ) {
      subtype = "Fechaduras Digitais";
    } else if (
      has(text, [
        "SOLENOIDE",
        "ELETROIMA",
        "ELETROÍMA",
        "ELÉTRICA",
        "ELETRICA",
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
      reason: "Produto identificado como fechadura.",
    };
  }

  /* =======================================================
     14. CONTROLE DE ACESSO
  ======================================================= */

  if (
    has(text, [
      "CONTROLADOR DE ACESSO",
      "CONTROLE DE ACESSO",
      "CONTROLADOR ACESSO",
    ])
  ) {
    let subtype: string | null = null;

    if (
      has(text, [
        "FACIAL",
        "BIOMETRIA",
        "BIOMETRICO",
        "BIOMÉTRICO",
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
      reason: "Produto identificado como controlador de acesso.",
    };
  }

  /* =======================================================
     15. LEITORES
  ======================================================= */

  if (
    has(text, [
      "LEITOR RFID",
      "LEITOR DE PROXIMIDADE",
      "LEITOR BIOMETRICO",
      "LEITOR BIOMÉTRICO",
      "LEITOR",
    ])
  ) {
    let subtype = "Leitores";

    if (has(text, ["RFID", "PROXIMIDADE"])) {
      subtype = "RFID";
    }

    if (has(text, ["BIOMETR"])) {
      subtype = "Leitores Biométricos";
    }

    return {
      family: "controle-acesso",
      type: "Leitores",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como leitor.",
    };
  }

  /* =======================================================
     16. BOTOEIRAS
  ======================================================= */

  if (
    has(text, [
      "BOTOEIRA",
      "BOTAO DE SAIDA",
      "BOTÃO DE SAÍDA",
      "BOTAO SAIDA",
    ])
  ) {
    return {
      family: "controle-acesso",
      type: "Acessórios de Controle de Acesso",
      subtype: "Botoeiras",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como botoeira.",
    };
  }

  /* =======================================================
     17. SENSORES
  ======================================================= */

  if (
    has(text, [
      "SENSOR",
      "SENSORES",
    ])
  ) {
    let subtype: string | null = null;

    if (
      has(text, [
        "IVP",
        "PRESENCA",
        "PRESENÇA",
        "INFRAVERMELHO PASSIVO",
      ])
    ) {
      subtype = "Sensores de Presença";
    }

    if (
      has(text, [
        "MAG",
        "MAGNETICO",
        "MAGNÉTICO",
        "REED",
      ])
    ) {
      subtype = "Sensores Magnéticos";
    }

    if (
      has(text, [
        "IVA",
        "BARREIRA",
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
      confidence: subtype ? "alta" : "media",
      reason: "Produto identificado como sensor.",
    };
  }

  /* =======================================================
     18. DETECTORES
  ======================================================= */

  if (
    has(text, [
      "DETECTOR",
      "DETECTOR DE FUMACA",
      "DETECTOR DE FUMAÇA",
    ])
  ) {
    let subtype: string | null = null;

    if (
      has(text, [
        "FUMACA",
        "FUMAÇA",
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
      reason: "Produto identificado como detector.",
    };
  }

  /* =======================================================
     19. SIRENES
  ======================================================= */

  if (
    has(text, [
      "SIRENE",
      "SIRENA",
      "SIRENE CORNETA",
    ])
  ) {
    return {
      family: "alarmes",
      type: "Sirenes",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como sirene.",
    };
  }

  /* =======================================================
     20. CENTRAL DE ALARME
  ======================================================= */

  if (
    has(text, [
      "CENTRAL DE ALARME",
      "CENTRAL ALARME",
      "AMT ",
      "CIE ",
    ])
  ) {
    let subtype = "Centrais de Alarme";

    if (
      has(text, [
        "INCENDIO",
        "INCÊNDIO",
        "CIE ",
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
      reason: "Produto identificado como central de alarme.",
    };
  }

  /* =======================================================
     21. PORTEIROS / VÍDEO PORTEIROS
  ======================================================= */

  if (
    has(text, [
      "VIDEO PORTEIRO",
      "VÍDEO PORTEIRO",
      "VIDEO PORTEIRO",
      "IV 7000",
      "TVIP",
    ])
  ) {
    let subtype = "Vídeo Porteiros";

    if (
      has(text, [
        "MODULO INTERNO",
        "MÓDULO INTERNO",
        "TERMINAL INTERNO",
      ])
    ) {
      subtype = "Módulo Interno";
    }

    if (
      has(text, [
        "MODULO EXTERNO",
        "MÓDULO EXTERNO",
      ])
    ) {
      subtype = "Módulo Externo";
    }

    if (text.includes("KIT")) {
      subtype = "Kit Vídeo Porteiro";
    }

    return {
      family: "porteiros",
      type: "Vídeo Porteiros",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como vídeo porteiro.",
    };
  }

  if (
    has(text, [
      "PORTEIRO",
      "PORTEIRO RESIDENCIAL",
    ])
  ) {
    return {
      family: "porteiros",
      type: "Porteiros",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como porteiro eletrônico.",
    };
  }

  /* =======================================================
     22. TELEFONES
  ======================================================= */

  if (
    has(text, [
      "TELEFONE",
      "TELEFONE IP",
      "TIP ",
      "TDMI",
      "TS ",
      "TC ",
    ])
  ) {
    let subtype: string | null = null;

    if (
      has(text, [
        "SEM FIO",
        "SEM-FIO",
      ])
    ) {
      subtype = "Telefones Sem Fio";
    } else if (
      has(text, [
        "COM FIO",
        "COM-FIO",
      ])
    ) {
      subtype = "Telefones Com Fio";
    } else if (
      has(text, [
        "TELEFONE IP",
        "TIP ",
        "TDMI",
      ])
    ) {
      subtype = "Telefones IP";
    }

    return {
      family: "telefonia",
      type: "Telefones",
      subtype,
      line: null,
      attributes,
      confidence: subtype ? "alta" : "media",
      reason: "Produto identificado como telefone.",
    };
  }

  /* =======================================================
     23. CENTRAIS TELEFÔNICAS
  ======================================================= */

  if (
    has(text, [
      "CENTRAL DIGITAL",
      "CENTRAL TELEFONICA",
      "CENTRAL TELEFÔNICA",
      "IMPACTA",
      "COMUNIC",
      "CP112",
      "CP4030",
    ])
  ) {
    return {
      family: "telefonia",
      type: "Centrais Telefônicas",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como central ou infraestrutura telefônica.",
    };
  }

  /* =======================================================
     24. ROTEADORES
  ======================================================= */

  if (
    has(text, [
      "ROTEADOR",
      "ROTEADOR WI-FI",
      "ROTEADOR WIFI",
    ])
  ) {
    return {
      family: "redes",
      type: "Roteadores",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como roteador.",
    };
  }

  /* =======================================================
     25. ACCESS POINT
  ======================================================= */

  if (
    has(text, [
      "ACCESS POINT",
      "ACCESSPOINT",
      "AP ",
      "UNIFI ACCESS POINT",
    ])
  ) {
    return {
      family: "redes",
      type: "Access Points",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como Access Point.",
    };
  }

  /* =======================================================
     26. RACKS
  ======================================================= */

  if (
    has(text, [
      "RACK",
      "BANDEJA",
      "PATCH PANEL",
      "PATCH-PANEL",
      "GUIA DE CABOS",
    ])
  ) {
    return {
      family: "redes",
      type: "Racks e Acessórios",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como rack ou acessório de rack.",
    };
  }

  /* =======================================================
     27. CONECTORES
  ======================================================= */

  if (
    has(text, [
      "CONECTOR",
      "CONECTORES",
      "RJ45",
      "RJ11",
      "BNC",
      "SC/UPC",
      "SC/APC",
      "MC4",
    ])
  ) {
    let subtype: string | null = null;

    if (text.includes("RJ45")) {
      subtype = "RJ45";
    } else if (text.includes("RJ11")) {
      subtype = "RJ11";
    } else if (text.includes("BNC")) {
      subtype = "BNC";
    } else if (
      text.includes("SC/UPC") ||
      text.includes("SC/APC")
    ) {
      subtype = "Fibra Óptica";
    }

    return {
      family: "conectividade",
      type: "Conectores",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como conector.",
    };
  }

  /* =======================================================
     28. CABOS
  ======================================================= */

  if (
    has(text, [
      "CABO ",
      "CABO/",
      "CABO-",
      "CABOS ",
      "PATCH CORD",
      "PATCHCORD",
    ])
  ) {
    let subtype: string | null = null;

    if (
      has(text, [
        "CAT5",
        "CAT 5",
      ])
    ) {
      subtype = "Cabos de Rede CAT5";
    } else if (
      has(text, [
        "CAT6",
        "CAT 6",
      ])
    ) {
      subtype = "Cabos de Rede CAT6";
    } else if (
      has(text, [
        "FIBRA OPTICA",
        "FIBRA ÓPTICA",
        "CABO OPTICO",
        "CABO ÓPTICO",
      ])
    ) {
      subtype = "Cabos de Fibra Óptica";
    } else if (
      has(text, [
        "COAXIAL",
        "RG59",
        "RG06",
        "RG-06",
      ])
    ) {
      subtype = "Cabos Coaxiais";
    } else if (
      has(text, [
        "HDMI",
      ])
    ) {
      subtype = "Cabos HDMI";
    } else if (
      has(text, [
        "RCA",
      ])
    ) {
      subtype = "Cabos RCA";
    }

    return {
      family: "cabeamento",
      type: "Cabos",
      subtype,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como cabo.",
    };
  }

  /* =======================================================
     29. CERCA ELÉTRICA
  ======================================================= */

  if (
    has(text, [
      "CERCA ELETRICA",
      "CERCA ELÉTRICA",
      "CERCA ELETRICA",
      "ELETRIFICADOR",
    ])
  ) {
    return {
      family: "cerca-eletrica",
      type: "Cerca Elétrica",
      subtype: null,
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como equipamento de cerca elétrica.",
    };
  }

  /* =======================================================
     30. AUTOMATIZADORES
     
     SÓ CHEGA AQUI DEPOIS DOS CONTROLES REMOTOS
  ======================================================= */

  if (
    has(text, [
      "AUTOMATIZADOR",
      "MOTOR PARA PORTAO",
      "MOTOR PARA PORTÃO",
      "MOTOR DESLIZANTE",
      "MOTOR BASCULANTE",
      "CREMALHEIRA",
      "ENGRENAGEM",
      "COROA",
      "POLIA",
    ])
  ) {
    return {
      family: "automatizadores",
      type: "Automatizadores",
      subtype: "Automatizadores de Portão",
      line: null,
      attributes,
      confidence: "alta",
      reason: "Produto identificado como automatizador ou componente de automatizador.",
    };
  }

  /* =======================================================
     31. FALLBACK BASEADO NA CATEGORIA ATUAL
  ======================================================= */

  if (categoryText.includes("CFTV")) {
    return {
      family: "cftv",
      type: "CFTV",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica CFTV, mas o nome não permitiu classificação específica.",
    };
  }

  if (categoryText.includes("ALARM")) {
    return {
      family: "alarmes",
      type: "Alarmes",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica alarmes, mas o nome não permitiu classificação específica.",
    };
  }

  if (categoryText.includes("REDES")) {
    return {
      family: "redes",
      type: "Redes",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica redes, mas o nome não permitiu classificação específica.",
    };
  }

  if (categoryText.includes("ENERGIA")) {
    return {
      family: "energia",
      type: "Energia",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica energia, mas o nome não permitiu classificação específica.",
    };
  }

  if (categoryText.includes("TELEFONIA")) {
    return {
      family: "telefonia",
      type: "Telefonia",
      subtype: null,
      line: null,
      attributes,
      confidence: "baixa",
      reason: "Categoria atual indica telefonia, mas o nome não permitiu classificação específica.",
    };
  }

  return {
    family: null,
    type: null,
    subtype: null,
    line: null,
    attributes: {},
    confidence: "baixa",
    reason: "Produto precisa de revisão manual.",
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      Number(searchParams.get("limit") || 500),
      1000
    );

    const category = searchParams.get("category");

    const products = await prisma.product.findMany({
      where: {
        active: true,

        ...(category
          ? {
              productcategory: {
                some: {
                  category: {
                    slug: category,
                  },
                },
              },
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        sku: true,

        productcategory: {
          select: {
            category: {
              select: {
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

      take: limit,
    });

    const result = products.map((product) => {
      const categories = product.productcategory.map(
        (item) => item.category.name
      );

      const classification = classifyProduct(
        product.name,
        categories
      );

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        categories,
        classification,
      };
    });

    /* =====================================================
       ESTATÍSTICAS
    ===================================================== */

    const classificados = result.filter(
      (item) =>
        item.classification.confidence === "alta" ||
        item.classification.confidence === "media"
    );

    const alta = result.filter(
      (item) =>
        item.classification.confidence === "alta"
    );

    const media = result.filter(
      (item) =>
        item.classification.confidence === "media"
    );

    const baixa = result.filter(
      (item) =>
        item.classification.confidence === "baixa"
    );

    return NextResponse.json({
      sucesso: true,

      versao: "6.0",

      modo: "SIMULACAO",

      totalProdutos: result.length,

      classificados: classificados.length,

      revisao: baixa.length,

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
        baixa: baixa.length,
      },

      produtos: result,
    });
  } catch (error) {
    console.error(
      "Erro na análise de taxonomia V6:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro ao analisar produtos",
      },
      {
        status: 500,
      }
    );
  }
}