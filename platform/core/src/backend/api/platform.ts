/**
 * Platform Information Routes
 */

import { Router, Request, Response } from 'express';

const router = Router();

router.get('/api/platform/info', (req: Request, res: Response) => {
  res.json({
    name: 'Modular Job Tracker Platform',
    version: '1.0.0',
    description: 'Extensible platform for building modular job tracking applications',
    features: [
      'Module System',
      'Data Service',
      'Event Bus',
      'Authentication',
      'Storage'
    ],
    status: 'running',
    modules: {
      count: 0,
      enabled: 0
    }
  });
});

export default router;
