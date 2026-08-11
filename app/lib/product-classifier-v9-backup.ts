// ============================================================
// PRODUCT CLASSIFIER — V9 CORRIGIDO
// ============================================================

export type Classification = {
  family: string | null;
  type: string | null;
  subtype: string | null;
  line: string | null;
  attributes: Record<string, string | number | boolean | null>;
};

export type ProductInput = {
  id: number;
  name: string;
  sku: string | null;
  description?: string | null;
  categories?: string[];
};

// ============================================================
// NORMALIZAÇÃO
// ============================================================

function normalize(text: string = "") {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^\w\s./+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// BUSCA SEGURA
// Evita erros como:
// IP encontrando palavras aleatórias
// GERENCIAVEL encontrando NAO GERENCIAVEL
// ============================================================

function hasWord(text: string, term: string) {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);

  if (!normalizedTerm) return false;

  const escaped = normalizedTerm.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  return new RegExp(
    `(^|\\s|[/+.-])${escaped}(?=\\s|[/+.-]|$)`,
    "i"
  ).test(normalizedText);
}

function has(text: string, ...terms: string[]) {
  return terms.some((term) => hasWord(text, term));
}

// ============================================================
// PRIMEIRO MATCH
// ============================================================

function firstMatch(
  text: string,
  values: Record<string, string>
): string | null {
  for (const [key, value] of Object.entries(values)) {
    if (hasWord(text, key)) {
      return value;
    }
  }

  return null;
}

// ============================================================
// CATEGORIA
// ============================================================

function categoryIs(categories: string, ...values: string[]) {
  return values.some((value) =>
    hasWord(categories, value)
  );
}

// ============================================================
// ATRIBUTOS
// ============================================================

function extractVoltage(text: string): string | null {
  const match = normalize(text).match(
    /\b(12V|24V|110V|120V|127V|220V|230V|240V)\b/
  );

  return match?.[1] || null;
}

