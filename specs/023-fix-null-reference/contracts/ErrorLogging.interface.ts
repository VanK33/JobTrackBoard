/**
 * Error Logging Interface
 * Feature: 023-fix-null-reference - Null Reference Error Fix
 *
 * Defines structured error logging for null reference errors and debugging.
 *
 * Requirements Satisfied:
 * - NFR-003: Error logging must include: error message, component name, current form state
 * - FR-011: Log errors with component name and form state
 * - FR-012: Application must not crash (graceful error recovery)
 */

import { Job } from './NullSafetyHelpers.interface';
import { NewJobFormState } from './FormStateManagement.interface';

/**
 * Error Context for Null Reference Errors
 * Captures complete context when a null reference error occurs
 */
export interface NullReferenceErrorContext {
  /** Component name where error occurred (e.g., "JobDashboard") */
  component: string;

  /** Function/method where error occurred (e.g., "updateJobStatus") */
  function: string;

  /** Error message (e.g., "Cannot read properties of null (reading '_id')") */
  errorMessage: string;

  /** Stack trace (if available) */
  stackTrace?: string;

  /** Timestamp of error */
  timestamp: Date;

  /** Form state snapshot at time of error */
  formState: ErrorFormStateSnapshot;
}

/**
 * Form State Snapshot for Error Logging
 * Non-sensitive state data for debugging null reference errors
 */
export interface ErrorFormStateSnapshot {
  /** Is "New Application" mode active? */
  isCreatingNew: boolean;

  /** Selected job ID (if exists) */
  selectedJobId?: string;

  /** New job form ID (if exists) */
  newJobFormId?: string;

  /** Does newJobForm have a title? (boolean flag, not actual value) */
  hasTitle: boolean;

  /** Does newJobForm have a company? */
  hasCompany: boolean;

  /** Does newJobForm have a location? */
  hasLocation: boolean;

  /** Does newJobForm have a description? */
  hasDescription: boolean;

  /** Job status (if exists) */
  status?: string;

  /** Is confirmation dialog showing? */
  showCloseConfirm: boolean;
}

/**
 * Error Logger Interface
 * Provides structured logging for null reference errors
 */
export interface IErrorLogger {
  /**
   * Log a null reference error with full context
   *
   * @param context - Error context including component, function, and state
   *
   * @example
   * logNullReferenceError({
   *   component: 'JobDashboard',
   *   function: 'updateJobStatus',
   *   errorMessage: error.message,
   *   timestamp: new Date(),
   *   formState: createFormStateSnapshot(state)
   * });
   */
  logNullReferenceError(context: NullReferenceErrorContext): void;

  /**
   * Log a warning for potential null reference issue
   *
   * @param component - Component name
   * @param message - Warning message
   * @param state - Optional form state snapshot
   *
   * @example
   * logWarning('JobDashboard', 'selectedJob is null but detail view is visible', formState);
   */
  logWarning(component: string, message: string, state?: ErrorFormStateSnapshot): void;
}

/**
 * Create form state snapshot for error logging
 * Extracts non-sensitive data from form state
 *
 * @param state - Current form state
 * @returns ErrorFormStateSnapshot with boolean flags (no actual field values)
 */
export function createFormStateSnapshot(state: NewJobFormState): ErrorFormStateSnapshot {
  return {
    isCreatingNew: state.isCreatingNew,
    selectedJobId: state.selectedJob?._id,
    newJobFormId: state.newJobForm?._id,
    hasTitle: !!state.newJobForm?.title?.trim(),
    hasCompany: !!state.newJobForm?.company?.trim(),
    hasLocation: !!state.newJobForm?.location?.trim(),
    hasDescription: !!state.newJobForm?.description?.trim(),
    status: state.newJobForm?.status,
    showCloseConfirm: state.showCloseConfirm
  };
}

/**
 * Console Error Logger Implementation
 * Logs errors to browser console with structured format
 */
export class ConsoleErrorLogger implements IErrorLogger {
  logNullReferenceError(context: NullReferenceErrorContext): void {
    console.error(`[${context.component}] Null reference error:`, {
      function: context.function,
      error: context.errorMessage,
      timestamp: context.timestamp.toISOString(),
      stackTrace: context.stackTrace,
      formState: context.formState
    });
  }

  logWarning(component: string, message: string, state?: ErrorFormStateSnapshot): void {
    console.warn(`[${component}] Warning: ${message}`, state);
  }
}

/**
 * Usage Example: Wrap null-unsafe code with error logging
 *
 * @example
 * const errorLogger = new ConsoleErrorLogger();
 *
 * const handleDeleteJob = async (jobId: string) => {
 *   try {
 *     if (!selectedJob) {
 *       throw new Error('selectedJob is null');
 *     }
 *
 *     await deleteJobAPI(selectedJob._id);
 *   } catch (error) {
 *     errorLogger.logNullReferenceError({
 *       component: 'JobDashboard',
 *       function: 'handleDeleteJob',
 *       errorMessage: (error as Error).message,
 *       stackTrace: (error as Error).stack,
 *       timestamp: new Date(),
 *       formState: createFormStateSnapshot({
 *         isCreatingNew,
 *         newJobForm,
 *         selectedJob,
 *         showCloseConfirm
 *       })
 *     });
 *   }
 * };
 */

/**
 * Safe execution wrapper with error logging
 *
 * @param fn - Function to execute safely
 * @param context - Error context (component + function name)
 * @param formState - Current form state
 * @param errorLogger - Error logger instance
 * @returns Result of fn() or undefined if error occurred
 *
 * @example
 * const result = safeExecute(
 *   () => updateJobStatus(selectedJob._id, newStatus),
 *   { component: 'JobDashboard', function: 'handleStatusChange' },
 *   formState,
 *   errorLogger
 * );
 */
export async function safeExecute<T>(
  fn: () => Promise<T> | T,
  context: { component: string; function: string },
  formState: NewJobFormState,
  errorLogger: IErrorLogger
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    errorLogger.logNullReferenceError({
      component: context.component,
      function: context.function,
      errorMessage: (error as Error).message,
      stackTrace: (error as Error).stack,
      timestamp: new Date(),
      formState: createFormStateSnapshot(formState)
    });
    return undefined;
  }
}
