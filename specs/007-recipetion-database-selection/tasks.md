# Tasks: Welcome Homepage and Database Setup Redesign

**Input**: Design documents from `/specs/007-recipetion-database-selection/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Found: Tech stack (React 18, TypeScript 5.0+, localStorage)
   → ✅ Extract: No new dependencies, frontend-only changes
2. Load optional design documents:
   → ✅ data-model.md: OnboardingState, TutorialContent entities
   → ✅ contracts/: ui-components.contract.md (4 component contracts)
   → ✅ research.md: Custom tutorial implementation, routing strategy
   → ✅ quickstart.md: 20 test scenarios
3. Generate tasks by category:
   → Setup: TypeScript types, utility functions
   → Tests: Manual testing via quickstart.md (no automated tests)
   → Core: 2 new components, 3 modified components
   → Integration: Routing logic, state management
   → Polish: Accessibility, mobile responsive, performance
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Frontend-only, no TDD requirement (manual testing)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✅ All contracts have implementation tasks
   → ✅ All entities have state management tasks
   → ✅ All test scenarios in quickstart.md
9. Return: SUCCESS (14 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
**Web app (monorepo)**: `platform/core/src/frontend/`
- Pages: `platform/core/src/frontend/pages/`
- Components: `platform/core/src/frontend/components/`
- Utils: `platform/core/src/frontend/utils/`
- Types: `platform/core/src/frontend/types.ts`

---

## Phase 3.1: Preparation & Type Definitions

### T001 [P] Add TypeScript types for onboarding state management
**File**: `platform/core/src/frontend/types.ts`

**Description**: Add TypeScript interfaces for onboarding state and tutorial content to existing types.ts file.

**Requirements**:
- Add `OnboardingState` interface:
  ```typescript
  export interface OnboardingState {
    databaseConfigured: boolean
    tutorialStatus: 'not_started' | 'in_progress' | 'completed'
    currentStep?: number
    lastUpdated: string
  }
  ```
- Add `TutorialStep` interface:
  ```typescript
  export interface TutorialStep {
    id: number
    title: string
    content: string
    target?: string
    position: 'center' | 'top' | 'bottom' | 'left' | 'right'
    icon?: string
  }
  ```

**Acceptance Criteria**:
- Types compile without errors
- Exported from types.ts for use in other files
- Compatible with existing DatabaseConfig type

**Reference**: `data-model.md` sections 1-3

---

### T002 [P] Create onboarding state management utility
**File**: `platform/core/src/frontend/utils/onboarding.ts`

**Description**: Create utility functions for managing onboarding state in localStorage.

**Requirements**:
- Implement 5 functions per `contracts/ui-components.contract.md`:
  1. `getOnboardingState(): OnboardingState | null` - Read from localStorage
  2. `saveOnboardingState(state: OnboardingState): void` - Write to localStorage
  3. `initializeOnboardingState(): OnboardingState` - Create initial state, check if database exists
  4. `updateTutorialProgress(currentStep: number | undefined, status: string): void` - Update tutorial state
  5. `markDatabaseConfigured(): void` - Set databaseConfigured = true

**Implementation Details**:
- localStorage key: `'onboardingState'`
- Handle JSON parse errors gracefully (return null on error)
- Initialize with `databaseConfigured: !!getStoredDatabaseConfig()` (check existing DB config)
- Always update `lastUpdated` timestamp to `new Date().toISOString()`

**Acceptance Criteria**:
- All 5 functions implemented and exported
- Graceful error handling for corrupted localStorage data
- TypeScript types from T001 used correctly
- Import `getStoredDatabaseConfig` from `./api-client`

**Reference**: `contracts/ui-components.contract.md` Function Contracts section, `data-model.md` OnboardingState

---

### T003 [P] Create tutorial content provider utility
**File**: `platform/core/src/frontend/utils/tutorial-steps.ts`

**Description**: Create static tutorial content for welcome page and dashboard replay.

**Requirements**:
- Implement 2 functions:
  1. `getWelcomeTutorialSteps(): TutorialStep[]` - Returns 4 steps for welcome page
  2. `getDashboardTutorialSteps(): TutorialStep[]` - Returns 4 steps for dashboard replay

**Tutorial Content** (from `data-model.md` section 3):
```typescript
export function getWelcomeTutorialSteps(): TutorialStep[] {
  return [
    {
      id: 0,
      title: "Welcome to Job Tracker",
      content: "Track all your job applications in one organized place. Manage applications, upload documents, and monitor your job search progress.",
      position: "center"
    },
    {
      id: 1,
      title: "Key Features",
      content: "• Track application status and timeline\n• Store resumes and cover letters\n• Monitor interview schedules and deadlines",
      target: ".feature-cards",
      position: "bottom"
    },
    {
      id: 2,
      title: "Database Setup",
      content: "We recommend using Supabase for easy PostgreSQL setup. It's free to start and requires just a connection string.",
      target: ".supabase-recommendation",
      position: "top"
    },
    {
      id: 3,
      title: "Get Started",
      content: "Click 'Custom Database Setup' below to configure your database and start tracking applications.",
      target: ".setup-button",
      position: "top"
    }
  ]
}
```

**Acceptance Criteria**:
- Both functions return TutorialStep[] arrays
- Welcome tutorial has 4 steps
- Dashboard tutorial has same 4 steps (reusable content)
- CSS selectors match elements that will be created in WelcomePage component

**Reference**: `data-model.md` section 3 (TutorialContent), `research.md` section 7

---

## Phase 3.2: Core Components (New)

### T004 [P] Create GuidedTutorial component
**File**: `platform/core/src/frontend/components/GuidedTutorial.tsx`

**Description**: Create interactive tutorial overlay component with tooltip navigation.

**Requirements** (from `contracts/ui-components.contract.md`):
- Props interface:
  ```typescript
  interface GuidedTutorialProps {
    steps: TutorialStep[]
    isActive: boolean
    onComplete: () => void
    onDismiss?: () => void
  }
  ```
- State management:
  ```typescript
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isVisible, setIsVisible] = useState<boolean>(isActive)
  ```
- Render elements:
  1. Semi-transparent overlay (`backgroundColor: 'rgba(0, 0, 0, 0.5)'`, `position: 'fixed'`, full viewport)
  2. Tooltip box with:
     - Title showing progress: `"Step ${currentStep + 1} of ${steps.length}"`
     - Content text from current step
     - "Previous" button (disabled on step 0)
     - "Next" button (changes to "Finish" on last step)
     - "Skip Tutorial" button
     - Close button (X) in top-right corner
  3. Arrow pointing to target element (if `step.target` specified)
  4. Highlight ring around target element

**Positioning Logic**:
```typescript
const calculateTooltipPosition = (target?: string, position?: string) => {
  if (!target) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }
  const element = document.querySelector(target)
  if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  const rect = element.getBoundingClientRect()
  // Position tooltip based on 'top' | 'bottom' | 'left' | 'right'
  // Add 16px spacing from target element
}
```

**Navigation Logic**:
- Previous: `setCurrentStep(prev => Math.max(0, prev - 1))`
- Next: `setCurrentStep(prev => prev + 1)` or call `onComplete()` if last step
- Skip/Close: call `onComplete()` immediately
- Escape key: call `onDismiss?.()` or `onComplete()`

**Styling** (match existing design from `research.md` section 3):
- Tooltip box: white background, `borderRadius: '12px'`, `boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'`
- Buttons: Primary blue for Next, gray for Previous/Skip
- Typography: Same as DatabaseSettings (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)

