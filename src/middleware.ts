import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Database sessions: just check cookie existence here.
  // Full validation (DB lookup) happens in getServerSession() per page.
  const hasSession =
    req.cookies.has("__Secure-next-auth.session-token") ||
    req.cookies.has("next-auth.session-token");

  if (!hasSession) {
    const signInUrl = new URL("/auth/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!auth|api/auth|api/debug-auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
