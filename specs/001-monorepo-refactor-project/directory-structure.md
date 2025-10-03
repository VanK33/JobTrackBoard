# Directory Structure Mapping

**Date**: 2025-10-02
**Purpose**: File-by-file mapping from current to proposed structure

---

## Overview

This document maps every file in the monorepo from its current location to its proposed location after refactoring. Each section includes:
- Current file path
- New file path
- Import path updates required
- Rationale for new location

---

## 1. Runtime Directories

### Current Structure
```
platform/core/temp-uploads/    # User uploaded files
platform/core/storage/         # Persistent storage
platform/core/local/           # Local development data
```

### New Structure
```
.runtime/
├── temp-uploads/              # User uploaded files
├── storage/                   # Persistent storage
└── local/                     # Local development data
```

### Rationale
- Centralized at repository root (not buried in workspace)
- Clear that these are runtime artifacts, not source code
- Easier to .gitignore and exclude from builds
- Clearer in deployment environments

### Configuration Required
Create `platform/core/src/shared/config/paths.ts`:
```typescript
import path from 'path';

const PROJECT_ROOT = path.join(__dirname, '../../../..');

export const PATHS = {
  RUNTIME_DIR: process.env.RUNTIME_DIR || path.join(PROJECT_ROOT, '.runtime'),
  TEMP_UPLOADS: process.env.TEMP_UPLOADS || path.join(PROJECT_ROOT, '.runtime/temp-uploads'),
  STORAGE: process.env.STORAGE_DIR || path.join(PROJECT_ROOT, '.runtime/storage'),
  LOCAL: process.env.LOCAL_DIR || path.join(PROJECT_ROOT, '.runtime/local'),
};
```

### Files to Update
- `platform/core/src/backend/services/storage-service.ts` - Update file paths
- `platform/core/src/backend/services/storage-manager.ts` - Update file paths
- Any middleware using `multer` - Update dest path
- `.gitignore` - Update paths

---

## 2. Backend Source Files

### 2.1 API/Routes Layer

**Current**: Mixed in with `platform.ts` and entry points
**New**: `platform/core/src/backend/api/`

| Current | New | Purpose |
|---------|-----|---------|
| _(routes embedded in platform.ts)_ | `api/jobs.ts` | Job CRUD endpoints |
| _(routes embedded in platform.ts)_ | `api/auth.ts` | Authentication endpoints |
| _(routes embedded in platform.ts)_ | `api/modules.ts` | Module management endpoints |
| _(routes embedded in platform.ts)_ | `api/platform.ts` | Platform info/health endpoints |
| _(routes embedded in platform.ts)_ | `api/database.ts` | Database config endpoints |
| _(routes embedded in platform.ts)_ | `api/storage.ts` | File upload/storage endpoints |

**Action Required**: Extract routes from `platform.ts` into separate route files.

**Import Pattern**:
```typescript
// In new api files
import { Router } from 'express';
export const jobsRouter = Router();

// In platform.ts or main index
import { jobsRouter } from './api/jobs';
app.use('/api/jobs', jobsRouter);
```

### 2.2 Services Layer

**Current**: `platform/core/src/backend/services/*`
**New**: Keep in `platform/core/src/backend/services/*` (already well-organized)

| Current | New | Changes |
|---------|-----|---------|
| `services/auth-service.ts` | `services/auth-service.ts` | ✓ No change |
| `services/data-service.ts` | `services/data-service.ts` | ✓ No change |
| `services/event-bus.ts` | `services/event-bus.ts` | ✓ No change |
| `services/module-manager.ts` | `services/module-manager.ts` | ✓ No change |
| `services/storage-service.ts` | `services/storage-service.ts` | Update PATHS imports |
| `services/storage-manager.ts` | `services/storage-manager.ts` | Update PATHS imports |
| `services/postgresql-service.ts` | `services/database/postgresql-service.ts` | Move to database/ |
| `services/sqlite-service.ts` | `services/database/sqlite-service.ts` | Move to database/ |
| `services/database-manager.ts` | `services/database/database-manager.ts` | Move to database/ |
| `services/connection-pool-manager.ts` | `services/database/connection-pool-manager.ts` | Move to database/ |
| `services/data-mapper.ts` | `services/database/data-mapper.ts` | Move to database/ |
| `services/config-persistence.ts` | `services/database/config-persistence.ts` | Move to database/ |
| `services/supabase-client.ts` | `services/database/supabase-client.ts` | Move to database/ |

### 2.3 Database Layer

**New**: `platform/core/src/backend/database/`

