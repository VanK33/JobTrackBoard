/**
 * Main entry point for the Modular Job Tracker Platform
 * Starts the Express server and initializes the platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Platform, createPlatform } from './platform.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('Server');

async function startServer(): Promise<void> {
  try {
    // Create and initialize platform
    const platform = createPlatform();
    await platform.initialize();

    // Create Express app
    const app = express();
    const config = platform.getConfig();

    // Security middleware
    if (config.server.security.helmet) {
      app.use(helmet());
    }

    // CORS
    app.use(cors(config.server.cors));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        platform: platform.isInitialized() ? 'initialized' : 'not_initialized',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Platform info endpoint
    app.get('/api/platform/info', async (req, res) => {
      try {
        let modules = [];
        let enabledModules = [];
        
        try {
          modules = await platform.moduleManager.listModules();
          enabledModules = modules.filter(m => m.status === 'enabled');
        } catch (dbError) {
          // Return mock data if database is not available
          logger.warn('Database not available, returning mock platform info');
          enabledModules = [
            {
              id: 'job-tracker-basic',
              name: 'job-tracker-basic',
              displayName: '基础求职追踪器',
              version: '1.0.0',
              enabled: true,
              status: 'active'
            }
          ];
        }
        
        res.json({
          platform: {
            version: '1.0.0',
            status: 'running',
            initialized: true
          },
          enabledModules: enabledModules,
          modules: {
            total: modules.length || 1,
            enabled: enabledModules.length
          }
        });
      } catch (error) {
        logger.error('Failed to get platform info', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Module management endpoints
    app.get('/api/modules', async (req, res) => {
      try {
        let modules = [];
        
        try {
          const moduleList = await platform.moduleManager.listModules();
          modules = moduleList.map(m => ({
            id: m.manifest.name,
            name: m.manifest.name,
            displayName: m.manifest.displayName,
            description: m.manifest.description,
            version: m.installedVersion,
            type: m.manifest.type,
            status: m.status,
            enabledAt: m.enabledAt,
            disabledAt: m.disabledAt,
            error: m.error
          }));
        } catch (dbError) {
          // Return mock data if database is not available
          logger.warn('Database not available, returning mock modules data');
          modules = [
            {
              id: 'job-tracker-basic',
              name: 'job-tracker-basic',
              displayName: '基础求职追踪器',
              description: '完整的求职申请管理系统，支持工作状态追踪、公司管理、时间线记录和统计分析',
              version: '1.0.0',
              type: 'core-module',
              status: 'installed'
            }
          ];
        }
        
        res.json(modules);
      } catch (error) {
        logger.error('Failed to list modules', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post('/api/modules/:moduleId/enable', async (req, res) => {
      try {
        const { moduleId } = req.params;
        const success = await platform.moduleManager.enable(moduleId);
        
        if (success) {
          res.json({ success: true, message: `Module ${moduleId} enabled` });
        } else {
          res.status(400).json({ success: false, error: 'Failed to enable module' });
        }
      } catch (error) {
        logger.error('Failed to enable module', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/modules/:moduleId/disable', async (req, res) => {
      try {
        const { moduleId } = req.params;
        const success = await platform.moduleManager.disable(moduleId);
        
        if (success) {
          res.json({ success: true, message: `Module ${moduleId} disabled` });
        } else {
          res.status(400).json({ success: false, error: 'Failed to disable module' });
        }
      } catch (error) {
        logger.error('Failed to disable module', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Job Tracker API endpoints (mock data for demonstration)
    let mockJobs: any[] = [
      {
        _id: '1',
        title: 'Frontend Developer',
        company: 'Tech Startup Inc',
        location: 'San Francisco, CA',
        status: 'applied',
        url: 'https://example.com/job1',
        notes: 'Interesting startup with great team',
        appliedAt: '2024-01-15',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        _id: '2',
        title: 'React Developer',
        company: 'Big Corp',
        location: 'New York, NY',
        status: 'interviewing',
        url: 'https://example.com/job2',
        notes: 'Second interview scheduled for next week',
        appliedAt: '2024-01-12',
        createdAt: '2024-01-08T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z'
      },
      {
        _id: '3',
        title: 'Full Stack Engineer',
        company: 'Innovation Labs',
        location: 'Austin, TX',
        status: 'interested',
        url: 'https://example.com/job3',
        notes: 'Need to tailor resume for this position',
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      }
    ];

    app.get('/api/jobs', (req, res) => {
      res.json(mockJobs);
    });

    app.post('/api/jobs', (req, res) => {
      const newJob = {
        _id: String(Date.now()),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockJobs.push(newJob);
      res.json(newJob);
    });

    app.get('/api/jobs/:id', (req, res) => {
      const job = mockJobs.find(j => j._id === req.params.id);
      if (job) {
        res.json(job);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    });

    app.put('/api/jobs/:id', (req, res) => {
      const jobIndex = mockJobs.findIndex(j => j._id === req.params.id);
      if (jobIndex !== -1) {
        mockJobs[jobIndex] = {
          ...mockJobs[jobIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        res.json(mockJobs[jobIndex]);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    });

    app.delete('/api/jobs/:id', (req, res) => {
      const jobIndex = mockJobs.findIndex(j => j._id === req.params.id);
      if (jobIndex !== -1) {
        mockJobs.splice(jobIndex, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    });

    app.patch('/api/jobs/:id/status', (req, res) => {
      const jobIndex = mockJobs.findIndex(j => j._id === req.params.id);
      if (jobIndex !== -1) {
        mockJobs[jobIndex].status = req.body.status;
        mockJobs[jobIndex].updatedAt = new Date().toISOString();
        res.json(mockJobs[jobIndex]);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    });

    app.get('/api/stats/overview', (req, res) => {
      const stats = {
        total: mockJobs.length,
        interested: mockJobs.filter(j => j.status === 'interested').length,
        applied: mockJobs.filter(j => j.status === 'applied').length,
        interviewing: mockJobs.filter(j => j.status === 'interviewing').length,
        offered: mockJobs.filter(j => j.status === 'offered').length,
        rejected: mockJobs.filter(j => j.status === 'rejected').length,
      };
      res.json(stats);
    });

    // Authentication endpoints
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
          return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const user = await platform.authService.createUser({
          email,
          password,
          name
        });

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        });

      } catch (error) {
        logger.error('Registration failed', { error: error.message });
        res.status(400).json({ error: error.message });
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await platform.authService.authenticate({ email, password });
        
        if (result.success) {
          res.json({
            success: true,
            user: result.user,
            token: result.session?.token
          });
        } else {
          res.status(401).json({ error: result.error });
        }

      } catch (error) {
        logger.error('Login failed', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Static file serving for uploads
    app.use('/storage', express.static('./storage'));

    // Error handling middleware
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled request error', { 
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({ 
        error: 'Internal server error',
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ 
        error: 'Not found',
        path: req.path
      });
    });

    // Start server
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info('Modular Job Tracker Platform started', {
        host: config.server.host,
        port: config.server.port,
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await platform.shutdown();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await platform.shutdown();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(error => {
    console.error('Failed to start platform:', error);
    process.exit(1);
  });
}