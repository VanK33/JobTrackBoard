# Tasks: Progress Dates Consolidation Bug Fix

**Input**: Design documents from `/specs/018-bugfix-image-1/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript 5.0+, Node.js 18+, Express 4.x, React 18.x
   → Libraries: pg (PostgreSQL), sql.js (SQLite)
   → Structure: Web app (platform/core/src/backend + frontend)
2. Load design documents:
   → data-model.md: No schema changes, logic-only fix in consolidateWindow()
   → research.md: Bug at line 830, rollback scenario, stage timestamps
   → quickstart.md: 3 manual test scenarios
3. Generate tasks by category:
   → Setup: None needed (existing infrastructure)
   → Tests: Manual browser tests (following Feature 017 precedent)
   → Core: Fix consolidateWindow() in PostgreSQL and SQLite services
   → Integration: Add nullifyStageTimestamp() helper method
   → Polish: Manual testing validation
4. Apply task rules:
   → T001-T002 [P]: Different files (postgresql-service.ts vs sqlite-service.ts)
   → T003: Sequential (depends on T001/T002)
   → T004-T006: Manual tests (sequential)
5. Total: 6 tasks
6. Validation: All functional requirements covered (FR-001 to FR-010)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
**Web app structure**: `platform/core/src/backend/` and `platform/core/src/frontend/`

---

## Phase 3.1: Setup
**SKIPPED**: No setup needed - bug fix uses existing infrastructure from Feature 017

---

## Phase 3.2: Tests First (TDD)
**SKIPPED**: Manual browser testing only (following Feature 017 precedent, see plan.md line 146)

**Rationale**: Feature 017 implementation did not include automated tests. This bugfix follows the same manual testing approach for consistency.

---

## Phase 3.3: Core Implementation

### T001 [P] ✅ Fix consolidateWindow() in PostgreSQL service
**File**: `platform/core/src/backend/database/postgresql-service.ts`
**Location**: Line 830 (method `consolidateWindow`)
**Changes**:
1. Replace current deletion logic:
   ```typescript
   // REMOVE THIS (line 830):
   const entriesToDelete = entries.slice(0, -1)
   ```

2. Add rollback detection and correct deletion logic:
   ```typescript
   // ADD THIS:
   let entriesToDelete: StatusHistoryEntry[];

   if (entries[0].status === entries[entries.length - 1].status) {
     // Rollback scenario: first and last have same status
     // Keep only FIRST entry (delete all others including last)
     entriesToDelete = entries.slice(1);
     logger.info('Consolidation: Rollback detected', {
       jobId,
       windowId,
       status: entries[0].status,
       kept: 1,
       deleted: entriesToDelete.length
     });
   } else {
     // Normal scenario: first and last have different statuses
     // Keep FIRST and LAST, delete only intermediate
     entriesToDelete = entries.slice(1, -1);
     logger.info('Consolidation: Normal scenario', {
       jobId,
       windowId,
       kept: 2,
       deleted: entriesToDelete.length
     });
   }
   ```

3. Add stage timestamp nullification logic AFTER the deletion loop:
   ```typescript
   // Identify intermediate statuses (those appearing only in deleted entries)
   const keptStatuses = new Set([entries[0].status]);
   if (entries[0].status !== entries[entries.length - 1].status) {
     keptStatuses.add(entries[entries.length - 1].status);
   }

   const deletedStatuses = entriesToDelete
     .map(e => e.status)
     .filter(s => !keptStatuses.has(s));

   // Nullify stage timestamps for intermediate stages only
   for (const status of new Set(deletedStatuses)) {
     await this.nullifyStageTimestamp(jobId, status);
   }
   ```

4. Add new helper method `nullifyStageTimestamp()` to the class:
   ```typescript
   async nullifyStageTimestamp(jobId: number, status: string): Promise<void> {
     const columnMap: Record<string, string> = {
       'applied': 'applied_at',
       'screening': 'screening_at',
       'interview': 'interview_at',
       'offered': 'offered_at',
       'rejected': 'rejected_at'
     };

     const column = columnMap[status.toLowerCase()];
     if (!column) {
       logger.warn('Unknown status for timestamp nullification', { jobId, status });
       return;
     }

     await this.query(
       `UPDATE job_stage_timestamps SET ${column} = NULL WHERE job_id = $1`,
       [jobId]
     );

     logger.info('Stage timestamp nullified', { jobId, status, column });
   }
   ```

**Acceptance Criteria**:
- Rollback scenario: When first.status === last.status, keep only first entry
- Normal scenario: Keep first and last, delete intermediate entries
- Stage timestamps: Nullify only for intermediate stages (not in first or last)
- Logging: Clear distinction between rollback and normal scenarios

**References**:
- research.md lines 11-28 (bug analysis)
- research.md lines 49-66 (rollback handling)
- data-model.md lines 106-122 (implementation details)

---

### T002 [P] ✅ Fix consolidateWindow() in SQLite service
**File**: `platform/core/src/backend/database/sqlite-service.ts`
**Location**: Method `consolidateWindow` (equivalent to PostgreSQL line 830)
**Changes**: Apply the EXACT same logic as T001, but using SQLite-specific patterns:

1. Replace deletion logic with rollback detection (same as T001)

2. Add stage timestamp nullification (adapt for SQLite):
   ```typescript
   // Same keptStatuses and deletedStatuses logic as T001

   // Nullify stage timestamps using SQLite's db.run()
   for (const status of new Set(deletedStatuses)) {
     await this.nullifyStageTimestamp(jobId, status);
   }
   ```

3. Add `nullifyStageTimestamp()` method for SQLite:
   ```typescript
   async nullifyStageTimestamp(jobId: number, status: string): Promise<void> {
     const columnMap: Record<string, string> = {
       'applied': 'applied_at',
       'screening': 'screening_at',
       'interview': 'interview_at',
       'offered': 'offered_at',
       'rejected': 'rejected_at'
     };

     const column = columnMap[status.toLowerCase()];
     if (!column) {
       logger.warn('Unknown status for timestamp nullification', { jobId, status });
       return;
     }

     return new Promise((resolve, reject) => {
       this.db!.run(
         `UPDATE job_stage_timestamps SET ${column} = NULL WHERE job_id = ?`,
         [jobId],
         (err) => {
           if (err) {
             logger.error('Failed to nullify stage timestamp', { jobId, status, error: err.message });
             reject(err);
           } else {
             logger.info('Stage timestamp nullified', { jobId, status, column });
             resolve();
           }
         }
       );
     });
   }
   ```

**Acceptance Criteria**:
- Exact same behavior as PostgreSQL implementation (T001)
- SQLite-specific query execution using `db.run()` instead of `this.query()`
- Same logging patterns

**References**:
- T001 implementation (PostgreSQL version)
- plan.md lines 177-181 (SQLite consistency requirement)

---

## Phase 3.4: Integration
**SKIPPED**: No integration changes needed - existing consolidation window infrastructure already supports the fix

---

## Phase 3.5: Polish

### T003 ✅ Build and verify TypeScript compilation
**Command**:
```bash
npm run type-check
```
**Purpose**: Verify that changes to PostgreSQL and SQLite services compile without errors

**Acceptance Criteria**:
- No TypeScript compilation errors
- No type mismatches in new `nullifyStageTimestamp()` method
- Proper typing for `entriesToDelete` variable

**Dependencies**: T001, T002 must be completed

**References**: plan.md line 46 (TypeScript 5.0+ requirement)

---

### T004 Manual browser test: Rollback scenario
**File**: Follow instructions in `specs/018-bugfix-image-1/quickstart.md`
**Section**: "Test Scenario 1: Rollback to Original Status"

**Steps**:
1. Start dev server: `npm run dev`
2. Navigate to Job Dashboard (http://localhost:5173 or 5174)
3. Find test job with status "Applied"
4. Record original "Applied" timestamp
5. Change: Applied → Screening → Applied (within 2 minutes)
6. Verify immediate state shows 3 entries
7. Wait 2 minutes for consolidation
8. Refresh job and verify consolidated state

**Acceptance Criteria** (from spec.md FR-001, FR-004a):
- ✅ Progress Dates shows only ONE "Applied" entry
- ✅ Timestamp matches ORIGINAL timestamp (not newest)
- ✅ Browser console shows: `Consolidation: Rollback detected {kept: 1, deleted: 2}`
- ✅ Stage timestamp for "screening" is NULL

**References**:
- quickstart.md lines 17-58 (detailed test steps)
- spec.md lines 72-73 (acceptance scenario 1)

**Dependencies**: T003 (must compile first)

---

### T005 Manual browser test: Multiple status changes
**File**: Follow instructions in `specs/018-bugfix-image-1/quickstart.md`
**Section**: "Test Scenario 2: Multiple Status Changes"

**Steps**:
1. Start dev server (if not already running)
2. Find test job with status "Applied"
3. Change: Applied → Screening → Interview → Screening (within 2 minutes)
4. Verify immediate state shows 4 entries
5. Wait 2 minutes for consolidation
6. Refresh job and verify consolidated state

**Acceptance Criteria** (from spec.md FR-001, FR-002):
- ✅ Progress Dates shows exactly 2 entries: "Applied" (first) and "Screening" (last)
- ✅ Intermediate entries deleted (Interview, middle Screening)
- ✅ Browser console shows: `Consolidation: Normal scenario {kept: 2, deleted: 2}`
- ✅ Database query shows only 2 rows for this job's status history
- ✅ Stage timestamp: `interview_at` is NULL (only appeared in intermediate)

**References**:
- quickstart.md lines 60-101 (detailed test steps)
- spec.md lines 74-77 (acceptance scenario 2)
- data-model.md lines 112-128 (data flow example)

**Dependencies**: T004 (sequential testing)

---

### T006 Manual browser test: Single status change
**File**: Follow instructions in `specs/018-bugfix-image-1/quickstart.md`
**Section**: "Test Scenario 3: Single Status Change"

**Steps**:
1. Find test job with status "Applied"
2. Change: Applied → Screening (only one change)
3. Wait 2 minutes for consolidation
4. Refresh job and verify consolidated state

**Acceptance Criteria** (from spec.md FR-010):
- ✅ Progress Dates shows 2 entries: "Applied" (first) and "Screening" (last)
- ✅ No intermediate entries to delete (first and last are the only entries)
- ✅ Both timestamps preserved

**Rationale**: When only one status change occurs, there are no intermediate entries. The "first" and "last" are the only two entries, so both must be preserved.

**References**:
- quickstart.md lines 103-128 (detailed test steps)
- spec.md lines 78-79 (acceptance scenario 3)

**Dependencies**: T005 (sequential testing)

---

## Dependencies

**Parallel Execution**:
- T001 and T002 can run in parallel [P] (different files)

**Sequential Execution**:
- T003 blocks T004 (must compile before testing)
- T004 blocks T005 (manual tests sequential)
- T005 blocks T006 (manual tests sequential)

**Dependency Graph**:
```
T001 [P] ─┐
          ├─→ T003 ─→ T004 ─→ T005 ─→ T006
