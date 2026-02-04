-- Update default values for fee_configs table
ALTER TABLE public.fee_configs 
  ALTER COLUMN pix_in_percentage SET DEFAULT 1.40,
  ALTER COLUMN pix_in_fixed SET DEFAULT 0.80;