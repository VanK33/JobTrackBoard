# Implementation Plan: Interactive Tutorial Carousel

**Branch**: `013-tutorial-popup-3` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-tutorial-popup-3/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
2. Fill Technical Context ✓
3. Fill Constitution Check ✓
4. Evaluate Constitution Check → No violations
5. Execute Phase 0 → research.md (in progress)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
7. Re-evaluate Constitution Check
8. Plan Phase 2 → Describe task generation approach
9. STOP - Ready for /tasks command
```

## Summary
Build an interactive 5-step tutorial carousel within the existing TutorialModal component. Users can navigate with Next/Previous buttons, see progress indicators (e.g., "Step 2 of 5"), and close anytime via X button or overlay click. Tutorial auto-displays on first login and can be manually accessed via bottom-right button. No progress persistence between sessions—always starts from step 1.

## Technical Context
**Language/Version**: TypeScript 5.0+ (React 18)
**Primary Dependencies**: React 18, inline CSS-in-JS (existing pattern)
**Storage**: Browser localStorage (for tracking "has seen tutorial" state)
**Testing**: Manual testing via frontend dev server
**Target Platform**: Web browser (modern browsers with ES2020+)
**Project Type**: Web (frontend + backend monorepo)
**Performance Goals**: <100ms step transitions, instant UI feedback
**Constraints**: 500x500px images, 5 fixed steps, vertical layout (image above text)
**Scale/Scope**: Single user feature, 5 tutorial steps, ~200 lines of component code

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Project constitution is using template format. Applying standard web development best practices:

- ✅ **Component-First**: Extend existing TutorialModal component (FR-001)
- ✅ **Inline Styles**: Follow project's existing inline CSS-in-JS pattern
- ✅ **No External Dependencies**: Use React built-ins only (useState, useEffect)
- ✅ **localStorage for State**: Track "has seen tutorial" flag (FR-012b)
- ✅ **Accessibility**: ARIA labels, keyboard navigation (Escape key already supported)

**Status**: PASS (no constitutional violations)

## Project Structure

### Documentation (this feature)
```
specs/013-tutorial-popup-3/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (tutorial step structure)
├── quickstart.md        # Phase 1 output (manual test scenarios)
└── contracts/           # Phase 1 output (component interfaces)
```

### Source Code (repository root)
```
platform/core/src/frontend/
├── components/
│   └── TutorialModal.tsx      # Existing modal (will be enhanced)
├── hooks/
│   └── useTutorialState.ts    # New: Track tutorial seen state
├── pages/
│   └── [existing pages]       # Will integrate tutorial trigger
└── utils/
    └── tutorialData.ts        # New: 5-step tutorial content

platform/core/src/frontend/tests/ (if created)
└── TutorialModal.test.tsx     # Component tests (optional)
```

**Structure Decision**: Web application (Option 2). Frontend-only feature extending existing TutorialModal component in `platform/core/src/frontend/components/`. No backend changes required. Tutorial state persists in browser localStorage.

## Phase 0: Outline & Research

**Research Tasks**:
1. Review existing TutorialModal implementation (DONE: see lines 1-136 above)
2. Determine step navigation state management approach
3. Identify placeholder image pattern (500x500px)
4. Research localStorage best practices for "seen" flag
5. Validate accessibility considerations for carousel navigation

**Key Findings** (to be documented in research.md):

### Decision 1: State Management
- **Decision**: Use React `useState` for current step index (0-4)
- **Rationale**: Simple local state, no global context needed, component self-contained
- **Alternatives**: useReducer (overkill for 1 state variable), Context API (unnecessary global state)

### Decision 2: Tutorial Content Structure
- **Decision**: Hardcoded array of 5 tutorial step objects in `tutorialData.ts`
- **Rationale**: Fixed 5 steps per FR-002, no dynamic content requirement, easy to update
- **Alternatives**: JSON file (adds build complexity), Database (backend overkill), CMS (out of scope)

### Decision 3: "Has Seen" State Persistence
- **Decision**: localStorage key `tutorial_seen` = boolean
- **Rationale**: Simple, no backend required, persists across sessions, meets FR-012b
- **Alternatives**: Cookie (more complex), Backend flag (requires authentication integration), SessionStorage (clears on tab close)

### Decision 4: Placeholder Images
- **Decision**: Use data URI with SVG placeholder (500x500px gray box with "Step X" text)
- **Rationale**: No external dependencies, instant load, predictable size, meets FR-011
- **Alternatives**: External placeholder service (network dependency), Empty `<img>` (breaks layout), Hardcoded base64 (verbose)

### Decision 5: Navigation Button States
- **Decision**: Conditional rendering (hide Previous on step 1, replace Next with Finish on step 5)
- **Rationale**: Meets FR-008 and FR-009, cleaner UX than disabled buttons
- **Alternatives**: Disabled buttons (less intuitive), Always visible (violates spec)

**Output**: research.md documenting all 5 decisions

## Phase 1: Design & Contracts

### 1. Data Model (data-model.md)

**TutorialStep** (Interface)
```typescript
interface TutorialStep {
  stepNumber: number;       // 1-5
  title: string;            // Optional step title
  imageSrc: string;         // Placeholder data URI
  description: string;      // 1-2 sentences
}
```

**TutorialState** (localStorage)
```typescript
{
  tutorial_seen: boolean    // true after first view
}
```

**Component State** (React)
```typescript
{
  currentStepIndex: number  // 0-4 (maps to steps 1-5)
}
```

### 2. Component Contracts (contracts/)

**TutorialModal.tsx** (Enhanced)
```typescript
interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Internal state
const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

