-- Добавление колонки role к таблице users
ALTER TABLE t_p25393184_voting_site_creation.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Обновление роли владельца
UPDATE t_p25393184_voting_site_creation.users 
SET role = 'admin' 
WHERE is_owner = TRUE;