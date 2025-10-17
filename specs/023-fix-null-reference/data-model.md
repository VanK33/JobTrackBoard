# Data Model: Fix Null Reference Error in Job Creation

**Feature**: 023-fix-null-reference
**Date**: 2025-10-16
**Purpose**: Define entities, state structures, and relationships for null safety implementation

---

## Entity 1: Job Application (Existing)

**Description**: Represents a job application entry in the system.

### Properties
| Field | Type | Nullable | Validation | Description |
|-------|------|----------|------------|-------------|
| `_id` | `string` | No | Non-empty | Unique identifier (UUID for saved jobs, `new-{timestamp}` for unsaved) |
| `title` | `string` | Yes | - | Job position title (e.g., "Software Engineer") |
| `company` | `string` | Yes | - | Company name (e.g., "Acme Corp") |
| `location` | `string` | Yes | - | Job location (e.g., "San Francisco, CA") |
| `description` | `string` | Yes | - | Job description (markdown supported) |
| `status` | `JobStatus` | No | Enum value | Current application status |
| `createdAt` | `Date` | No | Valid date | Creation timestamp |
| `updatedAt` | `Date` | No | Valid date | Last update timestamp |

### Relationships
- **One-to-Many** with StatusHistory entries
- **Referenced by** `selectedJob`, `newJobForm` state in JobDashboard component

### State Transitions
```
[User clicks "New Application"]
  → Job created with _id='new-{timestamp}', status='draft'
  → Job added to `jobs` array
  → Job set as `selectedJob` and `newJobForm`

[User clicks same job in list]
  → If selectedJob._id === job._id:
      selectedJob → null (TOGGLE OFF)
  → Else:
      selectedJob → job

[User clicks "Save" or "Discard"]
  → newJobForm → null
  → isCreatingNew → false
  → selectedJob → null (if discarded) or saved job (if saved)
```

### Null Safety Notes
- **Critical**: `selectedJob` can be `null` during form creation/editing
- **Risk**: Code assumes `selectedJob` is always non-null when detail view renders
- **Fix**: All property accesses must use optional chaining: `selectedJob?.property`

---

## Entity 2: Form State (Component State)

**Description**: React component state managing new job creation flow.

### Properties
| State Variable | Type | Nullable | Initial Value | Description |
|----------------|------|----------|---------------|-------------|
| `isCreatingNew` | `boolean` | No | `false` | Flag indicating "New Application" mode is active |
| `newJobForm` | `Job` | Yes | `null` | Temporary job object during creation (before save) |
| `selectedJob` | `Job` | Yes | `null` | Currently selected job for detail view |
| `showCloseConfirm` | `boolean` | No | `false` | Flag to show "Close without saving?" confirmation dialog |

### Validation Rules
**FR-006 Unsaved Data Detection**:
```typescript
const hasUnsavedData = (): boolean => {
  if (!isCreatingNew) return false;

  return !!(
    newJobForm?.title?.trim() ||
    newJobForm?.company?.trim() ||
    newJobForm?.location?.trim() ||
    newJobForm?.description?.trim() ||
    (newJobForm?.status && newJobForm.status !== 'draft')
  );
};
```

**Conditions**:
- Unsaved data = TRUE if **any** field has non-empty value
- Empty form (all fields blank/default) = FALSE (no confirmation needed)

### State Transitions
```
[Initial State]
  isCreatingNew=false, newJobForm=null, selectedJob=null, showCloseConfirm=false

[User clicks "New Application"]
  isCreatingNew → true
  newJobForm → { _id: 'new-{timestamp}', ...defaultValues }
  selectedJob → newJobForm

[User clicks outside form with UNSAVED data]
  → Check hasUnsavedData()
  → If TRUE: showCloseConfirm → true
  → If FALSE: Close immediately (reset all state)

[User clicks "Discard changes" in confirmation]
  showCloseConfirm → false
  isCreatingNew → false
  newJobForm → null
  selectedJob → null

[User clicks "Continue editing"]
  showCloseConfirm → false
  (All other state preserved)

[User saves job successfully]
  isCreatingNew → false
  newJobForm → null
  selectedJob → savedJob (with real _id from backend)
```

---

## Entity 3: Null Reference Error Context

**Description**: Error tracking and logging structure for debugging null reference issues.

### Properties
| Field | Type | Description |
|-------|------|-------------|
| `component` | `string` | Component name + function where error occurred (e.g., "JobDashboard.updateJobStatus") |
| `error` | `string` | Error message (e.g., "Cannot read properties of null (reading '_id')") |
| `formState` | `ErrorFormState` | Snapshot of relevant state at time of error |

### ErrorFormState Structure
```typescript
interface ErrorFormState {
  isCreatingNew: boolean;
  selectedJobId: string | undefined;  // selectedJob?._id
  newJobFormId: string | undefined;   // newJobForm?._id
  hasTitle: boolean;
  hasCompany: boolean;
  hasLocation: boolean;
  hasDescription: boolean;
}
```

