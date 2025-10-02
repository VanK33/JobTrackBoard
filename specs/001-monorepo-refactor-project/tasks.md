# Tasks: Monorepo Structure Refactoring

**Input**: Design documents from `/specs/001-monorepo-refactor-project/`
**Prerequisites**: plan.md, research.md, directory-structure.md, migration-stages.md, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ LOADED: TypeScript monorepo, web app (backend + frontend)
2. Load optional design documents:
   → ✅ LOADED: research.md (6 decisions), migration-stages.md (8 stages)
   → ✅ LOADED: directory-structure.md (file mappings), quickstart.md (verification)
3. Generate tasks by category:
   → Setup: Foundation directories and configuration
   → Stage 1-8: Incremental migration tasks
   → Verification: Test after each stage
   → Commit: Git commit and push after each stage
4. Apply task rules:
   → Sequential execution (refactoring is inherently sequential)
   → No [P] markers (each stage depends on previous)
   → Test → Modify → Verify → Commit pattern
5. Number tasks sequentially (T001, T002...)
6. Generate verification checklist for each stage
7. Validate task completeness:
   → All 8 stages covered
   → All verification steps included
   → All commit steps included
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] Description`
- Sequential execution (no parallelization for refactoring)
- Include exact file paths in descriptions
- Each stage: Create/Move → Update → Test → Commit → Push

## Path Conventions
- Web app monorepo: `platform/core/src/backend/`, `platform/core/src/frontend/`
- Shared code: `shared/types/`, `shared/utils/`
- Modules: `modules/job-tracker-basic/`
- Root: `.runtime/`, `dist/`, configuration files

---

## Stage 0: Foundation (Preparation)

### Setup Tasks
- [ ] **T001** Create `.runtime/` directory structure at repository root
  - `mkdir -p .runtime/temp-uploads .runtime/storage .runtime/local`
  - Verify directories created with `ls -la .runtime/`

- [ ] **T002** Create `dist/` directory for centralized build output
  - `mkdir -p dist`
  - Verify with `ls -la dist/`

- [ ] **T003** Create new backend directories
  - `mkdir -p platform/core/src/backend/api`
  - `mkdir -p platform/core/src/backend/database`
  - Verify with `ls -la platform/core/src/backend/`

- [ ] **T004** Create new frontend directories
  - `mkdir -p platform/core/src/frontend/pages`
  - `mkdir -p platform/core/src/frontend/services`
  - `mkdir -p platform/core/src/frontend/hooks`
  - Verify with `ls -la platform/core/src/frontend/`

- [ ] **T005** Create shared configuration directory
  - `mkdir -p platform/core/src/shared/config`
  - Verify with `ls -la platform/core/src/shared/`

- [ ] **T006** Create `platform/core/src/shared/config/paths.ts`
  - Implement PATHS configuration with PROJECT_ROOT resolution
  - Include RUNTIME_DIR, TEMP_UPLOADS, STORAGE, LOCAL, DIST
  - Add directory creation logic (fs.mkdirSync with recursive: true)
  - Export PATHS object

- [ ] **T007** Update `.gitignore` to exclude new directories
  - Add `.runtime/` to .gitignore
  - Add `dist/` to .gitignore
  - Add `*.log` to .gitignore
  - Verify with `git check-ignore .runtime/ dist/`

### Verification Tasks
- [ ] **T008** Verify Stage 0: Test that application still runs
  - Run `npm run type-check` (should pass with no errors)
  - Run `npm run dev:backend` (should start on port 3000)
  - Run `npm run dev:frontend` (should start on port 5174)
  - Verify no errors in console output

### Commit Tasks
- [ ] **T009** Commit Stage 0: Foundation
  - `git add .`
  - Commit message: "refactor(structure): create new directory structure\n\n- Add .runtime/ for runtime directories\n- Add dist/ for centralized build output\n- Add shared/config for configuration\n- Create PATHS config for runtime directory resolution\n\n[Stage 0/8: Foundation]"
  - `git push origin 001-monorepo-refactor-project`
  - Verify commit with `git log --oneline -1`

---

## Stage 1: Runtime Directories Migration

### Implementation Tasks
- [ ] **T010** Update `platform/core/src/backend/services/storage-service.ts`
  - Add import: `import { PATHS } from '../../shared/config/paths';`
  - Replace all hardcoded paths with `PATHS.STORAGE`, `PATHS.TEMP_UPLOADS`
  - Search for: `'./storage'`, `'./temp-uploads'`, `'storage/'`, `'temp-uploads/'`
  - Verify with `npm run type-check`

- [ ] **T011** Update `platform/core/src/backend/services/storage-manager.ts`
  - Add import: `import { PATHS } from '../../shared/config/paths';`
  - Replace hardcoded storage paths with PATHS references
  - Verify with `npm run type-check`

- [ ] **T012** Find and update all multer middleware configurations
  - Search codebase: `grep -r "multer" platform/core/src/backend/`
  - Update `dest:` or `storage:` to use `PATHS.TEMP_UPLOADS`
  - Verify with `npm run type-check`

- [ ] **T013** Search for all hardcoded path references
  - Run: `grep -r "temp-uploads" platform/core/src/backend/`
  - Run: `grep -r "storage" platform/core/src/backend/ | grep -v "storage-service"`
  - Run: `grep -r "local" platform/core/src/backend/`
  - Update each occurrence to use PATHS config
  - Verify with `npm run type-check`

- [ ] **T014** Copy existing runtime data to new locations (if exists)
  - `cp -r platform/core/temp-uploads/* .runtime/temp-uploads/ 2>/dev/null || true`
  - `cp -r platform/core/storage/* .runtime/storage/ 2>/dev/null || true`
  - `cp -r platform/core/local/* .runtime/local/ 2>/dev/null || true`
  - Verify data copied with `ls -la .runtime/*/`

- [ ] **T015** Remove old runtime directories
  - `rm -rf platform/core/temp-uploads`
  - `rm -rf platform/core/storage`
  - `rm -rf platform/core/local`
  - Verify removed with `ls platform/core/`

### Verification Tasks
- [ ] **T016** Verify Stage 1: Test runtime directory migration
  - Run `npm run type-check` (should pass)
  - Run `npm run dev:backend` (should start without path errors)
  - Check logs for PATHS.RUNTIME_DIR output
  - If file upload exists, test upload and verify file in `.runtime/temp-uploads/`
  - Verify no path-related errors in console

### Commit Tasks
- [ ] **T017** Commit Stage 1: Runtime Directories
  - `git add .`
  - Commit message: "refactor(runtime): move runtime directories to .runtime/\n\n- Move temp-uploads/, storage/, local/ to .runtime/\n- Update all services to use PATHS config\n- Remove old directories from platform/core\n\n[Stage 1/8: Runtime Directories]"
  - `git push origin 001-monorepo-refactor-project`

---

## Stage 2: Backend Database Layer Organization

### Implementation Tasks
- [ ] **T018** Move database services to `platform/core/src/backend/database/`
  - `git mv platform/core/src/backend/services/postgresql-service.ts platform/core/src/backend/database/postgresql-service.ts`
  - `git mv platform/core/src/backend/services/sqlite-service.ts platform/core/src/backend/database/sqlite-service.ts`
  - `git mv platform/core/src/backend/services/database-manager.ts platform/core/src/backend/database/database-manager.ts`
  - `git mv platform/core/src/backend/services/connection-pool-manager.ts platform/core/src/backend/database/connection-pool-manager.ts`
  - `git mv platform/core/src/backend/services/data-mapper.ts platform/core/src/backend/database/data-mapper.ts`
  - `git mv platform/core/src/backend/services/config-persistence.ts platform/core/src/backend/database/config-persistence.ts`
  - `git mv platform/core/src/backend/services/supabase-client.ts platform/core/src/backend/database/supabase-client.ts`

- [ ] **T019** Update imports within database/ files (if needed)
  - Review each moved file for relative imports
  - Update imports between database files (should be same directory now)
  - Verify with `npm run type-check`

- [ ] **T020** Find all files importing database services
  - `grep -r "from.*postgresql-service" platform/core/src/`
  - `grep -r "from.*database-manager" platform/core/src/`
  - `grep -r "from.*sqlite-service" platform/core/src/`
  - `grep -r "from.*supabase-client" platform/core/src/`
  - List all files found for next task

- [ ] **T021** Update imports in files that use database services
  - Update `platform.ts` (or `index-with-db.ts`)
  - Update `data-service.ts`
  - Update `middleware/database-config.ts`
  - Change `from '../services/postgresql-service'` to `from '../database/postgresql-service'`
  - Change `from './services/database-manager'` to `from './database/database-manager'`
  - Verify each import with `npm run type-check`

### Verification Tasks
- [ ] **T022** Verify Stage 2: Test database layer organization
  - Run `npm run type-check` (should pass with no errors)
  - Run `npm run dev:backend` (should start successfully)
  - Test database connection: `curl http://localhost:3000/health`
  - Verify response shows database status
  - Check no module resolution errors in logs

