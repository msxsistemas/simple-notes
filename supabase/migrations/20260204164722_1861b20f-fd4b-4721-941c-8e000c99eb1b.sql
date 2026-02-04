-- Create pix_charges table for tracking PIX payments
CREATE TABLE public.pix_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  woovi_charge_id TEXT,
  woovi_correlation_id TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
  pix_code TEXT,
  qr_code_base64 TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_pix_charges_correlation ON public.pix_charges(woovi_correlation_id);
CREATE INDEX idx_pix_charges_user ON public.pix_charges(user_id);

-- Enable RLS
ALTER TABLE public.pix_charges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own pix charges" ON public.pix_charges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pix charges" ON public.pix_charges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pix charges" ON public.pix_charges FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access" ON public.pix_charges FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_pix_charges_updated_at BEFORE UPDATE ON public.pix_charges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();