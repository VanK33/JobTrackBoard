# Job Tracker Application

A modern, full-stack job tracking application with session-based multi-tenant database architecture.

## 🏗️ Architecture

This is a **monorepo** organized with npm workspaces:

```
job_seek_app/
├── platform/core/          # Main application (backend + frontend)
├── modules/                # Future: Pluggable modules
├── shared/                 # Shared types and utilities
└── tools/                  # Build and development tools
```

### Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React 18 + Vite 5 + TypeScript
- **Database**: PostgreSQL/Supabase
- **Storage**: Supabase Storage (with local fallback)
- **Architecture**: Session-based multi-tenant

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development (runs backend + frontend)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173 (dev proxy to backend)
- Backend API: http://localhost:3000

### Database Setup

**PostgreSQL Required**: This application requires a PostgreSQL database.

On first run, configure your database through the UI:

1. Open http://localhost:5173
2. Choose PostgreSQL or Supabase
3. Enter connection details
4. Initialize database schema

Database configuration is stored in browser localStorage and sent via headers with each request.

#### PostgreSQL Setup Options

**Option 1: Local PostgreSQL**
```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb job_tracker
```

**Option 2: Docker PostgreSQL**
```bash
docker run --name job-tracker-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=job_tracker \
  -p 5432:5432 -d postgres:15
```

**Option 3: Supabase (Recommended for Production)**
- Sign up at https://supabase.com
- Create a new project
- Copy connection string from project settings

## 📁 Project Structure

```
platform/core/
├── src/
│   ├── backend/           # Express backend
│   │   ├── api/          # API route modules
│   │   ├── database/     # Database services
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   ├── frontend/         # React frontend
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API clients
│   │   ├── hooks/        # React hooks
│   │   └── utils/        # Utilities
│   └── shared/           # Shared between backend/frontend
│       └── config/       # Configuration
├── dist/                 # Production build output
└── .runtime/            # Runtime data (temp files, storage)
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                    # Run backend + frontend concurrently
npm run dev:backend           # Backend only
npm run dev:frontend          # Frontend only

# Building
npm run build                 # Build all workspaces
npm run build:prod           # Build for production

# Quality
npm run type-check           # TypeScript type checking
npm run lint                 # ESLint
npm test                     # Run tests

# Production
npm start                    # Start production server
```

### Backend API Routes

- `GET /health` - Health check
- `GET /api/platform/info` - Platform information
- `POST /api/database/test` - Test database connection
- `POST /api/database/initialize` - Initialize database schema
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/stats/overview` - Get statistics

### Database Configuration

The application uses **PostgreSQL** as its database backend:

#### PostgreSQL Connection
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

#### Supabase Connection
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
```

### File Storage

Supports multiple storage backends:

- **Supabase Storage** (default in production)
- **Local filesystem** (development fallback)
- **AWS S3** (planned)
- **Azure Blob** (planned)

## 🚢 Deployment

### Render.com (Recommended)

The project includes `render.yaml` for one-click deployment:

1. Connect your GitHub repository to Render
2. Render will automatically:
   - Install dependencies
   - Build the application
   - Start the backend (which serves the frontend)
   - Provision PostgreSQL database

### Environment Variables

Required in production:
```bash
NODE_ENV=production
DATABASE_URL=<postgres-connection-string>
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
JWT_SECRET=<random-secret>
```

### Build Process

```bash
npm run build:prod
```

This will:
1. Build backend (copy to `dist/backend/`)
2. Build frontend (bundle to `dist/frontend/`)
3. Copy shared utilities to `dist/shared/`

The backend serves the frontend in production from `dist/frontend/`.

## 🎨 Frontend Development

### Tech Stack

- React 18 with TypeScript
- Vite 5 for dev server and bundling
- CSS-in-JS (inline styles)
- API client with automatic database config injection

### Key Features

- **Session-based architecture**: Database config stored in browser, sent with each request
- **Dark mode ready**: Modern, minimalist design
- **Responsive**: Works on desktop and mobile
- **File uploads**: Resume and document management
- **Status tracking**: Visual pipeline for job applications

### Adding a New Page

1. Create component in `src/frontend/pages/`
2. Import in `App.tsx`
3. Add route logic

### Adding a New Component

1. Create in `src/frontend/components/`
2. Import where needed
3. Use TypeScript for props

## 🔒 Security

- Database config validation
- File upload restrictions (25MB, specific MIME types)
- SQL injection protection (parameterized queries)
- CORS configuration

## 📈 Current Status

### ✅ Completed

- [x] Monorepo structure with npm workspaces
- [x] Backend API with modular routes
- [x] Frontend with React + Vite
- [x] PostgreSQL/Supabase database support
- [x] Session-based multi-tenant architecture
- [x] File upload and storage management
- [x] Job CRUD operations
- [x] Status history tracking
- [x] Statistics dashboard

### 🚧 In Progress

- [ ] Advanced search and filtering

### 📋 Planned

- [ ] Module system for extensibility
- [ ] AI-powered job matching
- [ ] Interview scheduler
- [ ] Salary negotiation tracker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

---

**Built for job seekers who want powerful tracking without complex setup.**
