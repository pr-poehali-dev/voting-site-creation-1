-- Добавление поля banned к таблице users
ALTER TABLE t_p25393184_voting_site_creation.users 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;

-- Добавление поля ban_reason для причины бана
ALTER TABLE t_p25393184_voting_site_creation.users 
ADD COLUMN IF NOT EXISTS ban_reason TEXT;