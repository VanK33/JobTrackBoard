# job_seek_app Development Guidelines

Last updated: 2025-10-03 (After monorepo refactoring)

## 🏗️ Project Structure

This is a **monorepo** organized with npm workspaces:

```
job_seek_app/
├── platform/core/          # Main application workspace
│   ├── src/
│   │   ├── backend/       # Express backend (TypeScript)
│   │   │   ├── api/       # Modular API routes
│   │   │   ├── database/  # Database services
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── frontend/      # React frontend (TypeScript)
│   │   │   ├── pages/     # Page components
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── shared/        # Shared utilities
│   ├── dist/             # Build output
│   └── .runtime/         # Runtime data (gitignored)
├── modules/              # Future: Pluggable modules
├── shared/               # Shared types
└── tools/               # Build tools
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript 5.0+
- **Framework**: Express.js
- **Database**: PostgreSQL/Supabase + SQL.js fallback
- **Storage**: Supabase Storage + Local fallback
- **Architecture**: Session-based multi-tenant

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Inline CSS-in-JS
- **State**: React hooks (no external library)

### Monorepo
- **Package Manager**: npm workspaces
- **Build**: TypeScript + Vite
- **Dev Server**: Concurrent backend + frontend

## 📋 Common Commands

### Development
```bash
npm run dev                  # Run backend + frontend
npm run dev:backend         # Backend only (port 3000)
npm run dev:frontend        # Frontend only (port 5173)
```

### Building
```bash
npm run build               # Build all workspaces
npm run build:prod         # Build for production
```

### Quality
```bash
npm run type-check         # TypeScript checking
npm run lint               # ESLint
npm test                   # Run tests
```

### Production
```bash
npm start                  # Start production server
```

## 🎯 Development Patterns

### Backend: Adding API Routes

1. Create router in `platform/core/src/backend/api/`:
```typescript
// api/my-feature.ts
import { Router } from 'express';

const router = Router();

router.get('/api/my-feature', async (req, res) => {
  // Implementation
});

export default router;
```

2. Mount in `src/backend/index.ts`:
```typescript
import myFeatureRouter from './api/my-feature.js';
app.use(myFeatureRouter);
```

### Frontend: Adding Pages

1. Create in `platform/core/src/frontend/pages/`:
```typescript
// pages/MyPage.tsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

2. Import in `App.tsx` and add routing logic

### Session-Based Architecture

- Database config stored in browser localStorage
- Sent with each request via `x-database-config` header
- Backend extracts and uses for that request
- Supports multiple databases simultaneously

### API Client Usage

```typescript
import { apiFetch } from '../utils/api-client';

// Automatically includes database config
const jobs = await apiFetch('/api/jobs');
```

## 🗂️ Key Files

### Entry Points
- **Backend**: `platform/core/src/backend/index.ts`
- **Frontend**: `platform/core/src/frontend/main.tsx`
- **Root Package**: `package.json` (workspace root)

### Configuration
- **Vite**: `platform/core/vite.config.ts`
- **TypeScript**: `tsconfig.json` (root)
- **Paths**: `platform/core/src/shared/config/paths.ts`
- **Deployment**: `render.yaml`

### Documentation
- **Root**: `README.md` - Project overview
- **Core**: `platform/core/README.md` - Workspace guide
- **Backend**: `platform/core/src/backend/README.md`
- **Frontend**: `platform/core/src/frontend/README.md`

## 🔧 Code Style

### TypeScript
- Strict mode enabled
- Explicit types for function parameters and returns
- Use interfaces for object shapes
- Prefer `const` over `let`

### React
- Functional components only
- TypeScript for all props
- Inline styles (no external CSS)
- Custom hooks for reusable logic

### Backend
- Modular route organization
- Middleware for cross-cutting concerns
- Service layer for business logic
- Database abstraction via services

## 🚢 Build & Deployment

### Build Output Structure
```
dist/
├── backend/       # Backend source (copied)
├── shared/        # Shared utilities
└── frontend/      # Vite bundle (HTML + assets)
```

### Production
- Backend serves frontend from `dist/frontend/`
- Single server on port 3000
- Environment variables via `.env`
- Deployed to Render.com via `render.yaml`

## 📝 Recent Changes (Refactoring)

### Completed Stages
1. ✅ **Foundation**: Created runtime directories, PATHS config
2. ✅ **Runtime Dirs**: Centralized `.runtime/` structure
3. ✅ **Database Layer**: Organized into `backend/database/`
4. ✅ **API Routes**: Extracted to modular `backend/api/`
5. ✅ **Frontend Org**: Separated pages and components
6. ✅ **Backend Entry**: Consolidated to single `index.ts`
7. ✅ **Unified App**: Fixed build process for production
8. ✅ **Documentation**: Added comprehensive READMEs

### Key Improvements
- Modular API routes (easier to maintain)
- Clean separation: pages vs components
- Centralized configuration (PATHS)
- Single entry point (index.ts)
- Proper build output structure
- Comprehensive documentation

## 🎨 Architectural Decisions

### Why Session-Based?
- No server-side sessions
- Multiple databases simultaneously
- Easy database switching
- Stateless backend (scalable)

### Why Inline Styles?
- No CSS build step
- Colocated with components
- Type-safe via TypeScript
- Responsive patterns via JS

### Why Monorepo?
- Shared types between backend/frontend
- Single version for all dependencies
- Atomic commits across layers
- Simplified deployment

## 🔒 Security Notes

- Database config validated before use
- File uploads: 25MB limit, MIME type restrictions
- SQL injection protection: parameterized queries
- CORS configured for known origins
- Headers include database config (base64 encoded)

## 📚 Learning Resources

- See `README.md` for project overview
- See `platform/core/src/backend/README.md` for backend architecture
- See `platform/core/src/frontend/README.md` for frontend patterns
- Check `.specify/` for feature specifications and plans

## 🤝 Contributing

1. Create feature branch from `main`
2. Follow existing patterns and structure
3. Add tests for new functionality
4. Update relevant README if architecture changes
5. Run `npm run type-check` before committing
6. Use conventional commit messages

---

**Maintained by the refactoring from 001-monorepo-refactor-project**
