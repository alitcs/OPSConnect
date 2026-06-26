# ConnectOPS

An AI-powered organizational collaboration and connectivity tool for the Ontario Public Service (OPS). This repository is a **proof-of-concept prototype**: the backend is fully scaffolded with REST routes, controllers, services, and middleware, but uses **mock/dummy data** instead of real databases or external integrations. The frontend is a fully functional React app built against that mock backend.

> Built for the OGT Summer 2026 Student Proposal competition — Track 2: Knowledge Retrieval and Information Access.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast, modern, scalable component model. Mobile-first responsive UI. |
| Routing | React Router | Standard SPA routing. |
| Backend | Node + Express + TypeScript | Clean REST scaffold, easy to swap mock data for real services later. |
| Data | In-memory / JSON | No DB required for the POC. Structured like real relational data. |
| AI | Mock AI service | Simulates an LLM with a library of query→response pairs. Swap for Microsoft Copilot / a Python service later. |

The architecture is deliberately layered (routes → controllers → services → data) so the mock pieces can be replaced one at a time with real implementations (e.g. Microsoft Entra ID auth, a real database, a Python AI microservice).

## Project Structure

```
connectops/
├── package.json            # npm workspaces root (runs backend + frontend together)
├── backend/                # Express + TypeScript API (mock data)
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       ├── types.ts
│       ├── data/           # JSON seed data + in-memory store
│       ├── middleware/     # mock auth
│       ├── services/       # mock AI service, user service
│       ├── controllers/    # request handlers
│       └── routes/         # route definitions
└── frontend/               # React + TypeScript (Vite) SPA
    └── src/
        ├── api/            # typed API client
        ├── components/     # reusable UI components
        ├── pages/          # route-level pages
        ├── context/        # auth/session context
        ├── types.ts
        └── styles/         # global + theme CSS
```

## Getting Started

From the repository root:

```bash
npm install          # installs backend + frontend workspaces
npm run dev          # runs backend (:4000) and frontend (:5173) together
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api

The frontend dev server proxies `/api` to the backend, so no CORS config is needed in development.

## Mock Auth / User Switching

There is no real authentication. A login page lets you switch between several dummy employees (a manager, a co-op student, a senior employee) to experience the app from different perspectives. In production this would integrate with Microsoft Entra ID / Azure AD via MSAL.

## Replacing Mocks Later

- **Database:** replace `backend/src/data/store.ts` with a real data layer. Controllers/services are already abstracted from it.
- **AI:** replace `backend/src/services/mockAIService.ts` with a call to Microsoft Copilot or a Python AI microservice. The response shape (`ChatResponse`) stays the same.
- **Auth:** replace `backend/src/middleware/mockAuth.ts` with MSAL token validation.