### Logging Format
```typescript
console.error('[JobDashboard] Null reference error:', {
  component: 'JobDashboard.{functionName}',
  error: (error as Error).message,
  formState: {
    isCreatingNew,
    selectedJobId: selectedJob?._id,
    newJobFormId: newJobForm?._id,
    hasTitle: !!newJobForm?.title,
    hasCompany: !!newJobForm?.company,
    hasLocation: !!newJobForm?.location,
    hasDescription: !!newJobForm?.description
  }
});
```

---

## Entity 4: Confirmation Dialog State

**Description**: State for "Close without saving?" confirmation dialog.

### Properties
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Dialog visibility state |
| `message` | `string` | "Your changes will be lost if you close this modal." | Dialog body text |
| `onConfirm` | `() => void` | - | Callback for "Discard changes" button |
| `onCancel` | `() => void` | - | Callback for "Continue editing" button |

### Render Condition
```typescript
{showCloseConfirm && (
  <ConfirmationDialogInline
    message="Your changes will be lost if you close this modal."
    onConfirm={() => {
      setShowCloseConfirm(false);
      handleCloseNewJobForm();
    }}
    onCancel={() => setShowCloseConfirm(false)}
  />
)}
```

---

## Relationships Diagram

```
┌──────────────────────────────────────────────┐
│         JobDashboard Component               │
├──────────────────────────────────────────────┤
│                                              │
│  State:                                      │
│  ┌────────────────┐  ┌─────────────────┐   │
│  │ isCreatingNew  │  │ showCloseConfirm│   │
│  │ (boolean)      │  │ (boolean)       │   │
│  └────────────────┘  └─────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │   selectedJob (Job | null)           │  │
│  │   ┌────────────────────────────────┐ │  │
│  │   │ _id, title, company, status... │ │  │
│  │   └────────────────────────────────┘ │  │
│  └──────────────────────────────────────┘  │
│           ↓ Can be NULL ↓                   │
│  ⚠️  MUST use selectedJob?._id             │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │   newJobForm (Job | null)            │  │
│  │   ┌────────────────────────────────┐ │  │
│  │   │ _id='new-XXX', fields...       │ │  │
│  │   └────────────────────────────────┘ │  │
│  └──────────────────────────────────────┘  │
│           ↓ Checked for dirty state         │
│  hasUnsavedData() → boolean                 │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │   jobs (Job[])                       │  │
│  │   ┌────┐ ┌────┐ ┌────┐              │  │
│  │   │Job │ │Job │ │Job │ ...          │  │
│  │   └────┘ └────┘ └────┘              │  │
│  └──────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Validation Rules Summary

### FR-002: Validate job entity exists before accessing properties
```typescript
// ❌ BEFORE (crashes):
const jobId = selectedJob._id;

// ✅ AFTER (safe):
const jobId = selectedJob?._id;
if (!jobId) {
  console.error('[JobDashboard] selectedJob is null');
  return;
}
```

### FR-006: Detect unsaved data
```typescript
const hasUnsavedData = (): boolean => {
  if (!isCreatingNew) return false;

  // At least ONE field has non-empty value
  return !!(
    newJobForm?.title?.trim() ||
    newJobForm?.company?.trim() ||
    newJobForm?.location?.trim() ||
    newJobForm?.description?.trim() ||
    (newJobForm?.status && newJobForm.status !== 'draft')
  );
};
```

### FR-007: Show confirmation dialog conditionally
```typescript
const handleCloseAttempt = () => {
  if (hasUnsavedData()) {
    setShowCloseConfirm(true);  // Show dialog
  } else {
    handleCloseNewJobForm();     // Close immediately
  }
};
```

### FR-008: Preserve data when "Continue editing"
```typescript
const handleContinueEditing = () => {
  setShowCloseConfirm(false);
  // DO NOT modify newJobForm or selectedJob
  // User returns to editing state
};
```

### FR-013: Discard data only on explicit confirm
```typescript
const handleDiscardChanges = () => {
  setShowCloseConfirm(false);
  setIsCreatingNew(false);
  setNewJobForm(null);
  setSelectedJob(null);
  // Data is lost only here
};
```

---

## Edge Cases

### Edge Case 1: Rapid Click Toggle
**Scenario**: User rapidly clicks job in list (toggle on/off)
**State**: `selectedJob` oscillates between `job` and `null`
**Fix**: All accesses use `selectedJob?.property` → returns `undefined` instead of crashing

### Edge Case 2: Async State Update
**Scenario**: User clicks "Save" → API call in progress → User clicks outside
**State**: `selectedJob` might be null during API call
**Fix**: Check `!selectedJob` before any property access in async callbacks

### Edge Case 3: Empty Form Close
**Scenario**: User opens "New Application", enters nothing, clicks outside
**State**: `hasUnsavedData()` returns `false`
**Behavior**: Form closes immediately (no confirmation) per FR-005

### Edge Case 4: Keyboard Navigation
**Scenario**: User presses Tab/Escape while form is open
**State**: Keyboard events might trigger close without mouse click
**Fix**: Apply same `hasUnsavedData()` logic to keyboard handlers

---

**Phase 1 (Data Model) Complete** ✅
All entities, state structures, and validation rules defined. Ready to generate contracts.
