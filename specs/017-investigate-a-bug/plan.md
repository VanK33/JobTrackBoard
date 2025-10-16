# Implementation Plan: Progress Date 2-Minute Consolidation Window

**Branch**: `017-investigate-a-bug` | **Date**: 2025-10-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-investigate-a-bug/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 9. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement a 2-minute consolidation window for job status updates. Users can freely experiment with status changes, all updates are displayed immediately in Progress Dates during the window. After exactly 2 minutes from the first update (fixed window), the system automatically consolidates the history to show only the final status transition. Uses hybrid approach: client-side timer for normal operation, backend lazy consolidation (checks expired windows on status update requests) for eventual consistency.

**Key Difference from Feature 016**: Feature 016 detects rollback patterns (A→B→A) and cleans up immediately within 5 seconds. Feature 017 waits exactly 2 minutes from first update and keeps only final status, regardless of pattern.

## Technical Context
**Language/Version**: TypeScript 5.0+
**Primary Dependencies**: Node.js 18+, Express 4, React 18, Vite 5, pg (PostgreSQL), sql.js (SQLite)
**Storage**: PostgreSQL (Supabase) + SQLite (sql.js) fallback - session-based multi-tenant architecture
**Testing**: Jest 29
**Target Platform**: Web (Node.js backend + React frontend)
**Project Type**: Web - monorepo with platform/core containing backend and frontend
**Performance Goals**: <100ms p95 for status updates, real-time UI updates during consolidation window
**Constraints**:
- Session-based architecture - no server-side connection string storage
- Consolidation must work across browser close/reload
- Fixed 2-minute window (not sliding) from first update
- Client-side timer + backend lazy consolidation (eventual consistency)
**Scale/Scope**:
- Per-job independent consolidation windows
- Support concurrent status updates across multiple jobs
- Handle rapid status changes (multiple updates/second)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**No constitution file found** - Using default simplicity gates:
- ✅ **Minimal Dependencies**: No new runtime dependencies required
- ✅ **Existing Patterns**: Extends Feature 016's cleanup pattern with time-based consolidation
- ✅ **Data Access Layer**: Uses existing database services (postgresql-service.ts, sqlite-service.ts)
- ✅ **Session-Based Architecture**: Respects existing session-based multi-tenant design
- ✅ **Backward Compatible**: Adds new consolidation method alongside existing cleanup

**PASS** - No violations detected.

## Project Structure

### Documentation (this feature)
```
specs/017-investigate-a-bug/
├── plan.md              # This file (/plan command output)
├── spec.md              # Feature specification (completed with clarifications)
├── research.md          # Phase 0 output (/plan command) - TO BE GENERATED
├── data-model.md        # Phase 1 output (/plan command) - TO BE GENERATED
├── quickstart.md        # Phase 1 output (/plan command) - TO BE GENERATED
├── contracts/           # Phase 1 output (/plan command) - TO BE GENERATED
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Web application structure (frontend + backend)
platform/core/
├── src/
│   ├── backend/
│   │   ├── api/
│   │   │   └── jobs.ts                    # Job API endpoints (status update endpoints)
│   │   ├── database/
│   │   │   ├── postgresql-service.ts      # PostgreSQL consolidation logic
│   │   │   ├── sqlite-service.ts          # SQLite consolidation logic
│   │   │   └── database-manager.ts        # Database abstraction layer
│   │   └── index.ts                       # Backend entry point
│   ├── frontend/
│   │   ├── pages/
│   │   │   └── JobDashboard.tsx           # Main UI (status updates, Progress Dates display)
│   │   ├── utils/
│   │   │   └── api-client.ts              # API client with session headers
│   │   └── main.tsx                       # Frontend entry point
│   └── shared/
│       └── config/                         # Shared configuration
└── tests/                                  # Test files (to be created)
    ├── contract/                           # Contract tests (Phase 1)
    ├── integration/                        # Integration tests (Phase 1)
    └── unit/                               # Unit tests (Phase 1)
```

**Structure Decision**: Web application structure with Express backend (port 3000) and React frontend (port 5173 dev, served from backend in production). Monorepo using npm workspaces. Session-based architecture with database config in localStorage, sent via `x-database-config` header.

## Phase 0: Outline & Research

**Unknowns from Technical Context**: None - all clarifications resolved in spec.md

**Research Tasks**:

1. **Consolidation Window Implementation Patterns**
   - Research: Time-based window management in TypeScript
   - Research: Fixed vs sliding window implementations
   - Research: Client-side timer patterns with cleanup on unmount
   - Decision needed: Data structure for tracking active consolidation windows

2. **Lazy Consolidation Pattern**
   - Research: Backend lazy cleanup patterns (check-on-access)
   - Research: Timestamp-based expiration detection
   - Decision needed: Where to store consolidation window metadata (in-memory vs database)

3. **Data Model for Windowed Cleanup**
   - Research: Extending existing statusHistory table vs new consolidation_windows table
   - Research: How to mark history entries as "pending consolidation"
   - Decision needed: Schema changes required for tracking window state

4. **Existing Cleanup Logic (Feature 016)**
   - Research: How `cleanupStatusRollback()` works (5-second rollback pattern)
   - Research: Interaction between Feature 016 (5-sec) and Feature 017 (2-min)
   - Decision needed: Should Feature 017 replace or coexist with Feature 016?

