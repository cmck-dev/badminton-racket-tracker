import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const protocol = req.nextUrl.protocol;
  const isHttps = protocol === "https:";

  // Test with auto-detection
  const tokenAuto = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  // Test forcing secureCookie=true (production cookie name)
  const tokenSecure = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: true });
  // Test forcing secureCookie=false (dev cookie name)
  const tokenInsecure = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false });

  const cookies = req.cookies.getAll().map((c) => c.name);

  return NextResponse.json({
    protocol,
    isHttps,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    cookieNames: cookies,
    tokenAuto: !!tokenAuto,
    tokenSecure: !!tokenSecure,
    tokenInsecure: !!tokenInsecure,
    tokenEmail: tokenSecure?.email ?? tokenAuto?.email ?? null,
  });
}
