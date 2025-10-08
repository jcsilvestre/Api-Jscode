# 🐳 Configuração do Docker para API-Jscode

## Pré-requisitos

### 1. Instalar Docker Desktop
- Baixe o Docker Desktop para Windows: https://www.docker.com/products/docker-desktop/
- Execute o instalador como administrador
- Reinicie o computador após a instalação

### 2. Verificar Instalação
Após reiniciar, abra um novo PowerShell e execute:
```powershell
docker --version
docker compose version
```

### 3. Iniciar Docker Desktop
- Abra o Docker Desktop
- Aguarde até que o status mostre "Docker Desktop is running"
- Certifique-se de que o WSL 2 está habilitado (recomendado)

## 🚀 Como Executar o Projeto

### Opção 1: Script Automático (Windows)
```batch
.\docker-start.bat
```

### Opção 2: Comandos Manuais
```powershell
# Parar containers existentes (se houver)
docker compose down

# Construir e iniciar todos os serviços
docker compose up --build -d

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f api
```

## 📋 Serviços Incluídos

### 🔧 PostgreSQL
- **Porta:** 5432
- **Usuário:** postgres
- **Senha:** postgres123
- **Database:** api_jscode

### 🌐 API NestJS
- **Porta Interna:** 3000
- **Acesso via Nginx:** http://localhost

### 🔀 Nginx (Reverse Proxy)
- **Porta:** 80
- **Configuração:** Load balancer e proxy reverso

## 🧪 Testando a API

### Endpoints Disponíveis:
```bash
# Health Check
curl http://localhost/health

# Listar usuários
curl http://localhost/users

# Listar grupos
curl http://localhost/groups

# Documentação da API (se disponível)
curl http://localhost/docs
```

## 🛠️ Comandos Úteis

### Gerenciamento de Containers
```powershell
# Ver containers rodando
docker compose ps

# Parar todos os serviços
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker compose down -v

# Reconstruir apenas um serviço
docker compose up --build api

# Ver logs de um serviço específico
docker compose logs -f postgres
docker compose logs -f api
docker compose logs -f nginx
```

### Limpeza do Sistema
```powershell
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Limpeza completa (CUIDADO)
docker system prune -a
```

## 🔧 Solução de Problemas

### Docker não encontrado
1. Verifique se o Docker Desktop está instalado
2. Reinicie o PowerShell/Terminal
3. Verifique se o Docker Desktop está rodando

### Porta já em uso
```powershell
# Verificar o que está usando a porta 80
netstat -ano | findstr :80

# Parar processo específico (substitua PID)
taskkill /PID <PID> /F
```

### Problemas de Permissão
- Execute o PowerShell como Administrador
- Verifique se o usuário está no grupo "docker-users"

### Banco de dados não conecta
1. Aguarde o PostgreSQL inicializar completamente
2. Verifique os logs: `docker compose logs postgres`
3. Reinicie os serviços: `docker compose restart`

## 📁 Estrutura de Arquivos Docker

```
├── Dockerfile              # Configuração da imagem da API
├── docker-compose.yml      # Orquestração dos serviços
├── .dockerignore           # Arquivos ignorados no build
├── .env.docker            # Variáveis de ambiente
├── docker-start.bat       # Script de inicialização (Windows)
├── docker-start.sh        # Script de inicialização (Linux/Mac)
└── nginx/
    ├── nginx.conf         # Configuração principal do Nginx
    └── conf.d/
        └── api.conf       # Configuração específica da API
```

## 🎯 Próximos Passos

1. ✅ Instalar e configurar Docker Desktop
2. ✅ Executar `docker compose up --build`
3. ✅ Testar endpoints da API
4. ✅ Configurar desenvolvimento contínuo
5. 🔄 Implementar CI/CD (opcional)

---

**💡 Dica:** Mantenha o Docker Desktop sempre atualizado para melhor performance e segurança.