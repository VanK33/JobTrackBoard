# UI Components Contracts

## Component Interfaces

### 1. WelcomePage Component

**Purpose**: First-time user onboarding page with tutorial launch and database setup

**File**: `platform/core/src/frontend/pages/WelcomePage.tsx`

**Props Interface**:
```typescript
interface WelcomePageProps {
  // Called when user clicks "Get Started" button (launches tutorial)
  onGetStarted: () => void

  // Called when user clicks "Custom Database Setup" link (skip tutorial)
  onSkipToSetup: () => void
}
```

**Render Contract**:
```typescript
function WelcomePage({ onGetStarted, onSkipToSetup }: WelcomePageProps): JSX.Element {
  // MUST render:
  // 1. Header with app title and tagline
  // 2. Hero section with 2-3 feature cards
  // 3. Supabase recommendation box
  // 4. "Get Started" button (primary CTA)
  // 5. "Custom Database Setup" link (secondary)

  // MUST NOT:
  // - Make API calls
  // - Modify localStorage directly
  // - Handle tutorial state (delegated to GuidedTutorial)
}
```

**Visual Requirements**:
- Background: `#f5f5f5`
- Card style: White background, `borderRadius: '12px'`, `boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'`
- Typography: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Responsive: Mobile-friendly (viewport >= 320px)

**Accessibility**:
- `<main>` landmark for page content
- Heading hierarchy: `<h1>` for title, `<h2>` for sections
- Buttons have descriptive `aria-label` attributes
- Keyboard navigable (Tab order: Get Started → Custom Database Setup)

---

### 2. GuidedTutorial Component

**Purpose**: Interactive tooltip-based tutorial overlay

**File**: `platform/core/src/frontend/components/GuidedTutorial.tsx`

**Props Interface**:
```typescript
interface GuidedTutorialProps {
  // Array of tutorial steps to display
  steps: TutorialStep[]

  // Called when tutorial is completed (last step or skipped)
  onComplete: () => void

  // Called when tutorial is dismissed without completion
  onDismiss?: () => void

  // Whether tutorial is initially active
  isActive: boolean
}

interface TutorialStep {
  id: number
  title: string
  content: string
  target?: string  // CSS selector for element to highlight
  position: 'center' | 'top' | 'bottom' | 'left' | 'right'
}
```

**State Management**:
```typescript
const [currentStep, setCurrentStep] = useState<number>(0)
const [isVisible, setIsVisible] = useState<boolean>(isActive)
```

**Render Contract**:
```typescript
function GuidedTutorial({ steps, onComplete, onDismiss, isActive }: GuidedTutorialProps): JSX.Element | null {
  // IF not isActive: return null

  // MUST render:
  // 1. Semi-transparent overlay (backdrop)
  // 2. Tooltip box with:
  //    - Title (e.g., "Step 2 of 4")
  //    - Content text
  //    - Navigation buttons (Previous, Next, Skip)
  //    - Close button (X)
  // 3. Arrow pointing to target element (if target specified)
  // 4. Highlight/focus ring around target element

  // MUST handle:
  // - Previous button: disabled on first step
  // - Next button: calls onComplete() on last step
  // - Skip button: calls onComplete() immediately
  // - Close (X): calls onDismiss() or onComplete()
  // - Escape key: calls onDismiss() or onComplete()
  // - Click outside: no action (tutorial stays active)
}
```

**Positioning Logic**:
```typescript
function calculateTooltipPosition(target: string | undefined, position: string): CSSProperties {
  if (!target) {
    // Center of screen
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const element = document.querySelector(target)
  if (!element) {
    // Fallback to center if target not found
    return { ... }
  }

  const rect = element.getBoundingClientRect()
  // Calculate position based on 'top' | 'bottom' | 'left' | 'right'
  // Return { top, left } pixel values
}
```

**Accessibility**:
- `role="dialog"` on tooltip
- `aria-labelledby` pointing to title
- `aria-describedby` pointing to content
- `aria-live="polite"` for step changes
- Focus trap within dialog
- Escape key dismisses

---

### 3. DatabaseSettings Component (Modified)

**Purpose**: Simplified database configuration page (remove recommendations)

