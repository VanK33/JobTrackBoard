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
  createdAt: string;
  updatedAt: string;
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
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        jobs.push({
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
        });
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
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'createdAt')
      .map(key => `${key === 'appliedAt' ? 'applied_at' : key} = ?`)
      .join(', ');

    if (!setClause) throw new Error('No fields to update');

    const stmt = this.db.prepare(`
      UPDATE jobs SET ${setClause}, updated_at = ? WHERE id = ?
    `);

    try {
      const values = Object.entries(updates)
        .filter(([key]) => key !== 'id' && key !== 'createdAt')
        .map(([, value]) => value);

      values.push(now, id);

      stmt.run(values);
      this.saveDatabase();

      // Return updated job
      const getStmt = this.db.prepare("SELECT * FROM jobs WHERE id = ?");
      getStmt.run([id]);

      if (getStmt.step()) {
        const row = getStmt.getAsObject();
        getStmt.free();
        return {
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
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to update job', { error: error.message });
      throw error;
    } finally {
      stmt.free();
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

  async close(): Promise<void> {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      this.db = null;
      this.logger.info('Database connection closed');
    }
  }
}