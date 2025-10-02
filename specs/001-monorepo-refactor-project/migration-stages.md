# Migration Stages

**Date**: 2025-10-02
**Purpose**: Step-by-step incremental migration plan with verification at each stage

---

## Migration Principles

1. **One thing at a time**: Each stage changes one aspect of the structure
2. **Test between stages**: Verify the application works after each stage
3. **Commit each stage**: Git commit provides rollback point
4. **Push for backup**: Remote backup after each successful stage
5. **Update imports immediately**: Don't leave broken imports

---

## Stage 0: Preparation (Foundation)

**Goal**: Set up new directories and configuration without breaking existing code

### Actions

1. Create new directory structure (empty):
```bash
mkdir -p .runtime/temp-uploads
mkdir -p .runtime/storage
mkdir -p .runtime/local
mkdir -p dist
mkdir -p platform/core/src/backend/api
mkdir -p platform/core/src/backend/database
mkdir -p platform/core/src/frontend/pages
mkdir -p platform/core/src/frontend/services
mkdir -p platform/core/src/frontend/hooks
mkdir -p platform/core/src/shared/config
```

2. Create path configuration file:
```bash
# Create platform/core/src/shared/config/paths.ts
```

```typescript
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = path.join(__dirname, '../../../../..');

export const PATHS = {
  RUNTIME_DIR: process.env.RUNTIME_DIR || path.join(PROJECT_ROOT, '.runtime'),
  TEMP_UPLOADS: process.env.TEMP_UPLOADS || path.join(PROJECT_ROOT, '.runtime/temp-uploads'),
  STORAGE: process.env.STORAGE_DIR || path.join(PROJECT_ROOT, '.runtime/storage'),
  LOCAL: process.env.LOCAL_DIR || path.join(PROJECT_ROOT, '.runtime/local'),
  DIST: process.env.DIST_DIR || path.join(PROJECT_ROOT, 'dist'),
};

// Ensure directories exist on import
Object.values(PATHS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
```

3. Update `.gitignore`:
```bash
# Add to .gitignore
.runtime/
dist/
*.log
```

### Verification
```bash
# Verify directories created
ls -la .runtime/
ls -la dist/

# Verify app still runs
npm run dev:backend
# Should start without errors

npm run dev:frontend
# Should start without errors
```

### Commit
```bash
git add .
git commit -m "refactor(structure): create new directory structure

- Add .runtime/ for runtime directories
- Add dist/ for centralized build output
- Add shared/config for configuration
- Create PATHS config for runtime directory resolution

[Stage 0/8: Foundation]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 1: Runtime Directories Migration

**Goal**: Move temp-uploads, storage, local to .runtime/ and update all references

### Actions

1. Update storage-related services to use PATHS config:

**File**: `platform/core/src/backend/services/storage-service.ts`
```typescript
// Add import at top
import { PATHS } from '../../shared/config/paths';

// Replace hardcoded paths with PATHS.STORAGE, PATHS.TEMP_UPLOADS
```

**File**: `platform/core/src/backend/services/storage-manager.ts`
```typescript
// Add import
import { PATHS } from '../../shared/config/paths';

// Update all file path references
```

2. Find and update all file upload middleware:
```bash
# Search for hardcoded paths
grep -r "temp-uploads" platform/core/src/backend/
grep -r "storage" platform/core/src/backend/ | grep -v "storage-service"
grep -r "local" platform/core/src/backend/

