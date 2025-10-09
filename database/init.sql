-- Database initialization script for API JSCode
-- This script creates all necessary tables and views

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    username VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID,
    is_tenant_admin BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    owner_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    max_users INTEGER DEFAULT 10,
    current_users_count INTEGER DEFAULT 0,
    suspended_at TIMESTAMP,
    suspended_reason TEXT,
    suspension_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_groups table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_groups (
    user_id UUID NOT NULL REFERENCES users(uuid),
    group_id UUID NOT NULL REFERENCES groups(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(uuid),
    PRIMARY KEY (user_id, group_id)
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS users_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP NOT NULL,
    logout_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create user_groups_audit table
CREATE TABLE IF NOT EXISTS user_groups_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    group_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL,
    performed_by UUID NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    invited_by UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create group_settings table
CREATE TABLE IF NOT EXISTS group_settings (
    group_id UUID PRIMARY KEY REFERENCES groups(id),
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}'
);

-- Create tenant_ownership_history table
CREATE TABLE IF NOT EXISTS tenant_ownership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    previous_owner UUID,
    new_owner UUID NOT NULL,
    transferred_by UUID,
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE user_groups ADD CONSTRAINT fk_user_groups_user_id FOREIGN KEY (user_id) REFERENCES users(uuid);
ALTER TABLE tenants ADD CONSTRAINT fk_tenants_owner_user_id FOREIGN KEY (owner_user_id) REFERENCES users(uuid);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON users_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON users_sessions(is_active);

-- Create views
CREATE OR REPLACE VIEW v_active_users AS
SELECT 
    u.uuid,
    u.full_name,
    u.email,
    u.username,
    u.is_tenant_admin,
    t.name as tenant_name,
    t.slug as tenant_slug,
    u.last_login,
    u.created_at
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.last_login > (CURRENT_TIMESTAMP - INTERVAL '30 days');

CREATE OR REPLACE VIEW v_groups_with_member_count AS
SELECT 
    g.id,
    g.name,
    g.description,
    t.name as tenant_name,
    COUNT(ug.user_id) as member_count,
    g.created_at
FROM groups g
LEFT JOIN tenants t ON g.tenant_id = t.id
LEFT JOIN user_groups ug ON g.id = ug.group_id
GROUP BY g.id, g.name, g.description, t.name, g.created_at;

CREATE OR REPLACE VIEW v_tenant_stats AS
SELECT 
    t.id,
    t.name,
    t.slug,
    COUNT(u.id) as current_users_count,
    t.max_users,
    t.is_active,
    COUNT(DISTINCT g.id) as total_groups,
    COUNT(DISTINCT ug.user_id) as users_in_groups,
    t.created_at
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN groups g ON t.id = g.tenant_id
LEFT JOIN user_groups ug ON g.id = ug.group_id
GROUP BY t.id, t.name, t.slug, t.max_users, t.is_active, t.created_at;

-- Insert sample data
INSERT INTO tenants (name, slug, max_users) VALUES 
('Default Tenant', 'default', 100),
('Demo Company', 'demo', 50)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample users
INSERT INTO users (full_name, email, username, password_hash, tenant_id) 
SELECT 
    'Admin User',
    'admin@example.com',
    'admin',
    '$2b$10$example.hash.here',
    t.id
FROM tenants t WHERE t.slug = 'default'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, username, password_hash, tenant_id) 
SELECT 
    'Demo User',
    'demo@example.com',
    'demo',
    '$2b$10$example.hash.here',
    t.id
FROM tenants t WHERE t.slug = 'demo'
ON CONFLICT (email) DO NOTHING;

-- Insert sample groups
INSERT INTO groups (name, description, tenant_id)
SELECT 
    'Administrators',
    'System administrators group',
    t.id
FROM tenants t WHERE t.slug = 'default'
ON CONFLICT DO NOTHING;

INSERT INTO groups (name, description, tenant_id)
SELECT 
    'Users',
    'Regular users group',
    t.id
FROM tenants t WHERE t.slug = 'default'
ON CONFLICT DO NOTHING;