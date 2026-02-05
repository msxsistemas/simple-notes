-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'merchant', 'partner');

-- 2. Criar tabela user_roles
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Criar função para obter o role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 6. Políticas RLS para user_roles
-- Admins podem ver todos os roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem ver seu próprio role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Apenas admins podem inserir roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem atualizar roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem deletar roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Adicionar coluna auth_user_id em split_partners para vincular ao usuário autenticado
ALTER TABLE public.split_partners 
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8. Criar índice para performance
CREATE INDEX idx_split_partners_auth_user_id ON public.split_partners(auth_user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- 9. Atualizar RLS de split_partners para parceiros verem seus próprios dados
CREATE POLICY "Partners can view own partner data"
ON public.split_partners
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Partners can update own partner data"
ON public.split_partners
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid());

-- 10. Atualizar RLS de withdrawals para parceiros poderem solicitar saques
-- Primeiro precisamos adicionar partner_id na tabela withdrawals
ALTER TABLE public.withdrawals 
ADD COLUMN partner_id uuid REFERENCES public.split_partners(id) ON DELETE SET NULL;

-- Parceiros podem ver seus próprios saques
CREATE POLICY "Partners can view own withdrawals"
ON public.withdrawals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.split_partners sp
    WHERE sp.id = partner_id 
    AND sp.auth_user_id = auth.uid()
  )
);

-- Parceiros podem solicitar saques
CREATE POLICY "Partners can insert own withdrawals"
ON public.withdrawals
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.split_partners sp
    WHERE sp.id = partner_id 
    AND sp.auth_user_id = auth.uid()
  )
);

-- 11. Definir você como admin (substitua pelo seu user_id real)
-- Isso será feito manualmente após identificar seu user_id