# Update multer configurations to use PATHS.TEMP_UPLOADS
```

3. Move existing data (if any):
```bash
# Only if directories have data
if [ -d "platform/core/temp-uploads" ]; then
  cp -r platform/core/temp-uploads/* .runtime/temp-uploads/ 2>/dev/null || true
fi

if [ -d "platform/core/storage" ]; then
  cp -r platform/core/storage/* .runtime/storage/ 2>/dev/null || true
fi

if [ -d "platform/core/local" ]; then
  cp -r platform/core/local/* .runtime/local/ 2>/dev/null || true
fi
```

4. Remove old directories:
```bash
rm -rf platform/core/temp-uploads
rm -rf platform/core/storage
rm -rf platform/core/local
```

### Verification
```bash
# Start backend
npm run dev:backend

# Test file upload (if applicable)
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.txt"

# Verify file appears in .runtime/temp-uploads/
ls -la .runtime/temp-uploads/

# Check logs for path-related errors
```

### Commit
```bash
git add .
git commit -m "refactor(runtime): move runtime directories to .runtime/

- Move temp-uploads/, storage/, local/ to .runtime/
- Update all services to use PATHS config
- Remove old directories from platform/core

[Stage 1/8: Runtime Directories]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 2: Backend Database Layer

**Goal**: Reorganize database-related services into backend/database/

### Actions

1. Create database directory:
```bash
mkdir -p platform/core/src/backend/database
```

2. Move database services:
```bash
git mv platform/core/src/backend/services/postgresql-service.ts \
       platform/core/src/backend/database/postgresql-service.ts

git mv platform/core/src/backend/services/sqlite-service.ts \
       platform/core/src/backend/database/sqlite-service.ts

git mv platform/core/src/backend/services/database-manager.ts \
       platform/core/src/backend/database/database-manager.ts

git mv platform/core/src/backend/services/connection-pool-manager.ts \
       platform/core/src/backend/database/connection-pool-manager.ts

git mv platform/core/src/backend/services/data-mapper.ts \
       platform/core/src/backend/database/data-mapper.ts

git mv platform/core/src/backend/services/config-persistence.ts \
       platform/core/src/backend/database/config-persistence.ts

git mv platform/core/src/backend/services/supabase-client.ts \
       platform/core/src/backend/database/supabase-client.ts
```

3. Update imports in moved files (change relative imports within database/):
```typescript
// Example: postgresql-service.ts
// OLD: import { DataMapper } from './data-mapper'
// NEW: import { DataMapper } from './data-mapper'  # Same directory now
```

4. Update imports in files that import database services:
```bash
# Find all files importing database services
grep -r "from.*postgresql-service" platform/core/src/
grep -r "from.*database-manager" platform/core/src/

# Update each import:
# OLD: from '../services/postgresql-service'
# NEW: from '../database/postgresql-service'
```

**Files likely to update**:
- `platform.ts`
- `index-with-db.ts`
- `data-service.ts`
- `middleware/database-config.ts`

### Verification
```bash
# Type check
npm run type-check

# Start backend
npm run dev:backend

# Test database connection
curl http://localhost:3000/health
# Should return 200 with database status
```

### Commit
```bash
git add .
git commit -m "refactor(backend): organize database services into database/

- Move 7 database-related services to backend/database/
- Update all imports to new paths
- Maintain service functionality

[Stage 2/8: Backend Database Layer]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 3: Backend API Routes Extraction

**Goal**: Extract routes from platform.ts into separate api/ files

### Actions

1. Analyze current routes in `platform.ts`:
```bash
# Identify route definitions
grep "app\.\(get\|post\|put\|delete\|patch\)" platform/core/src/backend/platform.ts
```

2. Create route files in `backend/api/`:

**File**: `platform/core/src/backend/api/health.ts`
```typescript
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  // Health check logic
});
```

**File**: `platform/core/src/backend/api/jobs.ts`
```typescript
import { Router } from 'express';
import { DataService } from '../services/data-service';

export const jobsRouter = Router();

// Extract job routes from platform.ts
jobsRouter.get('/', async (req, res) => { /* ... */ });
jobsRouter.post('/', async (req, res) => { /* ... */ });
jobsRouter.get('/:id', async (req, res) => { /* ... */ });
jobsRouter.put('/:id', async (req, res) => { /* ... */ });
jobsRouter.delete('/:id', async (req, res) => { /* ... */ });
```

**File**: `platform/core/src/backend/api/auth.ts`
**File**: `platform/core/src/backend/api/modules.ts`
**File**: `platform/core/src/backend/api/database.ts`
**File**: `platform/core/src/backend/api/platform.ts`

3. Update `platform.ts` to use routers:
```typescript
import { healthRouter } from './api/health';
import { jobsRouter } from './api/jobs';
import { authRouter } from './api/auth';
// ... etc

