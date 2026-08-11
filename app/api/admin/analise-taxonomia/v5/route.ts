import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

type Classification = {
  type: string | null;
  subtype: string | null;
  line: string | null;

  attributes: Record<string, string | number | boolean>;

  confidence: "alta" | "media" | "baixa";

  reason: string;
};

/*
|--------------------------------------------------------------------------
| NORMALIZAÇÃO
|--------------------------------------------------------------------------
*/

function normalize(value: string = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function has(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalize(term)));
}

function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
|--------------------------------------------------------------------------
| RESULTADO VAZIO
|--------------------------------------------------------------------------
*/

function emptyClassification(): Classification {
  return {
    type: null,
    subtype: null,
    line: null,
    attributes: {},
    confidence: "baixa",
    reason: "Nenhuma regra suficiente encontrada.",
  };
}

/*
|--------------------------------------------------------------------------
| EXTRAÇÃO DE ATRIBUTOS
|--------------------------------------------------------------------------
*/

function extractAttributes(name: string) {

  const attributes: Record<
    string,
    string | number | boolean
  > = {};

  /*
  |--------------------------------------------------------------------------
  | TENSÃO
  |--------------------------------------------------------------------------
  */

  const voltageMatches = name.match(
    /\b(110V|127V|220V|230V|12V|24V|36V|48V|5V|9V)\b/gi
  );

  if (voltageMatches?.length) {
    attributes.tensao =
      voltageMatches[0].toUpperCase();
  }

  /*
  |--------------------------------------------------------------------------
  | POE
  |--------------------------------------------------------------------------
  */

  if (/\bpoe\b/i.test(name)) {
    attributes.poe = true;
  }

  /*
  |--------------------------------------------------------------------------
  | CANAIS
  |--------------------------------------------------------------------------
  */

  const channelPatterns = [

    /\b(4|8|16|32|64|128)\s*(?:canais?|ch)\b/i,

    /\b(?:mhdx|imhdx|nvd|invd)[\s-]*(\d)(\d{2})\b/i,

  ];

  for (const pattern of channelPatterns) {

    const match = name.match(pattern);

    if (!match) continue;

    let canais: number | null = null;

    if (match[2]) {

      canais =
        Number(match[1] + match[2]);

    } else {

      canais =
        Number(match[1]);

    }

    if (
      [4, 8, 16, 32, 64, 128]
        .includes(canais)
    ) {

      attributes.canais = canais;

      break;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | POTÊNCIA VA
  |--------------------------------------------------------------------------
  */

  const va = name.match(
    /\b(\d+(?:[.,]\d+)?)\s*(?:VA|KVA)\b/i
  );

  if (va) {

    let value =
      Number(
        va[1].replace(",", ".")
      );

    if (
      /kva/i.test(va[0])
    ) {
      value *= 1000;
    }

    attributes.potenciaVA = value;
  }

  /*
  |--------------------------------------------------------------------------
  | PORTAS
  |--------------------------------------------------------------------------
  */

  const portas = name.match(
    /\b(\d+)\s*(?:portas?|p)\b/i
  );

  if (portas) {

    const value =
      Number(portas[1]);

    if (
      value >= 2 &&
      value <= 128
    ) {
      attributes.portas = value;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CAPACIDADE
  |--------------------------------------------------------------------------
  */

  const capacity = name.match(
    /\b(\d+(?:[.,]\d+)?)\s*(TB|GB|MB)\b/i
  );

  if (capacity) {

    attributes.capacidade =
      `${capacity[1]} ${capacity[2].toUpperCase()}`;
  }

  return attributes;
}

/*
|--------------------------------------------------------------------------
| CLASSIFICAÇÃO V5
|--------------------------------------------------------------------------
|
| REGRA PRINCIPAL:
|
| produto específico
| ↓
| família
| ↓
| subtipo
| ↓
| linha
| ↓
| atributos
|
| Nenhuma regra posterior pode sobrescrever
| uma classificação já definida.
|--------------------------------------------------------------------------
*/

function classifyProduct(
  product: any
): Classification {

  const name =
    normalize(product.name);

  const categories =
    (product.productcategory || [])
      .map((item: any) =>
        normalize(
          item.category?.name ||
          item.category?.slug ||
          ""
        )
      );

  const categoryText =
    categories.join(" ");

  const result =
    emptyClassification();

  /*
  |--------------------------------------------------------------------------
  | 1. CÂMERAS
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "camera",
      "câmera",
      "cam.",
    ]) ||
    /\bvhd\b/i.test(name) ||
    /\bvip\b/i.test(name)
  ) {

    result.type = "Câmeras";
    result.confidence = "alta";
    result.reason =
      "Produto identificado como câmera.";

    /*
    | Wi-Fi
    */

    if (
      has(name, [
        "wi-fi",
        "wifi",
        "wireless"
      ])
    ) {

      result.subtype =
        "Câmeras Wi-Fi";

      result.reason =
        "Câmera com conectividade Wi-Fi.";

    }

    /*
    | Multi-HD
    */

    else if (
      has(name, [
        "vhd",
        "multi-hd",
        "multi hd",
        "hdcvi",
        "full color"
      ])
    ) {

      result.subtype =
        "Multi-HD";

      result.reason =
        "Câmera identificada como Multi-HD.";
    }

    /*
    | Bullet
    */

    else if (
      /\bbullet\b/i.test(name)
    ) {

      result.subtype =
        "Bullet";
    }

    /*
    | Dome
    */

    else if (
      /\bdome\b/i.test(name)
    ) {

      result.subtype =
        "Dome";
    }

    /*
    | IP
    */

    else if (
      has(name, [
        "camera ip",
        "câmera ip",
        "vip",
        "ip de video",
        "ip de vídeo"
      ])
    ) {

      result.subtype =
        "IP";
    }

    /*
    | Linha
    */

    const cameraLines = [
      "vip",
      "vhd",
      "im",
      "imx",
      "ivp"
    ];

    for (
      const line
      of cameraLines
    ) {

      if (
        new RegExp(
          `\\b${line}\\b`,
          "i"
        ).test(name)
      ) {

        result.line =
          line.toUpperCase();

        break;
      }
    }

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 2. DVR
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "dvr",
      "gravador mhdx",
      "gravador imhdx",
      "mhdx",
      "imhdx"
    ])
  ) {

    result.type = "DVR";
    result.subtype =
      "Gravadores DVR";

    result.confidence = "alta";

    result.reason =
      "Produto identificado como DVR.";

    if (
      /\bimhdx\b/i.test(name)
    ) {

      result.line = "IMHDX";

    } else if (
      /\bmhdx\b/i.test(name)
    ) {

      result.line = "MHDX";
    }

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 3. NVR
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "nvr",
      "gravador nvd",
      "gravador invd",
      "nvd",
      "invd"
    ])
  ) {

    result.type = "NVR";

    result.subtype =
      "Gravadores NVR";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como NVR.";

    if (
      /\binvd\b/i.test(name)
    ) {

      result.line = "INVD";

    } else if (
      /\bnvd\b/i.test(name)
    ) {

      result.line = "NVD";
    }

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 4. NOBREAK
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "nobreak",
      "nobreaks",
      "no break"
    ])
  ) {

    result.type =
      "Nobreaks";

    result.subtype =
      "Nobreak";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como nobreak.";

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 5. FECHADURAS
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "fechadura",
      "fechadura digital",
      "fechadura smart",
      "fechadura eletrica",
      "fechadura elétrica",
      "eletroima",
      "eletroímã"
    ])
  ) {

    result.type =
      "Fechaduras";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como fechadura.";

    if (
      has(name, [
        "digital",
        "smart",
        "inteligente",
        "ifp",
        "ifr"
      ])
    ) {

      result.subtype =
        "Fechaduras Digitais";

    }

    else if (
      has(name, [
        "solenoide",
        "solenoide",
        "eletroima",
        "eletroímã"
      ])
    ) {

      result.subtype =
        "Fechaduras Elétricas";
    }

    else {

      result.subtype =
        "Fechaduras";
    }

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 6. SENSORES
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "sensor",
      "ivp",
      "iva",
      "reed"
    ])
  ) {

    result.type =
      "Sensores";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como sensor.";

    if (
      has(name, [
        "iva",
        "barreira"
      ])
    ) {

      result.subtype =
        "Sensores de Barreira";

    }

    else if (
      has(name, [
        "reed",
        "magnetico",
        "magnético"
      ])
    ) {

      result.subtype =
        "Sensores Magnéticos";

    }

    else if (
      has(name, [
        "ivp",
        "infravermelho",
        "presenca",
        "presença"
      ])
    ) {

      result.subtype =
        "Sensores de Presença";

    }

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 7. ALARMES / CENTRAIS
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "central de alarme",
      "central alarme",
      "amt ",
      "central de incendio",
      "central de incêndio"
    ])
  ) {

    result.type =
      "Centrais de Alarme";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como central de alarme.";

    if (
      has(name, [
        "incendio",
        "incêndio",
        "cie",
        "enderecavel",
        "endereçável"
      ])
    ) {

      result.subtype =
        "Centrais de Incêndio";

    } else {

      result.subtype =
        "Centrais de Alarme";
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 8. DETECTORES
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "detector"
    ])
  ) {

    result.type =
      "Detectores";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como detector.";

    if (
      has(name, [
        "fumaca",
        "fumaça"
      ])
    ) {

      result.subtype =
        "Detectores de Fumaça";
    }

    else if (
      has(name, [
        "tensao",
        "tensão"
      ])
    ) {

      result.subtype =
        "Detectores de Tensão";
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 9. SIRENES
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "sirene",
      "siren"
    ])
  ) {

    result.type =
      "Sirenes";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como sirene.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 10. CERCA ELÉTRICA
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "cerca eletrica",
      "cerca elétrica",
      "eletrificador"
    ])
  ) {

    result.type =
      "Cerca Elétrica";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como equipamento de cerca elétrica.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 11. VÍDEO PORTEIRO
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "video porteiro",
      "vídeo porteiro",
      "videoporteiro",
      "vídeoporteiro",
      "iv 7000",
      "ivw "
    ])
  ) {

    result.type =
      "Vídeo Porteiros";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como vídeo porteiro.";

    if (
      has(name, [
        "kit"
      ])
    ) {

      result.subtype =
        "Kit Vídeo Porteiro";

    }

    else if (
      has(name, [
        "modulo externo",
        "módulo externo"
      ])
    ) {

      result.subtype =
        "Módulo Externo";

    }

    else if (
      has(name, [
        "modulo interno",
        "módulo interno",
        "terminal interno"
      ])
    ) {

      result.subtype =
        "Módulo Interno";
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 12. PORTEIROS
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "porteiro residencial",
      "porteiro eletronico",
      "porteiro eletrônico"
    ])
  ) {

    result.type =
      "Porteiros";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como porteiro eletrônico.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 13. CONTROLADORES
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "controlador de acesso",
      "controle de acesso",
      "controladora de acesso"
    ])
  ) {

    result.type =
      "Controladores";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como controlador de acesso.";

    if (
      has(name, [
        "facial",
        "biometr"
      ])
    ) {

      result.subtype =
        "Controladores Biométricos";
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 14. LEITORES / RFID
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "leitor",
      "rfid",
      "chaveiro rfid",
      "cartao de proximidade",
      "cartão de proximidade",
      "pulseira"
    ])
  ) {

    result.type =
      "Leitores";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como leitor ou dispositivo RFID.";

    if (
      has(name, [
        "rfid",
        "mifare",
        "proximidade"
      ])
    ) {

      result.subtype =
        "RFID";
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 15. BOTOEIRAS
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "botoeira",
      "botao de saida",
      "botão de saída"
    ])
  ) {

    result.type =
      "Acessórios de Controle de Acesso";

    result.subtype =
      "Botoeiras";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como botoeira.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 16. SWITCH
  |--------------------------------------------------------------------------
  */

  if (
    /\bswitch\b/i.test(name)
  ) {

    result.type =
      "Switches";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como switch.";

    if (
      has(name, [
        "gerenciavel",
        "gerenciável"
      ])
    ) {

      result.subtype =
        "Switch Gerenciável";

    }

    else if (
      has(name, [
        "nao gerenciavel",
        "não gerenciável"
      ])
    ) {

      result.subtype =
        "Switch Não Gerenciável";
    }

    if (
      /\bpoe\b/i.test(name)
    ) {

      result.attributes.poe =
        true;
    }

    result.attributes = {
      ...result.attributes,
      ...extractAttributes(product.name)
    };

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 17. ROTEADORES
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "roteador",
      "router"
    ])
  ) {

    result.type =
      "Roteadores";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como roteador.";

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 18. ACCESS POINT
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "access point",
      "accesspoint",
      "ap corporativo",
      "ap outdoor"
    ])
  ) {

    result.type =
      "Access Points";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como Access Point.";

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 19. NOBREAK / FONTES / BATERIAS
  |--------------------------------------------------------------------------
  | Nobreak já foi tratado acima.
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "fonte",
      "fonte de alimentação",
      "fonte alimentacao"
    ])
  ) {

    result.type =
      "Fontes";

    result.subtype =
      "Fontes de Alimentação";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como fonte.";

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  if (
    /\bbateria\b/i.test(name) ||
    /\bbaterias\b/i.test(name)
  ) {

    result.type =
      "Baterias";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como bateria.";

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  if (
    has(name, [
      "modulo de bateria",
      "módulo de bateria",
      "modulo de baterias",
      "módulo de baterias"
    ])
  ) {

    result.type =
      "Módulos de Bateria";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como módulo de bateria.";

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 20. CABOS
  |--------------------------------------------------------------------------
  */

  if (
    /\bcabo\b/i.test(name) ||
    /\bcabos\b/i.test(name)
  ) {

    result.type =
      "Cabos";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como cabo.";

    if (
      has(name, [
        "cat5",
        "cat5e"
      ])
    ) {

      result.subtype =
        "Cabos de Rede CAT5";

    }

    else if (
      has(name, [
        "cat6"
      ])
    ) {

      result.subtype =
        "Cabos de Rede CAT6";

    }

    else if (
      has(name, [
        "hdmi"
      ])
    ) {

      result.subtype =
        "Cabos HDMI";

    }

    else if (
      has(name, [
        "rca"
      ])
    ) {

      result.subtype =
        "Cabos RCA";

    }

    else if (
      has(name, [
        "coaxial",
        "rg59",
        "rg6"
      ])
    ) {

      result.subtype =
        "Cabos Coaxiais";

    }

    else if (
      has(name, [
        "optico",
        "óptico",
        "fibra"
      ])
    ) {

      result.subtype =
        "Cabos de Fibra Óptica";
    }

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 21. CONECTORES
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "conector",
      "conexao",
      "conexão"
    ])
  ) {

    result.type =
      "Conectores";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como conector.";

    if (
      has(name, [
        "rj45"
      ])
    ) {

      result.subtype =
        "RJ45";

    }

    else if (
      has(name, [
        "rj11"
      ])
    ) {

      result.subtype =
        "RJ11";

    }

    else if (
      has(name, [
        "bnc"
      ])
    ) {

      result.subtype =
        "BNC";

    }

    else if (
      has(name, [
        "sc/upc",
        "sc/apc",
        "fibra"
      ])
    ) {

      result.subtype =
        "Fibra Óptica";
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 22. RACKS
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "rack",
      "bandeja p/ rack",
      "bandeja para rack",
      "patch panel",
      "regua p/ rack",
      "régua p/ rack"
    ])
  ) {

    result.type =
      "Racks e Acessórios";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como rack ou acessório de rack.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 23. FIBRA ÓPTICA
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "fibra optica",
      "fibra óptica",
      "splitter",
      "ftta",
      "ftth",
      "sfp"
    ])
  ) {

    result.type =
      "Fibra Óptica";

    result.confidence =
      "media";

    result.reason =
      "Produto relacionado à infraestrutura de fibra óptica.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 24. TELEFONES
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "telefone",
      "telefone ip",
      "telefone sem fio",
      "telefone com fio"
    ])
  ) {

    result.type =
      "Telefones";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como telefone.";

    if (
      has(name, [
        "telefone ip",
        "tip ",
        "tdmi",
        "poe"
      ])
    ) {

      result.subtype =
        "Telefones IP";

    }

    else if (
      has(name, [
        "sem fio"
      ])
    ) {

      result.subtype =
        "Telefones Sem Fio";

    }

    else {

      result.subtype =
        "Telefones Com Fio";
    }

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 25. CENTRAIS TELEFÔNICAS
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "impacta",
      "modulare",
      "modulare mais",
      "conecta",
      "central de portaria",
      "comunic "
    ]) &&
    !has(name, [
      "central de alarme"
    ])
  ) {

    result.type =
      "Centrais Telefônicas";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como central/infraestrutura telefônica.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 26. AUTOMATIZADORES
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "automatizador",
      "motor de portao",
      "motor de portão"
    ])
  ) {

    result.type =
      "Automatizadores";

    result.subtype =
      "Automatizadores de Portão";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como automatizador.";

    result.attributes =
      extractAttributes(product.name);

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 27. CONTROLES REMOTOS
  |--------------------------------------------------------------------------
  */

  if (
    has(name, [
      "controle remoto",
      "tx intelbras",
      "tx 434",
      "xtr ",
      "xac "
    ])
  ) {

    result.type =
      "Controles Remotos";

    result.subtype =
      "Controles Remotos";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como controle/transmissor remoto.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 28. MONITORES
  |--------------------------------------------------------------------------
  */

  if (
    /\bmonitor\b/i.test(name)
  ) {

    result.type =
      "Monitores";

    result.confidence =
      "alta";

    result.reason =
      "Produto identificado como monitor.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | 29. CATEGORIA COMO CONTEXTO
  |--------------------------------------------------------------------------
  |
  | Só usamos a categoria atual se houver uma indicação
  | razoável. Nunca usamos "Diversos" para inventar
  | classificação.
  |--------------------------------------------------------------------------
  */

  if (
    categoryText.includes("telefon")
  ) {

    result.type =
      "Telefonia";

    result.confidence =
      "baixa";

    result.reason =
      "Categoria atual indica telefonia, mas o nome não permitiu classificação específica.";

    return result;
  }

  if (
    categoryText.includes("rede")
  ) {

    result.type =
      "Redes";

    result.confidence =
      "baixa";

    result.reason =
      "Categoria atual indica redes, mas o nome não permitiu classificação específica.";

    return result;
  }

  if (
    categoryText.includes("alarme")
  ) {

    result.type =
      "Alarmes";

    result.confidence =
      "baixa";

    result.reason =
      "Categoria atual indica alarmes, mas o nome não permitiu classificação específica.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | NÃO CLASSIFICADO
  |--------------------------------------------------------------------------
  */

  result.reason =
    "Produto precisa de revisão manual.";

  return result;
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(
  req: Request
) {

  try {

    const { searchParams } =
      new URL(req.url);

    const apply =
      searchParams.get("apply") === "true";

    const limit = Math.min(
      Number(
        searchParams.get("limit") || "500"
      ),
      1000
    );

    const products =
      await prisma.product.findMany({

        where: {
          active: true,
        },

        select: {

          id: true,

          name: true,

          sku: true,

          brand: true,

          productcategory: {

            select: {

              categoryId: true,

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

        take: limit,

      });

    const resultado: any[] = [];

    let classificados = 0;

    let revisao = 0;

    let alta = 0;

    let media = 0;

    let baixa = 0;

    /*
    |--------------------------------------------------------------------------
    | PROCESSAMENTO
    |--------------------------------------------------------------------------
    */

    for (
      const product
      of products
    ) {

      const classification =
        classifyProduct(product);

      if (
        classification.type
      ) {

        classificados++;

      } else {

        revisao++;
      }

      if (
        classification.confidence ===
        "alta"
      ) {

        alta++;

      }

      else if (
        classification.confidence ===
        "media"
      ) {

        media++;

      }

      else {

        baixa++;
      }

      /*
      |--------------------------------------------------------------------------
      | GRAVAÇÃO
      |--------------------------------------------------------------------------
      */

      if (
        apply &&
        classification.type
      ) {

        const values: {
          attribute: string;
          value: string;
        }[] = [];

        /*
        | Tipo
        */

        values.push({

          attribute: "tipo",

          value:
            classification.type,

        });

        /*
        | Subtipo
        */

        if (
          classification.subtype
        ) {

          values.push({

            attribute: "subtipo",

            value:
              classification.subtype,

          });

        }

        /*
        | Linha
        */

        if (
          classification.line
        ) {

          values.push({

            attribute: "linha",

            value:
              classification.line,

          });

        }

        /*
        | Atributos técnicos
        */

        for (
          const [
            key,
            value
          ]
          of Object.entries(
            classification.attributes
          )
        ) {

          values.push({

            attribute: key,

            value: String(value),

          });

        }

        /*
        |--------------------------------------------------------------------------
        | CRIA ATRIBUTOS
        |--------------------------------------------------------------------------
        */

        for (
          const item
          of values
        ) {

          const attribute =
            await prisma.attribute.upsert({

              where: {
                slug:
                  slugify(
                    item.attribute
                  ),
              },

              update: {
                name:
                  item.attribute,
              },

              create: {

                name:
                  item.attribute,

                slug:
                  slugify(
                    item.attribute
                  ),

                description:
                  "Atributo utilizado para classificação e filtragem de produtos.",

              },

            });

          const attributeValue =
            await prisma.attributeValue.upsert({

              where: {

                attributeId_slug: {

                  attributeId:
                    attribute.id,

                  slug:
                    slugify(
                      item.value
                    ),

                },

              },

              update: {

                value:
                  item.value,

              },

              create: {

                attributeId:
                  attribute.id,

                value:
                  item.value,

                slug:
                  slugify(
                    item.value
                  ),

              },

            });

          /*
          |--------------------------------------------------------------------------
          | CATEGORIA ↔ ATRIBUTO
          |--------------------------------------------------------------------------
          */

          for (
            const category
            of product.productcategory
          ) {

            await prisma.categoryAttribute.upsert({

              where: {

                categoryId_attributeId: {

                  categoryId:
                    category.categoryId,

                  attributeId:
                    attribute.id,

                },

              },

              update: {},

              create: {

                categoryId:
                  category.categoryId,

                attributeId:
                  attribute.id,

              },

            });

          }

          /*
          |--------------------------------------------------------------------------
          | PRODUTO ↔ VALOR
          |--------------------------------------------------------------------------
          */

          await prisma.productAttribute.upsert({

            where: {

              productId_attributeValueId: {

                productId:
                  product.id,

                attributeValueId:
                  attributeValue.id,

              },

            },

            update: {},

            create: {

              productId:
                product.id,

              attributeValueId:
                attributeValue.id,

            },

          });

        }

      }

      resultado.push({

        id:
          product.id,

        name:
          product.name,

        sku:
          product.sku,

        categories:
          product.productcategory
            .map(
              (item: any) =>
                item.category?.name
            ),

        classification,

      });

    }

    /*
    |--------------------------------------------------------------------------
    | RESPOSTA
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({

      sucesso: true,

      versao:
        "5.0",

      modo:
        apply
          ? "GRAVADO_NO_BANCO"
          : "SIMULACAO",

      totalProdutos:
        products.length,

      classificados,

      revisao,

      percentualClassificado:
        products.length
          ? Number(
              (
                classificados /
                products.length *
                100
              ).toFixed(2)
            )
          : 0,

      confianca: {

        alta,

        media,

        baixa,

      },

      produtos:
        resultado,

    });

  } catch (error) {

    console.error(
      "Erro na V5:",
      error
    );

    return NextResponse.json(

      {

        sucesso: false,

        versao:
          "5.0",

        erro:
          "Erro ao executar análise V5",

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