**File**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`

**Props Interface** (no changes):
```typescript
interface DatabaseSettingsProps {
  onNavigateBack?: () => void
}
```

**Modifications Required**:
```typescript
function DatabaseSettings({ onNavigateBack }: DatabaseSettingsProps): JSX.Element {
  // REMOVE:
  // - Lines 545-673: Recommended providers section
  // - Providers array (lines 66-103)

  // CHANGE:
  // - Default useConnectionString to true (line 29: useState(true))
  // - Remove toggle for connection string (make it always active)

  // KEEP:
  // - Connection string input (lines 745-770)
  // - Connection string history dropdown (lines 779-816)
  // - SSL checkbox (lines 970-986)
  // - Test Connection button (lines 994-1010)
  // - Save Configuration button (lines 1012-1026)
  // - All validation and state management logic
}
```

**Visual Changes**:
- Simplified layout: No provider cards
- Connection string input is primary (not hidden behind toggle)
- Cleaner, more focused UI

---

### 4. JobDashboard Component (Settings Menu Addition)

**Purpose**: Add settings menu with "Database Configuration" and "View Tutorial" options

**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`

**Props Interface** (existing):
```typescript
interface JobDashboardProps {
  onNavigateToSettings: () => void
}
```

**New State**:
```typescript
const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false)
const [showTutorialOverlay, setShowTutorialOverlay] = useState<boolean>(false)
```

**Header Addition**:
```typescript
// Add to dashboard header (top-right corner):
<div style={{ position: 'relative' }}>
  <button
    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
    aria-label="Settings"
    aria-expanded={showSettingsMenu}
  >
    ⚙️ Settings
  </button>

  {showSettingsMenu && (
    <div role="menu" style={{ position: 'absolute', top: '100%', right: 0 }}>
      <button role="menuitem" onClick={() => onNavigateToSettings()}>
        Database Configuration
      </button>
      <button role="menuitem" onClick={() => setShowTutorialOverlay(true)}>
        View Tutorial
      </button>
    </div>
  )}
</div>
```

**Tutorial Overlay Integration**:
```typescript
// At end of return statement:
{showTutorialOverlay && (
  <GuidedTutorial
    steps={tutorialSteps}
    isActive={true}
    onComplete={() => setShowTutorialOverlay(false)}
    onDismiss={() => setShowTutorialOverlay(false)}
  />
)}
```

**Accessibility**:
- Settings button has `aria-label="Settings"`
- Menu has `role="menu"`
- Menu items have `role="menuitem"`
- Click outside menu closes it
- Escape key closes menu

---

## Function Contracts

### 1. Onboarding State Management

**File**: `platform/core/src/frontend/utils/onboarding.ts`

```typescript
/**
 * Get onboarding state from localStorage
 * @returns OnboardingState or null if not found/invalid
 */
export function getOnboardingState(): OnboardingState | null

/**
 * Save onboarding state to localStorage
 * @param state - OnboardingState to save
 */
export function saveOnboardingState(state: OnboardingState): void

/**
 * Initialize onboarding state for new user
 * Checks if database is already configured
 * @returns Initial OnboardingState
 */
export function initializeOnboardingState(): OnboardingState

/**
 * Update tutorial progress
 * @param currentStep - Current step number (0-indexed)
 * @param status - Tutorial status
 */
export function updateTutorialProgress(
  currentStep: number | undefined,
  status: 'not_started' | 'in_progress' | 'completed'
): void

/**
 * Mark database as configured
 * Updates onboarding state
 */
export function markDatabaseConfigured(): void
```

**Example Usage**:
```typescript
// App.tsx - Initial load
const onboardingState = getOnboardingState() || initializeOnboardingState()

if (!onboardingState.databaseConfigured) {
  // Show WelcomePage
} else {
  // Show JobDashboard
}

// GuidedTutorial - Step change
updateTutorialProgress(newStep, 'in_progress')

// DatabaseSettings - Successful connection
markDatabaseConfigured()
```

---

### 2. Tutorial Steps Provider

**File**: `platform/core/src/frontend/utils/tutorial-steps.ts`

```typescript
/**
 * Get tutorial steps for welcome page
 * @returns Array of TutorialStep
 */
export function getWelcomeTutorialSteps(): TutorialStep[]

/**
 * Get tutorial steps for dashboard (shortened version)
 * @returns Array of TutorialStep
 */
export function getDashboardTutorialSteps(): TutorialStep[]
```

**Implementation**:
```typescript
export function getWelcomeTutorialSteps(): TutorialStep[] {
  return [
    {
      id: 0,
      title: "Welcome to Job Tracker",
      content: "Track all your job applications in one organized place...",
      position: "center"
    },
    // ... 3 more steps
  ]
}
```

---

## API Contracts (Backend - No Changes)

### Existing Endpoints (Reused)

