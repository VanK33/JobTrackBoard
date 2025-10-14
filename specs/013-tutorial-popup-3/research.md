# Research Document: Interactive Tutorial Carousel

**Feature**: 013-tutorial-popup-3
**Date**: 2025-10-13
**Status**: Complete

## Overview
This document captures technical research and decisions for implementing a 5-step interactive tutorial carousel within the existing TutorialModal component.

## Research Findings

### 1. State Management Approach

**Decision**: Use React `useState` for current step index (0-4)

**Rationale**:
- Simple local component state sufficient for single-component feature
- No need for global state management (Context API, Redux)
- useState provides instant updates and re-renders
- Step navigation is synchronous (no async operations)
- Meets FR-005, FR-006 (Next/Previous buttons)

**Alternatives Considered**:
1. **useReducer**:
   - Rejected: Overkill for managing a single integer (step index)
   - Would add unnecessary boilerplate (action types, reducer function)
2. **Context API**:
   - Rejected: No cross-component state sharing needed
   - Tutorial state is isolated to TutorialModal component
3. **External State Library (Zustand/Redux)**:
   - Rejected: Adds dependency for trivial state management
   - Violates project's "no external dependencies" preference

**Implementation Notes**:
```typescript
const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
```

---

### 2. Tutorial Content Structure

**Decision**: Hardcoded array of 5 tutorial step objects in `tutorialData.ts`

**Rationale**:
- FR-002 specifies exactly 5 steps (fixed, not variable)
- No requirement for dynamic content loading
- Content updates infrequent (managed via code changes)
- Type-safe with TypeScript interfaces
- Easy to maintain and version control

**Alternatives Considered**:
1. **JSON File**:
   - Rejected: Adds build complexity (need to import/parse JSON)
   - No advantage over TypeScript for static content
2. **Database/Backend**:
   - Rejected: Massive overkill for 5 static strings and placeholder images
   - Would require backend API, database schema, migration
3. **CMS (Content Management System)**:
   - Rejected: Out of scope, adds infrastructure complexity
   - Tutorial content is developer-managed, not user-managed

**Implementation Notes**:
```typescript
export interface TutorialStep {
  stepNumber: number;
  title: string;
  imageSrc: string;
  description: string;
}

export const tutorialSteps: TutorialStep[] = [
  { stepNumber: 1, title: 'Welcome', imageSrc: '...', description: '...' },
  // ... 4 more
];
```

---

### 3. "Has Seen" State Persistence

**Decision**: localStorage key `tutorial_seen` = boolean

**Rationale**:
- FR-012b requires tracking whether user has seen tutorial
- localStorage persists across browser sessions
- No backend required (aligns with frontend-only scope)
- Simple boolean flag sufficient (no complex state)
- Accessible via standard Web API

**Alternatives Considered**:
1. **Cookie**:
   - Rejected: More complex to read/write than localStorage
   - No advantage for client-side-only data
   - Cookie size limits unnecessary overhead
2. **Backend Flag (User Profile)**:
   - Rejected: Requires authentication integration
   - Adds backend dependency for frontend-only feature
   - Complicates testing (need test users, database state)
3. **SessionStorage**:
   - Rejected: Clears on tab close, violating FR-012b
   - Would cause tutorial to re-trigger every session

**Implementation Notes**:
```typescript
localStorage.setItem('tutorial_seen', 'true');
const hasSeen = localStorage.getItem('tutorial_seen') === 'true';
```

---

### 4. Placeholder Image Pattern

**Decision**: Use data URI with inline SVG (500x500px gray box with "Step X" text)

**Rationale**:
- FR-011 requires placeholder images (actual content later)
- FR-003 specifies 500x500px dimensions
- Data URI embeds image directly (no network requests)
- SVG scales perfectly, loads instantly
- No external dependencies or build tooling required

**Alternatives Considered**:
1. **External Placeholder Service** (e.g., placehold.co, via.placeholder.com):
   - Rejected: Network dependency, slower load times
   - Fails offline or if service is down
