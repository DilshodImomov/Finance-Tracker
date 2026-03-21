ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_excluded boolean NOT NULL DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
