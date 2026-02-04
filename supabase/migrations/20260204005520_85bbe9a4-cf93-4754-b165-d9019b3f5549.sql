-- Create pix_charges table to store Woovi charge data
CREATE TABLE public.pix_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  transaction_id UUID REFERENCES public.transactions(id),
  woovi_charge_id TEXT NOT NULL UNIQUE,
  woovi_correlation_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  pix_code TEXT NOT NULL,
  qr_code_base64 TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pix_charges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pix charges"
  ON public.pix_charges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pix charges"
  ON public.pix_charges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role policy for webhook updates (bypasses RLS)
CREATE POLICY "Service role can update pix charges"
  ON public.pix_charges
  FOR UPDATE
  USING (true);

-- Add policy for service role to update transactions
CREATE POLICY "Service role can update transactions"
  ON public.transactions
  FOR UPDATE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_pix_charges_updated_at
  BEFORE UPDATE ON public.pix_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();