### Commit Tasks
- [ ] **T023** Commit Stage 2: Backend Database Layer
  - `git add .`
  - Commit message: "refactor(backend): organize database services into database/\n\n- Move 7 database-related services to backend/database/\n- Update all imports to new paths\n- Maintain service functionality\n\n[Stage 2/8: Backend Database Layer]"
  - `git push origin 001-monorepo-refactor-project`

---

## Stage 3: Backend API Routes Extraction

### Implementation Tasks
- [ ] **T024** Analyze routes in `platform/core/src/backend/platform.ts`
  - Run: `grep "app\.\(get\|post\|put\|delete\|patch\)" platform/core/src/backend/platform.ts`
  - Document all route definitions found
  - Identify route groups (health, jobs, auth, modules, database, platform)

- [ ] **T025** Create `platform/core/src/backend/api/health.ts`
  - Import Router from express
  - Export healthRouter
  - Extract health check route from platform.ts
  - Implement route handler logic

- [ ] **T026** Create `platform/core/src/backend/api/jobs.ts`
  - Import Router from express
  - Import DataService or required services
  - Export jobsRouter
  - Extract all job-related routes (GET /, POST /, GET /:id, PUT /:id, DELETE /:id, PATCH /:id/status)
  - Implement route handler logic for each endpoint

