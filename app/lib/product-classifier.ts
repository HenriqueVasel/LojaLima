import { classifyProduct as classifyProductV12 } from "./product-classifier-v12-backup";

type ProductInput = Parameters<typeof classifyProductV12>[0];
type Classification = ReturnType<typeof classifyProductV12>;

function norm(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function has(text: string, ...terms: string[]): boolean {
  return terms.some((term) => text.includes(norm(term)));
}

function categoryText(input: ProductInput): string {
  const categories = Array.isArray((input as any).categories)
    ? (input as any).categories
    : [];

  return categories.map((c: unknown) => norm(c)).join(" | ");
}

function setClassification(
  base: Classification,
  patch: Partial<Classification>
): Classification {
  return {
    ...base,
    ...patch,
    attributes: {
      ...(base as any).attributes,
      ...((patch as any).attributes ?? {}),
    },
  } as Classification;
}

/**
 * V13
 *
 * Camada de correção sobre a V12.
 * A V12 continua sendo o motor principal; aqui corrigimos
 * falsos positivos e os 23 casos que ficaram REVISAR/CORRIGIR
 * na auditoria de 500 produtos.
 */
export function classifyProduct(input: ProductInput): Classification {
  const base = classifyProductV12(input);

  const name = norm((input as any).name);
  const description = norm((input as any).description);
  const categories = categoryText(input);
  const text = `${name} ${description}`;

  // ============================================================
// ACESSÓRIOS DE CÂMERAS NÃO SÃO CÂMERAS
// ============================================================
// ============================================================
// EXCEÇÕES — PRODUTOS QUE CONTÊM "CAMERA" MAS NÃO SÃO CÂMERAS
// ============================================================

if (
  has(
    name,
"SUPORTE DE PAREDE CAMERA",
"SUPORTE DE TETO CAMERA",
"SUPORTE PARA CAMERA",
"SUPORTE DE CAMERA",
"SUPORTE DE CÂMERA",
"ACESSORIO PARA CAMERA",
"ACESSÓRIO PARA CÂMERA",
"SUPORTE DE TETO PARA CAMERA",
"SUPORTE DE TETO P/ CAMERA",
"SUPORTE DE TETO PARA CÂMERA",
"SUPORTE DE TETO P/ CÂMERA",
"SUPORTE METALICO P/ SUSTENTACAO DE CAMERAS",
"SUPORTE METÁLICO P/ SUSTENTAÇÃO DE CÂMERAS",
"CABO MULTICAMERA",
"CABO MULTICAMERAS",
"CABO MULTICÂMERA",
"CABO MULTICÂMERAS"
  )
) {
  return setClassification(base, {
    family: "cftv",
    type: "Acessórios de CFTV",
    subtype: "Acessórios de Câmeras",
    line: null,
  });
}


// ============================================================
// WEBCAMS NÃO SÃO HDs DE CFTV
// ============================================================

if (
  has(
    name,
    "WEBCAM",
    "WEBCAM CAM"
  )
) {
  return {
    family: null,
    type: null,
    subtype: null,
    line: null,
    attributes: {},
  };
}

if (
  has(
    name,
    "CAPA P/ CAMERA",
    "CAPA PARA CAMERA",
    "CAPA P/ CÂMERA",
    "CAPA PARA CÂMERA",
    "SUPORTE P/ CAMERA",
    "SUPORTE PARA CAMERA",
    "SUPORTE P/ CÂMERA",
    "SUPORTE PARA CÂMERA"
  )
) {
  return setClassification(base, {
    family: "cftv",
    type: "Acessórios de CFTV",
    subtype: "Acessórios de Câmeras",
    line: null,
  });
}

  // ============================================================
  // 1. CFTV — CÂMERAS
  // ============================================================
  //
  // Ordem das regras:
  // 1) Veiculares
  // 2) Speed Dome / PTZ
  // 3) Wi-Fi
  // 4) Analógicas / HDCVI / VHL / VHC
  // 5) Multi-HD / VHD / VHDM
  // 6) IP / PoE / ONVIF / VIP / VIPW / VLP
  // 7) contexto da categoria
  //
  // IMPORTANTE:
  // "Bullet" e "Dome" são formatos físicos da câmera, não
  // categorias da TAXONOMY. Eles ficam em attributes.formato.
  // ============================================================

  const cameraByName = has(
    name,
    "CAMERA",
    "CÂMERA",
    "CAMERA IP",
    "CÂMERA IP",
    "CAMERA WI-FI",
    "CAMERA WIFI",
    "CÂMERA WI-FI",
    "CÂMERA WIFI",
    "CAMERA VEICULAR",
    "CÂMERA VEICULAR",
    "VLP",
    "VHL",
    "VHC",
    "VHD",
    "VHDM",
    "VIPW",
    "VIP",
    "DCM",
    "DASHCAM",
    "SPEED DOME",
    "SPEEDDOME"
  );

  if (cameraByName) {
    const formato =
      has(name, "BULLET")
        ? "Bullet"
        : has(name, "DOME") && !has(name, "SPEED DOME", "SPEEDDOME")
          ? "Dome"
          : null;

    // ----------------------------------------------------------
    // CÂMERAS VEICULARES
    // ----------------------------------------------------------
    if (
      has(
        name,
        "CAMERA VEICULAR",
        "CÂMERA VEICULAR",
        "CAMERA VEICULAR FULL HD",
        "CÂMERA VEICULAR FULL HD",
        "CAMERA PARA VEICULO",
        "CÂMERA PARA VEÍCULO",
        "DCM 5004",
        "DCM 5006",
        "DCM 3002",
        "DASHCAM"
      )
    ) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "Câmeras Veiculares",
        line: has(name, "DCM") ? "DCM" : null,
        attributes: {
          ...(formato ? { formato } : {}),
        },
      };
    }

    // ----------------------------------------------------------
    // SPEED DOME / PTZ
    // ----------------------------------------------------------
    if (
      has(
        name,
        "SPEED DOME",
        "SPEEDDOME",
        "PTZ SPEED DOME",
        "CAMERA PTZ",
        "CÂMERA PTZ"
      )
    ) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "Speed Dome",
        line: null,
        attributes: {
          ...(formato ? { formato } : {}),
        },
      };
    }

    // ----------------------------------------------------------
    // CÂMERAS WI-FI
    // ----------------------------------------------------------
    if (
      has(
        name,
        "CAMERA WI-FI",
        "CAMERA WIFI",
        "CÂMERA WI-FI",
        "CÂMERA WIFI",
        "CAMERA WIFI FULL HD",
        "CAMERA WI-FI FULL HD",
        "VIDEO WI-FI",
        "VIDEO WIFI",
        "VÍDEO WI-FI",
        "VÍDEO WIFI",
        "CAMERA VIDEO WI-FI",
        "CAMERA VIDEO WIFI",
        "CÂMERA DE VIDEO WI-FI",
        "CÂMERA DE VIDEO WIFI"
      )
    ) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "Câmeras Wi-Fi",
        line: has(name, "VIPW") ? "VIPW" : null,
        attributes: {
          wifi: true,
          ...(formato ? { formato } : {}),
        },
      };
    }

    // ----------------------------------------------------------
    // CÂMERAS ANALÓGICAS / HDCVI
    // VHL/VHC são tratadas como analógicas.
    // ----------------------------------------------------------
    if (
      has(
        name,
        "CAMERA ANALOGICA",
        "CÂMERA ANALÓGICA",
        "CAMERA ANALOG",
        "CÂMERA ANALOG",
        "VHL",
        "VHC",
        "HDCVI",
        "HD-CVI"
      )
    ) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "Analógicas",
        line: has(name, "VHL")
          ? "VHL"
          : has(name, "VHC")
            ? "VHC"
            : null,
        attributes: {
          ...(formato ? { formato } : {}),
        },
      };
    }

    // ----------------------------------------------------------
    // MULTI-HD
    // VHD/VHDM permanecem separados das analógicas genéricas.
    // ----------------------------------------------------------
    if (has(name, "VHDM", "VHD")) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "Multi-HD",
        line: has(name, "VHDM")
          ? "VHDM"
          : "VHD",
        attributes: {
          ...(formato ? { formato } : {}),
        },
      };
    }

    // ----------------------------------------------------------
    // CÂMERAS IP
    // VIP, VIPW e VLP são tratados como linhas IP.
    // ----------------------------------------------------------
    if (
      has(
        name,
        "CAMERA IP",
        "CÂMERA IP",
        "CAMERA POE",
        "CÂMERA POE",
        "CAMERA NETWORK",
        "CÂMERA NETWORK",
        "CAMERA ONVIF",
        "CÂMERA ONVIF",
        "VLP",
        "VIP",
        "VIPW"
      )
    ) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "IP",
        line: has(name, "VLP")
          ? "VLP"
          : has(name, "VIPW")
            ? "VIPW"
            : has(name, "VIP")
              ? "VIP"
              : null,
        attributes: {
          ...(has(name, "POE") ? { poe: true } : {}),
          ...(formato ? { formato } : {}),
        },
      };
    }

    // ----------------------------------------------------------
    // MODELOS VIP/VIPW SEM A PALAVRA "CAMERA" NO NOME
    // ----------------------------------------------------------
    if (
      has(
        name,
        "VIPW",
        "VIP 1230",
        "VIP 1220",
        "VIP 3230",
        "VIP 5450",
        "VIP 5460",
        "VIP 7260"
      )
    ) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "IP",
        line: has(name, "VIPW") ? "VIPW" : "VIP",
        attributes: {
          ...(formato ? { formato } : {}),
        },
      };
    }

    // ----------------------------------------------------------
    // CONTEXTO DA CATEGORIA ATUAL
    // Evita inventar IP/analógica quando o nome é genérico.
    // ----------------------------------------------------------
    if (has(categories, "CFTV IP", " IP ", "IP")) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "IP",
        line: null,
        attributes: {
          ...(formato ? { formato } : {}),
        },
      };
    }

    if (has(categories, "CÂMERAS WI-FI", "CAMERAS WI-FI", "WI-FI")) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "Câmeras Wi-Fi",
        line: null,
        attributes: {
          wifi: true,
          ...(formato ? { formato } : {}),
        },
      };
    }

    if (has(categories, "MULTI-HD")) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "Multi-HD",
        line: null,
        attributes: {
          ...(formato ? { formato } : {}),
        },
      };
    }

    if (has(categories, "ANALOGICA", "ANALÓGICA", "HDCVI")) {
      return {
        family: "cftv",
        type: "Câmeras",
        subtype: "Analógicas",
        line: null,
        attributes: {
          ...(formato ? { formato } : {}),
        },
      };
    }

    // ----------------------------------------------------------
    // CÂMERA GENÉRICA
    // Não inventamos IP/analógica.
    // O classificador mantém a família CFTV para auditoria.
    // ----------------------------------------------------------
    return {
      family: "cftv",
      type: "Câmeras",
      subtype: null,
      line: null,
      attributes: {
        ...(formato ? { formato } : {}),
      },
    };
  }

  // ============================================================
  // 2. PATCH CORD é CABO, não PATCH PANEL
  // ============================================================
  if (has(name, "PATCH CORD")) {
    const subtype = has(name, "CAT6")
      ? "CAT6"
      : has(name, "CAT5E", "CAT5 E")
        ? "CAT5"
        : "Patch Cords";

    return setClassification(base, {
      family: "cabeamento",
      type: "Cabos",
      subtype,
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 3. CABOS específicos que estavam caindo em outras famílias
  // ============================================================
  if (has(name, "CABO RCA")) {
    return setClassification(base, {
      family: "cabeamento",
      type: "Cabos",
      subtype: "Cabos RCA",
      line: null,
    } as Partial<Classification>);
  }

  if (has(name, "CABO AVIATION")) {
    return setClassification(base, {
      family: "cftv",
      type: "Acessórios de CFTV",
      subtype: "Cabos e Extensões",
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 4. AUTOMATIZADORES: sensores/reed da linha Gatter/DZ são
  //    acessórios de automatizador, não sensores de alarme.
  // ============================================================
  if (
    has(categories, "AUTOMATIZADORES") &&
    has(name, "SENSOR", "REED")
  ) {
    return setClassification(base, {
      family: "automatizadores",
      type: "Acessórios de Automatizadores",
      subtype: "Sensores",
      line: null,
    } as Partial<Classification>);
  }

  if (
    has(categories, "AUTOMATIZADORES") &&
    has(name, "CENTRAL CP4030", "CP4030")
  ) {
    return setClassification(base, {
      family: "automatizadores",
      type: "Centrais de Comando",
      subtype: "Centrais de Comando",
      line: "CP4030",
    } as Partial<Classification>);
  }

  if (
    has(categories, "AUTOMATIZADORES") &&
    has(name, "CONJUNTO DO FREIO", "FREIO DZ")
  ) {
    return setClassification(base, {
      family: "automatizadores",
      type: "Acessórios de Automatizadores",
      subtype: "Freios",
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 5. ILUMINAÇÃO DE EMERGÊNCIA
  // ============================================================
  if (has(name, "LUMINARIA AUTONOMA", "LUMINÁRIA AUTÔNOMA")) {
    return setClassification(base, {
      family: "energia",
      type: "Iluminação de Emergência",
      subtype: "Luminárias de Emergência",
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 6. MÓDULOS / RECEPTORES RF sem contexto suficiente:
  //    mantemos em REVISAR via classificação neutra.
  // ============================================================
  if (has(name, "MÓDULO RECEPTOR RF", "MODULO RECEPTOR RF")) {
    return setClassification(base, {
      family: null,
      type: null,
      subtype: null,
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 7. CONTROLE DE ACESSO / PORTEIROS
  // ============================================================
  if (has(name, "TOTEM PREMIUM")) {
    return setClassification(base, {
      family: "controle-acesso",
      type: "Acessórios de Controle de Acesso",
      subtype: "Totens",
      line: null,
    } as Partial<Classification>);
  }

  if (has(name, "XR 2201", "INTERRUPTOR AUTOMATICO XR 2201")) {
    return setClassification(base, {
      family: "controle-acesso",
      type: "Acessórios de Controle de Acesso",
      subtype: "Relés e Acionadores",
      line: "XR 2201",
    } as Partial<Classification>);
  }

  if (has(name, "MOLA HIDRAULICA", "MOLA HIDRÁULICA")) {
    return setClassification(base, {
      family: "controle-acesso",
      type: "Acessórios de Controle de Acesso",
      subtype: "Molas Hidráulicas",
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 8. FERRAMENTAS
  // ============================================================
  if (has(name, "DETECTOR DE TENSÃO", "DETECTOR DE TENSAO")) {
    return setClassification(base, {
      family: "ferramentas",
      type: "Ferramentas e Acessórios",
      subtype: "Detectores de Tensão",
      line: null,
    } as Partial<Classification>);
  }

  if (has(name, "DETECTOR DE MATERIAIS", "D-TECT 200 C", "D-TECT 200C")) {
    return setClassification(base, {
      family: "ferramentas",
      type: "Ferramentas e Acessórios",
      subtype: "Detectores de Materiais",
      line: "D-TECT",
    } as Partial<Classification>);
  }

  if (has(name, "CH PHILLIPS", "CHAVE PHILLIPS")) {
    return setClassification(base, {
      family: "ferramentas",
      type: "Ferramentas e Acessórios",
      subtype: "Chaves de Fenda e Phillips",
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 9. CONECTORES / DISTRIBUIÇÃO DE SINAL
  // ============================================================
  if (has(name, "EMENDA F FEMEA", "EMENDA F FÊMEA")) {
    return setClassification(base, {
      family: "cabeamento",
      type: "Conectores",
      subtype: "Conectores F",
      line: null,
    } as Partial<Classification>);
  }

  if (has(name, "TOMADA TAP 1/4", "TOMADA TAP 1:4")) {
    return setClassification(base, {
      family: "antenas",
      type: "Distribuição de Sinal",
      subtype: "Taps e Divisores",
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 10. CENTRAIS TELEFÔNICAS
  // ============================================================
  if (has(name, "CENTRAL DIGITAL IMPACTA")) {
    return setClassification(base, {
      family: "telefonia",
      type: "Centrais Telefônicas",
      subtype: "Centrais PABX",
      line: "IMPACTA",
    } as Partial<Classification>);
  }

  if (has(name, "CENTRAL PABX MODULARE MAIS")) {
    return setClassification(base, {
      family: "telefonia",
      type: "Centrais Telefônicas",
      subtype: "Centrais PABX",
      line: "MODULARE",
    } as Partial<Classification>);
  }

  // ============================================================
  // 11. CLASSIFICAÇÕES DEIXADAS COMO CORRIGIR, mas que são
  //     produtos identificáveis pelo próprio nome.
  // ============================================================
  if (has(name, "DSSPROSY-C650", "CCTV CAMERAS")) {
    return setClassification(base, {
      family: "cftv",
      type: "Câmeras",
      subtype: "Câmeras de Segurança",
      line: "DSS",
    } as Partial<Classification>);
  }

  if (has(name, "ARAME DE ACO INOX", "ARAME DE AÇO INOX")) {
    return setClassification(base, {
      family: "alarmes",
      type: "Cerca Elétrica",
      subtype: "Fios e Arames",
      line: null,
    } as Partial<Classification>);
  }

  // ============================================================
  // 12. Receptores MD/TX de automatizadores permanecem como a
  //     classificação da V12; não sobrescrever aqui.
  // ============================================================

  // ============================================================
  // 13. Casos que deliberadamente continuam sem classificação
  //     para NÃO inventarmos uma categoria.
  // ============================================================
  if (
    has(name, "HP 285/435/436", "BOLETIM INFORMATIVO COMPLETO")
  ) {
    return setClassification(base, {
      family: null,
      type: null,
      subtype: null,
      line: null,
    } as Partial<Classification>);
  }

  return base;
}


/**
 * Calcula a confiança da classificação.
 *
 * Estas funções ficam exportadas porque as rotas de
 * /api/admin/analisar-produtos e /api/admin/aplicar-taxonomia
 * também as importam.
 */
export function calculateScore(
  classification: Classification
): number {
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
    classification.attributes &&
    Object.keys(classification.attributes).length > 0
  ) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Define o status da auditoria.
 *
 * A classificação precisa ter pelo menos uma família.
 * Quanto mais completa a classificação, maior a confiança.
 */
export function getStatus(
  classification: Classification,
  score: number
): "APROVADO" | "REVISAR" | "CORRIGIR" {
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

export default classifyProduct;