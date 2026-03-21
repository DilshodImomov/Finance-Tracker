import { NextRequest, NextResponse } from "next/server";
import { findAuthorizedUserByEmail } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const preferredRegion = "sin1";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user?.email) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const appUser = await findAuthorizedUserByEmail(data.user.email);
  if (!appUser) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Your account is not authorized for this dashboard." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, email: appUser.email, role: appUser.role });
}