- [ ] **T027** Create `platform/core/src/backend/api/auth.ts`
  - Import Router from express
  - Import AuthService
  - Export authRouter
  - Extract authentication routes (POST /register, POST /login, etc.)
  - Implement route handler logic

- [ ] **T028** Create `platform/core/src/backend/api/modules.ts`
  - Import Router from express
  - Import ModuleManager
  - Export modulesRouter
  - Extract module management routes
  - Implement route handler logic

- [ ] **T029** Create `platform/core/src/backend/api/database.ts`
  - Import Router from express
  - Import DatabaseManager
  - Export databaseRouter
  - Extract database configuration routes
  - Implement route handler logic

- [ ] **T030** Create `platform/core/src/backend/api/platform.ts`
  - Import Router from express
  - Export platformRouter
  - Extract platform info routes
  - Implement route handler logic

- [ ] **T031** Update `platform/core/src/backend/platform.ts` to use routers
  - Import all routers: `import { healthRouter } from './api/health';`
  - Import jobsRouter, authRouter, modulesRouter, databaseRouter, platformRouter
  - Replace inline route definitions with: `app.use('/health', healthRouter);`
  - `app.use('/api/jobs', jobsRouter);`
  - `app.use('/api/auth', authRouter);`
  - `app.use('/api/modules', modulesRouter);`
  - `app.use('/api/database', databaseRouter);`
  - `app.use('/api/platform', platformRouter);`
  - Remove old inline route definitions

### Verification Tasks
- [ ] **T032** Verify Stage 3: Test API routes extraction
  - Run `npm run type-check` (should pass)
  - Run `npm run dev:backend` (should start)
  - Test each endpoint:
    - `curl http://localhost:3000/health`
    - `curl http://localhost:3000/api/jobs`
    - `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'`
    - `curl http://localhost:3000/api/modules`
    - `curl http://localhost:3000/api/platform/info`
  - Verify all endpoints return expected responses

### Commit Tasks
- [ ] **T033** Commit Stage 3: Backend API Routes
  - `git add .`
  - Commit message: "refactor(backend): extract routes into api/ directory\n\n- Create separate route files for each domain\n- Update platform.ts to use routers\n- Maintain all endpoint functionality\n\n[Stage 3/8: Backend API Routes]"
  - `git push origin 001-monorepo-refactor-project`

---

## Stage 4: Frontend Pages/Components Separation

### Implementation Tasks
- [ ] **T034** Move page components from components/ to pages/
  - `git mv platform/core/src/frontend/components/Workspace.tsx platform/core/src/frontend/pages/Workspace.tsx`
  - `git mv platform/core/src/frontend/components/MinimalistWorkspace.tsx platform/core/src/frontend/pages/MinimalistWorkspace.tsx`
  - `git mv platform/core/src/frontend/components/JobDashboard.tsx platform/core/src/frontend/pages/JobDashboard.tsx`
  - `git mv platform/core/src/frontend/components/ModuleStore.tsx platform/core/src/frontend/pages/ModuleStore.tsx`

