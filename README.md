# Api-Jscode

## 📋 Descrição
API REST desenvolvida em NestJS para gerenciamento de usuários, grupos, sessões e auditoria. Sistema completo com autenticação, autorização e controle de acesso baseado em tenants.

## 🚀 Tecnologias Utilizadas
- **NestJS** - Framework Node.js para APIs escaláveis
- **TypeORM** - ORM para TypeScript e JavaScript
- **PostgreSQL** - Banco de dados relacional
- **TypeScript** - Linguagem de programação tipada

## 📦 Funcionalidades
- ✅ Gerenciamento de usuários
- ✅ Sistema de grupos e permissões
- ✅ Controle de sessões de usuário
- ✅ Auditoria completa de ações
- ✅ Sistema multi-tenant
- ✅ Histórico de propriedade de tenants
- ✅ Convites de usuários
- ✅ Views de banco de dados para relatórios

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js (versão 18 ou superior)
- PostgreSQL
- npm ou yarn

### Configuração
1. Clone o repositório
```bash
git clone https://github.com/jcsilvestre/Api-Jscode.git
cd Api-Jscode
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute as migrações do banco de dados
```bash
npm run migration:run
```

5. Inicie a aplicação
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod
```

## 📚 Endpoints Disponíveis

### Usuários
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Buscar usuário por ID
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

### Grupos
- `GET /groups` - Listar grupos
- `POST /groups` - Criar grupo
- `GET /groups/:id` - Buscar grupo por ID
- `PATCH /groups/:id` - Atualizar grupo
- `DELETE /groups/:id` - Deletar grupo

### Sessões de Usuário
- `GET /user-sessions` - Listar sessões
- `POST /user-sessions` - Criar sessão
- `GET /user-sessions/:id` - Buscar sessão por ID
- `PATCH /user-sessions/:id` - Atualizar sessão
- `DELETE /user-sessions/:id` - Deletar sessão

### Auditoria
- `GET /user-groups-audit` - Histórico de auditoria
- `POST /user-groups-audit` - Registrar ação de auditoria

## 🧪 Testes
```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📊 Status do Projeto
- ✅ **98% dos endpoints funcionais**
- ✅ **Validações implementadas**
- ✅ **Tratamento de erros**
- ✅ **Documentação completa**

## 🤝 Contribuição
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor
**JC Silvestre**
- GitHub: [@jcsilvestre](https://github.com/jcsilvestre)

---
⭐ Se este projeto te ajudou, considere dar uma estrela!