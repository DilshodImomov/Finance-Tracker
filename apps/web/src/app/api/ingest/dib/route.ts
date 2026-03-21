import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { ingestBatchSchema, normalizeIngestPayload } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { findCategoryForMerchant } from "@/lib/repo";
import { query } from "@/lib/db";

function getRequestIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isAllowedIp(ip: string) {
  if (!env.INGEST_ALLOWED_IPS.trim()) {
    return true;
  }

  const list = env.INGEST_ALLOWED_IPS.split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(ip);
}

function isAllowedUserAgent(req: NextRequest) {
  if (!env.INGEST_ALLOWED_UA_REGEX.trim()) {
    return true;
  }

  const userAgent = req.headers.get("user-agent") ?? "";
  try {
    const re = new RegExp(env.INGEST_ALLOWED_UA_REGEX);
    return re.test(userAgent);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ingest-secret");
  if (!secret || secret !== env.INGEST_SECRET()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(req);
  const rate = checkRateLimit(`ingest:${ip}`, 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  if (!isAllowedIp(ip) || !isAllowedUserAgent(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsedJson = await req.json().catch(() => null);
  const parsed = ingestBatchSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const normalized = normalizeIngestPayload(parsed.data);

  let inserted = 0;
  let ignored = 0;

  for (const tx of normalized.transactions) {
    const postedAt = tx.posted_at ? new Date(tx.posted_at) : new Date();
    if (Number.isNaN(postedAt.getTime())) {
      ignored += 1;
      continue;
    }

    const categoryId = await findCategoryForMerchant(tx.merchant);

    const result = await query<{ id: string }>(
      `
        INSERT INTO transactions(
          posted_at,
          amount_aed,
          merchant,
          source,
          gmail_message_id,
          raw_subject,
          category_id,
          account_type
        )
        VALUES($1, $2, $3, 'DIB', $4, $5, $6, $7)
        ON CONFLICT(gmail_message_id) DO NOTHING
        RETURNING id
      `,
      [
        postedAt.toISOString(),
        tx.amount_aed.toFixed(2),
        tx.merchant,
        tx.gmail_message_id,
        tx.raw_subject ?? null,
        categoryId,
        tx.account_type,
      ],
    );

    if (result.rowCount) {
      inserted += 1;
    } else {
      ignored += 1;
    }
  }

  return NextResponse.json({ inserted, ignored });
}