- [ ] **T035** Update imports in `platform/core/src/frontend/App.tsx`
  - Find imports for Workspace, MinimalistWorkspace, JobDashboard, ModuleStore
  - Change `from './components/Workspace'` to `from './pages/Workspace'`
  - Update all page component imports
  - Verify with `npm run type-check`

- [ ] **T036** Move API client from utils/ to services/
  - `git mv platform/core/src/frontend/utils/api-client.ts platform/core/src/frontend/services/api-client.ts`
  - `git mv platform/core/src/frontend/utils/data-migration.ts platform/core/src/frontend/services/data-migration.ts`

- [ ] **T037** Find all imports of api-client and data-migration
  - `grep -r "from.*api-client" platform/core/src/frontend/`
  - `grep -r "from.*data-migration" platform/core/src/frontend/`
  - List all files for update

- [ ] **T038** Update imports for api-client in all files
  - Update each file found in T037
  - Change `from '../utils/api-client'` to `from '../services/api-client'`
  - Change `from './utils/api-client'` to `from './services/api-client'`
  - Update data-migration imports similarly
  - Verify with `npm run type-check`

### Verification Tasks
- [ ] **T039** Verify Stage 4: Test frontend organization
  - Run `npm run type-check` (should pass)
  - Run `npm run dev:frontend` (should start on port 5174)
  - Open browser to `http://localhost:5174`
  - Navigate through all pages (Workspace, JobDashboard, ModuleStore)
  - Check browser console for import errors (should be none)
  - Verify all components render correctly

### Commit Tasks
- [ ] **T040** Commit Stage 4: Frontend Organization
  - `git add .`
  - Commit message: "refactor(frontend): separate pages from components\n\n- Move page components to pages/ directory\n- Move API client to services/ directory\n- Update all imports\n\n[Stage 4/8: Frontend Organization]"
  - `git push origin 001-monorepo-refactor-project`

---

## Stage 5: Backend Entry Point Consolidation

### Implementation Tasks
- [ ] **T041** Review `platform/core/src/backend/index-with-db.ts`
  - Read file to understand current entry point logic
  - Identify what needs to be preserved
  - Document dependencies

- [ ] **T042** Rename platform.ts to app.ts (Express app factory)
  - `git mv platform/core/src/backend/platform.ts platform/core/src/backend/app.ts`

- [ ] **T043** Update `app.ts` to export app factory function
  - Refactor to export `createApp()` function
  - Keep all middleware and route setup in createApp
  - Add `export default createApp();` at end
  - Remove server.listen() (move to index.ts)

- [ ] **T044** Create clean `platform/core/src/backend/index.ts`
  - Import: `import { createApp } from './app';`
  - Import: `import { PATHS } from '../shared/config/paths';`
  - Define PORT from env (default 3000)
  - Call createApp() to get app instance
  - Add app.listen() with logging
  - Log runtime directory path

- [ ] **T045** Update files importing platform.ts
  - `grep -r "from.*platform" platform/core/src/backend/`
  - Update imports to `from './app'` or `from '../app'`
  - Verify with `npm run type-check`

- [ ] **T046** Delete unused entry files
  - `git rm platform/core/src/backend/index.ts` (if it exists and is unused)
  - `git rm platform/core/src/backend/index-simple.ts`
  - Keep index-with-db.ts temporarily for reference (will delete after verification)

- [ ] **T047** Update `package.json` scripts for new entry point
  - Update `"dev:backend"` to: `"tsx watch platform/core/src/backend/index.ts"`
  - Update `"start"` to: `"node dist/backend/index.js"`
  - Verify scripts with `npm run --dry-run dev:backend`

### Verification Tasks
- [ ] **T048** Verify Stage 5: Test backend entry point
  - Stop any running servers
  - Run `npm run dev:backend` (should start successfully)
  - Verify startup logs show: "Backend server running on port 3000"
  - Verify runtime directory logged
  - Test endpoints: `curl http://localhost:3000/health`
  - `curl http://localhost:3000/api/jobs`
  - Check `.runtime/` directories are created
  - Verify no errors in console

- [ ] **T049** Delete index-with-db.ts after successful verification
  - `git rm platform/core/src/backend/index-with-db.ts`
  - Verify with `ls platform/core/src/backend/`