2. **Empty `<img>` Tag**:
   - Rejected: Breaks layout before image loads
   - No visual feedback to user
3. **Hardcoded Base64 PNG/JPG**:
   - Rejected: Verbose, large strings in code
   - SVG data URI is more compact and scalable

**Implementation Notes**:
```typescript
const generatePlaceholder = (stepNumber: number): string => {
  const svg = `
    <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="500" height="500" fill="#e5e7eb"/>
      <text x="250" y="250" font-size="48" text-anchor="middle" fill="#6b7280">
        Step ${stepNumber}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
```

---

### 5. Navigation Button States

**Decision**: Conditional rendering (hide Previous on step 1, replace Next with Finish on step 5)

**Rationale**:
- FR-008: "disable or hide" Previous on first step → choosing hide for cleaner UX
- FR-009: Replace Next with Finish on last step
- Conditional rendering prevents accidental clicks on disabled buttons
- Clearer visual feedback to user

**Alternatives Considered**:
1. **Disabled Buttons** (opacity: 0.5, cursor: not-allowed):
   - Rejected: Less intuitive UX
   - Disabled Previous button on step 1 looks like an error
2. **Always Visible Buttons**:
   - Rejected: Violates FR-008 and FR-009 requirements
   - Would allow Previous on step 1 (no-op, confusing)

**Implementation Notes**:
```typescript
{currentStepIndex > 0 && (
  <button onClick={goToPreviousStep}>Previous</button>
)}

{currentStepIndex < 4 ? (
  <button onClick={goToNextStep}>Next</button>
) : (
  <button onClick={handleFinish}>Finish</button>
)}
```

---

## Accessibility Considerations

**Existing Support** (from current TutorialModal):
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Keyboard navigation: Escape key closes modal
- Focus management: Prevents body scroll when open

**Enhancements Required**:
1. Add ARIA live region for progress indicator ("Step X of 5")
2. Ensure keyboard focus moves to Next/Previous buttons
3. Add `aria-label` to navigation buttons ("Go to next step", "Go to previous step", "Finish tutorial")
4. Announce step changes to screen readers

**Implementation Notes**:
```typescript
<div aria-live="polite" aria-atomic="true">
  Step {currentStepIndex + 1} of 5
</div>
```

---

## Performance Considerations

**Target**: <100ms step transitions (from Technical Context)

**Analysis**:
- State updates: `setCurrentStepIndex` is synchronous, <1ms
- Re-render cost: Single component, ~200 lines, minimal DOM changes
- Image loading: Data URIs load instantly (no network delay)
- No animations/transitions required by spec

**Conclusion**: Performance target easily achievable with proposed architecture.

---

## localStorage Best Practices

**Security**:
- `tutorial_seen` flag is non-sensitive data (no PII, no authentication)
- Safe to store in plain text
- No encryption needed

**Error Handling**:
```typescript
try {
  localStorage.setItem('tutorial_seen', 'true');
} catch (error) {
  // Fallback: Continue without persistence
  // User will see tutorial again on next login (acceptable degradation)
  console.warn('Failed to save tutorial state:', error);
}
```

**Quota Management**:
- Single boolean flag uses <10 bytes
- No quota concerns (localStorage typically 5-10MB)

---

## Summary of Decisions

| Decision Area | Chosen Approach | Key Rationale |
|---------------|----------------|---------------|
| State Management | React useState | Simple, sufficient, no global state needed |
| Tutorial Content | Hardcoded TypeScript array | Fixed 5 steps, type-safe, version controlled |
| "Has Seen" Persistence | localStorage boolean flag | Cross-session persistence, no backend |
| Placeholder Images | SVG data URIs | Instant load, scalable, no dependencies |
| Button States | Conditional rendering | Clean UX, meets FR-008/FR-009 |

**All unknowns resolved. Ready for Phase 1 (Design & Contracts).**
