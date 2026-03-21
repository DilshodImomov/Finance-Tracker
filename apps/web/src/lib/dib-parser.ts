const AMOUNT_RE = /Amount\s+AED\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const DATE_RE = /\bon\s+(\d{2}-[A-Z]{3}-\d{4}\s+\d{2}:\d{2})\b/i;
const MERCHANT_RE = /\bTo\b\s*(.+?)(?=(?:\bIf you have not initiated\b|$))/i;

const MONTHS: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

export type ParsedDib = {
  postedAt: Date;
  amountAed: number;
  merchant: string;
};

export function normalizeMerchant(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

export function parseDubaiLocalDate(dateText: string) {
  const match = dateText.match(/^(\d{2})-([A-Z]{3})-(\d{4})\s+(\d{2}):(\d{2})$/i);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = MONTHS[match[2].toUpperCase()];
  const year = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (month === undefined) {
    return null;
  }

  // Dubai is UTC+4 and has no DST. Convert local Dubai wall-clock to UTC.
  return new Date(Date.UTC(year, month, day, hour - 4, minute));
}

export function parseDibEmailText(text: string, fallbackDate: Date): ParsedDib | null {
  const amountMatch = text.match(AMOUNT_RE);
  if (!amountMatch) {
    return null;
  }

  const afterAmount = text.slice(amountMatch.index ?? 0);
  const merchantMatch = afterAmount.match(MERCHANT_RE);
  if (!merchantMatch) {
    return null;
  }

  const merchant = normalizeMerchant(merchantMatch[1]);
  if (!merchant) {
    return null;
  }

  const amountAed = Number(amountMatch[1].replace(/,/g, ""));
  if (!Number.isFinite(amountAed)) {
    return null;
  }

  const dateMatch = text.match(DATE_RE);
  const parsed = dateMatch ? parseDubaiLocalDate(dateMatch[1].toUpperCase()) : null;

  return {
    postedAt: parsed ?? fallbackDate,
    amountAed,
    merchant,
  };
}
