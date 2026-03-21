import { query } from "@/lib/db";

export type TransactionFilters = {
  from?: string | null;
  to?: string | null;
  categoryIds?: string[];
  merchant?: string | null;
  minAmount?: string | null;
  maxAmount?: string | null;
  page?: number;
  pageSize?: number;
  sort?: "posted_at_desc" | "posted_at_asc" | "amount_desc" | "amount_asc";
};

function rangeWhere(from?: string | null, to?: string | null) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (from) {
    params.push(from);
    clauses.push(`posted_at >= $${params.length}::timestamptz`);
  }

  if (to) {
    params.push(to);
    clauses.push(`posted_at <= $${params.length}::timestamptz`);
  }

  return { clauses, params };
}

export async function findCategoryForMerchant(merchant: string) {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM categories
      WHERE name = 'Uncategorized'
      LIMIT 1
    `,
  );

  const uncategorizedId = result.rows[0]?.id;

  const rule = await query<{ category_id: string }>(
    `
      SELECT category_id
      FROM category_rules
      WHERE $1 ILIKE ('%' || pattern || '%')
      ORDER BY priority ASC, created_at ASC
      LIMIT 1
    `,
    [merchant],
  );

  return rule.rows[0]?.category_id ?? uncategorizedId ?? null;
}

export async function listCategories() {
  const result = await query<{ id: string; name: string; created_at: string }>(
    `SELECT id, name, created_at FROM categories ORDER BY name ASC`,
  );
  return result.rows;
}

export async function createCategory(name: string) {
  const result = await query<{ id: string; name: string }>(
    `INSERT INTO categories(name) VALUES ($1) RETURNING id, name`,
    [name.trim()],
  );
  return result.rows[0];
}

export async function updateCategory(id: string, name: string) {
  const result = await query<{ id: string; name: string }>(
    `UPDATE categories SET name = $2 WHERE id = $1 RETURNING id, name`,
    [id, name.trim()],
  );
  return result.rows[0] ?? null;
}

export async function deleteCategory(id: string) {
  await query(
    `
      UPDATE transactions
      SET category_id = (SELECT id FROM categories WHERE name = 'Uncategorized' LIMIT 1)
      WHERE category_id = $1
    `,
    [id],
  );
  await query(`DELETE FROM categories WHERE id = $1 AND name <> 'Uncategorized'`, [id]);
}

export async function listRules() {
  const result = await query<{
    id: string;
    pattern: string;
    category_id: string;
    priority: number;
    category_name: string;
  }>(
    `
      SELECT r.id, r.pattern, r.category_id, r.priority, c.name AS category_name
      FROM category_rules r
      JOIN categories c ON c.id = r.category_id
      ORDER BY r.priority ASC, r.created_at ASC
    `,
  );
  return result.rows;
}

export async function createRule(pattern: string, categoryId: string, priority: number) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO category_rules(pattern, category_id, priority)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [pattern.trim(), categoryId, priority],
  );
  return result.rows[0];
}

export async function updateRule(id: string, pattern: string, categoryId: string, priority: number) {
  const result = await query<{ id: string }>(
    `
      UPDATE category_rules
      SET pattern = $2, category_id = $3, priority = $4
      WHERE id = $1
      RETURNING id
    `,
    [id, pattern.trim(), categoryId, priority],
  );
  return result.rows[0] ?? null;
}

export async function deleteRule(id: string) {
  await query(`DELETE FROM category_rules WHERE id = $1`, [id]);
}

export async function updateTransaction(
  id: string,
  fields: { categoryId?: string | null; merchant?: string; amountAed?: number; isExcluded?: boolean },
) {
  const result = await query<{ id: string }>(
    `
      UPDATE transactions
      SET
        merchant    = COALESCE($2, merchant),
        amount_aed  = COALESCE($3::numeric, amount_aed),
        category_id = CASE WHEN $4::boolean THEN $5::uuid ELSE category_id END,
        is_excluded = COALESCE($6, is_excluded)
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `,
    [
      id,
      fields.merchant ?? null,
      fields.amountAed ?? null,
      fields.categoryId !== undefined,
      fields.categoryId ?? null,
      fields.isExcluded ?? null,
    ],
  );
  return result.rows[0] ?? null;
}

export async function createManualTransaction(data: {
  postedAt: string;
  merchant: string;
  amountAed: number;
  categoryId?: string | null;
  isExcluded?: boolean;
}) {
  const categoryId =
    data.categoryId === undefined
      ? await findCategoryForMerchant(data.merchant)
      : data.categoryId;

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
        account_type,
        is_excluded
      )
      VALUES($1, $2, $3, 'MANUAL', $4, NULL, $5, NULL, $6)
      RETURNING id
    `,
    [
      data.postedAt,
      data.amountAed.toFixed(2),
      data.merchant,
      `manual:${crypto.randomUUID()}`,
      categoryId ?? null,
      data.isExcluded ?? false,
    ],
  );

  return result.rows[0];
}