**Accessibility** (from `contracts/ui-components.contract.md`):
- `role="dialog"` on tooltip
- `aria-labelledby="tutorial-title"` and `aria-describedby="tutorial-content"`
- `aria-live="polite"` region for step changes
- Focus trap within dialog (Tab cycles through buttons)
- Return focus to trigger element on close

**Acceptance Criteria**:
- Component renders nothing if `isActive` is false
- All 4 navigation buttons work correctly
- Tooltip positioned correctly (center or near target)
- Escape key closes tutorial
- Smooth transitions between steps (300ms fade)
- ARIA labels present and correct

**Reference**: `contracts/ui-components.contract.md` section 2, `research.md` section 2, `quickstart.md` scenarios 2-6

---

### T005 [P] Create WelcomePage component
**File**: `platform/core/src/frontend/pages/WelcomePage.tsx`

**Description**: Create welcome page for first-time users with tutorial launch and database setup options.

**Requirements** (from `contracts/ui-components.contract.md`):
- Props interface:
  ```typescript
  interface WelcomePageProps {
    onGetStarted: () => void
    onSkipToSetup: () => void
  }
  ```
- Layout structure (from `research.md` section 3):
  1. **Header Section**:
     - App title: "Job Tracker"
     - Tagline: "Track your job applications in one place"
  2. **Hero Section**:
     - Welcome message (2-3 sentences)
     - 3 feature cards with icons and text:
       - "Track Applications" - Monitor status and timeline
       - "Store Documents" - Upload resumes and cover letters
       - "Analytics Dashboard" - View job search insights
  3. **Supabase Recommendation Box** (className="supabase-recommendation"):
     - Title: "Recommended: Use Supabase"
     - Instructions: "1) Sign up at supabase.com  2) Copy your connection string"
     - Link to https://supabase.com (opens in new tab)
  4. **Primary CTA**:
     - "Get Started" button (className="setup-button")
     - Prominent styling (blue background, large, centered)
     - Calls `onGetStarted()` on click
  5. **Secondary Option**:
     - "Custom Database Setup" link
     - Smaller, below primary button
     - Calls `onSkipToSetup()` on click

