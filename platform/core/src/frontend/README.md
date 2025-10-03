# Frontend

React 18 + TypeScript + Vite application for the job tracker.

## Directory Structure

```
frontend/
├── pages/              # Page components (main views)
│   ├── JobDashboard.tsx
│   ├── DatabaseSettings.tsx
│   ├── Workspace.tsx
│   ├── ModuleStore.tsx
│   └── MinimalistWorkspace.tsx
├── components/         # Reusable components
│   ├── Header.tsx
│   ├── ModuleCard.tsx
│   ├── ErrorBoundary.tsx
│   └── modules/
│       └── JobTrackerModule.tsx
├── services/           # API clients
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   └── api-client.ts
├── config/             # Configuration
│   └── api.ts
├── App.tsx            # Root component
├── main.tsx           # Entry point
├── types.ts           # TypeScript types
└── index.css          # Global styles
```

## Pages (`pages/`)

Main application views:

### `JobDashboard.tsx`
- Primary dashboard view
- Job list with status filtering
- Quick stats overview
- Job creation and management
- File upload interface

### `DatabaseSettings.tsx`
- Database configuration UI
- Connection testing
- Schema initialization
- Multiple database support (SQL.js, PostgreSQL, Supabase)

### `Workspace.tsx`
- Module-based workspace view
- Legacy module system interface

### `ModuleStore.tsx`
- Module marketplace (stub)
- Module installation UI

### `MinimalistWorkspace.tsx`
- Alternative minimalist view
- Simplified interface

## Components (`components/`)

Reusable UI components:

### `Header.tsx`
- Top navigation bar
- View switcher
- Module count display

### `ModuleCard.tsx`
- Module display card
- Install/uninstall actions
- Module metadata

### `ErrorBoundary.tsx`
- Error handling wrapper
- Graceful error display
- Error recovery

### `modules/JobTrackerModule.tsx`
- Job tracker module component
- Legacy module UI

## Session-Based Architecture

### Database Configuration

Database config is stored in browser localStorage and sent with every API request:

```typescript
// Store config
localStorage.setItem('database-config', JSON.stringify(config));

// API client automatically includes it
const jobs = await apiFetch('/api/jobs');  // Config sent in header
```

### API Client (`utils/api-client.ts`)

Wrapper around `fetch` that:
- Reads DB config from localStorage
- Encodes as base64
- Adds `x-database-config` header
- Handles errors

Usage:
```typescript
import { apiFetch } from '../utils/api-client';

// GET request
const jobs = await apiFetch('/api/jobs');

// POST request
const newJob = await apiFetch('/api/jobs', {
  method: 'POST',
  body: JSON.stringify(jobData)
});
```

## State Management

Currently using React's built-in state management:
- `useState` for component state
- `useEffect` for side effects
- Props for data flow

No external state management library (Redux, Zustand, etc.) at this time.

## Styling

**Inline styles** with CSS-in-JS approach:
- No external CSS frameworks
- Responsive design with media queries
- Dark color scheme
- Minimalist aesthetic

Example:
```typescript
<div style={{
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  padding: '20px',
  borderRadius: '8px'
}}>
  Content
</div>
```

## Development

### Dev Server

```bash
npm run dev:frontend
```

Runs Vite dev server at http://localhost:5173

Configuration in `vite.config.ts`:
- API proxy to backend (http://localhost:3000)
- React Fast Refresh
- TypeScript support
- Path aliases (`@/`, `@shared/`)

### Building

```bash
npm run build:frontend
```

Outputs to `dist/frontend/`:
- Bundled JavaScript
- Optimized assets
- `index.html` entry point

## Adding a New Page

1. Create component in `pages/`:
   ```typescript
   // pages/MyNewPage.tsx
   import React from 'react';

   export default function MyNewPage() {
     return <div>My New Page</div>;
   }
   ```

2. Import in `App.tsx`:
   ```typescript
   import MyNewPage from './pages/MyNewPage';
   ```

3. Add routing logic:
   ```typescript
   const [view, setView] = useState<'dashboard' | 'mynew'>('dashboard');

   if (view === 'mynew') {
     return <MyNewPage />;
   }
   ```

## Adding a New Component

1. Create in `components/`:
   ```typescript
   // components/MyComponent.tsx
   import React from 'react';

   interface MyComponentProps {
     title: string;
     onClick: () => void;
   }

   export default function MyComponent({ title, onClick }: MyComponentProps) {
     return (
       <button onClick={onClick} style={{ /* styles */ }}>
         {title}
       </button>
     );
   }
   ```

2. Import where needed:
   ```typescript
   import MyComponent from '../components/MyComponent';

   <MyComponent title="Click me" onClick={() => alert('Clicked!')} />
   ```

## API Integration

### Fetching Data

```typescript
import { apiFetch } from '../utils/api-client';

// In component
useEffect(() => {
  async function loadJobs() {
    try {
      const jobs = await apiFetch('/api/jobs');
      setJobs(jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }
  loadJobs();
}, []);
```

### Creating Data

```typescript
async function createJob(jobData: JobData) {
  try {
    const newJob = await apiFetch('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
    setJobs([...jobs, newJob]);
  } catch (error) {
    console.error('Failed to create job:', error);
  }
}
```

### File Uploads

```typescript
async function uploadFile(file: File, jobId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'resume');

  try {
    const result = await apiFetch(`/api/jobs/${jobId}/files`, {
      method: 'POST',
      body: formData,
      isFormData: true  // Tells api-client not to stringify
    });
    console.log('File uploaded:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## TypeScript Types

### Global Types (`types.ts`)

```typescript
export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface InstalledModule {
  id: string;
  name: string;
  displayName: string;
  version: string;
  enabled: boolean;
  status: string;
}
```

### Component Props

Always define prop interfaces:
```typescript
interface JobCardProps {
  job: Job;
  onUpdate: (job: Job) => void;
  onDelete: (id: number) => void;
}

function JobCard({ job, onUpdate, onDelete }: JobCardProps) {
  // ...
}
```

## Error Handling

### ErrorBoundary

Wrap components that might error:
```typescript
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <JobDashboard />
</ErrorBoundary>
```

### Try-Catch

Always wrap async operations:
```typescript
try {
  const result = await apiFetch('/api/jobs');
  setJobs(result);
} catch (error) {
  console.error('Error:', error);
  setError('Failed to load jobs');
}
```

## Performance

### React Best Practices

- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Avoid inline object/array creation in props
- Use `React.memo` for pure components

### Code Splitting

Vite automatically code splits:
- Dynamic imports create separate chunks
- Route-based splitting recommended

```typescript
const Dashboard = React.lazy(() => import('./pages/JobDashboard'));

<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>
```

## Configuration

### Environment Variables

Use Vite's env variables:
```typescript
// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
```

Define in `.env.local`:
```
VITE_API_URL=http://localhost:3000
```

### API Base URL (`config/api.ts`)

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

## Testing (Future)

Recommended setup:
- **Vitest** for unit tests
- **React Testing Library** for component tests
- **Playwright** for E2E tests

## Deployment

Frontend is served by backend in production:
- Build creates static files in `dist/frontend/`
- Backend serves these files
- All API requests go to same origin
- No CORS issues

Build command:
```bash
npm run build:frontend
```

Output: `dist/frontend/index.html` + assets
