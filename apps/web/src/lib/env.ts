function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: () => required("DATABASE_URL"),
  INGEST_SECRET: () => required("INGEST_SECRET"),
  NEXT_PUBLIC_SUPABASE_URL: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  INGEST_ALLOWED_IPS: process.env.INGEST_ALLOWED_IPS ?? "",
  INGEST_ALLOWED_UA_REGEX: process.env.INGEST_ALLOWED_UA_REGEX ?? "",
};
