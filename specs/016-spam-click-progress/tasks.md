# Tasks: Prevent Status Update Spam & Expand Detail View

**Input**: Design documents from `/specs/016-spam-click-progress/`
**Prerequisites**: plan.md ✅, research.md ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Tech stack: TypeScript 5.0+, Node.js 18+, React 18, Express 4
   → ✅ Two independent features: (1) Status spam prevention, (2) Detail view expansion
2. Load optional design documents:
   → research.md: ✅ Server-side spam prevention pattern, useState expansion toggle
   → quickstart.md: ✅ 10 manual test scenarios documented
   → data-model.md: N/A (no new data models)
   → contracts/: N/A (no new API endpoints)
3. Generate tasks by category:
   → Backend: Add spam detection logic to status update endpoint
   → Frontend: Add expansion toggle to JobDashboard component
   → Testing: Manual verification via quickstart.md
4. Apply task rules:
   → Backend tasks sequential (modify same files)
   → Frontend tasks can parallelize with backend
   → Testing tasks after implementation complete
5. Number tasks sequentially (T001-T009)
6. Generate dependency graph
7. Mark parallel execution opportunities [P]
8. Validate task completeness:
   → ✅ All FR requirements covered (FR-001 to FR-012)
   → ✅ All quickstart scenarios have corresponding tasks
