import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

function normalize(text: string) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .replace(/\.0/g, "")
    .trim();
}

function stripHtml(html: string) {

  return String(html || "")

    .replace(/<[^>]*>/g, " ")

    .replace(/\s+/g, " ")

    .trim();

}

function cleanDescription(html: string) {

  

  return String(html || "")

    // remove style/script
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")

    // remove atributos data-*
    .replace(/\sdata-[^=]+="[^"]*"/gi, "")

    // remove estilos inline
    .replace(/\sstyle="[^"]*"/gi, "")

    // remove atributos inúteis
    .replace(/\s(class|id|width|height)="[^"]*"/gi, "")

    // remove spans
    .replace(/<\/?span[^>]*>/gi, "")

    // corrige lazyload
    .replace(/data-src=/gi, "src=")

    // corrige URLs quebradas
    .replace(/src="\/\//gi, 'src="https://')

    // remove width/height quebrados
    .replace(/width="?[^"\s>]+"?/gi, "")
    .replace(/height="?[^"\s>]+"?/gi, "")

    // remove imagens inválidas
    .replace(
      /<img[^>]*src="[^"]*"\s*\/?>/gi,
      (img) => {

        if (
          img.includes("undefined") ||
          img.includes('src=""') ||
          img.includes("base64")
        ) {
          return "";
        }

        return img;
      }
    )

    // loading lazy
    .replace(
      /<img/gi,
      '<img loading="lazy"'
    )

    // entidades HTML
    .replace(/&ccedil;/g, "ç")
    .replace(/&atilde;/g, "ã")
    .replace(/&aacute;/g, "á")
    .replace(/&agrave;/g, "à")
    .replace(/&acirc;/g, "â")
    .replace(/&eacute;/g, "é")
    .replace(/&ecirc;/g, "ê")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&ocirc;/g, "ô")
    .replace(/&otilde;/g, "õ")
    .replace(/&uacute;/g, "ú")
    .replace(/&nbsp;/g, " ")

    // remove parágrafos vazios
    .replace(/<p>\s*<\/p>/gi, "")

    // remove pontos soltos
    .replace(/<p>\s*\.\s*<\/p>/gi, "")

    // corrige UTF quebrado
    .replace(/Ã§/g, "ç")
    .replace(/Ã£/g, "ã")
    .replace(/Ã¡/g, "á")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã©/g, "é")
    .replace(/Ãª/g, "ê")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ã´/g, "ô")
    .replace(/Ãµ/g, "õ")
    .replace(/Ãº/g, "ú")
    .replace(/Ã¼/g, "ü")
    .replace(/Â/g, "")
    .replace(/Ã/g, "Á")