Contents:
```
database/
├── postgresql-service.ts      # PostgreSQL adapter
├── sqlite-service.ts          # SQLite adapter
├── database-manager.ts        # DB connection manager
├── connection-pool-manager.ts # Connection pooling
├── data-mapper.ts             # Data mapping utilities
├── config-persistence.ts      # DB config storage
├── supabase-client.ts         # Supabase integration
├── migrations/                # Database migrations (future)
└── schemas/                   # Schema definitions (future)
```

**Rationale**: Group all database-related code together for easier maintenance.

### 2.4 Middleware

**Current**: `platform/core/src/backend/middleware/database-config.ts`
**New**: `platform/core/src/backend/middleware/` (keep as-is)

Future middleware to add here:
- `auth.ts` - Authentication middleware
- `error-handler.ts` - Error handling middleware
- `logger.ts` - Request logging middleware
- `validation.ts` - Request validation middleware

### 2.5 Utils

**Current**: `platform/core/src/backend/utils/logger.ts`
**New**: `platform/core/src/backend/utils/` (keep as-is)

Future utilities:
- `validation.ts` - Input validation helpers
- `response.ts` - Standard response formatting
- `errors.ts` - Custom error classes

### 2.6 Entry Points

**Current**:
- `index.ts` (unused?)
- `index-simple.ts` (minimal version)
- `index-with-db.ts` (current production entry)
- `platform.ts` (Express app setup)

**New**:
- `backend/index.ts` - Single production entry point
- `platform.ts` → `backend/app.ts` - Express app factory
- Delete `index-simple.ts` and `index-with-db.ts`

| Current | New | Purpose |
|---------|-----|---------|
| `index-with-db.ts` | `backend/index.ts` | Main entry point (cleaned up) |
| `platform.ts` | `backend/app.ts` | Express app creation |
| `index.ts` | DELETE | Unused |
| `index-simple.ts` | DELETE | No longer needed |

### 2.7 Shared Configuration

**New**: `platform/core/src/shared/config/`

```
shared/config/
├── paths.ts                   # Runtime directory paths
├── environment.ts             # Environment variables
└── constants.ts               # Application constants
```

---

## 3. Frontend Source Files

### 3.1 Pages/Views

**Current**: Components are mixed (some are pages, some are components)
**New**: Separate pages from components

| Current | New | Type |
|---------|-----|------|
| `App.tsx` | `App.tsx` | Root component (keep) |
| `components/Workspace.tsx` | `pages/Workspace.tsx` | Page component |
| `components/MinimalistWorkspace.tsx` | `pages/MinimalistWorkspace.tsx` | Page component |
| `components/JobDashboard.tsx` | `pages/JobDashboard.tsx` | Page component |
| `components/ModuleStore.tsx` | `pages/ModuleStore.tsx` | Page component |

### 3.2 Shared Components

**Current**: `platform/core/src/frontend/components/`
**New**: Keep reusable components here

| Current | New | Purpose |
|---------|-----|---------|
| `components/Header.tsx` | `components/Header.tsx` | ✓ Layout component |
| `components/ModuleCard.tsx` | `components/ModuleCard.tsx` | ✓ Reusable card |
| `components/DatabaseSettings.tsx` | `components/DatabaseSettings.tsx` | ✓ Settings component |
| `components/ErrorBoundary.tsx` | `components/ErrorBoundary.tsx` | ✓ Error handling |

### 3.3 Module-Specific Components

**Current**: `platform/core/src/frontend/components/modules/`
**New**: Should move to `modules/job-tracker-basic/src/frontend/`

| Current | New | Rationale |
|---------|-----|-----------|
| `components/modules/JobTrackerModule.tsx` | `../../modules/job-tracker-basic/src/frontend/JobTrackerModule.tsx` | Module code belongs in module workspace |

### 3.4 Services/API Clients

**Current**: `platform/core/src/frontend/utils/api-client.ts`
**New**: `platform/core/src/frontend/services/api-client.ts`

| Current | New | Rationale |
|---------|-----|-----------|
| `utils/api-client.ts` | `services/api-client.ts` | API communication is a service, not a utility |
| `utils/data-migration.ts` | `services/data-migration.ts` | Migration logic is a service |

### 3.5 Configuration

**Current**: `platform/core/src/frontend/config/api.ts`
**New**: Keep as-is (already well-organized)

### 3.6 Types

**Current**: `platform/core/src/frontend/types.ts`
**New**: Move to `shared/types/src/frontend.ts` OR keep as platform-specific

**Decision**: Keep in `platform/core/src/shared/types.ts` if used by both frontend and backend.
Move to `shared/types/` only if used by multiple workspaces.

### 3.7 Utilities

**Current**: Empty after moving api-client
**New**: `platform/core/src/frontend/utils/`

