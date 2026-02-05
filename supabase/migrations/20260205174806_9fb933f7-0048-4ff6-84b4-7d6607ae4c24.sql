-- Criar trigger para atribuir role de partner automaticamente quando auth_user_id é definido
CREATE OR REPLACE FUNCTION public.handle_partner_user_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um split_partner recebe um auth_user_id, criar o role de partner
  IF NEW.auth_user_id IS NOT NULL AND (OLD.auth_user_id IS NULL OR OLD.auth_user_id IS DISTINCT FROM NEW.auth_user_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.auth_user_id, 'partner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar o trigger
DROP TRIGGER IF EXISTS on_partner_user_link ON public.split_partners;
CREATE TRIGGER on_partner_user_link
  AFTER UPDATE OF auth_user_id ON public.split_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_partner_user_link();

-- Também criar trigger para INSERT (caso o auth_user_id já venha no insert)
DROP TRIGGER IF EXISTS on_partner_user_link_insert ON public.split_partners;
CREATE TRIGGER on_partner_user_link_insert
  AFTER INSERT ON public.split_partners
  FOR EACH ROW
  WHEN (NEW.auth_user_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_partner_user_link();

-- Permitir que usuários anônimos/autenticados atualizem o auth_user_id de um parceiro
-- durante o processo de registro (apenas seu próprio ID)
CREATE POLICY "Allow linking partner to own auth user"
ON public.split_partners
FOR UPDATE
USING (true)
WITH CHECK (auth_user_id = auth.uid());

-- Permitir leitura pública do split_partners para verificar se o partner existe
CREATE POLICY "Public can check partner exists"
ON public.split_partners
FOR SELECT
USING (true);

-- Permitir que qualquer usuário autenticado insira seu próprio role de partner
CREATE POLICY "Users can insert own partner role"
ON public.user_roles
FOR INSERT
WITH CHECK (user_id = auth.uid() AND role = 'partner');