UPDATE public.checkout_configs 
SET 
  show_name = false,
  show_email = false,
  show_phone = true,
  show_cpf = false,
  require_name = false,
  require_email = false,
  require_phone = true,
  require_cpf = false
WHERE user_id = '057ea406-9b33-4b83-81d3-9f75417e05ac'