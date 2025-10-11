@echo off
setlocal enabledelayedexpansion

title JCSCode API - Docker Fix & Start

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🔧 JCSCode API                           ║
echo ║                Docker Fix & Diagnostics                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker Desktop is installed
echo [INFO] Verificando instalação do Docker...
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker não está instalado!
    echo [INFO] Por favor, instale o Docker Desktop:
    echo         https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo [SUCCESS] Docker está instalado ✓

REM Try to start Docker Desktop
echo [INFO] Tentando iniciar Docker Desktop...
echo [WARNING] Se o Docker Desktop não abrir automaticamente, abra-o manualmente!

REM Try different paths for Docker Desktop
set "DOCKER_DESKTOP_PATH="
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    set "DOCKER_DESKTOP_PATH=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
) else if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" (
    set "DOCKER_DESKTOP_PATH=%LOCALAPPDATA%\Docker\Docker Desktop.exe"
) else if exist "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe" (
    set "DOCKER_DESKTOP_PATH=%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"
)

if defined DOCKER_DESKTOP_PATH (
    echo [INFO] Iniciando Docker Desktop...
    start "" "!DOCKER_DESKTOP_PATH!"
    echo [INFO] Docker Desktop foi iniciado. Aguardando...
) else (
    echo [WARNING] Não foi possível encontrar o Docker Desktop automaticamente.
    echo [INFO] Por favor, abra o Docker Desktop manualmente e aguarde ele inicializar.
)

REM Wait for Docker to be ready
echo [INFO] Aguardando Docker ficar pronto...
set /a timeout=60
:wait_docker
docker info >nul 2>&1
if not errorlevel 1 goto docker_ready
timeout /t 2 /nobreak >nul
set /a timeout-=2
if !timeout! gtr 0 goto wait_docker

echo [ERROR] Docker não ficou pronto em 60 segundos!
echo [INFO] Verifique se o Docker Desktop está rodando e tente novamente.
pause
exit /b 1

:docker_ready
echo [SUCCESS] Docker está pronto! ✓

REM Stop any existing containers
echo [INFO] Parando containers existentes...
docker-compose down >nul 2>&1
docker-compose -f docker-compose.dev.yml down >nul 2>&1
docker-compose -f docker-compose.prod.yml down >nul 2>&1

REM Clean up old containers and images
echo [INFO] Limpando containers e imagens antigas...
docker container prune -f >nul 2>&1
docker image prune -f >nul 2>&1

REM Check which compose file to use
set "COMPOSE_FILE=docker-compose.yml"
if exist "docker-compose.dev.yml" (
    echo [INFO] Usando docker-compose.dev.yml para desenvolvimento...
    set "COMPOSE_FILE=docker-compose.dev.yml"
)

REM Build and start containers
echo [INFO] Construindo e iniciando containers...
docker-compose -f !COMPOSE_FILE! up -d --build

if errorlevel 1 (
    echo [ERROR] Falha ao iniciar containers!
    echo [INFO] Verificando logs...
    docker-compose -f !COMPOSE_FILE! logs
    pause
    exit /b 1
)

REM Wait for services to be ready
echo [INFO] Aguardando serviços ficarem prontos...
timeout /t 15 /nobreak >nul

REM Check container status
echo [INFO] Status dos containers:
docker-compose -f !COMPOSE_FILE! ps

REM Test API endpoints
echo.
echo [INFO] Testando endpoints da API...

REM Test direct API port
echo [INFO] Testando http://localhost:3000/health...
curl -f -s http://localhost:3000/health >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] ✓ API está respondendo em http://localhost:3000
) else (
    echo [WARNING] ⚠️  API não está respondendo em http://localhost:3000
)

REM Test nginx proxy (if exists)
echo [INFO] Testando http://localhost/health...
curl -f -s http://localhost/health >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] ✓ Nginx proxy está funcionando em http://localhost
) else (
    echo [WARNING] ⚠️  Nginx proxy não está respondendo em http://localhost
)

REM Test Swagger docs
echo [INFO] Testando http://localhost:3000/api...
curl -f -s http://localhost:3000/api >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] ✓ Swagger docs disponível em http://localhost:3000/api
) else (
    echo [WARNING] ⚠️  Swagger docs não está disponível
)

echo.
echo 📋 Serviços Disponíveis:
echo   🔗 API Direta:         http://localhost:3000
echo   🏥 Health Check:       http://localhost:3000/health
echo   📚 API Docs (Swagger): http://localhost:3000/api
echo   🌐 Nginx Proxy:        http://localhost (se configurado)

REM Show recent logs
echo.
echo 📋 Logs recentes da API:
docker-compose -f !COMPOSE_FILE! logs --tail=10 api

echo.
echo 🛠️  Comandos úteis:
echo   Ver logs:              docker-compose -f !COMPOSE_FILE! logs -f api
echo   Parar containers:      docker-compose -f !COMPOSE_FILE! down
echo   Reiniciar:             docker-compose -f !COMPOSE_FILE! restart api
echo   Status:                docker-compose -f !COMPOSE_FILE! ps

echo.
if exist "docker-compose.dev.yml" (
    echo 🚀 Ambiente de DESENVOLVIMENTO iniciado!
    echo    Hot reload está ativo - suas mudanças serão refletidas automaticamente
) else (
    echo 🚀 Ambiente iniciado!
)

echo.
echo Pressione qualquer tecla para continuar...
pause >nul