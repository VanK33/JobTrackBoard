# Implementation Plan: Remove Data Migration Section

**Branch**: `009-connect-database-data` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-connect-database-data/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded spec from /specs/009-connect-database-data/spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ No clarifications needed - straightforward UI removal
   → ✅ Project Type: Web (frontend + backend)
3. Fill Constitution Check section
   → ✅ No constitution defined - using project best practices
4. Evaluate Constitution Check
   → ✅ No violations - simple UI removal
   → ✅ Progress: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → ✅ research.md complete - analyzed current implementation
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ data-model.md complete
   → ✅ contracts/ui-component.contract.md complete
   → ✅ quickstart.md complete
   → ✅ CLAUDE.md updated
7. Re-evaluate Constitution Check
   → ✅ No new violations
   → ✅ Progress: Post-Design Constitution Check PASS
8. Plan Phase 2 → Describe task generation approach
   → ✅ Task approach documented below
9. STOP - Ready for /tasks command
   → ✅ Planning complete
```

## Summary

**Primary Requirement**: Remove the Data Migration section from the Database Settings UI, keeping only the "Database Ready" status message after successful database connection.

**Technical Approach**:
- Remove Data Migration nested UI container (lines 480-554)
- Remove associated state (`migrationStatus`)
- Remove handler function (`runDataMigration`)
- Remove DataMigrationService import
- Preserve "Database Ready" outer container and message
- No backend, API, or data model changes

## Technical Context

**Language/Version**: TypeScript 5.0+, React 18
**Primary Dependencies**: React (hooks), Vite (HMR)
**Storage**: N/A (UI-only changes, no storage impact)
**Testing**: Manual testing via quickstart.md (project pattern)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web (frontend + backend monorepo)
**Performance Goals**: N/A (simple UI removal, negligible impact)
**Constraints**: Must not break existing database connection flows
**Scale/Scope**: Single component modification (DatabaseSettings.tsx)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS

**Rationale**:
- No constitution file defined in project (empty template)
- Following established project patterns:
  - Inline CSS-in-JS styling
  - Manual testing (no automated UI tests)
  - React functional components with hooks
  - Simple, direct code changes
  - No new dependencies

## Project Structure

### Documentation (this feature)
```
specs/009-connect-database-data/
├── plan.md                           # This file (/plan command output)
├── research.md                       # Phase 0 output (/plan command) ✅
├── data-model.md                     # Phase 1 output (/plan command) ✅
├── quickstart.md                     # Phase 1 output (/plan command) ✅
├── contracts/                        # Phase 1 output (/plan command) ✅
│   └── ui-component.contract.md      # DatabaseSettings component contract ✅
└── tasks.md                          # Phase 2 output (/tasks command - NOT YET CREATED)
```

### Source Code (repository root)

**Web Application Structure**:
```
platform/core/
├── src/
│   ├── backend/                      # No changes
│   │   ├── api/
│   │   ├── database/
│   │   └── services/
│   ├── frontend/                     # Changes here
│   │   ├── pages/
│   │   │   └── DatabaseSettings.tsx  # ⚠️ MODIFIED - remove migration UI
│   │   ├── components/               # No changes
│   │   └── utils/
│   │       └── data-migration.ts     # Unchanged (unused after removal)
│   └── shared/                       # No changes
└── vite.config.ts
```

**Structure Decision**: Web application with frontend/backend separation. This feature modifies only the frontend (DatabaseSettings.tsx component). No backend, API, or shared utility changes required.

## Phase 0: Outline & Research

**Status**: ✅ Complete

**Research Tasks Completed**:
1. ✅ Analyzed DatabaseSettings component structure
2. ✅ Identified migration section location (lines 464-556)
3. ✅ Mapped dependencies (state, handlers, imports)
4. ✅ Verified what to keep vs. remove
5. ✅ Assessed risk and rollback strategy

**Findings** (see research.md):
- Migration UI is self-contained nested section
- Can be cleanly removed without side effects
- "Database Ready" message is in parent container (preserved)
- No other components depend on migration state
- Low-risk change with simple rollback path

**Output**: ✅ research.md with all technical decisions documented

## Phase 1: Design & Contracts

**Status**: ✅ Complete

**Completed Artifacts**:

1. ✅ **data-model.md**:
   - Documented state changes (removed migrationStatus)
   - Confirmed no backend/API changes
   - Listed removed functions and imports

2. ✅ **contracts/ui-component.contract.md**:
   - DatabaseSettings component interface (unchanged)
   - Before/After JSX structure
   - Removed functions: `runDataMigration`
   - Removed imports: `DataMigrationService`
   - Visual requirements and styling contract

3. ✅ **quickstart.md**:
   - 4 main test scenarios (connection, persistence, errors, styling)
   - Regression testing checklist
   - Visual inspection checklist
   - Code inspection verification
   - Rollback procedure

4. ✅ **CLAUDE.md**: Updated with feature context

**No Contract Tests**: This is a UI removal with manual testing only (project pattern)

**Output**: All Phase 1 artifacts complete and ready for task generation

## Phase 2: Task Planning Approach

**Status**: Described (NOT executed - awaiting /tasks command)

### Task Generation Strategy

**Source Documents**:
- research.md: Technical decisions and code locations
- data-model.md: State and function changes
- contracts/ui-component.contract.md: Component modifications
- quickstart.md: Testing scenarios

**Task Categories**:

1. **Preparation Tasks** [P = Parallel]:
   - Review research.md and contracts
   - Understand current implementation

2. **Implementation Tasks** (Sequential):
   - Remove DataMigrationService import (line 3)
   - Remove migrationStatus state declaration (line 33)
   - Remove runDataMigration function (lines 287-318)
   - Remove Data Migration JSX block (lines 480-554)
   - Adjust marginBottom on description text (optional cleanup)

3. **Verification Tasks**:
   - Check TypeScript compilation
   - Verify HMR updates successfully
   - Execute quickstart.md test scenarios (4 scenarios)
   - Regression testing checklist

**Ordering Strategy**:
- Top-to-bottom file order for removals (imports → state → functions → JSX)
- Each removal is dependent on previous (sequential)
- Testing after all removals complete
- No parallel tasks (single file, sequential edits)

**Estimated Task Count**: 8-10 tasks total
- 4 removal tasks (sequential)
- 1 optional cleanup task
- 4-5 testing/verification tasks

**IMPORTANT**: This phase will be executed by the /tasks command, which will:
- Load `.specify/templates/tasks-template.md`
- Generate numbered tasks with [P] markers for parallel execution
- Include file paths and line numbers
- Add quickstart.md test scenarios as tasks

## Phase 3+: Future Implementation

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md)
- Remove import, state, function, JSX in order
- Verify compilation after each step
- Monitor HMR for successful updates

**Phase 5**: Validation
- Run quickstart.md test scenarios
- Execute regression testing checklist
- Visual inspection in browser
- Code inspection verification

## Complexity Tracking

**No violations** - Simple UI removal following project patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning approach described (/plan command) ✅
- [ ] Phase 3: Tasks generated (/tasks command) - **NEXT STEP**
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅ (none existed)
- [x] Complexity deviations documented ✅ (none exist)

**Ready for /tasks command**: ✅ Yes

---

**Next Step**: Run `/tasks` to generate tasks.md with numbered, executable tasks.

*Plan completed at 2025-10-07 - Ready for task generation*
