# 🦸 HeroForce - Sistema de Gestão de Projetos Heroicos

Sistema completo de gerenciamento de projetos com autenticação, dashboard interativo e gestão de valores heroicos.

## 🎯 Sobre o Projeto

**HeroForce** é uma aplicação full-stack para gerenciamento de projetos com temática de super-heróis. O sistema permite:

- ✅ Autenticação de usuários (Login/Registro)
- ✅ Dashboard interativo com estatísticas
- ✅ CRUD completo de projetos
- ✅ Gestão de valores heroicos (Agilidade, Encantamento, Eficiência, etc.)
- ✅ Controle de permissões (Admin/Hero)
- ✅ Filtros por status de projeto
- ✅ Interface moderna e responsiva

---

## 🛠️ Tecnologias

### Backend
- **Node.js** v20
- **NestJS** - Framework backend
- **TypeORM** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Criptografia de senhas
- **Swagger** - Documentação da API

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
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

---

## 🚀 Instalação e Execução

### Opção 1: Com Docker (Recomendado) 🐳

Esta é a forma mais fácil e rápida de rodar o projeto completo.

#### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/heroforce.git
cd heroforce
```

#### 2. Configure os arquivos Docker

Certifique-se de que os seguintes arquivos estão configurados:

**`docker-compose.yml`** (na raiz do projeto)
**`backend/Dockerfile`**
**`frontend/Dockerfile`**

#### 3. Suba os containers

```bash
# Construir e iniciar todos os serviços
docker-compose up -d --build

# Ver logs em tempo real
docker-compose logs -f

# Ver logs apenas do backend
docker-compose logs -f backend

# Ver logs apenas do frontend
docker-compose logs -f frontend
```

#### 4. Acesse a aplicação

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **Documentação API (Swagger):** http://localhost:3000/api/docs

#### 5. Comandos úteis do Docker

```bash
# Parar os containers
docker-compose down

# Parar e remover volumes (⚠️ apaga o banco de dados)
docker-compose down -v

# Ver status dos containers
docker-compose ps

# Reconstruir apenas um serviço
docker-compose build backend
docker-compose build frontend

# Entrar no container do backend
docker-compose exec backend sh

# Entrar no PostgreSQL
docker-compose exec postgres psql -U postgres -d heroforce_db
```

---

### Opção 2: Sem Docker 💻

Se preferir rodar sem Docker, siga os passos abaixo.

#### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/heroforce.git
cd heroforce
```

#### 2. Configure o PostgreSQL

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE heroforce_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE heroforce_db TO postgres;
```

#### 3. Configure o Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Crie o arquivo .env
cat > .env << EOF
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=heroforce_db
JWT_SECRET=im-batman
NODE_ENV=development
PORT=3000
EOF

# Execute as migrations (se necessário)
npm run build

# Inicie o servidor de desenvolvimento
npm run start:dev
```

O backend estará rodando em: **http://localhost:3000**

#### 4. Configure o Frontend

Em outro terminal:

```bash
# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Crie o arquivo .env (opcional)
cat > .env << EOF
VITE_API_URL=http://localhost:3000
EOF

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em: **http://localhost:5173**

---

## 📁 Estrutura do Projeto

```
heroforce/
├── backend/
│   ├── src/
│   │   ├── auth/              # Módulo de autenticação
│   │   ├── users/             # Módulo de usuários
│   │   ├── projects/          # Módulo de projetos
│   │   ├── config/            # Configurações
│   │   ├── app.module.ts      # Módulo principal
│   │   └── main.ts            # Arquivo de entrada
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── services/          # Serviços (API)
│   │   ├── store/             # Zustand stores
│   │   ├── types/             # TypeScript types
│   │   ├── App.tsx            # Componente principal
│   │   └── main.tsx           # Arquivo de entrada
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
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
| POST | `/auth/login` | Login de usuário | Não |

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
| GET | `/projects` | Listar projetos | Sim |
| GET | `/projects/statistics` | Obter estatísticas | Sim |
| GET | `/projects/:id` | Obter projeto por ID | Sim |
| POST | `/projects` | Criar novo projeto | Sim (Admin) |
| PATCH | `/projects/:id` | Atualizar projeto | Sim (Admin) |
| DELETE | `/projects/:id` | Deletar projeto | Sim (Admin) |

**Documentação completa:** http://localhost:3000/api/docs

---

## ⚙️ Variáveis de Ambiente

### Backend (.env)

```env
# Database
DATABASE_HOST=localhost          # ou 'postgres' no Docker
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=heroforce_db

# JWT
JWT_SECRET=im-batman            # Altere em produção!

# Server
NODE_ENV=development
PORT=3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

### Problema: "Cannot connect to database"

**Solução:**
```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps

# Veja os logs do banco
docker-compose logs postgres

# Reconstrua os containers
docker-compose down -v
docker-compose up -d --build
```

### Problema: "Port already in use"

**Solução:**
```bash
# Mude as portas no docker-compose.yml
# Exemplo: "5174:5173" ao invés de "5173:5173"

# Ou mate o processo usando a porta
# Linux/Mac:
lsof -i :5173
kill -9 <PID>

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Problema: "crypto is not defined"

**Solução:**

Certifique-se que o Dockerfile do backend está usando `start:dev`:

```dockerfile
CMD ["npm", "run", "start:dev"]
```

E não `start:prod`.

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
  "character": "Homem de Ferro"
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
npm run test:e2e
npm run test:cov

# Lint
npm run lint
npm run format
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
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
- ✅ Criar novos projetos
- ✅ Editar projetos existentes
- ✅ Deletar projetos
- ✅ Atribuir responsáveis

---


## 👨‍💻 Autor

Desenvolvido por **Rogerson Felipe Alves Ramos**



---
