# Implementation Plan: Prevent Status Update Spam & Expand Detail View

**Branch**: `016-spam-click-progress` | **Date**: 2025-10-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-spam-click-progress/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded: FR-001 to FR-012, all clarifications resolved
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: web (frontend + backend monorepo)
   → Structure: platform/core with frontend/backend separation
   → No NEEDS CLARIFICATION - all parameters clarified in Session 2025-10-14
3. Fill the Constitution Check section
   → Constitution is template-only (no custom principles defined)
   → Default to standard practices: minimal changes, preserve existing architecture
4. Evaluate Constitution Check section
   → No violations - feature uses existing database, no schema changes
   → Update Progress Tracking: Initial Constitution Check ✅
5. Execute Phase 0 → research.md
   → Research spam prevention patterns, UI expansion best practices
6. Execute Phase 1 → data-model.md (existing entities only), quickstart.md
   → No new data model (uses existing job_status_history table)
   → Generate manual test scenarios for quickstart
   → No API contracts needed (modifies existing UI + status update logic)
7. Re-evaluate Constitution Check section
   → Still PASS - minimal scope, no added complexity
   → Update Progress Tracking: Post-Design Constitution Check ✅
8. Plan Phase 2 → Describe task generation approach
   → Frontend: UI expansion tasks, backend: spam detection logic
