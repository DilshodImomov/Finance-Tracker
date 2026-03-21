import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { topMerchants } from "@/lib/repo";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await topMerchants(
    req.nextUrl.searchParams.get("from"),
    req.nextUrl.searchParams.get("to"),
    Number(req.nextUrl.searchParams.get("limit") ?? "10"),
  );

  return NextResponse.json({ rows });
}
