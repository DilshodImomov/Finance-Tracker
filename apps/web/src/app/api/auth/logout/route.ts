import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const preferredRegion = "sin1";

export async function POST(req: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
