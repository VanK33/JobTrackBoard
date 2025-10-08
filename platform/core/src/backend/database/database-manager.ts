import { DatabaseConfig } from './sqlite-service'
import { SQLiteService } from './sqlite-service'
import { PostgreSQLService } from './postgresql-service'
import { supabaseStorage } from './supabase-client.js'
import { jobRecordToJob, jobToJobRecord, partialJobToJobRecord } from './type-mappers.js'

interface Job {
  _id?: string
  id?: number | string
  title: string
  company: string
  location: string
  status: string
  jobDescription?: string
  notes?: string
  jobUrl?: string
  appliedAt?: string
  createdAt?: string
  updatedAt?: string
  requirements?: string[]
  responsibilities?: string[]
  qualifications?: string[]
  files?: any[]
  statusHistory?: any[]
}

export class DatabaseManager {
  private currentService: SQLiteService | PostgreSQLService | null = null
  private currentConfig: DatabaseConfig | null = null

  async setDatabaseConfig(config: DatabaseConfig): Promise<void> {
    // Disconnect current service if exists
    if (this.currentService) {
      if (this.currentService instanceof PostgreSQLService) {
        await this.currentService.disconnect()
      }
    }

    this.currentConfig = config

    // Determine database type - prioritize connection string over type field
    let databaseType = config.type
    if (config.connectionString) {
      // Auto-detect database type from connection string
      const connectionStr = config.connectionString.toLowerCase()
      if (connectionStr.startsWith('postgresql://') || connectionStr.startsWith('postgres://')) {
        databaseType = 'postgresql'
      } else if (connectionStr.startsWith('mysql://')) {
        databaseType = 'mysql'
      } else if (connectionStr.startsWith('mongodb://') || connectionStr.startsWith('mongodb+srv://')) {
        databaseType = 'mongodb'
      }
    }

    // Create appropriate service based on detected database type
    if (databaseType === 'postgresql') {
      this.currentService = new PostgreSQLService()
      if (config.connectionString) {
        await this.currentService.connectWithConnectionString(config.connectionString)
      } else {
        await this.currentService.connect(config)
      }
    } else if (databaseType === 'sqlite') {
      this.currentService = new SQLiteService()
      await this.currentService.initialize()
    } else {
      throw new Error(`Unsupported database type: ${databaseType}`)
    }
  }

  async testConnection(config: DatabaseConfig): Promise<{ connected: boolean; error?: string; tablesInitialized?: boolean }> {
    try {
      // Determine database type - prioritize connection string over type field
      let databaseType = config.type
      if (config.connectionString) {
        // Auto-detect database type from connection string
        const connectionStr = config.connectionString.toLowerCase()
        if (connectionStr.startsWith('postgresql://') || connectionStr.startsWith('postgres://')) {
          databaseType = 'postgresql'
        } else if (connectionStr.startsWith('mysql://')) {
          databaseType = 'mysql'
        } else if (connectionStr.startsWith('mongodb://') || connectionStr.startsWith('mongodb+srv://')) {
          databaseType = 'mongodb'
        }
      }

      if (databaseType === 'postgresql') {
        const pgService = new PostgreSQLService()
        const result = await pgService.testConnection(config)
        await pgService.disconnect()
        return result
      } else if (databaseType === 'sqlite') {
        const sqliteService = new SQLiteService()
        return await sqliteService.testConnection(config)
      } else {
        return {
          connected: false,
          error: `Unsupported database type: ${databaseType}`
        }
      }
    } catch (error: any) {
      return {
        connected: false,
        error: error.message
      }
    }
  }

  async initialize(config?: DatabaseConfig): Promise<void> {
    if (config) {
      await this.setDatabaseConfig(config)
    }

    if (!this.currentService) {
      throw new Error('No database service configured')
    }

    await this.currentService.initialize()
  }

