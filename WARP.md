# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project scope
- Monorepo for a modular job-tracking platform built with Node.js/TypeScript using npm workspaces.
- Workspaces: platform/*, modules/*, shared/*, tools/*.
- Core services (backend + React frontend) live in platform/core. Example module lives in modules/job-tracker-basic. Shared TypeScript contracts live in shared/types.

Prerequisites
- Node.js 18+ and npm 9+
- MongoDB (for full platform mode)
- Redis (optional; used by the event bus)

Environment setup
- Copy the env template and set values used by platform/core default config:
  - DATABASE_URL, DATABASE_NAME, REDIS_URL, JWT_SECRET

Common commands (root)
- Install dependencies: npm install
- Start everything in dev (platform + example module): npm run dev
- Build all workspaces: npm run build
- Lint repo: npm run lint
- Type-check repo: npm run type-check
- Test all workspaces: npm run test

Workspace-scoped commands
- Platform backend + frontend (watch): npm run dev --workspace=@platform/core
  - Backend only (watch): npm run dev:backend --workspace=@platform/core
  - Frontend only (Vite dev server): npm run dev:frontend --workspace=@platform/core
- Build platform: npm run build --workspace=@platform/core
- Test platform: npm run test --workspace=@platform/core
- Example module dev (watch): npm run dev --workspace=@modules/job-tracker-basic
- Build example module: npm run build --workspace=@modules/job-tracker-basic
- Test example module: npm run test --workspace=@modules/job-tracker-basic

Running a single test
- By file path: npm run test --workspace=@platform/core -- path/to/test.spec.ts
- By name/pattern: npm run test --workspace=@modules/job-tracker-basic -- -t "pattern"

Demo mode (no DB/Redis required)
- Useful when you want endpoints and the UI shell without standing up external services:
  - Start minimal backend server: npm exec -w @platform/core tsx src/backend/index-simple.ts
  - Start frontend (separately): npm run dev:frontend --workspace=@platform/core

Dev servers and ports
- Backend (platform/core): 3000
- Frontend (platform/core via Vite): 5173
- Vite proxies /api to http://localhost:3000 during development.

High-level architecture
- Monorepo via npm workspaces
  - Workspaces are declared in the root package.json. Use --workspace to target a single package.

- Shared contracts (shared/types)
  - Definitive TypeScript interfaces for platform services, module manifests, module runtime (backend/frontend), data contracts, events, and UI wiring.
  - Key files: shared/types/src/module.ts (module runtime contracts), shared/types/src/platform.ts (platform/core service contracts), shared/types/src/index.ts (barrel export).

- Platform Core (platform/core)
  - Backend
    - src/backend/platform.ts defines the Platform class that orchestrates core services: DataService, EventBusService, AuthenticationService, StorageService, and ModuleManagerService. It loads/enables modules (auto-enable supported), wires service events, and handles graceful shutdown.
    - src/backend/index.ts boots an Express app, initializes the Platform, exposes platform and module management endpoints, mocks job APIs when persistence is not available in some handlers, and serves static uploads under /storage.
    - Default config (in platform.ts) resolves DATABASE_URL, DATABASE_NAME, REDIS_URL, JWT_SECRET from environment with sensible defaults for local dev.
  - Frontend
    - React + Vite app under src/frontend with a simple shell: Header, ModuleStore, Workspace. It fetches /api/modules and /api/platform/info and allows enabling/disabling modules via /api/modules/:moduleId/(enable|disable).
    - vite.config.ts outputs to dist/frontend and proxies /api to the backend.

- Modules (example: modules/job-tracker-basic)
  - Module manifest (module.json) declares metadata, permissions, exported entry points (backend/frontend), UI routes/navigation/widgets, and event publish/subscribe topics.
  - Backend implementation (src/backend/index.ts) implements ModuleBackend using shared/types: initialize(), registerRoutes(), registerEventHandlers(), shutdown().
    - Exposes CRUD for jobs and companies and a status update route. Persists via DataService and emits domain events on the EventBus (e.g., job.created, job.updated, job.status.changed).
  - package.json scripts support watch builds with tsx, TypeScript builds to dist/backend, and jest for tests.

Operational notes
- Full platform mode requires a working MongoDB connection; otherwise initialization will fail early. For a quick backend smoke-run without infra, use the demo mode command above.
- Frontend works independently of platform initialization in demo mode; it will still display/store data via the mocked endpoints in index-simple.ts.
- Static uploads are served from /storage by the backend.

Key endpoints (platform/core)
- Health: GET /health
- Platform info: GET /api/platform/info
- List modules: GET /api/modules
- Enable/disable module: POST /api/modules/:moduleId/(enable|disable)
- Example job APIs (mocked in dev/demo): GET/POST /api/jobs, GET/PUT/DELETE /api/jobs/:id, PATCH /api/jobs/:id/status, GET /api/stats/overview

Notes on repository docs
- README.md contains a conceptual overview, environment variables, a list of planned modules, and module development snippets; the commands above reflect the actual scripts in package.json files.
