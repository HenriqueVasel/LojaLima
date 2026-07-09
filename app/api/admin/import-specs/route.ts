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

  



let encontrados = 0;
let naoEncontrados = 0;

for (const row of rows) {

  const ean = String(row.EAN || "").trim();

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

  if (encontrados <= 10) {

    console.log({
      eanPlanilha: ean,
      produtoBanco: produto.name
    });

  }

} else {

  naoEncontrados++;

}

} 

return NextResponse.json({

  totalPlanilha: rows.length,

  encontrados,

  naoEncontrados,

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