export async function deleteTransaction(id: string) {
  await query(
    `UPDATE transactions SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
}

export async function recategorizeAllTransactions() {
  await query(`
    UPDATE transactions t
    SET category_id = COALESCE(
      (
        SELECT r.category_id
        FROM category_rules r
        WHERE t.merchant ILIKE ('%' || r.pattern || '%')
        ORDER BY r.priority ASC, r.created_at ASC
        LIMIT 1
      ),
      (SELECT id FROM categories WHERE name = 'Uncategorized' LIMIT 1)
    )
  `);
}

export async function getOverviewTotals() {
  const result = await query<{
    this_month: string;
    last_month: string;
    ytd: string;
    all_time: string;
  }>(`
    WITH bounds AS (
      SELECT
        date_trunc('month', now()) AS month_start,
        date_trunc('month', now()) - INTERVAL '1 month' AS prev_month_start,
        date_trunc('year', now()) AS year_start
    )
    SELECT
      COALESCE(SUM(CASE WHEN t.posted_at >= b.month_start THEN t.amount_aed END), 0)::text AS this_month,
      COALESCE(SUM(CASE WHEN t.posted_at >= b.prev_month_start AND t.posted_at < b.month_start THEN t.amount_aed END), 0)::text AS last_month,
      COALESCE(SUM(CASE WHEN t.posted_at >= b.year_start THEN t.amount_aed END), 0)::text AS ytd,
      COALESCE(SUM(t.amount_aed), 0)::text AS all_time
    FROM transactions t
    CROSS JOIN bounds b
    WHERE t.deleted_at IS NULL AND NOT t.is_excluded
  `);
  return result.rows[0];
}

export async function listTransactions(filters: TransactionFilters) {
  const clauses: string[] = ["t.deleted_at IS NULL"];
  const params: unknown[] = [];

  if (filters.from) {
    params.push(filters.from);
    clauses.push(`t.posted_at >= $${params.length}::timestamptz`);
  }
  if (filters.to) {
    params.push(filters.to);
    clauses.push(`t.posted_at <= $${params.length}::timestamptz`);
  }
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    params.push(filters.categoryIds);
    clauses.push(`t.category_id = ANY($${params.length})`);
  }
  if (filters.merchant) {
    params.push(`%${filters.merchant}%`);
    clauses.push(`t.merchant ILIKE $${params.length}`);
  }
  if (filters.minAmount) {
    params.push(filters.minAmount);
    clauses.push(`t.amount_aed >= $${params.length}::numeric`);
  }
  if (filters.maxAmount) {
    params.push(filters.maxAmount);
    clauses.push(`t.amount_aed <= $${params.length}::numeric`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sortSql = {
    posted_at_desc: "t.posted_at DESC",
    posted_at_asc: "t.posted_at ASC",
    amount_desc: "t.amount_aed DESC",
    amount_asc: "t.amount_aed ASC",
  }[filters.sort ?? "posted_at_desc"];

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  params.push(pageSize);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const rows = await query<{
    id: string;
    posted_at: string;
    amount_aed: string;
    merchant: string;
    raw_subject: string | null;
    category_id: string | null;
    category_name: string | null;
    gmail_message_id: string;
    is_excluded: boolean;
  }>(
    `
      SELECT
        t.id,
        t.posted_at,
        t.amount_aed::text,
        t.merchant,
        t.raw_subject,
        t.category_id,
        c.name AS category_name,
        t.gmail_message_id,
        t.is_excluded
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ${where}
      ORDER BY ${sortSql}
      LIMIT $${limitIdx}
      OFFSET $${offsetIdx}
    `,
    params,
  );

  const countWhere = `WHERE ${[...clauses, "NOT t.is_excluded"].join(" AND ")}`;
  const count = await query<{ total: string; total_amount: string }>(
    `
      SELECT COUNT(*)::text AS total, COALESCE(SUM(t.amount_aed), 0)::text AS total_amount
      FROM transactions t
      ${countWhere}
    `,
    params.slice(0, params.length - 2),
  );

  return {
    page,
    pageSize,
    total: Number(count.rows[0]?.total ?? 0),
    totalAmount: Number(count.rows[0]?.total_amount ?? 0),
    items: rows.rows,
  };
}

export async function monthlyTotals(
  options: {
    months?: number;
    from?: string | null;
    to?: string | null;
    granularity?: "day" | "month";
  } = {},
) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const granularity = options.granularity ?? "month";
  const bucket =
    granularity === "day"
      ? "date_trunc('day', posted_at)"
      : "date_trunc('month', posted_at)";
  const bucketLabel =
    granularity === "day"
      ? `to_char(${bucket}, 'YYYY-MM-DD')`
      : `to_char(${bucket}, 'YYYY-MM')`;

  clauses.push("deleted_at IS NULL");
  clauses.push("NOT is_excluded");

  if (options.from) {
    params.push(options.from);
    clauses.push(`posted_at >= $${params.length}::timestamptz`);
  }
  if (options.to) {
    params.push(options.to);
    clauses.push(`posted_at <= $${params.length}::timestamptz`);
  }

  if (!options.from && !options.to) {
    params.push(options.months ?? 12);
    clauses.push(`posted_at >= date_trunc('month', now()) - ($${params.length}::int - 1) * INTERVAL '1 month'`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await query<{ month: string; total: string }>(
    `
      SELECT
        ${bucketLabel} AS month,
        COALESCE(SUM(amount_aed), 0)::text AS total
      FROM transactions
      ${where}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    params,
  );
  return result.rows;
}

