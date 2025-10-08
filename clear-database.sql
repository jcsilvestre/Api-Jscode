-- Script para limpar todas as tabelas do banco de dados
-- Execute este script no PostgreSQL para resetar o banco

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = replica;

-- Limpar todas as tabelas na ordem correta para evitar conflitos de FK
TRUNCATE TABLE user_tokens CASCADE;
TRUNCATE TABLE users_groups_audit CASCADE;
TRUNCATE TABLE users_groups CASCADE;
TRUNCATE TABLE user_invitations CASCADE;
TRUNCATE TABLE user_sessions CASCADE;
TRUNCATE TABLE tenant_ownership_history CASCADE;
TRUNCATE TABLE group_settings CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE tenants CASCADE;

-- Reabilitar verificações de chave estrangeira
SET session_replication_role = DEFAULT;

-- Resetar sequências (IDs auto-incrementais)
ALTER SEQUENCE IF EXISTS tenants_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS groups_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS group_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_invitations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tenant_ownership_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_groups_audit_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_tokens_id_seq RESTART WITH 1;

-- Confirmar limpeza
SELECT 'Database cleared successfully!' as status;