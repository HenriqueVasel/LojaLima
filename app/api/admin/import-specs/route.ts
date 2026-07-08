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
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows: any[] =
      XLSX.utils.sheet_to_json(firstSheet);

   const primeiraLinha = rows[0] || {};

const colunas = Object.keys(primeiraLinha);

return NextResponse.json({

  message: "Planilha lida com sucesso.",

  totalLinhas: rows.length,

  colunas,

  primeiraLinha

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