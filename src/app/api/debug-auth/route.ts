import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionToken =
    req.cookies.get("__Secure-next-auth.session-token")?.value ??
    req.cookies.get("next-auth.session-token")?.value;

  const allCookies = req.cookies.getAll().map((c) => c.name);

  let dbResult: unknown = null;
  let dbError: string | null = null;
  let sessionCount = 0;

  try {
    sessionCount = await prisma.session.count();
    if (sessionToken) {
      dbResult = await prisma.session.findUnique({
        where: { sessionToken },
        select: { userId: true, expires: true },
      });
    }
  } catch (e) {
    dbError = String(e);
  }

  return NextResponse.json({
    cookieNames: allCookies,
    sessionToken: sessionToken ?? null,
    dbResult,
    dbError,
    sessionCount,
    now: new Date().toISOString(),
  });
}
