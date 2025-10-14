# Data Model: Welcome Homepage and Database Setup Redesign

## Entity Definitions

### 1. OnboardingState

**Purpose**: Track user's progress through initial onboarding and tutorial completion

**Storage Location**: Browser localStorage (key: `'onboardingState'`)

**Schema**:
```typescript
interface OnboardingState {
  // Database configuration status
  databaseConfigured: boolean

  // Tutorial completion tracking
  tutorialStatus: 'not_started' | 'in_progress' | 'completed'

  // Current step if tutorial is in progress (0-indexed)
  currentStep?: number

  // Timestamp for tracking state changes
  lastUpdated: string  // ISO 8601 format
}
```

**Example Values**:
```json
{
  "databaseConfigured": false,
  "tutorialStatus": "in_progress",
  "currentStep": 2,
  "lastUpdated": "2025-10-06T14:30:00.000Z"
}
```

**State Transitions**:
```
Initial State:
{ databaseConfigured: false, tutorialStatus: 'not_started', lastUpdated: <now> }

User clicks "Get Started":
{ tutorialStatus: 'in_progress', currentStep: 0, ... }

User proceeds through tutorial:
{ currentStep: 1 } → { currentStep: 2 } → { currentStep: 3 }

User completes tutorial OR skips:
{ tutorialStatus: 'completed', currentStep: undefined, ... }

User successfully configures database:
{ databaseConfigured: true, ... }
```

**Validation Rules**:
- `tutorialStatus` must be one of: 'not_started', 'in_progress', 'completed'
- `currentStep` required if `tutorialStatus === 'in_progress'`
- `currentStep` must be >= 0 and < total tutorial steps (4)
- `lastUpdated` must be valid ISO 8601 string

**Persistence Strategy**:
- **Save**: On tutorial step change, skip, or completion
- **Save**: On database configuration success
- **Load**: On application mount (before routing decision)
- **Clear**: Never (only update `databaseConfigured` and `tutorialStatus`)

---

### 2. DatabaseConfiguration

**Purpose**: Store database connection credentials and settings

**Storage Location**: Browser localStorage (key: `'databaseConfig'`)

**Schema** (Existing, from `types.ts`):
```typescript
interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb'
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl: boolean
  connectionString?: string
  storage?: {
    provider: 'supabase' | 'local'
    bucket?: string
    endpoint?: string
    apiKey?: string
  }
}
```

**Clean Configuration** (when using connection string):
```json
{
  "type": "postgresql",
  "connectionString": "postgresql://user:pass@host:5432/dbname",
  "ssl": true
}
```

**Validation Rules**:
- If `connectionString` provided: `type`, `connectionString`, `ssl` required
- If no `connectionString`: `type`, `host`, `port`, `database`, `username`, `password` required
- Connection string format: `postgresql://[username]:[password]@[host]:[port]/[database]`
- Must pass backend `/api/database/test` validation before saving

**Relationship to OnboardingState**:
```
OnboardingState.databaseConfigured === true
  IF AND ONLY IF
DatabaseConfig exists in localStorage AND validated
```

**State Changes**:
- **Created**: When user successfully tests connection
- **Updated**: When user changes configuration and re-tests
- **Deleted**: When user clears configuration (future feature)

---

### 3. TutorialContent

**Purpose**: Define static tutorial steps and tooltip content

**Storage Location**: Hardcoded in `WelcomePage.tsx` component

**Schema**:
```typescript
interface TutorialStep {
  // Step number (0-indexed)
  id: number

  // Title displayed at top of tooltip
  title: string

  // Main content text (2-3 sentences)
  content: string

  // Optional: CSS selector for target element to highlight
  target?: string

  // Tooltip position relative to target (or screen center if no target)
  position: 'center' | 'top' | 'bottom' | 'left' | 'right'

  // Optional: Image or icon to display
  icon?: string
}
```

**Tutorial Steps Data**:
```typescript
const tutorialSteps: TutorialStep[] = [
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
```

**Immutable**: Tutorial content is static and does not change at runtime

---

### 4. ConnectionStringHistory

**Purpose**: Remember recently used connection strings for user convenience

**Storage Location**: Browser localStorage (key: `'databaseConnectionHistory'`)

**Schema**:
```typescript
type ConnectionStringHistory = string[]  // Array of connection strings
```

**Example Value**:
```json
[
  "postgresql://user1:pass@db.supabase.co:5432/postgres",
  "postgresql://user2:pass@neon.tech:5432/mydb",
  "postgresql://localhost:5432/testdb"
]
```

**Constraints**:
- Maximum 5 entries (keep most recent)
- New entries added to front of array
- Duplicates removed (keep most recent occurrence)
- No sensitive data validation (stored as-is, encrypted by browser)

**Update Logic**:
```javascript
// When user enters new connection string
const newHistory = [
  newConnectionString,
  ...prevHistory.filter(s => s !== newConnectionString)
].slice(0, 5)
```

**Usage**:
- Displayed in dropdown on `DatabaseSettings` page (existing feature at line 779-816)
- User can select to autofill connection string input

