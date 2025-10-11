# JCS Code API - Documentação Completa

## Sumário
Esta documentação apresenta todos os endpoints disponíveis na API JCS Code, incluindo métodos HTTP, URLs, exemplos de resposta e código básico para desenvolvedores.

## Base URL
```
http://localhost
```

---

## 1. Health Check (Verificação de Saúde)

### GET /health
**Descrição:** Verifica o status da aplicação

**Método:** GET  
**URL:** `http://localhost/health`

**Resposta de Exemplo:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-09T13:25:08.987Z",
  "uptime": 995.815767817,
  "environment": "production",
  "version": "1.0.0"
}
```

**Código JavaScript:**
```javascript
fetch('http://localhost/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Código Python:**
```python
import requests
response = requests.get('http://localhost/health')
print(response.json())
```

---

## 2. Database Views (DBV) - Visualizações de Banco de Dados

### GET /v1/dbv
**Descrição:** Lista todos os endpoints de visualizações disponíveis

**Método:** GET  
**URL:** `http://localhost/v1/dbv`

**Resposta de Exemplo:**
```json
{
  "message": "Database Views API",
  "endpoints": [
    "GET /v1/dbv/active-users - Lista usuários ativos",
    "GET /v1/dbv/active-users/:uuid - Busca usuário ativo por UUID",
    "GET /v1/dbv/groups-with-member-count - Lista grupos com contagem de membros",
    "GET /v1/dbv/groups-with-member-count/:id - Busca grupo por ID",
    "GET /v1/dbv/groups-with-member-count/tenant/:tenantName - Lista grupos por tenant",
    "GET /v1/dbv/tenant-stats - Estatísticas de tenants",
    "GET /v1/dbv/tenant-stats/:id - Estatísticas por ID",
    "GET /v1/dbv/tenant-stats/slug/:slug - Estatísticas por slug"
  ]
}
```

### GET /v1/dbv/active-users
**Descrição:** Lista todos os usuários ativos

**Método:** GET  
**URL:** `http://localhost/v1/dbv/active-users`

**Resposta de Exemplo:**
```json
[]
```

**Código JavaScript:**
```javascript
fetch('http://localhost/v1/dbv/active-users')
  .then(response => response.json())
  .then(users => console.log(users));
```

### GET /v1/dbv/active-users/:uuid
**Descrição:** Busca usuário ativo por UUID

**Método:** GET  
**URL:** `http://localhost/v1/dbv/active-users/{uuid}`

**Parâmetros:**
- `uuid` (string): UUID do usuário

### GET /v1/dbv/tenant-stats
**Descrição:** Estatísticas de todos os tenants

**Método:** GET  
**URL:** `http://localhost/v1/dbv/tenant-stats`

**Resposta de Exemplo:**
```json
[
  {
    "id": "26bf55fc-2b84-43ec-a753-c6b15fa4ffb6",
    "name": "Default Tenant",
    "slug": "default",
    "current_users_count": "2",
    "max_users": 100,
    "is_active": true,
    "total_groups": "2",
    "users_in_groups": "0",
    "created_at": "2025-10-09T13:08:31.762Z"
  },
  {
    "id": "9e45c6e2-b02c-4f7c-aa99-92e4b5e28de1",
    "name": "Demo Company",
    "slug": "demo",
    "current_users_count": "1",
    "max_users": 50,
    "is_active": true,
    "total_groups": "0",
    "users_in_groups": "0",
    "created_at": "2025-10-09T13:08:31.762Z"
  }
]
```

### GET /v1/dbv/groups-with-member-count
**Descrição:** Lista grupos com contagem de membros

**Método:** GET  
**URL:** `http://localhost/v1/dbv/groups-with-member-count`

---

## 3. User Management (UMX) - Gerenciamento de Usuários

### GET /v1/umx
**Descrição:** Lista todos os usuários

**Método:** GET  
**URL:** `http://localhost/v1/umx`

**Resposta de Exemplo:**
```json
[
  {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Admin User",
    "email": "admin@example.com",
    "username": "admin",
    "isActive": true,
    "isVerified": true,
    "tenantId": "26bf55fc-2b84-43ec-a753-c6b15fa4ffb6",
    "createdAt": "2025-10-09T13:08:31.762Z"
  }
]
```

**Código JavaScript:**
```javascript
fetch('http://localhost/v1/umx')
  .then(response => response.json())
  .then(users => console.log(users));
```

### POST /v1/umx
**Descrição:** Cria novo usuário

**Método:** POST  
**URL:** `http://localhost/v1/umx`

**Body de Exemplo:**
```json
{
  "fullName": "Novo Usuário",
  "email": "novo@example.com",
  "username": "novousuario",
  "password": "senha123"
}
```

### GET /v1/umx/:id
**Descrição:** Busca usuário por ID

**Método:** GET  
**URL:** `http://localhost/v1/umx/{id}`

### PUT /v1/umx/:id
**Descrição:** Atualiza usuário

**Método:** PUT  
**URL:** `http://localhost/v1/umx/{id}`

### DELETE /v1/umx/:id
**Descrição:** Remove usuário

**Método:** DELETE  
**URL:** `http://localhost/v1/umx/{id}`

---

## 4. Authentication (AUTH) - Autenticação

### POST /auth/login
**Descrição:** Login de usuário

**Método:** POST  
**URL:** `http://localhost/auth/login`

**Body de Exemplo:**
```json
{
  "email": "admin@example.com",
  "password": "senha123"
}
```

### POST /auth/register
**Descrição:** Registro de novo usuário

**Método:** POST  
**URL:** `http://localhost/auth/register`

### POST /auth/logout
**Descrição:** Logout do usuário

**Método:** POST  
**URL:** `http://localhost/auth/logout`

### POST /auth/refresh
**Descrição:** Renovar token de acesso

**Método:** POST  
**URL:** `http://localhost/auth/refresh`

---

## 5. Groups (GPX) - Gerenciamento de Grupos

### GET /v1/gpx
**Descrição:** Lista todos os grupos

**Método:** GET  
**URL:** `http://localhost/v1/gpx`

### POST /v1/gpx
**Descrição:** Cria novo grupo

**Método:** POST  
**URL:** `http://localhost/v1/gpx`

**Body de Exemplo:**
```json
{
  "name": "Novo Grupo",
  "description": "Descrição do grupo"
}
```

### GET /v1/gpx/:id
**Descrição:** Busca grupo por ID

**Método:** GET  
**URL:** `http://localhost/v1/gpx/{id}`

### PUT /v1/gpx/:id
**Descrição:** Atualiza grupo

**Método:** PUT  
**URL:** `http://localhost/v1/gpx/{id}`

### DELETE /v1/gpx/:id
**Descrição:** Remove grupo

**Método:** DELETE  
**URL:** `http://localhost/v1/gpx/{id}`

---

## 6. User Sessions (USX) - Sessões de Usuário

### GET /v1/usx
**Descrição:** Lista sessões ativas

**Método:** GET  
**URL:** `http://localhost/v1/usx`

### DELETE /v1/usx/:id
**Descrição:** Encerra sessão

**Método:** DELETE  
**URL:** `http://localhost/v1/usx/{id}`

---

## 7. User Invitations (UIX) - Convites de Usuário

### GET /v1/uix
**Descrição:** Lista convites pendentes

**Método:** GET  
**URL:** `http://localhost/v1/uix`

### POST /v1/uix
**Descrição:** Cria novo convite

**Método:** POST  
**URL:** `http://localhost/v1/uix`

**Body de Exemplo:**
```json
{
  "email": "convidado@example.com",
  "role": "user"
}
```

### DELETE /v1/uix/:id
**Descrição:** Cancela convite

**Método:** DELETE  
**URL:** `http://localhost/v1/uix/{id}`

---

## 8. User Groups (UGX) - Usuários em Grupos

### GET /v1/ugx
**Descrição:** Lista associações usuário-grupo

**Método:** GET  
**URL:** `http://localhost/v1/ugx`

### POST /v1/ugx
**Descrição:** Adiciona usuário ao grupo

**Método:** POST  
**URL:** `http://localhost/v1/ugx`

**Body de Exemplo:**
```json
{
  "userId": 1,
  "groupId": 1
}
```

### DELETE /v1/ugx/:id
**Descrição:** Remove usuário do grupo

**Método:** DELETE  
**URL:** `http://localhost/v1/ugx/{id}`

---

## 9. Group Settings (GSX) - Configurações de Grupo

### GET /v1/gsx/:groupId
**Descrição:** Busca configurações do grupo

**Método:** GET  
**URL:** `http://localhost/v1/gsx/{groupId}`

### PUT /v1/gsx/:groupId
**Descrição:** Atualiza configurações do grupo

**Método:** PUT  
**URL:** `http://localhost/v1/gsx/{groupId}`

---

## 10. Email Service - Serviço de Email

### POST /email/send
**Descrição:** Envia email

**Método:** POST  
**URL:** `http://localhost/email/send`

**Body de Exemplo:**
```json
{
  "to": "destinatario@example.com",
  "subject": "Assunto do Email",
  "body": "Conteúdo do email"
}
```

---

## Códigos de Status HTTP Comuns

- **200 OK**: Requisição bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Dados inválidos na requisição
- **401 Unauthorized**: Não autorizado
- **403 Forbidden**: Acesso negado
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro interno do servidor

---

## Autenticação

A maioria dos endpoints requer autenticação via JWT token. Inclua o token no header:

```
Authorization: Bearer {seu_token_jwt}
```

**Exemplo em JavaScript:**
```javascript
fetch('http://localhost/v1/umx', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

**Exemplo em Python:**
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get('http://localhost/v1/umx', headers=headers)
print(response.json())
```

---

## Notas Importantes

1. Todos os endpoints retornam dados em formato JSON
2. Datas são retornadas no formato ISO 8601
3. IDs são UUIDs ou números inteiros
4. Sempre verifique o código de status HTTP da resposta
5. Alguns endpoints podem retornar arrays vazios quando não há dados

---

*Documentação gerada automaticamente - JCS Code API v1.0.0*