Future utilities:
- `formatting.ts` - Date/number formatting
- `validation.ts` - Client-side validation
- `storage.ts` - localStorage/sessionStorage helpers

### 3.8 Hooks (Future)

**New**: `platform/core/src/frontend/hooks/`

Custom React hooks to create:
- `useApi.ts` - API call hook
- `useAuth.ts` - Authentication hook
- `useModules.ts` - Module management hook

---

## 4. Shared Code Organization

### 4.1 Shared Types

**Current**: `shared/types/src/` (structure unclear)
**New**: Organize by domain

```
shared/types/src/
├── index.ts                   # Re-export all
├── auth.ts                    # Authentication types
├── jobs.ts                    # Job tracking types
├── modules.ts                 # Module system types
├── platform.ts                # Platform core types
├── database.ts                # Database types
└── api.ts                     # API request/response types
```

### 4.2 Shared Utils

**Current**: `shared/utils/` (check if it exists)
**New**: `shared/utils/src/`

If it doesn't exist, create it for cross-workspace utilities:
```
shared/utils/src/
├── index.ts
├── validation.ts              # Shared validation logic
├── date.ts                    # Date utilities
└── strings.ts                 # String utilities
```

---

## 5. Module Structure

### 5.1 job-tracker-basic Module

**Current**:
```
modules/job-tracker-basic/
└── src/
    └── backend/               # Module backend code
```

**New**:
```
modules/job-tracker-basic/
├── src/
│   ├── backend/
│   │   ├── routes/
│   │   ├── services/
│   │   └── models/
│   └── frontend/              # Module frontend components
│       └── JobTrackerModule.tsx
├── tests/
├── package.json
└── README.md
```

**Migration**: Move `platform/core/src/frontend/components/modules/JobTrackerModule.tsx` to module.

### 5.2 module-cli Tool

**Current**: Exists in both `modules/` and `tools/`
**New**: Keep only in `tools/module-cli/`

**Action**: Delete `modules/module-cli`, keep `tools/module-cli`

---

## 6. Build Artifacts

### Current
```
platform/core/dist/            # Platform build output
```

### New
```
dist/
├── backend/                   # Compiled backend
├── frontend/                  # Built frontend assets
└── shared/                    # Compiled shared code
```

**Rationale**: Centralized build output at repository root makes deployments clearer.

### TypeScript Configuration
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "outDir": "../../dist",     # For workspace tsconfigs
    "rootDir": "src"
  }
}
```

---

## 7. Configuration Files

### Root Level
Keep at root:
- `package.json` - Monorepo scripts
- `tsconfig.json` - Shared TS config
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules
- `README.md` - Project overview
- `render.yaml` - Deployment config

### Workspace Level
Each workspace should have:
- `package.json` - Workspace dependencies and scripts
- `tsconfig.json` - Workspace-specific TS config (extends root)
- `README.md` - Workspace documentation

---

## 8. Documentation Files to Create

### Repository Root
- `README.md` - Update with new structure

### platform/core/
- `README.md` - Platform core overview

### platform/core/src/backend/
- `README.md` - Backend architecture

### platform/core/src/frontend/
- `README.md` - Frontend architecture

### modules/job-tracker-basic/
- `README.md` - Module documentation

### shared/types/
- `README.md` - Shared types documentation

### shared/utils/
- `README.md` - Shared utilities documentation

### tools/module-cli/
- `README.md` - CLI tool documentation

---

## Import Path Updates

### TypeScript Path Mappings

**Root tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@platform/core": ["./platform/core/src"],
      "@platform/core/*": ["./platform/core/src/*"],
      "@modules/job-tracker": ["./modules/job-tracker-basic/src"],
      "@shared/types": ["./shared/types/src"],
      "@shared/types/*": ["./shared/types/src/*"],
      "@shared/utils": ["./shared/utils/src"],
      "@shared/utils/*": ["./shared/utils/src/*"]
    }
  }
}
```

### Common Import Updates

| Old Import | New Import |
|------------|------------|
| `'./services/storage-service'` | `'../services/storage-service'` OR `'@platform/core/backend/services/storage-service'` |
| `'./utils/logger'` | `'@platform/core/backend/utils/logger'` |
| `'../../shared/types'` | `'@shared/types'` |
| Hardcoded `'./temp-uploads'` | `import { PATHS } from '@platform/core/shared/config/paths'` |

---

## Summary

**Total Files to Move**: ~30 files
**Total Directories to Create**: ~15 directories
**Total README files to write**: ~8 files

**Migration Complexity**: MODERATE
- Most moves are straightforward
- Import updates are mechanical (find/replace)
- Testing required at each stage
- git mv preserves history

**Next Document**: migration-stages.md (detailed stage-by-stage plan)
