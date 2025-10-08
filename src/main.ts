import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🚀 Iniciando aplicação NestJS...');
    
    const app = await NestFactory.create(AppModule);
    
    // Configurar CORS para permitir requisições do frontend e mobile
    app.enableCors({
      origin: [
        'http://localhost:8081', 
        'http://127.0.0.1:8081',
        // Permitir aplicações mobile (React Native, Flutter, etc.)
        'http://localhost:3000',
        'http://10.0.2.2:3000', // Android emulator
        'http://localhost:19006', // Expo
        'capacitor://localhost', // Capacitor
        'ionic://localhost', // Ionic
        // Permitir qualquer origem para desenvolvimento mobile
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https?:\/\/10\.0\.2\.2(:\d+)?$/,
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // Rede local
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'User-Agent',
        'DNT',
        'Cache-Control',
        'X-Mx-ReqToken',
        'Keep-Alive',
        'X-Requested-With',
        'If-Modified-Since',
      ],
      credentials: true,
      optionsSuccessStatus: 200, // Para suporte a navegadores legados
      preflightContinue: false,
    });
    logger.log('🌐 CORS configurado para web e mobile');
    
    // Configurar prefixo global da API
    app.setGlobalPrefix('v1');
    logger.log('🔗 Prefixo global configurado: /v1');
    
    // Configurar pipes globais para validação
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    logger.log('✅ Pipes de validação configurados');
    
    // Verificar conexão e dados do banco
    const dataSource = app.get(DataSource);
    logger.log('🔗 Verificando conexão com PostgreSQL...');
    
    // LOGS DETALHADOS DA CONEXÃO
    const options = dataSource.options as any;
    logger.log(`🏢 HOST: ${options.host}`);
    logger.log(`🔌 PORTA: ${options.port}`);
    logger.log(`👤 USUÁRIO: ${options.username}`);
    logger.log(`🗄️  BANCO DE DADOS: ${options.database}`);
    logger.log(`📊 TIPO: ${options.type}`);
    
    try {
      // Verificar se a conexão está ativa
      if (dataSource.isInitialized) {
        logger.log('✅ Conexão com PostgreSQL estabelecida');
        logger.log(`🔗 URL de conexão: postgresql://${options.username}@${options.host}:${options.port}/${options.database}`);
        
        // Listar todas as tabelas
        const tables = await dataSource.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        logger.log(`📊 Tabelas encontradas no banco: ${tables.length}`);
        tables.forEach(table => {
          logger.log(`   - ${table.table_name}`);
        });
        
        // Verificar dados na tabela users
      const userCount = await dataSource.query('SELECT COUNT(*) as count FROM users');
      logger.log(`👥 Total de usuários na tabela 'users': ${userCount[0].count}`);
      
      if (userCount[0].count > 0) {
        const users = await dataSource.query('SELECT * FROM users ORDER BY id');
        logger.log('📋 DADOS ATUAIS DA TABELA USERS NO POSTGRESQL:');
        logger.log('='.repeat(60));
        users.forEach(user => {
          logger.log(`ID: ${user.id}`);
          logger.log(`Nome: ${user.full_name}`);
          logger.log(`Email: ${user.email}`);
          logger.log(`Senha Hash: ${user.password_hash}`);
          logger.log(`Verificado: ${user.is_verified}`);
          logger.log(`Ativo: ${user.is_active}`);
          logger.log(`Criado em: ${user.created_at}`);
          logger.log(`Atualizado em: ${user.updated_at}`);
          logger.log('-'.repeat(40));
        });
        logger.log('='.repeat(60));
      } else {
        logger.warn('⚠️  Tabela users está vazia! Criando dados de exemplo...');
        
        // Criar dados de exemplo
        const sampleUsers = [
          {
            full_name: 'Junio Silva',
            email: 'junio@exemplo.com',
            password_hash: 'senha123',
            is_verified: true,
            is_active: true
          },
          {
            full_name: 'Maria Santos',
            email: 'maria@exemplo.com',
            password_hash: 'senha456',
            is_verified: true,
            is_active: true
          },
          {
            full_name: 'Pedro Oliveira',
            email: 'pedro@exemplo.com',
            password_hash: 'senha789',
            is_verified: false,
            is_active: true
          }
        ];
        
        for (const user of sampleUsers) {
          logger.log(`🔄 INSERINDO USUÁRIO: ${user.full_name}`);
          logger.log(`📧 Email: ${user.email}`);
          logger.log(`🗄️  Executando no banco: ${options.database}`);
          logger.log(`🏢 Host: ${options.host}:${options.port}`);
          
          const insertQuery = `
            INSERT INTO users (full_name, email, password_hash, is_verified, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          `;
          
          logger.log(`📝 SQL Query: ${insertQuery}`);
          logger.log(`📊 Parâmetros: [${user.full_name}, ${user.email}, ${user.password_hash}, ${user.is_verified}, ${user.is_active}]`);
          
          try {
            const result = await dataSource.query(insertQuery, [user.full_name, user.email, user.password_hash, user.is_verified, user.is_active]);
            logger.log(`✅ SUCESSO: Usuário ${user.full_name} inserido no banco '${options.database}'`);
            logger.log(`📊 Resultado da inserção:`, result);
          } catch (insertError) {
            logger.error(`❌ ERRO ao inserir usuário ${user.full_name}:`, insertError);
          }
          
          logger.log('-'.repeat(50));
        }
        
        logger.log('🎉 Dados de exemplo criados com sucesso!');
        
        // Verificar novamente após inserção
         const newUserCount = await dataSource.query('SELECT COUNT(*) as count FROM users');
         logger.log(`👥 Total de usuários após inserção: ${newUserCount[0].count}`);
         
         // Mostrar todos os dados inseridos
         const allUsers = await dataSource.query('SELECT * FROM users ORDER BY id');
         logger.log('📋 DADOS COMPLETOS DA TABELA USERS NO POSTGRESQL:');
         logger.log('='.repeat(60));
         allUsers.forEach(user => {
           logger.log(`ID: ${user.id}`);
           logger.log(`Nome: ${user.full_name}`);
           logger.log(`Email: ${user.email}`);
           logger.log(`Senha Hash: ${user.password_hash}`);
           logger.log(`Verificado: ${user.is_verified}`);
           logger.log(`Ativo: ${user.is_active}`);
           logger.log(`Criado em: ${user.created_at}`);
           logger.log(`Atualizado em: ${user.updated_at}`);
           logger.log('-'.repeat(40));
         });
         logger.log('='.repeat(60));
       }
        
      } else {
        logger.error('❌ Conexão com PostgreSQL não foi estabelecida');
      }
    } catch (error) {
      logger.error(`❌ Erro ao verificar banco de dados: ${error.message}`);
    }
    
    const port = process.env.PORT ?? 3000;
    const host = process.env.HOST ?? '0.0.0.0'; // Permite acesso de qualquer IP na rede
    
    await app.listen(port, host);
    
    logger.log('📊 Configuração do banco:');
    logger.log('   - Host: localhost:5432');
    logger.log('   - Database: postgres');
    logger.log('   - Username: postgres');
    
    logger.log(`🌐 Aplicação rodando em: http://${host}:${port}`);
    logger.log(`🌍 Acesso na rede local: http://[SEU_IP]:${port}`);
    logger.log('📋 Endpoints disponíveis com novos aliases:');
    logger.log('   - GET    /v1/umx     - Listar todos os usuários (User Matrix Exchange)');
    logger.log('   - GET    /v1/tnt     - Listar todos os tenants');
    logger.log('   - GET    /v1/gpx     - Listar todos os grupos (Group Process Exchange)');
    logger.log('   - GET    /v1/gpcfg   - Configurações de grupos');
    logger.log('   - GET    /v1/toh     - Histórico de propriedade de tenants');
    logger.log('   - GET    /v1/ugx     - Vínculos usuário-grupo (User Group Crosslink)');
    logger.log('   - GET    /v1/uga     - Auditoria de vínculos usuário-grupo');
    logger.log('   - GET    /v1/uiv     - Convites de usuários (User Invite Vector)');
    logger.log('   - GET    /v1/usrx    - Sessões de usuários (User Session Registry Exchange)');
    logger.log('   - POST   /v1/auth/register - Registro de usuário com token por email');
    logger.log('   - POST   /v1/auth/verify   - Verificação de token de registro');
    logger.log('   - POST   /v1/auth/resend   - Reenvio de token de verificação');
    logger.log('💡 Use Postman ou curl para testar a API');
    
  } catch (error) {
    logger.error('❌ Erro ao iniciar aplicação:', error.message);
    logger.error('Stack:', error.stack);
    process.exit(1);
  }
}
bootstrap();
