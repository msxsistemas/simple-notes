-- Create table for split partners configuration
CREATE TABLE public.split_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pix_key TEXT NOT NULL,
  split_type TEXT NOT NULL DEFAULT 'percentage' CHECK (split_type IN ('percentage', 'fixed')),
  split_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.split_partners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own split partners"
  ON public.split_partners
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own split partners"
  ON public.split_partners
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own split partners"
  ON public.split_partners
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own split partners"
  ON public.split_partners
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_split_partners_updated_at
  BEFORE UPDATE ON public.split_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add split_enabled column to fee_configs
ALTER TABLE public.fee_configs 
  ADD COLUMN split_enabled BOOLEAN NOT NULL DEFAULT false;