app.use('/health', healthRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/auth', authRouter);
// ... etc
```

4. Remove inline route definitions from `platform.ts`.

### Verification
```bash
# Type check
npm run type-check

# Start backend
npm run dev:backend

# Test each API endpoint
curl http://localhost:3000/health
curl http://localhost:3000/api/jobs
curl http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test"}'

# Verify all routes still work
```

### Commit
```bash
git add .
git commit -m "refactor(backend): extract routes into api/ directory

- Create separate route files for each domain
- Update platform.ts to use routers
- Maintain all endpoint functionality

[Stage 3/8: Backend API Routes]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 4: Frontend Pages/Components Separation

**Goal**: Separate page components from reusable components

### Actions

1. Move page components:
```bash
git mv platform/core/src/frontend/components/Workspace.tsx \
       platform/core/src/frontend/pages/Workspace.tsx

git mv platform/core/src/frontend/components/MinimalistWorkspace.tsx \
       platform/core/src/frontend/pages/MinimalistWorkspace.tsx

git mv platform/core/src/frontend/components/JobDashboard.tsx \
       platform/core/src/frontend/pages/JobDashboard.tsx

git mv platform/core/src/frontend/components/ModuleStore.tsx \
       platform/core/src/frontend/pages/ModuleStore.tsx
```

2. Update imports in `App.tsx`:
```typescript
// OLD:
import { Workspace } from './components/Workspace';
import { JobDashboard } from './components/JobDashboard';

// NEW:
import { Workspace } from './pages/Workspace';
import { JobDashboard } from './pages/JobDashboard';
```

3. Move API client to services:
```bash
git mv platform/core/src/frontend/utils/api-client.ts \
       platform/core/src/frontend/services/api-client.ts

git mv platform/core/src/frontend/utils/data-migration.ts \
       platform/core/src/frontend/services/data-migration.ts
```

4. Update imports for api-client:
```bash
# Find all imports
grep -r "from.*api-client" platform/core/src/frontend/

# Update each:
# OLD: from '../utils/api-client'
# NEW: from '../services/api-client'
```

### Verification
```bash
# Type check
npm run type-check

# Start frontend
npm run dev:frontend

# Verify app loads in browser
open http://localhost:5174

# Navigate through pages, verify no console errors
```

### Commit
```bash
git add .
git commit -m "refactor(frontend): separate pages from components

- Move page components to pages/ directory
- Move API client to services/ directory
- Update all imports

[Stage 4/8: Frontend Organization]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 5: Backend Entry Point Consolidation

**Goal**: Create single backend/index.ts entry point, clean up unused files

### Actions

1. Rename and simplify entry point:
```bash
# Review index-with-db.ts content
cat platform/core/src/backend/index-with-db.ts

# Rename platform.ts to app.ts (Express app factory)
git mv platform/core/src/backend/platform.ts \
       platform/core/src/backend/app.ts
```

2. Update `app.ts` to export app factory:
```typescript
// At the end of app.ts
export function createApp() {
  const app = express();
  // ... all middleware and routes
  return app;
}

export default createApp();
```

3. Create new clean `backend/index.ts`:
```typescript
import { createApp } from './app';
import { PATHS } from '../shared/config/paths';

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Runtime directory: ${PATHS.RUNTIME_DIR}`);
});
```

4. Delete unused entry files:
```bash
git rm platform/core/src/backend/index.ts  # If unused
git rm platform/core/src/backend/index-simple.ts
# Keep index-with-db.ts temporarily for reference, delete after verifying new index works
```

5. Update package.json scripts:
```json
{
  "scripts": {
    "dev:backend": "tsx watch platform/core/src/backend/index.ts",
    "start": "node dist/backend/index.js"
  }
}
```

### Verification
```bash
# Stop any running servers
# Start backend with new entry point
npm run dev:backend

# Verify server starts and all routes work
curl http://localhost:3000/health
curl http://localhost:3000/api/jobs

# Check that runtime directories are created
ls -la .runtime/
```

### Commit
```bash
git add .
git commit -m "refactor(backend): consolidate to single entry point

- Rename platform.ts to app.ts (Express app factory)
- Create clean backend/index.ts entry point
- Remove unused index files
- Update npm scripts

[Stage 5/8: Backend Entry Point]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 6: Unified Application Entry Point

**Goal**: Create platform/core/src/index.ts that starts both backend and frontend in development

### Actions

1. Create unified entry point:

**File**: `platform/core/src/index.ts`
```typescript
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION) {
  // Production: Just start the backend (it serves frontend static files)
  console.log('Starting production server...');
  require('./backend/index');
} else {
  // Development: Start both backend and frontend
  console.log('Starting development servers...');

  const backend: ChildProcess = spawn('tsx', ['watch', 'platform/core/src/backend/index.ts'], {
    stdio: 'inherit',
    shell: true,
  });

  const frontend: ChildProcess = spawn('vite', ['--config', 'platform/core/vite.config.ts'], {
    stdio: 'inherit',
    shell: true,
  });

  // Handle process termination
  const cleanup = () => {
    backend.kill();
    frontend.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
```

2. Update package.json scripts:
```json
{
  "scripts": {
    "dev": "tsx platform/core/src/index.ts",
    "dev:backend": "tsx watch platform/core/src/backend/index.ts",
    "dev:frontend": "vite --config platform/core/vite.config.ts",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "tsc --project platform/core/tsconfig.json",
    "build:frontend": "vite build --config platform/core/vite.config.ts --outDir ../../dist/frontend",
    "start": "NODE_ENV=production node dist/backend/index.js"
  }
}
```

3. Update backend to serve frontend static files in production:

**File**: `platform/core/src/backend/app.ts`
```typescript
import express from 'express';
import path from 'path';

const app = express();

// ... existing middleware ...

// In production, serve frontend static files
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend');
  app.use(express.static(frontendPath));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

export function createApp() {
  return app;
}
```

### Verification
```bash
# Test unified dev command
npm run dev
# Should start both backend (port 3000) and frontend (port 5174)

# Verify both accessible
curl http://localhost:3000/health
open http://localhost:5174

# Test production build
npm run build
npm start
# Should build both, start single server serving both
open http://localhost:3000  # Should serve frontend
curl http://localhost:3000/api/health  # Should serve API
```

### Commit
```bash
git add .
git commit -m "feat(structure): create unified entry point

- Add platform/core/src/index.ts for development
- Update backend to serve frontend in production
- Simplify npm scripts with unified dev command

[Stage 6/8: Unified Entry Point]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 7: README Documentation

**Goal**: Add README.md files to all major directories

### Actions

1. Update root README.md:
```bash
# Edit README.md with new structure documentation
```

2. Create workspace README files:
```bash
cat > platform/core/README.md << 'EOF'
# Platform Core

The core platform providing infrastructure for the modular job tracker.

## Structure

- `src/backend/` - Backend API and services
- `src/frontend/` - Frontend React application
- `src/shared/` - Code shared between backend and frontend

## Development

```bash
npm run dev  # Start both backend and frontend
npm run dev:backend  # Backend only
npm run dev:frontend  # Frontend only
```

## Building

```bash
npm run build  # Build both
```
EOF

cat > platform/core/src/backend/README.md << 'EOF'
# Backend

Express-based backend API.

## Structure

- `api/` - Route handlers organized by domain
- `services/` - Business logic services
- `database/` - Database adapters and management
- `middleware/` - Express middleware
- `utils/` - Backend utilities
- `app.ts` - Express app factory
- `index.ts` - Entry point

## Adding Routes

Create route file in `api/` and register in `app.ts`.
EOF
```

3. Create more README files:
```bash
# platform/core/src/frontend/README.md
# modules/job-tracker-basic/README.md
# shared/types/README.md
# shared/utils/README.md
# tools/module-cli/README.md
```

### Verification
```bash
# Verify README files exist
find . -name "README.md" -not -path "*/node_modules/*"

# Verify content is helpful
cat platform/core/README.md
cat platform/core/src/backend/README.md
```

### Commit
```bash
git add .
git commit -m "docs: add README files to major directories

- Update root README with new structure
- Add platform/core README
- Add backend and frontend README files
- Add module and shared workspace READMEs

[Stage 7/8: Documentation]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 8: Deployment Configuration

**Goal**: Update render.yaml and verify deployment readiness

### Actions

1. Update `render.yaml`:
```yaml
services:
  - type: web
    name: job-tracker-platform
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    runtime: node
    envVars:
      - key: NODE_ENV
        value: production
      - key: RUNTIME_DIR
        value: /opt/render/.runtime
      - key: DATABASE_URL
        fromDatabase:
          name: job-tracker-db
          property: connectionString
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: JWT_SECRET
        generateValue: true

databases:
  - name: job-tracker-db
    plan: free
```

2. Update TypeScript compilation output directory:

**File**: `platform/core/tsconfig.json`
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/backend",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/frontend"]
}
```

3. Update Vite build output:

**File**: `platform/core/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../../dist/frontend',
  },
});
```

4. Test production build locally:
```bash
# Clean previous builds
rm -rf dist/

# Build
npm run build

# Verify outputs
ls -la dist/backend/
ls -la dist/frontend/

# Test production start
npm start
# Should serve app on port 3000
```

### Verification
```bash
# Verify production build
npm run build
npm start

# Test API
curl http://localhost:3000/health

# Test frontend serving
curl http://localhost:3000
# Should return HTML

# Verify static assets load
curl http://localhost:3000/assets/index-*.js
# Should return JS file
```

### Commit
```bash
git add .
git commit -m "chore(deploy): update deployment configuration

- Update render.yaml for new entry point
- Configure TypeScript output to dist/backend
- Configure Vite output to dist/frontend
- Verify production build works

[Stage 8/8: Deployment Config]"
git push origin 001-monorepo-refactor-project
```

---

## Stage 9 (Optional): Git History Cleanup

**Goal**: Clean up git history if desired (ONLY after everything is stable)

### Actions

This is OPTIONAL and RISKY. Only do if:
1. All 8 stages are complete and tested
2. Application works in production
3. Team agrees history cleanup is worth it

```bash
# Use git filter-repo or BFG Repo-Cleaner
# This is complex and destructive - document separately if needed
```

### Verification
```bash
# Verify history is clean
git log --oneline
git log --follow <file>
```

---

## Rollback Procedures

### If a stage fails

1. **Identify the issue**: Read error messages, check logs
2. **Try to fix forward**: Often faster than rolling back
3. **If fix is unclear**:
   ```bash
   # Rollback to previous commit
   git reset --hard HEAD~1

   # Force push (ONLY on feature branch!)
   git push -f origin 001-monorepo-refactor-project
   ```

### If application breaks in production

1. **Immediate**: Rollback Render.com deployment to previous version
2. **Then**: Fix issue on feature branch
3. **Redeploy**: After verification

---

## Summary

**Total Stages**: 8 (+ 1 optional)
**Estimated Time**: 2-4 hours (depending on testing thoroughness)
**Commit Count**: ~9 commits (one per stage + initial)
**Risk Level**: MODERATE (incremental approach minimizes risk)

**Key Success Factors**:
- Test thoroughly at each stage
- Don't skip verification steps
- Push to remote after each stage
- Keep commits focused on single concern
- Document any unexpected issues

**Next Document**: quickstart.md (verification procedures)
