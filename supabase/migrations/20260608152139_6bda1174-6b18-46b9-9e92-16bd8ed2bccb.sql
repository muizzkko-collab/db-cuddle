
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS why_choose_title text,
  ADD COLUMN IF NOT EXISTS why_choose_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reviews_title text,
  ADD COLUMN IF NOT EXISTS reviews jsonb NOT NULL DEFAULT '[]'::jsonb;
