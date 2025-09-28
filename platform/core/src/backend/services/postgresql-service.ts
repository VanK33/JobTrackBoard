import { Pool, PoolClient } from 'pg'
import { DatabaseConfig, JobRecord } from './sqlite-service'

// Use JobRecord as the standard backend interface
type Job = JobRecord

export class PostgreSQLService {
  private pool: Pool | null = null
  private config: DatabaseConfig | null = null

  async connect(config: DatabaseConfig): Promise<void> {
    this.config = config

    // Create connection pool
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    // Test the connection
    const client = await this.pool.connect()
    await client.query('SELECT NOW()')
    client.release()
  }

  async connectWithConnectionString(connectionString: string): Promise<void> {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    // Test the connection
    const client = await this.pool.connect()
    await client.query('SELECT NOW()')
    client.release()
  }

  async testConnection(config: DatabaseConfig): Promise<{ connected: boolean; error?: string; tablesInitialized?: boolean }> {
    try {
      if (config.connectionString) {
        await this.connectWithConnectionString(config.connectionString)
      } else {
        await this.connect(config)
      }

      const tablesExist = await this.checkTablesExist()

      return {
        connected: true,
        tablesInitialized: tablesExist
      }
    } catch (error: any) {
      return {
        connected: false,
        error: error.message
      }
    }
  }

  async initialize(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      // Create jobs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS jobs (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          status VARCHAR(50) DEFAULT 'applied',
          url TEXT,
          notes TEXT,
          description TEXT,
          requirements TEXT,
          responsibilities TEXT,
          qualifications TEXT,
          applied_at TIMESTAMP,
          rejected_at VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Create job_files table
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_files (
          id SERIAL PRIMARY KEY,
          job_id INTEGER NOT NULL,
          filename VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_size INTEGER,
          mime_type VARCHAR(100),
          file_path TEXT,
          file_type VARCHAR(50),
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        )
      `)

      // Create job_status_history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_status_history (
          id SERIAL PRIMARY KEY,
          job_id INTEGER NOT NULL,
          status VARCHAR(50) NOT NULL,
          changed_at TIMESTAMP NOT NULL,
          operator VARCHAR(100),
          note TEXT,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        )
      `)

