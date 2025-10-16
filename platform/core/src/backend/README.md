# Backend

Express.js backend with modular API routes and multi-database support.

## Directory Structure

```
backend/
├── api/                    # API route modules
│   ├── health.ts          # Health check endpoints
│   ├── platform.ts        # Platform info endpoints
│   ├── modules.ts         # Module management (stub)
│   ├── database.ts        # Database config endpoints
│   ├── jobs.ts            # Job CRUD operations
│   └── stats.ts           # Statistics endpoints
├── database/              # Database services
│   ├── postgresql-service.ts
│   ├── supabase-client.ts
│   ├── connection-pool-manager.ts
│   ├── data-mapper.ts
│   └── config-persistence.ts
├── middleware/            # Express middleware
│   └── database-config.ts
├── services/              # Business logic
│   ├── storage-manager.ts
│   └── storage-service.ts
├── utils/                 # Utilities
│   └── logger.ts
└── index.ts              # Main entry point
```

## Entry Point

**`index.ts`** - Main server file that:
- Initializes Express app
- Mounts API routers
- Configures middleware
- Serves frontend in production
- Handles graceful shutdown

## API Routes (`api/`)

Each file exports an Express router for a specific domain:

### `health.ts`
- `GET /health` - Server health check

### `platform.ts`
- `GET /api/platform/info` - Platform information

### `modules.ts`
- `GET /api/modules` - List modules (stub)
- `POST /api/modules/:id/enable` - Enable module (stub)
- `POST /api/modules/:id/disable` - Disable module (stub)

### `database.ts`
- `POST /api/database/test` - Test database connection
- `POST /api/database/initialize` - Initialize database schema

### `jobs.ts`
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/files` - Upload file
- `DELETE /api/jobs/:id/files/:fileId` - Delete file
- `PATCH /api/jobs/:id/status` - Update job status
- `GET /api/jobs/:id/status-history` - Get status history
- `DELETE /api/jobs/:id/status-history/:historyId` - Delete history entry
- `POST /api/data/migrate` - Import jobs (data migration)

### `stats.ts`
- `GET /api/stats/overview` - Get overview statistics

## Database Layer (`database/`)

### PostgreSQL Database Support

Two PostgreSQL implementations:

1. **PostgreSQL** (`postgresql-service.ts`)
   - Direct PostgreSQL connection
   - Connection pooling via `pg` library
   - Full CRUD operations support

2. **Supabase** (`supabase-client.ts`)
   - PostgreSQL via Supabase
   - Built-in storage integration
   - Cloud-hosted PostgreSQL

### Connection Management

**`connection-pool-manager.ts`**
- Manages database connections per config
- Connection pooling and reuse
- Automatic connection cleanup
- Singleton pattern per database config

### Data Mapping

**`data-mapper.ts`**
- Maps between frontend and backend data formats
- Field name conversion (camelCase ↔ snake_case)
- Handles null/undefined values
- Type conversions

## Middleware (`middleware/`)

### `database-config.ts`

Two middleware functions:

1. **`extractDatabaseConfig`**
   - Extracts DB config from `x-database-config` header
   - Decodes base64 JSON
   - Attaches to `req.dbConfig`
   - Logs configuration (excluding sensitive data)

2. **`requireDatabaseConfig`**
   - Ensures DB config is present
   - Returns 400 if missing
   - Use on routes that need database

Usage:
```typescript
// Extract config on all requests
app.use(extractDatabaseConfig);

// Require config on specific routes
router.get('/api/jobs', requireDatabaseConfig, async (req, res) => {
  const db = await ConnectionPoolManager.getConnection(req.dbConfig!);
  // ...
});
```

## Services (`services/`)

### `storage-manager.ts`

Unified file storage abstraction supporting:
- Supabase Storage
- Local filesystem
- S3 (placeholder)
- Azure Blob (placeholder)

Features:
- Automatic temp file cleanup (hourly)
- Provider switching at runtime
- Upload/download/delete operations

### `storage-service.ts`

Platform-level storage service with:
- File metadata management
- Multi-provider support
- File migration between providers
- Module-specific storage isolation

## Utilities (`utils/`)

### `logger.ts`

Structured logging utility:
- Timestamped logs
- Log levels (info, warn, error, debug)
- Contextual metadata
- Colored output for development

Usage:
```typescript
const logger = new Logger('MyService');
logger.info('Operation completed', { userId: 123 });
logger.error('Operation failed', { error: err.message });
```

## Session-Based Architecture

### How It Works

1. **Client stores DB config** in localStorage
2. **Client sends config** with each request via header:
   ```
   x-database-config: <base64-encoded-json>
   ```
3. **Middleware extracts** config and attaches to request
4. **Routes use** the config to connect to database
5. **Connection pooling** reuses connections for same config

### Benefits

- No server-side session storage
- Multiple databases simultaneously
- Easy to switch databases
- Stateless backend (scalable)

## Adding a New API Route

1. Create router file in `api/`:
   ```typescript
   // api/my-feature.ts
   import { Router } from 'express';

   const router = Router();

   router.get('/api/my-feature', async (req, res) => {
     // Implementation
   });

   export default router;
   ```

2. Import and mount in `index.ts`:
   ```typescript
   import myFeatureRouter from './api/my-feature.js';

   app.use(myFeatureRouter);
   ```

## Adding a New Database Type

1. Create service implementing database interface:
   ```typescript
   // database/my-db-service.ts
   export class MyDBService {
     async initialize() { /* ... */ }
     async getJobs() { /* ... */ }
     // Implement all required methods
   }
   ```

2. Add to `connection-pool-manager.ts`:
   ```typescript
   if (config.type === 'my-db') {
     return new MyDBService(config);
   }
   ```

3. Add config type to frontend

## Development

```bash
# Watch mode with auto-reload
npm run dev:backend

# Type checking
npm run type-check

# Build
npm run build:backend
```

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Paths (optional, defaults provided)
RUNTIME_DIR=.runtime
TEMP_UPLOADS=.runtime/temp-uploads
STORAGE_DIR=.runtime/storage

# Database (optional, can configure via UI)
DATABASE_URL=postgresql://...

# Supabase (optional)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
