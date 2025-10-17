
# Implementation Plan: Fix Null Reference Error in Job Creation

**Branch**: `023-fix-null-reference` | **Date**: 2025-10-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-fix-null-reference/spec.md`

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

**Primary Requirement**: Fix critical null reference error (`TypeError: Cannot read properties of null (reading '_id')`) that crashes the application when users click outside the "New Application" form.

**Technical Approach**: Add null safety guards to all `selectedJob` property accesses in JobDashboard.tsx, implement dirty state tracking for form data, and create reusable confirmation dialog for unsaved changes. Scope limited to new job creation flow only.

## Technical Context
**Language/Version**: TypeScript 5.0+ with React 18
**Primary Dependencies**: React 18, Vite 5, Express.js (backend)
**Storage**: PostgreSQL/Supabase (via existing platform infrastructure)
**Testing**: Manual testing per quickstart.md scenarios (no automated tests for this bugfix)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend + backend monorepo structure)
**Performance Goals**: <5ms null check overhead, <100ms modal interaction response
**Constraints**: No new runtime dependencies, preserve existing API contracts, maintain backwards compatibility with saved jobs
**Scale/Scope**: Single component (JobDashboard.tsx ~4000 lines), 7 specific null reference locations identified

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - Template constitution (no project-specific principles defined)

Since the constitution file contains only placeholder templates, no specific gates apply. This is a bugfix with minimal architectural impact:
- No new libraries or dependencies
- No new abstractions or patterns
- Surgical changes to existing component
- Follows existing TypeScript/React patterns

**Re-evaluation after Phase 1**: Will verify no complexity creep during design.

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
platform/core/src/frontend/
├── pages/
│   └── JobDashboard.tsx          # Main file requiring null safety fixes
├── components/
│   └── (Future: ConfirmationDialog component if needed)
├── hooks/
│   └── (Future: useDirtyState hook if extracted)
└── utils/
    └── (Future: form validation utilities)
```

**Structure Decision**: Web application monorepo structure. All changes confined to frontend layer, specifically the JobDashboard.tsx component. No backend changes required since this is a frontend-only null safety issue. Following existing inline component pattern (no new files initially, refactor to reusable components if needed later).

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data-model.md, quickstart.md)
- Focus on 7 specific null reference fix locations identified in research.md
- Create helper function implementation tasks based on contracts/
- Add manual testing tasks based on quickstart.md scenarios

**Task Breakdown**:
1. **Contract Implementation** (from contracts/ directory):
   - Implement `NullSafetyHelpers` utility functions [P]
   - Implement `FormStateManager` class [P]
   - Implement `ConsoleErrorLogger` class [P]

2. **Null Safety Fixes** (from research.md Line Numbers):
   - Fix Line 2255: Add optional chaining to title/company display
   - Fix Line 2340: Add null guard to delete button click handler
   - Fix Line 2369: Add null check to delete confirmation modal condition
   - Fix Lines 2429, 2499: Add null guards to delete confirmation buttons
   - Fix Line 3681: Add null guard to delete status history handler
   - Fix Line 4000: Add null guard to update job status handler

3. **Dirty State Detection** (from data-model.md):
   - Implement `hasUnsavedData()` function based on FR-006 logic
   - Add `handleCloseAttempt()` function with confirmation logic
   - Wire up confirmation dialog to close handlers

4. **Manual Testing** (from quickstart.md):
   - Execute Scenarios 1-12 manual test suite
   - Document test results with screenshots
   - Verify no regression in existing functionality

**Ordering Strategy**:
- **Phase 1**: Implement helper utilities first (contracts) [P = parallel]
- **Phase 2**: Apply null guards to 7 locations (can be done in parallel after helpers exist)
- **Phase 3**: Implement dirty state detection and confirmation dialog
- **Phase 4**: Manual testing (sequential)

**Dependencies**:
- All null safety fixes depend on `NullSafetyHelpers` being implemented
- Confirmation dialog depends on `FormStateManager`
- Manual testing depends on all fixes being complete

**Estimated Output**: ~15-20 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [x] Phase 3: Tasks generated (/tasks command) ✅ **34 tasks**
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅ (No new complexity introduced)
- [x] All NEEDS CLARIFICATION resolved ✅ (All answered in spec.md Session 2025-10-16)
- [x] Complexity deviations documented ✅ (None - bugfix only)

**Artifacts Generated**:
- [x] `plan.md` - This file ✅
- [x] `research.md` - 6 research areas documented ✅
- [x] `data-model.md` - 4 entities defined ✅
- [x] `contracts/NullSafetyHelpers.interface.ts` ✅
- [x] `contracts/FormStateManagement.interface.ts` ✅
- [x] `contracts/ErrorLogging.interface.ts` ✅
- [x] `quickstart.md` - 12 manual test scenarios ✅
- [x] `CLAUDE.md` - Updated with feature context ✅
- [x] `tasks.md` - 34 implementation tasks ✅

**Ready for implementation** ✅

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
