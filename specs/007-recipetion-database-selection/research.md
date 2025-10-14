# Research: Welcome Homepage and Database Setup Redesign

## Phase 0: Research & Technical Decisions

### 1. Current Implementation Analysis

**Routing Logic** (`App.tsx:19-33`):
- Database config check using `getStoredDatabaseConfig()` from localStorage
- If no config: Sets `needsDatabaseSetup = true`, shows `DatabaseSettings`
- If config exists: Loads dashboard directly
- **Finding**: Already has conditional routing based on database config

**Database Configuration Storage** (`api-client.ts:15-25`, `DatabaseSettings.tsx:106-138`):
- Key: `'databaseConfig'` in localStorage
- Schema: `DatabaseConfig` type with `connectionString`, `type`, `ssl`, etc.
- **Finding**: Existing localStorage infrastructure can be reused

**Current Database Setup Page** (`DatabaseSettings.tsx`):
- Lines 545-673: Large "Recommended Providers" section with Supabase, Neon, Railway
- Lines 676-1028: Database configuration form with connection string option
- **Finding**: Contains tutorial/recommendation content that should move to welcome page

**Navigation Pattern**:
- `App.tsx:138`: Dashboard has `onNavigateToSettings={() => setView('settings')}`
- `App.tsx:149`: Settings page has `onNavigateBack={() => setView('dashboard')}`
- **Finding**: Already supports view switching via props

### 2. Interactive Tutorial Library Selection

**Decision**: Use custom implementation with React state (no external library)

**Rationale**:
- **No new dependencies** (constitutional principle)
- Tooltip implementation is straightforward: ~150 lines of React code
- Tutorial content is static (4-5 steps), doesn't need complex features
- Existing inline styling pattern works well for tooltips

**Technical Approach**:
- Component: `<GuidedTutorial steps={tutorialSteps} onComplete={callback} />`
- State: `currentStep`, `isActive`, `position`
- Rendering: Semi-transparent overlay + positioned tooltip box
- Navigation: "Next", "Previous", "Skip Tutorial" buttons
- Progress: "Step X of Y" indicator

**Alternatives Considered**:
- **react-joyride**: Popular library (23k stars), but adds 50KB+ dependency
- **intro.js**: Feature-rich but 100KB+ and requires CSS imports
- **Rejected**: Both violate "no new dependencies" principle for simple use case

### 3. Welcome Homepage Design Decisions

**Layout Structure**:
```
┌─────────────────────────────────────┐
│ Header: App Title + Tagline         │
├─────────────────────────────────────┤
│ Hero: Welcome + 3 Key Features      │
│ (icons + text cards)                │
├─────────────────────────────────────┤
│ Supabase Recommendation Box         │
│ • "Recommended: Use Supabase"       │
│ • 2-step instruction                │
│ • Link to supabase.com              │
├─────────────────────────────────────┤
│ [Get Started] ← Primary CTA         │
│ Custom Database Setup ← Secondary   │
└─────────────────────────────────────┘
```

**Visual Consistency** with existing design:
- Colors: Match `DatabaseSettings.tsx` palette (white cards, #f5f5f5 background)
- Typography: Same font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)
- Card style: `boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'`, `borderRadius: '12px'`
- Spacing: `padding: '24px'`, `gap: '16px'`

**Decision**: Reuse existing `DatabaseSettings` component styling patterns

### 4. Onboarding State Management

**localStorage Schema**:
```typescript
interface OnboardingState {
  databaseConfigured: boolean        // Matches existing databaseConfig presence
  tutorialStatus: 'not_started' | 'in_progress' | 'completed'
  currentStep?: number                // If in_progress
  lastUpdated: string                 // ISO timestamp
}
```

**Storage Key**: `'onboardingState'`

**Decision Logic**:
```javascript
// App.tsx entry point
const dbConfig = getStoredDatabaseConfig()
const onboardingState = getOnboardingState()

if (!dbConfig) {
  // First-time user: Show WelcomePage
  return <WelcomePage />
} else {
  // Returning user: Show JobDashboard
  return <JobDashboard />
}
```

**Persistence Strategy**:
- Save on each tutorial step change (useEffect)
- Save on database configuration (after successful connection)
- Clear on "Skip Tutorial" (mark as completed)
- **No server-side storage** (session-based architecture)

### 5. Database Selection Page Simplification

**Current Issues** (`DatabaseSettings.tsx`):
- Lines 545-673: 128 lines for provider recommendations
- Mixes setup guidance with configuration form
- Overwhelms users with choices before they understand the app

**Simplified Design**:
```
┌─────────────────────────────────────┐
│ [← Back] Database Configuration     │
├─────────────────────────────────────┤
│ ☑ Use connection string (default)   │
│ [Connection String Input]           │
│ [Recent Connections Dropdown]       │
│                                     │
│ ☐ Use SSL (recommended)             │
│                                     │
│ [Test Connection] [Save Config]     │
└─────────────────────────────────────┘
```

**Changes**:
1. **Remove**: Recommended providers section (move to WelcomePage)
2. **Default**: Connection string checkbox pre-checked
3. **Keep**: Connection string history dropdown (existing feature at lines 779-816)
4. **Keep**: Test connection functionality (existing at lines 189-234)
5. **Keep**: Database initialization flow (existing at lines 236-269)

