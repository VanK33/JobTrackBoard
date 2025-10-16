/**
 * Database Configuration and Management Routes
 */

import { Router, Request, Response } from 'express';
import { Logger } from '../utils/logger.js';
import { DatabaseConfig } from '../database/postgresql-service.js';
import { ConnectionPoolManager } from '../database/connection-pool-manager.js';

const router = Router();
const logger = new Logger('DatabaseAPI');

router.post('/api/database/test', async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = req.body;

    if (!config.type) {
      return res.status(400).json({ error: 'Database type is required' });
    }

    // Reject SQLite configurations
    if (config.type === 'sqlite') {
      return res.status(400).json({
        connected: false,
        error: 'Unsupported database type: sqlite. SQLite is no longer supported. Please use PostgreSQL or Supabase. See README for setup instructions.'
      });
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

router.post('/api/database/initialize', async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = req.dbConfig || req.body;

    if (!config) {
      return res.status(400).json({ error: 'Database configuration required' });
    }

    // Reject SQLite configurations
    if (config.type === 'sqlite') {
      return res.status(400).json({
        success: false,
        error: 'Unsupported database type: sqlite. SQLite is no longer supported. Please use PostgreSQL or Supabase. See README for setup instructions.'
      });
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

export default router;