**Styling** (match DatabaseSettings from `research.md` section 3):
- Background: `#f5f5f5`
- Cards: White background, `borderRadius: '12px'`, `padding: '24px'`
- Box shadow: `'0 2px 8px rgba(0, 0, 0, 0.1)'`
- Typography: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Feature cards: Display as grid (3 columns on desktop, 1 column on mobile)
- Supabase box: Light blue background (`#f0f9ff`), border (`#e0f2fe`)

**Accessibility**:
- `<main>` landmark for page content
- `<h1>` for title, `<h2>` for sections
- Buttons have descriptive labels
- Keyboard navigation: Tab order (Get Started → Custom Database Setup)
- Link to Supabase has `rel="noopener noreferrer"`

**Acceptance Criteria**:
- All 5 sections render correctly
- Feature cards have className="feature-cards" for tutorial targeting
- Supabase box has className="supabase-recommendation" for tutorial targeting
- Buttons call correct callbacks
- Responsive design (stacks on mobile, viewport ≥ 320px)
- Visual consistency with existing pages

**Reference**: `contracts/ui-components.contract.md` section 1, `research.md` section 3, `spec.md` UI Requirements section, `quickstart.md` scenario 1

---

## Phase 3.3: Component Modifications

### T006 Update App.tsx with conditional routing based on onboarding state
**File**: `platform/core/src/frontend/App.tsx`

**Description**: Add conditional routing logic to show WelcomePage for first-time users or JobDashboard for returning users.

**Requirements** (from `research.md` section 6):
- Import new components and utilities:
  ```typescript
  import WelcomePage from './pages/WelcomePage'
  import GuidedTutorial from './components/GuidedTutorial'
  import { getOnboardingState, initializeOnboardingState, saveOnboardingState, updateTutorialProgress } from './utils/onboarding'
  import { getWelcomeTutorialSteps } from './utils/tutorial-steps'
  ```
- Add state for tutorial management:
  ```typescript
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false)
  ```
- Modify `useEffect` hook (lines 19-33) to check onboarding state:
  ```typescript
  useEffect(() => {
    const dbConfig = getStoredDatabaseConfig()
    const onboardingState = getOnboardingState() || initializeOnboardingState()

    if (!dbConfig) {
      console.log('⚠️ No database configuration found, showing welcome page')
      setNeedsDatabaseSetup(true)
      setLoading(false)
      return
    }

    console.log('✅ Database config found, fetching modules...')
    fetchModules()
  }, [])
  ```
- Replace database setup check (lines 103-117) with WelcomePage:
  ```typescript
  if (needsDatabaseSetup) {
    return (
      <>
        <WelcomePage
          onGetStarted={() => {
            setShowWelcomeTutorial(true)
            updateTutorialProgress(0, 'in_progress')
          }}
          onSkipToSetup={() => {
            setView('settings')
            setNeedsDatabaseSetup(false)
          }}
        />
        {showWelcomeTutorial && (
          <GuidedTutorial
            steps={getWelcomeTutorialSteps()}
            isActive={true}
            onComplete={() => {
              setShowWelcomeTutorial(false)
              updateTutorialProgress(undefined, 'completed')
            }}
            onDismiss={() => {
              setShowWelcomeTutorial(false)
              updateTutorialProgress(undefined, 'completed')
            }}
          />
        )}
      </>
    )
  }
  ```

