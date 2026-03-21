CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  priority int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_at timestamptz NOT NULL,
  amount_aed numeric(12,2) NOT NULL,
  merchant text NOT NULL,
  source text NOT NULL DEFAULT 'DIB',
  gmail_message_id text NOT NULL UNIQUE,
  raw_subject text,
  account_type text,
  category_id uuid REFERENCES categories(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_posted_at ON transactions(posted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_trgm ON transactions USING gin (merchant gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rules_priority ON category_rules(priority, created_at);

INSERT INTO categories(name)
VALUES ('Uncategorized')
ON CONFLICT(name) DO NOTHING;
