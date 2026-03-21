import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { createManualTransaction, listTransactions } from "@/lib/repo";
import { manualTransactionSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;

  const catParam = searchParams.get("category");
  const categoryIds = catParam ? catParam.split(",").filter(Boolean) : [];

  const data = await listTransactions({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    merchant: searchParams.get("merchant"),
    minAmount: searchParams.get("min"),
    maxAmount: searchParams.get("max"),
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "25"),
    sort: (searchParams.get("sort") as
      | "posted_at_desc"
      | "posted_at_asc"
      | "amount_desc"
      | "amount_asc") ?? "posted_at_desc",
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = manualTransactionSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const transaction = await createManualTransaction({
    postedAt: new Date(`${parsed.data.postedAt}T00:00:00.000Z`).toISOString(),
    merchant: parsed.data.merchant,
    amountAed: parsed.data.amountAed,
    categoryId: parsed.data.categoryId,
    isExcluded: parsed.data.isExcluded,
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
