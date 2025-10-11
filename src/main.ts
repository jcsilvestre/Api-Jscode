import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SecurityLoggingInterceptor } from './common/interceptors/security-logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  logger.log('🚀 INICIANDO BOOTSTRAP DA APLICAÇÃO...');
  logger.log('🔧 VARIÁVEIS DE AMBIENTE:');
  logger.log('   NODE_ENV: ' + process.env.NODE_ENV);
  logger.log('   PORT: ' + process.env.PORT);
  logger.log('   HOST: ' + process.env.HOST);
  logger.log('   DATABASE_URL: ' + (process.env.DATABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA'));
  logger.log('   REDIS_URL: ' + (process.env.REDIS_URL ? 'DEFINIDA' : 'NÃO DEFINIDA'));

  try {
    logger.log('🏗️ CRIANDO APLICAÇÃO NESTJS...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    logger.log('✅ APLICAÇÃO NESTJS CRIADA COM SUCESSO');
    
    // Configurar Helmet para headers de segurança avançados
    logger.log('🔒 CONFIGURANDO HELMET...');
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Permitir estilos inline para compatibilidade
          scriptSrc: ["'self'", "'strict-dynamic'"], // Usar strict-dynamic para melhor segurança
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          fontSrc: ["'self'", "https:", "data:"],
          connectSrc: ["'self'", "https:", "wss:", "ws:"], // Para WebSockets e APIs
          mediaSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"], // Bloquear objetos embed
          frameSrc: ["'none'"], // Bloquear iframes
          baseUri: ["'self'"], // Restringir base URI
          formAction: ["'self'"], // Restringir ações de formulário
          upgradeInsecureRequests: [], // Forçar HTTPS em produção
        },
        reportOnly: false, // Definir como true para apenas reportar violações
      },
      crossOriginEmbedderPolicy: false, // Para compatibilidade com mobile
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Para APIs públicas
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' }, // Prevenir clickjacking
      hidePoweredBy: true, // Ocultar header X-Powered-By
      hsts: {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true, // X-Content-Type-Options: nosniff
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true, // X-XSS-Protection
    }));
    logger.log('✅ HELMET CONFIGURADO PARA SEGURANÇA');
    
    // Configurar cookie parser
    app.use(cookieParser());
    logger.log('✅ COOKIE PARSER CONFIGURADO');
    
    // Configurar CORS para permitir requisições do frontend e mobile
    logger.log('🌐 CONFIGURANDO CORS...');
    const configService = app.get(ConfigService);
    const isProduction = configService.get('NODE_ENV') === 'production';
    logger.log('📊 IS_PRODUCTION: ' + isProduction);
    
    const corsOrigins = isProduction ? [
      // Domínios de produção
      'https://www.jcscode.com',
      'https://jcscode.com',
      'https://app.jcscode.com',
      // Aplicações mobile em produção
      'capacitor://localhost',
      'ionic://localhost',
    ] : [
      // Desenvolvimento local
      'http://localhost:8081', 
      'http://127.0.0.1:8081',
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
    ];

    app.enableCors({
      origin: corsOrigins,
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
    logger.log('✅ CORS CONFIGURADO PARA WEB E MOBILE');
    
    // Configurar prefixo global da API apenas para rotas v1
    // Deixar /health e outras rotas básicas sem prefixo
    logger.log('🔗 CONFIGURANDO PREFIXO GLOBAL...');
    app.setGlobalPrefix('v1', {
      exclude: [
        { path: 'health', method: RequestMethod.GET },
        { path: '', method: RequestMethod.GET },
        { path: 'docs', method: RequestMethod.GET },
        { path: 'api', method: RequestMethod.GET },
        { path: 'api/(.*)', method: RequestMethod.GET },
      ]
    });
    logger.log('✅ PREFIXO GLOBAL CONFIGURADO: /v1 (excluindo health, docs, api e raiz)');
    
    // Configurar pipes globais para validação e sanitização
    logger.log('🔧 CONFIGURANDO PIPES DE VALIDAÇÃO...');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
      transform: true, // Transforma automaticamente tipos
      transformOptions: {
        enableImplicitConversion: true, // Conversão automática de tipos
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Oculta detalhes em produção
      validateCustomDecorators: true, // Valida decorators customizados
      stopAtFirstError: false, // Mostra todos os erros de validação
    }));
    
    logger.log('✅ PIPES DE VALIDAÇÃO CONFIGURADOS');
    
    // Configurar interceptors globais
    logger.log('📊 CONFIGURANDO INTERCEPTORS...');
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new SecurityLoggingInterceptor(),
    );
    logger.log('✅ INTERCEPTORS DE LOGGING E SEGURANÇA CONFIGURADOS');
    
    // Configurar filtro global de exceções
    logger.log('🛡️ CONFIGURANDO FILTRO DE EXCEÇÕES...');
    app.useGlobalFilters(new AllExceptionsFilter());
    logger.log('✅ FILTRO GLOBAL DE EXCEÇÕES CONFIGURADO');
    
    // Configurar Swagger/OpenAPI
    logger.log('📚 CONFIGURANDO SWAGGER/OPENAPI...');
    const config = new DocumentBuilder()
      .setTitle('JCS Code API')
      .setDescription('API completa para o sistema JCS Code com autenticação, usuários, projetos e muito mais')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Endpoints de autenticação')
      .addTag('users', 'Gerenciamento de usuários')
      .addTag('projects', 'Gerenciamento de projetos')
      .addTag('health', 'Health checks')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
    logger.log('✅ SWAGGER CONFIGURADO EM /api');
    
    // Verificar conexão e dados do banco
    logger.log('🗄️ VERIFICANDO CONEXÃO COM BANCO DE DADOS...');
    try {
      const dataSource = app.get(DataSource);
      logger.log('📊 DATASOURCE OBTIDO: ' + dataSource.isInitialized);
      
      // LOGS DETALHADOS DA CONEXÃO
      const options = dataSource.options as any;
      logger.log(`🏢 HOST: ${options.host}`);
      logger.log(`🔌 PORTA: ${options.port}`);
      logger.log(`👤 USUÁRIO: ${options.username}`);
      logger.log(`🗄️  BANCO DE DADOS: ${options.database}`);
      logger.log(`📊 TIPO: ${options.type}`);
      
      if (!dataSource.isInitialized) {
        logger.log('🔄 INICIALIZANDO DATASOURCE...');
        await dataSource.initialize();
        logger.log('✅ DATASOURCE INICIALIZADO COM SUCESSO');
      }
      
      // Verificar se consegue fazer uma query simples
      logger.log('🔍 TESTANDO QUERY NO BANCO...');
      const result = await dataSource.query('SELECT 1 as test');
      logger.log('✅ QUERY DE TESTE EXECUTADA: ' + JSON.stringify(result));
      
      // Verificar se a conexão está ativa
      if (dataSource.isInitialized) {
        logger.log('✅ Conexão com PostgreSQL estabelecida');
        logger.log(`🔗 URL de conexão: postgresql://${options.username}@${options.host}:${options.port}/${options.database}`);
        
        // Listar todas as tabelas
        logger.log('📋 LISTANDO TABELAS DISPONÍVEIS...');
        const tables = await dataSource.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);
        logger.log('📊 TABELAS ENCONTRADAS: ' + tables.map(t => t.table_name).join(', '));
        
        // Verificar se a tabela users existe e tem dados
        logger.log('👥 VERIFICANDO TABELA USERS...');
        const userCount = await dataSource.query('SELECT COUNT(*) as count FROM users');
        logger.log('📊 TOTAL DE USUÁRIOS: ' + userCount[0].count);
        
        // Se não há usuários, inserir dados de exemplo
        if (parseInt(userCount[0].count) === 0) {
          logger.log('➕ INSERINDO USUÁRIO DE EXEMPLO...');
          await dataSource.query(`
            INSERT INTO users (name, email, password, role, is_active, created_at, updated_at) 
            VALUES (
              'Admin User', 
              'admin@jcscode.com', 
              '$2b$10$example.hash.for.password123', 
              'admin', 
              true, 
              NOW(), 
              NOW()
            )
          `);
          logger.log('✅ USUÁRIO DE EXEMPLO INSERIDO');
        } else {
          // Mostrar dados existentes
          logger.log('📋 USUÁRIOS EXISTENTES:');
          const users = await dataSource.query('SELECT id, full_name, email, is_verified, is_active FROM users ORDER BY id LIMIT 5');
          users.forEach(user => {
            logger.log(`   - ID: ${user.id}, Nome: ${user.full_name}, Email: ${user.email}, Verificado: ${user.is_verified}, Ativo: ${user.is_active}`);
          });
        }
      } else {
        logger.error('❌ CONEXÃO COM BANCO NÃO ESTÁ ATIVA');
      }
    } catch (error) {
      logger.error('❌ ERRO NA VERIFICAÇÃO DO BANCO:', error.message);
      logger.error('🔍 STACK TRACE:', error.stack);
    }
    
    // Iniciar servidor
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    logger.log('🚀 INICIANDO SERVIDOR...');
    logger.log('🔧 CONFIGURAÇÕES DO SERVIDOR:');
    logger.log('   📍 HOST: ' + host);
    logger.log('   🔌 PORTA: ' + port);
    logger.log('   🌍 NODE_ENV: ' + process.env.NODE_ENV);
    
    await app.listen(port, host);
    
    logger.log('✅ SERVIDOR INICIADO COM SUCESSO!');
    logger.log('🌐 SERVIDOR RODANDO EM: http://' + host + ':' + port);
    logger.log('📚 SWAGGER DISPONÍVEL EM: http://' + host + ':' + port + '/api');
    logger.log('❤️  HEALTH CHECK EM: http://' + host + ':' + port + '/health');
    
    // Listar todas as rotas registradas
    logger.log('🛣️ ROTAS REGISTRADAS:');
    const server = app.getHttpServer();
    const router = server._events.request._router;
    if (router && router.stack) {
      router.stack.forEach((layer, index) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          logger.log(`   ${index + 1}. [${methods}] ${layer.route.path}`);
        }
      });
    } else {
      logger.log('   ⚠️ Não foi possível listar as rotas automaticamente');
    }
    
    logger.log('🎉 APLICAÇÃO PRONTA PARA RECEBER REQUISIÇÕES!');
  } catch (error) {
    logger.error('💥 ERRO FATAL AO INICIAR APLICAÇÃO:', error.message);
    logger.error('🔍 STACK TRACE COMPLETO:', error.stack);
    process.exit(1);
  }
}
bootstrap();