**Acceptance Criteria**:
- First-time users (no database config) see WelcomePage
- Returning users (with database config) see JobDashboard
- "Get Started" button launches tutorial overlay
- "Custom Database Setup" navigates to DatabaseSettings
- Tutorial completion updates onboarding state
- No errors in console
- Existing functionality preserved

**Reference**: `research.md` section 6, `contracts/ui-components.contract.md` sections 1-2, `quickstart.md` scenarios 1, 7, 9

---

### T007 [P] Simplify DatabaseSettings page (remove providers, default to connection string)
**File**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`

**Description**: Remove recommended providers section and default to connection string input.

**Requirements** (from `research.md` section 5):
1. **Remove lines 545-673**: Entire "Recommended Providers" section
2. **Remove lines 66-103**: `providers` array constant (no longer needed)
3. **Change line 29**: Default `useConnectionString` to true:
   ```typescript
   const [useConnectionString, setUseConnectionString] = useState(true)
   ```
4. **Remove lines 692-743**: Connection string toggle checkbox (always use connection string)
5. **Keep unchanged**:
   - Connection string input (lines 745-770)
   - Connection string history dropdown (lines 779-816)
   - SSL checkbox (lines 970-986)
   - Test Connection button (lines 994-1010)
   - Save Configuration button (lines 1012-1026)
   - All validation and state management logic

**Simplified Layout**:
```
┌─────────────────────────────────────┐
│ [← Back] Database Configuration     │
├─────────────────────────────────────┤
│ Database Connection String          │
│ [Password input with placeholder]   │
│ [Recent Connections Dropdown]       │
│                                     │
│ ☑ Use SSL connection (recommended)  │
│                                     │
│ [Test Connection] [Save Config]     │
└─────────────────────────────────────┘
```

**Acceptance Criteria**:
- Providers section completely removed (~130 lines deleted)
- Connection string input is the only option (no toggle)
- Connection string history dropdown still works
- Test connection and save functionality unchanged
- Page renders correctly with simplified layout
- No visual regressions
- No console errors

**Reference**: `research.md` section 5, `contracts/ui-components.contract.md` section 3, `quickstart.md` scenario 7

---

### T008 [P] Add settings menu to JobDashboard with database config and tutorial replay
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`

**Description**: Add settings dropdown menu to dashboard header with "Database Configuration" and "View Tutorial" options.

**Requirements** (from `contracts/ui-components.contract.md` section 4):
- Import tutorial components:
  ```typescript
  import GuidedTutorial from '../components/GuidedTutorial'
  import { getDashboardTutorialSteps } from '../utils/tutorial-steps'
  ```
- Add state:
  ```typescript
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false)
  ```
- Add settings button to header (top-right corner):
  ```typescript
  <div style={{ position: 'relative' }}>
    <button
      onClick={() => setShowSettingsMenu(!showSettingsMenu)}
      aria-label="Settings"
      aria-expanded={showSettingsMenu}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      ⚙️ Settings
    </button>

    {showSettingsMenu && (
      <div
        role="menu"
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          minWidth: '200px',
          zIndex: 1000
        }}
      >
        <button
          role="menuitem"
          onClick={() => {
            setShowSettingsMenu(false)
            onNavigateToSettings()
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Database Configuration
        </button>
        <button
          role="menuitem"
          onClick={() => {
            setShowSettingsMenu(false)
            setShowTutorialOverlay(true)
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            borderTop: '1px solid #f3f4f6'
          }}
        >
          View Tutorial
        </button>
      </div>
    )}
  </div>
  ```
- Add tutorial overlay at end of return statement:
  ```typescript
  {showTutorialOverlay && (
    <GuidedTutorial
      steps={getDashboardTutorialSteps()}
      isActive={true}
      onComplete={() => setShowTutorialOverlay(false)}
      onDismiss={() => setShowTutorialOverlay(false)}
    />
  )}
  ```
- Add click-outside handler to close menu:
  ```typescript
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('[aria-label="Settings"]') && !target.closest('[role="menu"]')) {
          setShowSettingsMenu(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSettingsMenu])
  ```

**Accessibility**:
- Settings button has `aria-label="Settings"`
- Menu has `role="menu"`
- Menu items have `role="menuitem"`
- Escape key closes menu

**Acceptance Criteria**:
- Settings button visible in dashboard header (top-right)
- Dropdown menu appears on click
- "Database Configuration" navigates to settings page
- "View Tutorial" launches tutorial overlay
- Tutorial plays on dashboard (not navigate to welcome page)
- Click outside closes menu
- Escape key closes menu
- No localStorage updates when replaying tutorial

