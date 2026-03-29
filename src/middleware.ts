import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const secureCookie = req.nextUrl.protocol === "https:";
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  if (!token) {
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