  async getJobs(): Promise<Job[]> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }
    const records = await this.currentService.getJobs()
    return records.map(jobRecordToJob)
  }

  async createJob(job: Omit<Job, 'id'>): Promise<Job> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }
    const jobRecord = jobToJobRecord(job as Omit<Job, 'id' | 'createdAt' | 'updatedAt'>)
    const created = await this.currentService.createJob(jobRecord as any) // Type assertion due to service signature mismatch
    return jobRecordToJob(created as any)
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }

    const recordUpdates = partialJobToJobRecord(updates)

    if (this.currentService instanceof PostgreSQLService) {
      const updated = await this.currentService.updateJob(id, recordUpdates)
      return updated ? jobRecordToJob(updated) : updates as Job
    } else {
      // SQLite expects number ID
      const numericId = parseInt(id)
      const updated = await this.currentService.updateJob(numericId, recordUpdates)
      return updated ? jobRecordToJob(updated) : updates as Job
    }
  }

  async deleteJob(id: string | number): Promise<boolean> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }

    try {
      // Get all files associated with this job before deletion
      const numericId = typeof id === 'string' ? parseInt(id) : id
      const jobFiles = await this.getJobFiles(numericId)

      // Delete all files from Supabase bucket
      for (const file of jobFiles) {
        if (file.supabasePath) {
          try {
            await supabaseStorage.deleteFile(file.supabasePath)
          } catch (error) {
            console.warn(`Failed to delete file from bucket: ${file.supabasePath}`, error)
          }
        }
      }

      // Delete job from database (this will cascade delete job_files due to foreign key)
      if (this.currentService instanceof PostgreSQLService) {
        await this.currentService.deleteJob(id.toString())
      } else {
        await this.currentService.deleteJob(numericId)
      }

      return true
    } catch (error) {
      console.error('Failed to delete job:', error)
      throw error
    }
  }

  async migrateJobs(jobs: Job[]): Promise<{ imported: number; errors: string[] }> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }
    const jobRecords = jobs.map(job => jobToJobRecord(job as any))
    return await this.currentService.migrateJobs(jobRecords as any)
  }

  // File operations
  async addJobFile(fileData: any): Promise<any> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }

    if (this.currentService instanceof PostgreSQLService) {
      return await this.currentService.addJobFile(fileData)
    } else {
      return await this.currentService.addJobFile(fileData)
    }
  }

  async getJobFile(fileId: number): Promise<any> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }

    if (this.currentService instanceof PostgreSQLService) {
      return await this.currentService.getJobFile(fileId)
    } else {
      return await this.currentService.getJobFile(fileId)
    }
  }

  async deleteJobFile(fileId: number): Promise<boolean> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }

    try {
      // Get file info before deletion to get supabasePath
      const fileInfo = await this.getJobFile(fileId)

      if (!fileInfo) {
        console.warn('File not found in database:', fileId)
        return false
      }

      // Delete from Supabase bucket if supabasePath exists
      if (fileInfo.supabasePath) {
        try {
          await supabaseStorage.deleteFile(fileInfo.supabasePath)
        } catch (error) {
          console.warn(`Failed to delete file from bucket: ${fileInfo.supabasePath}`, error)
        }
      }

      // Delete from database
      if (this.currentService instanceof PostgreSQLService) {
        return await this.currentService.deleteJobFile(fileId)
      } else {
        return await this.currentService.deleteJobFile(fileId)
      }
    } catch (error) {
      console.error('Failed to delete job file:', error)
      throw error
    }
  }

  async getJobFiles(jobId: number): Promise<any[]> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }

    if (this.currentService instanceof PostgreSQLService) {
      return await this.currentService.getJobFiles(jobId)
    } else {
      return await this.currentService.getJobFiles(jobId)
    }
  }

  getCurrentConfig(): DatabaseConfig | null {
    return this.currentConfig
  }

  getDatabaseType(): string | null {
    if (!this.currentConfig) return null

    // Return the actual resolved database type, considering connection string
    if (this.currentConfig.connectionString) {
      const connectionStr = this.currentConfig.connectionString.toLowerCase()
      if (connectionStr.startsWith('postgresql://') || connectionStr.startsWith('postgres://')) {
        return 'postgresql'
      } else if (connectionStr.startsWith('mysql://')) {
        return 'mysql'
      } else if (connectionStr.startsWith('mongodb://') || connectionStr.startsWith('mongodb+srv://')) {
        return 'mongodb'
      }
    }

    return this.currentConfig.type || null
  }

  async getStats(): Promise<any> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }

    const jobs = await this.getJobs()
    return {
      total: jobs.length,
      interested: jobs.filter(j => j.status === 'interested').length,
      applied: jobs.filter(j => j.status === 'applied').length,
      interviewing: jobs.filter(j => j.status === 'interviewing').length,
      offered: jobs.filter(j => j.status === 'offered').length,
      rejected: jobs.filter(j => j.status === 'rejected').length,
    }
  }

  // Status History operations
  async addStatusHistory(historyEntry: any): Promise<any> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }
    return await this.currentService.addStatusHistory(historyEntry)
  }

  async getStatusHistory(jobId: number): Promise<any[]> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }
    return await this.currentService.getStatusHistory(jobId)
  }

  async deleteStatusHistory(historyId: number): Promise<boolean> {
    if (!this.currentService) {
      throw new Error('No database service configured')
    }
    return await this.currentService.deleteStatusHistory(historyId)
  }

  async close(): Promise<void> {
    await this.disconnect()
  }

  async disconnect(): Promise<void> {
    if (this.currentService && this.currentService instanceof PostgreSQLService) {
      await this.currentService.disconnect()
    }
    this.currentService = null
    this.currentConfig = null
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager()