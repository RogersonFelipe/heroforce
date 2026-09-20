# 🦸 HeroForce - Sistema de Gestão de Projetos Heroicos

Sistema completo de gerenciamento de projetos com autenticação, dashboard interativo, cache, fila assíncrona e trilha de auditoria.

## 🎯 Sobre o Projeto

**HeroForce** é uma aplicação full-stack para gerenciamento de projetos com temática de super-heróis. O sistema permite:

- ✅ Autenticação de usuários (Login/Registro) com JWT e logout real (blacklist de token)
- ✅ Dashboard interativo com estatísticas
- ✅ CRUD completo de projetos, com leitura em cache
- ✅ Gestão de valores heroicos (Agilidade, Encantamento, Eficiência, etc.)
- ✅ Controle de permissões (Admin/Hero) aplicado no backend
- ✅ Notificação assíncrona de mudança de status, com retry e fila morta
- ✅ Trilha de auditoria de toda escrita em projetos e usuários
- ✅ Filtros por status de projeto
- ✅ Interface moderna e responsiva

---

## 🏗️ Arquitetura — por que cada peça existe

O backend é um monólito NestJS, mas usa quatro bancos/serviços diferentes, cada um resolvendo um problema específico que o Postgres sozinho não resolve bem:

| Peça | Resolve | Por quê |
|---|---|---|
| **PostgreSQL** | Dados relacionais (projetos, usuários) | Fonte da verdade, com integridade referencial entre projeto e responsável |
| **Redis** | Cache de leitura, blacklist de JWT, rate limit | `findAll`/`getStatistics` são lidos com frequência e mudam pouco; logout de JWT precisa de um jeito de revogar um token que já foi emitido; rate limit precisa de um contador compartilhado entre instâncias |
| **BullMQ (sobre o Redis)** | Notificação assíncrona de mudança de status | Enviar notificação não pode segurar a resposta do `PATCH`, e se falhar precisa tentar de novo sem perder o evento |
| **MongoDB** | Trilha de auditoria | Log é append-only, tem formato variável por tipo de evento e nunca é atualizado depois de gravado — o oposto do que um relacional normalizado faz bem |

### Fluxo de uma escrita (`PATCH /projects/:id`)

```
Cliente
  │  PATCH /projects/:id  (Authorization: Bearer <jwt>)
  ▼
JwtAuthGuard ── consulta blacklist no Redis (token revogado? 401)
  │
RolesGuard ──── só admin passa daqui pra frente (senão 403)
  │
ProjectsService.update()
  │
  ├─► PostgreSQL   grava a mudança (só os campos enviados)
  ├─► Redis        invalida o cache de findAll/getStatistics
  ├─► MongoDB      grava quem alterou o quê (audit_logs, fire-and-forget)
  └─► BullMQ       enfileira "status mudou" (fire-and-forget)
  │
200 OK  ◄── a resposta NÃO espera a fila nem a auditoria

                    ⋮ fora do ciclo da requisição ⋮

BullMQ Worker (NotificationsProcessor)
  │  tenta "enviar" a notificação
  ├─ sucesso → log e fim
  └─ falha → retry (até 3x, backoff exponencial)
       └─ esgotou as tentativas → job fica em estado "failed"
          (== fila morta) → GET /notifications/dead-letter (admin)
          → reprocessar manualmente com POST .../reprocess
```

Se o Redis, o Mongo ou o BullMQ caírem, a escrita em si continua funcionando — cache, fila e auditoria falham "para o lado", nunca derrubam a operação principal (isso é testado manualmente parando cada container e repetindo a chamada).

---

## 🛠️ Tecnologias

### Backend
- **Node.js** v20
- **NestJS** - Framework backend
- **TypeORM** + **PostgreSQL** - dados relacionais
- **ioredis** + **Redis** - cache, blacklist de token, rate limit
- **BullMQ** (`@nestjs/bullmq`) - fila de notificação assíncrona, sobre o Redis
- **Mongoose** + **MongoDB** - trilha de auditoria
- **JWT** (`@nestjs/jwt` + `passport-jwt`) - autenticação
- **Bcrypt** - hash de senha
- **Jest** - testes unitários (mock de repositório/serviços, sem depender de banco)
- **Swagger** - documentação da API

