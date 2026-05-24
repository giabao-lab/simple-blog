-- Migration: Add 'ip_address' column to user_login_history and backfill from 'ip'
-- Run this in your Supabase SQL Editor or via psql against the project's database.

BEGIN;

-- Add column if it doesn't exist (text to accept IPv4/IPv6 and headers)
ALTER TABLE public.user_login_history
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Backfill from legacy `ip` column if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'user_login_history' AND column_name = 'ip') THEN
    UPDATE public.user_login_history SET ip_address = ip WHERE ip IS NOT NULL;
  END IF;
END$$;

COMMIT;

-- NOTE: After applying this migration, verify your `log_user_event` function and any inserts
-- reference `ip_address`. If the function still references a different column name, update it accordingly.