---

## Entity Relationships

```
┌─────────────────────┐
│  OnboardingState    │
│  (localStorage)     │
└─────────┬───────────┘
          │ determines routing
          ↓
    ┌─────────────┐
    │  App.tsx    │
    │  (routing)  │
    └──────┬──────┘
           │
      ┌────┴─────┐
      ↓          ↓
┌──────────┐  ┌──────────────┐
│ Welcome  │  │ JobDashboard │
│ Page     │  │              │
└────┬─────┘  └──────┬───────┘
     │               │
     │          ┌────┴────┐
     └─────────→│ Database│
                │ Settings│
                └────┬────┘
                     │ validates & saves
                     ↓
            ┌────────────────────┐
            │ DatabaseConfig     │
            │ (localStorage)     │
            └────────────────────┘
                     │
                     ↓ (on save)
            ┌────────────────────┐
            │ OnboardingState    │
            │ .databaseConfigured│
            │ = true             │
            └────────────────────┘
```

---

## Data Flow Diagrams

### First-Time User Flow

```
1. User opens app
   ↓
2. App.tsx checks localStorage
   ↓
3. No DatabaseConfig found
   ↓
4. Check OnboardingState
   ↓
5. OnboardingState = { tutorialStatus: 'not_started', ... }
   ↓
6. Show WelcomePage
   ↓
7. User clicks "Get Started"
   ↓
8. Save OnboardingState { tutorialStatus: 'in_progress', currentStep: 0 }
   ↓
9. Show GuidedTutorial overlay
   ↓
10. User clicks "Next" 4 times
    ↓
11. Save OnboardingState { tutorialStatus: 'completed', currentStep: undefined }
    ↓
12. User clicks "Custom Database Setup"
    ↓
13. Navigate to DatabaseSettings
    ↓
14. User enters connection string
    ↓
15. Test connection (POST /api/database/test)
    ↓
16. On success: Save DatabaseConfig to localStorage
    ↓
17. Save OnboardingState { databaseConfigured: true }
    ↓
18. Navigate to JobDashboard
```

### Returning User Flow

```
1. User opens app
   ↓
2. App.tsx checks localStorage
   ↓
3. DatabaseConfig found
   ↓
4. OnboardingState.databaseConfigured === true
   ↓
5. Skip WelcomePage
   ↓
6. Show JobDashboard directly
```

### Tutorial Replay Flow (from Dashboard)

```
1. User on JobDashboard
   ↓
2. User clicks Settings icon
   ↓
3. User clicks "View Tutorial"
   ↓
4. Launch GuidedTutorial overlay on JobDashboard
   ↓
5. Tutorial steps play (but don't update OnboardingState)
   ↓
6. User closes tutorial
   ↓
7. Return to JobDashboard (no navigation)
```

---

## Validation & Constraints Summary

| Entity | Validation | Constraints |
|--------|-----------|-------------|
| OnboardingState | `tutorialStatus` enum, `currentStep` range | `currentStep` required if in_progress |
| DatabaseConfig | Connection string format, backend validation | Must pass `/api/database/test` |
| TutorialContent | Static (no runtime validation) | Immutable data structure |
| ConnectionStringHistory | Array length | Max 5 entries, no duplicates |

---

## Migration Strategy

**From Current Implementation**:
- **DatabaseConfig**: Already exists, no changes needed
- **OnboardingState**: New entity, initialize on first app load:
  ```javascript
  if (!localStorage.getItem('onboardingState')) {
    const dbConfig = getStoredDatabaseConfig()
    const initialState: OnboardingState = {
      databaseConfigured: !!dbConfig,
      tutorialStatus: 'not_started',
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('onboardingState', JSON.stringify(initialState))
  }
  ```

**Backwards Compatibility**:
- Existing users with `databaseConfig`: Automatically get `OnboardingState { databaseConfigured: true, tutorialStatus: 'not_started' }`
- Can still replay tutorial from settings menu
- No data loss, no migration scripts needed

---

## Testing Scenarios

1. **New User**:
   - localStorage empty
   - OnboardingState initialized
   - WelcomePage shown

2. **Existing User**:
   - DatabaseConfig present
   - OnboardingState created with `databaseConfigured: true`
   - JobDashboard shown directly

3. **Tutorial Interruption**:
   - User starts tutorial (`currentStep: 2`)
   - Closes browser
   - Reopens: Tutorial resumes at step 2

4. **Database Change**:
   - User has config
   - Navigates to settings
   - Changes database
   - Re-tests connection
   - DatabaseConfig updated, OnboardingState unchanged

5. **localStorage Corruption**:
   - Invalid JSON in OnboardingState
   - Fallback: Initialize to default state
   - Show WelcomePage

---

## localStorage Key Summary

| Key | Type | Purpose |
|-----|------|---------|
| `onboardingState` | OnboardingState | Track onboarding progress |
| `databaseConfig` | DatabaseConfig | Store database credentials (existing) |
| `databaseConnectionHistory` | string[] | Recent connection strings (existing) |

**Total Storage**: ~2KB (well under 5MB quota)
