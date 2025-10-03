# Research: Monorepo Refactoring

**Date**: 2025-10-02
**Feature**: Monorepo Structure Refactoring
**Purpose**: Research best practices and make technical decisions for the refactoring approach

---

## 1. Monorepo Best Practices - TypeScript Path Mapping

### Decision
Use TypeScript path aliases with npm workspaces, updating `tsconfig.json` and individual workspace `package.json` files to reflect new structure.

### Rationale
- **Workspace-based paths** (`@platform/*`, `@modules/*`, `@shared/*`) already configured
- Path aliases make imports cleaner and refactor-safe
- TypeScript `paths` option works seamlessly with npm workspaces
- Vite and tsx both support TypeScript path resolution

### Implementation Approach
```json
// Root tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@platform/core": ["./platform/core/src"],
      "@platform/core/*": ["./platform/core/src/*"],
      "@modules/*": ["./modules/*/src"],
      "@shared/types": ["./shared/types/src"],
      "@shared/utils": ["./shared/utils/src"],
      "@tools/*": ["./tools/*/src"]
    }
  }
}
```

### Alternatives Considered
- **Relative imports only**: Too brittle during refactoring, hard to maintain
- **Symlinks**: Complex, platform-dependent, harder to understand
- **Custom module resolution**: Overkill for this use case

### References
- TypeScript Handbook: Path Mapping
- npm workspaces documentation
- Vite TypeScript configuration

---

## 2. Unified Entry Point Strategy

### Decision
Create a single `platform/core/src/index.ts` that:
1. Imports and starts the Express backend server
2. Spawns Vite dev server programmatically (dev mode) or serves static files (production)
3. Uses `concurrently` for development, single Node process for production

### Rationale
- **Development**: Need HMR for frontend, nodemon/tsx watch for backend
  - `concurrently` allows both to run with separate terminals in one command
  - Simpler than programmatic Vite API
- **Production**: Backend serves pre-built frontend static files from `dist/`
  - Single Node process, no need for separate Vite server
  - Render.com deploys one service with one start command

### Implementation Approach

**Development** (`npm run dev`):
```json
// package.json
{
  "scripts": {
    "dev": "tsx watch platform/core/src/backend/index.ts & vite --config platform/core/vite.config.ts",
    "dev:unified": "tsx platform/core/src/index.ts"
  }
}
```

```typescript
// platform/core/src/index.ts (development)
import { spawn } from 'child_process';

// Start backend
const backend = spawn('tsx', ['watch', 'platform/core/src/backend/index.ts']);

// Start frontend
const frontend = spawn('vite', ['--config', 'platform/core/vite.config.ts']);

// Pipe output
backend.stdout.pipe(process.stdout);
frontend.stdout.pipe(process.stdout);
```

**Production**:
```typescript
// platform/core/src/backend/index.ts (updated)
import express from 'express';
import path from 'path';

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '../../dist/frontend')));

// API routes
app.use('/api', apiRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'));
});
```

### Alternatives Considered
- **Programmatic Vite API**: More complex, harder to debug, less familiar pattern
- **Nginx reverse proxy**: Overkill for development, extra dependency
- **Separate services in production**: More expensive, unnecessary complexity

### References
- Vite production build documentation
- Express static file serving
- Render.com Node.js deployment guide

---

## 3. Runtime Directory Management

### Decision
Use environment variables with fallback to a centralized config file (`platform/core/src/shared/config/paths.ts`).

### Rationale
- **Environment variables**: Allow production overrides (Render.com)
- **Config file**: Provides defaults, single source of truth
- **Path module**: Resolve paths relative to project root for consistency

### Implementation Approach

```typescript
// platform/core/src/shared/config/paths.ts
import path from 'path';

const PROJECT_ROOT = path.join(__dirname, '../../../..');

export const PATHS = {
  RUNTIME_DIR: process.env.RUNTIME_DIR || path.join(PROJECT_ROOT, '.runtime'),
  TEMP_UPLOADS: process.env.TEMP_UPLOADS || path.join(PROJECT_ROOT, '.runtime/temp-uploads'),
  STORAGE: process.env.STORAGE_DIR || path.join(PROJECT_ROOT, '.runtime/storage'),
  LOCAL: process.env.LOCAL_DIR || path.join(PROJECT_ROOT, '.runtime/local'),
  DIST: process.env.DIST_DIR || path.join(PROJECT_ROOT, 'dist'),
};

// Ensure directories exist
import fs from 'fs';
Object.values(PATHS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
```

```typescript
// Usage in services
import { PATHS } from '@platform/core/config/paths';

// File upload middleware
multer({ dest: PATHS.TEMP_UPLOADS });
```

### Alternatives Considered
- **Hardcoded paths**: Breaks when structure changes
- **Environment variables only**: Too many variables, no defaults
- **Dotenv**: Already using `.env` for secrets, not for structural paths

### Migration Steps
1. Create paths.ts config file
2. Find all hardcoded path references (search for `temp-uploads`, `storage`, `local`)
3. Replace with `PATHS` imports
4. Test file operations still work

---

## 4. Git File Movement

### Decision
Use `git mv` for all file movements to preserve history, with one commit per logical grouping of moves.

