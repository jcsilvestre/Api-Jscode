const { Client } = require('pg');
require('dotenv').config();

async function checkTable() {
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

    // Verificar estrutura da tabela users_groups
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users_groups' 
      ORDER BY ordinal_position
    `);

    console.log('Estrutura da tabela users_groups:');
    console.table(result.rows);

    // Verificar se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users_groups'
      )
    `);

    console.log('Tabela users_groups existe:', tableExists.rows[0].exists);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
    console.log('Conexão fechada');
  }
}

checkTable();