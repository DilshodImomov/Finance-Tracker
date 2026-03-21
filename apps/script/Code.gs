// ─────────────────────────────────────────────────────────────────────────────
// DIB → Dashboard Ingest (Gmail API, label-safe, duplicate-safe)
// Requires: Advanced Google service "Gmail API" enabled
//
// Script properties (Project Settings → Script properties):
//   INGEST_URL    → https://your-dashboard-domain.com/api/ingest/dib
//   INGEST_SECRET → the INGEST_SECRET value from your Next.js .env
//
// What this fixes vs the old version:
// - Uses Gmail API message search (label applies to messages, not threads)
// - Robust merchant parsing (doesn't append "Available cash limit..." or chop "Noon Minutes")
// - De-dupes by Message-ID header and by (posted_at minute + merchant + amount)
// - Persists dedupe keys across runs (small rolling cache in Script Properties)
// ─────────────────────────────────────────────────────────────────────────────

// ─── CONFIG ────────────────────────────────────────────────────────────────
const TX_LABEL       = "bank/transactions/Purchase";
const BANK_FROM      = "DIB.notification@dib.ae";
const LOOKBACK_DAYS  = 120;
const BATCH_SIZE     = 100;

const TZ_OFFSET      = "+04:00"; // Dubai fixed UTC+4

// Dedup cache size (rolling). Keep this modest to avoid Script Properties bloat.
const SEEN_TX_KEYS_MAX = 6000;

// ─── MAIN ───────────────────────────────────────────────────────────────────
function runDibIngest() {
  const props         = PropertiesService.getScriptProperties();
  const ingestUrl     = props.getProperty("INGEST_URL");
  const ingestSecret  = props.getProperty("INGEST_SECRET");
  const lastRunAtIso  = props.getProperty("LAST_RUN_AT"); // watermark (received time)
  const seenJson      = props.getProperty("SEEN_TX_KEYS_JSON") || "[]";

  if (!ingestUrl || !ingestSecret) {
    throw new Error("Set INGEST_URL and INGEST_SECRET in Project Settings → Script properties");
  }

  const since = lastRunAtIso
    ? new Date(lastRunAtIso)
    : new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // Load persisted dedupe keys
  const seenList = safeJsonParseArray_(seenJson);
  const seenSet  = new Set(seenList);

  // Label-safe Gmail API query. Quote label because of "/" nesting.
  // Keep newer_than to bound search cost; we still watermark by LAST_RUN_AT.
  const q = `label:"${TX_LABEL}" from:${BANK_FROM} newer_than:${LOOKBACK_DAYS}d`;

  const transactions = [];
  let newestReceivedMs = since.getTime();

  let pageToken;
  do {
    const resp = Gmail.Users.Messages.list("me", {
      q,
      maxResults: 500,
      pageToken,
    });

    const messages = resp.messages || [];
    for (const m of messages) {
      const apiId = m.id;

      // Get metadata first (cheap): Subject, Message-ID; also internalDate via full get later if needed
      const meta = Gmail.Users.Messages.get("me", apiId, {
        format: "metadata",
        metadataHeaders: ["Subject", "Message-ID", "Date"],
      });

      const headers = (meta.payload && meta.payload.headers) ? meta.payload.headers : [];
      const subject = (headers.find(h => String(h.name).toLowerCase() === "subject") || {}).value || "";
      const messageIdHeader = (headers.find(h => String(h.name).toLowerCase() === "message-id") || {}).value || "";

      // Stable message key: Message-ID preferred
      const messageKey = messageIdHeader || apiId;

      // Fetch full only if we might ingest it
      const full = Gmail.Users.Messages.get("me", apiId, { format: "full" });
      const receivedMs = full.internalDate ? Number(full.internalDate) : Date.now();

      // Watermark filter: only consider messages after last run time (received time)
      if (receivedMs <= since.getTime()) {
        // Still update newestReceivedMs for safety? No — watermark should only move forward based on processed set.
        continue;
      }

      const bodyText = getBodyFromPayloadBestEffort_(full.payload);
      const text = `${subject}\n${bodyText}`;

      const parsed = parseDib_(text);
      if (!parsed) continue;

      // Prefer bank postedAt (Dubai local "YYYY-MM-DD HH:MM"), else use received time.
      const postedAtIso = parsed.postedAt
        ? new Date(`${parsed.postedAt.replace(" ", "T")}:00${TZ_OFFSET}`).toISOString()
        : new Date(receivedMs).toISOString();

      // Identity dedupe: (posted minute + merchant + amount). Persisted across runs.
      const txKey = makeTxKey_(postedAtIso, parsed.merchant, parsed.amountAED);

      // Also incorporate messageKey to be extra safe, but txKey alone usually enough.
      const compositeKey = `${txKey}|${messageKey}`;

      if (seenSet.has(txKey) || seenSet.has(compositeKey)) continue;

      transactions.push({
        posted_at:        postedAtIso,
        amount_aed:       parsed.amountAED,
        merchant:         parsed.merchant,
        gmail_message_id: messageKey,                // store stable key
        raw_subject:      subject.slice(0, 200),
        account_type:     parsed.accountType || undefined,
      });

      // Mark as seen (both forms)
      seenSet.add(txKey);
      seenSet.add(compositeKey);

      // Advance watermark based on received time of messages we actually accepted
      if (receivedMs > newestReceivedMs) newestReceivedMs = receivedMs;
    }

    pageToken = resp.nextPageToken;
  } while (pageToken);

  if (!transactions.length) {
    Logger.log("No new transactions found since " + since.toISOString());
    // Still advance watermark a tiny bit? safest is: advance to newestReceivedMs we observed as accepted.
    // If none accepted, keep existing LAST_RUN_AT to avoid skipping late-arriving emails.
    return;
  }

  // Send in batches
  let sent = 0;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    postBatchWithBackoff_(ingestUrl, ingestSecret, { transactions: batch });
    sent += batch.length;
  }

  // Persist watermark
  props.setProperty("LAST_RUN_AT", new Date(newestReceivedMs).toISOString());

  // Persist dedupe cache (rolling)
  const newSeenList = Array.from(seenSet);
  // Keep newest keys (end of array tends to be newest; but Set order is insertion order)
  const trimmed = newSeenList.slice(Math.max(0, newSeenList.length - SEEN_TX_KEYS_MAX));
  props.setProperty("SEEN_TX_KEYS_JSON", JSON.stringify(trimmed));

  Logger.log(`Done. Sent ${sent} transaction(s) to the dashboard.`);
}