### Rationale
- `git mv` creates explicit rename records in git
- Git's rename detection works better with separate commits
- Preserves `git blame` and `git log --follow` functionality
- Critical for understanding code evolution

### Implementation Approach

```bash
# Stage 1: Move runtime directories (NOT git mv, these aren't tracked properly)
mkdir -p .runtime
mv platform/core/temp-uploads .runtime/
mv platform/core/storage .runtime/
mv platform/core/local .runtime/
git add .runtime/
git add -u platform/core/
git commit -m "refactor(structure): move runtime directories to .runtime/"

# Stage 2: Reorganize backend (use git mv for tracked files)
git mv platform/core/src/backend/services platform/core/src/backend/services-old
mkdir -p platform/core/src/backend/api
mkdir -p platform/core/src/backend/database
# ... move files ...
git add platform/core/src/backend/
git commit -m "refactor(backend): reorganize into api/services/database structure"

# General pattern for each stage:
# 1. git mv for renames/moves
# 2. git add for new directories
# 3. git add -u for deletions
# 4. Commit with descriptive message
# 5. Test that app still works
# 6. Push to remote as backup
```

### Commit Message Convention
```
refactor(scope): brief description

- Detail 1
- Detail 2

[Stage X/Y: description]
```

### Alternatives Considered
- **Regular `mv` command**: Loses git history, harder to track changes
- **Squash all changes into one commit**: Loses incremental checkpoints, harder to rollback
- **Copy then delete**: Creates noise in git history

### References
- Git documentation: `git mv`
- Git rename detection (diff.renames config)
- Best practices for preserving git history

---

## 5. Incremental Migration Stages

### Decision
8 stages, each independently testable and committable:

1. **Foundation**: Create new directories and path config
2. **Runtime Directories**: Move temp-uploads, storage, local to .runtime/
3. **Backend Reorganization**: Restructure backend/ into api/, services/, database/, middleware/, utils/
4. **Frontend Reorganization**: Restructure frontend/ into components/, pages/, hooks/, services/, utils/
5. **Shared Code Organization**: Consolidate shared/ types and utils
6. **Unified Entry Point**: Create index.ts that starts both frontend and backend
7. **Documentation**: Add README.md files to all major directories
8. **Deployment Config**: Update render.yaml, package.json scripts

### Rationale
- **Foundation first**: Creates necessary structure without breaking existing code
- **Runtime dirs early**: Low risk, immediately improves root directory
- **Backend before frontend**: Backend is more complex, get it stable first
- **Entry point near end**: Requires stable backend and frontend first
- **Documentation last**: Explains the final structure
- **Deployment config last**: Only update once structure is stable

### Risk Mitigation
- Each stage has verification steps (run dev server, test key features)
- Git commit after each stage allows easy rollback
- Push to remote after each stage provides backup
- If stage fails, rollback and reassess

### Stage Dependencies
```
1 (Foundation) → 2 (Runtime)
                ↓
      3 (Backend) + 4 (Frontend)
                ↓
           5 (Shared)
                ↓
        6 (Entry Point)
                ↓
      7 (Docs) + 8 (Deploy)
```

### Alternatives Considered
- **Big bang refactor**: Too risky, all-or-nothing
- **More granular stages**: Too many commits, slower progress
- **Fewer stages**: Harder to isolate issues, bigger rollback risk

---

## 6. Render.yaml Build/Start Commands

### Decision
Update `render.yaml` to use new entry points and build artifacts location.

### Current Configuration
```yaml
buildCommand: npm install && npm run build:prod
startCommand: npm start
```

### New Configuration
```yaml
services:
  - type: web
    name: job-tracker-platform
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: node dist/backend/index.js
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
```

### Rationale
- **`npm run build`**: Builds both backend and frontend
- **`node dist/backend/index.js`**: Single entry point, serves both API and static files
- **RUNTIME_DIR override**: Render.com persistent disk or temp directory
- Simplified from multiple scripts to single command

### Build Process
```json
// package.json scripts
{
  "build": "npm run build:backend && npm run build:frontend",
  "build:backend": "tsc --project platform/core/tsconfig.json",
  "build:frontend": "vite build --config platform/core/vite.config.ts",
  "start": "node dist/backend/index.js"
}
```

### Alternatives Considered
- **Separate frontend/backend services**: More complex, more expensive
- **Docker containers**: Overkill for this project size
- **Keep existing multi-script setup**: Harder to maintain, less clear

### References
- Render.com Node.js deployment documentation
- Vite production build guide
- TypeScript compilation outputs

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| TypeScript paths | Workspace-based aliases in tsconfig.json | Clean imports, refactor-safe |
| Entry point | Single index.ts, concurrently for dev, static serving for prod | Simple, familiar, works with Render.com |
| Runtime paths | Config file with env var overrides | Centralized, overrideable, type-safe |
| Git movement | `git mv` with logical commits | Preserves history, enables rollback |
| Migration stages | 8 incremental stages | Balances safety with progress |
| Deployment | Updated render.yaml with unified build/start | Simplified, single service |

---

## Next Steps

With research complete, proceed to Phase 1:
1. Create directory-structure.md (file-by-file mapping)
2. Create migration-stages.md (detailed stage plans)
3. Create quickstart.md (verification procedures)
4. Update agent context (CLAUDE.md)

All decisions are documented and ready for implementation.
