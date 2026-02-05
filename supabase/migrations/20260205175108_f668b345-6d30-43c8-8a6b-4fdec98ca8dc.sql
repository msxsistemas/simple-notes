-- Vincular o parceiro "Maria Eduarda" ao usuário que acabou de criar a conta
UPDATE public.split_partners 
SET auth_user_id = 'dd3e0f89-015f-4222-8b75-f7d750ba4ece'
WHERE id = 'a5a60469-d80c-426f-b3b7-677b00ac0ea3';

-- O trigger vai criar automaticamente o role de partner