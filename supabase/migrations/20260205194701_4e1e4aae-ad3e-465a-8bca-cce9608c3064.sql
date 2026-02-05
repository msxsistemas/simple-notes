-- Cancel Maria Eduarda's withdrawal
UPDATE public.withdrawals 
SET status = 'cancelled'
WHERE id = 'bab5a987-a1e4-4bfb-840c-3ab529933131';