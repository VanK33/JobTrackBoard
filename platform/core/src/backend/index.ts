/**
 * Backend server with session-based database connections
 * Each user's database config is stored in their browser and sent via headers
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { Logger } from './utils/logger.js';
import { PATHS } from '../shared/config/paths.js';
import { extractDatabaseConfig } from './middleware/database-config.js';
import { supabaseStorage } from './database/supabase-client.js';
import { StorageManager, StorageConfig } from './services/storage-manager.js';

// Import API routers
import healthRouter from './api/health.js';
import platformRouter from './api/platform.js';
import modulesRouter from './api/modules.js';
import databaseRouter from './api/database.js';
import jobsRouter, { setStorageManager } from './api/jobs.js';
import statsRouter from './api/stats.js';

const logger = new Logger('DatabaseServer');

async function startDatabaseServer(): Promise<void> {
  const app = express();

  logger.info('Starting database server in session-based mode', {
    mode: 'multi-tenant',
    configSource: 'client-headers'
  });

  // Initialize Storage Manager with default config
  const defaultStorageConfig: StorageConfig = {
    provider: 'supabase',
    tempDir: PATHS.TEMP_UPLOADS,
    localStorageDir: PATHS.STORAGE
  };
  const storageManager = new StorageManager(defaultStorageConfig);

  // Inject storage manager into jobs router
  setStorageManager(storageManager);

  // Initialize Supabase storage bucket (backward compatibility)
  await supabaseStorage.initializeBucket();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Extract database config from request headers
  app.use(extractDatabaseConfig);

  // Mount API routers
  app.use(healthRouter);
  app.use(platformRouter);
  app.use(modulesRouter);
  app.use(databaseRouter);
  app.use(jobsRouter);
  app.use(statsRouter);

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