### Frontend
- **React** v19
- **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **Axios** - Requisições HTTP
- **React Router** - Navegação
- **Lucide React** - Ícones

---

## 📦 Pré-requisitos

Antes de começar, você vai precisar ter instalado:

### Para executar com Docker:
- [Docker](https://www.docker.com/get-started) (v20+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### Para executar sem Docker:
- [Node.js](https://nodejs.org/) (v20+)
- [PostgreSQL](https://www.postgresql.org/download/) (v15+)
- [Redis](https://redis.io/download/) (v7+)
- [MongoDB](https://www.mongodb.com/try/download/community) (v7+)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

---

## 🚀 Instalação e Execução

### Opção 1: Com Docker (Recomendado) 🐳

Sobe os cinco serviços de uma vez: `postgres`, `redis`, `mongo`, `backend`, `frontend`.

#### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/heroforce.git
cd heroforce
```

#### 2. Suba os containers

```bash
# Construir e iniciar todos os serviços
docker-compose up -d --build

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
```

#### 3. Acesse a aplicação

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **Documentação API (Swagger):** http://localhost:3000/api/docs
- **Postgres:** localhost:5432 · **Redis:** localhost:6379 · **MongoDB:** localhost:27017

#### 4. Comandos úteis do Docker

```bash
# Parar os containers
docker-compose down

# Parar e remover volumes (⚠️ apaga banco, cache e fila)
docker-compose down -v

# Ver status dos containers
docker-compose ps

# Reconstruir apenas um serviço
docker-compose up -d --build backend

# Entrar no container do backend
docker-compose exec backend sh

# Entrar no PostgreSQL
docker-compose exec postgres psql -U postgres -d heroforce_db

# Ver as chaves guardadas no Redis
docker-compose exec redis redis-cli keys "*"

# Ver os registros de auditoria no Mongo
docker-compose exec mongo mongosh heroforce_audit --eval "db.audit_logs.find().pretty()"
```

---

### Opção 2: Sem Docker 💻

#### 1. Suba Postgres, Redis e MongoDB localmente

```sql
CREATE DATABASE heroforce_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE heroforce_db TO postgres;
```

Redis e MongoDB podem rodar com as instalações padrão (portas 6379 e 27017).

#### 2. Configure o Backend

```bash
cd backend
npm install

# Copie o exemplo e ajuste se necessário
cp .env.example .env

npm run start:dev
```

O backend estará rodando em: **http://localhost:3000**

#### 3. Configure o Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O frontend estará rodando em: **http://localhost:5173**

---

## 📁 Estrutura do Projeto

```
heroforce/
├── backend/
│   ├── src/
│   │   ├── auth/               # Login, registro, logout, blacklist de JWT, rate limit
│   │   ├── users/               # CRUD de usuários
│   │   ├── projects/            # CRUD de projetos, cache, integra fila e auditoria
│   │   ├── notifications/       # Fila BullMQ: produtor, worker, fila morta
│   │   ├── audit/               # Trilha de auditoria (MongoDB)
│   │   ├── redis/               # Cliente Redis com degradação graciosa
│   │   ├── common/
│   │   │   ├── decorators/      # @GetUser, @Roles
│   │   │   └── guards/          # RolesGuard
│   │   ├── config/               # Configuração do TypeORM
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   ├── pages/               # Páginas
│   │   ├── services/            # Serviços (API)
│   │   ├── store/               # Zustand stores
│   │   ├── types/                # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

### Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/auth/register` | Registrar novo usuário | Não |
| POST | `/auth/login` | Login de usuário (limitado a 5 tentativas/min por e-mail e por IP) | Não |
| POST | `/auth/logout` | Revogar o token atual (entra na blacklist do Redis) | Sim |

### Usuários

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/users` | Listar todos os usuários | Sim |
| GET | `/users/me` | Obter usuário logado | Sim |
| GET | `/users/:id` | Obter usuário por ID | Sim |
| DELETE | `/users/:id` | Deletar usuário | Sim (Admin) |

### Projetos

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/projects` | Listar projetos (cacheado) | Sim |
| GET | `/projects/statistics` | Obter estatísticas (cacheado) | Sim |
| GET | `/projects/:id` | Obter projeto por ID | Sim |
| POST | `/projects` | Criar novo projeto | Sim (Admin) |
| PATCH | `/projects/:id` | Atualizar projeto (dispara notificação se o status mudar) | Sim (Admin) |
| DELETE | `/projects/:id` | Deletar projeto | Sim (Admin) |

### Notificações (fila)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/notifications/dead-letter` | Listar notificações que esgotaram as tentativas | Sim (Admin) |
| POST | `/notifications/dead-letter/:id/reprocess` | Reprocessar manualmente um item da fila morta | Sim (Admin) |

### Auditoria

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/audit` | Consultar histórico (filtros: `entidade`, `entidadeId`, `usuarioId`, `dataInicio`, `dataFim`) | Sim (Admin) |

**Documentação completa:** http://localhost:3000/api/docs

---

## ⚙️ Variáveis de Ambiente

Veja `backend/.env.example` e `frontend/.env.example` para a lista completa comentada. Resumo:

### Backend

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/heroforce_db
REDIS_HOST=localhost
REDIS_PORT=6379
MONGODB_URI=mongodb://localhost:27017/heroforce_audit
JWT_SECRET=im-batman            # Altere em produção!
NODE_ENV=development
PORT=3000
```

No Docker, `docker-compose.yml` já aponta `DATABASE_URL`/`REDIS_HOST`/`MONGODB_URI` para os serviços do compose — não precisa editar nada pra rodar com `docker-compose up`.

### Frontend

```env
VITE_API_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

### Problema: "Cannot connect to database"

**Solução:**
```bash
docker-compose ps
docker-compose logs postgres
docker-compose down -v
docker-compose up -d --build
```

### Problema: Cache, fila ou auditoria não funcionam

Redis, MongoDB e a fila (que roda sobre o Redis) foram desenhados para **não derrubar a aplicação** se caírem — a API continua respondendo, só perde cache/fila/auditoria temporariamente. Se algo parecer travado:

```bash
docker-compose ps                 # redis/mongo estão "healthy"?
docker-compose logs backend | grep -i "redis\|mongo"   # avisos de degradação aparecem aqui
docker-compose restart redis mongo
```

### Problema: "Port already in use"

**Solução:**
```bash
# Mude as portas no docker-compose.yml
# Exemplo: "5174:5173" ao invés de "5173:5173"

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Problema: Alterações no código não aparecem

**Solução:**
```bash
# Os volumes estão configurados para hot-reload
# Mas se não funcionar, reconstrua:
docker-compose down
docker-compose up -d --build
```

---

## 👥 Usuários Padrão

Após executar o projeto, você pode criar usuários via `/auth/register` ou usar o Swagger.

**Exemplo de registro:**

```json
{
  "name": "Tony Stark",
  "email": "tony@stark.com",
  "password": "senha123",
  "character": "Homem de Ferro",
  "role": "admin"
}
```

**Personagens disponíveis:**
- Homem de Ferro 🦾
- Capitã Marvel ⭐
- Homem-Aranha 🕷️
- Mulher Maravilha 👸
- Batman 🦇
- Superman 🦸
- Viúva Negra 🕸️
- Pantera Negra 🐆
- Thor ⚡
- Hulk 💪

---

## 📝 Comandos Úteis

### Backend

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Testes
npm run test
npm run test:cov     # cobertura
npm run test:e2e

# Lint
npm run lint
npm run format
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

---

## 🎯 Funcionalidades

### Para Usuários Hero (Padrão)
- ✅ Visualizar todos os projetos
- ✅ Filtrar projetos por status
- ✅ Ver detalhes dos projetos
- ✅ Ver estatísticas gerais

### Para Usuários Admin
- ✅ Todas as funcionalidades de Hero
- ✅ Criar, editar e deletar projetos e usuários (validado no backend, não só escondido na UI)
- ✅ Consultar a fila morta de notificações e reprocessar manualmente
- ✅ Consultar a trilha de auditoria por entidade, usuário ou período

---

## 👨‍💻 Autor

Desenvolvido por **Rogerson Felipe Alves Ramos**

---
