/**
 * TutorialModal Component Contract
 *
 * Enhanced modal component with 5-step tutorial carousel navigation.
 * Spec: 013-tutorial-popup-3
 * Requirements: FR-001 through FR-014
 */

/**
 * Props interface for TutorialModal component (EXISTING - unchanged)
 */
export interface TutorialModalProps {
  /**
   * Controls modal visibility
   * @default false
   */
  isOpen: boolean;

  /**
   * Callback invoked when user closes the modal
   * Triggered by: X button, Escape key, overlay click, or Finish button
   */
  onClose: () => void;
}

/**
 * Internal component state (not exported, for documentation only)
 */
interface TutorialModalState {
  /**
   * Current step index (0-4, maps to steps 1-5)
   * @default 0
   */
  currentStepIndex: number;
}

/**
 * Internal methods (not exported, for documentation only)
 */
interface TutorialModalMethods {
  /**
   * Advance to the next tutorial step
   * Precondition: currentStepIndex < 4
   * Postcondition: currentStepIndex incremented by 1
   * UI Effect: Updates displayed step, progress indicator
   * Requirement: FR-005 (Next button)
   */
  goToNextStep: () => void;

  /**
   * Go back to the previous tutorial step
   * Precondition: currentStepIndex > 0
   * Postcondition: currentStepIndex decremented by 1
   * UI Effect: Updates displayed step, progress indicator
   * Requirement: FR-006 (Previous button)
   */
  goToPreviousStep: () => void;

  /**
   * Handle tutorial completion (Finish button on step 5)
   * Precondition: currentStepIndex === 4 (step 5)
   * Postcondition: Modal closed, "seen" flag set in localStorage
   * Side Effect: localStorage.setItem('tutorial_seen', 'true')
   * Requirement: FR-010, FR-012b
   */
  handleFinish: () => void;

  /**
   * Mark tutorial as seen in localStorage
   * Side Effect: Sets 'tutorial_seen' = 'true' in localStorage
   * Requirement: FR-012b
   */
  markAsSeen: () => void;

  /**
   * Reset component state when modal closes
   * Postcondition: currentStepIndex = 0
   * Requirement: FR-014 (no progress persistence)
   */
  resetState: () => void;
}

/**
 * Behavioral Contracts
 */
export const TutorialModalContracts = {
  /**
   * INVARIANT: currentStepIndex ∈ [0, 4] at all times
   */
  stepIndexInvariant: (index: number) => index >= 0 && index <= 4,

  /**
   * INVARIANT: Previous button only visible when currentStepIndex > 0
   * Requirement: FR-008
   */
  previousButtonInvariant: (index: number) => (index === 0 ? false : true),

  /**
   * INVARIANT: Next button visible when currentStepIndex < 4
   * INVARIANT: Finish button visible when currentStepIndex === 4
   * Requirement: FR-009
   */
  navigationButtonInvariant: (index: number) =>
    index < 4 ? 'next' : 'finish',

  /**
   * POSTCONDITION: On close (any method), currentStepIndex resets to 0
   * Requirement: FR-014
   */
  closePostcondition: () => {
    // After onClose() called, next open starts at step 1
    return true;
  },

  /**
   * POSTCONDITION: On handleFinish(), localStorage contains 'tutorial_seen' = 'true'
   * Requirement: FR-012b
   */
  finishPostcondition: () => {
    return localStorage.getItem('tutorial_seen') === 'true';
  }
};

/**
 * Test Scenarios (from quickstart.md)
 */
export const TutorialModalTestScenarios = {
  /**
   * Test: Navigation forward through all 5 steps
   * Input: Click Next 4 times starting from step 1
   * Expected: Reach step 5, Next button replaced with Finish button
   */
  testNavigationForward: () => void,

  /**
   * Test: Navigation backward
   * Input: From step 3, click Previous twice
   * Expected: Return to step 1, Previous button hidden
   */
  testNavigationBackward: () => void,

  /**
   * Test: Boundary condition - step 1
   * Input: Open modal (starts at step 1)
   * Expected: Previous button not visible, Next button visible
   */
  testFirstStepBoundary: () => void,

  /**
   * Test: Boundary condition - step 5
   * Input: Navigate to step 5
   * Expected: Next button replaced with Finish, Previous visible
   */
  testLastStepBoundary: () => void,

  /**
   * Test: Early close with X button
   * Input: Navigate to step 3, click X button
   * Expected: Modal closes, next open starts at step 1
   */
  testEarlyCloseButton: () => void,

  /**
   * Test: Early close with overlay click
   * Input: Navigate to step 3, click outside modal
   * Expected: Modal closes, next open starts at step 1
   */
  testEarlyCloseOverlay: () => void,

  /**
   * Test: Finish button sets localStorage flag
   * Input: Navigate to step 5, click Finish
   * Expected: Modal closes, localStorage['tutorial_seen'] = 'true'
   */
  testFinishSetsFlag: () => void
};