function extractChannels(text: string): number | null {
  const normalized = normalize(text);

  const patterns = [
    /(?:^|\s)(4|8|16|32|64|128|256)\s*(?:CANAIS|CH|CHS)(?=\s|$)/,

    /(?:DVR|NVR|MHDX|NVD|IMHDX|INVD)[^0-9]{0,15}(4|8|16|32|64|128|256)(?:\s|$)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

function extractStorage(text: string): string | null {
  const normalized = normalize(text);

  const match = normalized.match(
    /\b(500GB|1TB|2TB|3TB|4TB|6TB|8TB|10TB|12TB|14TB|16TB)\b/
  );

  return match?.[1] || null;
}

function extractPorts(text: string): number | null {
  const normalized = normalize(text);

  const match = normalized.match(
    /\b(4|5|8|10|12|16|18|24|26|28|48|52)\s*(?:PORTAS|P)\b/
  );

  return match?.[1]
    ? Number(match[1])
    : null;
}

// ============================================================
// CLASSIFICAÇÃO PRINCIPAL
// ============================================================

export function classifyProduct(
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

  // ==========================================================
  // EXCLUSÕES
  // ==========================================================

  const includedBattery = has(
    name,
    "ACOMPANHA BATERIA",
    "ACOMPANHA DUAS BATERIAS",
    "ACOMPANHA UMA BATERIA",
    "COM BATERIA",
    "INCLUI BATERIA"
  );

  const noPowerSupply = has(
    name,
    "SEM FONTE",
    "SEM FONTE DE ALIMENTACAO",
    "NAO ACOMPANHA FONTE"
  );

  // ==========================================================
  // 1 — FECHADURAS
  // MUITO ANTES DE SENSOR
  // ==========================================================

  if (
    has(
      name,
      "FECHADURA",
      "FECHADURA DIGITAL",
      "FECHADURA ELETRICA",
      "SOLENOIDE",
      "ELETROIMA",
      "ELETROIMA"
    )
  ) {

    let subtype = "Fechaduras";

    if (
      has(
        name,
        "DIGITAL",
        "BIOMETRIA",
        "BIOMETRICA",
        "RFID",
        "SMART"
      )
    ) {
      subtype = "Fechaduras Digitais";
    }

    else if (
      has(
        name,
        "SOLENOIDE"
      )
    ) {
      subtype = "Solenoides";
    }

    else if (
      has(
        name,
        "ELETROIMA",
        "ELETROIMA"
      )
    ) {
      subtype = "Fechaduras Eletroímãs";
    }

    else if (
      has(
        name,
        "ELETRICA",
        "ELETRICA"
      )
    ) {
      subtype = "Fechaduras Elétricas";
    }

    return {
      family: "fechaduras",
      type: "Fechaduras",
      subtype,
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

  // ==========================================================
  // 2 — CFTV: DVR
  // ==========================================================

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

    const storage = extractStorage(text);

    return {
      family: "cftv",
      type: "DVR",
      subtype: "Gravadores DVR",
      line,
      attributes: {
        ...(channels
          ? { canais: channels }
          : {}),

        ...(storage
          ? {
              capacidade_armazenamento:
                storage,
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 3 — CFTV: NVR
  // ==========================================================

  if (
    has(
      name,
      "NVR",
      "NVD"
    )
    &&
    !has(
      name,
      "INVD"
    )
  ) {

    const channels = extractChannels(text);

    const line = firstMatch(name, {
      NVD: "NVD",
      NVR: "NVR",
    });

    return {
      family: "cftv",
      type: "NVR",
      subtype: "Gravadores NVR",
      line,
      attributes: {
        ...(channels
          ? { canais: channels }
          : {}),
      },
    };
  }

  // ==========================================================
  // 4 — CFTV: INVD
  // ==========================================================

  if (
    has(
      name,
      "INVD"
    )
  ) {

    const channels = extractChannels(text);

    return {
      family: "cftv",
      type: "NVR",
      subtype: "Gravadores NVR",
      line: "NVD",
      attributes: {
        ...(channels
          ? { canais: channels }
          : {}),
      },
    };
  }

  // ==========================================================
  // 5 — HD PARA CFTV
  // ==========================================================

  if (
    categoryIs(
      categories,
      "CFTV"
    )
    &&
    has(
      name,
      "HD",
      "HDD",
      "SATA"
    )
  ) {

    const storage = extractStorage(text);

    return {
      family: "cftv",
      type: "Armazenamento",
      subtype: "HD para CFTV",
      line: has(name, "PURPLE")
        ? "WD Purple"
        : null,
      attributes: {
        ...(storage
          ? {
              capacidade_armazenamento:
                storage,
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 6 — CÂMERAS
  // ==========================================================

  if (
    has(
      name,
      "CAMERA",
      "CAM IP",
      "CAMERA IP",
      "CAMERA WIFI",
      "CAMERA WI-FI"
    )
  ) {

    let subtype = "Câmeras";

    if (
      has(
        name,
        "WIFI",
        "WI-FI"
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

    return {
      family: "cftv",
      type: "Câmeras",
      subtype,
      line,
      attributes: {
        ...(has(name, "WIFI", "WI-FI")
          ? {
              wifi: true,
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 7 — VÍDEO PORTEIRO
  // ==========================================================

  if (
    has(
      name,
      "VIDEO PORTEIRO",
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

  // ==========================================================
  // 8 — CONTROLE DE ACESSO
  // ==========================================================

  if (
    has(
      name,
      "CONTROLADOR DE ACESSO",
      "CONTROLE DE ACESSO",
      "SS 553",
      "SS 353",
      "BIOINOX"
    )
  ) {

    let subtype = "Controladores de Acesso";

    if (has(name, "FACIAL")) {
      subtype = "Controladores Faciais";
    }

    else if (
      has(
        name,
        "BIOMETRIA",
        "BIOMETRICO"
      )
    ) {
      subtype = "Controladores Biométricos";
    }

    return {
      family: "controle-acesso",
      type: "Controladores",
      subtype,
      line: null,
      attributes: {
        ...(has(name, "POE")
          ? {
              poe: true,
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 9 — RFID / CREDENCIAIS
  // ==========================================================

  if (
    has(
      name,
      "CARTAO DE PROXIMIDADE",
      "CHAVEIRO RFID",
      "PULSEIRA RFID",
      "TAG RFID",
      "MIFARE",
      "RFID"
    )
  ) {

    let subtype = "Credenciais RFID";

    if (
      has(
        name,
        "CARTAO",
        "CARTAO DE PROXIMIDADE"
      )
    ) {
      subtype = "Cartões RFID";
    }

    else if (
      has(
        name,
        "CHAVEIRO"
      )
    ) {
      subtype = "Chaveiros RFID";
    }

    else if (
      has(
        name,
        "PULSEIRA"
      )
    ) {
      subtype = "Pulseiras RFID";
    }

    else if (
      has(
        name,
        "TAG"
      )
    ) {
      subtype = "Tags RFID";
    }

    return {
      family: "controle-acesso",
      type: "Credenciais",
      subtype,
      line: null,
      attributes: {
        rfid: true,
      },
    };
  }

  // ==========================================================
  // 10 — BOTOEIRAS / BOTÕES DE SAÍDA
  // ==========================================================

  if (
    has(
      name,
      "BOTOEIRA",
      "BOTAO DE SAIDA",
      "BOTAO SAIDA",
      "BOTAO DE SAIDA"
    )
  ) {

    return {
      family: "controle-acesso",
      type: "Botoeiras",
      subtype: "Botões de Saída",
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 11 — ALARMES: SENSORES
  // ==========================================================

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

  // ==========================================================
  // 12 — ALARMES: SIRENES
  // ==========================================================

  if (
    has(
      name,
      "SIRENE",
      "SIR "
    )
  ) {

    return {
      family: "alarmes",
      type: "Sirenes",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 13 — ALARMES: CENTRAIS
  // ==========================================================

  if (
    has(
      name,
      "CENTRAL DE ALARME",
      "CENTRAL ALARME",
      "AMT",
      "ANM",
      "CIE "
    )
  ) {

    return {
      family: "alarmes",
      type: "Centrais de Alarme",
      subtype: "Centrais",
      line: firstMatch(name, {
        AMT: "AMT",
        ANM: "ANM",
        CIE: "CIE",
      }),
      attributes: {},
    };
  }

  // ==========================================================
  // 14 — ALARMES: RECEPTORES
  // ==========================================================

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
      line: "XAR",
      attributes: {},
    };
  }

  // ==========================================================
  // 15 — ALARMES: TECLADOS
  // ==========================================================

  if (
    has(
      name,
      "TECLADO",
      "XAT "
    )
  ) {

    return {
      family: "alarmes",
      type: "Teclados",
      subtype: "Teclados de Alarme",
      line: has(name, "XAT")
        ? "XAT"
        : null,
      attributes: {},
    };
  }

  // ==========================================================
  // 16 — CERCA ELÉTRICA
  // ==========================================================

  if (
    has(
      name,
      "CERCA ELETRICA",
      "CERCA ELETRICA"
    )
  ) {

    return {
      family: "alarmes",
      type: "Cerca Elétrica",
      subtype: null,
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

  // ==========================================================
  // 17 — NOBREAK
  // ==========================================================

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

  // ==========================================================
  // 18 — BATERIAS
  // ==========================================================

  if (
    !includedBattery &&
    has(
      name,
      "BATERIA",
      "PILHA",
      "CR2016",
      "CR2025",
      "CR2032",
      "A23"
    )
  ) {

    return {
      family: "energia",
      type: "Baterias",
      subtype: "Baterias e Pilhas",
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

  // ==========================================================
  // 19 — ACCESS POINT
  // IMPORTANTE: ANTES DE FONTE
  // ==========================================================

  if (
    has(
      name,
      "ACCESS POINT",
      "AP WIFI",
      "AP WI-FI",
      "ACCESSPOINT"
    )
  ) {

    return {
      family: "redes",
      type: "Access Points",
      subtype: has(
        name,
        "WIFI",
        "WI-FI"
      )
        ? "Wi-Fi"
        : null,
      line: null,
      attributes: {
        ...(has(name, "WIFI", "WI-FI")
          ? {
              wifi: true,
            }
          : {}),

        ...(has(name, "POE")
          ? {
              poe: true,
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 20 — SWITCHES
  // ==========================================================

  if (
    has(
      name,
      "SWITCH",
      "SWITCHES"
    )
  ) {

    const naoGerenciavel = has(
      name,
      "NAO GERENCIAVEL",
      "NAO GERENCIAVEL",
      "NAO GERENCIAVEL"
    );

    const gerenciavel =
      !naoGerenciavel &&
      has(
        name,
        "GERENCIAVEL",
        "GERENCIAVEL"
      );

    return {
      family: "redes",
      type: "Switches",
      subtype: naoGerenciavel
        ? "Não Gerenciáveis"
        : gerenciavel
          ? "Gerenciáveis"
          : null,
      line: null,
      attributes: {
        ...(naoGerenciavel || gerenciavel
          ? {
              gerenciavel,
            }
          : {}),

        ...(has(name, "POE", "HI-POE")
          ? {
              poe: true,
            }
          : {}),

        ...(extractPorts(name)
          ? {
              portas: extractPorts(name),
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 21 — ROTEADORES
  // ==========================================================

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
      subtype: has(
        name,
        "WIFI",
        "WI-FI"
      )
        ? "Wi-Fi"
        : null,
      line: null,
      attributes: {
        ...(has(name, "WIFI", "WI-FI")
          ? {
              wifi: true,
            }
          : {}),

        ...(extractPorts(name)
          ? {
              portas: extractPorts(name),
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 22 — RACKS
  // ==========================================================

  if (
    has(
      name,
      "RACK",
      "MINI RACK"
    )
  ) {

    return {
      family: "redes",
      type: "Racks",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 23 — PATCH PANEL
  // ==========================================================

  if (
    has(
      name,
      "PATCH PANEL"
    )
  ) {

    return {
      family: "redes",
      type: "Patch Panels",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 24 — BANDEJAS
  // ==========================================================

  if (
    has(
      name,
      "BANDEJA FIXA",
      "BANDEJA PARA RACK"
    )
  ) {

    return {
      family: "redes",
      type: "Acessórios de Rack",
      subtype: "Bandejas",
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 25 — CONVERSORES DE MÍDIA
  // ==========================================================

  if (
    has(
      name,
      "CONVERSOR DE MIDIA",
      "CONVERSORES DE MIDIA"
    )
  ) {

    return {
      family: "redes",
      type: "Conversores de Mídia",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 26 — FIBRA ÓPTICA
  // ==========================================================

  if (
    has(
      name,
      "FIBRA OPTICA",
      "CABO OPTICO",
      "CABO DE FIBRA",
      "DROP"
    )
  ) {

    return {
      family: "cabeamento",
      type: "Fibra Óptica",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 27 — FONTES
  // ==========================================================

  if (
    !noPowerSupply &&
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

  // ==========================================================
  // 28 — CONECTORES
  // ==========================================================

  if (
    has(
      name,
      "CONECTOR",
      "CONECTORES",
      "RJ45",
      "RJ11",
      "MC4",
      "BNC",
      "P4",
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

    else if (has(name, "BNC")) {
      subtype = "BNC";
    }

    else if (has(name, "P4")) {
      subtype = "P4";
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
      family: "cabeamento",
      type: "Conectores",
      subtype,
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 29 — CABOS CAT5
  // ==========================================================

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
      subtype: "CAT5",
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 30 — CABOS CAT6
  // ==========================================================

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
      subtype: "CAT6",
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 31 — CABOS GENÉRICOS
  // ==========================================================

  if (
    has(
      name,
      "CABO",
      "CABOS",
      "PATCH CORD",
      "PATCHCORD"
    )
  ) {

    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: null,
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 32 — TELEFONIA: CENTRAIS
  // IMPORTANTE:
  // CP4030 só entra aqui quando houver contexto de telefonia.
  // ==========================================================

  if (
    (
      has(
        name,
        "CENTRAL TELEFONICA",
        "CENTRAL TELEFONICA",
        "IMPACTA",
        "COMUNIC 48",
        "COMUNIC 80",
        "CP112"
      )
      ||
      (
        categoryIs(
          categories,
          "TELEFONIA"
        )
        &&
        has(
          name,
          "CENTRAL"
        )
      )
    )
    &&
    !categoryIs(
      categories,
      "AUTOMATIZADORES"
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
        CP112: "CP112",
      }),
      attributes: {},
    };
  }

  // ==========================================================
  // 33 — TELEFONES
  // ==========================================================

  if (
    has(
      name,
      "TELEFONE",
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
      subtype = "Sem Fio";
    }

    else if (
      has(
        name,
        "IP",
        "TIP 125",
        "TDMI"
      )
    ) {
      subtype = "IP";
    }

    else if (
      has(
        name,
        "COM FIO"
      )
    ) {
      subtype = "Com Fio";
    }

    return {
      family: "telefonia",
      type: "Telefones",
      subtype,
      line: null,
      attributes: {
        ...(has(name, "POE")
          ? {
              poe: true,
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 34 — AUTOMATIZADORES
  // ==========================================================

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
      attributes: {
        ...(extractVoltage(text)
          ? {
              tensao: extractVoltage(text),
            }
          : {}),
      },
    };
  }

  // ==========================================================
  // 35 — PEÇAS DE AUTOMATIZADORES
  // ==========================================================

  if (
    (
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
        "REPOSIÇÃO"
      )
      ||
      (
        has(
          name,
          "SUPORTE"
        )
        &&
        categoryIs(
          categories,
          "AUTOMATIZADORES"
        )
      )
    )
    &&
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
      )
      ||
      categoryIs(
        categories,
        "AUTOMATIZADORES"
      )
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

  // ==========================================================
  // FALLBACK
  // ==========================================================

  return {
    family: null,
    type: null,
    subtype: null,
    line: null,
    attributes: {},
  };
}

// ============================================================
// SCORE
// ============================================================

export function calculateScore(
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

// ============================================================
// STATUS
// ============================================================

export function getStatus(
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