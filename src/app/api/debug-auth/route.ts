import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const cookieNames = req.cookies.getAll().map((c) => c.name);
  return NextResponse.json({
    hasToken: !!token,
    tokenId: token?.id ?? null,
    tokenSub: token?.sub ?? null,
    tokenEmail: token?.email ?? null,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    cookieNames,
  });
}
