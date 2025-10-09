import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_DATABASE || 'jcscode',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});