      // Create job_stage_timestamps table
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_stage_timestamps (
          job_id INTEGER PRIMARY KEY,
          applied_at TIMESTAMP,
          screening_at TIMESTAMP,
          interview_at TIMESTAMP,
          offered_at TIMESTAMP,
          rejected_at TIMESTAMP,
          rejected_from VARCHAR(50),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        )
      `)

      console.log('✅ PostgreSQL tables created successfully')
    } finally {
      client.release()
    }
  }

  async checkTablesExist(): Promise<boolean> {
    if (!this.pool) return false

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'jobs'
      `)
      return result.rows.length > 0
    } finally {
      client.release()
    }
  }

  async getJobs(): Promise<Job[]> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT
          id,
          title,
          company,
          location,
          status,
          url,
          notes,
          description,
          requirements,
          responsibilities,
          qualifications,
          applied_at as "appliedAt",
          rejected_at as "rejectedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM jobs
        ORDER BY created_at DESC
      `)

      // Load related data for each job
      const jobs = result.rows
      for (const job of jobs) {
        job.files = await this.getJobFiles(job.id)
        job.statusHistory = await this.getStatusHistory(job.id)
      }

      return jobs
    } finally {
      client.release()
    }
  }

  async createJob(job: Omit<Job, 'id'>): Promise<Job> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        INSERT INTO jobs (
          title, company, location, status, url, notes, description,
          requirements, responsibilities, qualifications, applied_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING
          id,
          title,
          company,
          location,
          status,
          url,
          notes,
          description,
          requirements,
          responsibilities,
          qualifications,
          applied_at as "appliedAt",
          rejected_at as "rejectedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [
        job.title,
        job.company,
        job.location,
        job.status,
        job.url,
        job.notes,
        job.description,
        Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || null,
        Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : job.responsibilities || null,
        Array.isArray(job.qualifications) ? job.qualifications.join('\n') : job.qualifications || null,
        job.appliedAt
      ])

      const createdJob = result.rows[0]

      // Record initial status in status history
      await client.query(`
        INSERT INTO job_status_history (
          job_id, status, changed_at, operator, note
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        createdJob.id,
        createdJob.status || 'applied',
        new Date().toISOString(),
        'User',
        'Job application created'
      ])

      // Initialize stage timestamps for the initial status
      if (createdJob.status) {
        await this.updateStageTimestamp(createdJob.id, '', createdJob.status)
      }

      console.log(`Initial status recorded for new job ${createdJob.id}: ${createdJob.status || 'interested'}`)

      return createdJob
    } finally {
      client.release()
    }
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      // Get current job data to check for status changes
      const currentJobResult = await client.query('SELECT status FROM jobs WHERE id = $1', [id])
      const currentStatus = currentJobResult.rows[0]?.status

      const result = await client.query(`
        UPDATE jobs
        SET
          title = COALESCE($2, title),
          company = COALESCE($3, company),
          location = COALESCE($4, location),
          status = COALESCE($5, status),
          url = COALESCE($6, url),
          notes = COALESCE($7, notes),
          description = COALESCE($8, description),
          requirements = COALESCE($9, requirements),
          responsibilities = COALESCE($10, responsibilities),
          qualifications = COALESCE($11, qualifications),
          applied_at = COALESCE($12, applied_at),
          rejected_at = COALESCE($13, rejected_at),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING
          id,
          title,
          company,
          location,
          status,
          url,
          notes,
          description,
          requirements,
          responsibilities,
          qualifications,
          applied_at as "appliedAt",
          rejected_at as "rejectedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [
        id,
        updates.title,
        updates.company,
        updates.location,
        updates.status,
        updates.url,
        updates.notes,
        updates.description,
        Array.isArray(updates.requirements) ? updates.requirements.join('\n') : updates.requirements || null,
        Array.isArray(updates.responsibilities) ? updates.responsibilities.join('\n') : updates.responsibilities || null,
        Array.isArray(updates.qualifications) ? updates.qualifications.join('\n') : updates.qualifications || null,
        updates.appliedAt,
        updates.rejectedAt
      ])

      const updatedJob = result.rows[0]

      // Smart status history recording - only if status actually changed
      if (updates.status && currentStatus && updates.status !== currentStatus) {
        await this.recordStatusChangeIfNeeded(client, id, currentStatus, updates.status)
        // Update stage timestamps for first-time arrivals
        await this.updateStageTimestamp(parseInt(id), currentStatus, updates.status)
      }

      // Load related data for the updated job
      updatedJob.files = await this.getJobFiles(parseInt(id))
      updatedJob.statusHistory = await this.getStatusHistory(parseInt(id))
      // Add progress data
      updatedJob.progress = await this.getJobProgress(parseInt(id))

      return updatedJob
    } finally {
      client.release()
    }
  }

  // Simplified status history recording - records all meaningful status changes
  private async recordStatusChangeIfNeeded(
    client: any,
    jobId: string,
    fromStatus: string,
    toStatus: string
  ): Promise<void> {
    // Check the most recent status history entry
    const lastHistoryResult = await client.query(`
      SELECT status
      FROM job_status_history
      WHERE job_id = $1
      ORDER BY changed_at DESC
      LIMIT 1
    `, [jobId])

    const lastRecordedStatus = lastHistoryResult.rows[0]?.status

    // Only record if the new status is different from the last recorded status
    if (lastRecordedStatus && lastRecordedStatus === toStatus) {
      console.log(`Skipping duplicate status recording: ${toStatus} already recorded for job ${jobId}`)
      return
    }

    // Record the status change
    await client.query(`
      INSERT INTO job_status_history (
        job_id, status, changed_at, operator, note
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      jobId,
      toStatus,
      new Date().toISOString(),
      'User',
      `Status changed from ${fromStatus} to ${toStatus}`
    ])

    console.log(`Status change recorded: ${fromStatus} → ${toStatus} for job ${jobId}`)
  }

  async deleteJob(id: string): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      await client.query('DELETE FROM jobs WHERE id = $1', [id])
    } finally {
      client.release()
    }
  }

  async migrateJobs(jobs: Job[]): Promise<{ imported: number; errors: string[] }> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

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

  async addJobFile(fileData: any): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        INSERT INTO job_files (
          job_id, filename, original_name, file_size, mime_type,
          file_path, file_type, uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          job_id as "jobId",
          filename,
          original_name as "originalName",
          file_size as "fileSize",
          mime_type as "mimeType",
          file_path as "filePath",
          file_type as "fileType",
          uploaded_at as "uploadedAt"
      `, [
        fileData.jobId,
        fileData.filename,
        fileData.originalName,
        fileData.fileSize,
        fileData.mimeType,
        fileData.filePath,
        fileData.fileType,
        fileData.uploadedAt
      ])

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async getJobFile(fileId: number): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT
          id,
          job_id as "jobId",
          filename,
          original_name as "originalName",
          file_size as "fileSize",
          mime_type as "mimeType",
          file_path as "filePath",
          file_type as "fileType",
          uploaded_at as "uploadedAt"
        FROM job_files
        WHERE id = $1
      `, [fileId])

      return result.rows[0] || null
    } finally {
      client.release()
    }
  }

  async deleteJobFile(fileId: number): Promise<boolean> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query('DELETE FROM job_files WHERE id = $1', [fileId])
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  async getJobFiles(jobId: number): Promise<any[]> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT
          id,
          job_id as "jobId",
          filename,
          original_name as "originalName",
          file_size as "fileSize",
          mime_type as "mimeType",
          file_path as "filePath",
          file_type as "fileType",
          uploaded_at as "uploadedAt"
        FROM job_files
        WHERE job_id = $1
        ORDER BY uploaded_at DESC
      `, [jobId])

      return result.rows
    } finally {
      client.release()
    }
  }

  // Status History operations
  async addStatusHistory(historyEntry: any): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        INSERT INTO job_status_history (
          job_id, status, changed_at, operator, note
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          job_id as "jobId",
          status,
          changed_at as "changedAt",
          operator,
          note
      `, [
        historyEntry.jobId,
        historyEntry.status,
        historyEntry.changedAt,
        historyEntry.operator,
        historyEntry.note
      ])

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async getStatusHistory(jobId: number): Promise<any[]> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT
          id,
          job_id as "jobId",
          status,
          changed_at as "changedAt",
          operator,
          note
        FROM job_status_history
        WHERE job_id = $1
        ORDER BY changed_at DESC
      `, [jobId])

      return result.rows
    } finally {
      client.release()
    }
  }

  async deleteStatusHistory(historyId: number): Promise<boolean> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query('DELETE FROM job_status_history WHERE id = $1', [historyId])
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  // Stage Timestamps operations
  async getStageTimestamps(jobId: number): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT * FROM job_stage_timestamps WHERE job_id = $1
      `, [jobId])

      return result.rows[0] || {
        job_id: jobId,
        applied_at: null,
        screening_at: null,
        interview_at: null,
        offered_at: null,
        rejected_at: null,
        rejected_from: null
      }
    } finally {
      client.release()
    }
  }

  async updateStageTimestamp(jobId: number, currentStatus: string, newStatus: string): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected')
    }

    const client = await this.pool.connect()
    try {
      // Get current timestamps
      const timestamps = await this.getStageTimestamps(jobId)
      const now = new Date().toISOString()

      // Update timestamps based on new status
      let updateFields: string[] = []
      let updateValues: any[] = [jobId]
      let valueIndex = 2

      // Only set timestamp if it's the first time reaching this stage
      if (newStatus === 'applied' && !timestamps.applied_at) {
        updateFields.push(`applied_at = $${valueIndex}`)
        updateValues.push(now)
        valueIndex++
      } else if (newStatus === 'screening' && !timestamps.screening_at) {
        updateFields.push(`screening_at = $${valueIndex}`)
        updateValues.push(now)
        valueIndex++
      } else if (newStatus === 'interview' && !timestamps.interview_at) {
        updateFields.push(`interview_at = $${valueIndex}`)
        updateValues.push(now)
        valueIndex++
      } else if (newStatus === 'offered' && !timestamps.offered_at) {
        updateFields.push(`offered_at = $${valueIndex}`)
        updateFields.push(`rejected_at = NULL`)
        updateFields.push(`rejected_from = NULL`)
        updateValues.push(now)
        valueIndex++
      } else if (newStatus === 'rejected') {
        updateFields.push(`rejected_at = $${valueIndex}`)
        updateFields.push(`rejected_from = $${valueIndex + 1}`)
        updateFields.push(`offered_at = NULL`)
        updateValues.push(now, currentStatus)
        valueIndex += 2
      }

      // Always update the updated_at timestamp
      updateFields.push(`updated_at = $${valueIndex}`)
      updateValues.push(now)

      if (updateFields.length > 1) { // More than just updated_at
        // Separate fields with parameters from NULL fields
        const fieldsWithParams: string[] = []
        const nullFields: string[] = []

        updateFields.forEach(field => {
          if (field.includes('= NULL')) {
            nullFields.push(field)
          } else {
            fieldsWithParams.push(field)
          }
        })

        // Build INSERT fields (only those with actual values)
        const insertFieldNames = fieldsWithParams.map(f => f.split(' = ')[0])
        const insertFields = ['job_id', ...insertFieldNames]
        const insertPlaceholders = insertFields.map((_, i) => `$${i + 1}`)

        // Build UPDATE SET clauses
        const paramUpdateClauses = fieldsWithParams.map(field => {
          const fieldName = field.split(' = ')[0]
          return `${fieldName} = EXCLUDED.${fieldName}`
        })

        const nullUpdateClauses = nullFields.map(field => field) // Keep as-is: "field = NULL"
        const allUpdateClauses = [...paramUpdateClauses, ...nullUpdateClauses]

        await client.query(`
          INSERT INTO job_stage_timestamps (${insertFields.join(', ')})
          VALUES (${insertPlaceholders.join(', ')})
          ON CONFLICT (job_id)
          DO UPDATE SET ${allUpdateClauses.join(', ')}
        `, updateValues)
      }
    } finally {
      client.release()
    }
  }

  async getJobProgress(jobId: number): Promise<Array<{stage: string, at: string}>> {
    const timestamps = await this.getStageTimestamps(jobId)
    const progress: Array<{stage: string, at: string}> = []

    if (timestamps.applied_at) {
      progress.push({stage: 'applied', at: timestamps.applied_at})
    }
    if (timestamps.screening_at) {
      progress.push({stage: 'screening', at: timestamps.screening_at})
    }
    if (timestamps.interview_at) {
      progress.push({stage: 'interview', at: timestamps.interview_at})
    }
    if (timestamps.offered_at) {
      progress.push({stage: 'offered', at: timestamps.offered_at})
    } else if (timestamps.rejected_at) {
      progress.push({stage: 'rejected', at: timestamps.rejected_at})
    }

    return progress
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }
}