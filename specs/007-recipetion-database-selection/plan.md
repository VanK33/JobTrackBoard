# Implementation Plan: Welcome Homepage and Database Setup Redesign

**Branch**: `007-recipetion-database-selection` | **Date**: 2025-10-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-recipetion-database-selection/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ All clarifications resolved
3. Fill the Constitution Check section
   → ✅ No violations - pure UI/UX enhancement
4. Evaluate Constitution Check section
   → ✅ PASS - No complexity added
5. Execute Phase 0 → research.md
   → ✅ research.md complete
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ All artifacts complete
7. Re-evaluate Constitution Check section
   → ✅ PASS - Design maintains simplicity
8. Plan Phase 2 → Describe task generation approach
   → ✅ Strategy documented below
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS here. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**Primary Requirement**: Improve poor onboarding experience by creating a welcome homepage for first-time users with interactive guided tutorials (popup tooltips), moving Supabase recommendation and setup guidance to homepage, simplifying database selection page to contain only configuration options, and making connection string the default input method.

**Technical Approach**:
- **Welcome Page**: New React component with app introduction, 3 key features, Supabase recommendation box, "Get Started" (launches tutorial) and "Custom Database Setup" (skips to configuration)
- **Interactive Tutorial**: Custom React component (no external library) with 4 tooltip steps, semi-transparent overlay, navigation controls, and localStorage persistence
- **Routing Logic**: Conditional rendering in `App.tsx` based on `OnboardingState.databaseConfigured` (stored in localStorage)
- **Database Page Simplification**: Remove provider recommendations (move to welcome page), default to connection string input, keep validation and history features
- **Settings Menu Integration**: Add dropdown to `JobDashboard` with "Database Configuration" and "View Tutorial" options
- **State Management**: localStorage with `OnboardingState` and existing `DatabaseConfig` schemas

## Technical Context

**Language/Version**: TypeScript 5.0+ with React 18
**Primary Dependencies**: React 18, Vite 5 (no new runtime dependencies)
**Storage**: localStorage for `OnboardingState`, `DatabaseConfig`, `databaseConnectionHistory`
**Testing**: Manual testing via quickstart.md scenarios (20 scenarios)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, viewport ≥ 320px)
**Project Type**: web (monorepo: platform/core with frontend + backend)
**Performance Goals**:
- Welcome page load: <2s (NFR-001)
- Tutorial step transitions: <50ms
- Page transitions: ≤300ms (NFR-002)
- localStorage operations: <5ms
**Constraints**:
- No new runtime dependencies (constitutional principle)
- Frontend-only changes (no backend modifications)
- WCAG 2.1 AA compliance (NFR-003)
- Maintain existing visual design language
**Scale/Scope**:
- 4 tutorial steps per flow (welcome + dashboard variant)
- ~300 lines of new code (WelcomePage + GuidedTutorial components)
- ~150 lines modified (App.tsx routing + JobDashboard settings menu)
- ~120 lines removed (DatabaseSettings provider section)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ PASS - No Violations Detected**

This feature:
- ✅ **No new abstractions**: Uses existing React patterns (useState, useEffect, conditional rendering)
- ✅ **No new dependencies**: Custom tutorial implementation using vanilla React (150 lines)
- ✅ **No backend changes**: Frontend-only enhancement using localStorage
- ✅ **Minimal complexity**: Straightforward routing logic and state management
- ✅ **Clear boundaries**: All changes contained to frontend/pages and frontend/components
- ✅ **No architectural changes**: Reuses existing session-based localStorage architecture

**Rationale**: This is a pure UI/UX enhancement focused on first-time user experience. The interactive tutorial is a simple custom implementation (avoiding heavy libraries like react-joyride or intro.js) that fits well within our existing inline-styled React component patterns. All state management uses the existing localStorage infrastructure from the session-based architecture.

## Project Structure

### Documentation (this feature)
```
specs/007-recipetion-database-selection/
├── spec.md              # Feature specification ✅
├── plan.md              # This file (/plan command output) ✅
├── research.md          # Phase 0 output (/plan command) ✅
├── data-model.md        # Phase 1 output (/plan command) ✅
├── quickstart.md        # Phase 1 output (/plan command) ✅
├── contracts/           # Phase 1 output (/plan command) ✅
│   └── ui-components.contract.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created yet)
```

