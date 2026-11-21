import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/session";

// Solo redirige páginas (decisión #5). La API se autoriza en cada handler con sessionFromRequest + requireRole.
export async function proxy(req: NextRequest) {
  if (await verificarSesion(req.cookies.get(COOKIE_SESION)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!api|login|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
