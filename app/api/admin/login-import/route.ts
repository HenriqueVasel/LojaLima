import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

  try {

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Senha obrigatória." },
        { status: 400 }
      );
    }

    if (password !== process.env.IMPORT_SPEC_PASSWORD) {
      return NextResponse.json(
        { error: "Senha incorreta." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true
    });

    response.cookies.set("import_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 6, // 6 horas
      path: "/"
    });

    return response;

  } catch {

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );

  }

}