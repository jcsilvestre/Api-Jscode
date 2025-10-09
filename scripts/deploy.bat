@echo off
REM Script de deploy automatizado para produção - Windows
REM JCSCode API - Docker Production Deployment

setlocal enabledelayedexpansion

echo [%date% %time%] 🚀 Iniciando deploy da JCSCode API em produção...

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker não está rodando. Inicie o Docker e tente novamente.
    exit /b 1
)

REM Parar containers existentes
echo [%date% %time%] 📦 Parando containers existentes...
docker-compose -f docker-compose.prod.yml down --remove-orphans

REM Fazer backup do banco antes do deploy (se existir)
docker volume ls | findstr "js_postgres_data" >nul
if not errorlevel 1 (
    echo [%date% %time%] 💾 Fazendo backup do banco de dados...
    docker-compose -f docker-compose.prod.yml run --rm backup /scripts/backup.sh
)

REM Limpar imagens antigas
echo [%date% %time%] 🧹 Limpando imagens Docker antigas...
docker system prune -f
docker image prune -f

REM Build das imagens
echo [%date% %time%] 🔨 Construindo imagens Docker...
docker-compose -f docker-compose.prod.yml build --no-cache

REM Verificar se as variáveis de ambiente estão configuradas
if not exist ".env.production" (
    echo [ERROR] Arquivo .env.production não encontrado!
    exit /b 1
)

REM Iniciar serviços
echo [%date% %time%] 🚀 Iniciando serviços em produção...
docker-compose -f docker-compose.prod.yml up -d

REM Aguardar serviços ficarem prontos
echo [%date% %time%] ⏳ Aguardando serviços ficarem prontos...
timeout /t 30 /nobreak >nul

REM Verificar health checks
echo [%date% %time%] 🔍 Verificando status dos serviços...
for /l %%i in (1,1,10) do (
    docker-compose -f docker-compose.prod.yml ps | findstr "healthy" >nul
    if not errorlevel 1 (
        echo [%date% %time%] ✅ Serviços estão saudáveis!
        goto :healthy
    )
    
    if %%i==10 (
        echo [ERROR] ❌ Serviços não ficaram saudáveis após 5 minutos
        docker-compose -f docker-compose.prod.yml logs
        exit /b 1
    )
    
    echo [INFO] Tentativa %%i/10 - Aguardando serviços...
    timeout /t 30 /nobreak >nul
)

:healthy
REM Testar endpoint de health
echo [%date% %time%] 🩺 Testando endpoint de saúde...
curl -f http://localhost/health >nul 2>&1
if not errorlevel 1 (
    echo [%date% %time%] ✅ API está respondendo corretamente!
) else (
    echo [WARNING] ⚠️  Endpoint de saúde não está respondendo via HTTP
)

REM Mostrar status final
echo [%date% %time%] 📊 Status final dos containers:
docker-compose -f docker-compose.prod.yml ps

REM Mostrar logs recentes
echo [%date% %time%] 📝 Logs recentes da API:
docker-compose -f docker-compose.prod.yml logs --tail=20 api

echo [%date% %time%] 🎉 Deploy concluído com sucesso!
echo [%date% %time%] 🌐 API disponível em: https://api.jcscode.com
echo [%date% %time%] 📊 Monitoramento: docker-compose -f docker-compose.prod.yml logs -f

echo.
echo 📋 Comandos úteis:
echo   • Ver logs: docker-compose -f docker-compose.prod.yml logs -f
echo   • Parar: docker-compose -f docker-compose.prod.yml down
echo   • Reiniciar: docker-compose -f docker-compose.prod.yml restart
echo   • Status: docker-compose -f docker-compose.prod.yml ps
echo   • Backup: docker-compose -f docker-compose.prod.yml run --rm backup /scripts/backup.sh

pause