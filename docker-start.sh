#!/bin/bash

echo "🚀 Iniciando API-Jscode com Docker..."

# Parar containers existentes se estiverem rodando
echo "📦 Parando containers existentes..."
docker-compose down

# Limpar volumes órfãos (opcional)
echo "🧹 Limpando volumes órfãos..."
docker volume prune -f

# Construir e iniciar os serviços
echo "🔨 Construindo e iniciando serviços..."
docker-compose up --build -d

# Aguardar os serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status dos containers
echo "📊 Status dos containers:"
docker-compose ps

# Verificar logs da aplicação
echo "📝 Últimos logs da aplicação:"
docker-compose logs --tail=20 api

# Testar endpoints
echo "🧪 Testando endpoints..."
echo "Health Check:"
curl -s http://localhost/health || echo "❌ Health check falhou"

echo -e "\nUsuários:"
curl -s http://localhost/users || echo "❌ Endpoint de usuários falhou"

echo -e "\n\n✅ Ambiente Docker iniciado com sucesso!"
echo "🌐 API disponível em: http://localhost"
echo "🗄️  PostgreSQL disponível em: localhost:5432"
echo "📚 Para ver logs: docker-compose logs -f"
echo "🛑 Para parar: docker-compose down"