9. Return: SUCCESS (9 tasks ready for execution)
```

## Format: `[ID] Description`
- `[P]` marker indicates tasks that can run in parallel (different files)
- Include exact file paths in descriptions
- Each task maps to functional requirements or quickstart scenarios

## Path Conventions
- **Project Root**: `/Users/vankee/Downloads/job_seek_app`
- **Backend**: `platform/core/src/backend/`
- **Frontend**: `platform/core/src/frontend/`
- **Spec**: `specs/016-spam-click-progress/`

---

## Phase 3.1: Backend - Status Spam Prevention

- [ ] **T001** Add spam detection helper to database service
  - **File**: `platform/core/src/backend/database/database-manager.ts`
  - **Action**: Add method `canUpdateStatus(jobId: number): Promise<boolean>`
    - Query: `SELECT MAX(changed_at) FROM job_status_history WHERE job_id = ?`
    - Logic: `return (Date.now() - lastChangeTime) >= 3000`
    - Return `true` if no previous status change exists (first time)
  - **Implementation Details** (from research.md):
    ```typescript
    async canUpdateStatus(jobId: number): Promise<boolean> {
      if (!this.currentService) throw new Error('No database service configured');

      const history = await this.getStatusHistory(jobId);
      if (history.length === 0) return true; // First status change

      const lastChange = history[0]; // Most recent (assume sorted DESC)
      const lastChangeTime = new Date(lastChange.changed_at).getTime();
      const timeSince = Date.now() - lastChangeTime;

      return timeSince >= 3000; // 3 second threshold
    }
    ```
  - **Validation**: Method returns boolean, no database schema changes
  - **Dependencies**: None (adds new method to existing class)
  - **Maps to**: FR-001, FR-004, FR-006 (spam detection logic)
  - **Success Criteria**: Method exists, compiles without errors

---

- [ ] **T002** Integrate spam check into status update endpoint
  - **File**: `platform/core/src/backend/api/jobs.ts` (or wherever status update is handled)
  - **Action**: Modify PUT/POST endpoint that updates job status
    - Before updating status, call `await databaseManager.canUpdateStatus(jobId)`
    - If `false`, return 200 OK with `{ spamDetected: true, message: 'Status unchanged (too soon)' }`
    - If `true`, proceed with normal status update logic
  - **Implementation Pattern** (from research.md):
    ```typescript
    router.put('/api/jobs/:id', async (req, res) => {
      const jobId = parseInt(req.params.id);
      const canUpdate = await databaseManager.canUpdateStatus(jobId);

      if (!canUpdate) {
        return res.status(200).json({
          message: 'Status unchanged (too soon)',
          spamDetected: true
        });
      }

      // Existing status update logic continues here...
    });
    ```
  - **Validation**: API returns 200 OK for spam requests (not 429 or error)
  - **Dependencies**: T001 (requires canUpdateStatus method)
  - **Maps to**: FR-002, FR-003, FR-007 (preventative spam logic)
  - **Success Criteria**: Endpoint modified, spam check before status update

---

## Phase 3.2: Frontend - Detail View Expansion

- [ ] **T003** [P] Add expansion state to JobDashboard component
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Action**: Add useState hook for expansion toggle
    - Add: `const [isExpanded, setIsExpanded] = useState(false);`
    - Add: `const toggleExpansion = () => setIsExpanded(!isExpanded);`
    - Location: Near other useState declarations (around line 92-100)
  - **Validation**: State variable exists, compiles without errors
  - **Dependencies**: None (can run in parallel with T001-T002)
  - **Maps to**: FR-008, FR-010 (expansion toggle functionality)
  - **Success Criteria**: isExpanded state added, toggleExpansion function created

---

- [ ] **T004** Add expand/collapse button UI
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Action**: Add button to detail view panel (when job is selected)
    - Location: Top of job detail section (right panel)
    - Button text: `{isExpanded ? 'Collapse' : 'Expand'}`
    - onClick handler: `onClick={toggleExpansion}`
    - Disabled state: `disabled={!selectedJob}`
    - Style: Inline CSS matching existing button styles
  - **Implementation Pattern** (from research.md):
    ```typescript
    <button
      onClick={toggleExpansion}
      disabled={!selectedJob}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        cursor: selectedJob ? 'pointer' : 'not-allowed',
        opacity: selectedJob ? 1 : 0.5,
        // ... other existing button styles
      }}
    >
      {isExpanded ? 'Collapse ↓' : 'Expand ↑'}
    </button>
    ```
  - **Validation**: Button visible when job selected, disabled when no job
  - **Dependencies**: T003 (requires isExpanded state)
  - **Maps to**: FR-008, FR-010 (toggle UI control)
  - **Success Criteria**: Button renders, click toggles isExpanded state

---

- [ ] **T005** Modify detail view container styles for height expansion
  - **File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
  - **Action**: Update detail view container inline styles
    - **Current state**: Detail containers at lines 2734, 3205, 3605, 3761 have `maxWidth: '600px'`
    - **Add**: `maxHeight: isExpanded ? '90%' : '60%'`
    - **Add**: `overflow: 'auto'` (enable scrolling)
    - **Add**: `transition: 'max-height 0.3s ease-in-out'` (smooth animation)
    - Apply to all detail sections: job description, status history, related documents
  - **Implementation Pattern** (from research.md):
    ```typescript
    // Example for one detail section container
    <div style={{
      maxWidth: '600px', // Keep existing
      maxHeight: isExpanded ? '90%' : '60%', // NEW
      overflow: 'auto', // NEW
      transition: 'max-height 0.3s ease-in-out', // NEW
      width: 'fit-content',
      // ... other existing styles
    }}>
      {/* Detail content */}
    </div>
    ```
  - **Validation**: Height transitions smoothly between 60% and 90%
  - **Dependencies**: T003 (requires isExpanded state)
  - **Maps to**: FR-009, FR-011, FR-012 (height expansion with transitions)
  - **Success Criteria**: All detail sections expand/collapse, smooth CSS transition

---

## Phase 3.3: Integration & Verification

- [ ] **T006** Manual test: Status spam prevention (Quickstart Scenarios 1-3, 7, 9)
  - **File**: N/A (manual testing)
  - **Action**: Execute quickstart.md Scenarios 1, 2, 3, 7, 9
    - Scenario 1: Rapid status return (A→B→A) ignored
    - Scenario 2: Legitimate changes (wait 3+ seconds) recorded
    - Scenario 3: Multiple rapid changes keep only first
    - Scenario 7: Spam after legitimate change
    - Scenario 9: API responses correct (200 OK with spamDetected flag)
  - **Validation**:
    - All spam requests return 200 OK with `spamDetected: true`
    - Status history shows only legitimate changes (no duplicates)
    - Network tab shows spam check happening (<100ms)
  - **Dependencies**: T001, T002 (backend implementation complete)
  - **Maps to**: All spam prevention FRs (FR-001 to FR-007)
  - **Success Criteria**: All 5 scenarios pass, documented in quickstart.md

---

- [ ] **T007** Manual test: Detail view expansion (Quickstart Scenarios 4-6, 8, 10)
  - **File**: N/A (manual testing)
  - **Action**: Execute quickstart.md Scenarios 4, 5, 6, 8, 10
    - Scenario 4: Expand increases height 60% → 90%
    - Scenario 5: Collapse returns height 90% → 60%
    - Scenario 6: Expansion persists across job selections
    - Scenario 8: Button disabled when no job selected
    - Scenario 10: Visual consistency in both states
  - **Validation**:
    - Height transitions smoothly (no flickering)
    - Expansion state persists when switching jobs
    - Button disabled/enabled correctly
    - All detail sections expand together
  - **Dependencies**: T003, T004, T005 (frontend implementation complete)
  - **Maps to**: All expansion FRs (FR-008 to FR-012)
  - **Success Criteria**: All 5 scenarios pass, documented in quickstart.md

---

## Phase 3.4: Polish & Documentation

- [ ] **T008** Performance validation: Backend spam check
  - **File**: N/A (performance testing)
  - **Action**: Measure backend spam check performance
    - Open DevTools → Network tab
    - Perform 10 status update requests
    - Record timing for each request (check "Timing" tab)
    - Calculate average request time
  - **Validation**:
    - Average request time <100ms (target from plan.md)
    - Database query time <10ms (SELECT MAX)
    - No performance regression from baseline
  - **Dependencies**: T001, T002 (backend complete), T006 (tested)
  - **Maps to**: Performance Goals in plan.md (<100ms spam check)
  - **Success Criteria**: Performance targets met, documented in quickstart.md

---

- [ ] **T009** Performance validation: Frontend expansion animation
  - **File**: N/A (performance testing)
  - **Action**: Measure frontend transition performance
    - Open DevTools → Performance tab
    - Start recording
    - Click expand button
    - Stop recording after transition (0.3s)
    - Check FPS graph
  - **Validation**:
    - No frame drops during transition (maintain 60 FPS)
    - CSS transition uses GPU acceleration (check Layers panel)
    - Animation completes in ~0.3 seconds
  - **Dependencies**: T003, T004, T005 (frontend complete), T007 (tested)
  - **Maps to**: Performance Goals (60 FPS UI transitions)
  - **Success Criteria**: 60 FPS maintained, documented in quickstart.md

---

## Dependencies

**Dependency Graph**:
```
T001 (Backend: Add spam check method)
  ↓
