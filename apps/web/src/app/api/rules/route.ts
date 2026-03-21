import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { createRule, listRules } from "@/lib/repo";
import { ruleSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await listRules();
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = ruleSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const rule = await createRule(parsed.data.pattern, parsed.data.category_id, parsed.data.priority);
  return NextResponse.json({ rule });
}
