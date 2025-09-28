# Modular Job Tracker Platform

A truly modular job-tracking application with plug-and-play architecture. Unlike Excel or Airtable, this platform provides specialized functionality for job searching while allowing users to customize their experience through modules.

> **🗄️ Database Support**: This project is designed for Supabase by default. If you want to extend support for other databases, you can implement it yourself.

## 🎯 Core Concept

The platform works like assembling a computer:
- **Platform Core** = Motherboard (provides infrastructure)
- **Modules** = Components that plug in (provide specific features)
- **True Modularity** = Add/remove features without affecting the core system

## 🏗️ Architecture Overview

### Platform Core ("The Motherboard")
- **Module Manager**: Installs, enables, and manages module lifecycle
- **Event Bus**: Enables modules to communicate without dependencies
- **Data Service**: Provides isolated data storage for each module
- **Auth Service**: Handles user authentication and permissions
- **Storage Service**: Multi-provider file storage abstraction

### Available Modules

#### Core Module: Basic Job Tracker (`job-tracker-basic`)
- ✅ **Status**: Implemented
- **Features**: 
  - CRUD operations for job applications
  - Company management
  - Status tracking (interested → applied → interviewing → offered/rejected)
  - Timeline tracking
  - Statistics and analytics
  - Search and filtering

#### Future Modules (Planned)
- **JD-Resume Comparison**: AI-powered job description analysis
- **OCR Scanner**: Extract text from job posting images
- **LinkedIn Integration**: Import jobs and contacts
- **Interview Scheduler**: Calendar integration
- **Salary Negotiation Tracker**: Compensation analysis
- **Email Integration**: Auto-track application emails
- **Analytics Dashboard**: Advanced reporting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (recommended: Supabase)
- Redis (optional, for distributed events)

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd job_seek_app
   npm install
   ```

2. **Environment Setup**:
   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure database connection (example for Supabase)
   DATABASE_URL=postgresql://user:password@host:5432/database
   REDIS_URL=redis://localhost:6379  # Optional
   JWT_SECRET=your-super-secret-key
   ```

3. **Build the platform**:
   ```bash
   npm run build
   ```

4. **Start the platform**:
   ```bash
   npm run dev
   ```

The platform will start on `http://localhost:3000`

### API Endpoints

#### Platform Management
- `GET /health` - Health check
- `GET /api/platform/info` - Platform status and modules
- `GET /api/modules` - List all modules
- `POST /api/modules/:id/enable` - Enable a module
- `POST /api/modules/:id/disable` - Disable a module

#### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Login

#### Job Tracker (when enabled)
- `GET /api/jobs` - List jobs with filtering
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get specific job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `PATCH /api/jobs/:id/status` - Update job status
- `GET /api/stats/overview` - Get overview statistics

## 🔌 Module Development

### Creating a New Module

1. **Generate module structure**:
   ```bash
   mkdir -p modules/my-awesome-module/src/backend
   ```

2. **Create module manifest** (`module.json`):
   ```json
   {
     "name": "my-awesome-module",
     "version": "1.0.0",
     "displayName": "My Awesome Module",
     "description": "Does awesome things",
     "type": "enhancement-module",
     "dependencies": {
       "modules": ["job-tracker-basic"],
       "platform": ["data-service", "event-bus"]
     },
     "permissions": ["data:jobs:read"],
     "exports": {
       "backend": "./dist/backend/index.js"
     }
   }
   ```

3. **Implement module backend**:
   ```typescript
   import { ModuleBackend, ModuleContext } from '@shared/types';

   export default class MyAwesomeModule implements ModuleBackend {
     name = 'my-awesome-module';

     async initialize(context: ModuleContext): Promise<void> {
       // Module initialization
     }

     registerRoutes(router: ModuleRouter): void {
       router.get('/awesome', this.handleAwesome.bind(this));
     }

     registerEventHandlers(eventBus: EventBus): void {
       eventBus.subscribe('job.created', this.onJobCreated.bind(this));
     }

     async shutdown(): Promise<void> {
       // Cleanup
     }
   }
   ```

4. **Install and enable**:
   ```bash
   # Build module
   npm run build --workspace=@modules/my-awesome-module
   
   # The platform will auto-detect and load the module
   ```

### Module Communication

Modules communicate through events:

```typescript
// Publishing events
await eventBus.publish('my-module.data-updated', {
  userId: 'user123',
  data: { ... }
});

// Subscribing to events
eventBus.subscribe('job.created', (jobData) => {
  // React to job creation
});
```

### Data Isolation

Each module has its own isolated data space:

```typescript
// Module can only access its own data
const myData = await dataService.create('my-module', 'my-entity', data);

// Cross-module data sharing requires explicit contracts
dataService.exposeData({
  name: 'JobDataContract',
  methods: {
    getJobs: () => this.getJobs(),
    getJobsByStatus: (status) => this.getJobsByStatus(status)
  }
});
```

## 🎨 Frontend Development

The platform uses Module Federation for frontend modularity:

```typescript
// Module frontend component
export const MyModuleComponent = () => {
  return (
    <div>
      <h2>My Awesome Module</h2>
      {/* Module-specific UI */}
    </div>
  );
};

// Register with platform
container.registerComponent('MyModuleComponent', MyModuleComponent);
```

## 🔧 Advanced Features

### Multiple Database Support
```typescript
// Configure different databases per module
const config = {
  modules: {
    'job-tracker': { database: 'mongodb://localhost/jobs' },
    'analytics': { database: 'postgresql://localhost/analytics' }
  }
};
```

### Multi-Cloud Storage
```typescript
// Add cloud storage providers
await platform.storageService.addProvider({
  id: 'aws-s3',
  type: 'aws-s3',
  config: {
    bucket: 'my-job-tracker-files',
    region: 'us-east-1'
  }
});
```

### Performance Monitoring
```typescript
// Built-in performance tracking
platform.on('module:performance', (metrics) => {
  console.log('Module performance:', metrics);
});
```

## 📈 Scaling

### Horizontal Scaling
- Modules can be deployed as separate microservices
- Event bus supports distributed messaging via Redis
- Database sharding by module and user

### Module Marketplace
- Private module registry for team sharing
- Version management and compatibility checking
- Automated testing and deployment

## 🛡️ Security

- **Module Sandboxing**: Each module runs in isolated context
- **Permission System**: Fine-grained access control
- **Data Isolation**: Modules cannot access each other's data without explicit contracts
- **Audit Logging**: Complete audit trail of all module actions

## 📝 Current Status

### ✅ Completed
- [x] Platform core architecture
- [x] Module management system
- [x] Event bus for inter-module communication
- [x] Data service with module isolation
- [x] Authentication and authorization
- [x] Storage service with multiple providers
- [x] Basic Job Tracker module
- [x] API endpoints and documentation

### 🚧 In Progress
- [ ] Frontend UI shell with Module Federation
- [ ] Module CLI tools
- [ ] JD-Resume Comparison module
- [ ] Testing framework

### 📋 Planned
- [ ] Frontend module system
- [ ] More specialized modules
- [ ] Module marketplace
- [ ] Advanced analytics
- [ ] Mobile app support

## 🤝 Contributing

1. **Create a new module** following the module development guide
2. **Submit modules** to the community registry
3. **Contribute to platform core** for infrastructure improvements
4. **Write documentation** to help other developers

## 📄 License

MIT License - See LICENSE file for details

---

**Built with the vision of making job tracking as powerful as custom software, yet as easy as Excel.**