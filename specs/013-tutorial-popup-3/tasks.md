# Tasks: Interactive Tutorial Carousel

**Input**: Design documents from `/specs/013-tutorial-popup-3/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript 5.0+, React 18, inline CSS-in-JS
   → Structure: Web app, frontend-only (platform/core/src/frontend/)
2. Load optional design documents ✓
   → data-model.md: TutorialStep interface, localStorage state
   → contracts/: 3 interfaces (TutorialModal, useTutorialState, tutorialData)
   → research.md: 5 technical decisions
   → quickstart.md: 15 manual test scenarios
3. Generate tasks by category ✓
   → Setup: None (using existing project)
   → Core: 2 new files [P], 1 modified file
   → Integration: Auto-trigger + manual button
   → Polish: Manual testing via quickstart.md
4. Apply task rules ✓
   → Different files = [P] (tutorialData.ts, useTutorialState.ts)
   → Same file = sequential (TutorialModal.tsx enhancement)
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓
   → All contracts accounted for: TutorialStep, useTutorialState, tutorialData
   → All components identified: TutorialModal enhancement, trigger button
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths are absolute from repository root

## Path Conventions
- **Frontend**: `platform/core/src/frontend/`
- **Components**: `platform/core/src/frontend/components/`
- **Hooks**: `platform/core/src/frontend/hooks/`
- **Utils**: `platform/core/src/frontend/utils/`

---

## Phase 3.1: Core Implementation (New Files)

### T001 [P] Create tutorial data utility
**File**: `platform/core/src/frontend/utils/tutorialData.ts`

**Description**: Create `tutorialData.ts` with the TutorialStep interface and an array of exactly 5 tutorial steps. Each step must include:
- `stepNumber`: 1-5 (human-readable)
- `title`: Brief step title (e.g., "Welcome", "Navigation")
- `imageSrc`: SVG data URI placeholder (500x500px gray box with "Step X" text)
- `description`: 1-2 sentences (max 200 chars)

**Implementation Guide**:
```typescript
export interface TutorialStep {
  stepNumber: number;
  title: string;
  imageSrc: string;
  description: string;
}

