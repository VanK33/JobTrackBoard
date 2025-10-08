/**
 * Job Tracker Basic Module - Backend Implementation
 * Demonstrates how a module integrates with the platform
 */

import {
  ModuleBackend,
  ModuleContext,
  ModuleRouter,
  EventBus,
  DataService,
  Logger
} from '../../../../shared/types/src/index.js';

// Job-related types
interface JobFile {
  id: string;
  name: string;
  type: 'resume' | 'cover-letter' | 'portfolio' | 'job-description' | 'other';
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  jobDescription?: string; // Full job description text
  requirements?: string[];
  responsibilities?: string[]; // Job responsibilities
  qualifications?: string[]; // Required qualifications
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'declined';
  applicationDate?: string;
  jobUrl?: string; // Original job posting URL
  notes?: string;
  contacts?: Contact[];
  timeline?: TimelineEvent[];
  files?: JobFile[]; // Attached files (PDFs, documents)
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
}

interface TimelineEvent {
  id: string;
  type: 'application' | 'phone-screen' | 'interview' | 'follow-up' | 'decision' | 'other';
  title: string;
  description?: string;
  date: string;
  completed: boolean;
}

interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
  culture?: string;
  notes?: string;
  contacts?: Contact[];
  createdAt: string;
  updatedAt: string;
}

export default class JobTrackerBasicModule implements ModuleBackend {
  public readonly name = 'job-tracker-basic';
  private context!: ModuleContext;
  private dataService!: DataService;
  private eventBus!: EventBus;
  private logger!: Logger;

  async initialize(context: ModuleContext): Promise<void> {
    this.context = context;
    this.dataService = context.dataService;
    this.eventBus = context.eventBus;
    this.logger = context.logger;

    this.logger.info('Initializing Job Tracker Basic module');

    // Initialize data schemas
    await this.setupDataSchemas();

    this.logger.info('Job Tracker Basic module initialized successfully');
  }

  registerRoutes(router: ModuleRouter): void {
    this.logger.info('Registering Job Tracker routes');

    // Job routes
    router.get('/jobs', this.getJobs.bind(this));
    router.get('/jobs/:id', this.getJob.bind(this));
    router.post('/jobs', this.createJob.bind(this));
    router.put('/jobs/:id', this.updateJob.bind(this));
    router.delete('/jobs/:id', this.deleteJob.bind(this));
    router.patch('/jobs/:id/status', this.updateJobStatus.bind(this));

    // File management routes
    router.post('/jobs/:id/files', this.uploadJobFile.bind(this));
    router.get('/jobs/:id/files', this.getJobFiles.bind(this));
    router.delete('/jobs/:id/files/:fileId', this.deleteJobFile.bind(this));

    // Company routes
    router.get('/companies', this.getCompanies.bind(this));
    router.get('/companies/:id', this.getCompany.bind(this));
    router.post('/companies', this.createCompany.bind(this));
    router.put('/companies/:id', this.updateCompany.bind(this));
    router.delete('/companies/:id', this.deleteCompany.bind(this));

    // Statistics routes
    router.get('/stats/overview', this.getOverviewStats.bind(this));
    router.get('/stats/timeline', this.getTimelineStats.bind(this));

    this.logger.info('Job Tracker routes registered successfully');
  }

  registerEventHandlers(eventBus: EventBus): void {
    this.logger.info('Registering Job Tracker event handlers');

    // Listen for user preference changes
    eventBus.subscribe('user.preferences.changed', async (data, metadata) => {
      this.logger.debug('User preferences changed', { data, metadata });
      // Handle preference changes if needed
    });

    this.logger.info('Job Tracker event handlers registered successfully');
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Job Tracker Basic module');
    // Cleanup if needed
  }

  // Private methods for data setup
  private async setupDataSchemas(): Promise<void> {
    // In a real implementation, you might set up database schemas
    // For now, we'll just log that we're setting them up
    this.logger.debug('Setting up data schemas for Job Tracker');
  }