// ─── BODY EXTRACTION (Gmail API payload) ─────────────────────────────────────
function getBodyFromPayloadBestEffort_(payload) {
  if (!payload) return "";

  let plain = "";
  let html  = "";

  const stack = [payload];
  while (stack.length) {
    const p = stack.pop();
    if (!p) continue;

    if (p.body && p.body.data) {
      const s = decodeGmailBodyData_(p.body.data);
      if (s) {
        if (p.mimeType === "text/plain" && !plain) plain = s;
        else if (p.mimeType === "text/html" && !html) html = s;
      }
    }

    if (p.parts && p.parts.length) stack.push(...p.parts);
  }

  if (plain) return plain;
  if (html)  return stripHtml_(html);
  return "";
}

function decodeGmailBodyData_(data) {
  if (data == null) return "";

  // Sometimes already bytes (as your debugger showed)
  if (Array.isArray(data)) {
    try { return Utilities.newBlob(data).getDataAsString(); } catch (e) { return ""; }
  }

  // Sometimes typed-array-ish object
  if (typeof data === "object" && typeof data.length === "number") {
    try {
      const arr = Array.prototype.slice.call(data);
      return Utilities.newBlob(arr).getDataAsString();
    } catch (e) {
      return "";
    }
  }

  // Otherwise base64/base64url string
  const cleaned = String(data).replace(/\s+/g, "");
  if (!cleaned) return "";

  // If it doesn't look like base64, treat as plain
  if (!/^[A-Za-z0-9\-_+=/]+$/.test(cleaned)) return cleaned;

  try {
    return Utilities.newBlob(Utilities.base64DecodeWebSafe(cleaned)).getDataAsString();
  } catch (e1) {
    try {
      let b64 = cleaned.replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4;
      if (pad) b64 += "=".repeat(4 - pad);
      return Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString();
    } catch (e2) {
      return "";
    }
  }
}

