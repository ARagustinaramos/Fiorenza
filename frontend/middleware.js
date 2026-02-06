import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;

  const pathname = req.nextUrl.pathname;

  if (!token) {
    if (pathname.startsWith("/clientes-mayoristas") || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  try {
    const decoded = jwt.decode(token);

    if (pathname.startsWith("/admin") && decoded.rol !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      pathname.startsWith("/clientes-mayoristas") &&
      !["mayorista", "admin"].includes(decoded.rol)
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/clientes-mayoristas/:path*", "/admin/:path*"],
};
