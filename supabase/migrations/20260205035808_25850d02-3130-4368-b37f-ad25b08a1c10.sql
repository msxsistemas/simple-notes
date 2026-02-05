-- Add columns to control field visibility in checkout
ALTER TABLE public.checkout_configs
ADD COLUMN IF NOT EXISTS show_name BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_cpf BOOLEAN DEFAULT true;