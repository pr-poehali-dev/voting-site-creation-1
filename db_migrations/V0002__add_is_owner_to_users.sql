-- Добавление колонки is_owner к таблице users
ALTER TABLE t_p25393184_voting_site_creation.users 
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;

-- Установка владельца
UPDATE t_p25393184_voting_site_creation.users 
SET is_owner = TRUE 
WHERE email = 'snovi6423@gmail.com';

-- Если пользователя нет, создаём его
INSERT INTO t_p25393184_voting_site_creation.users (email, is_owner) 
SELECT 'snovi6423@gmail.com', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM t_p25393184_voting_site_creation.users WHERE email = 'snovi6423@gmail.com'
);