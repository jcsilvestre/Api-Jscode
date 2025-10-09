# Guia de Deploy Profissional - JCS Code API

## 📋 Visão Geral

Este guia detalha como configurar e fazer deploy da API JCS Code usando o domínio profissional `api.jcscode.com`.

## 🌐 Configuração de DNS

### Registros DNS Necessários

Configure os seguintes registros DNS no seu provedor de domínio:

```dns
# Registro A para API
api.jcscode.com.     A     [SEU_IP_DO_SERVIDOR]

# Registro A para site principal
www.jcscode.com.     A     [SEU_IP_DO_SERVIDOR]
jcscode.com.         A     [SEU_IP_DO_SERVIDOR]

# Registro CNAME alternativo (se preferir)
api.jcscode.com.     CNAME [SEU_SERVIDOR.exemplo.com]

# Registros para subdomínios adicionais (opcional)
app.jcscode.com.     A     [SEU_IP_DO_SERVIDOR]
admin.jcscode.com.   A     [SEU_IP_DO_SERVIDOR]
```

### Verificação de DNS

Após configurar, verifique se os registros estão propagados:

```bash
# Verificar registro A
nslookup api.jcscode.com

# Verificar propagação global
dig api.jcscode.com @8.8.8.8
dig api.jcscode.com @1.1.1.1
```

## 🔒 Configuração SSL/HTTPS

### 1. Obter Certificados SSL

#### Opção A: Let's Encrypt (Gratuito)

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d api.jcscode.com -d www.jcscode.com -d jcscode.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Opção B: Certificado Comercial

1. Gere uma CSR (Certificate Signing Request)
2. Compre o certificado de uma CA confiável
3. Coloque os arquivos nos caminhos configurados:
   - `/etc/ssl/certs/jcscode.com.crt`
   - `/etc/ssl/private/jcscode.com.key`

### 2. Configuração de Certificados no Docker

Crie o diretório SSL e copie os certificados:

```bash
mkdir -p ./ssl/certs ./ssl/private
cp /etc/ssl/certs/jcscode.com.crt ./ssl/certs/
cp /etc/ssl/private/jcscode.com.key ./ssl/private/
```

## 🐳 Deploy com Docker

### 1. Preparação do Ambiente

```bash
# Clone o repositório
git clone [SEU_REPOSITORIO]
cd js

# Configure as variáveis de ambiente
cp .env.example .env.production
nano .env.production
```

### 2. Configuração das Variáveis de Ambiente

Edite o arquivo `.env.production`:

```env
# Aplicação
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
APP_URL=https://api.jcscode.com
FRONTEND_URL=https://www.jcscode.com

# SSL
SSL_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/jcscode.com.crt
SSL_KEY_PATH=/etc/ssl/private/jcscode.com.key

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=jcscode_user
DB_PASSWORD=[SENHA_SEGURA]
DB_DATABASE=jcscode_api

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=[SENHA_REDIS]

# JWT
JWT_SECRET=[CHAVE_JWT_SEGURA]
JWT_EXPIRES_IN=7d

# Email (configure conforme seu provedor)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=[SEU_EMAIL]
MAIL_PASS=[SUA_SENHA_APP]
MAIL_FROM=[SEU_EMAIL]
```

### 3. Build e Deploy

```bash
# Build da aplicação
npm run build

# Deploy com Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Configuração do Servidor

### 1. Requisitos do Sistema

- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Mínimo 2GB (Recomendado 4GB+)
- **CPU**: 2 cores (Recomendado 4+ cores)
- **Disco**: 20GB+ SSD
- **Rede**: IP público estático

### 2. Instalação de Dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Node.js (para build local)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Configuração de Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Ou iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## 📊 Monitoramento e Logs

### 1. Verificação de Saúde

```bash
# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Logs da aplicação
docker-compose -f docker-compose.prod.yml logs api

# Logs do Nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Health check manual
curl -f https://api.jcscode.com/health
```

### 2. Monitoramento Contínuo

```bash
# Monitorar logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Verificar uso de recursos
docker stats

# Verificar espaço em disco
df -h
```

## 🔄 Backup e Recuperação

### 1. Backup do Banco de Dados

```bash
# Backup manual
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U jcscode_user jcscode_api > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup automático (cron)
0 2 * * * cd /path/to/project && docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U jcscode_user jcscode_api > backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

### 2. Restauração

```bash
# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U jcscode_user jcscode_api < backup_file.sql
```

## 🚀 Atualizações e Manutenção

### 1. Atualização da Aplicação

```bash
# Pull das mudanças
git pull origin main

# Rebuild e redeploy
docker-compose -f docker-compose.prod.yml down
npm run build
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. Manutenção Preventiva

```bash
# Limpeza de containers antigos
docker system prune -a

# Limpeza de volumes não utilizados
docker volume prune

# Atualização de imagens
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de SSL**: Verifique se os certificados estão no local correto
2. **Erro de DNS**: Aguarde propagação (até 48h) ou verifique configuração
3. **Erro de CORS**: Verifique se o domínio está configurado no `main.ts`
4. **Erro de Banco**: Verifique credenciais e conectividade

### Comandos Úteis

```bash
# Verificar configuração do Nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Recarregar configuração do Nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

# Verificar conectividade do banco
docker-compose -f docker-compose.prod.yml exec api npm run typeorm:show

# Verificar variáveis de ambiente
docker-compose -f docker-compose.prod.yml exec api env | grep -E "(NODE_ENV|APP_URL|DB_)"
```

## 📞 Suporte

Para suporte adicional:
- Documentação da API: `https://api.jcscode.com/docs`
- Health Check: `https://api.jcscode.com/health`
- Logs de erro: Verifique os logs do Docker

---

**Nota**: Substitua `[SEU_IP_DO_SERVIDOR]`, `[SENHA_SEGURA]`, etc. pelos valores reais do seu ambiente.