### Source Code (repository root)

```
platform/core/
├── src/
│   ├── frontend/
│   │   ├── pages/
│   │   │   ├── WelcomePage.tsx           # NEW - Welcome page for first-time users
│   │   │   ├── JobDashboard.tsx          # MODIFIED - Add settings menu
│   │   │   ├── DatabaseSettings.tsx      # MODIFIED - Simplify (remove providers section)
│   │   │   └── App.tsx                   # MODIFIED - Add conditional routing
│   │   ├── components/
│   │   │   └── GuidedTutorial.tsx        # NEW - Interactive tutorial overlay
│   │   ├── utils/
│   │   │   ├── onboarding.ts             # NEW - OnboardingState management
│   │   │   └── tutorial-steps.ts         # NEW - Tutorial content definitions
│   │   └── types.ts                      # MODIFIED - Add OnboardingState, TutorialStep types
│   └── backend/                          # NO CHANGES
└── tests/                                # Manual testing via quickstart.md
```

**Structure Decision**: Web application (Option 2). This feature modifies only the frontend layer with 2 new components (`WelcomePage`, `GuidedTutorial`), 2 new utility files (`onboarding.ts`, `tutorial-steps.ts`), and modifications to 3 existing components (`App.tsx`, `JobDashboard.tsx`, `DatabaseSettings.tsx`). All state management is client-side using localStorage. No backend or shared changes required.

## Phase 0: Outline & Research

**✅ COMPLETED** - See `research.md`

### Key Research Findings:

1. **Current Implementation Analysis** (App.tsx:19-33, DatabaseSettings.tsx):
   - Existing conditional routing based on `getStoredDatabaseConfig()`
   - Current database page has provider recommendations (lines 545-673) to be moved
   - localStorage infrastructure already in place for database config
   - Navigation props pattern (`onNavigateBack`, `onNavigateToSettings`) established

2. **Tutorial Library Decision**:
   - **Selected**: Custom React implementation (~150 lines)
   - **Rationale**: No new dependencies, simple use case (4 steps), fits existing inline styling
   - **Rejected**: react-joyride (50KB+), intro.js (100KB+) - both violate "no new dependencies" principle

3. **Routing Strategy**:
   ```javascript
   // App.tsx entry point
   const dbConfig = getStoredDatabaseConfig()
   const onboardingState = getOnboardingState() || initializeOnboardingState()

   if (!dbConfig) {
     return <WelcomePage onGetStarted={...} onSkipToSetup={...} />
   } else {
     return <JobDashboard onNavigateToSettings={...} />
   }
   ```

4. **localStorage Schema**:
   - **OnboardingState**: `{ databaseConfigured: boolean, tutorialStatus: 'not_started' | 'in_progress' | 'completed', currentStep?: number, lastUpdated: string }`
   - **DatabaseConfig**: Existing schema, no changes
   - **ConnectionStringHistory**: Existing feature (DatabaseSettings.tsx:779-816)

5. **Database Page Simplification**:
   - **Remove**: Lines 545-673 (recommended providers section)
   - **Move**: Provider recommendations to WelcomePage Supabase box
   - **Default**: Connection string input pre-selected (change `useState(false)` to `useState(true)` on line 29)

6. **Tutorial Content** (4 steps):
   - Step 1: Welcome message (center screen)
   - Step 2: Feature highlights (arrow to feature cards)
   - Step 3: Database setup explanation (arrow to Supabase box)
   - Step 4: Next steps (arrow to "Custom Database Setup" button)

7. **Accessibility Strategy**:
   - WCAG 2.1 AA compliance
   - `role="dialog"` on tutorial with `aria-labelledby` and `aria-describedby`
   - Keyboard navigation: Tab, Enter/Space, Escape
   - Focus trap in dialog, return focus on close
   - `aria-live="polite"` for step changes