function stripHtml_(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── PARSER ─────────────────────────────────────────────────────────────────
function parseDib_(text) {
  const t = String(text).replace(/\s+/g, " ").trim();

  // Amount: "Amount AED 44.50"
  const amtMatch = t.match(/\bAmount\s+AED\s*([0-9]+(?:\.[0-9]{2})?)\b/i);
  if (!amtMatch) return null;

  const amountAED = parseFloat(amtMatch[1]);
  if (!isFinite(amountAED)) return null;

  // Merchant: robust stop tokens; DO NOT use "on" boundary (avoids "Noon Minutes" → "No")
  let merchant = null;
  const STOP = "(?:Available\\b|Balance\\b|CashLimitAmount\\b|Credit\\b|Limit\\b|Card\\b|Ref\\b|Txn\\b|Transaction\\b|Date\\b|If\\b|This\\b|$)";

  const m1 = t.match(new RegExp("\\bAmount\\s+AED\\s*[0-9]+(?:\\.[0-9]{2})?\\s+To\\s+(.+?)\\s*(?=" + STOP + ")", "i"));
  if (m1) merchant = m1[1];

  if (!merchant) {
    const m2 = t.match(new RegExp("\\bTo\\s+(.+?)\\s*(?=" + STOP + ")", "i"));
    if (m2) merchant = m2[1];
  }

  if (!merchant) return null;

  merchant = merchant
    .replace(/\[.*?\]/g, "")     // strip placeholders like [CashLimitAmount]
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  // Date/time: "on 26-FEB-2026 23:07" → "2026-02-26 23:07" (Dubai local)
  let postedAt = null;
  const dtMatch = t.match(/\bon\s+(\d{2})-([A-Z]{3})-(\d{4})\s+(\d{2}:\d{2})\b/i);
  if (dtMatch) {
    const monthMap = { JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12 };
    const mm = monthMap[dtMatch[2].toUpperCase()];
    if (mm) postedAt = `${dtMatch[3]}-${String(mm).padStart(2, "0")}-${dtMatch[1]} ${dtMatch[4]}`;
  }

  // Account type (optional)
  const accMatch = t.match(/\b(Saving Account|Current Account|Credit Card)\b/i);
  const accountType = accMatch ? accMatch[1] : null;

  return { amountAED, merchant, postedAt, accountType };
}

// ─── DEDUPE KEY ──────────────────────────────────────────────────────────────
function makeTxKey_(postedAtIso, merchant, amountAED) {
  // Normalize to minute precision in UTC (postedAtIso is ISO string)
  const d = new Date(postedAtIso);
  if (!isFinite(d.getTime())) return "";

  // Minute-level ISO-like key: YYYY-MM-DDTHH:MMZ
  const yyyy = d.getUTCFullYear();
  const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(d.getUTCDate()).padStart(2, "0");
  const hh   = String(d.getUTCHours()).padStart(2, "0");
  const mi   = String(d.getUTCMinutes()).padStart(2, "0");
  const dtKey = `${yyyy}-${mm}-${dd}T${hh}:${mi}Z`;

  const m = String(merchant || "").trim().replace(/\s+/g, " ").toUpperCase();
  const a = Number(amountAED);
  const a2 = isFinite(a) ? a.toFixed(2) : String(amountAED).trim();

  return `${dtKey}|${m}|${a2}`;
}

function safeJsonParseArray_(s) {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch (_) {
    return [];
  }
}

// ─── HTTP ───────────────────────────────────────────────────────────────────
function postBatchWithBackoff_(url, secret, payload) {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: { "X-INGEST-SECRET": secret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      Logger.log("API response: " + response.getContentText());
      return;
    }

    if (attempt === maxAttempts) {
      throw new Error(
        `Ingest failed after ${maxAttempts} attempts. ` +
        `Status: ${code}. Body: ${response.getContentText()}`
      );
    }

    Utilities.sleep(Math.pow(2, attempt) * 500);
  }
}
