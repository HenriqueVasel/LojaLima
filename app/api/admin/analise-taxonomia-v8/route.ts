import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/*
=========================================================
V8 — AUDITORIA DA TAXONOMIA

A V7 CLASSIFICA
A V8 AUDITA

A V8 NÃO GRAVA NADA NO BANCO.

Ela procura:
- contradições
- classificações impossíveis
- conflitos entre nome e classificação
- família errada
- tipo errado
- subtipo errado
- linha errada
- atributos incompatíveis

=========================================================
*/

type Status =
  | "APROVADO"
  | "CORRIGIR"
  | "REVISAR";

type AuditResult = {
  status: Status;

  score: number;

  problemas: string[];

  sugestao: {
    family: string | null;
    type: string | null;
    subtype: string | null;
    line: string | null;
    attributes: Record<string, any>;
  };
};

function clean(value: any) {

  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

}

function has(text: string, terms: string[]) {

  return terms.some((term) =>
    text.includes(clean(term))
  );

}


/*
=========================================================
AUDITORIA
=========================================================
*/

function auditProduct(product: any): AuditResult {

  const name = clean(product.name);

  const categories = (product.productcategory || [])
    .map((pc: any) =>
      clean(pc.category?.name)
    )
    .filter(Boolean);

  const categoryText =
    categories.join(" ");

  const c = product.classification;

  let score = 100;

  const problemas: string[] = [];

  let suggestion = {
    family: c.family ?? null,
    type: c.type ?? null,
    subtype: c.subtype ?? null,
    line: c.line ?? null,
    attributes: c.attributes ?? {},
  };


  /*
  ========================================================
  1. CABOS
  ========================================================
  */

  if (
    has(name, [
      "CABO",
      "PATCH CORD",
      "PATCH PANEL"
    ])
  ) {

    if (
      has(name, [
        "CAT5",
        "CAT5E"
      ])
    ) {

      if (
        c.family !== "cabeamento" ||
        c.type !== "Cabos"
      ) {

        problemas.push(
          "Produto CAT5/CAT5E não está em Cabeamento > Cabos."
        );

        score -= 50;

        suggestion = {
          family: "cabeamento",
          type: "Cabos",
          subtype: "Cabos de Rede CAT5",
          line: null,
          attributes: {},
        };

      }

    }


    if (
      has(name, [
        "CAT6",
        "CAT6A"
      ])
    ) {

      if (
        c.family !== "cabeamento" ||
        c.type !== "Cabos"
      ) {

        problemas.push(
          "Produto CAT6/CAT6A não está em Cabeamento > Cabos."
        );

        score -= 50;

        suggestion = {
          family: "cabeamento",
          type: "Cabos",
          subtype: "Cabos de Rede CAT6",
          line: null,
          attributes: {},
        };

      }

    }

  }


  /*
  ========================================================
  2. ACCESS POINT
  ========================================================
  */

  if (
    has(name, [
      "ACCESS POINT",
      "UNIFI",
      "U7-PRO",
      "U7-LR"
    ])
  ) {

    if (
      c.family !== "redes" ||
      c.type !== "Access Points"
    ) {

      problemas.push(
        "Produto identificado como Access Point, mas classificação está diferente."
      );

      score -= 50;

      suggestion = {
        family: "redes",
        type: "Access Points",
        subtype: null,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  3. NVR
  ========================================================
  */

  if (
    has(name, [
      "NVD",
      "INVD",
      "NVR"
    ])
  ) {

    if (
      c.type !== "NVR"
    ) {

      problemas.push(
        "NVD/INVD/NVR não pode ser classificado como DVR."
      );

      score -= 60;

      suggestion = {
        family: "cftv",
        type: "NVR",
        subtype: "Gravadores NVR",
        line:
          has(name, ["INVD"])
            ? "INVD"
            : "NVD",
        attributes:
          c.attributes || {},
      };

    }

  }


  /*
  ========================================================
  4. DVR
  ========================================================
  */

  if (
    has(name, [
      "MHDX",
      "IMHDX"
    ])
  ) {

    if (
      c.type !== "DVR"
    ) {

      problemas.push(
        "MHDX/IMHDX deve ser classificado como DVR."
      );

      score -= 60;

      suggestion = {
        family: "cftv",
        type: "DVR",
        subtype: "Gravadores DVR",
        line:
          has(name, ["IMHDX"])
            ? "IMHDX"
            : "MHDX",
        attributes:
          c.attributes || {},
      };

    }

  }


  /*
  ========================================================
  5. CÂMERA IP
  ========================================================
  */

  if (
    has(name, [
      "CAMERA IP",
      "CÂMERA IP",
      "VIP ",
      "VIPW"
    ])
  ) {

    if (
      c.family !== "cftv" ||
      c.type !== "Câmeras"
    ) {

      problemas.push(
        "Câmera IP deve pertencer a CFTV > Câmeras."
      );

      score -= 50;

      suggestion = {
        family: "cftv",
        type: "Câmeras",
        subtype: "IP",
        line:
          has(name, ["VIPW"])
            ? "VIPW"
            : "VIP",
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  6. CÂMERA WI-FI
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

    if (
      c.family !== "cftv" ||
      c.subtype !== "Câmeras Wi-Fi"
    ) {

      problemas.push(
        "Câmera Wi-Fi deve ser classificada como CFTV > Câmeras > Câmeras Wi-Fi."
      );

      score -= 40;

      suggestion = {
        family: "cftv",
        type: "Câmeras",
        subtype: "Câmeras Wi-Fi",
        line: null,
        attributes: {
          tecnologia: "Wi-Fi",
        },
      };

    }

  }


  /*
  ========================================================
  7. MULTI-HD
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
    has(name, [
      "CAMERA",
      "CÂMERA"
    ])
  ) {

    if (
      c.family !== "cftv" ||
      c.type !== "Câmeras" ||
      c.subtype !== "Multi-HD"
    ) {

      problemas.push(
        "Câmera Multi-HD possui classificação incompatível."
      );

      score -= 40;

      suggestion = {
        family: "cftv",
        type: "Câmeras",
        subtype: "Multi-HD",
        line:
          has(name, ["VHDM"])
            ? "VHDM"
            : "VHD",
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  8. FECHADURAS
  ========================================================
  */

  if (
    has(name, [
      "FECHADURA",
      "FECHADURA DIGITAL",
      "FECHADURA SMART",
      "FECHADURA ELETRICA",
      "FECHADURA ELÉTRICA",
      "FECHADURA SOLENOIDE",
      "ELETROIMA",
      "ELETROÍMÃ"
    ])
  ) {

    if (
      c.family !== "controle-acesso" ||
      c.type !== "Fechaduras"
    ) {

      problemas.push(
        "Produto de fechadura não pode ser classificado como sensor."
      );

      score -= 60;

      let subtype = "Fechaduras";

      if (
        has(name, [
          "DIGITAL",
          "SMART"
        ])
      ) {
        subtype = "Fechaduras Digitais";
      }

      else if (
        has(name, [
          "ELETRICA",
          "ELÉTRICA",
          "SOLENOIDE",
          "ELETROIMA",
          "ELETROÍMA"
        ])
      ) {
        subtype = "Fechaduras Elétricas";
      }

      suggestion = {
        family: "controle-acesso",
        type: "Fechaduras",
        subtype,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  9. RFID
  ========================================================
  */

  if (
    has(name, [
      "RFID",
      "MIFARE",
      "CHAVEIRO RFID",
      "CARTAO DE PROXIMIDADE",
      "CARTÃO DE PROXIMIDADE",
      "PULSEIRA RFID"
    ])
  ) {

    if (
      c.family !== "controle-acesso" ||
      c.type !== "Credenciais"
    ) {

      problemas.push(
        "RFID deve pertencer a Controle de Acesso > Credenciais."
      );

      score -= 50;

      let subtype = "Credenciais RFID";

      if (has(name, ["CARTAO", "CARTÃO"])) {
        subtype = "Cartões RFID";
      }

      if (has(name, ["CHAVEIRO"])) {
        subtype = "Chaveiros RFID";
      }

      if (has(name, ["PULSEIRA"])) {
        subtype = "Pulseiras RFID";
      }

      suggestion = {
        family: "controle-acesso",
        type: "Credenciais",
        subtype,
        line: null,
        attributes: {
          tecnologia: "RFID",
        },
      };

    }

  }


  /*
  ========================================================
  10. BOTOEIRAS
  ========================================================
  */

  if (
    has(name, [
      "BOTOEIRA",
      "BOTAO DE SAIDA",
      "BOTÃO DE SAÍDA"
    ])
  ) {

    if (
      c.family !== "controle-acesso" ||
      c.subtype !== "Botoeiras"
    ) {

      problemas.push(
        "Botoeira deve ficar em Controle de Acesso > Acessórios."
      );

      score -= 40;

      suggestion = {
        family: "controle-acesso",
        type: "Acessórios de Controle de Acesso",
        subtype: "Botoeiras",
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  11. SENSORES
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

    /*
    IMPORTANTE:
    fechadura com "sensor" não é sensor.
    */

    if (
      has(name, [
        "FECHADURA",
        "ELETROIMA",
        "ELETROÍMA"
      ])
    ) {

      problemas.push(
        "Produto possui palavra SENSOR, mas é uma fechadura."
      );

      score -= 60;

      suggestion = {
        family: "controle-acesso",
        type: "Fechaduras",
        subtype: "Fechaduras Elétricas",
        line: null,
        attributes: {},
      };

    }

    else {

      if (
        c.family !== "sensores" ||
        c.type !== "Sensores"
      ) {

        problemas.push(
          "Sensor não está classificado em Sensores."
        );

        score -= 40;

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

        suggestion = {
          family: "sensores",
          type: "Sensores",
          subtype,
          line: null,
          attributes: {},
        };

      }

    }

  }


  /*
  ========================================================
  12. TELEFONES
  ========================================================
  */

  if (
    has(name, [
      "TELEFONE"
    ])
  ) {

    if (
      c.family !== "telefonia" ||
      c.type !== "Telefones"
    ) {

      problemas.push(
        "Telefone deve ficar em Telefonia > Telefones."
      );

      score -= 40;

      let subtype = null;

      if (has(name, ["SEM FIO"])) {
        subtype = "Telefones Sem Fio";
      }

      else if (has(name, ["COM FIO"])) {
        subtype = "Telefones Com Fio";
      }

      else if (
        has(name, [
          "TELEFONE IP",
          "TIP ",
          "TDMI"
        ])
      ) {
        subtype = "Telefones IP";
      }

      suggestion = {
        family: "telefonia",
        type: "Telefones",
        subtype,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  13. CENTRAIS TELEFÔNICAS
  ========================================================
  */

  if (
    has(name, [
      "IMPACTA",
      "COMUNIC 48",
      "COMUNIC 80",
      "CENTRAL TELEFONICA",
      "CENTRAL TELEFÔNICA"
    ])
  ) {

    if (
      c.family !== "telefonia" ||
      c.type !== "Centrais Telefônicas"
    ) {

      problemas.push(
        "Central telefônica classificada incorretamente."
      );

      score -= 50;

      suggestion = {
        family: "telefonia",
        type: "Centrais Telefônicas",
        subtype: null,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  14. NOBREAK
  ========================================================
  */

  if (
    has(name, [
      "NOBREAK",
      "NO-BREAK",
      "UPS"
    ])
  ) {

    if (
      c.family !== "energia" ||
      c.type !== "Nobreaks"
    ) {

      problemas.push(
        "Nobreak deve ficar em Energia > Nobreaks."
      );

      score -= 50;

      suggestion = {
        family: "energia",
        type: "Nobreaks",
        subtype: "Nobreak",
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  15. BATERIAS
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

    if (
      c.family !== "energia" ||
      c.type !== "Baterias"
    ) {

      problemas.push(
        "Bateria/pilha deve ficar em Energia > Baterias."
      );

      score -= 40;

      suggestion = {
        family: "energia",
        type: "Baterias",
        subtype: "Baterias e Pilhas",
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  16. FONTES
  ========================================================
  */

  if (
    has(name, [
      "FONTE",
      "FONTE DE ALIMENTACAO",
      "FONTE DE ALIMENTAÇÃO"
    ])
  ) {

    if (
      c.family !== "energia" ||
      c.type !== "Fontes"
    ) {

      problemas.push(
        "Fonte deve ficar em Energia > Fontes."
      );

      score -= 40;

      suggestion = {
        family: "energia",
        type: "Fontes",
        subtype: "Fontes de Alimentação",
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  17. SWITCH
  ========================================================
  */

  if (
    has(name, [
      "SWITCH"
    ])
  ) {

    if (
      c.family !== "redes" ||
      c.type !== "Switches"
    ) {

      problemas.push(
        "Switch deve ficar em Redes > Switches."
      );

      score -= 50;

      suggestion = {
        family: "redes",
        type: "Switches",
        subtype: null,
        line: null,
        attributes: {},
      };

    }


    /*
    NÃO GERENCIÁVEL ≠ GERENCIÁVEL
    */

    if (
      has(name, [
        "NAO GERENCIAVEL",
        "NÃO GERENCIÁVEL"
      ])
    ) {

      if (
        c.subtype === "Switch Gerenciável"
      ) {

        problemas.push(
          "Produto é NÃO GERENCIÁVEL, mas foi classificado como GERENCIÁVEL."
        );

        score -= 60;

        suggestion.subtype =
          "Switch Não Gerenciável";

      }

    }

  }


  /*
  ========================================================
  18. ROTEADORES
  ========================================================
  */

  if (
    has(name, [
      "ROTEADOR",
      "ROUTER"
    ])
  ) {

    if (
      c.family !== "redes" ||
      c.type !== "Roteadores"
    ) {

      problemas.push(
        "Roteador deve ficar em Redes > Roteadores."
      );

      score -= 40;

      suggestion = {
        family: "redes",
        type: "Roteadores",
        subtype: null,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  19. ACCESS POINT vs ROTEADOR
  ========================================================
  */

  if (
    has(name, [
      "ACCESS POINT",
      "ACCESS POINT CORPORATIVO",
      "UNIFI"
    ])
  ) {

    if (
      c.type === "Roteadores"
    ) {

      problemas.push(
        "Access Point não deve ser classificado como roteador."
      );

      score -= 50;

      suggestion = {
        family: "redes",
        type: "Access Points",
        subtype: null,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  20. CONECTORES
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

    if (
      c.family !== "conectividade" ||
      c.type !== "Conectores"
    ) {

      problemas.push(
        "Conector deve ficar em Conectividade > Conectores."
      );

      score -= 40;

      let subtype = null;

      if (has(name, ["RJ45"])) subtype = "RJ45";
      else if (has(name, ["RJ11"])) subtype = "RJ11";
      else if (has(name, ["BNC"])) subtype = "BNC";
      else if (has(name, ["MC4"])) subtype = "MC4";
      else if (
        has(name, [
          "SC/UPC",
          "SC/APC"
        ])
      ) {
        subtype = "Fibra Óptica";
      }

      suggestion = {
        family: "conectividade",
        type: "Conectores",
        subtype,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  21. VÍDEO PORTEIRO
  ========================================================
  */

  if (
    has(name, [
      "VIDEO PORTEIRO",
      "VÍDEO PORTEIRO",
      "VIDEO PORTEIRO",
      "TVIP",
      "IV 7000",
      "IV 7010"
    ])
  ) {

    if (
      c.family !== "porteiros"
    ) {

      problemas.push(
        "Vídeo porteiro não deve ser classificado como câmera."
      );

      score -= 60;

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
          "KIT VIDEO",
          "KIT VÍDEO"
        ])
      ) {
        subtype = "Kit Vídeo Porteiro";
      }

      suggestion = {
        family: "porteiros",
        type: "Vídeo Porteiros",
        subtype,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  22. RACK
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

    if (
      c.family !== "redes" ||
      c.type !== "Racks e Acessórios"
    ) {

      problemas.push(
        "Produto de rack deve ficar em Redes > Racks e Acessórios."
      );

      score -= 40;

      suggestion = {
        family: "redes",
        type: "Racks e Acessórios",
        subtype: null,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  23. AUTOMATIZADORES
  ========================================================
  */

  if (
    has(name, [
      "CREMALHEIRA",
      "ENGRENAGEM",
      "COROA",
      "POLIA",
      "MANCAL",
      "FUSO",
      "MOTOR"
    ])
    &&
    has(categoryText, [
      "AUTOMATIZADORES"
    ])
  ) {

    if (
      c.family !== "automatizadores"
    ) {

      problemas.push(
        "Componente de automatizador está fora da família Automatizadores."
      );

      score -= 40;

      suggestion = {
        family: "automatizadores",
        type: "Acessórios de Automatizadores",
        subtype: null,
        line: null,
        attributes: {},
      };

    }

  }


  /*
  ========================================================
  24. REGRAS DE SEGURANÇA
  ========================================================
  */

  /*
  Classificação vazia
  */

  if (
    !c.family ||
    !c.type
  ) {

    score -= 20;

    if (
      problemas.length === 0
    ) {
      problemas.push(
        "Produto ainda não possui classificação suficiente."
      );
    }

  }


  /*
  ========================================================
  STATUS
  ========================================================
  */

  let status: Status;

  if (score >= 90 && problemas.length === 0) {

    status = "APROVADO";

  }

  else if (score >= 60) {

    status = "CORRIGIR";

  }

  else {

    status = "REVISAR";

  }


  return {

    status,

    score: Math.max(
      0,
      Math.min(100, score)
    ),

    problemas,

    sugestao: suggestion,

  };

}


/*
=========================================================
GET
=========================================================
*/

export async function GET(req: Request) {

  try {

    const { searchParams } =
      new URL(req.url);

    const limit = Math.min(
      Number(
        searchParams.get("limit") || 500
      ),
      1000
    );

    const page = Math.max(
      Number(
        searchParams.get("page") || 1
      ),
      1
    );

    const skip =
      (page - 1) * limit;


    /*
    ======================================================
    BUSCA PRODUTOS
    ======================================================
    */

    const products =
      await prisma.product.findMany({

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


    /*
    ======================================================
    CLASSIFICAÇÃO V7

    A V8 replica a estrutura da V7 através
    das mesmas regras principais.

    Por enquanto utilizamos a classificação
    persistida/gerada no próprio produto quando
    disponível.

    ======================================================
    */

    const audited = products.map(
      (product: any) => {

        /*
        --------------------------------------------------
        Recria uma classificação inicial simples
        para a auditoria.
        --------------------------------------------------
        */

        const name = clean(product.name);

const categories = (product.productcategory || [])
  .map((pc: any) =>
    clean(pc.category?.name)
  )
  .filter(Boolean);

const categoryText = categories.join(" ");

let classification: any = {
          family: null,
          type: null,
          subtype: null,
          line: null,
          attributes: {},
        };


        /*
        DVR
        */

        if (
          has(name, [
            "MHDX",
            "IMHDX"
          ])
        ) {

          classification = {
            family: "cftv",
            type: "DVR",
            subtype: "Gravadores DVR",
            line: has(name, ["IMHDX"])
              ? "IMHDX"
              : "MHDX",
            attributes: {},
          };

        }


        /*
        NVR
        */

        else if (
          has(name, [
            "NVD",
            "INVD",
            "NVR"
          ])
        ) {

          classification = {
            family: "cftv",
            type: "NVR",
            subtype: "Gravadores NVR",
            line: has(name, ["INVD"])
              ? "INVD"
              : "NVD",
            attributes: {},
          };

        }


        /*
        Câmera Wi-Fi
        */

        else if (
          has(name, [
            "CAMERA WI-FI",
            "CAMERA WIFI",
            "CÂMERA WI-FI",
            "CÂMERA WIFI"
          ])
        ) {

          classification = {
            family: "cftv",
            type: "Câmeras",
            subtype: "Câmeras Wi-Fi",
            line: null,
            attributes: {
              tecnologia: "Wi-Fi",
            },
          };

        }


        /*
        Câmera IP
        */

        else if (
          has(name, [
            "CAMERA IP",
            "CÂMERA IP",
            "VIP ",
            "VIPW"
          ])
        ) {

          classification = {
            family: "cftv",
            type: "Câmeras",
            subtype: "IP",
            line: has(name, ["VIPW"])
              ? "VIPW"
              : "VIP",
            attributes: {},
          };

        }


        /*
        Multi-HD
        */

        else if (
          has(name, [
            "VHD ",
            "VHDM",
            "MULTI-HD"
          ])
          &&
          has(name, [
            "CAMERA",
            "CÂMERA"
          ])
        ) {

          classification = {
            family: "cftv",
            type: "Câmeras",
            subtype: "Multi-HD",
            line: has(name, ["VHDM"])
              ? "VHDM"
              : "VHD",
            attributes: {},
          };

        }


        /*
        Fechaduras
        */

        else if (
          has(name, [
            "FECHADURA",
            "ELETROIMA",
            "ELETROÍMA"
          ])
        ) {

          classification = {
            family: "controle-acesso",
            type: "Fechaduras",
            subtype:
              has(name, [
                "DIGITAL",
                "SMART"
              ])
                ? "Fechaduras Digitais"
                : "Fechaduras Elétricas",
            line: null,
            attributes: {},
          };

        }


        /*
        RFID
        */

        else if (
          has(name, [
            "RFID",
            "MIFARE"
          ])
        ) {

          classification = {
            family: "controle-acesso",
            type: "Credenciais",
            subtype: "Credenciais RFID",
            line: null,
            attributes: {
              tecnologia: "RFID",
            },
          };

        }


        /*
        Sensores
        */

        else if (
          has(name, [
            "SENSOR",
            "IVP",
            "IVA",
            "REED"
          ])
        ) {

          classification = {
            family: "sensores",
            type: "Sensores",
            subtype:
              has(name, ["IVP"])
                ? "Sensores de Presença"
                : has(name, ["IVA"])
                ? "Sensores de Barreira"
                : has(name, [
                    "REED",
                    "MAGNETICO",
                    "MAGNÉTICO"
                  ])
                ? "Sensores Magnéticos"
                : "Sensores",
            line: null,
            attributes: {},
          };

        }


        /*
        Switch
        */

        else if (
          has(name, ["SWITCH"])
        ) {

          classification = {
            family: "redes",
            type: "Switches",
            subtype:
              has(name, [
                "NAO GERENCIAVEL",
                "NÃO GERENCIÁVEL"
              ])
                ? "Switch Não Gerenciável"
                : has(name, [
                    "GERENCIAVEL",
                    "GERENCIÁVEL"
                  ])
                ? "Switch Gerenciável"
                : null,
            line: null,
            attributes: {},
          };

        }


        /*
        Access Point
        */

        else if (
          has(name, [
            "ACCESS POINT",
            "UNIFI",
            "U7-PRO",
            "U7-LR"
          ])
        ) {

          classification = {
            family: "redes",
            type: "Access Points",
            subtype: null,
            line: null,
            attributes: {},
          };

        }


        /*
        Roteador
        */

        else if (
          has(name, [
            "ROTEADOR",
            "ROUTER"
          ])
        ) {

          classification = {
            family: "redes",
            type: "Roteadores",
            subtype: null,
            line: null,
            attributes: {},
          };

        }


        /*
        Cabos
        */

        else if (
          has(name, [
            "CABO",
            "PATCH CORD"
          ])
        ) {

          classification = {
            family: "cabeamento",
            type: "Cabos",
            subtype:
              has(name, [
                "CAT6",
                "CAT6A"
              ])
                ? "Cabos de Rede CAT6"
                : has(name, [
                    "CAT5",
                    "CAT5E"
                  ])
                ? "Cabos de Rede CAT5"
                : has(name, ["HDMI"])
                ? "Cabos HDMI"
                : null,
            line: null,
            attributes: {},
          };

        }


        /*
        Conectores
        */

        else if (
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

          classification = {
            family: "conectividade",
            type: "Conectores",
            subtype:
              has(name, ["RJ45"])
                ? "RJ45"
                : has(name, ["RJ11"])
                ? "RJ11"
                : has(name, ["BNC"])
                ? "BNC"
                : has(name, ["MC4"])
                ? "MC4"
                : has(name, [
                    "SC/UPC",
                    "SC/APC"
                  ])
                ? "Fibra Óptica"
                : null,
            line: null,
            attributes: {},
          };

        }


        /*
        Telefone
        */

        else if (
          has(name, [
            "TELEFONE"
          ])
        ) {

          classification = {
            family: "telefonia",
            type: "Telefones",
            subtype:
              has(name, ["SEM FIO"])
                ? "Telefones Sem Fio"
                : has(name, ["COM FIO"])
                ? "Telefones Com Fio"
                : has(name, [
                    "TELEFONE IP",
                    "TIP ",
                    "TDMI"
                  ])
                ? "Telefones IP"
                : null,
            line: null,
            attributes: {},
          };

        }


        /*
        Vídeo Porteiro
        */

        else if (
          has(name, [
            "VIDEO PORTEIRO",
            "VÍDEO PORTEIRO",
            "TVIP",
            "IV 7000",
            "IV 7010"
          ])
        ) {

          classification = {
            family: "porteiros",
            type: "Vídeo Porteiros",
            subtype:
              has(name, [
                "MODULO EXTERNO",
                "MÓDULO EXTERNO"
              ])
                ? "Módulo Externo"
                : has(name, [
                    "KIT VIDEO",
                    "KIT VÍDEO"
                  ])
                ? "Kit Vídeo Porteiro"
                : "Vídeo Porteiros",
            line: null,
            attributes: {},
          };

        }


        /*
        Nobreak
        */

        else if (
          has(name, [
            "NOBREAK",
            "NO-BREAK",
            "UPS"
          ])
        ) {

          classification = {
            family: "energia",
            type: "Nobreaks",
            subtype: "Nobreak",
            line: null,
            attributes: {},
          };

        }


        /*
        Bateria
        */

        else if (
          has(name, [
            "BATERIA",
            "PILHA",
            "CR2016",
            "CR2025",
            "CR2032",
            "CR123"
          ])
        ) {

          classification = {
            family: "energia",
            type: "Baterias",
            subtype: "Baterias e Pilhas",
            line: null,
            attributes: {},
          };

        }


        /*
        Fonte
        */

        else if (
          has(name, [
            "FONTE"
          ])
        ) {

          classification = {
            family: "energia",
            type: "Fontes",
            subtype: "Fontes de Alimentação",
            line: null,
            attributes: {},
          };

        }


        /*
        Rack
        */

        else if (
          has(name, [
            "RACK",
            "BANDEJA",
            "PATCH PANEL",
            "FRENTE FALSA"
          ])
        ) {

          classification = {
            family: "redes",
            type: "Racks e Acessórios",
            subtype: null,
            line: null,
            attributes: {},
          };

        }


        /*
        Fallback pela categoria
        */

        else if (
          has(categoryText, ["CFTV"])
        ) {

          classification = {
            family: "cftv",
            type: "CFTV",
            subtype: null,
            line: null,
            attributes: {},
          };

        }

        else if (
          has(categoryText, ["ALARMES"])
        ) {

          classification = {
            family: "alarmes",
            type: "Alarmes",
            subtype: null,
            line: null,
            attributes: {},
          };

        }

        else if (
          has(categoryText, ["REDES"])
        ) {

          classification = {
            family: "redes",
            type: "Redes",
            subtype: null,
            line: null,
            attributes: {},
          };

        }


        const audit =
          auditProduct({
            ...product,
            classification,
          });


        return {

          id: product.id,

          name: product.name,

          sku: product.sku,

          categories:
            product.productcategory.map(
              (pc: any) =>
                pc.category.name
            ),

          v7: classification,

          auditoria: audit,

        };

      }
    );


    /*
    ======================================================
    ESTATÍSTICAS
    ======================================================
    */

    const aprovados =
      audited.filter(
        (p) =>
          p.auditoria.status === "APROVADO"
      );

    const corrigir =
      audited.filter(
        (p) =>
          p.auditoria.status === "CORRIGIR"
      );

    const revisar =
      audited.filter(
        (p) =>
          p.auditoria.status === "REVISAR"
      );


    return NextResponse.json({

      sucesso: true,

      versao: "8.0",

      modo: "AUDITORIA",

      pagina: page,

      limite: limit,

      totalProdutos: audited.length,

      resumo: {

        aprovados: aprovados.length,

        corrigir: corrigir.length,

        revisar: revisar.length,

        percentualAprovado:
          audited.length
            ? Number(
                (
                  aprovados.length /
                  audited.length *
                  100
                ).toFixed(1)
              )
            : 0,

      },

      produtos: audited,

    });

  }

  catch (error) {

    console.error(
      "Erro na análise V8:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro na auditoria da taxonomia V8",
      },
      {
        status: 500,
      }
    );

  }

}