import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { recategorizeAllTransactions } from "@/lib/repo";

export async function POST() {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await recategorizeAllTransactions();
  return NextResponse.json({ ok: true });
}
