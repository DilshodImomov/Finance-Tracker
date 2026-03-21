import { z } from "zod";
import { normalizeMerchant } from "@/lib/dib-parser";

const positiveMoneySchema = z.coerce.number().finite().positive();
const nullableCategorySchema = z.string().uuid().nullable().optional();

export const ingestTransactionSchema = z.object({
  posted_at: z.string().optional(),
  amount_aed: z.number().positive(),
  merchant: z.string().min(1).max(200),
  gmail_message_id: z.string().min(5).max(255),
  raw_subject: z.string().max(200).optional(),
  account_type: z.string().max(100).optional(),
});

export const ingestBatchSchema = z.object({
  transactions: z.array(ingestTransactionSchema).max(500),
});

export function normalizeIngestPayload(input: z.infer<typeof ingestBatchSchema>) {
  return {
    transactions: input.transactions.map((tx) => ({
      ...tx,
      merchant: normalizeMerchant(tx.merchant),
      raw_subject: tx.raw_subject?.slice(0, 200),
      account_type: tx.account_type?.replace(/\d/g, "").trim() || null,
    })),
  };
}

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
});

export const ruleSchema = z.object({
  pattern: z.string().min(1).max(120),
  category_id: z.string().uuid(),
  priority: z.number().int().min(1).max(1000).default(100),
});

export const transactionUpdateSchema = z.object({
  merchant: z.string().trim().min(1).max(200).optional(),
  amountAed: positiveMoneySchema.optional(),
  categoryId: nullableCategorySchema,
  isExcluded: z.boolean().optional(),
});

export const manualTransactionSchema = z.object({
  postedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().trim().min(1).max(200),
  amountAed: positiveMoneySchema,
  categoryId: nullableCategorySchema,
  isExcluded: z.boolean().optional().default(false),
});
