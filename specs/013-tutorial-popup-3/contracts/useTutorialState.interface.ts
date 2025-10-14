/**
 * useTutorialState Hook Contract
 *
 * Custom React hook for managing tutorial "seen" state persistence.
 * Spec: 013-tutorial-popup-3
 * Requirements: FR-012, FR-012b, FR-014
 */

/**
 * Return type for useTutorialState hook
 */
export interface UseTutorialStateReturn {
  /**
   * Whether the user has previously viewed the tutorial
   * Source: localStorage['tutorial_seen'] === 'true'
   * @default false (when key doesn't exist or is not 'true')
   */
  hasSeen: boolean;

  /**
   * Mark the tutorial as seen (persist to localStorage)
   * Side Effect: localStorage.setItem('tutorial_seen', 'true')
   * Requirement: FR-012b (prevent auto-trigger on subsequent logins)
   */
  markAsSeen: () => void;

  /**
   * Clear the "seen" flag (for testing purposes)
   * Side Effect: localStorage.removeItem('tutorial_seen')
   * Not required by spec, but useful for manual testing
   */
  clearSeen?: () => void;
}

/**
 * Hook signature
 */
export type UseTutorialState = () => UseTutorialStateReturn;

/**
 * Behavioral Contracts
 */
export const UseTutorialStateContracts = {
  /**
   * INVARIANT: hasSeen is always a boolean (never undefined/null)
   */
  hasSeenTypeInvariant: (value: unknown) => typeof value === 'boolean',

  /**
   * POSTCONDITION: After markAsSeen(), hasSeen returns true
   */
  markAsSeenPostcondition: () => {
    // localStorage['tutorial_seen'] should be 'true'
    return localStorage.getItem('tutorial_seen') === 'true';
  },

  /**
   * POSTCONDITION: After clearSeen(), hasSeen returns false
   */
  clearSeenPostcondition: () => {
    // localStorage['tutorial_seen'] should be null or not 'true'
    return localStorage.getItem('tutorial_seen') !== 'true';
  },

  /**
   * ERROR HANDLING: If localStorage throws (privacy mode, quota exceeded),
   * hook should fail gracefully without crashing the app
   */
  errorHandlingInvariant: () => {
    // Hook should catch localStorage errors and return default values
    return true;
  }
};

/**
 * Test Scenarios
 */
export const UseTutorialStateTestScenarios = {
  /**
   * Test: Initial state (no localStorage key)
   * Setup: localStorage.removeItem('tutorial_seen')
   * Expected: hasSeen = false
   */
  testInitialState: () => void,

  /**
   * Test: Mark as seen
   * Input: Call markAsSeen()
   * Expected: hasSeen = true, localStorage['tutorial_seen'] = 'true'
   */
  testMarkAsSeen: () => void,

  /**
   * Test: Persistence across hook re-instantiation
   * Setup: markAsSeen() called, component unmounts and remounts
   * Expected: New hook instance still returns hasSeen = true
   */
  testPersistence: () => void,

  /**
   * Test: Clear seen flag
   * Setup: hasSeen = true
   * Input: Call clearSeen()
   * Expected: hasSeen = false, localStorage key removed
   */
  testClearSeen: () => void,

  /**
   * Test: localStorage unavailable (privacy mode)
   * Setup: Mock localStorage to throw Error
   * Expected: Hook returns default (hasSeen = false), no crash
   */
  testLocalStorageUnavailable: () => void
};

/**
 * Usage Example (for documentation)
 */
export const UsageExample = `
import { useTutorialState } from './hooks/useTutorialState';

function App() {
  const { hasSeen, markAsSeen } = useTutorialState();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Auto-trigger on first login (FR-012)
    if (!hasSeen) {
      setShowTutorial(true);
    }
  }, [hasSeen]);

  const handleTutorialClose = () => {
    setShowTutorial(false);
    markAsSeen(); // Prevent auto-trigger next time (FR-012b)
  };

  return (
    <>
      <button onClick={() => setShowTutorial(true)}>Tutorial</button>
      <TutorialModal
        isOpen={showTutorial}
        onClose={handleTutorialClose}
      />
    </>
  );
}
`;