// Methods
const goToNextStep = () => void;
const goToPreviousStep = () => void;
const handleFinish = () => void;
const markAsSeen = () => void;
```

**useTutorialState.ts** (New Hook)
```typescript
export function useTutorialState(): {
  hasSeen: boolean;
  markAsSeen: () => void;
}
```

**tutorialData.ts** (New Data)
```typescript
export const tutorialSteps: TutorialStep[] = [
  { stepNumber: 1, title: 'Welcome', imageSrc: '...', description: '...' },
  // ... 4 more steps
];
```

### 3. Integration Points

**Auto-trigger on First Login** (FR-012)
- Location: Main App component or Dashboard page
- Logic: `if (!hasSeen) { openTutorial(); }`
- Timing: After successful login/authentication

**Manual Trigger Button** (FR-012a)
- Location: Bottom right corner (existing Supabase button area)
- Component: `<button onClick={openTutorial}>Tutorial</button>`
- Always visible regardless of `hasSeen` state

### 4. Quickstart Test Scenarios (quickstart.md)

**Manual Test 1**: First-time user auto-trigger
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Verify tutorial opens automatically on step 1
4. Navigate to step 5, click Finish
5. Refresh page → Tutorial should NOT auto-open

**Manual Test 2**: Manual access
1. Click bottom-right Tutorial button
2. Verify opens on step 1 regardless of history

**Manual Test 3**: Navigation
1. Open tutorial
2. Click Next 4 times → Verify reaches step 5
3. Verify "Next" becomes "Finish" on step 5
4. Go back 4 times → Verify "Previous" hidden on step 1

**Manual Test 4**: Early close
1. Open tutorial, navigate to step 3
2. Click X button → Verify closes
3. Reopen tutorial → Verify starts from step 1 (not step 3)

### 5. Update CLAUDE.md
Run: `.specify/scripts/bash/update-agent-context.sh claude`

**Output**: data-model.md, contracts/, quickstart.md, CLAUDE.md updated

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. Create `tutorialData.ts` with 5 placeholder steps [P]
2. Create `useTutorialState.ts` hook [P]
3. Enhance `TutorialModal.tsx` with carousel logic
   - Add state management (currentStepIndex)
   - Add navigation buttons (Next/Previous/Finish)
   - Add progress indicator ("Step X of 5")
   - Integrate tutorial steps display
4. Test navigation: Next/Previous/Finish buttons
5. Test boundary conditions: Step 1 (no Previous), Step 5 (Finish)
6. Add auto-trigger logic in App component
7. Add manual trigger button (bottom right)
8. Test localStorage persistence (has seen flag)
9. Test early close (X button, overlay click)
10. Verify quickstart.md scenarios pass

**Ordering Strategy**:
- [P] = Parallel: Steps 1-2 independent
- Sequential: Step 3 depends on 1-2
- Tests after implementation (4-5, 8-9)
- Integration last (6-7, 10)

**Estimated Output**: ~10 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md)
**Phase 5**: Validation (manual testing via quickstart.md)

## Complexity Tracking
*No complexity violations detected*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | -          | -                                   |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md created
- [x] Phase 2: Task planning complete (/plan command - approach described above)
- [x] Phase 3: Tasks generated (/tasks command) - tasks.md created with 6 executable tasks
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (via /clarify session)
- [x] Complexity deviations documented (none)

**Generated Artifacts**:
- ✅ plan.md (this file)
- ✅ research.md (5 technical decisions documented)
- ✅ data-model.md (3 data structures defined)
- ✅ contracts/TutorialModal.interface.ts (component contract)
- ✅ contracts/useTutorialState.interface.ts (hook contract)
- ✅ contracts/tutorialData.interface.ts (data contract)
- ✅ quickstart.md (15 manual test scenarios)
- ✅ tasks.md (6 executable implementation tasks)
- ✅ CLAUDE.md (updated with feature context)

---
*Based on project best practices - See `CLAUDE.md` for development guidance*