export async function totalsByCategory(from?: string | null, to?: string | null) {
  const r = rangeWhere(from, to);
  const baseClauses = ["t.deleted_at IS NULL", "NOT t.is_excluded", ...r.clauses.map((c) => `t.${c}`)];
  const where = `WHERE ${baseClauses.join(" AND ")}`;

  const result = await query<{ category: string; total: string }>(
    `
      SELECT COALESCE(c.name, 'Uncategorized') AS category, COALESCE(SUM(t.amount_aed), 0)::text AS total
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ${where}
      GROUP BY 1
      ORDER BY SUM(t.amount_aed) DESC
    `,
    r.params,
  );

  return result.rows;
}

export async function topMerchants(from?: string | null, to?: string | null, limit = 10) {
  const r = rangeWhere(from, to);
  const where = r.clauses.length ? `WHERE ${r.clauses.join(" AND ")}` : "";

  const params = [...r.params, limit];
  const result = await query<{ merchant: string; total: string; tx_count: string }>(
    `
      SELECT merchant, SUM(amount_aed)::text AS total, COUNT(*)::text AS tx_count
      FROM transactions
      ${where}
      GROUP BY merchant
      ORDER BY SUM(amount_aed) DESC
      LIMIT $${params.length}
    `,
    params,
  );

  return result.rows;
}
