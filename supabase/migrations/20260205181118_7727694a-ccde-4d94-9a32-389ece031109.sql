-- Política para permitir que parceiros vejam transações do merchant que os criou
CREATE POLICY "Partners can view merchant transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.split_partners sp
    WHERE sp.auth_user_id = auth.uid()
    AND sp.user_id = transactions.user_id
    AND sp.status = 'active'
  )
);