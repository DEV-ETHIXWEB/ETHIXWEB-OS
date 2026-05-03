# TeamFlow — Team Task Manager

A premium, full-stack team collaboration platform for organizing projects, assigning tasks, and tracking progress on a Kanban board with role-based access control.

> Built as a portfolio-grade SaaS demo: handcrafted UI, real backend, real database, real auth.

## ✨ Features

- 🔐 **JWT authentication** — sign up, sign in, persistent sessions
- 📁 **Projects with members** — invite teammates by email, control access
- 👥 **Per-project RBAC** — Admin (full control) vs. Member (status-only updates)
- 🧱 **Kanban board** — drag-and-drop with optimistic updates and instant feedback
- 📊 **Live dashboard** — completion charts, task breakdown, recent activity
- 🔔 **Smart notifications** — derived from overdue and assigned tasks
- 🎨 **Premium UI** — glassmorphism, gradients, Framer Motion micro-interactions
- ⚡ **Performance** — debounced search, request caching via React Query, optimistic mutations with rollback

## 🧰 Tech Stack

**Frontend** (`src/`)
- React 18 + Vite + TypeScript
- Tailwind CSS (semantic design tokens) + shadcn/ui
- React Query for data fetching & caching
- @dnd-kit for the Kanban board
- Framer Motion for animations
- Recharts for analytics
- Axios with JWT interceptors and unified error handling

**Backend** (`backend/`)
- Node.js + Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) + bcrypt
- Zod input validation
- CORS allowlist + rate limiting
- Structured error logging (morgan + custom logger)
- Consistent response envelope: `{ success, data, message }`

## 🏗️ Architecture

```
┌──────────────┐    Bearer JWT     ┌─────────────────┐
│  React SPA   │ ────────────────▶ │  Express API     │
│  (Vite)      │ ◀──────────────── │  /auth /projects │
│              │  { success,data } │  /tasks /users   │
└──────────────┘                    └────────┬────────┘
                                             │
                                             ▼
                                       ┌──────────┐
                                       │ MongoDB  │
                                       └──────────┘
```

- All API responses are wrapped in `{ success, data, message }`. The Axios interceptor unwraps `data` automatically.
- A single `RequireAuth` route guard protects `/app/*`.
- 401 responses globally clear the token and redirect to `/login`.
- Project-level role is loaded once per project and gates the UI; the backend re-validates on every mutation.

## 🚀 Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env             # set MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN
npm install
npm run dev                      # http://localhost:4000
```

### 2. Frontend

```bash
# inside root repo directory
cp .env.example .env             # set VITE_API_URL=http://localhost:4000
npm install
npm run dev                      # http://localhost:8080
```

The backend `README.md` documents every endpoint and the full RBAC matrix.

## ☁️ Deploy on Railway

This repo is configured for a one-service Railway deploy:

- Railway builds the React/Vite frontend into `dist/`.
- Railway installs the backend dependencies.
- Express starts with `npm start` and serves both the API and the built frontend.
- The health check is `/health`.

### Steps

1. Push this repository to GitHub.
2. In Railway, create a new project and deploy from the GitHub repo.
3. Use the repository root as the service root. Railway will read `railway.json`.
4. Add a MongoDB service in Railway, or use MongoDB Atlas.
5. Add these Railway variables:

```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=use_a_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

`PORT` is provided by Railway automatically. `VITE_API_URL` is not needed for this single-service deploy because the frontend calls the API on the same domain.

After deploy, open your Railway public URL. You can also verify the API at:

```bash
https://your-app.up.railway.app/health
```

## 🔒 RBAC Matrix

| Action | Member | Admin |
|---|:---:|:---:|
| View project & tasks | ✅ | ✅ |
| Create task | ✅ | ✅ |
| Update task **status** (drag-and-drop) | ✅ | ✅ |
| Edit task title / description / priority / due date | ❌ | ✅ |
| Assign task | ❌ | ✅ |
| Delete task | ❌ | ✅ |
| Invite / remove members | ❌ | ✅ |
| Change member role | ❌ | ✅ |
| Delete project | ❌ | ✅ |

Enforced on the **backend** for every mutation; mirrored on the frontend for affordance.

## 🌐 Live Demo

> _Replace with your published URL_
>
> **Frontend:** https://your-teamflow.vercel.app
> **API:** https://teamflow-api.up.railway.app

## 📸 Screenshots

> _Add screenshots here once deployed_
>
> - Landing page
> - Dashboard with charts
> - Kanban board with drag-and-drop
> - Invite & role management dialog

## 📁 Project Structure

```
backend/
  src/            # Express controllers, models, routes
src/
  api/            # Axios + per-resource API modules + normalizers
  components/     # Logo, UserAvatar, RequireAuth, shadcn/ui
  context/        # AuthContext (JWT + me + 401 handling)
  hooks/          # useDebounce, useAllTasks, useDerivedNotifications
  layouts/        # AppLayout (sidebar + topbar + outlet)
  lib/            # api.ts (Axios instance + envelope unwrap)
  pages/          # Landing, AuthForm, Dashboard, Projects, ProjectDetail
```

## 📄 License

MIT
