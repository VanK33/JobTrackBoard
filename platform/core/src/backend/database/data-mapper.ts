/**
 * Data Mapper Service - Handles conversion between frontend and backend data formats
 */

// Frontend Job interface (from JobDashboard.tsx)
export interface FrontendJob {
  _id: string
  title: string
  company: string
  location: string
  jobDescription?: string
  requirements?: string[]
  responsibilities?: string[]
  qualifications?: string[]
  status: 'applied' | 'screening' | 'interview' | 'offered' | 'rejected'
  rejectedAt?: string
  jobUrl?: string
  notes?: string
  files?: FrontendJobFile[]
  appliedAt?: string
  createdAt: string
  updatedAt: string
  statusHistory?: FrontendStatusHistory[]
  progress?: Array<{stage: string, at: string}>
}

export interface FrontendJobFile {
  id: string
  name: string
  type: 'resume' | 'cover-letter' | 'portfolio' | 'job-description' | 'transcript' | 'other'
  mimeType: string
  size: number
  url: string
  uploadedAt: string
  uploadProgress?: number
  uploadStatus?: 'uploading' | 'completed' | 'failed'
  error?: string
}


export interface FrontendStatusHistory {
  status: string
  date: string
  operator?: string
  note?: string
}

// Backend JobRecord interfaces
import { JobRecord, JobFileRecord, StatusHistoryRecord } from './sqlite-service'

export class DataMapper {
  /**
   * Convert frontend Job to backend JobRecord format
   */
  static frontendToBackend(frontendJob: Partial<FrontendJob>): Partial<JobRecord> {
    const backend: Partial<JobRecord> = {}

    // Map basic fields with name translation
    if (frontendJob._id !== undefined) backend.id = parseInt(frontendJob._id)
    if (frontendJob.title !== undefined) backend.title = frontendJob.title
    if (frontendJob.company !== undefined) backend.company = frontendJob.company
    if (frontendJob.location !== undefined) backend.location = frontendJob.location
    if (frontendJob.status !== undefined) backend.status = frontendJob.status
    if (frontendJob.notes !== undefined) backend.notes = frontendJob.notes
    if (frontendJob.rejectedAt !== undefined) backend.rejectedAt = frontendJob.rejectedAt
    if (frontendJob.createdAt !== undefined) backend.createdAt = frontendJob.createdAt
    if (frontendJob.updatedAt !== undefined) backend.updatedAt = frontendJob.updatedAt

    // Map fields with name changes
    if (frontendJob.jobDescription !== undefined) backend.description = frontendJob.jobDescription
    if (frontendJob.jobUrl !== undefined) backend.url = frontendJob.jobUrl
    if (frontendJob.appliedAt !== undefined) backend.appliedAt = frontendJob.appliedAt

    // Convert arrays to text (for database storage)
    if (frontendJob.requirements) {
      backend.requirements = Array.isArray(frontendJob.requirements)
        ? frontendJob.requirements.join('\n')
        : frontendJob.requirements
    }
    if (frontendJob.responsibilities) {
      backend.responsibilities = Array.isArray(frontendJob.responsibilities)
        ? frontendJob.responsibilities.join('\n')
        : frontendJob.responsibilities
    }
    if (frontendJob.qualifications) {
      backend.qualifications = Array.isArray(frontendJob.qualifications)
        ? frontendJob.qualifications.join('\n')
        : frontendJob.qualifications
    }

    return backend
  }

  /**
   * Convert backend JobRecord to frontend Job format
   */
  static backendToFrontend(backendJob: JobRecord): FrontendJob {
    const frontend: FrontendJob = {
      _id: backendJob.id?.toString() || '',
      title: backendJob.title,
      company: backendJob.company,
      location: backendJob.location,
      status: backendJob.status as any,
      createdAt: backendJob.createdAt,
      updatedAt: backendJob.updatedAt,

      // Map fields with name changes
      jobDescription: backendJob.description,
      jobUrl: backendJob.url,
      appliedAt: backendJob.appliedAt,
      notes: backendJob.notes,
      rejectedAt: backendJob.rejectedAt,

      // Convert text to arrays
      requirements: (backendJob.requirements && typeof backendJob.requirements === 'string') ?
        backendJob.requirements.split('\n').filter(Boolean) : [],
      responsibilities: (backendJob.responsibilities && typeof backendJob.responsibilities === 'string') ?
        backendJob.responsibilities.split('\n').filter(Boolean) : [],
      qualifications: (backendJob.qualifications && typeof backendJob.qualifications === 'string') ?
        backendJob.qualifications.split('\n').filter(Boolean) : [],

      // Convert related data
      files: backendJob.files ?
        backendJob.files.map(this.backendFileToFrontend) : [],
      statusHistory: backendJob.statusHistory ?
        backendJob.statusHistory.map(this.backendStatusHistoryToFrontend) : [],
      progress: (backendJob as any).progress || [],
    }

    return frontend
  }

  /**
   * Convert backend JobFileRecord to frontend JobFile
   */
  static backendFileToFrontend(backendFile: JobFileRecord): FrontendJobFile {
    // Convert Supabase storage path to public URL
    let url = backendFile.filePath || ''
    if (url.startsWith('jobs/')) {
      // This is a Supabase storage path, convert to public URL
      const { supabaseStorage } = require('./supabase-client.js')
      url = supabaseStorage.getPublicUrl(url)
    } else if (url.includes('/storage/')) {
      // Legacy local storage path, extract relative path
      url = url.substring(url.indexOf('/storage/'))
    }

    return {
      id: backendFile.id.toString(),
      name: backendFile.filename,
      type: (backendFile.fileType as any) || 'other',
      mimeType: backendFile.mimeType || '',
      size: backendFile.fileSize || 0,
      url: url,
      uploadedAt: backendFile.uploadedAt,
      uploadStatus: 'completed'
    }
  }

  /**
   * Convert backend StatusHistoryRecord to frontend StatusHistory
   */
  static backendStatusHistoryToFrontend(backendHistory: StatusHistoryRecord): FrontendStatusHistory {
    return {
      status: backendHistory.status,
      date: backendHistory.changedAt,
      operator: backendHistory.operator,
      note: backendHistory.note
    }
  }


  /**
   * Field mapping configuration for database operations
   */
  static readonly FIELD_MAPPING = {
    // Frontend -> Database
    toDatabase: {
      '_id': 'id',
      'jobDescription': 'description',
      'jobUrl': 'url',
      'appliedAt': 'applied_at',
      'rejectedAt': 'rejected_at',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at'
    },
    // Database -> Frontend
    toFrontend: {
      'id': '_id',
      'description': 'jobDescription',
      'url': 'jobUrl',
      'applied_at': 'appliedAt',
      'rejected_at': 'rejectedAt',
      'created_at': 'createdAt',
      'updated_at': 'updatedAt'
    }
  }

  /**
   * Get valid database fields only (for filtering updates)
   */
  static getValidDatabaseFields(): Set<string> {
    return new Set([
      'title', 'company', 'location', 'status', 'notes',
      'description', 'url', 'requirements', 'responsibilities',
      'qualifications', 'applied_at', 'rejected_at'
    ])
  }

  /**
   * Map frontend field name to database column name
   */
  static mapFieldToColumn(frontendField: string): string {
    const mapping = this.FIELD_MAPPING.toDatabase as Record<string, string>;
    return mapping[frontendField] || frontendField
  }

  /**
   * Map database column name to frontend field name
   */
  static mapColumnToField(databaseColumn: string): string {
    const mapping = this.FIELD_MAPPING.toFrontend as Record<string, string>;
    return mapping[databaseColumn] || databaseColumn
  }
}