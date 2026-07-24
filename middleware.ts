import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest){

  const token = req.cookies.get("token")?.value;

  const protectedRoutes = [
    "/checkout",
    "/meus-pedidos",
    "/admin"
  ];

  const pathname = req.nextUrl.pathname;

  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // se não for rota protegida, segue normal
  if (!isProtected) {
    return NextResponse.next();
  }

  // se for rota protegida e não tiver token
  if (!token) {
    return NextResponse.redirect(
  new URL(`/login?redirect=${req.nextUrl.pathname}`, req.url)
);
  }

  // tem token → deixa passar
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/checkout/:path*",
    "/carrinho/:path*",
    "/meus-pedidos/:path*",
    "/admin/:path*"
  ],
};

