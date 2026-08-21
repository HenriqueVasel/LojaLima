import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const clientId = process.env.MERCADOLIVRE_CLIENT_ID;
    const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error: "Credenciais do Mercado Livre não configuradas",
        },
        { status: 500 }
      );
    }

    const state = crypto.randomBytes(32).toString("hex");

    const authUrl = new URL(
      "https://auth.mercadolivre.com.br/authorization"
    );

    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl);

    response.cookies.set("mercadolivre_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("Erro ao iniciar OAuth Mercado Livre:", error);

    return NextResponse.json(
      { error: "Erro ao conectar com Mercado Livre" },
      { status: 500 }
    );
  }
}