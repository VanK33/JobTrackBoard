/**
 * Backend server with session-based database connections
 * Each user's database config is stored in their browser and sent via headers
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { Logger } from './utils/logger.js';
import { DatabaseConfig } from './services/sqlite-service.js';
import { DataMapper } from './services/data-mapper.js';
import { ConnectionPoolManager } from './services/connection-pool-manager.js';
import { extractDatabaseConfig, requireDatabaseConfig } from './middleware/database-config.js';
import { supabaseStorage } from './services/supabase-client.js';
import { StorageManager, StorageConfig } from './services/storage-manager.js';

const logger = new Logger('DatabaseServer');

// Configure multer for file uploads to temp directory (then upload to storage provider)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './temp-uploads/');
    },
    filename: (req, file, cb) => {
      // Use original filename without modification
      cb(null, file.originalname);
    }
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'text/plain',
      'text/markdown'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

async function startDatabaseServer(): Promise<void> {
  const app = express();

  logger.info('Starting database server in session-based mode', {
    mode: 'multi-tenant',
    configSource: 'client-headers'
  });

  // Initialize Storage Manager with default config
  const defaultStorageConfig: StorageConfig = {
    provider: 'supabase',
    tempDir: './temp-uploads',
    localStorageDir: './uploads'
  };
  const storageManager = new StorageManager(defaultStorageConfig);

  // Initialize Supabase storage bucket (backward compatibility)
  await supabaseStorage.initializeBucket();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Extract database config from request headers
  app.use(extractDatabaseConfig);

  // Health check (no auth required)
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'database_mode',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      mode: 'session-based'
    });
  });

  // Platform info endpoint (no auth required)
  app.get('/api/platform/info', (req, res) => {
    res.json({
      platform: {
        version: '1.0.0',
        status: 'running',
        initialized: true,
        mode: 'session-based'
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

  // Module endpoints (no auth required)
  app.get('/api/modules', (req, res) => {
    res.json([
      {
        id: 'job-tracker-basic',
        name: 'job-tracker-basic',
        displayName: 'Job Tracker with Database',
        description: 'Complete job application management system with persistent database',
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

  // Database configuration endpoints (config from request body for testing)
  app.post('/api/database/test', async (req, res) => {
    try {
      const config: DatabaseConfig = req.body;

      if (!config.type) {
        return res.status(400).json({ error: 'Database type is required' });
      }

      // Test connection using connection pool manager
      const result = await ConnectionPoolManager.testConnection(config);

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

  app.post('/api/database/initialize', async (req, res) => {
    try {
      const config: DatabaseConfig = req.dbConfig || req.body;

      if (!config) {
        return res.status(400).json({ error: 'Database configuration required' });
      }

      // Get connection and initialize
      const dbService = await ConnectionPoolManager.getConnection(config);
      await dbService.initialize();

      logger.info('Database initialization completed', { type: config.type });

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

  // Job management endpoints (require database config in headers)
  app.get('/api/jobs', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobs = await dbService.getJobs();

      // Convert backend job records to frontend format
      const frontendJobs = jobs.map(job => DataMapper.backendToFrontend(job));
      res.json(frontendJobs);
    } catch (error: any) {
      logger.error('Failed to get jobs', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve jobs' });
    }
  });

  app.post('/api/jobs', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);

      // Convert frontend job data to backend format
      const frontendJobData = {
        ...req.body,
        status: req.body.status || 'interested'
      };

      const backendJobData = DataMapper.frontendToBackend(frontendJobData);
      const newJob = await dbService.createJob(backendJobData as any);

      // Convert back to frontend format for response
      const frontendJob = DataMapper.backendToFrontend(newJob);

      logger.info('Job created', { id: newJob.id, title: newJob.title });
      res.json(frontendJob);
    } catch (error: any) {
      logger.error('Failed to create job', { error: error.message });
      res.status(500).json({ error: 'Failed to create job' });
    }
  });

  app.get('/api/jobs/:id', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobs = await dbService.getJobs();
      const job = jobs.find(j => j.id === parseInt(req.params.id));

      if (job) {
        // Convert to frontend format
        const frontendJob = DataMapper.backendToFrontend(job);
        res.json(frontendJob);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (error: any) {
      logger.error('Failed to get job', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve job' });
    }
  });

  app.put('/api/jobs/:id', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobId = parseInt(req.params.id);
      const frontendUpdates = req.body;

      // Convert frontend updates to backend format
      const backendUpdates = DataMapper.frontendToBackend(frontendUpdates);

      const updatedJob = await dbService.updateJob(jobId as any, backendUpdates);

      if (updatedJob) {
        // Convert back to frontend format for response
        const frontendJob = DataMapper.backendToFrontend(updatedJob);
        logger.info('Job updated', { id: jobId, title: updatedJob.title });
        res.json(frontendJob);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (error: any) {
      logger.error('Failed to update job', { error: error.message });
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  app.delete('/api/jobs/:id', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobId = parseInt(req.params.id);
      const success = await dbService.deleteJob(jobId as any);

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

  // File upload endpoint
  app.post('/api/jobs/:id/files', requireDatabaseConfig, upload.single('file'), async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobId = parseInt(req.params.id);
      const file = req.file;
      const fileType = req.body.type || 'other';

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Upload to storage using StorageManager
      const uploadResult = await storageManager.uploadFile(
        file.path,
        jobId.toString(),
        file.mimetype
      );

      // Create file record in database
      const fileData = {
        jobId: jobId,
        filename: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath: uploadResult.path,
        fileType: fileType,
        uploadedAt: new Date().toISOString()
      };

      const savedFile = await dbService.addJobFile(fileData as any);
      const frontendFile = DataMapper.backendFileToFrontend(savedFile as any);

      logger.info('File uploaded', {
        jobId,
        filename: file.originalname,
        size: file.size,
        path: uploadResult.path
      });

      res.json(frontendFile);
    } catch (error: any) {
      logger.error('Failed to upload file', { error: error.message });
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // File deletion endpoint
  app.delete('/api/jobs/:id/files/:fileId', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobId = parseInt(req.params.id);
      const fileId = parseInt(req.params.fileId);

      // Get file info before deletion
      const fileInfo = await dbService.getJobFile(fileId);
      if (!fileInfo || fileInfo.jobId !== jobId) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete file from storage
      try {
        await storageManager.deleteFile(fileInfo.filePath);
      } catch (error: any) {
        logger.warn('Failed to delete file from storage', {
          path: fileInfo.filePath,
          error: error.message
        });
      }

      // Delete file record from database
      const success = await dbService.deleteJobFile(fileId);

      if (success) {
        logger.info('File deleted', { jobId, fileId, filename: fileInfo.originalName });
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to delete file record' });
      }
    } catch (error: any) {
      logger.error('Failed to delete file', { error: error.message });
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  app.patch('/api/jobs/:id/status', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobId = parseInt(req.params.id);
      const { status } = req.body;

      const updatedJob = await dbService.updateJob(jobId as any, { status } as any);

      if (updatedJob) {
        // Convert to frontend format
        const frontendJob = DataMapper.backendToFrontend(updatedJob);
        logger.info('Job status updated', { id: jobId, status });
        res.json(frontendJob);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (error: any) {
      logger.error('Failed to update job status', { error: error.message });
      res.status(500).json({ error: 'Failed to update job status' });
    }
  });

  // Status History API endpoints
  app.get('/api/jobs/:id/status-history', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobId = parseInt(req.params.id);
      const history = await dbService.getStatusHistory(jobId);
      res.json(history);
    } catch (error: any) {
      logger.error('Failed to get status history', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve status history' });
    }
  });

  app.delete('/api/jobs/:id/status-history/:historyId', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const jobId = parseInt(req.params.id);
      const historyId = parseInt(req.params.historyId);

      const success = await dbService.deleteStatusHistory(historyId);

      if (success) {
        logger.info('Status history deleted', { jobId, historyId });
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Status history entry not found' });
      }
    } catch (error: any) {
      logger.error('Failed to delete status history', { error: error.message });
      res.status(500).json({ error: 'Failed to delete status history' });
    }
  });

  app.get('/api/stats/overview', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const stats = await dbService.getStats();
      res.json(stats);
    } catch (error: any) {
      logger.error('Failed to get stats', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
  });

  // Data migration endpoint
  app.post('/api/data/migrate', requireDatabaseConfig, async (req, res) => {
    try {
      const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
      const { jobs } = req.body;

      if (!Array.isArray(jobs)) {
        return res.status(400).json({ error: 'Jobs data must be an array' });
      }

      let importedCount = 0;
      let errors: string[] = [];

      for (const jobData of jobs) {
        try {
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

          await dbService.createJob(job as any);
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

  // Serve frontend static files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../frontend');
    logger.info('Serving frontend static files', { frontendPath, __dirname });

    // First serve static assets
    app.use(express.static(frontendPath));

    // Handle client-side routing - catch all routes for SPA
    app.get('*', (req, res) => {
      logger.info('Serving SPA for route', { path: req.path });
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    // 404 handler for API-only routes in development
    app.use((req, res) => {
      res.status(404).json({
        error: 'Not found',
        path: req.path
      });
    });
  }

  // Start server
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    logger.info('Session-based database server started', {
      port,
      mode: 'multi-tenant',
      configSource: 'client-headers'
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully');
    server.close(async () => {
      await ConnectionPoolManager.closeAll();
      await storageManager.shutdown();
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
