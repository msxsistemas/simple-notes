-- Update existing partners that have woovi subaccount created but no local ID saved
-- Use the pix_key as the subaccount identifier (Woovi uses pixKey as the identifier)
UPDATE public.split_partners 
SET woovi_subaccount_id = pix_key,
    updated_at = now()
WHERE woovi_subaccount_id IS NULL;