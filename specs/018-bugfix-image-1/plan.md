# Implementation Plan: Progress Dates Consolidation Bug Fix

**Branch**: `018-bugfix-image-1` | **Date**: 2025-10-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-bugfix-image-1/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type: web application (frontend+backend) ✓
   → Set Structure Decision: Option 2 (Web application) ✓
3. Fill the Constitution Check section ✓
4. Evaluate Constitution Check section
   → No violations (bugfix adheres to existing patterns) ✓
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md ✓
6. Execute Phase 1 → data-model.md, contracts/, quickstart.md ✓
7. Re-evaluate Constitution Check section
   → No violations introduced ✓
   → Update Progress Tracking: Post-Design Constitution Check ✓
8. Plan Phase 2 → Describe task generation approach ✓
9. STOP - Ready for /tasks command ✓
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**Bug**: Feature 017's `consolidateWindow()` method currently deletes all intermediate entries but keeps only the **LAST** entry. This causes Progress Dates to show only the final status after consolidation.

**Fix**: Modify consolidation logic to keep **FIRST** entry (original status before window) **AND** **LAST** entry (final status at window end). Delete only truly intermediate entries. Special case: when first equals last (rollback), merge into ONE entry using original timestamp.

**Technical Approach**:
- Modify `consolidateWindow()` in both PostgreSQL and SQLite services
- Change `entries.slice(0, -1)` to `entries.slice(1, -1)` to preserve first entry
- Add special handling for rollback scenario (first === last status)
- Update `job_stage_timestamps` nullification logic for intermediate stages only
- No schema changes needed (existing `consolidation_window_id` FK already links entries)

## Technical Context
**Language/Version**: TypeScript 5.0+, Node.js 18+
**Primary Dependencies**: Express 4.x, React 18.x, pg (PostgreSQL client), sql.js (SQLite)
**Storage**: PostgreSQL (Supabase) + SQLite (sql.js) dual database support
**Testing**: Manual browser testing (TDD skipped per Feature 017 precedent)
**Target Platform**: Web browser (Chrome/Firefox/Safari) + Node.js backend
**Project Type**: web (frontend + backend monorepo)
**Performance Goals**: <200ms consolidation execution time
**Constraints**: Must preserve existing Feature 016 (5-second rollback) and Feature 017 (2-minute window) infrastructure
**Scale/Scope**: Affects job_status_history table (typically <100 entries per job)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No constitution file found - using defaults)

This bugfix:
- ✅ Adheres to existing architectural patterns (service layer methods)
- ✅ Maintains dual database support (PostgreSQL + SQLite)
- ✅ Preserves existing consolidation window infrastructure
- ✅ No new dependencies or complexity introduced
- ✅ Follows existing code style and patterns from Feature 017

## Project Structure

### Documentation (this feature)
```
specs/018-bugfix-image-1/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (generated below)
├── data-model.md        # Phase 1 output (generated below)
├── quickstart.md        # Phase 1 output (generated below)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
platform/core/src/
├── backend/
│   ├── database/
│   │   ├── postgresql-service.ts    # Fix consolidateWindow() method
│   │   └── sqlite-service.ts         # Fix consolidateWindow() method
│   └── api/
│       └── jobs.ts                   # No changes needed (already correct)
└── frontend/
    └── pages/
        └── JobDashboard.tsx          # No changes needed (displays from backend)

tests/ (manual browser testing for this bugfix)
```

**Structure Decision**: Web application structure (Option 2). This is a monorepo with `platform/core/src/` containing both backend (TypeScript/Express) and frontend (TypeScript/React) code. The bugfix targets backend database service layer only (`consolidateWindow()` methods in both PostgreSQL and SQLite services).

## Phase 0: Outline & Research

**Research Areas**:
1. Current consolidation implementation in Feature 017
2. Existing `job_stage_timestamps` update logic
3. Feature 016 interaction (5-second rollback vs 2-minute consolidation)

**Findings** (captured in research.md below):

### Current Implementation Analysis

**Bug Location**:
- File: `platform/core/src/backend/database/postgresql-service.ts:830`
- File: `platform/core/src/backend/database/sqlite-service.ts` (equivalent line)

**Current Code**:
```typescript
// Line 830: Deletes all entries EXCEPT the last one
const entriesToDelete = entries.slice(0, -1)
```

**Problem**: This keeps only the **LAST** entry, deleting everything including the **FIRST** entry (original status before consolidation window).

**Required Fix**:
```typescript
// Keep FIRST and LAST, delete only intermediate
const entriesToDelete = entries.slice(1, -1)
```

### Rollback Scenario Handling

