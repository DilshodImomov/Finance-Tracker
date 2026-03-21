import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { monthlyTotals } from "@/lib/repo";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const months = Number(req.nextUrl.searchParams.get("months") ?? "12");
  const rows = await monthlyTotals({
    months,
    from: req.nextUrl.searchParams.get("from"),
    to: req.nextUrl.searchParams.get("to"),
    granularity:
      req.nextUrl.searchParams.get("granularity") === "day"
        ? "day"
        : "month",
  });
  return NextResponse.json({ rows });
}