.replace(/Ã‰/g, "É")
.replace(/Ã“/g, "Ó")
.replace(/Ãš/g, "Ú")
.replace(/ÃÍ/g, "Í")
.replace(/Ã€/g, "À")
.replace(/â€œ/g, '"')
.replace(/â€/g, '"')
.replace(/â€"/g, "-")
.replace(/â€™/g, "'")
.replace(/â¢/g, "• ")
.replace(/â€“/g, "-")
.replace(/â€”/g, "—")
.replace(/â€¦/g, "...")

// remove \n \t literais
.replace(/\\n/g, " ")
.replace(/\\t/g, " ")

// remove excesso de barras
.replace(/\\\\/g, "")

// corrige tags quebradas
.replace(/<\./g, "<")
.replace(/\.<\//g, "</")

// remove iframes/youtube
.replace(/<iframe[\s\S]*?<\/iframe>/gi, "")

// remove embeds
.replace(/<object[\s\S]*?<\/object>/gi, "")
.replace(/<embed[\s\S]*?>/gi, "")

// remove scripts inline restantes
.replace(/javascript:/gi, "")

// corrige UTF restante
.replace(/Ã´/g, "ô")

// remove lixo repetido
.replace(/(\s|\\n|\\t){3,}/g, " ")

.replace(/data-content-type="[^"]*"/gi, "")
.replace(/data-appearance="[^"]*"/gi, "")

    // limpa espaços
    .replace(/\s+/g, " ")

    .trim();

}


export async function GET(req: Request) {
  try {
 
     
     
const authHeader =
  req.headers.get("authorization");

if (
  authHeader !==
  `Bearer ${process.env.CRON_SECRET}`
) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
    


    const response = await fetch(

      
      "https://api.digitalsat.com.br/reseller/v4/product",
      {
        headers: {
          Authorization: `Bearer ${process.env.DIGITALSAT_TOKEN}`,
        },
        cache: "no-store",
      }
    );


    if (!response.ok) {
  throw new Error(
    `Erro API: ${response.status}`
  );
}

  const text = await response.text();


let data = [];

try {
  data = JSON.parse(text);

const teste = data.find(
  (p: any) => String(p.SKU) === "15598"
);

console.log(teste);
console.log(teste);
} catch {
  throw new Error("JSON inválido da API");
}

try {
fs.writeFileSync(
  path.join(
    process.cwd(),
    "data",
    "cache",
    "products.json"
  ),
  JSON.stringify(data)
);
} catch (err) {  
  console.log("Cache não salvo");
}

    // =========================
    // AGRUPAR SKU
    // =========================
    const csvPath = path.join(
  process.cwd(),
  "data",
  "Produto.csv"
);

const fileBuffer =
  fs.readFileSync(csvPath);

const workbook =
  XLSX.read(fileBuffer, {
    type: "buffer",
  });

const sheetName =
  workbook.SheetNames[0];

const sheet =
  workbook.Sheets[sheetName];

const csvProducts =
  XLSX.utils.sheet_to_json(sheet);

 



  const csvMap = new Map();

csvProducts.forEach((p: any) => {

  const normalizedName =
    normalize(p["Nome"]);

  csvMap.set(normalizedName, p);

});

// =========================
// CACHE PRODUTOS
// =========================

const existingProducts = await prisma.product.findMany({
  include: {
    stock: true,
    productimage: true,
  },
});

const productMap = new Map(
  existingProducts.map((p) => [p.sku, p])
);

console.log("TOTAL API:", data.length);

const grouped = new Map();

for (const item of data) {

  const productName =
    normalize(item.DESCRICAO);

  const sku =
    String(item.SKU || "")
      .trim();

  const estoque =
    Number(item.ESTOQUE || 0) -
    Number(item.RESERVADO || 0);

    if (sku === "15598") {
  console.log({
    sku,
    descricao: item.DESCRICAO,
    estoqueApi: item.ESTOQUE,
    reservado: item.RESERVADO,
    estoqueCalculado: estoque,
  });
}

  if (!grouped.has(productName)) {

    const csvProduct: any =
      csvMap.get(productName);

   

    grouped.set(productName, {

      sku,

      name: item.DESCRICAO,

      brand: item.MARCA,

      ean: item.EAN,

      description: cleanDescription(
        csvProduct?.["DescriÃ§Ã£o"] ||
        item.DESCRICAO ||
        ""
        
      ),

      image:
        item.URL_IMAGEM ||
        "/produtos/placeholder.jpg",

      group:
        item.GRUPO ||
        "Sem categoria",

      price: Math.round(
        Number(item.PRECO) * 100
      ),

      stock: estoque,

    });

  } else {

    grouped.get(productName).stock += estoque;

  }
}

console.log("TOTAL GROUPED:", grouped.size);

let created = 0;
let updated = 0;
    // =========================
    // LOOP PRODUTOS
    // =========================

const BATCH_SIZE = 500;

const products = Array.from(grouped.values());

console.log("TOTAL DA API:", data.length);
console.log("TOTAL AGRUPADOS:", grouped.size);
console.log("TOTAL PRODUCTS:", products.length);


const batches = [];

for (let i = 0; i < products.length; i += BATCH_SIZE) {
  batches.push(products.slice(i, i + BATCH_SIZE));
}
 

console.log("TOTAL LOTES:", batches.length);

for (const batch of batches) {

  console.log(`Lote com ${batch.length} produtos`);

  for (const product of batch) {
    
 

      const slug = slugify(product.name);

      // =========================
      // CATEGORIA
      // =========================
const rawGroup =
  product.group?.toLowerCase() || "";

let categoryName = "Diversos";

// =========================
// INFORMÁTICA
// =========================

if (

  rawGroup.includes("informatica") ||
  rawGroup.includes("computador") ||
  rawGroup.includes("notebook") ||
  rawGroup.includes("pc")

) {
  categoryName = "Informática";
}

// =========================
// CONTROLE DE ACESSO
// =========================

else if (

  rawGroup.includes("controle de acesso") ||
  rawGroup.includes("acesso")

) {
  categoryName = "Controle de Acesso";
}

// =========================
// CFTV
// =========================

else if (

  rawGroup.includes("cftv") ||
  rawGroup.includes("dvr") ||
  rawGroup.includes("nvr") ||
  rawGroup.includes("camera") ||
  rawGroup.includes("video monitoramento")

) {
  categoryName = "CFTV";
}

// =========================
// CABEAMENTO
// =========================

else if (

  rawGroup.includes("cabeamento") ||
  rawGroup.includes("fios") ||
  rawGroup.includes("cabos") ||
  rawGroup.includes("cabo")

) {
  categoryName = "Cabeamento";
}

// =========================
// TELEFONIA
// =========================

else if (

  rawGroup.includes("telefonia") ||
  rawGroup.includes("telefone") ||
  rawGroup.includes("ramal") ||
  rawGroup.includes("pabx")

) {
  categoryName = "Telefonia";
}

// =========================
// ALARMES
// =========================

else if (

  rawGroup.includes("alarme") ||
  rawGroup.includes("sensor") ||
  rawGroup.includes("sirene") ||
  rawGroup.includes("incendio")

) {
  categoryName = "Alarmes";
}

// =========================
// ENERGIA
// =========================

else if (

  rawGroup.includes("nobreak") ||
  rawGroup.includes("energia") ||
  rawGroup.includes("fonte") ||
  rawGroup.includes("solar")

) {
  categoryName = "Energia";
}

// =========================
// REDES
// =========================

else if (

  rawGroup.includes("redes") ||
  rawGroup.includes("connect") ||
  rawGroup.includes("switch") ||
  rawGroup.includes("roteador") ||
  rawGroup.includes("router") ||
  rawGroup.includes("fibra") ||
  rawGroup.includes("access point") ||
  rawGroup.includes("rack") ||
  rawGroup.includes("wifi")

) {
  categoryName = "Redes";
}

// =========================
// AUTOMATIZADORES
// =========================

else if (

  rawGroup.includes("automat") ||
  rawGroup.includes("motor") ||
  rawGroup.includes("deslizante") ||
  rawGroup.includes("pivotante")

) {
  categoryName = "Automatizadores";
}

// =========================
// FECHADURAS
// =========================

else if (

  rawGroup.includes("fechadura")

) {
  categoryName = "Fechaduras";
}

// =========================
// PORTEIROS
// =========================

else if (

  rawGroup.includes("porteiro") ||
  rawGroup.includes("interfone") ||
  rawGroup.includes("video porteiro")

) {
  categoryName = "Porteiros";
}

// =========================
// MONITORES
// =========================

else if (

  rawGroup.includes("monitor")

) {
  categoryName = "Monitores";
}

const categorySlug =
  slugify(categoryName);

      let category =
        await prisma.category.findUnique({
          where: {
            slug: categorySlug,
          },
        });

      if (!category) {

        category =
          await prisma.category.create({
            data: {
  name: categoryName,
  slug: categorySlug,
  active: true,

  featured: [
    "CFTV",
    "Redes",
    "Alarmes",
    "Telefonia",
    "Controle de Acesso",
    "Energia",
    "Automatizadores",
    "Fechaduras"
  ].includes(categoryName),
},
          });

      }

      // =========================
      // PRODUTO EXISTE?
      // =========================

      const existing = productMap.get(product.sku);

      // =========================
      // CREATE
      // =========================

      if (!existing) {

        await prisma.product.create({
          data: {

            name: product.name,

            slug: `${slug}-${product.sku}`,

            sku: product.sku,

            ean: product.ean,

            brand: product.brand,

            supplier: "DigitalSat",

            description: product.description,


shortDescription:
  stripHtml(product.description)
    .slice(0, 180),

            priceCents: product.price,

            active: true,

            // =========================
            // ESTOQUE
            // =========================

            stock: {
              create: {
                quantity: product.stock,
              },
            },

            // =========================
            // IMAGEM
            // =========================

            productimage: {
              create: {
                url: product.image,
                alt: product.name,
                sortOrder: 1,
              },
            },

            // =========================
            // CATEGORIA
            // =========================

            productcategory: {
              create: {
                categoryId: category.id,
              },
            },
          },
        });

        created++;

      } else {

        // =========================
        // UPDATE PRODUTO
        // =========================

      const updateData: any = {
  name: product.name,
  brand: product.brand,
  ean: product.ean,
  description: product.description,

  shortDescription:
    stripHtml(product.description)
      .slice(0, 180),
};

// Não atualiza o preço da câmera VIPW 1210 C
if (product.sku !== "17389") {
  updateData.priceCents = product.price;
}

await prisma.product.update({
  where: {
    id: existing.id,
  },
  data: updateData,
});
        

        // =========================
        // UPDATE ESTOQUE
        // =========================

        if (existing.stock) {

          await prisma.stock.update({
            where: {
              id: existing.stock.id,
            },
            data: {
              quantity: product.stock,
            },
          });

        } else {

          await prisma.stock.create({
            data: {
              productId: existing.id,
              quantity: product.stock,
            },
          });

        }

        // =========================
        // UPDATE IMAGEM
        // =========================

        if (existing.productimage.length > 0) {

          await prisma.productimage.update({
            where: {
              id: existing.productimage[0].id,
            },
            data: {
              url: product.image,
              alt: product.name,
            },
          });

        } else {

          await prisma.productimage.create({
            data: {
              productId: existing.id,
              url: product.image,
              alt: product.name,
              sortOrder: 1,
            },
          });

        }

        // =========================
        // CATEGORIA
        // =========================


const existingCategory =
  await prisma.productcategory.findFirst({
    where: {
      productId: existing.id,
      categoryId: category.id,
    },
  });

if (!existingCategory) {

  await prisma.productcategory.create({
    data: {
      productId: existing.id,
      categoryId: category.id,
    },
  });

}

        updated++;
      }
    }

} // fecha for (const batch of batches)

    return NextResponse.json({
      success: true,
      total: grouped.size,
      created,
      updated,
    });

    console.log({
  totalApi: data.length,
  totalProdutos: grouped.size,
  criados: created,
  atualizados: updated,
});

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Erro sincronizando produtos",
      },
      {
        status: 500,
      }
    );
  }
}