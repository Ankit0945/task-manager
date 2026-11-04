# Personal Task Manager

A full-stack web application for managing personal tasks, built with **React**, **Express.js**, and **PostgreSQL**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                │
│  React + Vite + Tailwind CSS                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  TaskForm    │  │  TaskList    │  │      TaskItem        │  │
│  │  (create)    │  │  (empty /    │  │  (toggle / delete)   │  │
│  └──────┬───────┘  │  loading /   │  └──────────┬───────────┘  │
│         │          │  error list) │             │              │
│         └──────────┴─────┬────────┘─────────────┘              │
│                          │  useTasks hook                       │
│                          │  src/api/tasks.js  (fetch)           │
└──────────────────────────┼──────────────────────────────────────┘
                           │  HTTP / JSON (REST API)
┌──────────────────────────▼──────────────────────────────────────┐
│                   Express.js Backend                            │
│  src/routes/tasks.js → taskController.js → taskService.js      │
│  src/middleware/errorHandler.js  (central 4-param handler)      │
│  src/middleware/validate.js      (express-validator)            │
│  src/routes/health.js            (GET /api/health)              │
│  src/db/index.js                 (pg Pool, parameterized SQL)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  TCP / pg wire protocol
┌──────────────────────────▼──────────────────────────────────────┐
│                      PostgreSQL                                 │
│  tasks table  (id, title, description, completed,               │
│                created_at, updated_at)                          │
└─────────────────────────────────────────────────────────────────┘
```

### How a task moves through the system

1. **User types** a title in `TaskForm` and clicks "Add Task".
2. The form calls `useTasks.addTask()` which calls `api.createTask()`.
3. `api/tasks.js` sends `POST /api/tasks` with a JSON body to the Express server.
4. Express routes the request through **validation** middleware (express-validator), then the **controller** (`taskController.createTask`).
5. The controller calls **`taskService.createTask()`**, which runs a parameterized `INSERT` via the pg Pool.
6. PostgreSQL stores the row and returns it. The service returns the new task object.
7. The controller sends `201 Created` with `{ data: task }` back to the browser.
8. The React hook **prepends** the new task to the local state — the list updates instantly.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 LTS |
| npm | 9+ |
| PostgreSQL | 14+ |
| Git | any recent |

---

## Local Setup

### 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (from project root)
cd ../frontend
npm install
```

### 3 — Set up PostgreSQL

Create a database (the name can be anything):

```bash
psql -U postgres -c "CREATE DATABASE taskmanager;"
```

Run the migration:

```bash
psql -U postgres -d taskmanager -f backend/migration.sql
```

### 4 — Configure environment variables

**Backend:**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set your DATABASE_URL or individual DB_* variables
```

**Frontend:**

```bash
cp frontend/.env.example frontend/.env
# VITE_API_BASE_URL defaults to http://localhost:3001
# Leave it blank to use the Vite dev-server proxy instead
```

### 5 — Run locally

Open **two** terminal windows:

```bash
# Terminal 1 — backend (port 3001)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port the Express server listens on (default: `3001`) |
| `NODE_ENV` | No | `development` / `production` / `test` |
| `DATABASE_URL` | Yes* | Full PostgreSQL connection string |
| `DB_HOST` | Yes* | PostgreSQL host (used if `DATABASE_URL` not set) |
| `DB_PORT` | No | PostgreSQL port (default: `5432`) |
| `DB_NAME` | Yes* | Database name |
| `DB_USER` | Yes* | Database user |
| `DB_PASSWORD` | Yes* | Database password |
| `CORS_ORIGIN` | Yes | Comma-separated allowed origins (e.g. `https://my-app.vercel.app`) |

> \* Provide either `DATABASE_URL` **or** the individual `DB_*` variables.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | Base URL of the backend API, **without** trailing slash (e.g. `https://my-api.railway.app`). Leave blank to use the Vite proxy on localhost. |

---

## Database Setup & Migration

The file `backend/migration.sql` creates the `tasks` table, indexes, and an auto-update trigger for `updated_at`.

**Local:**
```bash
psql $DATABASE_URL -f backend/migration.sql
```

**Hosted (Railway / Neon / Supabase):**
1. Find the connection string in the provider dashboard.
2. Run: `psql "postgresql://user:pass@host/db?sslmode=require" -f backend/migration.sql`

The migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`), so you can safely re-run it.

---

## Available Commands

### Backend

```bash
npm run dev          # Start with nodemon (auto-reload)
npm start            # Production start
npm test             # Run Jest tests
npm run test:coverage # Jest with coverage report
npm run lint         # ESLint
```

### Frontend

```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build → dist/
npm run preview      # Preview the production build locally
npm test             # Vitest tests (run once)
npm run test:watch   # Vitest in watch mode
npm run test:coverage # Vitest with coverage
npm run lint         # ESLint
```

---

## REST API Reference

Base URL: `http://localhost:3001` (local) or your deployed Railway URL.

All responses follow:
```json
{ "data": <task or task[]> }
```
Errors follow:
```json
{ "error": { "message": "...", "code": "..." } }
```

### `GET /api/health`
```json
// 200
{ "status": "ok", "db": "connected", "timestamp": "2026-11-04T18:00:00.000Z" }
```

