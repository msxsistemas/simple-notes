-- Add require_name and require_email columns to checkout_configs table
ALTER TABLE public.checkout_configs
ADD COLUMN require_name boolean DEFAULT false,
ADD COLUMN require_email boolean DEFAULT false;