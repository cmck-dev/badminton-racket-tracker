import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporarily disabled to isolate auth issue
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
