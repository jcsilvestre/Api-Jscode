@echo off
echo 🚀 Iniciando API-Jscode com Docker...

REM Parar containers existentes se estiverem rodando
echo 📦 Parando containers existentes...
docker-compose down

REM Limpar volumes órfãos (opcional)
echo 🧹 Limpando volumes órfãos...
docker volume prune -f

REM Construir e iniciar os serviços
echo 🔨 Construindo e iniciando serviços...
docker-compose up --build -d

REM Aguardar os serviços ficarem prontos
echo ⏳ Aguardando serviços ficarem prontos...
timeout /t 30 /nobreak > nul

REM Verificar status dos containers
echo 📊 Status dos containers:
docker-compose ps

REM Verificar logs da aplicação
echo 📝 Últimos logs da aplicação:
docker-compose logs --tail=20 api

REM Testar endpoints
echo 🧪 Testando endpoints...
echo Health Check:
curl -s http://localhost/health

echo.
echo Usuários:
curl -s http://localhost/users

echo.
echo.
echo ✅ Ambiente Docker iniciado com sucesso!
echo 🌐 API disponível em: http://localhost
echo 🗄️  PostgreSQL disponível em: localhost:5432
echo 📚 Para ver logs: docker-compose logs -f
echo 🛑 Para parar: docker-compose down

pause