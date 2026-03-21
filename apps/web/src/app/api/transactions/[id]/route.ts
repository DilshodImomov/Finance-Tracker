import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { updateTransaction, deleteTransaction } from "@/lib/repo";
import { transactionUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json().catch(() => null);
  const parsed = transactionUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;

  const row = await updateTransaction(id, {
    merchant: body.merchant,
    amountAed: body.amountAed,
    categoryId: "categoryId" in body ? body.categoryId : undefined,
    isExcluded: body.isExcluded,
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteTransaction(id);
  return new NextResponse(null, { status: 204 });
}