### Commit Tasks
- [ ] **T050** Commit Stage 5: Backend Entry Point
  - `git add .`
  - Commit message: "refactor(backend): consolidate to single entry point\n\n- Rename platform.ts to app.ts (Express app factory)\n- Create clean backend/index.ts entry point\n- Remove unused index files\n- Update npm scripts\n\n[Stage 5/8: Backend Entry Point]"
  - `git push origin 001-monorepo-refactor-project`

---

## Stage 6: Unified Application Entry Point

### Implementation Tasks
- [ ] **T051** Create `platform/core/src/index.ts` (unified entry point)
  - Import child_process spawn
  - Import path
  - Check NODE_ENV for production vs development
  - Production: require('./backend/index')
  - Development: spawn tsx watch for backend, spawn vite for frontend
  - Add process cleanup handlers (SIGINT, SIGTERM)
  - Pipe stdout/stderr from child processes

- [ ] **T052** Update backend app.ts for production static file serving
  - Add check for NODE_ENV === 'production'
  - If production: configure express.static for dist/frontend
  - Add SPA fallback route: `app.get('*', ...)` to serve index.html
  - Calculate correct path to dist/frontend: `path.join(__dirname, '../../frontend')`

- [ ] **T053** Update root `package.json` scripts for unified entry
  - Add `"dev": "tsx platform/core/src/index.ts"`
  - Keep `"dev:backend": "tsx watch platform/core/src/backend/index.ts"`
  - Keep `"dev:frontend": "vite --config platform/core/vite.config.ts"`
  - Update `"build": "npm run build:backend && npm run build:frontend"`
  - Update `"build:backend": "tsc --project platform/core/tsconfig.json"`
  - Update `"build:frontend": "vite build --config platform/core/vite.config.ts --outDir ../../dist/frontend"`
  - Keep `"start": "NODE_ENV=production node dist/backend/index.js"`

- [ ] **T054** Update TypeScript build output directories
  - Edit `platform/core/tsconfig.json`
  - Set `"outDir": "../../dist/backend"`
  - Set `"rootDir": "./src"`
  - Add `"exclude": ["node_modules", "dist", "src/frontend"]`

- [ ] **T055** Update Vite configuration for build output
  - Edit `platform/core/vite.config.ts`
  - Add to config: `build: { outDir: '../../dist/frontend' }`
  - Verify configuration syntax

### Verification Tasks
- [ ] **T056** Verify Stage 6: Test unified entry point (Development)
  - Run `npm run dev` (should start both backend and frontend)
  - Wait for both servers to start
  - Verify backend on: `curl http://localhost:3000/health`
  - Verify frontend on: `curl http://localhost:5174`
  - Open browser to `http://localhost:5174`
  - Test frontend can call backend API
  - Check both process outputs visible in terminal

- [ ] **T057** Verify Stage 6: Test production build
  - Clean previous builds: `rm -rf dist/`
  - Run `npm run build` (should build both)
  - Verify `dist/backend/` exists and contains `index.js`
  - Verify `dist/frontend/` exists and contains `index.html`
  - Run `NODE_ENV=production npm start`
  - Test production server:
    - `curl http://localhost:3000/health` (API should work)
    - `curl http://localhost:3000/` (should return HTML)
    - `curl -I http://localhost:3000/assets/index-*.js` (check 200 response)
  - Open browser to `http://localhost:3000` (app should load from single server)

### Commit Tasks
- [ ] **T058** Commit Stage 6: Unified Entry Point
  - `git add .`
  - Commit message: "feat(structure): create unified entry point\n\n- Add platform/core/src/index.ts for development\n- Update backend to serve frontend in production\n- Simplify npm scripts with unified dev command\n\n[Stage 6/8: Unified Entry Point]"
  - `git push origin 001-monorepo-refactor-project`

---

## Stage 7: README Documentation

### Implementation Tasks
- [ ] **T059** Update root `README.md`
  - Add section on new directory structure
  - Document new npm scripts (dev, build, start)
  - Explain `.runtime/` and `dist/` directories
  - Update getting started instructions
  - Add workspace overview

- [ ] **T060** Create `platform/core/README.md`
  - Document platform core purpose
  - Explain src/ structure (backend, frontend, shared)
  - List development commands
  - Explain build process