5. **Browser Close/Reload Handling**
   - Research: localStorage persistence patterns for timer state
   - Research: Resuming consolidation windows after page reload
   - Decision needed: How to recover window start time across sessions

**Output**: research.md with all decisions and rationale documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - **Consolidation Window**: Tracks 2-minute window state
     - Fields: jobId, windowStartTime, windowEndTime (fixed at start + 2min), firstStatus, finalStatus
     - Validation: windowEndTime = windowStartTime + 120000ms (immutable)
     - State transitions: Active → Expired → Consolidated
   - **Status History Entry**: Extend existing entity
     - New field: consolidationWindowId (nullable, links to active window)
     - Lifecycle: Created immediately, marked for deletion if not final status when window expires

2. **Generate API contracts** from functional requirements:
   - Existing endpoint modification: PATCH `/api/jobs/:id/status`
     - Add: Start consolidation window on first update (if no active window)
     - Add: Check for expired windows (lazy consolidation)
     - Response: Include active consolidation window info (windowStartTime, remainingMs)
   - New endpoint (optional): GET `/api/jobs/:id/consolidation-status`
     - Response: Active window info or null
   - Output OpenAPI schema to `/contracts/jobs-api.yaml`

3. **Generate contract tests** from contracts:
   - `tests/contract/jobs-status-consolidation.test.ts`
     - Test: POST status update starts consolidation window (verify response includes windowStartTime)
     - Test: Subsequent updates within 2min don't reset timer (verify windowStartTime unchanged)
     - Test: Status update after 2min triggers lazy consolidation (verify old window consolidated)
     - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Scenario 1 (spec.md line 63): Rapid updates within window → all visible immediately
   - Scenario 2 (spec.md line 65): After 2 minutes → consolidated to final status only
   - Scenario 3 (spec.md line 67): Complex pattern A→B→C→D→C→D→A→B → final state B
   - Scenario 5 (spec.md line 71): Post-consolidation update → new window starts
   - Scenario 6 (spec.md line 73): Update at 1:59 → consolidation at 2:00 (timer fixed)
   - Output to `quickstart.md`

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
   - Add NEW tech: Consolidation window tracking, lazy consolidation pattern, fixed-window timers
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to `/Users/vankee/Downloads/job_seek_app/.claude/CLAUDE.md`

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Task Breakdown (Estimated)**:

**Tests (TDD - Write First)**:
1. [P] Write contract test: Start consolidation window on first update
2. [P] Write contract test: Timer fixed (doesn't reset on subsequent updates)
3. [P] Write contract test: Lazy consolidation on expired windows
4. [P] Write integration test: Rapid updates visible immediately (Scenario 1)
5. [P] Write integration test: Consolidation after 2 minutes (Scenario 2)
6. [P] Write integration test: Complex pattern A→B→C→D→C→D→A→B (Scenario 3)
7. [P] Write integration test: New window after consolidation (Scenario 5)
8. Write integration test: Fixed timer (update at 1:59 → consolidate at 2:00) (Scenario 6)

**Data Model**:
9. [P] Add consolidation window tracking (in-memory or database schema)
10. [P] Extend statusHistory table with consolidationWindowId field (if using DB approach)

**Backend Implementation**:
11. Implement `startConsolidationWindow()` in database services
12. Implement `checkExpiredWindows()` for lazy consolidation
13. Implement `consolidateWindow()` to delete intermediate history entries
14. Update `/api/jobs/:id/status` endpoint to start/check windows
15. Add consolidation window info to API responses

**Frontend Implementation**:
16. Add client-side 2-minute timer in JobDashboard.tsx
17. Display consolidation window state (optional, based on research decision)
18. Handle timer cleanup on unmount
19. Persist window start time to localStorage (for browser reload recovery)
20. Refetch job data after client-side timer expires

**Integration**:
21. Test Feature 016 (5-sec rollback) + Feature 017 (2-min consolidation) interaction
22. Verify lazy consolidation works across browser close/reload
23. Test concurrent consolidation windows for multiple jobs

**Ordering Strategy**:
- TDD order: Tests before implementation (tasks 1-8 → 9-20)
- Dependency order: Data model (9-10) → Backend (11-15) → Frontend (16-20) → Integration (21-23)
- Mark [P] for parallel execution (independent test files, independent database services)

**Estimated Output**: 23 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No violations detected - section empty.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md generated
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md updated
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - tasks.md with 47 numbered tasks
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (no new violations after Phase 1)
- [x] All NEEDS CLARIFICATION resolved (all 4 questions answered in spec.md)
- [x] Complexity deviations documented (none)

**Artifacts Generated**:
- [x] specs/017-investigate-a-bug/plan.md (this file)
- [x] specs/017-investigate-a-bug/research.md (5 research tasks with decisions)
- [x] specs/017-investigate-a-bug/data-model.md (2 entities with migration scripts)
- [x] specs/017-investigate-a-bug/contracts/jobs-api.yaml (OpenAPI schema with 3 endpoints)
- [x] specs/017-investigate-a-bug/quickstart.md (6 test scenarios with automated tests)
- [x] specs/017-investigate-a-bug/tasks.md (47 numbered implementation tasks)
- [x] CLAUDE.md updated with Feature 017 technical context

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
