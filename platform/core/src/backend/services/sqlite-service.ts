/**
 * SQLite Database Service - Real database implementation
 */

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Logger } from '../utils/logger.js';

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  filePath?: string; // For SQLite
  storage?: {
    provider: 'supabase' | 'local' | 's3' | 'azure';
    tempDir?: string;
    localStorageDir?: string;
    supabase?: {
      url: string;
      serviceKey: string;
    };
    s3?: {
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
    };
    azure?: {
      connectionString: string;
      containerName: string;
    };
  };
}

export interface JobRecord {
  id?: number;
  title: string;
  company: string;
  location: string;
  status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  url?: string;
  notes?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  appliedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Related data (loaded via joins)
  files?: JobFileRecord[];
  statusHistory?: StatusHistoryRecord[];
}

export interface JobFileRecord {
  id: number;
  jobId: number;
  filename: string;
  originalName: string;
  fileSize?: number;
  mimeType?: string;
  filePath?: string;
  fileType?: string;
  uploadedAt: string;
}

export interface StatusHistoryRecord {
  id: number;
  jobId: number;
  status: string;
  changedAt: string;
  operator?: string;
  note?: string;
}


export class SQLiteService {
  private logger: Logger;
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private SQL: any = null;

  constructor(dbPath: string = './job_tracker.sqlite') {
    this.logger = new Logger('SQLiteService');
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing SQLite database service');

      // Initialize sql.js
      this.SQL = await initSqlJs();

      // Load existing database or create new one
      if (existsSync(this.dbPath)) {
        const filebuffer = readFileSync(this.dbPath);
        this.db = new this.SQL.Database(filebuffer);
        this.logger.info('Loaded existing SQLite database', { path: this.dbPath });
      } else {
        this.db = new this.SQL.Database();
        this.logger.info('Created new SQLite database', { path: this.dbPath });
      }

      // Create tables if they don't exist
      await this.createTables();

      // Save the database
      this.saveDatabase();

    } catch (error) {
      this.logger.error('Failed to initialize SQLite service', { error: error.message });
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'interested',
        url TEXT,
        notes TEXT,
        description TEXT,
        requirements TEXT,
        responsibilities TEXT,
        qualifications TEXT,
        applied_at TEXT,
        rejected_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createFilesTable = `
      CREATE TABLE IF NOT EXISTS job_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        file_path TEXT,
        file_type TEXT,
        uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
      )
    `;

    const createStatusHistoryTable = `
      CREATE TABLE IF NOT EXISTS job_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        changed_at TEXT NOT NULL,
        operator TEXT,
        note TEXT,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
      )
    `;

    const createStageTimestampsTable = `
      CREATE TABLE IF NOT EXISTS job_stage_timestamps (
        job_id INTEGER PRIMARY KEY,
        applied_at TEXT,
        screening_at TEXT,
        interview_at TEXT,
        offered_at TEXT,
        rejected_at TEXT,
        rejected_from TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
      )
    `;

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createConfigTable = `
      CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      this.db.run(createJobsTable);
      this.db.run(createFilesTable);
      this.db.run(createStatusHistoryTable);
      this.db.run(createStageTimestampsTable);
      this.db.run(createUsersTable);
      this.db.run(createConfigTable);

      this.logger.info('Database tables created successfully');
    } catch (error) {
      this.logger.error('Failed to create tables', { error: error.message });
      throw error;
    }
  }

  private saveDatabase(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      writeFileSync(this.dbPath, data);
      this.logger.debug('Database saved to disk', { path: this.dbPath });
    } catch (error) {
      this.logger.error('Failed to save database', { error: error.message });
    }
  }

  async testConnection(config: DatabaseConfig): Promise<{ connected: boolean; error?: string; tablesInitialized?: boolean }> {
    try {
      if (config.type === 'sqlite') {
        await this.initialize();
        return {
          connected: true,
          tablesInitialized: await this.checkTablesExist()
        };
      } else {
        // For other database types, we'd implement actual connection testing here
        return {
          connected: false,
          error: 'Only SQLite is currently supported in this demo'
        };
      }
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async checkTablesExist(): Promise<boolean> {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('jobs', 'job_files', 'users', 'config')");
      const tables = [];
      while (stmt.step()) {
        tables.push(stmt.getAsObject());
      }
      stmt.free();

      return tables.length === 4; // All 4 tables should exist
    } catch (error) {
      this.logger.error('Failed to check tables', { error: error.message });
      return false;
    }
  }

  async createJob(job: Omit<JobRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobRecord> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO jobs (title, company, location, status, url, notes, description, requirements, responsibilities, qualifications, applied_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run([
        job.title,
        job.company,
        job.location,
        job.status,
        job.url || null,
        job.notes || null,
        job.description || null,
        job.requirements || null,
        job.responsibilities || null,
        job.qualifications || null,
        job.appliedAt || null,
        now,
        now
      ]);

      const lastInsertId = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0] as number;

      this.saveDatabase();

      return {
        id: lastInsertId,
        ...job,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      this.logger.error('Failed to create job', { error: error.message });
      throw error;
    } finally {
      stmt.free();
    }
  }

  async getJobs(): Promise<JobRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare("SELECT * FROM jobs ORDER BY created_at DESC");
      const jobs: JobRecord[] = [];

      while (stmt.step()) {
        const row = stmt.getAsObject();
        const job: JobRecord = {
          id: row.id as number,
          title: row.title as string,
          company: row.company as string,
          location: row.location as string,
          status: row.status as JobRecord['status'],
          url: row.url as string,
          notes: row.notes as string,
          description: row.description as string,
          requirements: row.requirements as string,
          responsibilities: row.responsibilities as string,
          qualifications: row.qualifications as string,
          appliedAt: row.applied_at as string,
          rejectedAt: row.rejected_at as string,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string
        };

        // Load related data
        job.files = await this.getJobFiles(job.id!);
        job.statusHistory = await this.getJobStatusHistory(job.id!);

        jobs.push(job);
      }
      stmt.free();

      return jobs;
    } catch (error) {
      this.logger.error('Failed to get jobs', { error: error.message });
      throw error;
    }
  }

  async updateJob(id: number, updates: Partial<JobRecord>): Promise<JobRecord | null> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    // Get current job status for status change detection
    let currentStatus: string | null = null;
    if (updates.status) {
      const currentJobStmt = this.db.prepare("SELECT status FROM jobs WHERE id = ?");
      currentJobStmt.run([id]);
      if (currentJobStmt.step()) {
        const row = currentJobStmt.getAsObject();
        currentStatus = row.status as string;
      }
      currentJobStmt.free();
    }

    // Define valid fields that exist in SQLite table
    // For now, focus on basic fields that can be directly mapped
    const validFields = new Set(['title', 'company', 'location', 'status', 'notes', 'requirements', 'responsibilities', 'qualifications']);

    // Field mapping from frontend to database
    const fieldMapping: Record<string, string> = {
      'jobDescription': 'description',
      'jobUrl': 'url',
      'appliedAt': 'applied_at'
    };

    const setClause = Object.keys(updates)
      .filter(key => {
        // Skip internal fields
        if (['id', '_id', 'createdAt', 'updatedAt'].includes(key)) return false;
        // Skip fields that don't exist in database (like files, statusHistory)
        if (!validFields.has(key) && !fieldMapping[key]) return false;
        return true;
      })
      .map(key => {
        const dbColumn = fieldMapping[key] || key;
        return `${dbColumn} = ?`;
      })
      .join(', ');

    if (!setClause) throw new Error('No fields to update');

    const stmt = this.db.prepare(`
      UPDATE jobs SET ${setClause}, updated_at = ? WHERE id = ?
    `);

    try {
      const values = Object.entries(updates)
        .filter(([key]) => {
          // Use same filtering logic as setClause
          if (['id', '_id', 'createdAt', 'updatedAt'].includes(key)) return false;
          if (!validFields.has(key) && !fieldMapping[key]) return false;
          return true;
        })
        .map(([, value]) => value);

      values.push(now, id);

      stmt.run(values);
      this.saveDatabase();

      // Smart status history recording - only if status actually changed
      if (updates.status && currentStatus && updates.status !== currentStatus) {
        this.recordStatusChangeIfNeeded(id, currentStatus, updates.status);
      }

      // Return updated job with related data
      const getStmt = this.db.prepare("SELECT * FROM jobs WHERE id = ?");
      getStmt.run([id]);

      if (getStmt.step()) {
        const row = getStmt.getAsObject();
        getStmt.free();

        const updatedJob = {
          id: row.id as number,
          title: row.title as string,
          company: row.company as string,
          location: row.location as string,
          status: row.status as JobRecord['status'],
          url: row.url as string,
          notes: row.notes as string,
          description: row.description as string,
          requirements: row.requirements as string,
          responsibilities: row.responsibilities as string,
          qualifications: row.qualifications as string,
          appliedAt: row.applied_at as string,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string
        };

        // Update stage timestamps if status changed
        if (updates.status && currentStatus && updates.status !== currentStatus) {
          this.updateStageTimestamp(updatedJob.id, currentStatus, updates.status);
        }

        // Load related data
        (updatedJob as any).files = await this.getJobFiles(updatedJob.id);
        (updatedJob as any).statusHistory = await this.getJobStatusHistory(updatedJob.id);
        // Add progress data
        (updatedJob as any).progress = this.getJobProgress(updatedJob.id);

        return updatedJob;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to update job', { error: error.message });
      throw error;
    } finally {
      stmt.free();
    }
  }

  // Smart status history recording with frequency control
  private recordStatusChangeIfNeeded(
    jobId: number,
    fromStatus: string,
    toStatus: string,
    minIntervalMinutes: number = 5 // Default: don't record duplicate changes within 5 minutes
  ): void {
    if (!this.db) return;

    const now = new Date();
    const minTimeAgo = new Date(now.getTime() - minIntervalMinutes * 60 * 1000).toISOString();

    // Check if we have a recent identical status change
    const recentChangeStmt = this.db.prepare(`
      SELECT id, changed_at
      FROM job_status_history
      WHERE job_id = ? AND status = ? AND changed_at > ?
      ORDER BY changed_at DESC
      LIMIT 1
    `);

    recentChangeStmt.run([jobId, toStatus, minTimeAgo]);
    const hasRecentChange = recentChangeStmt.step();
    recentChangeStmt.free();

    if (hasRecentChange) {
      console.log(`Skipping duplicate status change to ${toStatus} within ${minIntervalMinutes} minutes for job ${jobId}`);
      return;
    }

    // Check the most recent status history entry
    const lastHistoryStmt = this.db.prepare(`
      SELECT status
      FROM job_status_history
      WHERE job_id = ?
      ORDER BY changed_at DESC
      LIMIT 1
    `);

    lastHistoryStmt.run([jobId]);
    let lastRecordedStatus: string | null = null;

    if (lastHistoryStmt.step()) {
      const row = lastHistoryStmt.getAsObject();
      lastRecordedStatus = row.status as string;
    }
    lastHistoryStmt.free();

    // Only record if the new status is different from the last recorded status
    if (lastRecordedStatus && lastRecordedStatus === toStatus) {
      console.log(`Skipping duplicate status recording: ${toStatus} already recorded for job ${jobId}`);
      return;
    }

    // Record the status change
    const insertStmt = this.db.prepare(`
      INSERT INTO job_status_history (
        job_id, status, changed_at, operator, note
      ) VALUES (?, ?, ?, ?, ?)
    `);

    try {
      insertStmt.run([
        jobId,
        toStatus,
        now.toISOString(),
        'User',
        `Status changed from ${fromStatus} to ${toStatus}`
      ]);

      console.log(`Status change recorded: ${fromStatus} → ${toStatus} for job ${jobId}`);
    } catch (error) {
      console.error('Failed to record status change:', error);
    } finally {
      insertStmt.free();
    }
  }

  async deleteJob(id: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare("DELETE FROM jobs WHERE id = ?");

    try {
      stmt.run([id]);
      this.saveDatabase();
      return true;
    } catch (error) {
      this.logger.error('Failed to delete job', { error: error.message });
      return false;
    } finally {
      stmt.free();
    }
  }

  async getStats(): Promise<Record<string, number>> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(`
        SELECT
          status,
          COUNT(*) as count
        FROM jobs
        GROUP BY status
      `);

      const stats: Record<string, number> = {
        total: 0,
        interested: 0,
        applied: 0,
        interviewing: 0,
        offered: 0,
        rejected: 0
      };

      while (stmt.step()) {
        const row = stmt.getAsObject();
        stats[row.status as string] = row.count as number;
        stats.total += row.count as number;
      }
      stmt.free();

      return stats;
    } catch (error) {
      this.logger.error('Failed to get stats', { error: error.message });
      throw error;
    }
  }

  async migrateJobs(jobs: any[]): Promise<{ imported: number; errors: string[] }> {
    let imported = 0
    const errors: string[] = []

    for (const job of jobs) {
      try {
        await this.createJob(job)
        imported++
      } catch (error: any) {
        errors.push(`Failed to import job "${job.title}": ${error.message}`)
      }
    }

    return { imported, errors }
  }

  async getJobFiles(jobId: number): Promise<JobFileRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare("SELECT * FROM job_files WHERE job_id = ?");
      const files: JobFileRecord[] = [];

      stmt.run([jobId]);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        files.push({
          id: row.id as number,
          jobId: row.job_id as number,
          filename: row.filename as string,
          originalName: row.original_name as string,
          fileSize: row.file_size as number,
          mimeType: row.mime_type as string,
          filePath: row.file_path as string,
          fileType: row.file_type as string,
          uploadedAt: row.uploaded_at as string
        });
      }
      stmt.free();

      return files;
    } catch (error) {
      this.logger.error('Failed to get job files', { error: error.message });
      return [];
    }
  }

  async getJobStatusHistory(jobId: number): Promise<StatusHistoryRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare("SELECT * FROM job_status_history WHERE job_id = ? ORDER BY changed_at DESC");
      const history: StatusHistoryRecord[] = [];

      stmt.run([jobId]);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        history.push({
          id: row.id as number,
          jobId: row.job_id as number,
          status: row.status as string,
          changedAt: row.changed_at as string,
          operator: row.operator as string,
          note: row.note as string
        });
      }
      stmt.free();

      return history;
    } catch (error) {
      this.logger.error('Failed to get job status history', { error: error.message });
      return [];
    }
  }


  async addJobFile(fileData: any): Promise<JobFileRecord> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(`
        INSERT INTO job_files (
          job_id, filename, original_name, file_size, mime_type,
          file_path, file_type, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        fileData.jobId,
        fileData.filename,
        fileData.originalName,
        fileData.fileSize,
        fileData.mimeType,
        fileData.filePath,
        fileData.fileType,
        fileData.uploadedAt
      ]);

