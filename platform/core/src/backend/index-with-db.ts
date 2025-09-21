/**
 * Backend server with real SQLite database integration
 */

import express from 'express';
import cors from 'cors';
import { Logger } from './utils/logger.js';
import { SQLiteService, DatabaseConfig } from './services/sqlite-service.js';

const logger = new Logger('DatabaseServer');
let dbService: SQLiteService;

async function startDatabaseServer(): Promise<void> {
  const app = express();

  // Initialize database service
  dbService = new SQLiteService('./job_tracker.sqlite');

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'database_mode',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'sqlite'
    });
  });

  // Platform info endpoint
  app.get('/api/platform/info', (req, res) => {
    res.json({
      platform: {
        version: '1.0.0',
        status: 'running',
        initialized: true,
        database: 'sqlite'
      },
      enabledModules: [
        {
          id: 'job-tracker-basic',
          name: 'job-tracker-basic',
          displayName: 'Job Tracker with Database',
          version: '1.0.0',
          enabled: true,
          status: 'active'
        }
      ],
      modules: {
        total: 1,
        enabled: 1
      }
    });
  });

  // Module endpoints
  app.get('/api/modules', (req, res) => {
    res.json([
      {
        id: 'job-tracker-basic',
        name: 'job-tracker-basic',
        displayName: 'Job Tracker with Database',
        description: 'Complete job application management system with persistent SQLite database',
        version: '1.0.0',
        type: 'core-module',
        status: 'installed'
      }
    ]);
  });

  app.post('/api/modules/:moduleId/enable', (req, res) => {
    res.json({ success: true, message: `Module ${req.params.moduleId} enabled` });
  });

  app.post('/api/modules/:moduleId/disable', (req, res) => {
    res.json({ success: true, message: `Module ${req.params.moduleId} disabled` });
  });

  // Database configuration endpoints
  app.post('/api/database/test', async (req, res) => {
    try {
      const config: DatabaseConfig = req.body;

      if (!config.type) {
        return res.status(400).json({ error: 'Database type is required' });
      }

      // Test connection using database service
      const result = await dbService.testConnection(config);

      logger.info('Database connection test requested', {
        type: config.type,
        connected: result.connected,
        tablesInitialized: result.tablesInitialized
      });

      res.json({
        success: result.connected,
        connected: result.connected,
        error: result.error || null,
        tablesInitialized: result.tablesInitialized || false,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Database connection test failed', { error: error.message });
      res.status(500).json({
        success: false,
        connected: false,
        error: 'Internal server error during connection test'
      });
    }
  });

  app.post('/api/database/save', async (req, res) => {
    try {
      const config = req.body;

      // For SQLite, we don't need to save connection config since it's file-based
      logger.info('Database configuration saved', { type: config.type });

      res.json({
        success: true,
        message: 'Database configuration saved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Failed to save database configuration', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to save database configuration'
      });
    }
  });

  app.post('/api/database/initialize', async (req, res) => {
    try {
      // Initialize the database and create tables
      await dbService.initialize();

      logger.info('Database initialization completed');

      res.json({
        success: true,
        message: 'Database initialized successfully',
        tablesCreated: ['users', 'jobs', 'job_files', 'config'],
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Database initialization failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Database initialization failed: ' + error.message
      });
    }
  });

  // Job management endpoints with real database
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await dbService.getJobs();
      res.json(jobs);
    } catch (error: any) {
      logger.error('Failed to get jobs', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve jobs' });
    }
  });

  app.post('/api/jobs', async (req, res) => {
    try {
      const jobData = {
        ...req.body,
        status: req.body.status || 'interested'
      };

      const newJob = await dbService.createJob(jobData);
      logger.info('Job created', { id: newJob.id, title: newJob.title });
      res.json(newJob);
    } catch (error: any) {
      logger.error('Failed to create job', { error: error.message });
      res.status(500).json({ error: 'Failed to create job' });
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const jobs = await dbService.getJobs();
      const job = jobs.find(j => j.id === parseInt(req.params.id));

      if (job) {
        res.json(job);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (error: any) {
      logger.error('Failed to get job', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve job' });
    }
  });

  app.put('/api/jobs/:id', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const updates = req.body;

      const updatedJob = await dbService.updateJob(jobId, updates);

      if (updatedJob) {
        logger.info('Job updated', { id: jobId, title: updatedJob.title });
        res.json(updatedJob);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (error: any) {
      logger.error('Failed to update job', { error: error.message });
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  app.delete('/api/jobs/:id', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const success = await dbService.deleteJob(jobId);

      if (success) {
        logger.info('Job deleted', { id: jobId });
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (error: any) {
      logger.error('Failed to delete job', { error: error.message });
      res.status(500).json({ error: 'Failed to delete job' });
    }
  });

  app.patch('/api/jobs/:id/status', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { status } = req.body;

      const updatedJob = await dbService.updateJob(jobId, { status });

      if (updatedJob) {
        logger.info('Job status updated', { id: jobId, status });
        res.json(updatedJob);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (error: any) {
      logger.error('Failed to update job status', { error: error.message });
      res.status(500).json({ error: 'Failed to update job status' });
    }
  });

  app.get('/api/stats/overview', async (req, res) => {
    try {
      const stats = await dbService.getStats();
      res.json(stats);
    } catch (error: any) {
      logger.error('Failed to get stats', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
  });

  // Data migration endpoint
  app.post('/api/data/migrate', async (req, res) => {
    try {
      const { jobs } = req.body;

      if (!Array.isArray(jobs)) {
        return res.status(400).json({ error: 'Jobs data must be an array' });
      }

      let importedCount = 0;
      let errors = [];

      for (const jobData of jobs) {
        try {
          const now = new Date().toISOString();
          const job = {
            title: jobData.title || 'Untitled',
            company: jobData.company || 'Unknown Company',
            location: jobData.location || 'Unknown Location',
            status: jobData.status || 'interested',
            url: jobData.url,
            notes: jobData.notes,
            description: jobData.description,
            requirements: jobData.requirements,
            responsibilities: jobData.responsibilities,
            qualifications: jobData.qualifications,
            appliedAt: jobData.appliedAt || jobData.applied_at
          };

          await dbService.createJob(job);
          importedCount++;
        } catch (error: any) {
          errors.push(`Failed to import job "${jobData.title}": ${error.message}`);
        }
      }

      logger.info('Data migration completed', { imported: importedCount, errors: errors.length });

      res.json({
        success: true,
        message: `Successfully imported ${importedCount} jobs`,
        imported: importedCount,
        errors: errors,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Data migration failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Data migration failed: ' + error.message
      });
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
  const port = 3000;
  const server = app.listen(port, () => {
    logger.info('Database-enabled server started', { port, database: 'sqlite' });
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully');
    server.close(async () => {
      await dbService.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startDatabaseServer().catch((error: Error) => {
  logger.error('Failed to start database server', { error: error.message });
  process.exit(1);
});