9. STOP - Ready for /tasks command ✅
```

**IMPORTANT**: The /plan command STOPS at step 9. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement two independent features: (1) Status update spam prevention using 3-second threshold with existing `job_status_history` table - keep only first status when rapid changes detected within window; (2) Detail view expansion from 60% to 90% of middle panel height for better job description readability. No database schema changes required.

## Technical Context
**Language/Version**: TypeScript 5.0+, Node.js 18+
**Primary Dependencies**: React 18, Express 4, PostgreSQL (via pg), SQL.js (fallback)
**Storage**: PostgreSQL/Supabase (primary), SQL.js (local fallback) - existing `job_status_history` table
**Testing**: Manual via quickstart.md (no automated tests for this feature)
**Target Platform**: Web browser (Chrome/Firefox/Safari), Node.js backend
**Project Type**: web (frontend + backend monorepo)
**Performance Goals**: <100ms spam detection check, 3-second sliding window for status changes
**Constraints**: No database schema modifications, preserve existing data, session-based architecture
**Scale/Scope**: Single-user session spam detection, UI-only expansion (no backend changes for expansion)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (Constitution is template-only, no custom principles defined)

**Standard Best Practices Applied**:
- Minimal changes: Reuse existing database schema, modify existing components only
- No new dependencies: Use existing pg/SQL.js clients, React hooks
- Preserve existing architecture: Session-based multi-tenant design unchanged
- Data integrity: Spam prevention logic prevents invalid history, does not delete existing data

**Complexity Evaluation**:
- No new abstractions added (uses existing database services, React components)
- No new dependencies introduced
- No architectural changes (feature fits within existing patterns)
- Simple conditional logic for spam detection

## Project Structure

### Documentation (this feature)
```
specs/016-spam-click-progress/
├── spec.md             # Feature specification (✅ complete)
├── plan.md             # This file (/plan command output)
├── research.md         # Phase 0 output (/plan command)
├── quickstart.md       # Phase 1 output (/plan command)
└── tasks.md            # Phase 2 output (/tasks command - NOT created by /plan)
```

Note: No `contracts/` or `data-model.md` needed (no API changes, existing data model only)

### Source Code (repository root)
```
platform/core/
├── src/
│   ├── backend/        # Backend (Express + TypeScript)
│   │   ├── api/        # API routes (modify jobs status update endpoint)
│   │   ├── database/   # Database services (add spam detection logic)
│   │   ├── middleware/
│   │   ├── services/   # Business logic (status history validation)
│   │   └── utils/
│   ├── frontend/       # Frontend (React 18 + Vite)
│   │   ├── pages/      # JobDashboard.tsx (add expand/collapse logic)
│   │   ├── components/ # UI components
│   │   ├── services/
│   │   ├── hooks/      # React hooks (useState for expansion state)
│   │   └── utils/
│   └── shared/         # Shared types and config
├── dist/              # Build output
└── .runtime/          # Runtime data (gitignored)
```

**Structure Decision**: Web application monorepo structure. The project uses `platform/core` as the main workspace with frontend/backend separation. Status spam prevention affects both backend (status update API) and potentially frontend (client-side deduplication). Detail view expansion is frontend-only (JobDashboard.tsx component).

## Phase 0: Outline & Research

### Research Topics

1. **Status Update Spam Prevention Patterns**
   - Decision: Server-side prevention using timestamp comparison
   - Rationale: Backend enforces 3-second rule before allowing new status history entry
   - Alternatives considered:
     - Client-side debouncing (rejected - can be bypassed, not reliable)
     - Database triggers (rejected - adds complexity, harder to debug)
     - Both client + server (deferred - server-side sufficient for MVP)

2. **Sliding Window Implementation for Timestamp Checks**
   - Decision: Query last status change timestamp for job_id, compare with current timestamp
   - Rationale: Simple SQL query, leverages existing `changed_at` column in `job_status_history`
   - Implementation: `SELECT MAX(changed_at) FROM job_status_history WHERE job_id = ?`
   - Alternatives considered:
     - In-memory cache of last change times (rejected - session-based architecture, no shared state)
     - Redis cache (rejected - no Redis in current stack, adds dependency)

3. **React State Management for Expansion Toggle**
   - Decision: useState hook for local expansion state in JobDashboard component
   - Rationale: Simple toggle, no need for global state or context
   - Alternatives considered:
     - localStorage persistence (deferred - user can decide per session)
     - URL query parameter (rejected - unnecessary for UI preference)
     - Per-job expansion state (rejected - Session 2025-10-14 clarification: persist across jobs)

4. **CSS Height Transition Best Practices**
   - Decision: Animate height change using CSS transitions, inline styles (current pattern)
   - Rationale: Existing codebase uses inline CSS-in-JS, maintain consistency
   - Implementation: Conditional maxHeight style based on expansion state
   - Alternatives considered:
     - CSS classes with external stylesheet (rejected - breaks existing pattern)
     - React Spring animation library (rejected - adds dependency, overkill)

5. **Database Query Performance for Spam Detection**
   - Decision: Index on (job_id, changed_at) if not exists (check existing schema first)
   - Rationale: Fast lookup for MAX(changed_at) per job
   - Implementation: Verify index exists in PostgreSQL/SQLite schemas
   - Note: No schema changes permitted (FR-005), only verify existing index

**Output**: research.md with consolidated findings

## Phase 1: Design & Contracts

### Data Model
**No new data model** - this feature uses existing `job_status_history` table without modifications.

**Existing Entity Validation**:
- `job_status_history` table (verified in spec.md):
  - Columns: id, job_id, status, changed_at, operator, note
  - Foreign key: job_id references jobs(id)
  - No schema changes needed ✅

### API Contracts
**No new API endpoints** - modifies existing status update logic.

**Existing Endpoint Modified** (conceptual change only, no contract file needed):
- `PUT /api/jobs/:id` (or POST /api/jobs/:id/status) - existing endpoint
  - Add pre-insert validation: Check if last status change for job_id occurred within 3 seconds
  - If within threshold: Return 429 Too Many Requests OR silently ignore (decision in tasks phase)
  - If threshold passed: Allow status update as before

### Quickstart Test Scenarios

Based on Feature Spec acceptance scenarios:

1. **Rapid Status Changes (Same Status Return)**
   - Manual: Update job status to "screening", immediately update back to "applied"
   - Expected: Only original "applied" status in history, intermediate "screening" ignored

2. **Legitimate Status Changes**
   - Manual: Update job status to "screening", wait 4 seconds, update to "interview"
   - Expected: Both status changes recorded in history with accurate timestamps

3. **Multiple Rapid Changes**
   - Manual: Rapidly click status updates: applied → screening → interview → applied
   - Expected: Only original "applied" status retained, all intermediate changes ignored

4. **Expand Detail View**
   - Manual: Open job details, click expand button
   - Expected: Detail view height increases from ~60% to ~90% of middle panel

5. **Collapse Detail View**
   - Manual: With expanded detail view, click expand button again
   - Expected: Detail view height returns to ~60% of middle panel

6. **Expansion Persists Across Jobs**
   - Manual: Expand detail view, select different job
   - Expected: New job detail view also shows expanded state (90%)

7. **Spam Prevention After Legitimate Change**
   - Manual: Update status "applied" → "screening" (legitimate), wait 1 second, spam-click back to "applied" 3 times
   - Expected: First "screening" recorded, then single "applied" recorded (not 3 duplicates)

8. **Expansion with No Job Selected**
   - Manual: Clear job selection, check expand button state
   - Expected: Button disabled or hidden (no job to expand)

### Agent Context Update
**No agent context update needed** - straightforward UI and validation logic, fits existing patterns.

**Output**: quickstart.md with manual verification steps

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Break down into backend (spam prevention) and frontend (UI expansion) tasks
- Backend tasks: Modify status update API logic, add timestamp validation
- Frontend tasks: Add expansion state, modify JobDashboard component styles
- Sequential execution for backend (validation before status update), parallel for frontend+backend

**Task Breakdown**:
1. **Backend: Spam Prevention** (3-4 tasks)
   - Add helper function to check last status change timestamp
   - Integrate spam check into status update endpoint
   - Handle spam detection response (error or silent ignore)
   - Test spam prevention with manual quickstart scenarios

2. **Frontend: Detail View Expansion** (3-4 tasks)
   - Add useState for expansion toggle in JobDashboard
   - Add expand/collapse button UI
   - Modify detail view container styles (conditional maxHeight)
   - Ensure expansion persists across job selections

3. **Integration Testing** (2 tasks)
   - Test spam prevention end-to-end (frontend → backend → database)
   - Test detail view expansion in various states (no job, with job, switching jobs)

**Ordering Strategy**:
- Backend tasks first (spam prevention can be tested independently via API)
- Frontend tasks after backend (but can parallelize if needed)
- Integration tests last (require both backend + frontend complete)

**Estimated Output**: 8-10 numbered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following best practices)
**Phase 5**: Validation (run quickstart.md scenarios, verify both features work correctly)

## Complexity Tracking
*No complexity deviations - straightforward feature within existing architecture*

**No violations to document** - this feature aligns with all standard best practices:
- Uses existing database schema (no modifications)
- Minimal UI changes (single component, single state hook)
- No new dependencies
- Simple timestamp comparison logic
- Fits existing session-based architecture

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (Session 2025-10-14: 3 clarifications answered)
- [x] Complexity deviations documented (none exist)

---
*Based on project best practices (constitution template-only)*