- [ ] **T061** Create `platform/core/src/backend/README.md`
  - Document backend architecture
  - Explain directory structure (api/, services/, database/, middleware/, utils/)
  - Provide examples of adding routes
  - Document entry point (index.ts, app.ts)

- [ ] **T062** Create `platform/core/src/frontend/README.md`
  - Document frontend architecture
  - Explain directory structure (components/, pages/, services/, hooks/, utils/)
  - Document state management approach
  - Provide component creation examples

- [ ] **T063** Create or update `modules/job-tracker-basic/README.md`
  - Document module purpose
  - Explain module structure
  - Document API provided by module
  - Installation and usage instructions

- [ ] **T064** Create or update `shared/types/README.md`
  - Document purpose of shared types
  - List available type definitions
  - Usage examples
  - How to add new types

- [ ] **T065** Create or update `shared/utils/README.md`
  - Document shared utilities (if directory exists)
  - List available utilities
  - Usage examples

- [ ] **T066** Create or update `tools/module-cli/README.md`
  - Document CLI tool purpose
  - List available commands
  - Usage examples
  - Development instructions

### Verification Tasks
- [ ] **T067** Verify Stage 7: Documentation completeness
  - Find all README files: `find . -name "README.md" -not -path "*/node_modules/*" -not -path "*/.git/*"`
  - Read each README to verify content is meaningful
  - Check for broken links or references
  - Run app to ensure docs didn't break anything: `npm run dev`

### Commit Tasks
- [ ] **T068** Commit Stage 7: Documentation
  - `git add .`
  - Commit message: "docs: add README files to major directories\n\n- Update root README with new structure\n- Add platform/core README\n- Add backend and frontend README files\n- Add module and shared workspace READMEs\n\n[Stage 7/8: Documentation]"
  - `git push origin 001-monorepo-refactor-project`

---

## Stage 8: Deployment Configuration

### Implementation Tasks
- [ ] **T069** Update `render.yaml` for new entry point
  - Change `buildCommand` to: `npm install && npm run build`
  - Change `startCommand` to: `npm start`
  - Add environment variable: `RUNTIME_DIR` with value `/opt/render/.runtime`
  - Keep existing DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET
  - Verify NODE_ENV is set to production

- [ ] **T070** Verify TypeScript compilation configuration
  - Check `platform/core/tsconfig.json` has correct outDir
  - Verify extends root tsconfig
  - Verify includes and excludes are correct

- [ ] **T071** Verify Vite build configuration
  - Check `platform/core/vite.config.ts` has correct outDir
  - Verify plugins configuration
  - Verify base path if needed

- [ ] **T072** Test full production build locally
  - Clean: `rm -rf dist/ node_modules/`
  - Install fresh: `npm install`
  - Build: `npm run build`
  - Verify: `ls -la dist/backend/index.js`
  - Verify: `ls -la dist/frontend/index.html`
  - Verify: `ls -la dist/frontend/assets/`

- [ ] **T073** Test production server with environment variables
  - Set test env vars:
    - `export NODE_ENV=production`
    - `export DATABASE_URL="postgresql://localhost/test"`
    - `export RUNTIME_DIR="/tmp/job-tracker-runtime"`
  - Run: `npm start`
  - Test health: `curl http://localhost:3000/health`
  - Verify runtime dir created: `ls -la /tmp/job-tracker-runtime/`
  - Unset env vars: `unset DATABASE_URL RUNTIME_DIR NODE_ENV`

### Verification Tasks
- [ ] **T074** Verify Stage 8: Comprehensive production build test
  - Clean build: `rm -rf dist/ && npm run build`
  - Start production: `NODE_ENV=production npm start`
  - Test API health: `curl http://localhost:3000/health | jq`
  - Test API endpoints: `curl http://localhost:3000/api/jobs | jq`
  - Test frontend serving: `curl http://localhost:3000/` | grep "<title>"`
  - Test static assets: `curl -I http://localhost:3000/assets/index-*.js` (should return 200)
  - Open browser to `http://localhost:3000` and verify app works

- [ ] **T075** Pre-deployment checklist verification
  - [ ] `npm run build` succeeds without errors
  - [ ] `npm start` runs without errors
  - [ ] Health endpoint returns 200
  - [ ] All API endpoints work
  - [ ] Frontend HTML is served correctly
  - [ ] Static assets load (JS, CSS)
  - [ ] Environment variables are respected
  - [ ] Runtime directories are created automatically

