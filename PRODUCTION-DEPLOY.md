# 🚀 Guia de Deploy em Produção - JCSCode API

## 📋 Pré-requisitos

### Sistema Operacional
- **Linux**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Windows**: Windows Server 2019+ / Windows 10 Pro+
- **macOS**: macOS 10.15+

### Software Necessário
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **Curl/Wget**: Para testes de conectividade

### Recursos Mínimos do Servidor
- **CPU**: 2 cores (4 cores recomendado)
- **RAM**: 4GB (8GB recomendado)
- **Armazenamento**: 50GB SSD (100GB recomendado)
- **Rede**: Conexão estável com internet

## 🔧 Configuração Inicial

### 1. Preparar o Servidor

```bash
# Atualizar sistema (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

### 2. Clonar o Repositório

```bash
git clone https://github.com/jcsilvestre/Api-Jscode.git
cd Api-Jscode
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production.example .env.production

# Editar variáveis (IMPORTANTE: Alterar senhas!)
nano .env.production
```

**⚠️ IMPORTANTE**: Altere as seguintes variáveis:
- `DB_PASSWORD`: Senha segura para PostgreSQL
- `REDIS_PASSWORD`: Senha segura para Redis
- `JWT_SECRET`: Chave secreta única para JWT
- `JWT_REFRESH_SECRET`: Chave secreta para refresh tokens

## 🚀 Deploy Automatizado

### Opção 1: Script Linux/macOS
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Opção 2: Script Windows
```cmd
scripts\deploy.bat
```

### Opção 3: Deploy Manual
```bash
# Parar containers existentes
docker-compose -f docker-compose.prod.yml down

# Build e iniciar
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

## 🔍 Verificação do Deploy

### 1. Verificar Containers
```bash
docker-compose -f docker-compose.prod.yml ps
```

Todos os containers devem estar com status `Up` e `healthy`.

### 2. Testar Endpoints
```bash
# Health check
curl http://localhost/health

# API status
curl http://localhost/v1/health
```

### 3. Verificar Logs
```bash
# Logs da API
docker-compose -f docker-compose.prod.yml logs api

# Logs do Nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Logs do PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres
```

## 🔒 Configuração SSL/HTTPS

### 1. Certificados SSL
Coloque os certificados SSL na pasta `ssl/`:
```
ssl/
├── certs/
│   └── jcscode.com.crt
└── private/
    └── jcscode.com.key
```

### 2. Configuração Nginx
O Nginx está configurado para:
- Redirecionar HTTP para HTTPS
- Servir certificados SSL
- Proxy reverso para a API

## 📊 Monitoramento

### Comandos Úteis
```bash
# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Uso de recursos
docker stats

# Reiniciar serviço específico
docker-compose -f docker-compose.prod.yml restart api
```

### Health Checks
- **API**: `http://localhost:3000/health`
- **Nginx**: Configurado automaticamente
- **PostgreSQL**: Verificação interna
- **Redis**: Verificação interna

## 💾 Backup e Restauração

### Backup Automático
```bash
# Executar backup manual
docker-compose -f docker-compose.prod.yml run --rm backup /scripts/backup.sh

# Backups são salvos em ./backups/
```

### Restauração
```bash
# Restaurar backup específico
docker exec -i jcscode-postgres psql -U postgres -d jcscode_prod < backups/backup_jcscode_prod_20240101_120000.sql
```

## 🔄 Atualizações

### Deploy de Nova Versão
```bash
# Fazer backup antes da atualização
docker-compose -f docker-compose.prod.yml run --rm backup /scripts/backup.sh

# Atualizar código
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🛠️ Manutenção

### Limpeza do Sistema
```bash
# Limpar containers parados
docker container prune -f

# Limpar imagens não utilizadas
docker image prune -f

# Limpar volumes não utilizados (CUIDADO!)
docker volume prune -f
```

### Logs e Rotação
Os logs são automaticamente rotacionados:
- **Tamanho máximo**: 10MB por arquivo
- **Arquivos mantidos**: 3 por container
- **Localização**: `/var/lib/docker/containers/`

## 🚨 Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs [service_name]

# Verificar recursos
docker stats
free -h
df -h
```

#### Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Testar conexão
docker exec -it jcscode-postgres psql -U postgres -d jcscode_prod
```

#### API não responde
```bash
# Verificar logs da API
docker-compose -f docker-compose.prod.yml logs api

# Verificar se porta está aberta
netstat -tlnp | grep :3000
```

### Comandos de Emergência
```bash
# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Restart completo
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Rebuild completo (em caso de problemas)
docker-compose -f docker-compose.prod.yml down
docker system prune -f
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📞 Suporte

### Logs Importantes
- **Aplicação**: `docker-compose -f docker-compose.prod.yml logs api`
- **Nginx**: `docker-compose -f docker-compose.prod.yml logs nginx`
- **PostgreSQL**: `docker-compose -f docker-compose.prod.yml logs postgres`
- **Redis**: `docker-compose -f docker-compose.prod.yml logs redis`

### Informações do Sistema
```bash
# Versões
docker --version
docker-compose --version

# Recursos
docker system df
docker system info
```

## 🔐 Segurança

### Checklist de Segurança
- [ ] Senhas alteradas no `.env.production`
- [ ] Firewall configurado (portas 80, 443)
- [ ] SSL/HTTPS configurado
- [ ] Backups automáticos funcionando
- [ ] Logs sendo monitorados
- [ ] Atualizações de segurança aplicadas

### Portas Expostas
- **80**: HTTP (redireciona para HTTPS)
- **443**: HTTPS
- **Internas**: 3000 (API), 5432 (PostgreSQL), 6379 (Redis)

---

## 📈 Performance

### Otimizações Aplicadas
- **Multi-stage Docker build**
- **Resource limits** nos containers
- **Health checks** configurados
- **Log rotation** automática
- **Compressão** habilitada no Nginx
- **Cache Redis** configurado

### Monitoramento de Performance
```bash
# CPU e Memória
docker stats --no-stream

# Espaço em disco
df -h

# Logs de performance
docker-compose -f docker-compose.prod.yml logs api | grep -i performance
```

---

**🎉 Deploy concluído com sucesso!**

Sua API JCSCode está agora rodando 24/7 em produção com:
- ✅ Alta disponibilidade
- ✅ Backup automático
- ✅ Monitoramento
- ✅ SSL/HTTPS
- ✅ Restart automático
- ✅ Logs estruturados