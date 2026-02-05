-- Create checkout_configs table for customization
CREATE TABLE public.checkout_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  background_color TEXT DEFAULT '#0F0F23',
  text_color TEXT DEFAULT '#FFFFFF',
  
  -- Required fields
  require_phone BOOLEAN DEFAULT false,
  require_cpf BOOLEAN DEFAULT false,
  
  -- Display options
  show_product_name BOOLEAN DEFAULT true,
  custom_title TEXT,
  custom_description TEXT,
  success_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own checkout config" 
ON public.checkout_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkout config" 
ON public.checkout_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkout config" 
ON public.checkout_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Public can view any config (for public checkout)
CREATE POLICY "Public can view checkout configs" 
ON public.checkout_configs 
FOR SELECT 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_checkout_configs_updated_at
BEFORE UPDATE ON public.checkout_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();