### `GET /api/tasks`
```bash
curl http://localhost:3001/api/tasks
```
```json
// 200
{
  "data": [
    {
      "id": 1,
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "created_at": "2026-11-04T10:00:00.000Z",
      "updated_at": "2026-11-04T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/tasks/:id`
```bash
curl http://localhost:3001/api/tasks/1
# 200: { "data": { ... } }
# 404: { "error": { "message": "Task 1 not found" } }
```

### `POST /api/tasks`
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{ "title": "Read a book", "description": "Chapter 3" }'
# 201: { "data": { "id": 2, "title": "Read a book", ... } }
# 422: { "error": { "message": "Validation failed", "code": "title: Title is required" } }
```

### `PATCH /api/tasks/:id`
```bash
# Mark complete
curl -X PATCH http://localhost:3001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{ "completed": true }'
# 200: { "data": { "id": 1, "completed": true, ... } }
```

### `DELETE /api/tasks/:id`
```bash
curl -X DELETE http://localhost:3001/api/tasks/1
# 200: { "data": { ... }, "message": "Task deleted successfully" }
# 404: { "error": { "message": "Task 1 not found" } }
```

---

## Project Structure

```
project-root/
├── package.json              Root scripts
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── .env.example          ← copy to .env, fill in values
│   ├── migration.sql         ← run once against your PostgreSQL DB
│   ├── src/
│   │   ├── server.js         Entry point; binds port, graceful shutdown
│   │   ├── app.js            Express app config (CORS, routes, error handler)
│   │   ├── db/
│   │   │   └── index.js      pg Pool + parameterized query helper
│   │   ├── routes/
│   │   │   ├── tasks.js      Route definitions + validation rules
│   │   │   └── health.js     GET /api/health
│   │   ├── controllers/
│   │   │   └── taskController.js  HTTP parsing, delegates to service
│   │   ├── services/
│   │   │   └── taskService.js     All SQL (via parameterized queries)
│   │   └── middleware/
│   │       ├── errorHandler.js    Central 4-param error handler
│   │       └── validate.js        express-validator result checker
│   └── __tests__/
│       └── tasks.test.js          Supertest integration tests (DB mocked)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example          ← copy to .env, set VITE_API_BASE_URL
    ├── index.html
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx           React entry point
        ├── App.jsx            Root component
        ├── index.css          Tailwind directives + base styles
        ├── api/
        │   └── tasks.js       All fetch() calls to the backend
        ├── hooks/
        │   └── useTasks.js    State management; CRUD operations
        ├── components/
        │   ├── TaskForm.jsx   Create-task form
        │   ├── TaskList.jsx   Loading / error / empty / populated list
        │   └── TaskItem.jsx   Single task row (toggle, delete w/ confirm)
        └── test/
            ├── setup.js            jest-dom setup
            ├── TaskForm.test.jsx   Form tests
            └── TaskItem.test.jsx   Task item tests
```

---

## GitHub Push Instructions

If you haven't pushed yet:

```bash
# 1. Create a new repository on GitHub (do NOT initialise with README)
# 2. Add the remote and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git add .
git commit -m "feat: initial full-stack task manager (React + Express + PostgreSQL)"
git push -u origin main
```

> **Never** commit `.env` files. They are excluded by `.gitignore`.

---

## Deployment

### Recommended providers

| Layer | Provider | Free tier? |
|-------|----------|------------|
| Frontend | **Vercel** | ✅ |
| Backend | **Railway** | ✅ (hobby plan) |
| PostgreSQL | **Railway** (add-on) or **Neon** | ✅ |

---

### Deploy the Backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select this repository and choose the **`backend/`** directory as the root (or set **Root Directory** in Railway settings).
3. Railway auto-detects Node.js and runs `npm start`.
4. Add a **PostgreSQL** plugin inside the same Railway project. Railway will inject `DATABASE_URL` automatically.
5. Set the remaining environment variables in Railway → **Variables**:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-app.vercel.app`  ← set after deploying frontend
6. Run the migration from your local machine (or Railway's shell):
   ```bash
   psql "$DATABASE_URL" -f backend/migration.sql
   ```
7. Railway exposes a URL like `https://your-app.up.railway.app`.

---

### Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import this repository.
2. Set **Root Directory** to `frontend`.
3. Framework: **Vite** (auto-detected).
4. Add environment variable:
   - `VITE_API_BASE_URL=https://your-app.up.railway.app`
5. Click **Deploy**. Vercel builds and hosts the app.

---

### Post-Deployment Verification

```bash
# Health check
curl https://your-api.up.railway.app/api/health

# Create a task
curl -X POST https://your-api.up.railway.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Deployed!"}'

# List tasks
curl https://your-api.up.railway.app/api/tasks
```

---

## Security Decisions

- **Parameterized queries only** — user input is never concatenated into SQL strings.
- **Environment variables** for all secrets — `.env` is git-ignored.
- **CORS whitelist** — only the specified frontend origin(s) are allowed.
- **Stack traces hidden** — the error handler logs full errors server-side but sends only safe messages to clients.
- **Input validation** on both client (React) and server (express-validator) — the server is the authoritative validator.
- **Input length limits** enforced at the DB level (VARCHAR(255)) and in validation rules.

---

## License

MIT
