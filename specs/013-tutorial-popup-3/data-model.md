# Data Model: Interactive Tutorial Carousel

**Feature**: 013-tutorial-popup-3
**Date**: 2025-10-13
**Status**: Complete

## Overview
This document defines the data structures and state management for the tutorial carousel feature.

---

## Entity: TutorialStep

**Description**: Represents a single step in the 5-step tutorial sequence.

**Interface Definition**:
```typescript
interface TutorialStep {
  stepNumber: number;       // 1-5 (human-readable step number)
  title: string;            // Brief step title (optional, for future use)
  imageSrc: string;         // Data URI for 500x500px placeholder image
  description: string;      // 1-2 sentences of explanatory text
}
```

**Field Specifications**:

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| `stepNumber` | number | Yes | 1-5 inclusive | `1` |
| `title` | string | Yes | Non-empty, max 50 chars | `"Welcome"` |
| `imageSrc` | string | Yes | Valid data URI (SVG) | `"data:image/svg+xml..."` |
| `description` | string | Yes | 1-2 sentences, max 200 chars | `"This tutorial will guide you through the main features."` |

**Relationships**: None (steps are independent)

**State Transitions**: None (immutable data)

**Usage**:
- Defined in `tutorialData.ts` as a hardcoded array of 5 steps
- Read-only access by TutorialModal component
- No runtime modifications (content is static)

---

## Entity: TutorialState (localStorage)

**Description**: Tracks whether the user has viewed the tutorial at least once.

**Storage Format**:
```typescript
// localStorage key-value
{
  "tutorial_seen": "true" | "false"  // String representation of boolean
}
```

**Field Specifications**:

| Key | Value Type | Purpose | Default |
|-----|------------|---------|---------|
| `tutorial_seen` | string (`"true"` or `"false"`) | Prevents auto-trigger on subsequent logins (FR-012b) | `"false"` (not set) |

**Lifecycle**:
1. **Initial State**: Key does not exist (treated as `false`)
2. **First Tutorial View**: Set to `"true"` when user completes or closes tutorial
3. **Persistence**: Survives browser restarts, tab closures
4. **Reset**: User must manually clear localStorage to reset state

**Access Pattern**:
```typescript
// Read
const hasSeen = localStorage.getItem('tutorial_seen') === 'true';

// Write
localStorage.setItem('tutorial_seen', 'true');

// Clear (for testing)
localStorage.removeItem('tutorial_seen');
```

**Error Handling**:
- If localStorage is unavailable (privacy mode, quota exceeded), fail silently
- Fallback behavior: Tutorial may re-trigger on next login (acceptable degradation)

---

## Component State: TutorialModal

**Description**: React component internal state for managing carousel navigation.

**State Definition**:
```typescript
const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
```

**Field Specifications**:

| Variable | Type | Range | Purpose |
|----------|------|-------|---------|
| `currentStepIndex` | number | 0-4 | Zero-indexed current step (maps to steps 1-5) |

**State Transitions**:
```
Initial: 0 (Step 1)
  ↓ Next
  1 (Step 2)
  ↓ Next
  2 (Step 3)
  ↓ Next
  3 (Step 4)
  ↓ Next
  4 (Step 5)
  ↓ Finish → Close modal & reset to 0

Previous: Decrement index (0 → no-op, hidden button)
Close: Reset to 0 (no persistence per FR-014)
```

**Derived Values**:
```typescript
const currentStep: TutorialStep = tutorialSteps[currentStepIndex];
const isFirstStep: boolean = currentStepIndex === 0;
const isLastStep: boolean = currentStepIndex === 4;
const progressText: string = `Step ${currentStepIndex + 1} of 5`;
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                    App Load                         │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
           ┌──────────────────────────┐
           │ Read localStorage        │
           │ "tutorial_seen"          │
           └──────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ↓                       ↓
        "false"                 "true"
    (not set/first login)    (seen before)
            │                       │
            ↓                       ↓
    Auto-open tutorial      No auto-open
            │                       │
            └───────────┬───────────┘
                        │
                        ↓
         ┌─────────────────────────────┐
         │   TutorialModal Opens       │
         │   currentStepIndex = 0      │
         └─────────────────────────────┘
                        │
                        ↓
         ┌─────────────────────────────┐
         │ Load tutorialSteps array    │
         │ Display step at index 0     │
         └─────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ↓                       ↓
      User clicks Next        User clicks Previous
            │                       │
            ↓                       ↓
    Increment index           Decrement index
    (max: 4)                  (min: 0)
            │                       │
            └───────────┬───────────┘
                        │
                        ↓
              ┌─────────────────┐
              │  Re-render with │
              │  new step data  │
              └─────────────────┘
                        │
            ┌───────────┴───────────┐
            ↓                       ↓
    User clicks Finish      User clicks X/overlay
    (only on step 5)             (any step)
            │                       │
            └───────────┬───────────┘
                        │
                        ↓
         ┌─────────────────────────────┐
         │ Mark as seen:               │
         │ localStorage.setItem(       │
         │   'tutorial_seen', 'true'   │
         │ )                           │
         └─────────────────────────────┘
                        │
                        ↓
         ┌─────────────────────────────┐
         │ Close modal                 │
         │ Reset currentStepIndex = 0  │
         └─────────────────────────────┘
```

---

## Validation Rules

### TutorialStep Validation
```typescript
function validateTutorialStep(step: TutorialStep): boolean {
  return (
    step.stepNumber >= 1 &&
    step.stepNumber <= 5 &&
    step.title.length > 0 &&
    step.title.length <= 50 &&
    step.imageSrc.startsWith('data:image/svg+xml') &&
    step.description.length > 0 &&
    step.description.length <= 200
  );
}
```

### State Index Validation
```typescript
function validateStepIndex(index: number): boolean {
  return index >= 0 && index <= 4 && Number.isInteger(index);
}
```

---

## Example Data

**tutorialSteps Array** (from `tutorialData.ts`):
```typescript
export const tutorialSteps: TutorialStep[] = [
  {
    stepNumber: 1,
    title: 'Welcome',
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg...',
    description: 'Welcome to the application! This tutorial will guide you through the main features.'
  },
  {
    stepNumber: 2,
    title: 'Navigation',
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg...',
    description: 'Use the menu on the left to navigate between different sections of the app.'
  },
  {
    stepNumber: 3,
    title: 'Adding Items',
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg...',
    description: 'Click the "Add" button to create new items. Fill out the form and save your changes.'
  },
  {
    stepNumber: 4,
    title: 'Searching',
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg...',
    description: 'Use the search bar at the top to quickly find items. Filter results using the dropdown menu.'
  },
  {
    stepNumber: 5,
    title: 'Get Started',
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg...',
    description: 'You\'re all set! Click "Finish" to start using the application. You can access this tutorial anytime from the bottom-right corner.'
  }
];
```

---

## Schema Changes

**No database schema changes required** (frontend-only feature).

**localStorage Schema** (implicit):
```json
{
  "tutorial_seen": "true"
}
```

---

## Summary

- **3 data structures**: TutorialStep (interface), TutorialState (localStorage), Component State (React)
- **No persistence layer**: Tutorial steps are hardcoded, only "seen" flag persists
- **Simple state machine**: Linear progression through 5 steps with reset on close
- **Type-safe**: All structures defined with TypeScript interfaces
- **Validated**: Field constraints documented and enforced

**Ready for contract generation (Phase 1, Step 2).**
