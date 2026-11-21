# Full Stack Job Portal

A job portal where **job seekers** browse and apply for jobs, and **employers** post jobs and review applicants.

- **Frontend:** React 19, Vite 7, React Router 7, Axios
- **Backend:** Node.js, Express 5, JWT authentication, bcrypt password hashing
- **Storage:** JSON files (`backend/data/`), so no database setup is needed

## Features

| Job seeker | Employer |
| --- | --- |
| Sign up / log in | Sign up / log in |
| Browse jobs, search by keyword, location and type | Post new jobs, delete own jobs |
| Apply with name, phone, resume link and cover letter | See all applicants for their jobs |
| Dashboard showing each application's status | Move applications through *applied → reviewing → accepted / rejected* |

Other details: passwords are hashed, API routes are protected by JWT and role checks, duplicate applications are blocked, input is validated, and the backend has automated tests.

## Project structure

```
full-stack-job-portal/
├── backend/
│   ├── data/            # users.json, jobs.json, applications.json
│   ├── middleware/      # JWT auth + role checks
│   ├── routes/          # auth, jobs, applications
│   ├── utils/           # JSON file read/write helpers
│   ├── test/            # API tests (node:test)
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Navbar, ProtectedRoute
│       ├── context/     # Auth context/provider
│       ├── pages/       # Jobs, Login, Register, ApplyJob, Dashboard
│       ├── api.js
│       └── App.jsx
└── package.json         # root scripts to run both apps together
```

## Getting started

Requirements: Node.js 20 or newer.

```bash
# 1. Install everything (root, backend and frontend)
npm run install-all

# 2. Start backend (port 5000) and frontend (port 5173) together
npm run dev
```

Open **http://localhost:5173**.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Job seeker | `user@example.com` | `password123` |
| Employer | `employer@example.com` | `password123` |

### Other scripts

| Command | What it does |
| --- | --- |
| `npm run server` | Backend only (auto-restarts on changes) |
| `npm run client` | Frontend only |
| `npm test` | Run backend API tests |
| `npm run lint` | Lint the frontend |
| `npm run build` then `npm start` | Build the React app; Express serves it at http://localhost:5000 |

### Environment variables

Copy `backend/.env.example` to `backend/.env` and set your own `JWT_SECRET` before deploying.

## API

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| GET | `/api/jobs?search=&location=&type=` | Public |
| GET | `/api/jobs/:id` | Public |
| GET | `/api/jobs/mine` | Employer |
| POST | `/api/jobs` | Employer |
| DELETE | `/api/jobs/:id` | Employer (owner) |
| POST | `/api/applications` | Job seeker |
| GET | `/api/applications/me` | Job seeker |
| GET | `/api/applications/received` | Employer |
| PATCH | `/api/applications/:id/status` | Employer (job owner) |

Protected routes expect the header `Authorization: Bearer <token>`.
