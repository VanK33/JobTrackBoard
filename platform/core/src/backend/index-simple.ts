/**
 * Simplified entry point for demo purposes - works without database
 */

import express from 'express';
import cors from 'cors';
import { Logger } from './utils/logger.js';

const logger = new Logger('SimpleServer');

async function startSimpleServer(): Promise<void> {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'demo_mode',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Platform info endpoint
  app.get('/api/platform/info', (req, res) => {
    res.json({
      platform: {
        version: '1.0.0',
        status: 'running',
        initialized: true
      },
      enabledModules: [
        {
          id: 'job-tracker-basic',
          name: 'job-tracker-basic',
          displayName: '基础求职追踪器',
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
        displayName: '基础求职追踪器',
        description: '完整的求职申请管理系统，支持工作状态追踪、公司管理、时间线记录和统计分析',
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

  // Job Tracker API endpoints (mock data)
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

  // Start server
  const port = 3000;
  const server = app.listen(port, () => {
    logger.info('Simple demo server started', { port });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });
}

startSimpleServer().catch((error: Error) => {
  logger.error('Failed to start simple server', { error: error.message });
  process.exit(1);
});