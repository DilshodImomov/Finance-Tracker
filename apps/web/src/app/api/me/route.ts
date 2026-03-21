import { NextResponse } from "next/server";
import { getAuthorizedUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthorizedUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, email: user.email, role: user.role });
}
