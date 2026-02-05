-- Corrigir a policy UPDATE para ser mais restritiva
-- Remover a policy muito permissiva e criar uma mais segura
DROP POLICY IF EXISTS "Allow linking partner to own auth user" ON public.split_partners;

-- Criar policy que permite atualizar apenas quando o auth_user_id está sendo definido para o próprio usuário
-- E o registro ainda não tem auth_user_id definido
CREATE POLICY "Allow linking partner to own auth user"
ON public.split_partners
FOR UPDATE
USING (auth_user_id IS NULL OR auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());