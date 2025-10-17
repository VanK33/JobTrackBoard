# Tasks: Fix Null Reference Error in Job Creation

**Feature**: 023-fix-null-reference
**Input**: Design documents from `/specs/023-fix-null-reference/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Summary

**Scope**: Fix critical null reference error in JobDashboard.tsx (7 specific locations)
**Tech Stack**: TypeScript 5.0+, React 18, Vite 5
**Approach**: Add null safety guards, implement dirty state tracking, create confirmation dialog
**Testing**: Manual testing per quickstart.md (12 scenarios)

**Key Constraints**:
- No new runtime dependencies
- Frontend-only changes (no backend modifications)
- Preserve existing API contracts
- Performance: <5ms null check overhead

---

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **File Paths**: All paths relative to `platform/core/src/frontend/`

---

## Phase 3.1: Setup & Preparation

- [ ] **T001** Create branch `023-fix-null-reference` from current branch
  - Verify branch name matches spec
  - Ensure clean working directory

- [ ] **T002** [P] Run type-check to establish baseline
  - Command: `npm run type-check`
  - Document any existing TypeScript errors (should be none)

- [ ] **T003** [P] Verify dev environment running
  - Command: `npm run dev`
  - Confirm frontend at http://localhost:5173
  - Confirm backend at http://localhost:3000

---

## Phase 3.2: Contract Implementation (Utility Functions)

**Note**: These are optional helpers. For a minimal bugfix, skip to Phase 3.3 and apply null guards directly.

- [ ] **T004** [P] Implement `NullSafetyHelpers` utilities
  - **File**: `platform/core/src/frontend/utils/nullSafetyHelpers.ts`
  - **Contract**: `specs/023-fix-null-reference/contracts/NullSafetyHelpers.interface.ts`
  - **Functions to implement**:
    - `safeGetJobProperty<K>(job, property, fallback): Job[K]`
    - `isValidJob(job): job is Job`
    - `isNewJob(job): boolean`
    - `getJobDisplayName(job, fallback): string`
    - `assertJobExists(job, context): asserts job is Job`
  - **Tests**: Manual verification (no unit tests for bugfix)

- [ ] **T005** [P] Implement `FormStateManager` class
  - **File**: `platform/core/src/frontend/utils/formStateManager.ts`
  - **Contract**: `specs/023-fix-null-reference/contracts/FormStateManagement.interface.ts`
  - **Methods to implement**:
    - `hasUnsavedData(job): DirtyStateResult`
    - `handleCloseAttempt(state, onCloseImmediate, onShowConfirmation): void`
    - `handleContinueEditing(setShowCloseConfirm): void`
    - `handleDiscardChanges(resetFormState): void`
  - **Dependency**: None (standalone utility class)

- [ ] **T006** [P] Implement `ConsoleErrorLogger` class
  - **File**: `platform/core/src/frontend/utils/errorLogger.ts`
  - **Contract**: `specs/023-fix-null-reference/contracts/ErrorLogging.interface.ts`
  - **Methods to implement**:
    - `logNullReferenceError(context): void`
    - `logWarning(component, message, state?): void`
  - **Helper**: `createFormStateSnapshot(state): ErrorFormStateSnapshot`

---

## Phase 3.3: Null Safety Fixes (Critical)

**IMPORTANT**: These tasks fix the 7 specific locations identified in research.md. Apply changes directly to JobDashboard.tsx.

- [x] **T007** Fix Line 2255: Title/Company display null guard
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Line 2255
  - **Current Code**:
    ```typescript
    {isCreatingNew ? 'New Application' : `${selectedJob.title} - ${selectedJob.company}`}
    ```
  - **Fixed Code**:
    ```typescript
    {isCreatingNew ? 'New Application' : `${selectedJob?.title || 'Untitled'} - ${selectedJob?.company || 'Unknown'}`}
    ```
  - **Requirement**: FR-002 (Validate entity exists before accessing properties)

- [x] **T008** Fix Line 2340: Delete button click handler null guard
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Line 2340
  - **Current Code**:
    ```typescript
    onClick={() => setShowDeleteConfirm(selectedJob._id)}
    ```
  - **Fixed Code**:
    ```typescript
    onClick={() => {
      if (selectedJob?._id) {
        setShowDeleteConfirm(selectedJob._id);
      }
    }}
    ```
  - **Requirement**: FR-010 (Check for null before accessing properties)

- [x] **T009** Fix Line 2369: Delete confirmation modal condition
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Line 2369
  - **Current Code**:
    ```typescript
    {showDeleteConfirm === selectedJob._id && (
    ```
  - **Fixed Code**:
    ```typescript
    {selectedJob && showDeleteConfirm === selectedJob._id && (
    ```
  - **Requirement**: FR-010 (Null guard in conditional renders)

- [x] **T010** Fix Lines 2429 & 2499: Delete confirmation button handlers
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Locations**: Lines 2429, 2499
  - **Current Code** (both locations):
    ```typescript
    onClick={() => handleDeleteJob(selectedJob._id)}
    ```
  - **Fixed Code** (both locations):
    ```typescript
    onClick={() => {
      if (selectedJob?._id) {
        handleDeleteJob(selectedJob._id);
      }
    }}
    ```
  - **Requirement**: FR-010 (Null guards on delete operations)

- [x] **T011** Fix Line 3681: Delete status history handler
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Line 3681
  - **Current Code**:
    ```typescript
    handleDeleteStatusHistory(selectedJob._id, historyEntry.id)
    ```
  - **Fixed Code**:
    ```typescript
    {
      if (selectedJob?._id) {
        handleDeleteStatusHistory(selectedJob._id, historyEntry.id);
      }
    }
    ```
  - **Requirement**: FR-010 (Null guard on status history operations)

- [x] **T012** Fix Line 4000: Update job status handler
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Line 4000
  - **Current Code**:
    ```typescript
    await updateJobStatus(selectedJob._id, status, `Status manually set to ${statusLabels[status as keyof typeof statusLabels]}`)
    ```
  - **Fixed Code**:
    ```typescript
    if (selectedJob?._id) {
      await updateJobStatus(selectedJob._id, status, `Status manually set to ${statusLabels[status as keyof typeof statusLabels]}`);
    }
    ```
  - **Requirement**: FR-010 (Null guard on async operations)

---

## Phase 3.4: Dirty State Detection & Confirmation Dialog

- [x] **T013** Add `hasUnsavedData` function to JobDashboard
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Add near top of component (after existing hooks/state)
  - **Implementation**:
    ```typescript
    const hasUnsavedData = (): boolean => {
      if (!isCreatingNew) return false;

      // FR-006: At least ONE field has non-empty value
      return !!(
        newJobForm?.title?.trim() ||
        newJobForm?.company?.trim() ||
        newJobForm?.location?.trim() ||
        newJobForm?.description?.trim() ||
        (newJobForm?.status && newJobForm.status !== 'draft')
      );
    };
    ```
  - **Requirement**: FR-006 (Detect unsaved data)
  - **Dependency**: None

- [x] **T014** Add `showCloseConfirm` state variable
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Near existing state declarations (around line 111-112)
  - **Implementation**:
    ```typescript
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    ```
  - **Requirement**: FR-007 (Confirmation dialog state management)

- [x] **T015** Implement `handleCloseAttempt` function
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Add after `hasUnsavedData` function
  - **Implementation**:
    ```typescript
    const handleCloseAttempt = () => {
      if (hasUnsavedData()) {
        setShowCloseConfirm(true); // FR-007: Show confirmation
      } else {
        // FR-005: Close immediately if no unsaved data
        setIsCreatingNew(false);
        setNewJobForm(null);
        setSelectedJob(null);
      }
    };
    ```
  - **Requirements**: FR-005, FR-007
  - **Dependency**: T013 (hasUnsavedData must exist)

- [x] **T016** Create inline confirmation dialog component
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Add within main return JSX, after existing modals (around line 2500+)
  - **Implementation**:
    ```typescript
    {/* Close Confirmation Dialog */}
    {showCloseConfirm && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '400px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Close without saving?</h3>
          <p>Your changes will be lost if you close this modal.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              onClick={() => setShowCloseConfirm(false)} // FR-008: Continue editing
              style={{
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Continue editing
            </button>
            <button
              onClick={() => { // FR-013: Discard changes
                setShowCloseConfirm(false);
                setIsCreatingNew(false);
                setNewJobForm(null);
                setSelectedJob(null);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Discard changes
            </button>
          </div>
        </div>
      </div>
    )}
    ```
  - **Requirements**: FR-007, FR-008, FR-013
  - **Dependency**: T014 (showCloseConfirm state must exist)

- [x] **T017** Wire up `handleCloseAttempt` to backdrop click
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Location**: Find the backdrop/overlay click handler (likely around line 2217+ where detail view renders)
  - **Current Pattern**: Direct close on backdrop click
  - **New Pattern**: Call `handleCloseAttempt()` instead of immediate close
  - **Note**: Find the specific backdrop `onClick` handler and replace with `handleCloseAttempt`
  - **Requirement**: FR-005 (Conditional close based on dirty state)
  - **Dependency**: T015 (handleCloseAttempt must exist)

---

## Phase 3.5: Error Logging Enhancement (Optional)

**Note**: These tasks add structured error logging per NFR-003. Optional for minimal bugfix.

- [ ] **T018** [P] Add error logging to critical null-unsafe operations
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Locations**: Wrap critical operations (updateJobStatus, handleDeleteJob, etc.)
  - **Pattern**:
    ```typescript
    try {
      if (!selectedJob?._id) {
        throw new Error('selectedJob is null');
      }
      await updateJobStatus(selectedJob._id, status, note);
    } catch (error) {
      console.error('[JobDashboard] Null reference error:', {
        function: 'updateJobStatus',
        error: (error as Error).message,
        formState: {
          isCreatingNew,
          selectedJobId: selectedJob?._id,
          newJobFormId: newJobForm?._id,
          hasTitle: !!newJobForm?.title,
          hasCompany: !!newJobForm?.company
        }
      });
    }
    ```
  - **Requirement**: NFR-003 (Error logging with component + form state)
  - **Dependency**: T007-T012 (null guards must exist)

---

## Phase 3.6: Manual Testing & Validation

**CRITICAL**: All tests must pass before merging to main.

- [ ] **T019** Execute quickstart.md Scenario 1: Null Reference Error Reproduction
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 1)
  - **Steps**:
    1. Open http://localhost:5173
    2. Click "New Application"
    3. Leave form empty
    4. Click overview area (outside form)
  - **Pass Criteria**: No console errors, app doesn't crash, form closes immediately
  - **Document**: Screenshot of console (no errors)

- [ ] **T020** Execute quickstart.md Scenario 2: Empty Form Close
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 2)
  - **Pass Criteria**: Form closes immediately without confirmation dialog

- [ ] **T021** Execute quickstart.md Scenario 3: Unsaved Data Confirmation
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 3)
  - **Steps**: Fill one field, click outside
  - **Pass Criteria**: Confirmation dialog appears with "Discard changes" and "Continue editing"

- [ ] **T022** Execute quickstart.md Scenario 4: Continue Editing
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 4)
  - **Pass Criteria**: Data preserved after clicking "Continue editing"

- [ ] **T023** Execute quickstart.md Scenario 5: Discard Changes
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 5)
  - **Pass Criteria**: Form closes, data lost, not saved to backend

- [ ] **T024** Execute quickstart.md Scenario 6: Null Guard on Delete Button
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 6)
  - **Pass Criteria**: No crash when selectedJob is null

- [ ] **T025** Execute quickstart.md Scenario 7: Null Guard on Status Update
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 7)
  - **Pass Criteria**: No crash when updating status with null selectedJob

- [ ] **T026** Execute quickstart.md Scenario 8: Rapid Click Toggle
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 8)
  - **Pass Criteria**: No errors during rapid clicking

- [ ] **T027** Execute quickstart.md Scenario 9: Error Logging Verification
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 9)
  - **Pass Criteria**: Logs include component name, function, and form state (if logging implemented)

- [ ] **T028** Execute quickstart.md Scenario 10: Cross-Browser Compatibility
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 10)
  - **Browsers**: Chrome, Firefox, Safari, Edge
  - **Pass Criteria**: All browsers show identical behavior, no errors

- [ ] **T029** Execute quickstart.md Scenario 11: Performance Validation
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 11)
  - **Tool**: Chrome DevTools Performance tab
  - **Pass Criteria**: `hasUnsavedData()` <5ms, confirmation dialog <100ms

- [ ] **T030** Execute quickstart.md Scenario 12: Edge Cases
  - **File**: `specs/023-fix-null-reference/quickstart.md` (Scenario 12)
  - **Cases**: Status-only change, whitespace fields, browser back, refresh, rapid opens
  - **Pass Criteria**: All edge cases handled gracefully

---

## Phase 3.7: Polish & Finalization

- [x] **T031** Run TypeScript type-check
  - **Command**: `npm run type-check`
  - **Pass Criteria**: No new TypeScript errors introduced
  - **Fix**: Address any type errors related to optional chaining

- [ ] **T032** Verify no regression in existing functionality
  - **Test**: Create, edit, delete existing jobs (not new applications)
  - **Pass Criteria**: All existing features work normally

- [ ] **T033** Document testing results
  - **File**: Create `specs/023-fix-null-reference/test-results.md`
  - **Content**:
    - Summary of all 12 scenario results (pass/fail)
    - Screenshots of key scenarios (especially Scenario 1: no crash)
    - Browser compatibility matrix
    - Performance metrics

- [ ] **T034** Commit changes with conventional commit message
  - **Message**:
    ```
    fix: prevent null reference error in job creation form

    - Add null safety guards to 7 critical locations in JobDashboard.tsx
    - Implement dirty state detection for unsaved data (FR-006)
    - Add confirmation dialog for unsaved changes (FR-007, FR-008)
    - Fix TypeError: Cannot read properties of null (reading '_id')

    Fixes #023-fix-null-reference
    ```
  - **Include**: All modified files in `platform/core/src/frontend/`

---

## Dependencies

**Critical Path**:
1. Setup (T001-T003) → Everything
2. Null Guards (T007-T012) → Independent [can run in parallel after setup]
3. Dirty State (T013-T015) → Confirmation Dialog (T016-T017)
4. All Implementation (T007-T017) → Manual Testing (T019-T030)
5. Manual Testing → Polish (T031-T034)

**Parallel Opportunities**:
- T002, T003 can run in parallel
- T004, T005, T006 can run in parallel (if implementing contracts)
- T007-T012 can be done in parallel (different locations, same file - but low conflict risk)
- T019-T028 can be run in parallel (different test scenarios)

**Sequential Dependencies**:
- T013 blocks T015 (hasUnsavedData must exist before handleCloseAttempt)
- T014 blocks T016 (state must exist before dialog)
- T015 blocks T017 (handler must exist before wiring up)
- T016 blocks T017 (dialog must exist before wiring up)

---

## Parallel Execution Example

```bash
# Phase 3.2 - Implement contracts in parallel (optional):
Task: "Implement NullSafetyHelpers utilities"
Task: "Implement FormStateManager class"
Task: "Implement ConsoleErrorLogger class"

# Phase 3.3 - Apply null guards (low conflict risk, same file):
# Note: These modify different lines in same file - review carefully
Task: "Fix Line 2255: Title/Company display null guard"
Task: "Fix Line 2340: Delete button click handler null guard"
Task: "Fix Line 2369: Delete confirmation modal condition"

# Phase 3.6 - Run manual tests in parallel:
Task: "Execute quickstart.md Scenario 1: Null Reference Error"
Task: "Execute quickstart.md Scenario 2: Empty Form Close"
Task: "Execute quickstart.md Scenario 3: Unsaved Data Confirmation"
```

---

## Validation Checklist

**Before starting implementation**:
- [x] All contracts have corresponding implementation tasks (T004-T006 optional)
- [x] All 7 null reference locations have fix tasks (T007-T012) ✅
- [x] Dirty state detection implemented (T013-T015) ✅
- [x] Confirmation dialog implemented (T016-T017) ✅
- [x] All 12 manual test scenarios covered (T019-T030) ✅

**Before marking complete**:
- [ ] All 12 quickstart scenarios pass
- [ ] No new TypeScript errors
- [ ] No regression in existing functionality
- [ ] Code committed with proper message
- [ ] Ready for merge to main

---

## Notes

- **Minimal Approach**: For fastest bugfix, skip T004-T006 (contracts) and T018 (error logging). Focus on T007-T017 + manual testing.
- **Full Approach**: Implement all tasks including contracts and error logging for maximum maintainability.
- **Same File Edits**: T007-T012 all modify JobDashboard.tsx - be careful with merge conflicts if parallelizing.
- **Performance Budget**: <5ms for null checks (NFR-002) - easily met with optional chaining.
- **No New Dependencies**: Constraint satisfied - using only TypeScript/React built-ins.

---

**Total Tasks**: 34
**Estimated Time**:
- Minimal approach (T007-T017 + testing): 2-3 hours
- Full approach (all tasks): 4-5 hours

**Ready for execution** ✅