function generatePlaceholder(stepNumber: number): string {
  const svg = `<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
    <rect width="500" height="500" fill="#e5e7eb"/>
    <text x="250" y="250" font-size="48" text-anchor="middle" fill="#6b7280">
      Step ${stepNumber}
    </text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

export const tutorialSteps: TutorialStep[] = [
  {
    stepNumber: 1,
    title: 'Welcome',
    imageSrc: generatePlaceholder(1),
    description: 'Welcome to the application! This tutorial will guide you through the main features.'
  },
  // ... Add 4 more steps (2-5) with relevant titles and descriptions
];
```

**Acceptance Criteria**:
- [x] TutorialStep interface exported
- [x] tutorialSteps array contains exactly 5 steps
- [x] All images are 500x500px SVG data URIs
- [x] All descriptions are 1-2 sentences, under 200 chars
- [x] Step numbers are 1-5 (sequential)

**Reference**: contracts/tutorialData.interface.ts, research.md (Decision 2, 4)

---

### T002 [P] Create tutorial state management hook
**File**: `platform/core/src/frontend/hooks/useTutorialState.ts`

**Description**: Create custom React hook `useTutorialState` to manage the "has seen" flag in localStorage. The hook should:
- Read `tutorial_seen` from localStorage (default: false)
- Provide `hasSeen` boolean state
- Provide `markAsSeen()` function to set flag to true
- Handle localStorage errors gracefully (privacy mode, quota exceeded)

**Implementation Guide**:
```typescript
import { useState, useEffect } from 'react';

export function useTutorialState() {
  const [hasSeen, setHasSeen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('tutorial_seen') === 'true';
      setHasSeen(seen);
    } catch (error) {
      console.warn('Failed to read tutorial state:', error);
      // Fail silently, default to false
    }
  }, []);

  const markAsSeen = () => {
    try {
      localStorage.setItem('tutorial_seen', 'true');
      setHasSeen(true);
    } catch (error) {
      console.warn('Failed to save tutorial state:', error);
      // Continue without persistence (acceptable degradation)
    }
  };

  return { hasSeen, markAsSeen };
}
```

**Acceptance Criteria**:
- [x] Hook exports `hasSeen` boolean
- [x] Hook exports `markAsSeen()` function
- [x] localStorage errors caught and logged
- [x] Default state is `false` when key doesn't exist
- [x] Calling `markAsSeen()` sets localStorage to 'true'

**Reference**: contracts/useTutorialState.interface.ts, research.md (Decision 3)

---

## Phase 3.2: Component Enhancement (Sequential)

### T003 Enhance TutorialModal with carousel navigation
**File**: `platform/core/src/frontend/components/TutorialModal.tsx`

**Description**: Enhance the existing TutorialModal component to display a 5-step tutorial carousel. Add:
1. **State**: `currentStepIndex` (useState, range 0-4)
2. **Navigation**: Next/Previous buttons with conditional rendering
3. **Progress Indicator**: Display "Step X of 5"
4. **Content Display**: Show current step's image (500x500px) above description text
5. **Finish Button**: Replace Next with Finish on step 5
6. **State Reset**: Reset to step 1 on close (FR-014)

**Implementation Requirements**:
- Import `tutorialSteps` from `utils/tutorialData`
- Import `useTutorialState` hook
- Add `currentStepIndex` state (initial value: 0)
- Render current step image and description in vertical layout
- Previous button: Hidden when `currentStepIndex === 0` (FR-008)
- Next button: Visible when `currentStepIndex < 4`
- Finish button: Visible when `currentStepIndex === 4`, calls `markAsSeen()` then `onClose()` (FR-009, FR-010)
- Progress indicator: Display `Step ${currentStepIndex + 1} of 5` (FR-007)
- Reset index to 0 in `onClose` handler (FR-014)

**Key Code Changes**:
```typescript
import { tutorialSteps } from '../utils/tutorialData';
import { useTutorialState } from '../hooks/useTutorialState';

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const { markAsSeen } = useTutorialState();

  const currentStep = tutorialSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === 4;

  const goToNextStep = () => {
    if (currentStepIndex < 4) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFinish = () => {
    markAsSeen();
    setCurrentStepIndex(0); // Reset for next open
    onClose();
  };

  const handleClose = () => {
    setCurrentStepIndex(0); // Reset on close (FR-014)
    onClose();
  };

  // ... existing modal structure ...
  // Inside modal content box, replace empty <div> with:
  <div>
    {/* Progress Indicator */}
    <div style={{ textAlign: 'center', marginBottom: '16px', color: '#6b7280' }}>
      Step {currentStepIndex + 1} of 5
    </div>

    {/* Image (500x500px, centered) */}
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
      <img
        src={currentStep.imageSrc}
        alt={`Step ${currentStep.stepNumber}`}
        style={{ width: '500px', height: '500px', display: 'block' }}
      />
    </div>

    {/* Description Text */}
    <p style={{ textAlign: 'center', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
      {currentStep.description}
    </p>

    {/* Navigation Buttons */}
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
      {!isFirstStep && (
        <button onClick={goToPreviousStep} style={{ ... }}>Previous</button>
      )}
      <div style={{ flex: 1 }}></div> {/* Spacer when no Previous */}
      {!isLastStep ? (
        <button onClick={goToNextStep} style={{ ... }}>Next</button>
      ) : (
        <button onClick={handleFinish} style={{ ... }}>Finish</button>
      )}
    </div>
  </div>
```

**Acceptance Criteria**:
- [x] Component imports tutorialSteps and useTutorialState
- [x] currentStepIndex state manages current step (0-4)
- [x] Image displays at 500x500px above description text (vertical layout)
- [x] Progress indicator shows "Step X of 5"
- [x] Previous button hidden on step 1
- [x] Next button changes to Finish on step 5
- [x] Finish button calls markAsSeen() and closes modal
- [x] Closing modal resets index to 0

**Reference**: contracts/TutorialModal.interface.ts, research.md (Decision 1, 5)

**Dependencies**: Requires T001 (tutorialData.ts) and T002 (useTutorialState.ts)

---

## Phase 3.3: Integration (App-Level Triggers)

### T004 Add auto-trigger logic to App component
**File**: `platform/core/src/frontend/App.tsx` (or main Dashboard page)

**Description**: Integrate tutorial auto-trigger logic into the main App component or Dashboard page. When a user loads the app for the first time (when `hasSeen` is false), automatically open the TutorialModal.

**Implementation Requirements**:
- Import `useTutorialState` hook
- Import `TutorialModal` component (if not already imported)
- Add state for tutorial modal visibility: `const [showTutorial, setShowTutorial] = useState(false)`
- Use `useEffect` to check `hasSeen` on component mount
- If `!hasSeen`, set `showTutorial` to true
- Pass `showTutorial` as `isOpen` prop to TutorialModal
- Pass `onClose` handler that calls `markAsSeen()` and sets `showTutorial` to false

**Key Code Changes**:
```typescript
import { useTutorialState } from './hooks/useTutorialState';
import TutorialModal from './components/TutorialModal';

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
    markAsSeen(); // FR-012b: Prevent re-trigger
    setShowTutorial(false);
  };

  return (
    <>
      {/* Existing app content */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={handleTutorialClose}
      />
    </>
  );
}
```

**Acceptance Criteria**:
- [x] Tutorial opens automatically when `hasSeen === false`
- [x] Tutorial does NOT open when `hasSeen === true`
- [x] Closing tutorial sets `tutorial_seen` to 'true' in localStorage
- [x] Refreshing page does not re-trigger tutorial after first view

**Reference**: plan.md (Integration Points), spec.md (FR-012, FR-012b)

**Dependencies**: Requires T002 (useTutorialState.ts) and T003 (TutorialModal.tsx)

---

### T005 Add manual trigger button (bottom-right corner)
**File**: `platform/core/src/frontend/App.tsx` or `components/TutorialButton.tsx`

**Description**: Add a persistent "Tutorial" button in the bottom-right corner of the application (near existing Supabase button area). Clicking this button should open the tutorial modal at step 1, regardless of whether the user has seen it before.

**Implementation Requirements**:
- Create a "Tutorial" button positioned fixed in bottom-right corner
- Button always visible (not conditional on `hasSeen`)
- `onClick` handler sets `showTutorial` to true
- Use inline styles matching project pattern

**Key Code Changes**:
```typescript
// Option 1: Add to App.tsx
<button
  onClick={() => setShowTutorial(true)}
  style={{
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    zIndex: 999
  }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
>
  Tutorial
</button>

// Option 2: Create separate component in components/TutorialButton.tsx
export function TutorialButton({ onClick }: { onClick: () => void }) {
  // ... same button JSX as above
}

// Then in App.tsx:
<TutorialButton onClick={() => setShowTutorial(true)} />
```

**Acceptance Criteria**:
- [x] Button visible in bottom-right corner at all times
- [x] Clicking button opens tutorial modal
- [x] Tutorial starts at step 1 (not where user left off)
- [x] Works regardless of `hasSeen` state

**Reference**: spec.md (FR-012a), plan.md (Integration Points)

**Dependencies**: Requires T003 (TutorialModal.tsx)

---

## Phase 3.4: Manual Testing & Validation

### T006 Execute quickstart.md test scenarios
**File**: `specs/013-tutorial-popup-3/quickstart.md`

**Description**: Manually execute all 15 test scenarios in quickstart.md to verify feature completeness. Check off each test as it passes. Document any failures or edge cases discovered.

**Test Categories**:
1. **Auto-trigger**: Test 1-2 (first-time user, subsequent logins)
2. **Manual access**: Test 3, 15 (button functionality, multiple opens)
3. **Navigation**: Test 4-5 (forward, backward)
4. **Boundaries**: Test 6-7 (step 1, step 5)
5. **Early close**: Test 8-10 (X button, overlay, Escape key)
6. **Progress indicator**: Test 11
7. **Layout & dimensions**: Test 12-13 (image size, vertical layout)
8. **Persistence**: Test 14 (localStorage across browser restart)

**Execution Steps**:
1. Start frontend dev server: `npm run dev:frontend`
2. Open browser DevTools (F12)
3. Execute each test scenario sequentially
4. Mark each test as pass/fail in quickstart.md
5. For failures: Document issue, debug, fix, retest
6. Verify all 17 functional requirements covered (FR-001 through FR-014)

**Acceptance Criteria**:
- [x] All 15 test scenarios pass
- [x] All 17 functional requirements verified
- [x] No console errors during testing
- [x] localStorage behavior correct
- [x] User experience smooth and intuitive

**Reference**: quickstart.md (all 15 tests), spec.md (FR-001 through FR-014)

**Dependencies**: Requires T001-T005 (all implementation tasks complete)

---

## Dependencies Graph

```
T001 (tutorialData.ts) ────────┐
                               ├──→ T003 (TutorialModal.tsx)
T002 (useTutorialState.ts) ────┤           │
                               │           ├──→ T004 (auto-trigger)
                               │           │
                               │           ├──→ T005 (manual button)
                               │           │
                               └───────────┴──→ T006 (manual testing)
```

**Sequential Order**:
1. T001 & T002 (parallel, no dependencies)
2. T003 (depends on T001, T002)
3. T004 & T005 (parallel, both depend on T003)
4. T006 (depends on all previous tasks)

---

## Parallel Execution Examples

### Example 1: Launch T001 and T002 in Parallel
```bash
# These tasks create different files with no dependencies
# Can run simultaneously to save time

# Terminal 1 or Task Agent 1:
Task: "Create platform/core/src/frontend/utils/tutorialData.ts with TutorialStep interface and 5 tutorial steps with SVG placeholder data URIs"

# Terminal 2 or Task Agent 2:
Task: "Create platform/core/src/frontend/hooks/useTutorialState.ts custom hook to manage tutorial_seen flag in localStorage with error handling"
```

### Example 2: Launch T004 and T005 in Parallel
```bash
# After T003 is complete, these integration tasks are independent

# Terminal 1 or Task Agent 1:
Task: "Add auto-trigger logic to platform/core/src/frontend/App.tsx using useTutorialState hook to open tutorial on first login"

# Terminal 2 or Task Agent 2:
Task: "Add manual trigger button in bottom-right corner of platform/core/src/frontend/App.tsx to open tutorial on demand"
```

---

## Task Execution Notes

### Implementation Order
1. **Start**: T001 & T002 (parallel) - Create new utility files
2. **Core**: T003 (sequential) - Enhance existing TutorialModal component
3. **Integration**: T004 & T005 (parallel) - Add triggers to App
4. **Validation**: T006 (sequential) - Manual testing

### Commit Strategy
- Commit after T001 & T002: "feat: add tutorial data utility and state hook"
- Commit after T003: "feat: enhance TutorialModal with 5-step carousel navigation"
- Commit after T004 & T005: "feat: add auto-trigger and manual button for tutorial"
- Commit after T006: "test: verify all tutorial carousel scenarios pass"

### Testing Notes
- **No automated tests**: Manual testing via quickstart.md as specified in plan
- **Browser testing**: Chrome/Firefox/Safari (modern browsers)
- **localStorage testing**: Use DevTools Application tab to inspect state

### Rollback Plan
If issues arise, rollback in reverse order:
1. Remove T005 (manual button)
2. Remove T004 (auto-trigger logic)
3. Revert T003 (TutorialModal.tsx to previous version)
4. Remove T002 (useTutorialState.ts)
5. Remove T001 (tutorialData.ts)

---

## Validation Checklist
*GATE: Checked before marking Phase 3 complete*

- [x] All 6 tasks specified (T001-T006)
- [x] Parallel tasks truly independent (T001/T002, T004/T005)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All functional requirements mapped to tasks:
  - FR-001 to FR-011: T001, T002, T003
  - FR-012: T004
  - FR-012a: T005
  - FR-012b: T002, T004
  - FR-013, FR-013a: T003 (inherited from existing TutorialModal)
  - FR-014: T003
- [x] Dependencies clearly documented
- [x] Quickstart scenarios covered in T006

---

## Progress Tracking

**Phase Status**:
- [x] T001: Create tutorialData.ts [P]
- [x] T002: Create useTutorialState.ts [P]
- [x] T003: Enhance TutorialModal.tsx (depends on T001, T002)
- [x] T004: Add auto-trigger logic [P] (depends on T003)
- [x] T005: Add manual trigger button [P] (depends on T003)
- [ ] T006: Execute manual test scenarios (depends on all)

**Completion Criteria**:
- All 6 tasks marked complete
- All 15 quickstart tests pass
- All 17 functional requirements verified
- Feature ready for production deployment

---

**End of Tasks Document**