T002 (Backend: Integrate spam check)
  ↓
T006 (Manual test: Spam prevention)
  ↓
T008 (Performance: Backend)

T003 (Frontend: Add expansion state) [P]
  ↓
T004 (Frontend: Add button UI)
  ↓
T005 (Frontend: Modify container styles)
  ↓
T007 (Manual test: Detail expansion)
  ↓
T009 (Performance: Frontend)
```

**Parallelization Opportunities**:
- T003 can run in parallel with T001-T002 (different files: backend vs frontend)
- T006 and T007 can run in parallel (independent test scenarios)
- T008 and T009 can run in parallel (independent performance checks)

---

## Parallel Execution

**Group 1: Backend + Frontend (Parallel)**
```bash
# Terminal 1: Backend spam prevention
Task 1: Implement T001 (add spam check method)
Task 2: Implement T002 (integrate spam check)

# Terminal 2: Frontend expansion (can run simultaneously)
Task 3: Implement T003 (add useState)
Task 4: Implement T004 (add button)
Task 5: Implement T005 (modify styles)
```

**Group 2: Testing (Parallel)**
```bash
# Terminal 1: Spam prevention tests
Task 6: Execute T006 (quickstart scenarios 1-3, 7, 9)

# Terminal 2: Expansion tests (can run simultaneously)
Task 7: Execute T007 (quickstart scenarios 4-6, 8, 10)
```

**Group 3: Performance (Parallel)**
```bash
# Terminal 1: Backend performance
Task 8: Execute T008 (measure spam check timing)

