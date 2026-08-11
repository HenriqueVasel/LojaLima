import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Classification = {
  type?: string | null;
  subtype?: string | null;
  line?: string | null;
  attributes?: Record<string, any>;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
|--------------------------------------------------------------------------
| CLASSIFICAÇÃO
|--------------------------------------------------------------------------
*/

function classifyProduct(product: any): Classification {

  const name = normalize(product.name || "");
  const brand = normalize(product.brand || "");

  const result: Classification = {
    type: null,
    subtype: null,
    line: null,
    attributes: {},
  };

  /*
  |--------------------------------------------------------------------------
  | CFTV
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("nvd") ||
    name.includes("nvr") ||
    name.includes("gravador digital de video ip")
  ) {
    result.type = "NVR";
    result.subtype = "Gravador de vídeo IP";

    if (/\bnvd\b/i.test(product.name)) {
      result.line = "NVD";
    }

  } else if (
    name.includes("mhdx") ||
    name.includes("imhdx") ||
    name.includes("dvr") ||
    name.includes("gravador") &&
    !name.includes("nvd")
  ) {

    result.type = "DVR";
    result.subtype = "Gravador de vídeo";

    if (name.includes("mhdx")) {
      result.line = "MHDX";
    }

    if (name.includes("imhdx")) {
      result.line = "IMHDX";
    }

  }

  /*
  |--------------------------------------------------------------------------
  | CÂMERAS
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("camera") ||
    name.includes("câmera")
  ) {

    // Corrige o erro da V3:
    // câmera nunca pode virar DVR apenas porque
    // pertence à categoria CFTV.

    result.type = "Câmera";

    if (
      name.includes("wifi") ||
      name.includes("wi-fi") ||
      name.includes("ip de video") ||
      name.includes("ip ")
    ) {
      result.subtype = "IP";
    }

    if (
      name.includes("vhd") ||
      name.includes("multi-hd") ||
      name.includes("multi hd")
    ) {
      result.subtype = "Multi-HD";
    }

    if (
      name.includes("bullet")
    ) {
      result.subtype = "Bullet";
    }

    if (
      name.includes("dome")
    ) {
      result.subtype = "Dome";
    }

  }

  /*
  |--------------------------------------------------------------------------
  | ARMAZENAMENTO
  |--------------------------------------------------------------------------
  */

  if (
    /\bhd\b/.test(name) ||
    name.includes("hard disk") ||
    name.includes("sata") ||
    name.includes("ssd")
  ) {

    if (
      !name.includes("dvr") &&
      !name.includes("nvr") &&
      !name.includes("gravador")
    ) {
      result.type = "Armazenamento";
      result.subtype = "HD";
    }

  }

  /*
  |--------------------------------------------------------------------------
  | ALARMES
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("sensor")
  ) {
    result.type = "Sensores";

    if (
      name.includes("ivp") ||
      name.includes("presenca") ||
      name.includes("presença")
    ) {
      result.subtype = "Sensor de presença";
    }

    if (
      name.includes("magnetico") ||
      name.includes("magnético") ||
      name.includes("reed")
    ) {
      result.subtype = "Sensor magnético";
    }

    if (
      name.includes("iva") ||
      name.includes("barreira")
    ) {
      result.subtype = "Sensor de barreira";
    }
  }

  if (
    name.includes("sirene")
  ) {
    result.type = "Sirenes";
  }

  if (
    name.includes("detector")
  ) {
    result.type = "Detectores";

    if (
      name.includes("fumaca") ||
      name.includes("fumaça")
    ) {
      result.subtype = "Detector de fumaça";
    }
  }

  if (
    name.includes("central de alarme") ||
    name.includes("central alarme")
  ) {
    result.type = "Centrais de alarme";
  }

  if (
    name.includes("cerca eletrica") ||
    name.includes("cerca elétrica")
  ) {
    result.type = "Cerca elétrica";
  }

  /*
  |--------------------------------------------------------------------------
  | CONTROLE DE ACESSO
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("controlador de acesso") ||
    name.includes("controle de acesso")
  ) {
    result.type = "Controladores";

    if (
      name.includes("facial") ||
      name.includes("biometr")
    ) {
      result.subtype = "Controlador biométrico";
    }
  }

  if (
    name.includes("leitor") ||
    name.includes("chaveiro rfid") ||
    name.includes("cartao de proximidade") ||
    name.includes("cartão de proximidade") ||
    name.includes("pulseira") &&
    name.includes("rfid")
  ) {
    result.type = "Leitores";

    if (
      name.includes("rfid") ||
      name.includes("mifare")
    ) {
      result.subtype = "RFID";
    }
  }

  if (
    name.includes("botoeira") ||
    name.includes("botao de saida") ||
    name.includes("botão de saída")
  ) {
    result.type = "Acessórios";
    result.subtype = "Botoeiras e saída";
  }

  /*
  |--------------------------------------------------------------------------
  | FECHADURAS
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("fechadura digital") ||
    name.includes("fechadura inteligente")
  ) {
    result.type = "Fechaduras Digitais";
    result.subtype = "Fechadura inteligente";
  }

  else if (
    name.includes("fechadura eletrica") ||
    name.includes("fechadura elétrica") ||
    name.includes("solenoide")
  ) {
    result.type = "Fechaduras Elétricas";
  }

  else if (
    name.includes("trava")
  ) {
    result.type = "Travas";
  }

  /*
  |--------------------------------------------------------------------------
  | ENERGIA
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("nobreak") ||
    name.includes("nobreaks")
  ) {
    result.type = "Nobreaks";
    result.subtype = "Nobreak";
  }

  else if (
    name.includes("fonte") ||
    name.includes("alimentacao") ||
    name.includes("alimentação")
  ) {
    result.type = "Fontes";
    result.subtype = "Fonte de alimentação";
  }

  else if (
    name.includes("modulo de bateria") ||
    name.includes("módulo de bateria") ||
    name.includes("modulo de baterias") ||
    name.includes("módulo de baterias")
  ) {
    result.type = "Módulos de bateria";
  }

  else if (
    name.includes("bateria")
  ) {
    result.type = "Baterias";
  }

  /*
  |--------------------------------------------------------------------------
  | REDES
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("switch")
  ) {
    result.type = "Switches";

    if (
      name.includes("gerenciavel") ||
      name.includes("gerenciável")
    ) {
      result.subtype = "Switch gerenciável";
    }

    if (
      name.includes("nao gerenciavel") ||
      name.includes("não gerenciável")
    ) {
      result.subtype = "Switch não gerenciável";
    }
  }

  if (
    name.includes("roteador")
  ) {
    result.type = "Roteadores";
  }

  if (
    name.includes("access point") ||
    name.includes("access points")
  ) {
    result.type = "Access Points";
  }

  if (
    name.includes("rack") ||
    name.includes("bandeja") &&
    name.includes("rack")
  ) {
    result.type = "Racks e acessórios";
  }

  if (
    name.includes("fibra") ||
    name.includes("fiber") ||
    name.includes("sfp") ||
    name.includes("splitter")
  ) {
    result.type = "Fibra óptica";
  }

  /*
  |--------------------------------------------------------------------------
  | CABEAMENTO
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("cabo")
  ) {
    result.type = "Cabos";

    if (name.includes("cat5")) {
      result.subtype = "Cabo de rede CAT5";
    }

    if (name.includes("cat6")) {
      result.subtype = "Cabo de rede CAT6";
    }

    if (name.includes("rj45")) {
      result.subtype = "Cabo RJ45";
    }

    if (name.includes("rca")) {
      result.subtype = "Cabo RCA";
    }
  }

  if (
    name.includes("conector")
  ) {
    result.type = "Conectores";

    if (name.includes("rj45")) {
      result.subtype = "RJ45";
    }

    if (name.includes("rj11")) {
      result.subtype = "RJ11";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TELEFONIA
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("telefone")
  ) {
    result.type = "Telefones";

    if (
      name.includes("ip") ||
      name.includes("poe")
    ) {
      result.type = "Telefones IP";
    }

    else if (
      name.includes("sem fio")
    ) {
      result.subtype = "Sem fio";
    }

    else {
      result.subtype = "Com fio";
    }
  }

  if (
    name.includes("central") &&
    (
      name.includes("impacta") ||
      name.includes("conecta") ||
      name.includes("modulare") ||
      name.includes("comunic")
    )
  ) {
    result.type = "Centrais telefônicas";
  }

  if (
    name.includes("gateway")
  ) {
    result.type = "Gateways";
  }

  /*
  |--------------------------------------------------------------------------
  | PORTEIROS
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("video porteiro") ||
    name.includes("vídeo porteiro") ||
    name.includes("videoporteiro") ||
    name.includes("vídeoporteiro")
  ) {

    result.type = "Vídeo porteiros";

    if (
      name.includes("modulo externo") ||
      name.includes("módulo externo")
    ) {
      result.subtype = "Módulo externo";
    }

    else if (
      name.includes("modulo interno") ||
      name.includes("módulo interno")
    ) {
      result.subtype = "Módulo interno";
    }

    else if (
      name.includes("kit")
    ) {
      result.subtype = "Kit vídeo porteiro";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIZADORES
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("controle remoto")
  ) {
    result.type = "Controles remotos";
    result.subtype = "Controle remoto";
  }

  else if (
    name.includes("motor") &&
    (
      name.includes("portao") ||
      name.includes("portão") ||
      name.includes("desliz")
    )
  ) {
    result.type = "Automatizadores";
    result.subtype = "Automatizador";
  }

  else if (
    name.includes("automatizador")
  ) {
    result.type = "Automatizadores";
    result.subtype = "Automatizador";
  }

  /*
  |--------------------------------------------------------------------------
  | MONITORES
  |--------------------------------------------------------------------------
  */

  if (
    name.includes("monitor")
  ) {
    result.type = "Monitores";
  }

  /*
  |--------------------------------------------------------------------------
  | ATRIBUTOS
  |--------------------------------------------------------------------------
  */

  const voltageMatch = product.name?.match(
    /\b(110V|127V|220V|12V|24V|36V|48V)\b/i
  );

  if (voltageMatch) {
    result.attributes!.tensao = voltageMatch[1].toUpperCase();
  }

  /*
  |--------------------------------------------------------------------------
  | CANAIS
  |--------------------------------------------------------------------------
  */

  const channelPatterns = [
    /\b(4|8|16|32|64)\s*(?:canais?|ch)\b/i,
    /\b(?:mhdx|nvd|invd|imhdx)[\s-]*(\d{2})(\d{2})\b/i,
  ];

  for (const pattern of channelPatterns) {

    const match = product.name?.match(pattern);

    if (!match) continue;

    let canais: number | null = null;

    if (match[2]) {
      canais = Number(match[2]);
    } else {
      canais = Number(match[1]);
    }

    if (
      canais &&
      [4, 8, 16, 32, 64].includes(canais)
    ) {
      result.attributes!.canais = canais;
      break;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | POE
  |--------------------------------------------------------------------------
  */

  if (
    /\bpoe\b/i.test(product.name)
  ) {
    result.attributes!.poe = true;
  }

  /*
  |--------------------------------------------------------------------------
  | POTÊNCIA VA
  |--------------------------------------------------------------------------
  */

  const vaMatch = product.name?.match(
    /\b(\d+(?:[.,]\d+)?)\s*VA\b/i
  );

  if (vaMatch) {
    result.attributes!.potenciaVA =
      Number(vaMatch[1].replace(",", "."));
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| NOME DOS ATRIBUTOS
|--------------------------------------------------------------------------
*/

function attributeLabel(key: string) {

  const labels: Record<string, string> = {
    tipo: "Tipo",
    subtipo: "Subtipo",
    linha: "Linha",
    canais: "Canais",
    tensao: "Tensão",
    poe: "PoE",
    potenciaVA: "Potência VA",
  };

  return labels[key] || key;
}

/*
|--------------------------------------------------------------------------
| CONVERTE VALOR PARA TEXTO
|--------------------------------------------------------------------------
*/

function attributeValue(value: any): string {

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return String(value);
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(req: Request) {

  try {

    const { searchParams } = new URL(req.url);

    const apply =
      searchParams.get("apply") === "true";

    const limit =
      Math.min(
        Number(searchParams.get("limit") || 500),
        1000
      );

    const products = await prisma.product.findMany({

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
          },
        },
      },

      take: limit,

      orderBy: {
        id: "asc",
      },

    });

    let classificados = 0;
    let revisao = 0;

    const resultado: any[] = [];

    /*
    |--------------------------------------------------------------------------
    | PROCESSA PRODUTOS
    |--------------------------------------------------------------------------
    */

    for (const product of products) {

      const classification =
        classifyProduct(product);

      const hasType =
        !!classification.type;

      if (hasType) {
        classificados++;
      } else {
        revisao++;
      }

      /*
      |--------------------------------------------------------------------------
      | MODO GRAVAÇÃO
      |--------------------------------------------------------------------------
      */

      if (apply && hasType) {

        const values: {
          attribute: string;
          value: string;
        }[] = [];

        if (classification.type) {
          values.push({
            attribute: "tipo",
            value: classification.type,
          });
        }

        if (classification.subtype) {
          values.push({
            attribute: "subtipo",
            value: classification.subtype,
          });
        }

        if (classification.line) {
          values.push({
            attribute: "linha",
            value: classification.line,
          });
        }

        for (
          const [key, value]
          of Object.entries(
            classification.attributes || {}
          )
        ) {

          values.push({
            attribute: key,
            value: attributeValue(value),
          });

        }

        /*
        |--------------------------------------------------------------------------
        | CRIA ATRIBUTOS E VALORES
        |--------------------------------------------------------------------------
        */

        for (const item of values) {

          const attribute =
            await prisma.attribute.upsert({

              where: {
                slug: slugify(item.attribute),
              },

              update: {
                name:
                  attributeLabel(item.attribute),
              },

              create: {
                name:
                  attributeLabel(item.attribute),

                slug:
                  slugify(item.attribute),

                description:
                  `Atributo utilizado na classificação automática de produtos.`,
              },

            });

          const attributeValueRecord =
            await prisma.attributeValue.upsert({

              where: {
                attributeId_slug: {
                  attributeId: attribute.id,
                  slug: slugify(item.value),
                },
              },

              update: {
                value: item.value,
              },

              create: {
                attributeId: attribute.id,
                value: item.value,
                slug: slugify(item.value),
              },

            });

          /*
          |--------------------------------------------------------------------------
          | VINCULA ATRIBUTO À CATEGORIA
          |--------------------------------------------------------------------------
          */

          for (
            const category
            of product.productcategory
          ) {

            await prisma.categoryAttribute.upsert({

              where: {
                categoryId_attributeId: {
                  categoryId: category.categoryId,
                  attributeId: attribute.id,
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
          | VINCULA ATRIBUTO AO PRODUTO
          |--------------------------------------------------------------------------
          */

          await prisma.productAttribute.upsert({

            where: {
              productId_attributeValueId: {
                productId: product.id,
                attributeValueId:
                  attributeValueRecord.id,
              },
            },

            update: {},

            create: {
              productId: product.id,

              attributeValueId:
                attributeValueRecord.id,
            },

          });

        }

      }

      resultado.push({

        id: product.id,

        name: product.name,

        sku: product.sku,

        classification,

        status:
          hasType
            ? "classificado"
            : "revisao",

      });

    }

    return NextResponse.json({

      sucesso: true,

      versao: "4.0",

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
                products.length
              * 100
              ).toFixed(2)
            )
          : 0,

      produtos:
        resultado,

    });

  } catch (error) {

    console.error(
      "Erro na V4:",
      error
    );

    return NextResponse.json(

      {
        sucesso: false,

        erro:
          "Erro ao executar análise V4",

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