**POST `/api/database/test`**
- **Input**: `DatabaseConfig` (via body and `X-Database-Config` header)
- **Output**: `{ success: boolean, tablesInitialized: boolean, error?: string }`
- **Purpose**: Validate database connection

**POST `/api/database/initialize`**
- **Input**: `DatabaseConfig`
- **Output**: `{ success: boolean, error?: string }`
- **Purpose**: Create database tables

**No new backend endpoints required** - All onboarding logic is client-side

---

## Event Contracts

### Custom Events (Optional Enhancement)

```typescript
// Dispatched when tutorial step changes
window.dispatchEvent(new CustomEvent('tutorial-step-change', {
  detail: { step: number, total: number }
}))

// Dispatched when database is configured
window.dispatchEvent(new CustomEvent('database-configured', {
  detail: { timestamp: string }
}))

// Dispatched when onboarding is completed
window.dispatchEvent(new CustomEvent('onboarding-complete', {
  detail: { tutorialCompleted: boolean, databaseConfigured: boolean }
}))
```

**Usage**: Analytics tracking, debugging, testing

---

## Testing Contracts

### Component Testing

**WelcomePage.test.tsx**:
```typescript
describe('WelcomePage', () => {
  it('renders header, hero, and CTAs', () => {
    // Assert: Title, tagline, feature cards, buttons present
  })

  it('calls onGetStarted when clicking "Get Started" button', () => {
    // Assert: Callback invoked
  })

  it('calls onSkipToSetup when clicking "Custom Database Setup"', () => {
    // Assert: Callback invoked
  })

  it('displays Supabase recommendation with link', () => {
    // Assert: Link to supabase.com present
  })
})
```

**GuidedTutorial.test.tsx**:
```typescript
describe('GuidedTutorial', () => {
  it('renders nothing when isActive is false', () => {
    // Assert: null returned
  })

  it('displays current step content', () => {
    // Assert: Step 1 of 4 title and content shown
  })

  it('navigates to next step on "Next" button click', () => {
    // Assert: currentStep incremented
  })

  it('navigates to previous step on "Previous" button click', () => {
    // Assert: currentStep decremented
  })

  it('calls onComplete when clicking "Skip Tutorial"', () => {
    // Assert: Callback invoked
  })

  it('calls onComplete when finishing last step', () => {
    // Assert: Callback invoked
  })

  it('closes on Escape key press', () => {
    // Assert: onDismiss or onComplete called
  })

  it('positions tooltip relative to target element', () => {
    // Assert: Tooltip positioned near target
  })
})
```

---

## Accessibility Testing Contract

### Manual Testing Checklist

1. **Keyboard Navigation**:
   - [ ] Tab order: Get Started → Custom Setup → Tutorial Next → Tutorial Skip
   - [ ] Enter/Space activates buttons
   - [ ] Escape closes tutorial

2. **Screen Reader Announcements**:
   - [ ] Tutorial step changes announced
   - [ ] Progress indicator ("Step 2 of 4") announced
   - [ ] Button labels clear and descriptive

3. **Focus Management**:
   - [ ] Focus trapped in tutorial dialog
   - [ ] Focus returns to trigger button on close
   - [ ] Visible focus indicators

4. **ARIA Compliance**:
   - [ ] `role="dialog"` on tutorial
   - [ ] `aria-labelledby` and `aria-describedby` present
   - [ ] `aria-live` regions for step changes

---

## Performance Testing Contract

### Metrics to Validate

1. **Initial Load**:
   - WelcomePage renders in <100ms
   - No blocking API calls

2. **Tutorial Performance**:
   - Step transitions <50ms
   - No jank during tooltip positioning
   - Smooth overlay fade (300ms)

3. **localStorage Operations**:
   - Read/write <5ms
   - No quota errors (total data <1KB)

4. **Transition Animations**:
   - Opacity fade: 300ms (CSS transition)
   - No layout thrashing

---

## Contract Summary

| Component | Input | Output | Side Effects |
|-----------|-------|--------|--------------|
| WelcomePage | onGetStarted, onSkipToSetup | JSX | None |
| GuidedTutorial | steps, isActive, onComplete | JSX or null | Updates localStorage via callbacks |
| DatabaseSettings (modified) | onNavigateBack | JSX | Saves to localStorage on test/save |
| JobDashboard (modified) | onNavigateToSettings | JSX | None (shows tutorial overlay) |
| getOnboardingState | None | OnboardingState or null | Reads localStorage |
| saveOnboardingState | OnboardingState | void | Writes localStorage |
| markDatabaseConfigured | None | void | Updates localStorage |

**All contracts are pure React components with localStorage as the only side effect.**
