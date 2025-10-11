#!/bin/bash

# JCSCode API - Development Environment Starter
# This script starts the complete development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}[JCSCODE]${NC} $1"
}

# Header
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 JCSCode API                           ║"
echo "║                Development Environment                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is running
log_info "Verificando se Docker está rodando..."
if ! docker info > /dev/null 2>&1; then
    log_error "Docker não está rodando!"
    log_info "Por favor, inicie o Docker Desktop e tente novamente."
    exit 1
fi
log_success "Docker está rodando ✓"

# Check if .env.development exists
if [ ! -f ".env.development" ]; then
    log_warning "Arquivo .env.development não encontrado!"
    if [ -f ".env.example" ]; then
        log_info "Copiando .env.example para .env.development..."
        cp .env.example .env.development
        log_success "Arquivo .env.development criado!"
        log_warning "⚠️  Configure as variáveis em .env.development antes de continuar"
    else
        log_error "Arquivo .env.example também não encontrado!"
        exit 1
    fi
fi

# Stop any running containers
log_info "Parando containers existentes..."
docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1 || true

# Build and start services
log_info "Construindo e iniciando serviços de desenvolvimento..."
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for services to be healthy
log_info "Aguardando serviços ficarem prontos..."
sleep 10

# Check service health
services=("postgres" "redis" "api")
for service in "${services[@]}"; do
    log_info "Verificando saúde do serviço: $service"
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.dev.yml ps $service | grep -q "healthy\|Up"; then
            log_success "✓ $service está pronto"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_warning "⚠️  $service pode não estar completamente pronto"
    fi
done

# Test API health endpoint
log_info "Testando endpoint de saúde da API..."
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log_success "✓ API está respondendo corretamente"
else
    log_warning "⚠️  API pode ainda estar inicializando..."
fi

# Display service URLs
echo -e "\n${GREEN}🎉 Ambiente de desenvolvimento iniciado com sucesso!${NC}\n"

echo -e "${CYAN}📋 Serviços Disponíveis:${NC}"
echo -e "  🔗 ${BLUE}API:${NC}                http://localhost:3000"
echo -e "  📚 ${BLUE}API Docs (Swagger):${NC} http://localhost:3000/api"
echo -e "  🏥 ${BLUE}Health Check:${NC}       http://localhost:3000/health"
echo -e "  🗄️  ${BLUE}Adminer (DB):${NC}       http://localhost:8080"
echo -e "  ⚡ ${BLUE}Redis Commander:${NC}    http://localhost:8081"
echo -e "  📧 ${BLUE}MailHog (Email):${NC}    http://localhost:8025"

echo -e "\n${CYAN}🔧 Credenciais de Desenvolvimento:${NC}"
echo -e "  ${YELLOW}PostgreSQL:${NC}"
echo -e "    Host: localhost:5432"
echo -e "    Database: jcscode_dev"
echo -e "    User: jcscode"
echo -e "    Password: dev123"
echo -e "  ${YELLOW}Redis:${NC}"
echo -e "    Host: localhost:6379"
echo -e "    Password: dev123"
echo -e "  ${YELLOW}Redis Commander:${NC}"
echo -e "    User: admin"
echo -e "    Password: dev123"

echo -e "\n${CYAN}📱 Para Desenvolvimento Mobile:${NC}"
echo -e "  1. Descubra seu IP local:"
echo -e "     ${YELLOW}Linux/macOS:${NC} ifconfig | grep 'inet '"
echo -e "     ${YELLOW}Windows:${NC}     ipconfig | findstr 'IPv4'"
echo -e "  2. Configure a URL da API no app mobile:"
echo -e "     ${YELLOW}http://SEU_IP_LOCAL:3000${NC}"

echo -e "\n${CYAN}🛠️  Comandos Úteis:${NC}"
echo -e "  ${YELLOW}Ver logs da API:${NC}        docker-compose -f docker-compose.dev.yml logs -f api"
echo -e "  ${YELLOW}Executar testes:${NC}        docker-compose -f docker-compose.dev.yml exec api npm run test"
echo -e "  ${YELLOW}Acessar container:${NC}      docker-compose -f docker-compose.dev.yml exec api sh"
echo -e "  ${YELLOW}Parar ambiente:${NC}         docker-compose -f docker-compose.dev.yml down"
echo -e "  ${YELLOW}Rebuild completo:${NC}       docker-compose -f docker-compose.dev.yml up -d --build"

echo -e "\n${GREEN}🚀 Pronto para desenvolver!${NC}"
echo -e "   Hot reload está ativo - suas mudanças serão refletidas automaticamente"
echo -e "   Debug port: 9229 (configure seu IDE para conectar)"

# Show recent API logs
echo -e "\n${CYAN}📋 Logs recentes da API:${NC}"
docker-compose -f docker-compose.dev.yml logs --tail=10 api