/**
 * Type Mappers: Job <-> JobRecord Conversion
 *
 * Handles conversion between application-layer Job type and storage-layer JobRecord type.
 * Key differences:
 * - Job.requirements: string[] (application format)
 * - JobRecord.requirements: string (database storage - newline-delimited)
 * - Job.id: string | number (polymorphic for PostgreSQL)
 * - JobRecord.id: number (always numeric in database)
 */

import { Job, JobRecord } from '../../../../../shared/types/src/index.js';

/**
 * Convert JobRecord (database storage) to Job (application layer)
 */
export function jobRecordToJob(record: JobRecord): Job {
  return {
    ...record,
    id: record.id, // Already compatible (number is assignable to string | number)
    requirements: record.requirements
      ? record.requirements.split('\n').filter(Boolean)
      : undefined,
  };
}

/**
 * Convert Job (application layer) to JobRecord (database storage)
 * Omits id, createdAt, updatedAt as these are managed by the database
 */
export function jobToJobRecord(
  job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>
): Omit<JobRecord, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...job,
    requirements: job.requirements
      ? job.requirements.join('\n')
      : undefined,
    // Status is already compatible between Job and JobRecord
    status: job.status as any, // Safe cast - status values are aligned
  };
}

/**
 * Convert partial Job updates to JobRecord updates
 * Used for update operations where not all fields are provided
 */
export function partialJobToJobRecord(
  updates: Partial<Job>
): Partial<JobRecord> {
  const result: Partial<JobRecord> = { ...updates };

  // Convert requirements array to string if present
  if (updates.requirements !== undefined) {
    result.requirements = updates.requirements
      ? updates.requirements.join('\n')
      : undefined;
  }

  // Convert id if present (string to number for database)
  if (updates.id !== undefined && typeof updates.id === 'string') {
    // Skip string IDs (UUIDs) - convert to number for PostgreSQL
    delete result.id;
  }

  return result;
}
