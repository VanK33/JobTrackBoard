# Platform Core

The main application workspace containing both backend and frontend code.

## Structure

```
platform/core/
├── src/
│   ├── backend/          # Express backend server
│   ├── frontend/         # React frontend application
│   └── shared/           # Shared utilities and config
├── dist/                 # Build output
└── .runtime/            # Runtime data (gitignored)
```

## Backend (`src/backend/`)

Express.js backend with modular architecture.

### Key Directories

- **`api/`** - API route modules organized by domain
  - `health.ts` - Health check endpoints
  - `platform.ts` - Platform information
  - `modules.ts` - Module management
  - `database.ts` - Database configuration
  - `jobs.ts` - Job CRUD operations
  - `stats.ts` - Statistics endpoints

- **`database/`** - Database services and management
  - `sqlite-service.ts` - SQL.js implementation
  - `postgresql-service.ts` - PostgreSQL implementation
  - `supabase-client.ts` - Supabase client
  - `connection-pool-manager.ts` - Connection pooling
  - `data-mapper.ts` - Frontend/backend data mapping

- **`middleware/`** - Express middleware
  - `database-config.ts` - Extract DB config from headers

- **`services/`** - Business logic services
  - `storage-manager.ts` - File storage abstraction
  - `storage-service.ts` - Multi-provider storage

- **`utils/`** - Shared utilities
  - `logger.ts` - Logging utility

### Running Backend

```bash
# Development (with auto-reload)
npm run dev:backend

# Production
npm start
```

## Frontend (`src/frontend/`)

React 18 + TypeScript + Vite application.

### Key Directories

- **`pages/`** - Page components (main views)
  - `JobDashboard.tsx` - Main dashboard
  - `DatabaseSettings.tsx` - Database configuration
  - `Workspace.tsx` - Workspace view
  - `ModuleStore.tsx` - Module marketplace
  - `MinimalistWorkspace.tsx` - Alternative view

- **`components/`** - Reusable components
  - `Header.tsx` - Navigation header
  - `ModuleCard.tsx` - Module display card
  - `ErrorBoundary.tsx` - Error handling
  - `modules/` - Module-specific components

- **`services/`** - API clients and services

- **`hooks/`** - Custom React hooks

- **`utils/`** - Utility functions
  - `api-client.ts` - API client with DB config injection

### Running Frontend

```bash
# Development server (http://localhost:5173)
npm run dev:frontend

# Build for production
npm run build:frontend
```

The dev server proxies `/api` requests to the backend at `http://localhost:3000`.

## Shared (`src/shared/`)

Code shared between backend and frontend.

- **`config/`** - Configuration
  - `paths.ts` - Centralized path configuration for runtime directories

## Development

### Run Full Stack

```bash
# Runs both backend and frontend concurrently
npm run dev
```

### Environment Variables

Create `.env` in workspace root:

```bash
# Development
NODE_ENV=development

# Database (optional - can configure via UI)
DATABASE_URL=postgresql://user:pass@localhost:5432/jobtracker

# Supabase (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Storage paths (optional - defaults to .runtime/)
RUNTIME_DIR=.runtime
TEMP_UPLOADS=.runtime/temp-uploads
STORAGE_DIR=.runtime/storage
```

### Type Checking

```bash
npm run type-check
```

### Building

```bash
# Build both backend and frontend
npm run build

# This creates:
# - dist/backend/     (backend source copied)
# - dist/shared/      (shared utilities)
# - dist/frontend/    (Vite build output)
```

## Architecture

### Session-Based Multi-Tenant

- Database config stored in browser localStorage
- Config sent with each request via `x-database-config` header
- Backend extracts and uses config for that request
- Supports multiple databases simultaneously

### File Storage

Uses `StorageManager` for abstraction:
- Supabase Storage (default)
- Local filesystem (development)
- Extensible for S3, Azure, etc.

Temporary uploads go to `.runtime/temp-uploads`, then moved to storage provider.

### API Routes

All routes are modular:
- Routes defined in `src/backend/api/`
- Each domain has its own router
- Mounted in `src/backend/index.ts`

### Database Layer

- Multiple database support (SQL.js, PostgreSQL, Supabase)
- Connection pooling for efficiency
- Data mapping between frontend/backend formats
- Session-based connection management

## Production

The backend serves the frontend in production:

```typescript
// In production (NODE_ENV=production)
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
```

Build output structure:
```
dist/
├── backend/
│   ├── index.ts
│   ├── api/
│   └── ...
├── shared/
│   └── config/
└── frontend/
    ├── index.html
    └── assets/
```

Start with: `npm start` (runs `tsx dist/backend/index.ts`)