# Terminal 2: Frontend performance (can run simultaneously)
Task 9: Execute T009 (measure animation FPS)
```

---

## Notes

### Implementation Approach
- **Manual execution recommended**: Tasks are straightforward, no complex automation needed
- **Sequential for same files**: T001→T002 sequential (both modify backend), T003→T004→T005 sequential (all modify JobDashboard.tsx)
- **Parallel for different files**: Backend (T001-T002) can parallelize with frontend (T003-T005)
- **Testing after implementation**: T006-T007 require complete implementations

### Critical Warnings
1. ⚠️ **No database schema changes**: FR-005 constraint - only query existing tables
2. ⚠️ **Inline CSS pattern**: Maintain consistency with existing JobDashboard.tsx styles
3. ⚠️ **Silent ignore strategy**: Spam requests return 200 OK (not 429 or error)
4. ⚠️ **Expansion persistence**: State persists across job selections (clarification from Session 2025-10-14)

### Task Completion Checklist
- [ ] Backend: T001-T002 complete (spam prevention logic)
- [ ] Frontend: T003-T005 complete (expansion toggle UI)
- [ ] Testing: T006-T007 complete (manual scenarios pass)
- [ ] Performance: T008-T009 complete (targets met)

---

## Validation Checklist
*GATE: Checked before marking feature complete*

- [x] All FR requirements have tasks:
  - FR-001 to FR-007: T001-T002, T006 (spam prevention)
  - FR-008 to FR-012: T003-T005, T007 (detail expansion)

- [x] All quickstart scenarios have corresponding tasks:
  - Scenarios 1-3, 7, 9: T006 (spam tests)
  - Scenarios 4-6, 8, 10: T007 (expansion tests)

- [x] All tasks have clear file paths:
  - T001: database-manager.ts
  - T002: api/jobs.ts
  - T003-T005: pages/JobDashboard.tsx
  - T006-T009: Manual testing (quickstart.md)

- [x] Dependencies are clearly documented (see Dependency Graph)

- [x] Parallel execution opportunities identified:
  - Backend (T001-T002) || Frontend (T003-T005)
  - Tests (T006 || T007)
  - Performance (T008 || T009)

---

## Task Execution Order

**Recommended sequence** (with parallel opportunities):

### Phase 1: Implementation (Parallel)
1. **Backend track**: T001 → T002 (sequential, same files)
2. **Frontend track** [P]: T003 → T004 → T005 (sequential, same file)
   - Can run in parallel with backend track

### Phase 2: Testing (Parallel)
3. **Spam tests**: T006 (requires T001-T002 complete)
4. **Expansion tests** [P]: T007 (requires T003-T005 complete)
   - Can run in parallel with T006

### Phase 3: Performance (Parallel)
5. **Backend perf**: T008 (requires T006 complete)
6. **Frontend perf** [P]: T009 (requires T007 complete)
   - Can run in parallel with T008

**Total tasks**: 9 (T001-T009)
**Estimated effort**: ~4-6 hours (2-3 hours implementation + 2-3 hours testing/validation)

---

**Tasks Complete**: ✅ Ready for execution via manual implementation or automated tools
