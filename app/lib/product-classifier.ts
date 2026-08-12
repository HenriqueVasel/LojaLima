// ============================================================
// PRODUCT CLASSIFIER — V12 CALIBRADO
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

function categoryIsAny(categories: string, ...values: string[]) {
  return values.some((value) => hasWord(categories, value));
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
  // V12 — OVERRIDES CALIBRADOS PELA AUDITORIA DOS 500 PRODUTOS
  // ==========================================================
  // Regras de alta confiança vêm ANTES das regras genéricas.
  // O objetivo é corrigir os casos observados na auditoria V11
  // sem alterar as regras que já estavam funcionando.

  // ----------------------------------------------------------
  // ALARMES — CONTROLES / TRANSMISSORES
  // ----------------------------------------------------------
  if (
    has(
      name,
      "TX 434",
      "TX INTELBRAS",
      "TX CAR EVO",
      "XAC2000",
      "XAC 2000",
      "XAC4000",
      "XAC 4000",
      "XAC 8000",
      "XAC 4003",
      "XTR 1000"
    )
  ) {
    return {
      family: "alarmes",
      type: "Transmissores",
      subtype: "Controles e Transmissores",
      line: has(name, "XAC8000", "XAC 8000") ? "XAC 8000"
        : has(name, "XAC4003", "XAC 4003") ? "XAC 4003"
        : has(name, "XAC4000", "XAC 4000") ? "XAC 4000"
        : has(name, "XAC2000", "XAC 2000") ? "XAC 2000"
        : has(name, "XTR 1000") ? "XTR"
        : "TX",
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // ALARMES — DETECTORES DE FUMAÇA
  // ----------------------------------------------------------
  if (has(name, "DFC 421", "DFE 521", "DETECTOR DE FUMACA", "DETECTOR DE FUMAÇA")) {
    return {
      family: "alarmes",
      type: "Alarmes de Incêndio",
      subtype: "Detectores de Fumaça",
      line: firstMatch(name, { "DFC 421": "DFC", "DFE 521": "DFE" }),
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // TELEFONIA — CENTRAIS CP / COMUNIC / IMPACTA
  // ----------------------------------------------------------
  if (
    has(
      name,
      "CP 112 CENTRAL",
      "CP 112",
      "CP 192 CENTRAL",
      "CP 192",
      "CP 352 CENTRAL",
      "CP352 CENTRAL",
      "CP 4000 SMD",
      "CENTRAL CP 4000",
      "CP 4030",
      "COMUNIC 48 CENTRAL",
      "COMUNIC 80",
      "CENTRAL COLETIVA",
      "COLLECTIVE 20"
    )
  ) {
    return {
      family: "telefonia",
      type: "Centrais Telefônicas",
      subtype: "Centrais de Comunicação Condominial",
      line: has(name, "CP 112") ? "CP112"
        : has(name, "CP 192") ? "CP192"
        : has(name, "CP 352", "CP352") ? "CP352"
        : has(name, "CP 4030", "CP4030") ? "CP4030"
        : has(name, "IMPACTA") ? "IMPACTA"
        : has(name, "COMUNIC") ? "COMUNIC"
        : "COLLECTIVE",
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // AUTOMATIZADORES — SENSOR DE PORTA RP 100
  // ----------------------------------------------------------
  if (has(name, "RP 100")) {
    return {
      family: "automatizadores",
      type: "Sensores para Automatizadores",
      subtype: "Sensores de Presença",
      line: "RP",
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // AUTOMAÇÃO SMART
  // ----------------------------------------------------------
  if (has(name, "ECW 1001", "EWS 211", "CONTROLADOR DE CARGAS WI-FI", "CONTROLADOR DE CARGAS WIFI")) {
    return {
      family: "automacao",
      type: "Casa Inteligente",
      subtype: "Controladores Wi-Fi",
      line: has(name, "ECW 1001") ? "ECW" : "EWS",
      attributes: { wifi: true },
    };
  }

  // ----------------------------------------------------------
  // ANTENAS / RECEPÇÃO DE TV
  // ----------------------------------------------------------
  if (has(name, "ANTENA INTERNA DE TV", "ANTENA DE TV INTERNA", "AI 3101", "AI 1015", "ANTENA SETORIAL", "UACC-UK-ULTRA-PANEL-ANTENNA")) {
    return {
      family: "antenas",
      type: "Antenas",
      subtype: has(name, "ANTENA SETORIAL", "UACC-UK-ULTRA-PANEL") ? "Antenas Setoriais" : "Antenas de TV",
      line: firstMatch(name, { "AI 3101": "AI", "AI 1015": "AI", "UACC-UK-ULTRA-PANEL-ANTENNA": "UACC" }),
      attributes: {},
    };
  }

  if (has(name, "RECEPTOR DIGITAL TV VIA SATELITE", "RECEPTOR DIGITAL TV VIA SATÉLITE", "RDS 830")) {
    return {
      family: "antenas",
      type: "Receptores de TV",
      subtype: "Receptores via Satélite",
      line: "RDS",
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // CONTROLE DE ACESSO — CAMPAINHAS / MÓDULOS
  // ----------------------------------------------------------
  if (has(name, "CIB 101S", "CIB 100 ME", "MODULO EXTERNO CAMPAINHA", "MÓDULO EXTERNO CAMPAINHA")) {
    return {
      family: "controle-acesso",
      type: "Campainhas",
      subtype: "Campainhas Sem Fio",
      line: "CIB",
      attributes: {},
    };
  }

  if (has(name, "PROTETOR DRYPLUG", "IDEAL PARA CONTROLES DE ACESSO")) {
    return {
      family: "controle-acesso",
      type: "Acessórios de Controle de Acesso",
      subtype: "Protetores",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // V12 — COMPLEMENTOS DE ALTO VALOR DA AUDITORIA
  // ----------------------------------------------------------
  if (has(name, "MODULADOR AGIL", "MODULADOR ÁGIL")) {
    return {
      family: "antenas",
      type: "Distribuição de Sinal",
      subtype: "Moduladores",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "PROTETOR DE LINHA TELEFONICA", "PROTETOR DE LINHA TELEFÔNICA")) {
    return {
      family: "telefonia",
      type: "Acessórios de Telefonia",
      subtype: "Protetores de Linha",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "PERFIL P/CERCA", "PERFIL P/ CERCA", "PERFIL ESTRELA", "PERFIL CANTONEIRA", "ISOLADORES") && categoryIsAny(categories, "DIVERSOS", "ALARMES")) {
    return {
      family: "alarmes",
      type: "Cerca Elétrica",
      subtype: "Acessórios de Cerca Elétrica",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "MIP 1000 IP", "MODULO INTELIGENTE DE PORTARIA", "MÓDULO INTELIGENTE DE PORTARIA")) {
    return {
      family: "controle-acesso",
      type: "Controladores",
      subtype: "Módulos de Portaria",
      line: "MIP",
      attributes: {},
    };
  }

  if (has(name, "XPE 1001 ID", "XPE 1001", "PORTEIRO COM LEITOR")) {
    return {
      family: "porteiros",
      type: "Porteiros",
      subtype: "Porteiros Eletrônicos",
      line: "XPE",
      attributes: {},
    };
  }

  if (has(name, "MODULO GPRS UNIVERSAL", "MÓDULO GPRS UNIVERSAL", "GPRS 1000 UNIVERSAL")) {
    return {
      family: "alarmes",
      type: "Módulos de Comunicação",
      subtype: "Módulos GPRS",
      line: "GPRS",
      attributes: {},
    };
  }

  if (has(name, "GR2 MIXX G6", "GR2-MIXX G6", "CENTRAL GATTER ELETR S-BOARD", "S-BOARD 1000", "AUT PIVO GAT", "AUT PIVÔ GAT")) {
    return {
      family: "automatizadores",
      type: has(name, "CENTRAL") ? "Centrais de Comando" : "Automatizadores",
      subtype: has(name, "CENTRAL") ? "Centrais de Comando" : "Automatizadores de Portão",
      line: null,
      attributes: {
        ...(extractVoltage(text) ? { tensao: extractVoltage(text) } : {}),
      },
    };
  }

  if (has(name, "VBOX 3000 B", "CAIXA METALICA VBOX", "CAIXA METÁLICA VBOX")) {
    return {
      family: "cftv",
      type: "Acessórios de CFTV",
      subtype: "Caixas de Passagem",
      line: "VBOX",
      attributes: {},
    };
  }

  if (has(name, "STANDARD 600 X 600 X 250")) {
    return {
      family: "energia",
      type: "Quadros e Caixas Elétricas",
      subtype: "Quadros de Distribuição",
      line: "STANDARD",
      attributes: {},
    };
  }

  if (has(name, "ABRACADEIRA NYLON", "ABRAÇADEIRA NYLON", "ROLO DE VELCRO", "VELCRO")) {
    return {
      family: "cabeamento",
      type: "Acessórios de Cabeamento",
      subtype: "Abraçadeiras e Velcros",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "CANALETA", "DERIVAÇÃO EM", "DERIVACAO EM", "COTOVELO EXTERNO", "COTOVELO 90 GRAUS", "TAMPA EXTREMIDADE", "PASSA FIO HELICOIDAL")) {
    return {
      family: "cabeamento",
      type: "Canaletas e Acessórios",
      subtype: has(name, "CANALETA") ? "Canaletas" : has(name, "TAMPA") ? "Tampas" : has(name, "COTOVELO") ? "Cotovelo" : has(name, "DERIVAÇÃO", "DERIVACAO") ? "Derivações" : "Passa Fios",
      line: "SISTEMA X",
      attributes: {},
    };
  }

  if (has(name, "FITA ISOLANTE", "KIT FUSIVEL", "KIT FUSÍVEL", "TOMADA BLINDADA")) {
    return {
      family: "energia",
      type: "Proteção e Distribuição",
      subtype: has(name, "FITA ISOLANTE") ? "Fitas Isolantes" : has(name, "FUSIVEL", "FUSÍVEL") ? "Fusíveis" : "Tomadas",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "CAIXA PLASTICA CENTRAL", "CAIXA PLÁSTICA CENTRAL", "CAIXA PLASTICA CENTRAL DE COMAN", "CAIXA METALICA BRANCA DIGITAL SAT", "CAIXA METÁLICA BRANCA DIGITAL SAT")) {
    return {
      family: "controle-acesso",
      type: "Caixas e Gabinetes",
      subtype: "Caixas para Equipamentos",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // V12 — SUBTIPOS PARA ELEVAR PRECISÃO DOS CASOS REVISAR
  // ----------------------------------------------------------
  if (has(name, "XSA 1000", "SUPORTE ARTICULADO XSA 1000")) {
    return {
      family: "alarmes",
      type: "Acessórios de Sensores",
      subtype: "Suportes para Sensores",
      line: "XSA",
      attributes: {},
    };
  }

  if (has(name, "EP 02", "EP 04") && has(name, "CONTROLE REMOTO")) {
    return {
      family: "automatizadores",
      type: "Acessórios de Automatizadores",
      subtype: "Controles Remotos",
      line: "EP",
      attributes: {},
    };
  }

  if (has(name, "LIMA P/ENXADA", "LIMA PARA ENXADA")) {
    return {
      family: "ferramentas",
      type: "Ferramentas e Acessórios",
      subtype: "Limas",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "MOTOR 2000/AR", "MOTOR PARA PORTAO", "MOTOR PARA PORTÃO", "AUTOMATIZADOR DE PORTAO", "AUTOMATIZADOR DE PORTÃO", "AUTOMATIZADOR DE PORTA")) {
    return {
      family: "automatizadores",
      type: "Automatizadores",
      subtype: "Automatizadores de Portão",
      line: null,
      attributes: {
        ...(extractVoltage(text) ? { tensao: extractVoltage(text) } : {}),
      },
    };
  }

  if (has(name, "CENTRAL AUTOMATIZADOR", "CENTRAL DE COMANDO", "CENTRAL COMANDO", "CENTRAL GATTER")) {
    return {
      family: "automatizadores",
      type: "Centrais de Comando",
      subtype: "Centrais de Comando",
      line: null,
      attributes: {
        ...(extractVoltage(text) ? { tensao: extractVoltage(text) } : {}),
      },
    };
  }

  if (has(name, "CERCA ELETRICA", "CERCA ELÉTRICA", "ELC 5001", "ELC 5002", "ELC 3012")) {
    return {
      family: "alarmes",
      type: "Cerca Elétrica",
      subtype: "Centrais de Cerca Elétrica",
      line: firstMatch(name, { "ELC 5001": "ELC", "ELC 5002": "ELC", "ELC 3012": "ELC" }),
      attributes: {},
    };
  }

  if (has(name, "SIRENE", "SIR 2000")) {
    return {
      family: "alarmes",
      type: "Sirenes",
      subtype: "Sirenes",
      line: has(name, "SIR 2000") ? "SIR" : null,
      attributes: {},
    };
  }

  if (has(name, "SWITCH") && has(name, "POE", "HI-POE")) {
    return {
      family: "redes",
      type: "Switches",
      subtype: "PoE",
      line: null,
      attributes: {
        poe: true,
        ...(extractPorts(name) ? { portas: extractPorts(name) } : {}),
      },
    };
  }

  if (has(name, "ROTEADOR", "ROUTER", "ROTEADOR WIRELESS", "W4-300F", "W6-1500", "R3005G")) {
    return {
      family: "redes",
      type: "Roteadores",
      subtype: has(name, "WIRELESS", "WIFI", "WI-FI") ? "Wi-Fi" : "Roteadores",
      line: null,
      attributes: {
        ...(has(name, "WIRELESS", "WIFI", "WI-FI") ? { wifi: true } : {}),
        ...(extractPorts(name) ? { portas: extractPorts(name) } : {}),
      },
    };
  }

  if (has(name, "ROTEADOR/ACCESS POINT", "ROTEADOR ACCESS POINT", "AP 1250", "AP360", "AP310")) {
    return {
      family: "redes",
      type: "Access Points",
      subtype: "Wi-Fi",
      line: null,
      attributes: { wifi: true },
    };
  }

  if (has(name, "CONVERSORES DE MIDIA", "CONVERSOR DE MIDIA", "KFM 112", "KGM 1105")) {
    return {
      family: "redes",
      type: "Conversores de Mídia",
      subtype: "Conversores de Mídia",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "PRENSA CABO", "PRENSA-CABO")) {
    return {
      family: "cabeamento",
      type: "Acessórios de Cabeamento",
      subtype: "Prensa-cabos",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "CABO HDMI")) {
    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: "Cabos HDMI",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "CABO USB", "USB-C", "USB - USB-C")) {
    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: "Cabos USB",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "CABO COAXIAL", "CABO CFTV", "CABO PARALELO", "CABO PP", "CABO BICOLOR", "CABO 4MM+2X26")) {
    return {
      family: "cabeamento",
      type: "Cabos",
      subtype: has(name, "COAXIAL") ? "Cabos Coaxiais" : has(name, "CFTV") ? "Cabos para CFTV" : "Cabos Elétricos",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "TELEFONE PLENO", "TELEFONE COM FIO")) {
    return {
      family: "telefonia",
      type: "Telefones",
      subtype: "Telefones Com Fio",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // ALARMES — EXPANSORES DE ZONA
  // ----------------------------------------------------------
  if (
    has(name, "EXPANSOR DE ZONAS", "EXPANSOR DE ZONA", "XEZ 4108", "XEZ4108")
  ) {
    return {
      family: "alarmes",
      type: "Expansores",
      subtype: "Expansores de Zonas",
      line: "XEZ",
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // ALARMES — ACIONADORES / DETECTORES / ILUMINAÇÃO DE EMERGÊNCIA
  // ----------------------------------------------------------
  if (has(name, "ACIONADOR MANUAL ENDERECAVEL", "ACIONADOR MANUAL ENDERECÁVEL", "AME521")) {
    return {
      family: "alarmes",
      type: "Acionadores",
      subtype: "Acionadores Manuais",
      line: "AME",
      attributes: {},
    };
  }

  if (has(name, "DETECTOR DE GAS", "DETECTOR DE GÁS", "GLP COM RELE", "GLP COM RELÉ")) {
    return {
      family: "alarmes",
      type: "Detectores",
      subtype: "Detectores de Gás",
      line: null,
      attributes: {},
    };
  }

  if (
    has(
      name,
      "BLOCO DE ILUMINACAO AUTONOMO",
      "BLOCO DE ILUMINAÇÃO AUTÔNOMO",
      "SINALIZADOR AUDIO VISUAL ENDERECAVEL",
      "SINALIZADOR AUDIO VISUAL ENDEREÇÁVEL"
    )
  ) {
    return {
      family: "alarmes",
      type: "Alarmes de Incêndio",
      subtype: has(name, "BLOCO DE ILUMINACAO", "BLOCO DE ILUMINAÇÃO")
        ? "Iluminação de Emergência"
        : "Sinalizadores",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // REDES — ACCESS POINTS UBIQUITI / UNIFI
  // ----------------------------------------------------------
  if (
    has(name, "U7-LR", "U7-LITE", "U7-PRO", "U6-PRO", "U6-LITE", "U6+", "UAP-AC") ||
    (has(name, "UNIFI") && has(name, "ACCESS POINT", "AP"))
  ) {
    const line = has(name, "U7-LR", "U7-LITE", "U7-PRO")
      ? "U7"
      : has(name, "U6-PRO", "U6-LITE", "U6+")
        ? "U6"
        : has(name, "UAP-AC")
          ? "UAP-AC"
          : "UNIFI";

    return {
      family: "redes",
      type: "Access Points",
      subtype: "Wi-Fi",
      line,
      attributes: {
        wifi: true,
        ...(has(name, "POE", "SEM FONTE") ? { poe: true } : {}),
      },
    };
  }

  // ----------------------------------------------------------
  // REDES — SWITCH UBIQUITI
  // ----------------------------------------------------------
  if (has(name, "USW-48", "UNIFI SWITCH")) {
    return {
      family: "redes",
      type: "Switches",
      subtype: "Gerenciáveis",
      line: "UNIFI",
      attributes: {
        gerenciavel: true,
        ...(extractPorts(name) ? { portas: extractPorts(name) } : {}),
      },
    };
  }

  // ----------------------------------------------------------
  // REDES — MODEMS / ONT / MESH / ADAPTADORES WI-FI
  // ----------------------------------------------------------
  if (has(name, "MODEM OPTICO", "MODEM ÓPTICO", "ONT", "WIFIBER", "WIFI6", "WI-FI 6")) {
    return {
      family: "redes",
      type: "Modems e ONTs",
      subtype: has(name, "PON", "ONT") ? "ONTs" : "Modems Ópticos",
      line: null,
      attributes: {
        ...(has(name, "WIFI", "WI-FI") ? { wifi: true } : {}),
        ...(extractPorts(name) ? { portas: extractPorts(name) } : {}),
      },
    };
  }

  if (has(name, "EXTENSOR WIFI", "EXTENSOR WI-FI", "MESH")) {
    return {
      family: "redes",
      type: "Access Points",
      subtype: "Extensores Wi-Fi",
      line: null,
      attributes: { wifi: true },
    };
  }

  if (has(name, "ADAPTADOR USB WI-FI", "ADAPTADOR USB WIFI")) {
    return {
      family: "redes",
      type: "Adaptadores de Rede",
      subtype: "Adaptadores Wi-Fi",
      line: null,
      attributes: { wifi: true },
    };
  }

  // ----------------------------------------------------------
  // REDES — RACKS E ACESSÓRIOS DE RACK
  // ----------------------------------------------------------
  if (has(name, "BANDEJA FIXA", "BANDEJA PARA RACK")) {
    return {
      family: "redes",
      type: "Acessórios de Rack",
      subtype: "Bandejas",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "KIT VENTILACAO", "KIT VENTILAÇÃO", "COOLERS", "REGUA COM", "RÉGUA COM", "GUIA DE CABOS P/ RACK", "GUIA DE CABOS PARA RACK", "CONJUNTO TRILHO RACK", "FRENTE FALSA P/RACK", "FRENTE FALSA PARA RACK", "KIT PORCA GAIOLA")) {
    return {
      family: "redes",
      type: "Acessórios de Rack",
      subtype: has(name, "KIT VENTILACAO", "KIT VENTILAÇÃO")
        ? "Ventilação"
        : has(name, "REGUA COM", "RÉGUA COM")
          ? "Régua de Tomadas"
          : has(name, "GUIA DE CABOS")
            ? "Guias de Cabos"
            : has(name, "TRILHO")
              ? "Trilhos"
              : has(name, "FRENTE FALSA")
                ? "Frentes Falsas"
                : "Fixação",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "MINI RACK")) {
    return {
      family: "redes",
      type: "Racks",
      subtype: "Mini Racks",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "RACK DE PISO", "RACK PISO")) {
    return {
      family: "redes",
      type: "Racks",
      subtype: "Racks de Piso",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // REDES — PATCH PANELS / FIBRA / SUPORTE ONU
  // ----------------------------------------------------------
  if (has(name, "PATCH PANEL", "PATCH CORD") && !has(name, "CAT5", "CAT6")) {
    return {
      family: "redes",
      type: "Patch Panels",
      subtype: "Patch Panels",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "SUPORTE DE ONU", "SUPORTE ONU")) {
    return {
      family: "redes",
      type: "Acessórios de Rede",
      subtype: "Suportes de ONU",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // TELEFONIA — GATEWAYS / RÁDIOS / ACESSÓRIOS
  // ----------------------------------------------------------
  if (has(name, "GW 308 S", "GW 316 S", "GW 332 S", "GATEWAY DE VOZ", "GATEWAY GW")) {
    return {
      family: "telefonia",
      type: "Gateways",
      subtype: "Gateways de Voz",
      line: firstMatch(name, { "GW 308 S": "GW", "GW 316 S": "GW", "GW 332 S": "GW" }),
      attributes: {},
    };
  }

  if (has(name, "RADIO COMUNICADOR", "RÁDIO COMUNICADOR", "RADIO COMUNIC", "RÁDIO COMUNIC")) {
    return {
      family: "telefonia",
      type: "Rádios Comunicadores",
      subtype: "Rádios Comunicadores",
      line: firstMatch(name, { "RC 4002": "RC", "RC 4102": "RC", "RPD8": "RPD" }),
      attributes: {},
    };
  }

  if (has(name, "FONE DE OUVIDO P/RADIO", "FONE DE OUVIDO PARA RADIO", "HEADSET")) {
    return {
      family: "telefonia",
      type: "Acessórios de Telefonia",
      subtype: "Headsets e Fones",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "PLACA RAMAL", "PLACA TRONCO", "PLACA DISA", "PLACA DE EXPANSAO GATEWAY", "PLACA DE EXPANSÃO GATEWAY", "PLACA 2 TRONCOS")) {
    return {
      family: "telefonia",
      type: "Acessórios de Centrais",
      subtype: has(name, "RAMAL") ? "Placas de Ramal" : has(name, "TRONCO") ? "Placas de Tronco" : "Placas de Centrais",
      line: has(name, "IMPACTA") ? "IMPACTA" : has(name, "MODULARE") ? "MODULARE" : null,
      attributes: {},
    };
  }

  if (has(name, "TUBO DE VOZ", "ADAPTADOR DE PINAGEM", "TERMINAL INTELIGENTE", "TERMINAL DE VOZ")) {
    return {
      family: "telefonia",
      type: "Acessórios de Telefonia",
      subtype: "Terminais e Acessórios",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // PORTEIROS / CONTROLE DE ACESSO
  // ----------------------------------------------------------
  if (has(name, "IPR1010", "IPR8010", "IVR 7", "VIDEOPORTEIRO RESIDENCIAL", "PORTEIRO RESIDENCIAL")) {
    return {
      family: "porteiros",
      type: "Porteiros Residenciais",
      subtype: "Porteiros Residenciais",
      line: firstMatch(name, { IPR1010: "IPR", IPR8010: "IPR", "IVR 7": "IVR" }),
      attributes: {},
    };
  }

  if (has(name, "VIDEOPORTEIRO SMART", "VIDEOPORTEIRO RESIDENCIAL", "VIDEO PORTEIRO SMART", "IVW 3000")) {
    return {
      family: "porteiros",
      type: "Vídeo Porteiros",
      subtype: "Vídeo Porteiros",
      line: firstMatch(name, { "IVW 3000": "IVW" }),
      attributes: {},
    };
  }

  if (has(name, "EXTENSAO PORTEIRO", "EXTENSÃO PORTEIRO", "EXTENSAO DE AUDIO", "EXTENSÃO DE ÁUDIO", "PROTETOR TOTEM")) {
    return {
      family: "porteiros",
      type: "Acessórios de Porteiros",
      subtype: has(name, "EXTENSAO", "EXTENSÃO") ? "Extensões" : "Suportes e Proteções",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "XFE 1000", "MODULO ACIONAMENTO EXTERNO", "MÓDULO DE ACIONAMENTO EXTERNO")) {
    return {
      family: "controle-acesso",
      type: "Acessórios de Controle de Acesso",
      subtype: "Módulos de Acionamento",
      line: "XFE",
      attributes: {},
    };
  }

  if (has(name, "DIGIPROX", "SA203", "LEITOR DE PROXIMIDADE")) {
    return {
      family: "controle-acesso",
      type: "Leitores",
      subtype: "Leitores RFID",
      line: null,
      attributes: { rfid: true },
    };
  }

  if (has(name, "ACIONADOR DE EMERGENCIA", "ACIONADOR DE CORTINAS", "ACIONADOR DE PORTAO", "ACIONADOR DE PORTÃO")) {
    return {
      family: has(name, "CORTINAS") ? "automacao" : "controle-acesso",
      type: "Acionadores",
      subtype: has(name, "EMERGENCIA") ? "Acionadores de Emergência" : "Acionadores",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // AUTOMATIZADORES — RECEPTORES / PEÇAS / MOTORES
  // ----------------------------------------------------------
  if (has(name, "RECEPTOR MD T01", "MD T01")) {
    return {
      family: "automatizadores",
      type: "Acessórios de Automatizadores",
      subtype: "Receptores",
      line: "MD",
      attributes: {
        ...(extractVoltage(text) ? { tensao: extractVoltage(text) } : {}),
      },
    };
  }

  if (has(name, "REPOS CJ ENGR CREM", "REPOS PORCA DE BRONZE", "CONJUNTO FRICCAO", "CONJUNTO FRICÇÃO", "CHAVE MANUAL DZ", "TAMPA FRONTAL DESLI", "GABINETE AUT.", "GABINETE AUT", "CREMALHEIRA INDUSTRIAL", "CREMALHEIRA 1.5M", "SENSOR DESLIZANTE SOCIAL")) {
    return {
      family: "automatizadores",
      type: "Acessórios de Automatizadores",
      subtype: has(name, "CREMALHEIRA") ? "Cremalheiras"
        : has(name, "FRICCAO", "FRICÇÃO") ? "Conjuntos de Fricção"
        : has(name, "PORCA") ? "Porcas e Fusos"
        : has(name, "GABINETE") ? "Gabinetes"
        : has(name, "CHAVE MANUAL") ? "Chaves Manuais"
        : has(name, "TAMPA") ? "Tampas"
        : "Acessórios de Automatizadores",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // CFTV — EXTENSORES HDMI / BALUNS / CAIXAS / MICRO SD
  // ----------------------------------------------------------
  if (has(name, "EXTENSOR HDMI", "EXTENSOR HDMI 4K", "EXTENSOR HDMI TX E RX")) {
    return {
      family: "cftv",
      type: "Acessórios de CFTV",
      subtype: "Extensores HDMI",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "BALUN PASSIVO DE VIDEO", "BALUN PASSIVO DE VÍDEO", "POWER CONV. EST. VIDEO BALUN", "POWER CONV EST VIDEO BALUN")) {
    return {
      family: "cftv",
      type: "Acessórios de CFTV",
      subtype: "Baluns de Vídeo",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "CARTAO MICRO SD", "CARTÃO MICRO SD")) {
    return {
      family: "cftv",
      type: "Armazenamento",
      subtype: "Cartões Micro SD",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "MESA DE CONTROLE IP", "MESA DE CONTROLE IP/ANALOGICA", "MESA DE CONTROLE IP/ANALÓGICA")) {
    return {
      family: "cftv",
      type: "Mesas de Controle",
      subtype: "Mesas de Controle IP",
      line: "VTN",
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // ANTENAS / DISTRIBUIÇÃO DE SINAL
  // ----------------------------------------------------------
  if (has(name, "DIPLEXER", "DIVISOR", "AMPLIFICADOR LINHA", "AMPLIFICADOR DE LINHA", "MINI BOOSTER", "AMPLIFICADOR LINHA SATELITE", "AMPLIFICADOR LINHA SATÉLITE")) {
    return {
      family: "antenas",
      type: "Distribuição de Sinal",
      subtype: has(name, "DIPLEXER") ? "Diplexers"
        : has(name, "DIVISOR") ? "Divisores e Splitters"
        : "Amplificadores e Boosters",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // CABEAMENTO — CABOS / FIBRA / CONECTORES
  // ----------------------------------------------------------
  if (has(name, "CABO OPTICO", "CABO ÓPTICO", "CABO DE FIBRA", "FIBRA OPTICA", "FIBRA ÓPTICA", "CTO NAP", "CAIXA DIO", "DIO-DISTRIBUIDOR", "CORDAO OPTICO", "CORDÃO ÓPTICO", "SUPORTE METALICO AEREO PARA CONJUNTO DE EMENDA OPTICA")) {
    return {
      family: "cabeamento",
      type: "Fibra Óptica",
      subtype: has(name, "CTO NAP") ? "CTO"
        : has(name, "CAIXA DIO", "DIO-DISTRIBUIDOR") ? "DIO"
        : has(name, "CORDAO OPTICO", "CORDÃO ÓPTICO") ? "Cordões Ópticos"
        : "Cabos de Fibra Óptica",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "CONECTOR MACHO", "CONECTOR DE COMPRESSAO", "CONECTOR DE COMPRESSÃO", "MC4Y", "KIT 50 CONECTORES", "CONJUNTO 9 CONECTORES", "BASTIDOR P/ 1 BLOCO ENGATE")) {
    return {
      family: "cabeamento",
      type: "Conectores",
      subtype: has(name, "MC4Y") ? "MC4" : has(name, "COMPRESSAO", "COMPRESSÃO") ? "Conectores de Compressão" : "Conectores Diversos",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // ENERGIA / ELÉTRICA
  // ----------------------------------------------------------
  if (has(name, "MODULO DE BATERIAS", "MÓDULO DE BATERIAS", "GAL 12V-20", "GBA 12V 2AH")) {
    return {
      family: "energia",
      type: "Acessórios de Energia",
      subtype: "Módulos e Baterias",
      line: null,
      attributes: {
        ...(extractVoltage(text) ? { tensao: extractVoltage(text) } : {}),
      },
    };
  }

  if (has(name, "CONVERSOR AUTOMATICO AC/DC", "CONVERSOR AUTOMÁTICO AC/DC", "CONVERSOR AUT 12V", "CONVERSOR AUT 12V", "CONVERSOR AUT 24V", "CONVERSOR ESTATICO DC/DC", "CONVERSOR ESTÁTICO DC/DC")) {
    return {
      family: "energia",
      type: "Conversores",
      subtype: "Conversores de Alimentação",
      line: null,
      attributes: {
        ...(extractVoltage(text) ? { tensao: extractVoltage(text) } : {}),
      },
    };
  }

  if (has(name, "PROTETOR ELETRONICO", "PROTETOR ELETRÔNICO", "TOMADA DESMONTAVEL", "TOMADA DESMONTÁVEL", "TOMADA SIMPLES", "PLUGUE DESMONTAV", "PLUGUE DESMONTÁV", "INT S SX 10A250V", "ARSTOP SOBREPOR")) {
    return {
      family: "energia",
      type: "Proteção e Distribuição",
      subtype: has(name, "PROTETOR") ? "Protetores de Linha" : has(name, "TOMADA") ? "Tomadas" : "Acessórios Elétricos",
      line: null,
      attributes: {
        ...(extractVoltage(text) ? { tensao: extractVoltage(text) } : {}),
      },
    };
  }

  // ----------------------------------------------------------
  // CONTROLE DE ACESSO — SUPORTES / CREMALHEIRAS / SENSORES
  // ----------------------------------------------------------
  if (categoryIsAny(categories, "CONTROLE DE ACESSO", "CONTROLE ACESSO") && has(name, "SUPORTE")) {
    return {
      family: "controle-acesso",
      type: "Acessórios de Controle de Acesso",
      subtype: "Suportes",
      line: null,
      attributes: {},
    };
  }

  if (has(name, "CREMALHEIRA") && categoryIsAny(categories, "CONTROLE DE ACESSO", "AUTOMATIZADORES")) {
    return {
      family: "automatizadores",
      type: "Acessórios de Automatizadores",
      subtype: "Cremalheiras",
      line: null,
      attributes: {},
    };
  }

  // ----------------------------------------------------------
  // DIVERSOS COM SINAL DE PRODUTO FERRAMENTA / FIXAÇÃO
  // ----------------------------------------------------------
  if (has(name, "ESTILETE", "ALICATE", "BROCA", "CHAVE FENDA", "CHAVE PHILLIPS", "JG FERRAMENTAS", "JOGO DE FERRAMENTAS", "BOLSA EM LONA", "CAIXA BAU", "CAIXA BAÚ", "TINTA SPRAY", "VASELINA", "GRAXA BISNAGA")) {
    return {
      family: "ferramentas",
      type: "Ferramentas e Acessórios",
      subtype: has(name, "BROCA") ? "Brocas" : has(name, "ALICATE") ? "Alicates" : has(name, "CHAVE") ? "Chaves" : "Ferramentas e Acessórios",
      line: null,
      attributes: {},
    };
  }

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

  const cameraModelSignal = has(
    name,
    "VIP",
    "VIPW",
    "VHD",
    "VHDM"
  );

  if (
    has(
      name,
      "CAMERA",
      "CAM IP",
      "CAMERA IP",
      "CAMERA WIFI",
      "CAMERA WI-FI"
    ) ||
    cameraModelSignal
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
  // 9 — LEITORES DE CONTROLE DE ACESSO
  // IMPORTANTE: antes de RFID/CREDENCIAIS para não confundir
  // "LEITOR RFID" com cartão/tag/chaveiro.
  // ==========================================================

  if (
    has(
      name,
      "LEITOR DE ACESSO",
      "LEITOR RFID",
      "LEITOR FACIAL",
      "LEITOR BIOMETRICO",
      "LEITOR BIOMETRIA",
      "LEITOR DE PROXIMIDADE"
    )
    ||
    (
      categoryIsAny(categories, "CONTROLE DE ACESSO", "CONTROLE ACESSO") &&
      has(name, "LEITOR")
    )
  ) {
    let subtype = "Leitores";

    if (has(name, "FACIAL")) {
      subtype = "Leitores Faciais";
    } else if (has(name, "BIOMETRIA", "BIOMETRICO")) {
      subtype = "Leitores Biométricos";
    } else if (has(name, "RFID", "PROXIMIDADE", "MIFARE")) {
      subtype = "Leitores RFID";
    }

    return {
      family: "controle-acesso",
      type: "Leitores",
      subtype,
      line: null,
      attributes: {
        ...(has(name, "RFID", "MIFARE")
          ? { rfid: true }
          : {}),
        ...(has(name, "POE")
          ? { poe: true }
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
  // 11 — AUTOMAÇÃO / ILUMINAÇÃO: SENSORES
  // Evita que sensores destinados à iluminação caiam em Alarmes.
  // ==========================================================

  if (
    has(
      name,
      "SENSOR DE PRESENCA PARA ILUMINACAO",
      "SENSOR DE PRESENCA ILUMINACAO",
      "SENSOR PARA ILUMINACAO",
      "ESP180AE"
    )
    ||
    (
      has(name, "SENSOR", "PRESENCA") &&
      categoryIsAny(categories, "ILUMINACAO", "AUTOMACAO")
    )
  ) {
    return {
      family: "automacao",
      type: "Sensores",
      subtype: "Sensores de Presença para Iluminação",
      line: null,
      attributes: {},
    };
  }

  // ==========================================================
  // 11 — ALARMES: SENSORES
  // ==========================================================

  const alarmSensorSignal =
    has(
      name,
      "IVP",
      "IVA",
      "XAS",
      "REED",
      "SENSOR MAGNETICO",
      "SENSOR MAGNÉTICO",
      "SENSOR DE ALARME"
    ) ||
    (
      has(name, "SENSOR") &&
      categoryIsAny(
        categories,
        "ALARMES",
        "SISTEMA DE SEGURANCA",
        "SISTEMA DE SEGURANÇA"
      )
    );

  if (alarmSensorSignal) {

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

  const accessPointModelSignal = has(
    name,
    "U7-PRO",
    "U6-PRO",
    "U6-LITE",
    "U6+",
    "UAP-AC",
    "UAP-AC-PRO",
    "UAP-AC-LITE",
    "EAP225",
    "EAP610",
    "EAP650",
    "EAP670"
  );

  const accessPointContextSignal =
    has(name, "ACCESS POINT", "ACCESSPOINT", "AP WIFI", "AP WI-FI") ||
    (
      has(name, "UNIFI") &&
      has(name, "AP")
    );

  if (accessPointContextSignal || accessPointModelSignal) {

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
    ) ||
    (
      categoryIsAny(categories, "AUTOMATIZADORES", "AUTOMATIZADOR") &&
      has(
        name,
        "MOTOR",
        "CENTRAL DE COMANDO",
        "CENTRAL COMANDO",
        "RECEPTOR",
        "CONTROLE REMOTO",
        "FOTOCELULA",
        "FOTOCÉLULA"
      )
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

    let subtype = "Acessórios de Automatizadores";

    if (has(name, "CREMALHEIRA")) {
      subtype = "Cremalheiras";
    } else if (has(name, "ENGRENAGEM")) {
      subtype = "Engrenagens";
    } else if (has(name, "COROA")) {
      subtype = "Coroas";
    } else if (has(name, "POLIA")) {
      subtype = "Polias";
    } else if (has(name, "MANCAL")) {
      subtype = "Mancais";
    } else if (has(name, "ROLAMENTO")) {
      subtype = "Rolamentos";
    } else if (has(name, "FUSO")) {
      subtype = "Fusos";
    } else if (has(name, "CONTROLE REMOTO")) {
      subtype = "Controles Remotos";
    } else if (has(name, "FOTOCELULA", "FOTOCÉLULA")) {
      subtype = "Fotocélulas";
    } else if (has(name, "CENTRAL DE COMANDO", "CENTRAL COMANDO")) {
      subtype = "Centrais de Comando";
    } else if (has(name, "RECEPTOR")) {
      subtype = "Receptores";
    } else if (has(name, "SUPORTE")) {
      subtype = "Suportes";
    }

    return {
      family: "automatizadores",
      type: "Acessórios de Automatizadores",
      subtype,
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