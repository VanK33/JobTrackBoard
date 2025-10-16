
# Implementation Plan: Update README and Remove SQLite Support

**Branch**: `019-update-readme-md` | **Date**: 2025-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-update-readme-md/spec.md`

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

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

This feature removes SQLite support from the codebase and updates documentation to reflect PostgreSQL as the sole database option. The work involves:

1. **Code Cleanup**: Delete sqlite-service.ts, remove sql.js dependency, clean up connection managers and type definitions
2. **Documentation Update**: Revise README.md to remove SQLite/SQL.js mentions and update setup instructions for PostgreSQL only
3. **API Updates**: Add explicit rejection of SQLite configurations with helpful migration messages

**Impact**: Breaking change for any SQLite users (none in production), PostgreSQL functionality unchanged.

## Technical Context
**Language/Version**: TypeScript 5.0+, Node.js 18+
**Primary Dependencies**: Express.js, PostgreSQL (pg), React 18, Vite 5
**Storage**: PostgreSQL/Supabase (removing SQLite/sql.js support)
**Testing**: Manual validation (no test framework currently)
**Target Platform**: Linux/macOS server, modern browsers
**Project Type**: web (backend + frontend monorepo)
**Performance Goals**: No performance requirements (code deletion improves bundle size)
**Constraints**: Must not break PostgreSQL functionality, must maintain API compatibility
**Scale/Scope**: 9 backend files to modify/delete, 1 README file to update, 1 package.json entry to remove

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - No constitution violations

**Reasoning**:
- Constitution is template/not yet defined for this project
- This feature follows general best practices:
  - Simplifies codebase by removing unused code paths
  - Maintains single database abstraction (PostgreSQL)
  - Documents changes clearly
  - No new complexity added
- Code deletion reduces maintenance burden

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
platform/core/
├── src/
│   ├── backend/
│   │   ├── api/
│   │   │   └── database.ts              # MODIFY: Add SQLite rejection
│   │   ├── database/
│   │   │   ├── sqlite-service.ts        # DELETE: Remove entire file
│   │   │   ├── connection-pool-manager.ts  # MODIFY: Remove SQLite branches
│   │   │   ├── database-manager.ts      # MODIFY: Remove SQLite logic
│   │   │   ├── postgresql-service.ts    # MODIFY: Fix imports
│   │   │   ├── data-mapper.ts           # CHECK: Verify no SQLite deps
│   │   │   ├── type-mappers.ts          # CHECK: Verify no SQLite deps
│   │   │   └── config-persistence.ts    # CHECK: Verify no SQLite deps
│   │   └── middleware/
│   │       └── database-config.ts       # MODIFY: Update validation
│   └── frontend/
│       └── [No changes expected]
├── package.json                          # MODIFY: Remove sql.js dependency
└── README.md                             # MODIFY: Update documentation

specs/019-update-readme-md/
├── spec.md                               # Feature specification
├── plan.md                               # This file
├── research.md                           # Phase 0 research (complete)
├── data-model.md                         # Phase 1 data model (complete)
├── quickstart.md                         # Phase 1 quickstart (complete)
└── contracts/
    └── database-api.md                   # Phase 1 API contracts (complete)
```

**Structure Decision**: Web application monorepo with backend/frontend separation. This feature touches backend code only (SQLite removal) plus root-level README documentation.

## Phase 0: Outline & Research

**Status**: ✅ COMPLETE

**Research Conducted**:
1. Identified all 9 files containing SQLite references via grep search
2. Verified sql.js dependency exists in package.json
3. Analyzed current PostgreSQL implementation (confirmed working)
4. Reviewed README structure and SQLite documentation
5. Determined no data migration needed (SQLite never in production)

**Key Findings**:
- SQLite service is 802 lines but only referenced in connection manager
- PostgreSQL is production-ready and default
- sql.js (v1.13.0) dependency can be safely removed
- README has 4 main sections needing updates

**Decisions Made**:
- Incremental removal strategy (safest approach)
- No database abstraction changes (keep PostgreSQL interface)
- Explicit SQLite rejection with migration guidance (user-friendly)
- Single commit approach (atomic change)

**Output**: ✅ research.md created with complete analysis

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETE

**Artifacts Created**:

1. **data-model.md** ✅
   - DatabaseConfig interface changes (removed 'sqlite' from type enum)
   - Documented unchanged entities (JobRecord, JobFileRecord, StatusHistoryRecord)
   - State transition diagram updated (SQLite now returns error)
   - API contract changes specified

2. **contracts/database-api.md** ✅
   - POST /api/database/test contract (with SQLite rejection)
   - POST /api/database/initialize contract (with SQLite rejection)
   - Test cases for valid PostgreSQL and invalid SQLite
   - Breaking changes documented
   - Migration guide provided

3. **quickstart.md** ✅
   - 6-step validation procedure (5 minutes total)
   - Grep commands to verify SQLite removal
   - Build verification steps
   - PostgreSQL functionality tests
   - README accuracy checks
   - API rejection tests

4. **Agent context updated** ✅
   - Ran `.specify/scripts/bash/update-agent-context.sh claude`
   - Added database context (PostgreSQL)
   - No language warnings (as expected for deletion feature)

**Design Decisions**:
- No new entities needed (removal feature)
- API contracts focus on rejection behavior
- Validation emphasizes PostgreSQL preservation
- Quickstart is verification-focused (no implementation)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
The /tasks command will create tasks.md with the following structure:

1. **Dependency Removal** (1 task)
   - Remove sql.js from package.json and reinstall dependencies

2. **Code Deletion** (1 task)
   - Delete sqlite-service.ts file

3. **Code Cleanup** (6 tasks, can be parallel)
   - Update connection-pool-manager.ts (remove SQLite branches)
   - Update database-manager.ts (remove SQLite logic)
   - Update postgresql-service.ts (fix imports)
   - Update database.ts API (add SQLite rejection)
   - Update database-config.ts middleware (update validation)
   - Verify data-mapper, type-mappers, config-persistence (no changes needed)

4. **Documentation Update** (1 task)
   - Update README.md (remove SQLite, update setup instructions)

5. **Verification** (1 task)
   - Run quickstart.md validation steps

**Ordering Strategy**:
- Sequential: dependency removal → deletion → cleanup → docs → verification
- Parallel within cleanup phase: All 6 code cleanup tasks can run in parallel
- Total estimated tasks: 10 tasks

**Risk Mitigation**:
- Each task includes rollback instructions
- Build verification after each major step
- PostgreSQL functionality test before declaring done

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

**Status**: N/A - No complexity violations

This feature reduces complexity by:
- Removing 800+ lines of unused SQLite code
- Eliminating conditional database branching
- Simplifying dependency tree (no sql.js binary)
- Clarifying documentation (single database path)


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
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