**Reference**: `contracts/ui-components.contract.md` section 4, `research.md` section 8, `quickstart.md` scenarios 10-11

---

## Phase 3.4: Integration & Testing

### T009 Test first-time user flow (welcome → tutorial → setup → dashboard)
**Manual Testing Task** - Execute quickstart.md scenarios 1-8

**Description**: Validate complete onboarding flow for new users.

**Test Scenarios**:
1. **Scenario 1**: First-time user - welcome page display
   - Clear localStorage
   - Navigate to app
   - Verify WelcomePage renders with all elements
2. **Scenario 2**: Interactive tutorial launch
   - Click "Get Started" button
   - Verify tutorial overlay appears
   - Check localStorage: `tutorialStatus: 'in_progress'`
3. **Scenario 3**: Tutorial navigation (all 4 steps)
   - Click "Next" through all steps
   - Verify content and positioning for each step
4. **Scenario 4**: Tutorial completion
   - Complete tutorial or click "Finish"
   - Verify tutorial closes
   - Check localStorage: `tutorialStatus: 'completed'`
5. **Scenario 5**: Tutorial skip
   - Launch tutorial, click "Skip Tutorial"
   - Verify tutorial closes immediately
   - Check localStorage updated
6. **Scenario 6**: Tutorial dismissal (Escape key)
   - Launch tutorial, press Escape
   - Verify tutorial closes
7. **Scenario 7**: Custom database setup navigation
   - Click "Custom Database Setup" link
   - Verify DatabaseSettings page shown
8. **Scenario 8**: Database configuration - successful connection
   - Enter valid connection string
   - Click "Test Connection"
   - Verify success message and localStorage updated

**Acceptance Criteria**:
- All 8 scenarios pass
- localStorage state transitions correct
- No console errors
- Visual consistency maintained
- Navigation works smoothly

**Reference**: `quickstart.md` scenarios 1-8

---

### T010 Test returning user flow (skip welcome → dashboard)
**Manual Testing Task** - Execute quickstart.md scenario 9

**Description**: Validate that users with existing database configuration bypass welcome page.

**Test Scenario**:
1. **Scenario 9**: Returning user - skip welcome page
   - Ensure localStorage has `databaseConfig`
   - Refresh page
   - Verify JobDashboard shown immediately (not WelcomePage)
   - Check `onboardingState.databaseConfigured: true`

**Acceptance Criteria**:
- Welcome page NOT shown
- Dashboard loads directly
- No flicker or delay
- Database connection works

**Reference**: `quickstart.md` scenario 9

---

### T011 Test tutorial replay from settings menu
**Manual Testing Task** - Execute quickstart.md scenarios 10-11

**Description**: Validate settings menu and tutorial replay functionality.

**Test Scenarios**:
1. **Scenario 10**: Settings menu - database configuration
   - On JobDashboard, click settings icon
   - Click "Database Configuration"
   - Verify navigation to DatabaseSettings
   - Verify current config pre-filled
