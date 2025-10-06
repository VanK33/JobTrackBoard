# Implementation Plan: Fix File Upload in New/Edit Application Forms

**Branch**: `005-bug-new-application` | **Date**: 2025-10-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-bug-new-application/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ All context determined from codebase analysis
   → ✅ Project Type: web (monorepo with platform/core)
3. Fill the Constitution Check section
   → ✅ No constitution defined (template file)
4. Evaluate Constitution Check section
   → ✅ No violations (bug fix, no new architecture)
   → ✅ Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → ✅ Research complete, all unknowns resolved
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ All artifacts generated
7. Re-evaluate Constitution Check section
   → ✅ No new violations introduced
   → ✅ Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach
   → See Phase 2 section below
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**Primary Requirement**: Fix file upload functionality in "new application" and "edit application" forms that currently fails, while maintaining working "add file" feature on main page.

**Root Cause**: Code attempts to fetch blob URLs (`URL.createObjectURL()`) using network `apiFetch()`, which fails. Edit form has no pending file upload logic.

**Technical Approach**:
1. Store raw File objects (not just blob URLs) for pending uploads
2. Use stored File objects directly when uploading after job creation/update
3. Add pending file upload logic to edit form (currently missing)

## Technical Context
**Language/Version**: TypeScript 5.0+, React 18, Node.js 18+
**Primary Dependencies**: React, Express, Vite, Supabase/pg, sql.js
**Storage**: PostgreSQL/Supabase + Local filesystem fallback
**Testing**: Manual testing (no test framework currently)
**Target Platform**: Web browser (Chrome/Firefox/Safari), Linux/macOS server
**Project Type**: web (monorepo: platform/core/src/backend + platform/core/src/frontend)
**Performance Goals**: File upload < 5s for typical files (1-5MB), progress feedback
**Constraints**: 25MB file size limit, specific MIME types only, session-based multi-tenant
**Scale/Scope**: Single large component (JobDashboard.tsx ~3300 lines), 3 upload paths to fix

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No constitution file defined - using template)

This is a bug fix, not new architecture:
- No new dependencies added
- No new patterns introduced
- Existing code structure maintained
- Minimal changes to fix broken functionality

## Project Structure

### Documentation (this feature)
```
specs/005-bug-new-application/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command) ✅
├── data-model.md        # Phase 1 output (/plan command) ✅
├── quickstart.md        # Phase 1 output (/plan command) ✅
├── contracts/           # Phase 1 output (/plan command) ✅
│   └── file-upload.contract.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created yet)
```

### Source Code (repository root)
```
platform/core/
├── src/
│   ├── backend/
│   │   ├── api/
│   │   │   └── jobs.ts          # File upload API endpoint (no changes)
│   │   ├── services/
│   │   │   ├── storage-service.ts
│   │   │   └── storage-manager.ts
│   │   └── database/
│   │       └── supabase-client.ts
│   ├── frontend/
│   │   ├── pages/
│   │   │   └── JobDashboard.tsx  # PRIMARY FIX TARGET
│   │   ├── components/
│   │   └── utils/
│   │       └── api-client.ts
│   └── shared/
│       └── config/
└── tests/                        # No tests currently
```

**Structure Decision**: Web application monorepo with platform/core workspace. All changes confined to `JobDashboard.tsx` frontend component. Backend API already working correctly.

## Phase 0: Outline & Research
**Status**: ✅ Complete

### Research Tasks Completed
1. ✅ Analyzed broken file upload in new/edit forms
   - Found blob URL fetch issue at line 440
   - Found missing pending upload logic in handleSaveEdit

2. ✅ Analyzed working main page upload
   - Uses `realFileUpload()` directly with File object
   - No temporary storage needed

3. ✅ Reviewed backend API
   - Confirmed `/api/jobs/:id/files` works correctly
   - No backend changes needed

4. ✅ Reviewed File handling patterns
   - Blob URLs for preview only
   - FormData for multipart upload
   - File objects can be stored in React state

### Key Findings (see research.md)
- **Decision**: Store raw File objects for pending uploads
- **Rationale**: Blob URLs can't be fetched over network, File objects work directly
- **Alternatives**: Blob conversion (complex), immediate upload (requires partial job), Base64 (inefficient)

**Output**: ✅ research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
**Status**: ✅ Complete

### Artifacts Generated
1. ✅ **data-model.md**:
   - Extended JobFile interface with `rawFile?: File` and `uploadStatus: 'pending'`
   - Documented state transitions
   - Defined validation rules

2. ✅ **contracts/file-upload.contract.md**:
   - Internal API contracts for all 3 upload functions
   - Before/after code for broken sections
   - Test cases required for verification

3. ✅ **quickstart.md**:
   - 8 test scenarios covering all use cases
   - Step-by-step manual testing guide
   - Success criteria and debugging tips

4. ✅ **CLAUDE.md**:
   - Updated via update-agent-context.sh script
   - Added feature-specific context

**Output**: ✅ data-model.md, /contracts/*, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

### Task Generation Strategy
The /tasks command will generate tasks from the following sources:

1. **From contracts/file-upload.contract.md**:
   - Update JobFile interface (add rawFile field, add 'pending' status)
   - Fix handleFilesUpload() to store raw File objects
   - Fix handleSaveNewApplication() line 440-442 (use rawFile instead of blob fetch)
   - Add pending upload logic to handleSaveEdit() after line 312

2. **From data-model.md**:
   - Validate pending files have rawFile populated
   - Clean up blob URLs after upload (prevent memory leaks)

3. **From quickstart.md**:
   - Manual test: New application with files (Scenario 1)
   - Manual test: Edit application with new files (Scenario 2)
   - Manual test: Main page regression (Scenario 3)
   - Manual test: File validation (Scenario 4)
   - Manual test: Form validation with files (Scenario 5)
   - Manual test: Multiple file upload (Scenario 6)
   - Manual test: Cancel cleanup (Scenario 7)
   - Manual test: Mixed files edit (Scenario 8)

### Ordering Strategy
1. **Interface updates** (JobFile type definition)
2. **handleFilesUpload fix** (store rawFile)
3. **handleSaveNewApplication fix** (use rawFile for upload)
4. **handleSaveEdit fix** (add pending upload logic)
5. **Cleanup improvements** (blob URL revocation)
6. **Manual testing** (all 8 scenarios from quickstart.md)

All tasks [P] (parallelizable) except testing which must come last.

### Estimated Output
~10-12 numbered, ordered tasks in tasks.md:
- 4-5 code modification tasks
- 1 cleanup task
- 1 verification task
- 8 manual test scenario tasks (can be grouped)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md in order)
**Phase 5**: Validation (run all quickstart.md scenarios, verify no regressions)

## Complexity Tracking
*No violations - this section left empty*

This is a straightforward bug fix:
- No new patterns or architectures
- No additional dependencies
- Changes isolated to single component
- Follows existing code patterns

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution template - No project constitution defined*
