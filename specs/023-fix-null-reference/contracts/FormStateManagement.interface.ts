/**
 * Form State Management Interface
 * Feature: 023-fix-null-reference - Null Reference Error Fix
 *
 * Defines contracts for managing new job form state, dirty state detection,
 * and unsaved data handling.
 *
 * Requirements Satisfied:
 * - FR-005: Close form immediately if no unsaved data, show confirmation if unsaved data exists
 * - FR-006: Detect unsaved data as at least ONE non-empty field
 * - FR-007: Show confirmation dialog for unsaved data
 * - FR-008: Preserve data when user chooses "Continue editing"
 * - FR-013: Discard data only on explicit confirm
 */

import { Job } from './NullSafetyHelpers.interface';

/**
 * New Job Form State
 * Tracks state for the "New Application" form creation workflow
 */
export interface NewJobFormState {
  /** Flag indicating "New Application" mode is active */
  isCreatingNew: boolean;

  /** Temporary job object during creation (before save) */
  newJobForm: Job | null;

  /** Currently selected job for detail view (can be null) */
  selectedJob: Job | null;

  /** Flag to show "Close without saving?" confirmation dialog */
  showCloseConfirm: boolean;
}

/**
 * Dirty State Detection Result
 * Indicates whether form has unsaved data that should trigger confirmation
 */
export interface DirtyStateResult {
  /** True if form has at least one non-empty field */
  isDirty: boolean;

  /** Fields that have non-empty values */
  dirtyFields: string[];

  /** Summary message for debugging */
  summary: string;
}

/**
 * Form State Manager Interface
 * Manages new job form lifecycle and dirty state detection
 */
export interface IFormStateManager {
  /**
   * Check if form has unsaved data
   *
   * Per FR-006: Unsaved data = at least ONE field has a non-empty value
   *
   * @param job - The newJobForm to check
   * @returns DirtyStateResult with isDirty flag and dirty fields list
   *
   * @example
   * const result = hasUnsavedData(newJobForm);
   * if (result.isDirty) {
   *   setShowCloseConfirm(true);
   * } else {
   *   handleCloseNewJobForm();
   * }
   */
  hasUnsavedData(job: Job | null): DirtyStateResult;

  /**
   * Handle close attempt (user clicks outside form)
   *
   * Per FR-005: Close immediately if no unsaved data, otherwise show confirmation
   *
   * @param state - Current form state
   * @param onCloseImmediate - Callback to close form immediately (no confirmation)
   * @param onShowConfirmation - Callback to show confirmation dialog
   *
   * @example
   * handleCloseAttempt(
   *   { isCreatingNew, newJobForm, selectedJob, showCloseConfirm },
   *   () => handleCloseNewJobForm(),
   *   () => setShowCloseConfirm(true)
   * );
   */
  handleCloseAttempt(
    state: NewJobFormState,
    onCloseImmediate: () => void,
    onShowConfirmation: () => void
  ): void;

  /**
   * Handle "Continue editing" action
   *
   * Per FR-008: Preserve data when user chooses "Continue editing"
   *
   * @param setShowCloseConfirm - State setter to hide confirmation dialog
   *
   * @example
   * handleContinueEditing(setShowCloseConfirm);
   * // Result: Dialog closes, form remains open with data preserved
   */
  handleContinueEditing(setShowCloseConfirm: (value: boolean) => void): void;

  /**
   * Handle "Discard changes" action
   *
   * Per FR-013: Discard data only on explicit confirm
   *
   * @param resetFormState - Callback to reset all form state
   *
   * @example
   * handleDiscardChanges(() => {
   *   setIsCreatingNew(false);
   *   setNewJobForm(null);
   *   setSelectedJob(null);
   *   setShowCloseConfirm(false);
   * });
   */
  handleDiscardChanges(resetFormState: () => void): void;
}

/**
 * Utility function: Check if form has unsaved data
 *
 * Implements FR-006 logic:
 * Unsaved data = at least ONE field (title, company, location, description, status) has a non-empty value
 *
 * @param job - Job form to check
 * @returns DirtyStateResult
 */
export function checkDirtyState(job: Job | null): DirtyStateResult {
  if (!job) {
    return {
      isDirty: false,
      dirtyFields: [],
      summary: 'Form is null'
    };
  }

  const dirtyFields: string[] = [];

  // Check each field for non-empty value
  if (job.title?.trim()) dirtyFields.push('title');
  if (job.company?.trim()) dirtyFields.push('company');
  if (job.location?.trim()) dirtyFields.push('location');
  if (job.description?.trim()) dirtyFields.push('description');
  if (job.status && job.status !== 'draft') dirtyFields.push('status');

  const isDirty = dirtyFields.length > 0;

  return {
    isDirty,
    dirtyFields,
    summary: isDirty
      ? `Form has unsaved data in: ${dirtyFields.join(', ')}`
      : 'Form is empty'
  };
}

/**
 * Implementation: Form State Manager
 * Concrete implementation of IFormStateManager interface
 */
export class FormStateManager implements IFormStateManager {
  hasUnsavedData(job: Job | null): DirtyStateResult {
    return checkDirtyState(job);
  }

  handleCloseAttempt(
    state: NewJobFormState,
    onCloseImmediate: () => void,
    onShowConfirmation: () => void
  ): void {
    if (!state.isCreatingNew) {
      // Not in creation mode, close immediately
      onCloseImmediate();
      return;
    }

    const { isDirty } = this.hasUnsavedData(state.newJobForm);

    if (isDirty) {
      // Form has unsaved data, show confirmation (FR-007)
      onShowConfirmation();
    } else {
      // Form is empty, close immediately (FR-005)
      onCloseImmediate();
    }
  }

  handleContinueEditing(setShowCloseConfirm: (value: boolean) => void): void {
    // FR-008: Preserve data - just hide confirmation dialog
    setShowCloseConfirm(false);
  }

  handleDiscardChanges(resetFormState: () => void): void {
    // FR-013: Discard data only on explicit confirm
    resetFormState();
  }
}

/**
 * Hook-style usage pattern (for React components)
 *
 * @example
 * const formStateManager = new FormStateManager();
 *
 * const handleCloseAttempt = () => {
 *   formStateManager.handleCloseAttempt(
 *     { isCreatingNew, newJobForm, selectedJob, showCloseConfirm },
 *     () => {
 *       setIsCreatingNew(false);
 *       setNewJobForm(null);
 *       setSelectedJob(null);
 *     },
 *     () => setShowCloseConfirm(true)
 *   );
 * };
 */