### Commit Tasks
- [ ] **T076** Commit Stage 8: Deployment Config
  - `git add .`
  - Commit message: "chore(deploy): update deployment configuration\n\n- Update render.yaml for new entry point\n- Configure TypeScript output to dist/backend\n- Configure Vite output to dist/frontend\n- Verify production build works\n\n[Stage 8/8: Deployment Config]"
  - `git push origin 001-monorepo-refactor-project`

---

## Post-Refactoring Tasks

### Final Verification
- [ ] **T077** Run comprehensive end-to-end test
  - Type check: `npm run type-check` (must pass)
  - Dev mode: `npm run dev` (both servers start)
  - Test all features manually in browser
  - Production build: `npm run build` (must succeed)
  - Production server: `NODE_ENV=production npm start` (must work)
  - Test all features in production mode

- [ ] **T078** Review all changes in git
  - Run: `git log --oneline` to see all stage commits
  - Run: `git diff main` to see total changes
  - Verify each stage commit message is clear
  - Verify no sensitive data committed

### Merge and Deploy
- [ ] **T079** Merge to main branch
  - `git checkout main`
  - `git merge 001-monorepo-refactor-project`
  - Resolve any conflicts (shouldn't be any if working alone)
  - `git push origin main`

- [ ] **T080** Verify deployment on Render.com
  - Monitor build logs in Render dashboard
  - Verify build succeeds
  - Verify deploy succeeds
  - Test production URL
  - Monitor error logs for any issues

### Cleanup
- [ ] **T081** Delete feature branch (after successful deployment)
  - `git branch -d 001-monorepo-refactor-project`
  - `git push origin --delete 001-monorepo-refactor-project`

- [ ] **T082** Update team documentation
  - Share refactoring results with team
  - Update onboarding documentation
  - Create contribution guidelines based on new structure

---

## Dependencies

### Sequential Execution
All tasks must be executed in order - refactoring is inherently sequential:
- Stage 0 (T001-T009) must complete before Stage 1
- Stage 1 (T010-T017) must complete before Stage 2
- Stage 2 (T018-T023) must complete before Stage 3
- Stage 3 (T024-T033) must complete before Stage 4
- Stage 4 (T034-T040) must complete before Stage 5
- Stage 5 (T041-T050) must complete before Stage 6
- Stage 6 (T051-T058) must complete before Stage 7
- Stage 7 (T059-T068) must complete before Stage 8
- Stage 8 (T069-T076) must complete before Post-Refactoring
- Post-Refactoring (T077-T082) is final

### Critical Verification Points
- After each stage, MUST run verification tasks before committing
- After each commit, MUST push to remote for backup
- If any verification fails, MUST fix before proceeding to next stage

---

## Rollback Procedures

### If a Task Fails
1. Read error messages carefully
2. Try to fix forward (usually faster)
3. If unclear, rollback to previous commit:
   ```bash
   git reset --hard HEAD~1
   git push -f origin 001-monorepo-refactor-project
   ```

### If App Breaks in Production
1. Immediate: Rollback Render.com to previous deployment
2. Then: Fix on feature branch
3. Redeploy after verification

---

## Task Execution Summary

**Total Tasks**: 82 tasks
**Estimated Time**: 4-6 hours (with thorough testing)
**Critical Path**: Sequential - each stage builds on previous
**Risk Level**: LOW (incremental approach with verification)

**Success Criteria**:
- All 82 tasks completed
- All verification steps passed
- Application works in dev and production
- Clean git history with 8 stage commits
- Successfully deployed to Render.com

---

## Notes

- **NO parallel execution**: Refactoring requires sequential changes
- **Test thoroughly**: Each stage must work before proceeding
- **Commit frequently**: Each stage provides rollback point
- **Push for backup**: Remote backup after each stage critical
- **Document issues**: Note any unexpected problems in commit messages
- **Take breaks**: 8 stages is significant work, pace yourself

---

## Validation Checklist
*GATE: All items must be true before starting*

- [x] All 8 migration stages have tasks
- [x] Each stage has create/move → update → verify → commit tasks
- [x] Verification tasks included after each stage
- [x] Commit tasks include proper git messages
- [x] Each task specifies exact actions or file paths
- [x] Rollback procedure documented
- [x] Success criteria defined
- [x] Post-refactoring tasks included

**Status**: ✅ READY FOR EXECUTION

Next step: Begin with **T001** - Create `.runtime/` directory structure
