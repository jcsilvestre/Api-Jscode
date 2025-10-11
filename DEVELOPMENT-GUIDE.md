# 🚀 Guia de Desenvolvimento - JCSCode API

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Setup Inicial](#setup-inicial)
- [Desenvolvimento Web](#desenvolvimento-web)
- [Desenvolvimento Mobile](#desenvolvimento-mobile)
- [Comandos Úteis](#comandos-úteis)
- [Debugging](#debugging)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

Este projeto utiliza **Docker** para garantir que todos os desenvolvedores tenham o mesmo ambiente, independente do sistema operacional. A arquitetura suporta:

- **🌐 Desenvolvimento Web**: API NestJS + Frontend (se aplicável)
- **📱 Desenvolvimento Mobile**: API NestJS + App React Native/Expo
- **🔄 Hot Reload**: Mudanças refletidas instantaneamente
- **🗄️ Banco de Dados**: PostgreSQL com dados persistentes
- **⚡ Cache**: Redis para performance
- **🔍 Debugging**: Suporte completo para debug

## 📋 Pré-requisitos

### Obrigatórios
- **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux)
- **Git** para controle de versão
- **Node.js 18+** (para desenvolvimento mobile)
- **VS Code** (recomendado) com extensões:
  - Docker
  - NestJS Files
  - TypeScript Importer
  - Thunder Client (para testes de API)

### Para Desenvolvimento Mobile
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (para Android)
- **Xcode** (para iOS - apenas macOS)

## 🚀 Setup Inicial

### 1. Clone o Repositório
```bash
git clone https://github.com/jcsilvestre/Api-Jscode.git
cd Api-Jscode
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env.development

# Edite as variáveis conforme necessário
# As configurações padrão já funcionam com Docker
```

### 3. Iniciar Docker Desktop
- **Windows/Mac**: Abra o Docker Desktop
- **Linux**: `sudo systemctl start docker`

### 4. Verificar Docker
```bash
docker --version
docker-compose --version
```

## 🌐 Desenvolvimento Web

### Iniciar Ambiente de Desenvolvimento
```bash
# Opção 1: Script automatizado (Linux/macOS)
chmod +x docker-start.sh
./docker-start.sh

# Opção 2: Script automatizado (Windows)
docker-start.bat

# Opção 3: Manual
docker-compose up -d
```

### Estrutura dos Serviços
- **🔗 API**: http://localhost:3000
- **🗄️ PostgreSQL**: localhost:5432
- **⚡ Redis**: localhost:6379
- **📊 Adminer** (DB Admin): http://localhost:8080

### Desenvolvimento da API

#### Hot Reload Ativo
O container da API está configurado com **hot reload**. Qualquer mudança no código será refletida automaticamente.

#### Comandos Principais
```bash
# Ver logs da API em tempo real
docker-compose logs -f api

# Executar comandos dentro do container
docker-compose exec api npm run test
docker-compose exec api npm run lint

# Acessar terminal do container
docker-compose exec api sh
```

#### Estrutura de Pastas
```
src/
├── auth/           # Autenticação e autorização
├── users/          # Gestão de usuários
├── groups/         # Gestão de grupos
├── tenants/        # Multi-tenancy
├── email/          # Serviço de email
├── database/       # Configurações do banco
└── common/         # Utilitários compartilhados
```

### Testando a API

#### Endpoints Principais
```bash
# Health Check
curl http://localhost:3000/health

# Documentação Swagger
http://localhost:3000/api

# Registro de usuário
POST http://localhost:3000/auth/register

# Login
POST http://localhost:3000/auth/login
```

#### Usando Thunder Client (VS Code)
1. Instale a extensão Thunder Client
2. Importe a collection (se disponível)
3. Configure a base URL: `http://localhost:3000`

## 📱 Desenvolvimento Mobile

### Setup do App Mobile
```bash
# Navegar para pasta mobile
cd ../mobile

# Instalar dependências
npm install

# Iniciar Expo
npm start
```

### Configuração da API para Mobile

#### 1. Descobrir IP da Máquina
```bash
# Windows
ipconfig | findstr "IPv4"

# Linux/macOS
ifconfig | grep "inet "
```

#### 2. Configurar URL da API no App
No arquivo de configuração do app mobile, use:
```typescript
// Exemplo: config/api.ts
const API_BASE_URL = 'http://SEU_IP_LOCAL:3000';
// Exemplo: 'http://192.168.1.100:3000'
```

#### 3. Testar Conectividade
```bash
# Do seu celular/emulador, teste:
curl http://SEU_IP_LOCAL:3000/health
```

### Desenvolvimento Simultâneo

#### Terminal 1: API (Docker)
```bash
cd js/
docker-compose up -d
docker-compose logs -f api
```

#### Terminal 2: Mobile App
```bash
cd mobile/
npm start
```

#### Terminal 3: Comandos Gerais
```bash
# Para comandos git, testes, etc.
```

## 🛠️ Comandos Úteis

### Docker
```bash
# Parar todos os containers
docker-compose down

# Rebuild completo (após mudanças no Dockerfile)
docker-compose up -d --build

# Ver status dos containers
docker-compose ps

# Limpar volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Ver logs de um serviço específico
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Banco de Dados
```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U jcscode -d jcscode_db

# Backup do banco
docker-compose exec postgres pg_dump -U jcscode jcscode_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U jcscode -d jcscode_db < backup.sql
```

### API
```bash
# Executar testes
docker-compose exec api npm run test

# Executar testes e2e
docker-compose exec api npm run test:e2e

# Verificar lint
docker-compose exec api npm run lint

# Gerar migration
docker-compose exec api npm run migration:generate -- -n NomeDaMigration

# Executar migrations
docker-compose exec api npm run migration:run
```

## 🐛 Debugging

### VS Code + Docker

#### 1. Configurar launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Attach to Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}/src",
      "remoteRoot": "/app/src",
      "protocol": "inspector"
    }
  ]
}
```

#### 2. Modificar docker-compose.yml (temporariamente)
```yaml
api:
  # ... outras configurações
  command: npm run start:debug
  ports:
    - "3000:3000"
    - "9229:9229"  # Porta de debug
```

#### 3. Iniciar Debug
1. `docker-compose up -d`
2. No VS Code: F5 ou "Run and Debug"
3. Coloque breakpoints no código
4. Faça requisições para a API

### Logs Detalhados
```bash
# Logs com timestamp
docker-compose logs -f -t api

# Logs das últimas 100 linhas
docker-compose logs --tail=100 api

# Logs de todos os serviços
docker-compose logs -f
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. "Port already in use"
```bash
# Verificar o que está usando a porta
netstat -tulpn | grep :3000

# Parar containers conflitantes
docker-compose down
```

#### 2. "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Reiniciar banco de dados
docker-compose restart postgres

# Ver logs do banco
docker-compose logs postgres
```

#### 3. "Module not found" após npm install
```bash
# Rebuild o container
docker-compose up -d --build api
```

#### 4. Mobile não conecta na API
```bash
# Verificar IP da máquina
ipconfig  # Windows
ifconfig  # Linux/macOS

# Testar conectividade
ping SEU_IP_LOCAL

# Verificar firewall (Windows)
# Permitir Node.js nas configurações do firewall
```

#### 5. Mudanças no código não refletem
```bash
# Verificar se o volume está montado corretamente
docker-compose config

# Reiniciar container da API
docker-compose restart api
```

### Limpeza Completa (Reset)
```bash
# CUIDADO: Isso apaga TODOS os dados!
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## 📚 Recursos Adicionais

### Documentação
- **NestJS**: https://nestjs.com/
- **TypeORM**: https://typeorm.io/
- **Docker**: https://docs.docker.com/
- **Expo**: https://docs.expo.dev/

### Extensões VS Code Recomendadas
```json
{
  "recommendations": [
    "ms-vscode.vscode-docker",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "rangav.vscode-thunder-client",
    "formulahendry.auto-rename-tag"
  ]
}
```

### Scripts Úteis
```bash
# Criar script personalizado
echo '#!/bin/bash
docker-compose up -d
echo "🚀 Ambiente iniciado!"
echo "📱 API: http://localhost:3000"
echo "🗄️ Adminer: http://localhost:8080"
' > start-dev.sh

chmod +x start-dev.sh
```

## 🤝 Workflow de Desenvolvimento

### Para Novos Desenvolvedores
1. **Clone** o repositório
2. **Configure** as variáveis de ambiente
3. **Execute** `docker-compose up -d`
4. **Teste** http://localhost:3000/health
5. **Comece** a desenvolver!

### Para Mudanças na API
1. **Faça** as alterações no código
2. **Teste** localmente (hot reload ativo)
3. **Execute** testes: `docker-compose exec api npm run test`
4. **Commit** e **push** as mudanças

### Para Desenvolvimento Mobile
1. **Inicie** a API com Docker
2. **Configure** o IP correto no app
3. **Execute** `npm start` na pasta mobile
4. **Teste** no dispositivo/emulador

## 🆘 Suporte

### Canais de Comunicação
- **Issues**: GitHub Issues para bugs
- **Discussões**: GitHub Discussions para dúvidas
- **Email**: suporte@jcscode.com

### Informações para Suporte
Ao reportar problemas, inclua:
```bash
# Versões
docker --version
node --version
npm --version

# Status dos containers
docker-compose ps

# Logs recentes
docker-compose logs --tail=50 api
```

---

## 🎉 Pronto para Desenvolver!

Com este guia, você tem tudo que precisa para:
- ✅ **Configurar** o ambiente de desenvolvimento
- ✅ **Desenvolver** para web e mobile
- ✅ **Debuggar** problemas
- ✅ **Colaborar** com a equipe

**Dica**: Mantenha este guia sempre atualizado conforme o projeto evolui!

---
*Última atualização: $(date)*