8. **Performance Analysis**:
   - localStorage ops: ~1ms read/write (negligible)
   - Welcome page render: <100ms (static content, no API calls)
   - Tutorial transitions: CSS opacity fade (300ms, GPU-accelerated)
   - **Conclusion**: No optimization needed, meets all NFR targets

**Output**: research.md with all decisions documented and rationale provided

## Phase 1: Design & Contracts

**✅ COMPLETED** - See artifacts below

### 1. Data Model (`data-model.md`)

**Entities Defined**:
- **OnboardingState** (NEW):
  ```typescript
  {
    databaseConfigured: boolean
    tutorialStatus: 'not_started' | 'in_progress' | 'completed'
    currentStep?: number
    lastUpdated: string
  }
  ```
- **DatabaseConfig** (EXISTING): No changes to schema
- **TutorialContent** (STATIC):
  ```typescript
  interface TutorialStep {
    id: number
    title: string
    content: string
    target?: string
    position: 'center' | 'top' | 'bottom' | 'left' | 'right'
  }
  ```
- **ConnectionStringHistory** (EXISTING): string[] array, max 5 entries

**State Transitions**:
- Initial → Tutorial in progress → Tutorial completed → Database configured
- Each transition saves to localStorage with timestamp

**Relationship Diagram**:
```
OnboardingState (localStorage)
  ↓ determines routing
App.tsx
  ├→ WelcomePage (if !databaseConfigured)
  └→ JobDashboard (if databaseConfigured)
      └→ DatabaseSettings (via settings menu)
          ↓ on successful connection
        DatabaseConfig (localStorage)
          ↓ updates
        OnboardingState.databaseConfigured = true
```

### 2. Contracts (`contracts/ui-components.contract.md`)

**Component Signatures**:
```typescript
// NEW
function WelcomePage({ onGetStarted, onSkipToSetup }: WelcomePageProps): JSX.Element

// NEW
function GuidedTutorial({ steps, isActive, onComplete, onDismiss }: GuidedTutorialProps): JSX.Element | null

// MODIFIED
function DatabaseSettings({ onNavigateBack }: DatabaseSettingsProps): JSX.Element
  // Changes: Remove providers section, default to connection string input

// MODIFIED
function JobDashboard({ onNavigateToSettings }: JobDashboardProps): JSX.Element
  // Changes: Add settings menu dropdown with "Database Configuration" and "View Tutorial"
```

**Utility Function Signatures**:
```typescript
// onboarding.ts (NEW)
export function getOnboardingState(): OnboardingState | null
export function saveOnboardingState(state: OnboardingState): void
export function initializeOnboardingState(): OnboardingState
export function updateTutorialProgress(currentStep: number | undefined, status: string): void
export function markDatabaseConfigured(): void

// tutorial-steps.ts (NEW)
export function getWelcomeTutorialSteps(): TutorialStep[]
export function getDashboardTutorialSteps(): TutorialStep[]
```

**UI Component Requirements**:
- WelcomePage: Header, hero (3 feature cards), Supabase box, 2 CTAs
- GuidedTutorial: Overlay, tooltip box, arrow, navigation buttons, progress indicator
- DatabaseSettings: Simplified form (no providers), connection string input, test/save buttons
- JobDashboard: Settings dropdown (gear icon, 2 menu items)

**Accessibility Contracts**:
- All components keyboard navigable
- ARIA labels on interactive elements
- Focus management in tutorial dialog
- Screen reader announcements for step changes

### 3. Test Scenarios (`quickstart.md`)

**20 Comprehensive Test Scenarios**:
1. First-time user - welcome page display
2. Interactive tutorial launch
3. Tutorial navigation (all 4 steps)
4. Tutorial completion
5. Tutorial skip
6. Tutorial dismissal (Escape key)
7. Custom database setup navigation
8. Database configuration - successful connection
9. Returning user - skip welcome page
10. Settings menu - database configuration
11. Settings menu - view tutorial (replay)
12. Tutorial interruption & resume
13. Database selection - connection failure
14. Connection string history
15. Empty state - no tutorial, no database
16. Accessibility - keyboard navigation
17. Accessibility - screen reader
18. Mobile responsive
19. Browser compatibility
20. Performance validation

