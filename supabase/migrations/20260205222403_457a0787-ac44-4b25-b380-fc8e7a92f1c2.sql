-- Create partner_products table for partners to have their own products
CREATE TABLE public.partner_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.split_partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  sold_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

-- Partners can view their own products
CREATE POLICY "Partners can view own products" 
ON public.partner_products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM split_partners sp 
    WHERE sp.id = partner_products.partner_id 
    AND sp.auth_user_id = auth.uid()
  )
);

-- Partners can insert their own products
CREATE POLICY "Partners can insert own products" 
ON public.partner_products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM split_partners sp 
    WHERE sp.id = partner_products.partner_id 
    AND sp.auth_user_id = auth.uid()
  )
);

-- Partners can update their own products
CREATE POLICY "Partners can update own products" 
ON public.partner_products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM split_partners sp 
    WHERE sp.id = partner_products.partner_id 
    AND sp.auth_user_id = auth.uid()
  )
);

-- Partners can delete their own products
CREATE POLICY "Partners can delete own products" 
ON public.partner_products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM split_partners sp 
    WHERE sp.id = partner_products.partner_id 
    AND sp.auth_user_id = auth.uid()
  )
);

-- Public can view active partner products (for checkout)
CREATE POLICY "Public can view active partner products" 
ON public.partner_products 
FOR SELECT 
USING (status = 'active');

-- Create partner_transactions table to track partner sales
CREATE TABLE public.partner_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.split_partners(id),
  product_id UUID NOT NULL REFERENCES public.partner_products(id),
  amount NUMERIC NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_document TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  woovi_charge_id TEXT,
  woovi_correlation_id TEXT,
  pix_code TEXT,
  qr_code_base64 TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;

-- Partners can view their own transactions
CREATE POLICY "Partners can view own transactions" 
ON public.partner_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM split_partners sp 
    WHERE sp.id = partner_transactions.partner_id 
    AND sp.auth_user_id = auth.uid()
  )
);

-- Merchants can view transactions of their partners
CREATE POLICY "Merchants can view partner transactions" 
ON public.partner_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM split_partners sp 
    WHERE sp.id = partner_transactions.partner_id 
    AND sp.user_id = auth.uid()
  )
);

-- Service role full access for webhooks
CREATE POLICY "Service role full access partner transactions" 
ON public.partner_transactions 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_partner_products_updated_at
BEFORE UPDATE ON public.partner_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_transactions_updated_at
BEFORE UPDATE ON public.partner_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();