const { Client } = require('pg');
require('dotenv').config();

async function clearDatabase() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados PostgreSQL');

    // Primeiro, dropar as views que dependem das tabelas
    console.log('Dropando views...');
    const views = [
      'v_active_users',
      'v_groups_with_member_count', 
      'v_tenant_stats'
    ];

    for (const view of views) {
      try {
        await client.query(`DROP VIEW IF EXISTS ${view} CASCADE`);
        console.log(`✓ View ${view} dropada`);
      } catch (error) {
        console.log(`⚠ Erro ao dropar view ${view}: ${error.message}`);
      }
    }

    // Desabilitar verificações de chave estrangeira temporariamente
    await client.query('SET session_replication_role = replica');
    console.log('Verificações de FK desabilitadas');

    // Lista de tabelas para limpar
    const tables = [
      'user_tokens',
      'users_groups_audit', 
      'users_groups',
      'user_invitations',
      'user_sessions',
      'tenant_ownership_history',
      'group_settings',
      'groups',
      'users',
      'tenants'
    ];

    // Limpar todas as tabelas
    for (const table of tables) {
      try {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`✓ Tabela ${table} limpa`);
      } catch (error) {
        console.log(`⚠ Erro ao limpar tabela ${table}: ${error.message}`);
      }
    }

    // Reabilitar verificações de chave estrangeira
    await client.query('SET session_replication_role = DEFAULT');
    console.log('Verificações de FK reabilitadas');

    // Resetar sequências
    const sequences = [
      'tenants_id_seq',
      'users_id_seq', 
      'groups_id_seq',
      'group_settings_id_seq',
      'user_invitations_id_seq',
      'user_sessions_id_seq',
      'tenant_ownership_history_id_seq',
      'users_groups_audit_id_seq',
      'user_tokens_id_seq'
    ];

    for (const seq of sequences) {
      try {
        await client.query(`ALTER SEQUENCE IF EXISTS ${seq} RESTART WITH 1`);
        console.log(`✓ Sequência ${seq} resetada`);
      } catch (error) {
        console.log(`⚠ Erro ao resetar sequência ${seq}: ${error.message}`);
      }
    }

    // Recriar as views
    console.log('Recriando views...');
    
    // View de usuários ativos
    await client.query(`
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
      WHERE u.last_login > (CURRENT_TIMESTAMP - INTERVAL '30 days')
    `);
    console.log('✓ View v_active_users recriada');

    // View de grupos com contagem de membros
    await client.query(`
      CREATE OR REPLACE VIEW v_groups_with_member_count AS
      SELECT 
          g.id,
          g.name,
          g.description,
          t.name as tenant_name,
          COALESCE(COUNT(ug.user_id), 0) as member_count,
          g.created_at
      FROM groups g
      LEFT JOIN tenants t ON g.tenant_id = t.id
      LEFT JOIN users_groups ug ON g.id = ug.group_id
      GROUP BY g.id, g.name, g.description, t.name, g.created_at
    `);
    console.log('✓ View v_groups_with_member_count recriada');

    // View de estatísticas do tenant
    await client.query(`
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
      LEFT JOIN users_groups ug ON g.id = ug.group_id
      GROUP BY t.id, t.name, t.slug, t.max_users, t.is_active, t.created_at
    `);
    console.log('✓ View v_tenant_stats recriada');

    console.log('\n🎉 Banco de dados limpo com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Conexão com banco de dados fechada');
  }
}

clearDatabase();