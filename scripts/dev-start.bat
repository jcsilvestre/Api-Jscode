@echo off
setlocal enabledelayedexpansion

REM JCSCode API - Development Environment Starter (Windows)
REM This script starts the complete development environment

title JCSCode API - Development Environment

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 JCSCode API                           ║
echo ║                Development Environment                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker is running
echo [INFO] Verificando se Docker está rodando...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker não está rodando!
    echo [INFO] Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)
echo [SUCCESS] Docker está rodando ✓

REM Check if .env.development exists
if not exist ".env.development" (
    echo [WARNING] Arquivo .env.development não encontrado!
    if exist ".env.example" (
        echo [INFO] Copiando .env.example para .env.development...
        copy ".env.example" ".env.development" >nul
        echo [SUCCESS] Arquivo .env.development criado!
        echo [WARNING] ⚠️  Configure as variáveis em .env.development antes de continuar
    ) else (
        echo [ERROR] Arquivo .env.example também não encontrado!
        pause
        exit /b 1
    )
)

REM Stop any running containers
echo [INFO] Parando containers existentes...
docker-compose -f docker-compose.dev.yml down >nul 2>&1

REM Build and start services
echo [INFO] Construindo e iniciando serviços de desenvolvimento...
docker-compose -f docker-compose.dev.yml up -d --build

REM Wait for services to be healthy
echo [INFO] Aguardando serviços ficarem prontos...
timeout /t 10 /nobreak >nul

REM Check service health
echo [INFO] Verificando saúde dos serviços...
timeout /t 15 /nobreak >nul

REM Test API health endpoint
echo [INFO] Testando endpoint de saúde da API...
timeout /t 5 /nobreak >nul
curl -f http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] ⚠️  API pode ainda estar inicializando...
) else (
    echo [SUCCESS] ✓ API está respondendo corretamente
)

echo.
echo 🎉 Ambiente de desenvolvimento iniciado com sucesso!
echo.

echo 📋 Serviços Disponíveis:
echo   🔗 API:                http://localhost:3000
echo   📚 API Docs (Swagger): http://localhost:3000/api
echo   🏥 Health Check:       http://localhost:3000/health
echo   🗄️  Adminer (DB):       http://localhost:8080
echo   ⚡ Redis Commander:    http://localhost:8081
echo   📧 MailHog (Email):    http://localhost:8025
echo.

echo 🔧 Credenciais de Desenvolvimento:
echo   PostgreSQL:
echo     Host: localhost:5432
echo     Database: jcscode_dev
echo     User: jcscode
echo     Password: dev123
echo   Redis:
echo     Host: localhost:6379
echo     Password: dev123
echo   Redis Commander:
echo     User: admin
echo     Password: dev123
echo.

echo 📱 Para Desenvolvimento Mobile:
echo   1. Descubra seu IP local:
echo      ipconfig ^| findstr "IPv4"
echo   2. Configure a URL da API no app mobile:
echo      http://SEU_IP_LOCAL:3000
echo.

echo 🛠️  Comandos Úteis:
echo   Ver logs da API:        docker-compose -f docker-compose.dev.yml logs -f api
echo   Executar testes:        docker-compose -f docker-compose.dev.yml exec api npm run test
echo   Acessar container:      docker-compose -f docker-compose.dev.yml exec api sh
echo   Parar ambiente:         docker-compose -f docker-compose.dev.yml down
echo   Rebuild completo:       docker-compose -f docker-compose.dev.yml up -d --build
echo.

echo 🚀 Pronto para desenvolver!
echo    Hot reload está ativo - suas mudanças serão refletidas automaticamente
echo    Debug port: 9229 (configure seu IDE para conectar)
echo.

echo 📋 Logs recentes da API:
docker-compose -f docker-compose.dev.yml logs --tail=10 api

echo.
echo Pressione qualquer tecla para continuar...
pause >nul