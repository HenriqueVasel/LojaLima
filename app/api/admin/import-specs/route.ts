import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: Request) {

  try {

    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {

      return NextResponse.json(
        {
          error: "Nenhuma planilha enviada."
        },
        {
          status: 400
        }
      );

    }

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, {
      type: "buffer"
    });

    

 

const firstSheet =
  workbook.Sheets["Tabela"];
  
const rows = XLSX.utils.sheet_to_json<any>(firstSheet, {
  range: 2,
  defval: "",
  raw: false
});

  const eansProcessados = new Set<string>();



let encontrados = 0;
let naoEncontrados = 0;
let atualizados = 0;

for (const row of rows) {

  const ean = String(row.EAN || "").trim();

  if (eansProcessados.has(ean)) {
  continue;
}

eansProcessados.add(ean);

  

  if (!ean) continue;

  const produto = await prisma.product.findFirst({
    where: {
      ean
    },
    select: {
      id: true,
      name: true
    }
  });


if (produto) {

  encontrados++;

  
const peso = Number(String(row.Peso).replace(",", "."));
const altura = Number(String(row.Alt).replace(",", "."));
const largura = Number(String(row.Larg).replace(",", "."));
const comprimento = Number(String(row.Comp).replace(",", "."));

if (
  Number.isNaN(peso) ||
  Number.isNaN(altura) ||
  Number.isNaN(largura) ||
  Number.isNaN(comprimento)
) {

  console.log("VALORES INVÁLIDOS", {
    peso: row.Peso,
    altura: row.Alt,
    largura: row.Larg,
    comprimento: row.Comp
  });

  continue;

}

console.log("ATUALIZANDO:", produto.id);

const resultado = await prisma.product.update({

  where: {
    id: produto.id
  },

  data: {

    weight: peso,
    height: altura,
    width: largura,
    length: comprimento

  }

});

console.log(resultado);

atualizados++;

} else {

  naoEncontrados++;

}

} 

return NextResponse.json({

  totalPlanilha: rows.length,

  encontrados,

  naoEncontrados,

  atualizados,

  percentual:
    (
      (encontrados / rows.length) * 100
    ).toFixed(2) + "%"

});



  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Erro ao importar planilha."
      },
      {
        status: 500
      }
    );

  }

}