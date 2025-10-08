/**
 * Job Management Routes
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Logger } from '../utils/logger.js';
import { PATHS } from '../../shared/config/paths.js';
import { DataMapper } from '../database/data-mapper.js';
import { ConnectionPoolManager } from '../database/connection-pool-manager.js';
import { requireDatabaseConfig } from '../middleware/database-config.js';
import { StorageManager } from '../services/storage-manager.js';

const router = Router();
const logger = new Logger('JobsAPI');

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, PATHS.TEMP_UPLOADS);
    },
    filename: (req, file, cb) => {
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

// Initialize storage manager (will be injected via middleware)
let storageManager: StorageManager;

export function setStorageManager(manager: StorageManager) {
  storageManager = manager;
}

// Get all jobs
router.get('/api/jobs', requireDatabaseConfig, async (req: Request, res: Response) => {
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

// Create new job
router.post('/api/jobs', requireDatabaseConfig, async (req: Request, res: Response) => {
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

// Get job by ID
router.get('/api/jobs/:id', requireDatabaseConfig, async (req: Request, res: Response) => {
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

// Update job
router.put('/api/jobs/:id', requireDatabaseConfig, async (req: Request, res: Response) => {
  try {
    const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
    const jobId = parseInt(req.params.id);
    const frontendUpdates = req.body;

    // Convert frontend updates to backend format
    const backendUpdates = DataMapper.frontendToBackend(frontendUpdates);

    const updatedJob = await dbService.updateJob(jobId, backendUpdates);

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

// Delete job
router.delete('/api/jobs/:id', requireDatabaseConfig, async (req: Request, res: Response) => {
  try {
    const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
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

// Upload file for job
router.post('/api/jobs/:id/files', requireDatabaseConfig, upload.single('file'), async (req: Request, res: Response) => {
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

// Delete file for job
router.delete('/api/jobs/:id/files/:fileId', requireDatabaseConfig, async (req: Request, res: Response) => {
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

// Update job status
router.patch('/api/jobs/:id/status', requireDatabaseConfig, async (req: Request, res: Response) => {
  try {
    const dbService = await ConnectionPoolManager.getConnection(req.dbConfig!);
    const jobId = parseInt(req.params.id);
    const { status } = req.body;

    const updatedJob = await dbService.updateJob(String(jobId), { status });

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

// Get status history for job
router.get('/api/jobs/:id/status-history', requireDatabaseConfig, async (req: Request, res: Response) => {
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

// Delete status history entry
router.delete('/api/jobs/:id/status-history/:historyId', requireDatabaseConfig, async (req: Request, res: Response) => {
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

// Data migration endpoint
router.post('/api/data/migrate', requireDatabaseConfig, async (req: Request, res: Response) => {
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

export default router;
