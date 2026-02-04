-- Add document and email columns to split_partners table
ALTER TABLE public.split_partners 
ADD COLUMN document text,
ADD COLUMN email text;