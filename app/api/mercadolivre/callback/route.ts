import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // =========================
    // ERRO DO MERCADO LIVRE
    // =========================

    if (error) {
      console.error("Mercado Livre OAuth:", error);

      return NextResponse.json(
        {
          error: "Autorização do Mercado Livre recusada",
          details: error,
        },
        { status: 400 }
      );
    }

    // =========================
    // VALIDAR STATE
    // =========================

    const savedState = req.cookies.get(
      "mercadolivre_oauth_state"
    )?.value;

    if (!state || !savedState || state !== savedState) {
      return NextResponse.json(
        {
          error: "State OAuth inválido",
        },
        { status: 400 }
      );
    }

    // =========================
    // VALIDAR CODE
    // =========================

    if (!code) {
      return NextResponse.json(
        {
          error: "Código de autorização não recebido",
        },
        { status: 400 }
      );
    }

    const clientId = process.env.MERCADOLIVRE_CLIENT_ID;
    const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET;
    const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          error: "Credenciais do Mercado Livre não configuradas",
        },
        { status: 500 }
      );
    }

    // =========================
    // TROCAR CODE POR TOKEN
    // =========================

    const body = new URLSearchParams();

    body.set("grant_type", "authorization_code");
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
    body.set("code", code);
    body.set("redirect_uri", redirectUri);

    const tokenResponse = await fetch(
      "https://api.mercadolibre.com/oauth/token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        cache: "no-store",
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        "Erro OAuth Mercado Livre:",
        tokenData.error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível obter autorização do Mercado Livre",
        },
        { status: tokenResponse.status }
      );
    }

    const {
      access_token,
      refresh_token,
      expires_in,
      user_id,
    } = tokenData;

    if (!access_token || !refresh_token || !user_id) {
      return NextResponse.json(
        {
          error: "Resposta inválida do Mercado Livre",
        },
        { status: 500 }
      );
    }

    // =========================
    // SALVAR CONEXÃO
    // =========================

    const sellerId = BigInt(user_id);

    const existingConnection =
      await prisma.mercadoLivreConnection.findFirst({
        where: {
          sellerId,
        },
      });

    if (existingConnection) {
      await prisma.mercadoLivreConnection.update({
        where: {
          id: existingConnection.id,
        },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(
            Date.now() + expires_in * 1000
          ),
        },
      });
    } else {
      await prisma.mercadoLivreConnection.create({
        data: {
          sellerId,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(
            Date.now() + expires_in * 1000
          ),
        },
      });
    }

    // =========================
    // LIMPAR COOKIE
    // =========================

    const response = NextResponse.redirect(
      "https://lojalimaelima.com.br/loja"
    );

    response.cookies.delete(
      "mercadolivre_oauth_state"
    );

    return response;
  } catch (error) {
    console.error(
      "Erro callback Mercado Livre:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao finalizar conexão com Mercado Livre",
      },
      { status: 500 }
    );
  }
}