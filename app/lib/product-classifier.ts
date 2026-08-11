import {
  extractProductAttributes,
} from "./product-attributes";

export type ProductClassification = {
  family: string | null;
  type: string | null;
  subtype: string | null;
  line: string | null;

  attributes: Record<
    string,
    string | number | boolean
  >;

  score: number;
  status:
    | "APROVADO"
    | "REVISAR"
    | "CORRIGIR";
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

function has(
  text: string,
  ...terms: string[]
) {
  return terms.some(
    (term) =>
      text.includes(normalize(term))
  );
}

function lineMatch(
  text: string,
  lines: string[]
) {

  for (const line of lines) {

    if (
      text.includes(
        normalize(line)
      )
    ) {
      return line;
    }
  }

  return null;
}

export function classifyProduct(
  product: {
    name: string;
    sku?: string | null;
    description?: string | null;
    categories?: string[];
  }
): ProductClassification {

  const name =
    normalize(product.name);

  const description =
    normalize(
      product.description || ""
    );

  const categories =
    normalize(
      (product.categories || [])
        .join(" ")
    );

  const text =
    `${name} ${description}`;

  let family: string | null = null;
  let type: string | null = null;
  let subtype: string | null = null;
  let line: string | null = null;

  /*
  |--------------------------------------------------------------------------
  | CFTV — DVR
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

    family = "cftv";
    type = "DVR";
    subtype = "Gravadores DVR";

    line = lineMatch(
      name,
      [
        "MHDX",
        "IMHDX",
      ]
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CFTV — NVR
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "NVR",
      "NVD",
      "INVD"
    )
  ) {

    family = "cftv";
    type = "NVR";
    subtype = "Gravadores NVR";

    line = lineMatch(
      name,
      [
        "NVD",
        "INVD",
      ]
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CFTV — CÂMERAS
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "CAMERA",
      "CÂMERA",
      "CAMERA IP",
      "CAMERA WI-FI",
      "CAMERA WIFI"
    )
  ) {

    family = "cftv";
    type = "Câmeras";

    if (
      has(
        name,
        "WI-FI",
        "WIFI"
      )
    ) {

      subtype =
        "Wi-Fi";
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

    line = lineMatch(
      name,
      [
        "VIPW",
        "VIP",
        "VHDM",
        "VHD",
      ]
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ALARMES — SENSORES
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "SENSOR",
      "IVP",
      "IVA",
      "XAS",
      "REED"
    )
  ) {

    family = "alarmes";
    type = "Sensores";

    if (
      has(
        name,
        "IVP",
        "PRESENCA",
        "PRESENÇA"
      )
    ) {

      subtype =
        "Presença";
    }

    else if (
      has(
        name,
        "REED",
        "MAGNETICO",
        "MAGNÉTICO"
      )
    ) {

      subtype =
        "Magnéticos";
    }

    else if (
      has(
        name,
        "IVA",
        "BARREIRA"
      )
    ) {

      subtype =
        "Barreira";
    }

    else if (
      has(
        name,
        "FUMACA",
        "FUMAÇA"
      )
    ) {

      subtype =
        "Fumaça";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ALARMES — CENTRAIS
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "CENTRAL DE ALARME",
      "CENTRAL ALARME",
      "CENTRAL MONITORADA",
      "AMT",
      "ANM"
    )
  ) {

    family = "alarmes";
    type = "Centrais de Alarme";
    subtype = "Centrais";

    line = lineMatch(
      name,
      [
        "AMT",
        "ANM",
      ]
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ALARMES — SIRENES
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "SIRENE",
      "SIRENA"
    )
  ) {

    family = "alarmes";
    type = "Sirenes";
  }

  /*
  |--------------------------------------------------------------------------
  | ALARMES — RECEPTOR
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "RECEPTOR XAR",
      "XAR "
    )
  ) {

    family = "alarmes";
    type = "Receptores";
    subtype =
      "Receptores de Alarme";

    line = "XAR";
  }

  /*
  |--------------------------------------------------------------------------
  | VÍDEO PORTEIRO
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "VIDEO PORTEIRO",
      "VÍDEO PORTEIRO",
      "TVIP"
    )
  ) {

    family = "porteiros";
    type = "Vídeo Porteiros";

    if (
      has(name, "KIT")
    ) {
      subtype =
        "Kit Vídeo Porteiro";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FECHADURAS
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "FECHADURA",
      "ELETROIMA",
      "ELETROIMÃ",
      "SOLENOIDE"
    )
  ) {

    family = "fechaduras";

    if (
      has(
        name,
        "DIGITAL",
        "BIOMETRIA",
        "RFID"
      )
    ) {

      type =
        "Fechaduras Digitais";

    } else if (
      has(
        name,
        "ELETROIMA",
        "ELETROIMÃ"
      )
    ) {

      type =
        "Eletroímãs";

    } else if (
      has(
        name,
        "SOLENOIDE"
      )
    ) {

      type =
        "Solenoides";

    } else {

      type =
        "Fechaduras Elétricas";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ENERGIA — NOBREAK
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "NOBREAK",
      "UPS"
    )
  ) {

    family = "energia";
    type = "Nobreaks";
    subtype = "Nobreak";

    line = lineMatch(
      name,
      [
        "XNB",
        "GNB",
      ]
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ENERGIA — FONTE
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "FONTE",
      "FONTE DE ALIMENTACAO",
      "FONTE DE ALIMENTAÇÃO"
    )
  ) {

    family = "energia";
    type = "Fontes";
    subtype =
      "Fontes de Alimentação";
  }

  /*
  |--------------------------------------------------------------------------
  | ENERGIA — BATERIA
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "BATERIA",
      "PILHA",
      "CR2032",
      "CR2016"
    )
  ) {

    family = "energia";
    type = "Baterias";
  }

  /*
  |--------------------------------------------------------------------------
  | REDES — SWITCH
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "SWITCH"
    )
  ) {

    family = "redes";
    type = "Switches";

    if (
      has(
        name,
        "GERENCIAVEL",
        "GERENCIÁVEL"
      )
    ) {

      subtype =
        "Gerenciáveis";

    } else if (
      has(
        name,
        "NAO GERENCIAVEL",
        "NÃO GERENCIÁVEL"
      )
    ) {

      subtype =
        "Não Gerenciáveis";
    }

    if (
      has(name, "POE")
    ) {
      subtype = "PoE";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REDES — ROTEADOR
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "ROTEADOR",
      "ROUTER"
    )
  ) {

    family = "redes";
    type = "Roteadores";
  }

  /*
  |--------------------------------------------------------------------------
  | REDES — ACCESS POINT
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "ACCESS POINT",
      "ACCESSPOINT"
    )
  ) {

    family = "redes";
    type = "Access Points";
  }

  /*
  |--------------------------------------------------------------------------
  | CABEAMENTO — CONECTOR
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "CONECTOR",
      "RJ45",
      "RJ11",
      "MC4"
    )
  ) {

    family = "cabeamento";
    type = "Conectores";

    if (
      has(name, "RJ45")
    ) {

      subtype = "RJ45";

    } else if (
      has(name, "RJ11")
    ) {

      subtype = "RJ11";

    } else if (
      has(name, "MC4")
    ) {

      subtype = "MC4";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CABEAMENTO — CABOS
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "CAT5",
      "CAT5E",
      "CAT 5",
      "CAT6",
      "CAT 6"
    )
  ) {

    family = "cabeamento";
    type = "Cabos";

    if (
      has(
        name,
        "CAT6",
        "CAT 6"
      )
    ) {

      subtype = "CAT6";

    } else {

      subtype = "CAT5";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TELEFONIA
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "CENTRAL TELEFONICA",
      "CENTRAL TELEFÔNICA",
      "PABX",
      "IMPACTA",
      "COMUNIC",
      "CP4030",
      "CP112"
    )
  ) {

    family = "telefonia";
    type =
      "Centrais Telefônicas";

    line = lineMatch(
      name,
      [
        "IMPACTA",
        "COMUNIC",
        "CP4030",
        "CP112",
      ]
    );
  }

  else if (
    has(
      name,
      "TELEFONE",
      "TELEFONE IP",
      "TS 311",
      "TC 50",
      "TC 60",
      "TIP "
    )
  ) {

    family = "telefonia";
    type = "Telefones";

    if (
      has(
        name,
        "IP",
        "TIP "
      )
    ) {

      subtype =
        "IP";

    } else if (
      has(
        name,
        "SEM FIO"
      )
    ) {

      subtype =
        "Sem Fio";

    } else {

      subtype =
        "Com Fio";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIZADORES
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "AUTOMATIZADOR",
      "MOTOR PARA PORTAO",
      "MOTOR PARA PORTÃO"
    )
  ) {

    family =
      "automatizadores";

    type =
      "Automatizadores";

    if (
      has(
        name,
        "DESLIZANTE"
      )
    ) {

      subtype =
        "Deslizantes";

    } else if (
      has(
        name,
        "PIVOTANTE"
      )
    ) {

      subtype =
        "Pivotantes";

    } else if (
      has(
        name,
        "BASCULANTE"
      )
    ) {

      subtype =
        "Basculantes";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ANTENAS
  |--------------------------------------------------------------------------
  */

  else if (
    has(
      name,
      "ANTENA",
      "ANTENAS"
    )
  ) {

    family = "antenas";
    type = "Antenas";
  }

  /*
  |--------------------------------------------------------------------------
  | ATRIBUTOS
  |--------------------------------------------------------------------------
  */

  const attributes =
    extractProductAttributes(
      product.name,
      product.description
    );

  /*
  |--------------------------------------------------------------------------
  | SCORE
  |--------------------------------------------------------------------------
  */

  let score = 0;

  if (family) score += 40;
  if (type) score += 25;
  if (subtype) score += 20;
  if (line) score += 10;

  if (
    Object.keys(attributes)
      .length > 0
  ) {
    score += 5;
  }

  score =
    Math.min(score, 100);

  let status:
    | "APROVADO"
    | "REVISAR"
    | "CORRIGIR";

  if (!family) {

    status = "CORRIGIR";

  } else if (score >= 80) {

    status = "APROVADO";

  } else if (score >= 50) {

    status = "REVISAR";

  } else {

    status = "CORRIGIR";
  }

  return {
    family,
    type,
    subtype,
    line,
    attributes,
    score,
    status,
  };
}