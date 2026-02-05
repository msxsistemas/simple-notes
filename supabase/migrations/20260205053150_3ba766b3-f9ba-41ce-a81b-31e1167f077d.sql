UPDATE public.checkout_configs 
SET 
  show_phone = true,
  require_phone = true,
  require_name = false,
  require_email = false,
  require_cpf = false
WHERE user_id = '057ea406-9b33-4b83-81d3-9f75417e05ac'