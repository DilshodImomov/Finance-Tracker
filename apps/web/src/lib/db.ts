import { Pool, QueryResultRow } from "pg";
import { env } from "@/lib/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL(),
  max: env.DATABASE_URL().includes("-pooler.") ? 5 : 1,
  ssl: env.DATABASE_URL().includes("localhost") ? false : { rejectUnauthorized: false },
});

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params);
  return result;
}