**New Logic Needed**: When `first.status === last.status`, we need to:
1. Delete **ALL** intermediate entries AND the last entry
2. Keep only the first entry (with original timestamp)
3. Result: ONE entry remains (the original)

**Example**: B→C→D→A→D→C→B
- Current: Keeps only last B (deletes all including first B)
- Required: Keeps only first B (deletes all including last B)

### Stage Timestamps Logic

**Current Behavior**: No stage timestamp management during consolidation

**Required Logic**:
- Identify which stages appear ONLY in intermediate entries
- Set those stage timestamps to NULL
- Example: A→B→C→B consolidates to A, B
  - C was intermediate → `c_timestamp` = NULL
  - A and B are kept → `a_timestamp` and `b_timestamp` preserved

**Output**: research.md (see Phase 0 artifact below)

## Phase 1: Design & Contracts

### Data Model Changes

**No schema changes required**. Existing tables support the fix:
- `job_status_history` table: Already has `consolidation_window_id` FK
- `consolidation_windows` table: No changes needed
- `job_stage_timestamps` table: Structure unchanged, logic updated

### Contract Changes

**No API contract changes**. Existing endpoints remain:
- `PATCH /api/jobs/:id/status` - No changes
- `PUT /api/jobs/:id` - No changes
- `GET /api/jobs/:id/consolidation-status` - No changes

The bug fix is purely internal to the `consolidateWindow()` method.

### Method Signature Changes

**Modified Methods**:
1. `consolidateWindow(jobId: number, windowId: number): Promise<void>`
   - Signature: No change
   - Logic: Change deletion strategy from "keep last" to "keep first and last"

2. `updateStageTimestamp(jobId: number, currentStatus: string, newStatus: string): Promise<void>`
   - May need enhancement to handle NULL-ification of intermediate stages
   - Research needed: Check if this is called during consolidation or only during status updates

### Test Scenarios

**Critical Test Cases** (from spec.md):
1. **Rollback**: Applied → Screening → Applied
   - Expected: Only ONE "Applied" entry remains (using original timestamp)

2. **Multiple Changes**: Applied → Screening → Interview → Screening
   - Expected: "Applied" (first) and "Screening" (last) remain
   - Intermediate "Screening" and "Interview" deleted
   - Stage timestamp: `interview_at` = NULL

3. **Single Change**: Applied → Screening
   - Expected: Both "Applied" and "Screening" remain
   - No intermediate entries to delete

**Output**: data-model.md, contracts/ (N/A for this bugfix), quickstart.md (see Phase 1 artifacts below)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **T001**: Fix `consolidateWindow()` in PostgreSQL service
   - Modify `entries.slice(0, -1)` to `entries.slice(1, -1)` for normal case
   - Add rollback detection: `if (entries[0].status === entries[entries.length-1].status)`
   - Handle rollback: Delete all except first entry
   - Update logging to reflect "kept first and last" vs "kept first only (rollback)"

2. **T002**: Fix `consolidateWindow()` in SQLite service
   - Apply same logic as T001 to SQLite implementation
   - Ensure consistency with PostgreSQL version

3. **T003**: Add stage timestamp nullification logic
   - Identify intermediate statuses (those appearing only in deleted entries)
   - Call `updateStageTimestamp()` to set intermediate stage timestamps to NULL
   - May require new helper method: `nullifyIntermediateStageTimestamps()`

4. **T004**: Manual browser testing - Rollback scenario
   - Test: Applied → Screening → Applied
   - Verify: Only ONE "Applied" entry in Progress Dates
   - Verify: Timestamp matches original

5. **T005**: Manual browser testing - Multi-change scenario
   - Test: Applied → Screening → Interview → Screening
   - Verify: "Applied" and "Screening" in Progress Dates
   - Verify: `interview_at` = NULL in job_stage_timestamps

6. **T006**: Manual browser testing - Single change scenario
   - Test: Applied → Screening
   - Verify: Both entries preserved

**Ordering Strategy**:
- T001, T002 can run in parallel [P]
- T003 depends on T001/T002 completion
- T004-T006 are manual validation (sequential)

**Estimated Output**: 6 tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md)
**Phase 5**: Validation (manual browser testing per quickstart.md)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No complexity violations. This is a straightforward bugfix to existing consolidation logic.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no deviations)

---

## Artifacts Generated

### Phase 0 Artifact: research.md
Created at: `specs/018-bugfix-image-1/research.md`

### Phase 1 Artifacts:
- `data-model.md` - No schema changes, logic updates only
- `quickstart.md` - Manual testing guide
- No contracts/ needed (internal bugfix)

**Ready for `/tasks` command** to generate tasks.md from this plan.
