-- Add woovi_subaccount_id column to split_partners table
ALTER TABLE public.split_partners 
ADD COLUMN woovi_subaccount_id TEXT DEFAULT NULL;