2. **Scenario 11**: Settings menu - view tutorial (replay)
   - On JobDashboard, click settings icon
   - Click "View Tutorial"
   - Verify tutorial overlay appears on dashboard
   - Complete tutorial
   - Verify no localStorage changes (replay doesn't update state)
   - Verify returns to dashboard (no navigation)

**Acceptance Criteria**:
- Settings menu accessible and works
- Both menu options functional
- Tutorial replay doesn't affect onboarding state
- No navigation on tutorial replay

**Reference**: `quickstart.md` scenarios 10-11

---

## Phase 3.5: Accessibility & Polish

### T012 [P] Add ARIA labels and keyboard navigation
**Files**: All components (WelcomePage, GuidedTutorial, JobDashboard settings menu)

**Description**: Ensure WCAG 2.1 AA compliance with proper ARIA labels and keyboard navigation.

**Requirements** (from `contracts/ui-components.contract.md` Accessibility Testing):
1. **WelcomePage**:
   - Add `<main>` landmark
   - Proper heading hierarchy (`<h1>` for title, `<h2>` for sections)
   - Buttons have descriptive `aria-label` attributes
   - Tab order: Get Started → Custom Database Setup

2. **GuidedTutorial**:
   - `role="dialog"` on tooltip
   - `aria-labelledby="tutorial-title"`
   - `aria-describedby="tutorial-content"`
   - `aria-live="polite"` for step changes
   - Focus trap within dialog
   - Return focus to trigger on close
   - Escape key handler

3. **JobDashboard Settings Menu**:
   - Settings button: `aria-label="Settings"`, `aria-expanded`
   - Menu: `role="menu"`
   - Menu items: `role="menuitem"`
   - Escape key closes menu
   - Arrow keys navigate menu items (optional enhancement)

**Manual Testing** (quickstart.md scenarios 16-17):
- **Scenario 16**: Keyboard navigation
  - Tab through all controls
  - Enter/Space activates buttons
  - Escape closes dialogs
  - Focus indicators visible
- **Scenario 17**: Screen reader
  - Enable VoiceOver/NVDA
  - Navigate through controls
  - Verify announcements clear

**Acceptance Criteria**:
- All ARIA labels present and correct
- Full keyboard navigation support
- Focus indicators visible
- Screen reader announces changes
- No accessibility errors in DevTools Lighthouse

**Reference**: `contracts/ui-components.contract.md` Accessibility Testing, `research.md` section 10, `quickstart.md` scenarios 16-17

---

### T013 [P] Mobile responsive testing and adjustments
**Files**: WelcomePage.tsx, GuidedTutorial.tsx

**Description**: Ensure responsive design works on mobile devices (viewport ≥ 320px).

**Requirements** (from spec.md NFR-004):
- Test with DevTools viewport: 320px, 375px, 768px, 1024px widths
- **WelcomePage**:
  - Feature cards stack vertically on mobile (1 column)
  - Buttons full-width on mobile, centered on desktop
  - Text readable without zooming
  - No horizontal scrolling
- **GuidedTutorial**:
  - Tooltip fits on screen (no overflow)
  - Buttons touch-friendly (min 44×44px)
  - Overlay covers full viewport on mobile
  - Arrow positioning adjusts for small screens

**Manual Testing** (quickstart.md scenario 18):
- Open in mobile viewport (DevTools or real device)
- Test all interactions (tap buttons, navigate tutorial)
- Verify layout doesn't break

**Responsive CSS**:
```typescript
// Example for feature cards
display: 'grid',
gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
gap: '16px'
```

**Acceptance Criteria**:
- Works on 320px viewport (minimum)
- Touch targets ≥ 44×44px
- No horizontal scrolling
- All content readable
- Buttons accessible on mobile

**Reference**: `spec.md` NFR-004, `quickstart.md` scenario 18

---

### T014 [P] Performance validation and optimization
**Manual Testing Task** - Execute quickstart.md scenario 20

**Description**: Verify performance metrics meet requirements.

**Requirements** (from spec.md Non-Functional Requirements):
- **NFR-001**: Homepage load < 2 seconds
- **NFR-002**: Page transitions ≤ 300ms
- Custom target: Tutorial step transitions < 50ms

**Performance Testing** (quickstart.md scenario 20):
1. Open DevTools Performance tab
2. Record performance profile
3. Measure:
   - WelcomePage initial render time
   - Tutorial launch time
   - Step transition time (click Next)
   - Opacity fade animation duration
   - localStorage read/write operations

**Expected Metrics**:
- WelcomePage renders in <100ms (static content, no API calls)
- Tutorial launches in <50ms
- Step transitions: <50ms
- Fade animation: 300ms (CSS transition)
- localStorage ops: <5ms

**Optimization Opportunities** (if needed):
- Use `React.memo()` for static components
- Debounce tutorial step changes
- Optimize CSS transitions (use `transform` and `opacity` only)

**Acceptance Criteria**:
- All operations within target times
- Smooth animations (60 FPS)
- No UI lag or jank
- No unnecessary re-renders (check with React DevTools Profiler)

**Reference**: `spec.md` NFR-001, NFR-002, `research.md` section 9, `quickstart.md` scenario 20

---

## Dependencies

```
Preparation Tasks (T001-T003) [P]
  ↓
New Components (T004-T005) [P]
  ↓
App.tsx Routing (T006)
  ↓
Component Modifications (T007-T008) [P]
  ↓
Integration Testing (T009-T011)
  ↓
Polish (T012-T014) [P]
```

**Blocking Dependencies**:
- T001 blocks all tasks (types needed everywhere)
- T002-T003 block T004-T005 (utilities needed by components)
- T004-T005 block T006 (components must exist before importing in App.tsx)
- T006 blocks T009-T011 (routing must work before testing flows)
- T007-T008 can run in parallel (different files)
- T009-T011 sequential (testing different flows)
- T012-T014 can run in parallel (independent polish tasks)

---

## Parallel Execution Examples

### Phase 3.1: Launch all preparation tasks together
```bash
# Run T001-T003 in parallel (3 different files)
Task: "Add TypeScript types for onboarding state management"
Task: "Create onboarding state management utility"
Task: "Create tutorial content provider utility"
```

### Phase 3.2: Launch new components in parallel
```bash
# Run T004-T005 in parallel (2 different files)
Task: "Create GuidedTutorial component"
Task: "Create WelcomePage component"
```

### Phase 3.3: Launch modifications in parallel (after T006 completes)
```bash
# Run T007-T008 in parallel (2 different files)
Task: "Simplify DatabaseSettings page (remove providers, default to connection string)"
Task: "Add settings menu to JobDashboard with database config and tutorial replay"
```

### Phase 3.5: Launch polish tasks in parallel
```bash
# Run T012-T014 in parallel (independent tasks)
Task: "Add ARIA labels and keyboard navigation"
Task: "Mobile responsive testing and adjustments"
Task: "Performance validation and optimization"
```

---

## Notes

### [P] Task Guidelines
- **[P] tasks** = different files, no dependencies
- Can run simultaneously via multiple Task agents
- Example: T001 (types.ts), T002 (onboarding.ts), T003 (tutorial-steps.ts) - all different files

### Non-[P] Tasks
- Sequential execution required
- Example: T006 (App.tsx routing) must complete before T009-T011 (integration tests)

### Testing Approach
- **No automated tests** - Manual testing via `quickstart.md`
- 20 comprehensive test scenarios cover all functionality
- Edge cases included (localStorage errors, corrupted data)
- Accessibility and performance validation required

### Commit Strategy
- Commit after each task completion
- Use descriptive messages: `feat: add GuidedTutorial component (T004)`
- Test manually before committing

### Avoid
- Vague task descriptions - each task specifies exact files and requirements
- Same file conflicts - only T006 and T007-T008 modify same files (sequential ordering prevents conflicts)
- Skipping accessibility - T012 is mandatory before completion

---

## Task Generation Rules Applied

1. **From Contracts** (`contracts/ui-components.contract.md`):
   - WelcomePage contract → T005 (implementation)
   - GuidedTutorial contract → T004 (implementation)
   - DatabaseSettings modifications → T007 (simplification)
   - JobDashboard modifications → T008 (settings menu)
   - Utility functions → T002-T003 (onboarding, tutorial-steps)

2. **From Data Model** (`data-model.md`):
   - OnboardingState entity → T001 (types), T002 (state management)
   - TutorialContent entity → T003 (content provider)
   - State transitions → T006 (routing logic)

3. **From User Stories** (`spec.md` + `quickstart.md`):
   - First-time user flow → T009 (scenarios 1-8)
   - Returning user flow → T010 (scenario 9)
   - Tutorial replay flow → T011 (scenarios 10-11)

4. **Ordering**:
   - Setup (T001-T003) → Components (T004-T005) → Routing (T006) → Modifications (T007-T008) → Testing (T009-T011) → Polish (T012-T014)

---

## Validation Checklist

*GATE: Verify before marking feature as complete*

- [x] All contracts have corresponding implementation tasks
  - WelcomePage: T005 ✅
  - GuidedTutorial: T004 ✅
  - DatabaseSettings modifications: T007 ✅
  - JobDashboard modifications: T008 ✅
  - Utility functions: T002-T003 ✅
- [x] All entities have state management tasks
  - OnboardingState: T001 (types), T002 (utils) ✅
  - TutorialContent: T003 (content provider) ✅
- [x] All test scenarios covered
  - 20 scenarios in quickstart.md mapped to T009-T014 ✅
- [x] Parallel tasks truly independent
  - T001-T003: Different files ✅
  - T004-T005: Different files ✅
  - T007-T008: Different files ✅
  - T012-T014: Independent polish tasks ✅
- [x] Each task specifies exact file path
  - All tasks include absolute file paths ✅
- [x] No task modifies same file as another [P] task
  - T006 (App.tsx) sequential before T009-T011 ✅
  - No [P] conflicts ✅

---

**Status**: ✅ Ready for execution - 14 tasks generated, all validation checks passed

**Next Step**: Begin implementation with Phase 3.1 (T001-T003) in parallel