      const insertId = this.db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      stmt.free();

      // Return the created file record
      return {
        id: insertId,
        jobId: fileData.jobId,
        filename: fileData.filename,
        originalName: fileData.originalName,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        filePath: fileData.filePath,
        fileType: fileData.fileType,
        uploadedAt: fileData.uploadedAt
      };
    } catch (error) {
      this.logger.error('Failed to add job file', { error: error.message });
      throw error;
    }
  }

  async getJobFile(fileId: number): Promise<JobFileRecord | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare("SELECT * FROM job_files WHERE id = ?");
      stmt.run([fileId]);

      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          id: row.id as number,
          jobId: row.job_id as number,
          filename: row.filename as string,
          originalName: row.original_name as string,
          fileSize: row.file_size as number,
          mimeType: row.mime_type as string,
          filePath: row.file_path as string,
          fileType: row.file_type as string,
          uploadedAt: row.uploaded_at as string
        };
      }

      stmt.free();
      return null;
    } catch (error) {
      this.logger.error('Failed to get job file', { error: error.message });
      return null;
    }
  }

  async deleteJobFile(fileId: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare("DELETE FROM job_files WHERE id = ?");
      stmt.run([fileId]);
      const changes = this.db.getRowsModified();
      stmt.free();

      return changes > 0;
    } catch (error) {
      this.logger.error('Failed to delete job file', { error: error.message });
      return false;
    }
  }

  // Status History operations
  async addStatusHistory(historyEntry: any): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(`
        INSERT INTO job_status_history (
          job_id, status, changed_at, operator, note
        ) VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([
        historyEntry.jobId,
        historyEntry.status,
        historyEntry.changedAt,
        historyEntry.operator,
        historyEntry.note
      ]);

      const insertId = this.db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      stmt.free();

      // Return the created status history record
      return {
        id: insertId,
        jobId: historyEntry.jobId,
        status: historyEntry.status,
        changedAt: historyEntry.changedAt,
        operator: historyEntry.operator,
        note: historyEntry.note
      };
    } catch (error) {
      this.logger.error('Failed to add status history', { error: error.message });
      throw error;
    }
  }

  async getStatusHistory(jobId: number): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare("SELECT * FROM job_status_history WHERE job_id = ? ORDER BY changed_at DESC");
      const history: any[] = [];

      stmt.run([jobId]);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        history.push({
          id: row.id as number,
          jobId: row.job_id as number,
          status: row.status as string,
          changedAt: row.changed_at as string,
          operator: row.operator as string,
          note: row.note as string
        });
      }
      stmt.free();

      return history;
    } catch (error) {
      this.logger.error('Failed to get status history', { error: error.message });
      return [];
    }
  }

  async deleteStatusHistory(historyId: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare("DELETE FROM job_status_history WHERE id = ?");
      stmt.run([historyId]);
      const changes = this.db.getRowsModified();
      stmt.free();

      this.saveDatabase();
      return changes > 0;
    } catch (error) {
      this.logger.error('Failed to delete status history', { error: error.message });
      return false;
    }
  }

  // Stage Timestamps operations
  getStageTimestamps(jobId: number): any {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare("SELECT * FROM job_stage_timestamps WHERE job_id = ?");
      stmt.run([jobId]);

      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          job_id: row.job_id,
          applied_at: row.applied_at,
          screening_at: row.screening_at,
          interview_at: row.interview_at,
          offered_at: row.offered_at,
          rejected_at: row.rejected_at,
          rejected_from: row.rejected_from
        };
      } else {
        stmt.free();
        return {
          job_id: jobId,
          applied_at: null,
          screening_at: null,
          interview_at: null,
          offered_at: null,
          rejected_at: null,
          rejected_from: null
        };
      }
    } catch (error) {
      this.logger.error('Failed to get stage timestamps', { error: error.message });
      return {
        job_id: jobId,
        applied_at: null,
        screening_at: null,
        interview_at: null,
        offered_at: null,
        rejected_at: null,
        rejected_from: null
      };
    }
  }

  updateStageTimestamp(jobId: number, currentStatus: string, newStatus: string): void {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const timestamps = this.getStageTimestamps(jobId);
      const now = new Date().toISOString();

      // Prepare update fields
      let updateParts: string[] = [];
      let values: any[] = [];

      // Only set timestamp if it's the first time reaching this stage
      if (newStatus === 'applied' && !timestamps.applied_at) {
        updateParts.push('applied_at = ?');
        values.push(now);
      } else if (newStatus === 'screening' && !timestamps.screening_at) {
        updateParts.push('screening_at = ?');
        values.push(now);
      } else if (newStatus === 'interview' && !timestamps.interview_at) {
        updateParts.push('interview_at = ?');
        values.push(now);
      } else if (newStatus === 'offered' && !timestamps.offered_at) {
        updateParts.push('offered_at = ?', 'rejected_at = NULL', 'rejected_from = NULL');
        values.push(now);
      } else if (newStatus === 'rejected') {
        updateParts.push('rejected_at = ?', 'rejected_from = ?', 'offered_at = NULL');
        values.push(now, currentStatus);
      }

      // Always update the updated_at timestamp
      updateParts.push('updated_at = ?');
      values.push(now);

      if (updateParts.length > 1) { // More than just updated_at
        // Try insert first, then update if exists
        try {
          const insertStmt = this.db.prepare(`
            INSERT INTO job_stage_timestamps (job_id, ${updateParts.join(', ')})
            VALUES (?, ${updateParts.map(() => '?').join(', ')})
          `);
          insertStmt.run([jobId, ...values]);
          insertStmt.free();
        } catch (insertError) {
          // If insert fails, do update
          const updateStmt = this.db.prepare(`
            UPDATE job_stage_timestamps SET ${updateParts.join(', ')} WHERE job_id = ?
          `);
          updateStmt.run([...values, jobId]);
          updateStmt.free();
        }
      }

      this.saveDatabase();
    } catch (error) {
      this.logger.error('Failed to update stage timestamp', { error: error.message });
    }
  }

  getJobProgress(jobId: number): Array<{stage: string, at: string}> {
    const timestamps = this.getStageTimestamps(jobId);
    const progress: Array<{stage: string, at: string}> = [];

    if (timestamps.applied_at) {
      progress.push({stage: 'applied', at: timestamps.applied_at});
    }
    if (timestamps.screening_at) {
      progress.push({stage: 'screening', at: timestamps.screening_at});
    }
    if (timestamps.interview_at) {
      progress.push({stage: 'interview', at: timestamps.interview_at});
    }
    if (timestamps.offered_at) {
      progress.push({stage: 'offered', at: timestamps.offered_at});
    } else if (timestamps.rejected_at) {
      progress.push({stage: 'rejected', at: timestamps.rejected_at});
    }

    return progress;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      this.db = null;
      this.logger.info('Database connection closed');
    }
  }
}