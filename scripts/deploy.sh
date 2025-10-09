#!/bin/bash

# Script de deploy automatizado para produção
# JCSCode API - Docker Production Deployment

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log colorido
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    error "Docker não está rodando. Inicie o Docker e tente novamente."
    exit 1
fi

log "🚀 Iniciando deploy da JCSCode API em produção..."

# Parar containers existentes
log "📦 Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Fazer backup do banco antes do deploy (se existir)
if docker volume ls | grep -q "js_postgres_data"; then
    log "💾 Fazendo backup do banco de dados..."
    docker-compose -f docker-compose.prod.yml run --rm backup /scripts/backup.sh || warning "Backup falhou, continuando..."
fi

# Limpar imagens antigas
log "🧹 Limpando imagens Docker antigas..."
docker system prune -f
docker image prune -f

# Build das imagens
log "🔨 Construindo imagens Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Verificar se as variáveis de ambiente estão configuradas
if [ ! -f ".env.production" ]; then
    error "Arquivo .env.production não encontrado!"
    exit 1
fi

# Iniciar serviços
log "🚀 Iniciando serviços em produção..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar serviços ficarem prontos
log "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar health checks
log "🔍 Verificando status dos serviços..."
for i in {1..10}; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
        log "✅ Serviços estão saudáveis!"
        break
    fi
    
    if [ $i -eq 10 ]; then
        error "❌ Serviços não ficaram saudáveis após 5 minutos"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
    
    info "Tentativa $i/10 - Aguardando serviços..."
    sleep 30
done

# Testar endpoint de health
log "🩺 Testando endpoint de saúde..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    log "✅ API está respondendo corretamente!"
else
    warning "⚠️  Endpoint de saúde não está respondendo via HTTP"
fi

# Mostrar status final
log "📊 Status final dos containers:"
docker-compose -f docker-compose.prod.yml ps

# Mostrar logs recentes
log "📝 Logs recentes da API:"
docker-compose -f docker-compose.prod.yml logs --tail=20 api

log "🎉 Deploy concluído com sucesso!"
log "🌐 API disponível em: https://api.jcscode.com"
log "📊 Monitoramento: docker-compose -f docker-compose.prod.yml logs -f"

# Informações úteis
info "📋 Comandos úteis:"
info "  • Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
info "  • Parar: docker-compose -f docker-compose.prod.yml down"
info "  • Reiniciar: docker-compose -f docker-compose.prod.yml restart"
info "  • Status: docker-compose -f docker-compose.prod.yml ps"
info "  • Backup: docker-compose -f docker-compose.prod.yml run --rm backup /scripts/backup.sh"