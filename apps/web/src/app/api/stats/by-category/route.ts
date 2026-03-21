import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { totalsByCategory } from "@/lib/repo";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await totalsByCategory(
    req.nextUrl.searchParams.get("from"),
    req.nextUrl.searchParams.get("to"),
  );

  return NextResponse.json({ rows });
}