**Additional Test Categories**:
- Edge cases: localStorage errors, corrupted data, disabled localStorage
- Performance metrics: <2s page load, <50ms operations, 300ms transitions
- Accessibility: WCAG 2.1 AA compliance, keyboard + screen reader

**Test Data**:
- Valid connection strings (Supabase, Neon, local PostgreSQL)
- Invalid connection strings (for error testing)

### 4. Agent Context Update

✅ Executed `.specify/scripts/bash/update-agent-context.sh claude`
- Updated `CLAUDE.md` with recent changes
- Added database information and project type

**Output**: All Phase 1 artifacts complete and ready for task generation

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

### Task Generation Strategy

**Source Documents**:
- Load `.specify/templates/tasks-template.md` as base
- Generate from Phase 1 artifacts: data-model.md, contracts/, quickstart.md

**Task Categories**:
1. **Preparation (2 tasks)**:
   - Add OnboardingState and TutorialStep types to types.ts
   - Create utility files (onboarding.ts, tutorial-steps.ts)

2. **New Components (2 tasks)**:
   - Create WelcomePage component
   - Create GuidedTutorial component

3. **Routing Changes (1 task)**:
   - Update App.tsx with conditional routing based on OnboardingState

4. **Database Page Simplification (1 task)**:
   - Modify DatabaseSettings.tsx (remove providers, default to connection string)

5. **Settings Menu Integration (1 task)**:
   - Add settings dropdown to JobDashboard with 2 menu items

6. **Integration & Testing (3 tasks)**:
   - Test first-time user flow (welcome → tutorial → setup → dashboard)
   - Test returning user flow (skip welcome → dashboard)
   - Test tutorial replay from settings menu

7. **Accessibility & Polish (2 tasks)**:
   - Add ARIA labels and keyboard navigation
   - Mobile responsive testing (viewport ≥ 320px)

8. **Performance Validation (1 task)**:
   - Verify page load <2s, transitions ≤300ms, operations <50ms

### Ordering Strategy

**Phase-Based Ordering**:
1. **Phase 1: Preparation** (Types and utilities) [P]
2. **Phase 2: New Components** (WelcomePage, GuidedTutorial) [P]
3. **Phase 3: Modifications** (App.tsx routing first, then DatabaseSettings and JobDashboard)
4. **Phase 4: Integration** (End-to-end testing)
5. **Phase 5: Polish** (Accessibility, mobile, performance) [P]

**Parallelization**:
- Mark `[P]` for independent tasks (types, utilities, accessibility tests)
- Sequential for dependent tasks (routing before integration, components before routing)

**Dependency Chain**:
```
Types/Utils [P]
  ↓
WelcomePage [P] + GuidedTutorial [P]
  ↓
App.tsx routing
  ↓
DatabaseSettings simplification [P] + JobDashboard settings menu [P]
  ↓
Integration tests
  ↓
Accessibility [P] + Mobile [P] + Performance [P]
```

### Estimated Output

**12-14 numbered, ordered tasks** in tasks.md format:
- T001-T002: Preparation (types, utilities)
- T003-T004: New components (WelcomePage, GuidedTutorial)
- T005: Routing logic (App.tsx)
- T006-T007: Modifications (DatabaseSettings, JobDashboard)
- T008-T010: Integration testing (3 flows)
- T011-T014: Polish (accessibility, mobile, performance)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run quickstart.md scenarios, performance validation)

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations to track** - This feature passes all constitutional checks.

## Progress Tracking

*This checklist is updated during execution flow*

### Phase Status

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

### Gate Status

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no violations)

### Artifacts Completed

- [x] spec.md (from /specify command)
- [x] research.md (Phase 0)
- [x] data-model.md (Phase 1)
- [x] contracts/ui-components.contract.md (Phase 1)
- [x] quickstart.md (Phase 1)
- [x] CLAUDE.md updated (Phase 1)
- [x] plan.md (this file)
- [ ] tasks.md (awaiting /tasks command)

---

**Ready for /tasks command** - All planning complete. Next step: Generate implementation tasks.

*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