  // Job CRUD operations
  private async getJobs(req: any, res: any): Promise<void> {
    try {
      const { status, company, type, search, limit = 50, offset = 0 } = req.query;
      
      const filter: any = {};
      
      if (status) filter.status = status;
      if (company) filter.company = { $regex: company, $options: 'i' };
      if (type) filter.type = type;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const jobs = await this.dataService.find(
        this.name,
        'job',
        {
          where: filter,
          limit: parseInt(limit),
          offset: parseInt(offset),
          sort: { updatedAt: 'desc' }
        }
      );

      res.json({
        success: true,
        data: jobs.map(entity => entity.data),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: jobs.length // In real implementation, get actual count
        }
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get jobs', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async getJob(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      
      const job = await this.dataService.findById(this.name, 'job', id);
      
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      res.json({
        success: true,
        data: job.data
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get job', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async createJob(req: any, res: any): Promise<void> {
    try {
      const jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = req.body;
      
      // Validate required fields
      if (!jobData.title || !jobData.company) {
        return res.status(400).json({ 
          success: false, 
          error: 'Title and company are required' 
        });
      }

      const now = new Date().toISOString();
      const job: Job = {
        id: this.generateId(),
        ...jobData,
        status: jobData.status || 'interested',
        type: jobData.type || 'full-time',
        remote: jobData.remote ?? false,
        source: jobData.source || 'manual',
        timeline: jobData.timeline || [],
        contacts: jobData.contacts || [],
        createdAt: now,
        updatedAt: now
      };

      const entity = await this.dataService.create(this.name, 'job', job);

      // Publish event
      await this.eventBus.publish('job.created', {
        jobId: job.id,
        job: job,
        timestamp: now
      });

      this.logger.info('Job created', { jobId: job.id, title: job.title });

      res.status(201).json({
        success: true,
        data: job
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to create job', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async updateJob(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingJob = await this.dataService.findById(this.name, 'job', id);
      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      const updatedJob = {
        ...existingJob.data,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      };

      await this.dataService.update(this.name, 'job', id, updatedJob);

      // Publish event
      await this.eventBus.publish('job.updated', {
        jobId: id,
        previousJob: existingJob.data,
        updatedJob: updatedJob,
        timestamp: updatedJob.updatedAt
      });

      this.logger.info('Job updated', { jobId: id });

      res.json({
        success: true,
        data: updatedJob
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to update job', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async deleteJob(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;

      const existingJob = await this.dataService.findById(this.name, 'job', id);
      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      await this.dataService.delete(this.name, 'job', id);

      // Publish event
      await this.eventBus.publish('job.deleted', {
        jobId: id,
        job: existingJob.data,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job deleted', { jobId: id });

      res.json({
        success: true,
        message: 'Job deleted successfully'
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete job', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async updateJobStatus(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Status is required' 
        });
      }

      const existingJob = await this.dataService.findById(this.name, 'job', id);
      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      const previousStatus = existingJob.data.status;
      const now = new Date().toISOString();

      const updatedJob = {
        ...existingJob.data,
        status,
        updatedAt: now
      };

      // Add timeline event for status change
      if (status !== previousStatus) {
        updatedJob.timeline = updatedJob.timeline || [];
        updatedJob.timeline.push({
          id: this.generateId(),
          type: 'decision',
          title: `Status changed to ${status}`,
          description: notes || `Status updated from ${previousStatus} to ${status}`,
          date: now,
          completed: true
        });

        // Set application date if status is 'applied'
        if (status === 'applied' && !updatedJob.applicationDate) {
          updatedJob.applicationDate = now;
        }
      }

      await this.dataService.update(this.name, 'job', id, updatedJob);

      // Publish event
      await this.eventBus.publish('job.status.changed', {
        jobId: id,
        previousStatus,
        newStatus: status,
        job: updatedJob,
        timestamp: now
      });

      this.logger.info('Job status updated', { 
        jobId: id, 
        previousStatus, 
        newStatus: status 
      });

      res.json({
        success: true,
        data: updatedJob
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to update job status', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  // Company CRUD operations (simplified for now)
  private async getCompanies(req: any, res: any): Promise<void> {
    try {
      const companies = await this.dataService.find(this.name, 'company', {});
      
      res.json({
        success: true,
        data: companies.map(entity => entity.data)
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get companies', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async getCompany(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      
      const company = await this.dataService.findById(this.name, 'company', id);
      
      if (!company) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }

      res.json({
        success: true,
        data: company.data
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get company', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async createCompany(req: any, res: any): Promise<void> {
    try {
      const companyData = req.body;
      
      if (!companyData.name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Company name is required' 
        });
      }

      const now = new Date().toISOString();
      const company: Company = {
        id: this.generateId(),
        ...companyData,
        contacts: companyData.contacts || [],
        createdAt: now,
        updatedAt: now
      };

      await this.dataService.create(this.name, 'company', company);

      this.logger.info('Company created', { companyId: company.id, name: company.name });

      res.status(201).json({
        success: true,
        data: company
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to create company', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async updateCompany(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingCompany = await this.dataService.findById(this.name, 'company', id);
      if (!existingCompany) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }

      const updatedCompany = {
        ...existingCompany.data,
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      };

      await this.dataService.update(this.name, 'company', id, updatedCompany);

      this.logger.info('Company updated', { companyId: id });

      res.json({
        success: true,
        data: updatedCompany
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to update company', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async deleteCompany(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;

      await this.dataService.delete(this.name, 'company', id);

      this.logger.info('Company deleted', { companyId: id });

      res.json({
        success: true,
        message: 'Company deleted successfully'
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete company', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  // Statistics endpoints
  private async getOverviewStats(req: any, res: any): Promise<void> {
    try {
      const jobs = await this.dataService.find(this.name, 'job', {});
      const jobData = jobs.map(entity => entity.data);

      const stats = {
        total: jobData.length,
        byStatus: this.groupBy(jobData, 'status'),
        byType: this.groupBy(jobData, 'type'),
        recent: jobData
          .filter(job => {
            const createdDate = new Date(job.createdAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return createdDate > weekAgo;
          }).length,
        applied: jobData.filter(job => job.applicationDate).length
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get overview stats', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async getTimelineStats(req: any, res: any): Promise<void> {
    try {
      const jobs = await this.dataService.find(this.name, 'job', {});
      const jobData = jobs.map(entity => entity.data);

      // Group applications by week
      const applicationsByWeek: Record<string, number> = {};
      jobData.forEach(job => {
        if (job.applicationDate) {
          const week = this.getWeekKey(new Date(job.applicationDate));
          applicationsByWeek[week] = (applicationsByWeek[week] || 0) + 1;
        }
      });

      res.json({
        success: true,
        data: {
          applicationsByWeek,
          statusChanges: [] // Could implement status change tracking
        }
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get timeline stats', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  // File management methods
  private async uploadJobFile(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const { fileName, fileType, mimeType, fileData } = req.body;

      // Validate job exists
      const existingJob = await this.dataService.findById(this.name, 'job', id);
      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      // Create file record
      const file: JobFile = {
        id: this.generateId(),
        name: fileName,
        type: fileType,
        mimeType,
        size: Buffer.byteLength(fileData, 'base64'),
        url: `files/${this.name}/${id}/${this.generateId()}-${fileName}`,
        uploadedAt: new Date().toISOString()
      };

      // In a real implementation, you would save to storage service
      // For now, we'll just store the file info
      const updatedJob = {
        ...existingJob.data,
        files: [...(existingJob.data.files || []), file],
        updatedAt: new Date().toISOString()
      };

      await this.dataService.update(this.name, 'job', id, updatedJob);

      this.logger.info('File uploaded for job', { jobId: id, fileName });

      res.status(201).json({
        success: true,
        data: file
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to upload file', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async getJobFiles(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;

      const job = await this.dataService.findById(this.name, 'job', id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      res.json({
        success: true,
        data: job.data.files || []
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get job files', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }

  private async deleteJobFile(req: any, res: any): Promise<void> {
    try {
      const { id, fileId } = req.params;

      const existingJob = await this.dataService.findById(this.name, 'job', id);
      if (!existingJob) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      const updatedFiles = (existingJob.data.files || []).filter(
        (file: JobFile) => file.id !== fileId
      );

      const updatedJob = {
        ...existingJob.data,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      };

      await this.dataService.update(this.name, 'job', id, updatedJob);

      this.logger.info('File deleted from job', { jobId: id, fileId });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete file', { error: message });
      res.status(500).json({ success: false, error: message });
    }
  }
}