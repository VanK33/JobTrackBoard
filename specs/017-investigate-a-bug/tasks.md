# Tasks: Progress Date 2-Minute Consolidation Window

**Input**: Design documents from `/specs/017-investigate-a-bug/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md
**Tech Stack**: TypeScript 5.0+, Node.js 18+, Express 4, React 18, Vite 5, PostgreSQL/SQLite, Jest 29
**Branch**: `017-investigate-a-bug`

## Path Conventions
- **Backend**: `platform/core/src/backend/`
- **Frontend**: `platform/core/src/frontend/`
- **Tests**: `platform/core/tests/` (to be created)

## Phase 3.1: Setup & Database Schema

- [x] **T001** Create test directories: `platform/core/tests/{contract,integration,unit}/`
- [x] **T002** [P] Database migration (PostgreSQL): Create `consolidation_windows` table in `platform/core/src/backend/database/postgresql-service.ts` (lines after `initialize()` method)
- [x] **T003** [P] Database migration (SQLite): Create `consolidation_windows` table in `platform/core/src/backend/database/sqlite-service.ts` (lines after `initialize()` method)
- [x] **T004** [P] Schema migration (PostgreSQL): Add `consolidation_window_id` column to `job_status_history` table (ALTER TABLE in `postgresql-service.ts`)
- [x] **T005** [P] Schema migration (SQLite): Recreate `job_status_history` table with `consolidation_window_id` column (following SQLite migration pattern in data-model.md)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoint Behavior)
- [ ] **T006** [P] Contract test: Start consolidation window on first update in `platform/core/tests/contract/consolidation-start-window.test.ts`
  - Test: PATCH `/api/jobs/:id/status` with new status
  - Assert: `response.consolidationWindow.windowStartTime` exists
  - Assert: `response.consolidationWindow.windowEndTime = windowStartTime + 120000`
  - Assert: `response.consolidationWindow.isActive === true`
  - Assert: `response.consolidationWindow.remainingMs <= 120000`

- [ ] **T007** [P] Contract test: Timer fixed (doesn't reset) in `platform/core/tests/contract/consolidation-fixed-timer.test.ts`
  - Test: PATCH `/api/jobs/:id/status` (first update at T=0)
  - Wait 30 seconds
  - Test: PATCH `/api/jobs/:id/status` (second update at T=30)
  - Assert: `response.consolidationWindow.windowStartTime` unchanged
  - Assert: `response.consolidationWindow.windowEndTime` unchanged
  - Assert: `remainingMs` decreased by ~30000ms

- [ ] **T008** [P] Contract test: Lazy consolidation on expired windows in `platform/core/tests/contract/consolidation-lazy-cleanup.test.ts`
  - Setup: Create job, manually insert expired window (windowEndTime < Date.now())
  - Setup: Add 3 status history entries linked to expired window
  - Test: PATCH `/api/jobs/:id/status` with new status
  - Assert: Old window consolidated (only last entry remains from old window)
  - Assert: New consolidation window created for new update

- [ ] **T009** [P] Contract test: Consolidation window in API response in `platform/core/tests/contract/consolidation-response-format.test.ts`
  - Test: PATCH `/api/jobs/:id/status`
  - Assert: `response.consolidationWindow` object exists
  - Assert: `remainingMs` field present and > 0
  - Assert: `remainingMs <= 120000`
  - Assert: Response follows OpenAPI schema from contracts/jobs-api.yaml

- [ ] **T010** [P] Contract test: GET `/api/jobs/:id/consolidation-status` endpoint in `platform/core/tests/contract/consolidation-status-endpoint.test.ts`
  - Test: GET endpoint with active window
  - Assert: Returns window info with `remainingMs`
  - Test: GET endpoint with no active window
  - Assert: Returns `{ consolidationWindow: null }`

### Integration Tests (User Scenarios from quickstart.md)
- [ ] **T011** [P] Integration test: Scenario 1 - Rapid updates visible immediately in `platform/core/tests/integration/consolidation-rapid-updates.test.ts`
  - Simulate: applied → screening → interview → screening (within 2 min)
  - Assert: All 4 history entries exist during window
  - Wait: 2 minutes
  - Assert: Consolidated to 2 entries (applied + final screening)

- [ ] **T012** [P] Integration test: Scenario 2 - Consolidation after 2 minutes in `platform/core/tests/integration/consolidation-final-status.test.ts`
  - Simulate: Status changes within 2-minute window
  - Wait: Exactly 2 minutes from first update
  - Trigger: New request (lazy consolidation)
  - Assert: Only first and final status remain

- [ ] **T013** [P] Integration test: Scenario 3 - Complex pattern A→B→C→D→C→D→A→B in `platform/core/tests/integration/consolidation-complex-pattern.test.ts`
  - Simulate: 7 status updates following pattern
  - Assert: All 8 entries exist during window (initial + 7 updates)
  - Wait: 2 minutes
  - Assert: Consolidated to 2 entries (initial applied + final screening)

- [ ] **T014** [P] Integration test: Scenario 5 - New window after consolidation in `platform/core/tests/integration/consolidation-new-window.test.ts`
  - Create: First window, wait 2 min, consolidate
  - Update: Status again (after consolidation)
  - Assert: New window started with new `windowStartTime`
  - Assert: Old window entries consolidated correctly

- [ ] **T015** Integration test: Scenario 6 - Fixed timer (update at 1:59 → consolidate at 2:00) in `platform/core/tests/integration/consolidation-fixed-timer-validation.test.ts`
  - Update: Status at T=0
  - Wait: 119 seconds
  - Update: Status at T=119 (1 sec before expiration)
  - Assert: `windowEndTime` unchanged
  - Assert: `remainingMs < 2000`
  - Wait: 2 seconds
  - Assert: Window consolidated at T=120 (not T=239)

- [ ] **T016** [P] Integration test: Edge case - Browser close during window in `platform/core/tests/integration/consolidation-browser-close.test.ts`
  - Simulate: Status updates, then "close browser" (no frontend timer)
  - Wait: 2 minutes
  - Fetch: Job data (triggers lazy consolidation)
  - Assert: Backend detected expired window and consolidated

- [ ] **T017** [P] Integration test: Edge case - Concurrent windows for multiple jobs in `platform/core/tests/integration/consolidation-concurrent-windows.test.ts`
  - Create: Job A and Job B
  - Start: Window for Job A at T=0
  - Start: Window for Job B at T=30
  - Assert: Job A consolidates at T=120
  - Assert: Job B still active at T=120
  - Assert: Job B consolidates at T=150

## Phase 3.3: Backend Implementation (ONLY after tests are failing)

### Database Service Methods
- [x] **T018** [P] Implement `getActiveConsolidationWindow()` in `platform/core/src/backend/database/postgresql-service.ts` (new method after `getStatusHistory()`)
  - Query: SELECT from consolidation_windows WHERE job_id = ? AND is_active = TRUE
  - Return: ConsolidationWindow | null

- [x] **T019** [P] Implement `getActiveConsolidationWindow()` in `platform/core/src/backend/database/sqlite-service.ts` (same location as T018)

- [x] **T020** [P] Implement `startConsolidationWindow()` in `platform/core/src/backend/database/postgresql-service.ts` (new method after T018)
  - Insert: New row in consolidation_windows table
  - Fields: jobId, windowStartTime (Date.now()), windowEndTime (start + 120000), firstStatus, isActive (TRUE)
  - Return: Created window with ID

- [x] **T021** [P] Implement `startConsolidationWindow()` in `platform/core/src/backend/database/sqlite-service.ts` (same location as T020)

- [x] **T022** [P] Implement `checkAndConsolidateExpiredWindow()` in `platform/core/src/backend/database/postgresql-service.ts` (new method after T020)
  - Get: Active window for job
  - Check: If Date.now() >= windowEndTime
  - If expired: Call `consolidateWindow()`
  - Logic: Lazy consolidation pattern

- [x] **T023** [P] Implement `checkAndConsolidateExpiredWindow()` in `platform/core/src/backend/database/sqlite-service.ts` (same location as T022)

- [x] **T024** [P] Implement `consolidateWindow()` in `platform/core/src/backend/database/postgresql-service.ts` (new method after T022)
  - Query: Get all history entries WHERE consolidation_window_id = windowId ORDER BY changed_at ASC
  - Delete: All entries EXCEPT last one (slice(0, -1))
  - Update: Mark window is_active = FALSE
  - Return: Void

- [x] **T025** [P] Implement `consolidateWindow()` in `platform/core/src/backend/database/sqlite-service.ts` (same location as T024)

### API Endpoint Updates
- [x] **T026** Update PATCH `/api/jobs/:id/status` endpoint in `platform/core/src/backend/api/jobs.ts` (modify existing handler, lines ~265-274)
  - Step 1: Call `checkAndConsolidateExpiredWindow(jobId)` at start
  - Step 2: Get or create active window (getActiveConsolidationWindow || startConsolidationWindow)
  - Step 3: Link new status history entry to window (pass windowId to addStatusHistory)
  - Step 4: Add consolidation window info to response (with remainingMs calculated)

- [x] **T027** Update PUT `/api/jobs/:id` endpoint in `platform/core/src/backend/api/jobs.ts` (modify existing handler, lines ~130-141)
  - Same consolidation logic as T026 (if status field updated)
  - Reuse lazy consolidation check and window management

- [x] **T028** [P] Add GET `/api/jobs/:id/consolidation-status` endpoint in `platform/core/src/backend/api/jobs.ts` (new route after existing endpoints)
  - Get: Active consolidation window for job
  - Calculate: remainingMs = Math.max(0, windowEndTime - Date.now())
  - Return: { consolidationWindow: { ...window, remainingMs } } or { consolidationWindow: null }

- [x] **T029** Modify `addStatusHistory()` in `platform/core/src/backend/database/postgresql-service.ts` (lines ~192-222)
  - Add parameter: `consolidationWindowId?: number`
  - Include: consolidation_window_id in INSERT statement
  - Update both PostgreSQL and SQLite versions

- [x] **T030** Modify `addStatusHistory()` in `platform/core/src/backend/database/sqlite-service.ts` (same modification as T029)

## Phase 3.4: Frontend Implementation

- [x] **T031** Add consolidation timer state in `platform/core/src/frontend/pages/JobDashboard.tsx` (add after existing refs, line ~143)
  - Add: `const consolidationTimerRef = React.useRef<NodeJS.Timeout | null>(null)`
  - Add: `const [activeConsolidationWindow, setActiveConsolidationWindow] = React.useState<ConsolidationWindow | null>(null)`

- [x] **T032** Implement client-side timer logic in `platform/core/src/frontend/pages/JobDashboard.tsx` (in status update handler, lines ~1160-1180)
  - On status update response: Extract `consolidationWindow` from response
  - If window exists: Calculate remaining time from `remainingMs`
  - Set timer: `setTimeout(() => refetchJob(), remainingMs)` (uses remainingMs from server)
  - Clear old timer if exists (debounce)

- [x] **T033** Add timer cleanup on unmount in `platform/core/src/frontend/pages/JobDashboard.tsx` (in useEffect cleanup, lines ~335-340)
  - Check: If `consolidationTimerRef.current` exists
  - Clear: `clearTimeout(consolidationTimerRef.current)`

- [x] **T034** Persist window start time to localStorage in `platform/core/src/frontend/pages/JobDashboard.tsx` (after setting timer)
  - Store: `localStorage.setItem(\`consolidation_window_\${jobId}\`, String(windowStartTime))`
  - Retrieve on mount: Check localStorage for active window
  - Resume timer: If window active, calculate remaining time and restart timer

- [x] **T035** Add consolidation recovery on page load in `platform/core/src/frontend/pages/JobDashboard.tsx` (in useEffect for selectedJob)
  - Check: localStorage for `consolidation_window_${selectedJob.id}`
  - If found: Calculate elapsed time
  - If elapsed < 120000: Resume timer with remaining time
  - If elapsed >= 120000: Trigger immediate refetch (consolidation overdue)

- [x] **T036** Refetch job data after timer expires in `platform/core/src/frontend/pages/JobDashboard.tsx` (timer callback)
  - Call: `refreshJobData(jobId)` when timer fires
  - Clear: localStorage key after consolidation
  - Log: Console message "🔄 Consolidation window expired, refetching data"

## Phase 3.5: Integration & Testing

- [ ] **T037** Test Feature 016 + Feature 017 interaction in `platform/core/tests/integration/feature-016-017-coexistence.test.ts`
  - Scenario: A→B→A within 5 seconds (Feature 016 triggers)
  - Then: Continue with C→D within 2-minute window (Feature 017 active)
  - Assert: Feature 016 deletes B immediately
  - Assert: Feature 017 consolidates remaining at 2-minute mark

- [ ] **T038** Verify lazy consolidation works across browser reload (manual test following quickstart.md)
  - Use: Scenario from quickstart.md "Browser Close During Window"
  - Verify: Backend consolidates when job fetched after 2 minutes

- [ ] **T039** Test concurrent consolidation windows (manual test following quickstart.md)
  - Use: Scenario from quickstart.md "Multiple Jobs with Concurrent Windows"
  - Verify: Each job has independent window lifecycle

## Phase 3.6: Polish & Documentation

- [ ] **T040** [P] Unit test: `calculateRemainingMs()` helper in `platform/core/tests/unit/consolidation-utils.test.ts`
  - Test: Remaining time calculation accuracy
  - Test: Edge case: windowEndTime in past (should return 0)
  - Test: Edge case: windowEndTime far future

- [ ] **T041** [P] Unit test: Window expiration check in `platform/core/tests/unit/consolidation-expiration.test.ts`
  - Test: `isWindowExpired(window)` returns true when Date.now() >= windowEndTime
  - Test: Returns false when window still active

- [ ] **T042** [P] Performance test: Status update latency in `platform/core/tests/performance/consolidation-latency.test.ts`
  - Measure: PATCH `/api/jobs/:id/status` endpoint response time
  - Assert: p95 latency < 100ms (target from plan.md)
  - Test: With active window
  - Test: With expired window (lazy consolidation)

- [ ] **T043** [P] Performance test: Lazy consolidation check overhead in `platform/core/tests/performance/consolidation-check-overhead.test.ts`
  - Measure: `checkAndConsolidateExpiredWindow()` execution time
  - Assert: p95 latency < 50ms (target from plan.md)

- [ ] **T044** Update memory.md in `.claude/memory.md`
  - Add: Feature 017 to current status section
  - Document: Key decisions (fixed window, database table, lazy consolidation)
  - Update: Next actions list

- [ ] **T045** Run manual validation following `specs/017-investigate-a-bug/quickstart.md`
  - Execute: All 6 manual test scenarios
  - Verify: Consolidation behavior matches spec.md requirements
  - Check: Performance targets met (<100ms status updates)

- [ ] **T046** [P] Add TypeScript interfaces to shared types in `platform/core/src/frontend/types.ts`
  - Add: `ConsolidationWindow` interface
  - Add: `ConsolidationWindowWithRemaining` interface
  - Export: For use in JobDashboard component

- [ ] **T047** Code review: Remove Feature 017 TODOs and debugging logs
  - Search: `// TODO.*017` or `// FIXME.*consolidation`
  - Remove: All temporary console.log statements
  - Keep: Only production-level logging (console.log for consolidation events)

## Dependencies

**Setup blocks Tests**:
- T001-T005 must complete before T006-T017

**Tests block Implementation**:
- T006-T017 must complete (and fail) before T018-T047

**Backend dependencies**:
- T018-T019 (getActiveConsolidationWindow) before T026-T028 (endpoints)
- T020-T021 (startConsolidationWindow) before T026-T028
- T022-T023 (checkAndConsolidateExpiredWindow) before T026-T027
- T024-T025 (consolidateWindow) before T022-T023
- T029-T030 (addStatusHistory modification) before T026-T027

**Frontend dependencies**:
- T031 (state setup) before T032-T036
- T032 (timer logic) before T033-T036
- Backend endpoints (T026-T028) before frontend implementation (T031-T036)

**Polish dependencies**:
- Implementation (T018-T036) before polish (T040-T047)

## Parallel Execution Examples

### Setup Phase (T002-T005 in parallel):
```typescript
// Launch database migrations together:
Task("Database migration (PostgreSQL): Create consolidation_windows table", { subagent_type: "general-purpose" })
Task("Database migration (SQLite): Create consolidation_windows table", { subagent_type: "general-purpose" })
Task("Schema migration (PostgreSQL): Add consolidation_window_id column", { subagent_type: "general-purpose" })
Task("Schema migration (SQLite): Recreate job_status_history table", { subagent_type: "general-purpose" })
```

### Contract Tests (T006-T010 in parallel):
```typescript
// All contract tests are independent:
Task("Contract test: Start consolidation window", { subagent_type: "general-purpose" })
Task("Contract test: Timer fixed", { subagent_type: "general-purpose" })
Task("Contract test: Lazy consolidation", { subagent_type: "general-purpose" })
Task("Contract test: Response format", { subagent_type: "general-purpose" })
Task("Contract test: GET consolidation-status endpoint", { subagent_type: "general-purpose" })
```

### Integration Tests (T011-T014, T016-T017 in parallel):
```typescript
// Independent test files:
Task("Integration: Rapid updates scenario", { subagent_type: "general-purpose" })
Task("Integration: Final status scenario", { subagent_type: "general-purpose" })
Task("Integration: Complex pattern scenario", { subagent_type: "general-purpose" })
Task("Integration: New window scenario", { subagent_type: "general-purpose" })
Task("Integration: Browser close edge case", { subagent_type: "general-purpose" })
Task("Integration: Concurrent windows edge case", { subagent_type: "general-purpose" })
```

### Backend Implementation (T018-T025 in parallel - grouped by database):
```typescript
// PostgreSQL methods (independent):
Task("Implement getActiveConsolidationWindow (PostgreSQL)", { subagent_type: "general-purpose" })
Task("Implement startConsolidationWindow (PostgreSQL)", { subagent_type: "general-purpose" })
Task("Implement checkAndConsolidateExpiredWindow (PostgreSQL)", { subagent_type: "general-purpose" })
Task("Implement consolidateWindow (PostgreSQL)", { subagent_type: "general-purpose" })

// SQLite methods (independent):
Task("Implement getActiveConsolidationWindow (SQLite)", { subagent_type: "general-purpose" })
Task("Implement startConsolidationWindow (SQLite)", { subagent_type: "general-purpose" })
Task("Implement checkAndConsolidateExpiredWindow (SQLite)", { subagent_type: "general-purpose" })
Task("Implement consolidateWindow (SQLite)", { subagent_type: "general-purpose" })
```

### Polish Phase (T040-T043, T046-T047 in parallel):
```typescript
// Independent polish tasks:
Task("Unit test: calculateRemainingMs helper", { subagent_type: "general-purpose" })
Task("Unit test: Window expiration check", { subagent_type: "general-purpose" })
Task("Performance test: Status update latency", { subagent_type: "general-purpose" })
Task("Performance test: Lazy consolidation check", { subagent_type: "general-purpose" })
Task("Add TypeScript interfaces to shared types", { subagent_type: "general-purpose" })
Task("Code review: Remove TODOs and debug logs", { subagent_type: "general-purpose" })
```

## Notes

- **[P] tasks** = Different files, no dependencies, can run in parallel
- **TDD Workflow**: All tests (T006-T017) must be written and failing before starting implementation (T018+)
- **Verify tests fail** before implementing features (red-green-refactor)
- **Commit strategy**: Commit after each task or logical group
- **Feature 016 coexistence**: Keep existing `cleanupStatusRollback()` - do not remove
- **Session-based architecture**: All database operations use session from `x-database-config` header
- **Performance targets**: <100ms p95 for status updates, <50ms for lazy consolidation check

## Validation Checklist
*GATE: Check before marking tasks complete*

- [ ] All contract tests written and failing (T006-T010)
- [ ] All integration tests written and failing (T011-T017)
- [ ] Backend methods implement lazy consolidation pattern
- [ ] Frontend timer uses `remainingMs` from server (not hardcoded 120000)
- [ ] localStorage persistence works across page reload
- [ ] Consolidation window info included in all API responses
- [ ] Migration scripts tested for both PostgreSQL and SQLite
- [ ] Feature 016 (5-sec rollback) still works alongside Feature 017
- [ ] Performance targets met (<100ms status update, <50ms lazy check)
- [ ] Manual validation completed (quickstart.md scenarios)

---

**Total Tasks**: 47 tasks
**Estimated Completion**: Phase 3 (implementation) complete after all tasks done
**Next Command**: Execute tasks sequentially or in parallel groups as indicated
