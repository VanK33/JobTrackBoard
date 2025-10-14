# Implementation Plan: Database Settings UI Improvements

**Branch**: `008-1-use-connection` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-1-use-connection/spec.md`

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
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

This feature improves the database configuration UI to prioritize connection string input and provide better user guidance. Key changes include:
1. Making connection string the default/primary input method (not toggle-based)
2. Dynamic page title based on database configuration state ("Database Initialization" vs "Database Settings")
3. Adding a Tutorial modal accessible from the Supabase provider section
4. Updating help text to clarify Supabase-first support
5. Providing "Advanced" toggle to access individual field inputs

This is a frontend-only UI refactoring with no backend or data model changes.

## Technical Context

**Language/Version**: TypeScript 5.0+, React 18
**Primary Dependencies**: React, Vite (already in project)
**Storage**: Browser localStorage (existing pattern - no changes)
**Testing**: Manual testing via quickstart scenarios (no automated UI tests required per project patterns)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend + backend monorepo)
**Performance Goals**: <300ms UI state transitions, instantaneous modal open/close
**Constraints**: No external dependencies, maintain inline styling pattern, preserve existing database connection logic
**Scale/Scope**: Single component modification (DatabaseSettings.tsx), 1 new component (TutorialModal)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: Template constitution (not customized for this project)

**General Software Engineering Principles Applied**:
- ✅ **Simplicity**: UI-only changes, reusing existing state management patterns
- ✅ **No Breaking Changes**: Preserves all existing functionality, purely additive/reorg
- ✅ **Testability**: Manual testing sufficient per existing project test strategy
- ✅ **Minimal Dependencies**: Zero new dependencies required

**No constitution violations detected** - This is a straightforward UI refactoring.

## Project Structure

### Documentation (this feature)
```
specs/008-1-use-connection/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
platform/core/src/frontend/
├── pages/
│   └── DatabaseSettings.tsx      # MODIFY: Primary changes here
├── components/
│   └── TutorialModal.tsx         # CREATE: New modal component
└── utils/
    └── api-client.ts             # NO CHANGE: Existing localStorage functions
```

**Structure Decision**: Web application structure following existing monorepo pattern. All changes are in the `platform/core/src/frontend/` workspace. No backend changes required since database configuration state detection uses existing `getStoredDatabaseConfig()` utility from browser localStorage.

## Phase 0: Outline & Research

**Research Tasks**:
1. ✅ Current connection string vs individual fields implementation pattern (line 29 in DatabaseSettings.tsx shows `useConnectionString` state)
2. ✅ Modal component patterns in existing codebase (need to verify if modal components exist)
3. ✅ localStorage access pattern for database config (confirmed via `getStoredDatabaseConfig()` at line 122)
4. ✅ Dynamic page title implementation approach (React state-based conditional rendering)

**No unresolved NEEDS CLARIFICATION** - All technical context is clear.

**Output**: research.md documenting:
- Current UI state management approach
- Modal component pattern decision (inline vs separate component)
- Page title conditional logic pattern
- Advanced toggle disclosure pattern

## Phase 1: Design & Contracts

**Deliverables**:

1. **data-model.md**: Document UI state model changes
   - Add `showTutorialModal: boolean` state
   - Add `showAdvancedFields: boolean` state
   - Modify default for `useConnectionString: boolean` from `false` to `true`
   - Document page title derivation logic

2. **contracts/ui-components.contract.md**: Component interface contracts
   - `TutorialModal` component props interface
   - `DatabaseSettings` modified state interface
   - Event handler signatures

3. **quickstart.md**: Manual test scenarios from acceptance criteria
   - Scenario 1: First-time user sees "Database Initialization"
   - Scenario 2: Returning user sees "Database Settings"
   - Scenario 3: Connection string visible by default
   - Scenario 4: Tutorial button appears in Supabase section
   - Scenario 5: Tutorial modal opens/closes correctly
   - Scenario 6: Help text displays correct message
   - Scenario 7: Advanced toggle reveals individual fields

4. **Update CLAUDE.md** (agent context):
   - Add Feature 008 summary to recent changes
   - Note UI state patterns for modal/toggle

**No contract tests needed** - This is a UI refactoring with no API changes.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Preparation Phase** (3 tasks, parallelizable):
   - T001: Create TutorialModal component skeleton [P]
   - T002: Add new state variables to DatabaseSettings [P]
   - T003: Extract Supabase provider section for modification [P]

2. **Implementation Phase** (7 tasks, sequential dependencies):
   - T004: Modify useConnectionString default to true
   - T005: Add page title conditional logic (check localStorage)
   - T006: Implement Advanced toggle for individual fields
   - T007: Add Tutorial button to Supabase section
   - T008: Wire up TutorialModal open/close handlers
   - T009: Update help text message
   - T010: Test connection string history compatibility

3. **Testing Phase** (7 scenarios from quickstart.md):
   - T011: Verify first-time user flow
   - T012: Verify returning user flow
   - T013: Verify connection string default visibility
   - T014: Verify Tutorial button placement
   - T015: Verify modal behavior
   - T016: Verify help text
   - T017: Verify advanced toggle

**Ordering Strategy**:
- Create new component first (T001)
- State changes before UI modifications
- Core functionality before polish
- All implementation before testing phase

**Estimated Output**: 17 tasks in tasks.md (10 implementation + 7 test scenarios)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following component patterns)
**Phase 5**: Validation (run quickstart.md scenarios, verify visual design)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No complexity violations - UI refactoring within existing architectural patterns.

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
- [x] Complexity deviations documented (N/A - none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