**Decision**: Extract provider recommendations to WelcomePage, keep only configuration form

### 6. Routing & Navigation Flow

**New Route Structure**:
```
App.tsx (entry point)
  ├─> WelcomePage (no database config)
  │    ├─> "Get Started" → Launch tutorial
  │    └─> "Custom Database Setup" → DatabaseSettings
  │
  ├─> JobDashboard (has database config)
  │    └─> Settings menu → DatabaseSettings
  │
  └─> DatabaseSettings
       ├─> Test & save → JobDashboard
       └─> Back button → WelcomePage or JobDashboard
```

**Navigation Props**:
- `WelcomePage`: `onGetStarted`, `onSkipToSetup`
- `DatabaseSettings`: `onNavigateBack` (already exists), `onSuccess`
- `JobDashboard`: `onNavigateToSettings` (already exists)

**Transition Animation**:
- Use CSS transition: `transition: 'opacity 0.3s ease'`
- Fade out old view, fade in new view (≤ 300ms per NFR-002)
- No complex animations (maintain simplicity)

### 7. Tutorial Content Specification

**Tutorial Steps** (4 steps total):
1. **Welcome**: "Welcome to Job Tracker! Track all your job applications in one place."
2. **Features**: Highlight 3 key features (job tracking, document storage, analytics)
3. **Setup Options**: "Choose database: Supabase (recommended) or custom PostgreSQL"
4. **Next Steps**: "Click 'Custom Database Setup' to configure your database"

**Tooltip Positioning**:
- Step 1: Center of screen (no target element)
- Step 2: Arrow pointing to feature cards
- Step 3: Arrow pointing to Supabase recommendation box
- Step 4: Arrow pointing to "Custom Database Setup" button

**Progress Indicator**: "Step 2 of 4" at bottom of tooltip

**Dismissal Options**:
- "Skip Tutorial" button (marks as completed, saves to localStorage)
- "X" close button (same behavior)
- "Next" button proceeds to next step
- "Previous" button returns to prior step (if not first step)

### 8. Settings Menu Integration

**Current Dashboard** (`JobDashboard.tsx`):
- No visible settings menu in current implementation
- Uses `onNavigateToSettings` prop passed from `App.tsx:138`

**Required Changes**:
1. Add settings icon/button to dashboard header
2. Dropdown menu with:
   - "Database Configuration" → Navigate to DatabaseSettings
   - "View Tutorial" → Launch tutorial overlay on current page
3. Tutorial overlay: Same GuidedTutorial component, but positioned over dashboard

**Decision**: Add minimal settings dropdown to JobDashboard header (top-right corner)

### 9. Performance Considerations

**localStorage Operations**:
- Read on app mount: ~1ms (negligible)
- Write on state change: ~1ms
- Quota: 5-10MB per domain (our data ~1KB, well within limits)
- **Finding**: No performance concerns

**Component Rendering**:
- WelcomePage: Static content, no API calls
- Tutorial: 4 steps, minimal state changes
- Target: <100ms initial render (well below 2s requirement from NFR-001)
- **Finding**: No optimization needed

**Transition Performance**:
- Opacity fade: CSS transition (GPU-accelerated)
- No layout recalculations
- Target: 300ms (meets NFR-002)
- **Finding**: No complex animations needed

### 10. Accessibility Strategy

**Keyboard Navigation**:
- Tutorial: Tab/Shift+Tab through buttons
- "Enter" or "Space" to activate buttons
- "Escape" to dismiss tutorial
- Arrow keys for next/previous steps

**ARIA Labels**:
```tsx
<div role="dialog" aria-labelledby="tutorial-title" aria-describedby="tutorial-description">
  <h2 id="tutorial-title">Step 2 of 4</h2>
  <p id="tutorial-description">{step.content}</p>
</div>
```

**Screen Reader Support**:
- Announce step changes: `aria-live="polite"`
- Button labels: "Next step", "Previous step", "Skip tutorial"
- Progress: "Step 2 of 4" announced on change

**Focus Management**:
- Trap focus within tutorial dialog
- Return focus to trigger button on close
- Highlight focused element with visible outline

**Decision**: Follow WCAG 2.1 AA guidelines for dialog/modal patterns

---

## Summary of Research Decisions

1. ✅ **Routing**: Reuse existing conditional logic in `App.tsx`, add WelcomePage
2. ✅ **Tutorial**: Custom React component (no external library)
3. ✅ **Storage**: localStorage with `OnboardingState` schema
4. ✅ **Styling**: Match existing `DatabaseSettings` visual patterns
5. ✅ **Navigation**: Props-based routing (no react-router needed)
6. ✅ **Database Page**: Simplify by removing recommendations, default to connection string
7. ✅ **Settings Menu**: Add dropdown to JobDashboard header
8. ✅ **Accessibility**: WCAG 2.1 AA compliance with ARIA labels and keyboard nav
9. ✅ **Performance**: No optimization needed (meets all NFR targets)
10. ✅ **Transitions**: CSS opacity fade (≤300ms)

**All NEEDS CLARIFICATION resolved** - Ready for Phase 1 (Design & Contracts)
