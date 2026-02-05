-- Drop old constraint and add new one with 'cancelled' status
ALTER TABLE public.withdrawals DROP CONSTRAINT withdrawals_status_check;

ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]));