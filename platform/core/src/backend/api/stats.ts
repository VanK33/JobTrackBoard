/**
 * Statistics Routes
 */

import { Router, Request, Response } from 'express';
import { Logger } from '../utils/logger.js';
import { ConnectionPoolManager } from '../database/connection-pool-manager.js';
import { requireDatabaseConfig } from '../middleware/database-config.js';

const router = Router();
const logger = new Logger('StatsAPI');

router.get('/api/stats/overview', requireDatabaseConfig, async (req: Request, res: Response) => {
  try {
    const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
    const stats = await dbService.getStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Failed to get stats', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

export default router;
