# TeamFlow - Team Task Manager

A premium full-stack team collaboration platform for organizing projects, assigning tasks, and tracking progress on a Kanban board with role-based access control.

> Built as a portfolio-grade SaaS demo: handcrafted UI, real backend, real database, and real authentication.

## Live Demo

Frontend:

```txt
https://teamflow-dashboard-production-d225.up.railway.app
```

Backend API:

```txt
https://teamflow-dashboard-production.up.railway.app
```

Backend health check:

```txt
https://teamflow-dashboard-production.up.railway.app/health
```

## Demo Credentials

Use this account to test the deployed app:

```txt
Email: akashlakhwan2329@gmail.com
Password: AKASH@2329l
```

You can also create a new account from the signup page.

## Features

- JWT authentication with signup, login, and persistent sessions
- Projects with members, invite flow, and access control
- Project-level RBAC with Admin and Member roles
- Kanban board with drag-and-drop task updates
- Optimistic UI updates with rollback on failure
- Dashboard with charts, task breakdown, and recent activity
- Smart notifications derived from overdue and assigned tasks
- Premium UI using Tailwind CSS, shadcn/ui, and Framer Motion
- Axios API layer with JWT interceptors and normalized responses

## Tech Stack

Frontend (`src/`):

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- @dnd-kit
- Framer Motion
- Recharts
- Axios

Backend (`backend/`):

- Node.js
- Express
- MongoDB
- Mongoose
- JWT (`jsonwebtoken`)
- bcrypt
- Zod validation
- CORS
- Express rate limiting
- Morgan logging

## Architecture

```txt
React SPA (Vite)
    |
    | Bearer JWT
    v
Express API
    |
    v
MongoDB
```

API routes:

```txt
/auth
/projects
/tasks
/users
/health
```

All API responses use a consistent response shape:

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

The frontend Axios layer unwraps the `data` field automatically.

## Project Structure

```txt
backend/
  src/
    config/        # MongoDB connection
    middleware/    # auth, validation, error handling
    models/        # User, Project, Task
    routes/        # auth, projects, tasks, users
    utils/         # logger, response helpers
    server.js      # Express app entry point

src/
  api/             # frontend API wrappers
  components/      # shared components and shadcn/ui
  context/         # auth context
  hooks/           # custom React hooks
  layouts/         # app layout
  lib/             # Axios client and utilities
  pages/           # landing, auth, dashboard, projects
```

## Local Development

Run the backend first:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on:

```txt
http://localhost:4000
```

In another terminal, run the frontend:

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:8080
```

Root `.env` for local frontend:

```txt
VITE_API_URL=http://localhost:4000
```

Backend `.env` for local backend:

```txt
PORT=4000
MONGODB_URI=mongodb://localhost:27017/teamflow
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:8080
NODE_ENV=development
```

## Railway Deployment

This project is deployed on Railway as two separate services:

```txt
Frontend service: React/Vite app
Backend service: Express/MongoDB API
```

### Frontend Service

Railway settings:

```txt
Root Directory: /
Build Command: npm run build
Start Command: npm start
```

The root `package.json` uses:

```json
{
  "start": "vite preview --host 0.0.0.0 --port $PORT",
  "railway:build": "npm run build"
}
```

Frontend Railway variables:

```txt
NODE_VERSION=22
VITE_API_URL=https://teamflow-dashboard-production.up.railway.app
```

Do not add MongoDB variables to the frontend service.

### Backend Service

Railway settings:

```txt
Root Directory: /backend
Start Command: npm start
Healthcheck Path: /health
```

Backend Railway variables:

```txt
NODE_VERSION=22
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://teamflow-dashboard-production-d225.up.railway.app
```

Do not manually set `PORT`. Railway provides it automatically.

### Deployment Order

1. Deploy the backend service.
2. Confirm the backend health endpoint works:

```txt
https://teamflow-dashboard-production.up.railway.app/health
```

3. Deploy the frontend service.
4. Set frontend `VITE_API_URL` to the backend URL.
5. Set backend `CLIENT_ORIGIN` to the frontend URL.
6. Redeploy backend.
7. Redeploy frontend.

## RBAC Matrix

| Action | Member | Admin |
|---|:---:|:---:|
| View project and tasks | Yes | Yes |
| Create task | Yes | Yes |
| Update task status | Yes | Yes |
| Edit task title, description, priority, or due date | No | Yes |
| Assign task | No | Yes |
| Delete task | No | Yes |
| Invite or remove members | No | Yes |
| Change member role | No | Yes |
| Delete project | No | Yes |

RBAC is enforced on the backend for every protected mutation and mirrored in the frontend UI.

## Useful Scripts

Frontend/root:

```bash
npm run dev
npm run build
npm start
npm run lint
npm run test
```

Backend:

```bash
cd backend
npm run dev
npm start
```

## Notes

- Frontend API calls use `VITE_API_URL`.
- Backend CORS allows the deployed Railway frontend.
- Backend requires `MONGODB_URI` before it can start.
- `/health` is available on the backend service only.
- Keep `.env` and `.env.local` out of GitHub.

## License

MIT
