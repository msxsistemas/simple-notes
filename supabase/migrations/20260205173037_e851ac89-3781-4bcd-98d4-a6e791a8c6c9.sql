-- Definir o usuário principal como admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('057ea406-9b33-4b83-81d3-9f75417e05ac', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;