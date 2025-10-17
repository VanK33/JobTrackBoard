/**
 * Null Safety Helpers Interface
 * Feature: 023-fix-null-reference - Null Reference Error Fix
 *
 * Provides type-safe utility functions for null checking and safe property access.
 *
 * Requirements Satisfied:
 * - FR-002: Validate job entity exists before accessing properties
 * - FR-003: Handle null/undefined selections gracefully
 * - FR-010: Check for null/undefined entities before property access
 * - NFR-002: <5ms null check overhead
 */

/**
 * Job entity from existing platform structure
 * (Reference only - already defined in codebase)
 */
export interface Job {
  _id: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type JobStatus = 'draft' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted';

/**
 * Safe job property accessor
 * Returns property value if job exists, otherwise returns fallback
 *
 * @param job - Job entity (possibly null/undefined)
 * @param property - Property name to access
 * @param fallback - Default value if job is null or property is undefined
 * @returns Property value or fallback
 *
 * @example
 * const jobId = safeGetJobProperty(selectedJob, '_id', 'unknown');
 * // Returns: selectedJob?._id ?? 'unknown'
 */
export function safeGetJobProperty<K extends keyof Job>(
  job: Job | null | undefined,
  property: K,
  fallback: Job[K]
): Job[K] {
  return job?.[property] ?? fallback;
}

/**
 * Check if job entity is valid (exists and has valid _id)
 *
 * @param job - Job entity to validate
 * @returns true if job exists and has non-empty _id
 *
 * @example
 * if (isValidJob(selectedJob)) {
 *   // Safe to access selectedJob._id
 *   await updateJobStatus(selectedJob._id, newStatus);
 * }
 */
export function isValidJob(job: Job | null | undefined): job is Job {
  return !!job && !!job._id && job._id.trim().length > 0;
}

/**
 * Check if job is a temporary new job (not yet saved)
 *
 * @param job - Job entity to check
 * @returns true if job _id starts with 'new-'
 *
 * @example
 * if (isNewJob(selectedJob)) {
 *   // This is an unsaved job, show "Save" button
 * }
 */
export function isNewJob(job: Job | null | undefined): boolean {
  return isValidJob(job) && job._id.startsWith('new-');
}

/**
 * Safe job display name
 * Returns formatted job title + company, or fallback if job is null
 *
 * @param job - Job entity
 * @param fallback - Default text if job is null
 * @returns Formatted job name or fallback
 *
 * @example
 * const displayName = getJobDisplayName(selectedJob, 'No job selected');
 * // Returns: "Software Engineer - Acme Corp" or "No job selected"
 */
export function getJobDisplayName(
  job: Job | null | undefined,
  fallback = 'No job selected'
): string {
  if (!isValidJob(job)) return fallback;

  const title = job.title?.trim() || 'Untitled';
  const company = job.company?.trim() || 'Unknown Company';

  return `${title} - ${company}`;
}

/**
 * Type guard for ensuring job is not null
 * Use this in if statements to narrow TypeScript type
 *
 * @param job - Job entity to check
 * @throws Error with context if job is null (for debugging)
 * @returns job (TypeScript narrows type to Job, not null)
 *
 * @example
 * try {
 *   assertJobExists(selectedJob, 'updateJobStatus');
 *   await updateJobStatus(selectedJob._id, newStatus); // Safe now
 * } catch (error) {
 *   console.error(error); // Logs: "Job is null in updateJobStatus"
 * }
 */
export function assertJobExists(
  job: Job | null | undefined,
  context: string
): asserts job is Job {
  if (!isValidJob(job)) {
    const error = new Error(`[JobDashboard] Job is null in ${context}`);
    console.error(error.message, { context, job });
    throw error;
  }
}