T002 [P] ─┘
```

---

## Parallel Example

### Launch T001 and T002 together:
Since these tasks modify different files (`postgresql-service.ts` vs `sqlite-service.ts`), they can be implemented in parallel:

```bash
# Option 1: Use Task agents
Task: "Fix consolidateWindow() in PostgreSQL service at platform/core/src/backend/database/postgresql-service.ts line 830"
Task: "Fix consolidateWindow() in SQLite service at platform/core/src/backend/database/sqlite-service.ts"

# Option 2: Manual implementation
# Terminal 1: Edit postgresql-service.ts
# Terminal 2: Edit sqlite-service.ts
```

---

## Notes

- **[P] tasks**: T001 and T002 modify different files, no conflicts
- **Manual testing**: No automated tests (following Feature 017 precedent)
- **Performance goal**: Consolidation must complete in <200ms (plan.md line 49)
- **Commit strategy**: Commit after T002 completes (both services fixed together)
- **No API changes**: Bug fix is internal to database layer (plan.md line 165)

---

## Task Generation Rules Applied

1. **From Data Model** (data-model.md):
   - No schema changes → No migration tasks
   - Logic changes in 2 files → T001, T002 [P]

2. **From Research** (research.md):
   - Bug location identified → T001, T002 target exact line numbers
   - Rollback scenario → Handled in T001/T002 logic
   - Stage timestamps → Added to T001/T002 implementation

3. **From Quickstart** (quickstart.md):
   - 3 test scenarios → T004, T005, T006 (manual tests)
   - Browser console verification → Included in acceptance criteria

4. **Ordering**:
   - Core implementation (T001-T002) → Build verification (T003) → Manual tests (T004-T006)

---

## Validation Checklist

- [x] All functional requirements covered (FR-001 to FR-010 from spec.md)
- [x] All test scenarios from quickstart.md have tasks (T004-T006)
- [x] Parallel tasks truly independent (T001 ≠ T002, different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Performance requirement included (<200ms in notes)
- [N/A] Contracts - No API contract changes needed
- [N/A] Automated tests - Manual testing only (Feature 017 precedent)

---

## Estimated Effort

**Total**: ~30 minutes (per research.md line 181)

- T001: 10 minutes (PostgreSQL fix)
- T002: 10 minutes (SQLite fix)
- T003: 1 minute (type check)
- T004: 3 minutes (rollback test)
- T005: 3 minutes (multi-change test)
- T006: 3 minutes (single change test)

---

## Success Criteria

All tasks complete when:

1. ✅ Both PostgreSQL and SQLite services implement correct consolidation logic
2. ✅ TypeScript compilation succeeds
3. ✅ Rollback test passes (ONE entry with original timestamp)
4. ✅ Multi-change test passes (FIRST and LAST entries only)
5. ✅ Single change test passes (both entries preserved)
6. ✅ Stage timestamps nullified correctly for intermediate stages

---

## Additional Resources

- **Spec**: `specs/018-bugfix-image-1/spec.md` - Requirements (FR-001 to FR-010)
- **Plan**: `specs/018-bugfix-image-1/plan.md` - Implementation approach
- **Research**: `specs/018-bugfix-image-1/research.md` - Bug analysis
- **Data Model**: `specs/018-bugfix-image-1/data-model.md` - Logic changes
- **Quickstart**: `specs/018-bugfix-image-1/quickstart.md` - Testing guide
