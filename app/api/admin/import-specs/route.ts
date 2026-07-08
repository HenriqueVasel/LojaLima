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

    const sheetNames = workbook.SheetNames;

 console.log(workbook.SheetNames);

const firstSheet =
  workbook.Sheets["Tabela"];
  
const rows = XLSX.utils.sheet_to_json(firstSheet, {
  range: 2,
  defval: "",
  raw: false
});

   const primeiraLinha = rows[0] || {};

const colunas = Object.keys(primeiraLinha);

return NextResponse.json({
  totalLinhas: rows.length,
  primeiras10Linhas: rows.slice(0, 10)
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