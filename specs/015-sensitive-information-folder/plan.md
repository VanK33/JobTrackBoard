# Implementation Plan: Remove Sensitive Database Information from Repository

**Branch**: `015-sensitive-information-folder` | **Date**: 2025-10-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-sensitive-information-folder/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded: FR-001 to FR-009, security audit results
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: web (frontend + backend monorepo)
   → Structure: platform/core with frontend/backend separation
   → No NEEDS CLARIFICATION - straightforward file cleanup task
3. Fill the Constitution Check section
   → Constitution is template-only (no custom principles defined)
   → Default to standard practices: minimal changes, preserve functionality
4. Evaluate Constitution Check section
   → No violations - this is file cleanup/security hardening
   → Update Progress Tracking: Initial Constitution Check ✅
5. Execute Phase 0 → research.md
   → Research git history analysis, .gitignore best practices
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → No API contracts needed (file operations only)
   → No data model changes (removing files, not adding)
   → Quickstart: Manual verification steps
7. Re-evaluate Constitution Check section
   → Still PASS - minimal scope, no added complexity
   → Update Progress Tracking: Post-Design Constitution Check ✅
8. Plan Phase 2 → Describe task generation approach
   → Simple sequential tasks: audit → delete → verify
9. STOP - Ready for /tasks command ✅
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Remove sensitive database credentials from repository to prevent unauthorized access. The `database-config.json` file contains hardcoded PostgreSQL connection string with password and is not gitignored. This file is obsolete since Feature 014 implemented localStorage-based configuration. The cleanup involves:
1. Deleting `platform/core/database-config.json`
2. Adding `database-config.json` to `.gitignore`
3. Verifying `.env` is protected (already in .gitignore)
4. Searching for any remaining hardcoded credentials
5. Documenting security best practices

## Technical Context
**Language/Version**: TypeScript 5.0+, Node.js 18+
**Primary Dependencies**: None (file system operations only)
**Storage**: localStorage (Feature 014), .env for backend
**Testing**: Manual verification via quickstart.md
**Target Platform**: Repository file system, Git version control
**Project Type**: web (monorepo with platform/core)
**Performance Goals**: N/A (one-time cleanup operation)
**Constraints**: Must not break existing functionality (Feature 014 localStorage config)
**Scale/Scope**: 2 files to audit, 1 file to delete, 1 .gitignore entry to add

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (Constitution is template-only, no custom principles defined)

**Standard Best Practices Applied**:
- Minimal changes: Only remove obsolete file, no code refactoring
- Preserve functionality: Feature 014 already provides replacement (localStorage config)
- Security first: Remove exposed credentials immediately
- Documentation: Update .gitignore, document in quickstart.md

**Complexity Evaluation**:
- No new abstractions added
- No new dependencies introduced
- No architectural changes
- Simple file operations only

## Project Structure

### Documentation (this feature)
```
specs/015-sensitive-information-folder/
├── spec.md             # Feature specification (✅ complete)
├── plan.md             # This file (/plan command output)
├── research.md         # Phase 0 output (/plan command)
├── quickstart.md       # Phase 1 output (/plan command)
└── tasks.md            # Phase 2 output (/tasks command - NOT created by /plan)
```

Note: No `contracts/` or `data-model.md` needed (no API changes or data modeling)

### Source Code (repository root)
```
platform/core/
├── src/
│   ├── backend/        # Backend (Express + TypeScript)
│   │   ├── api/        # API routes
│   │   ├── database/   # Database services
│   │   ├── middleware/ # Middleware including database-config.ts
│   │   ├── services/   # Business logic
│   │   └── utils/      # Backend utilities
│   ├── frontend/       # Frontend (React 18 + Vite)
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # Frontend services
│   │   ├── hooks/      # React hooks
│   │   └── utils/      # Frontend utilities (api-client.ts stores config in localStorage)
│   └── shared/         # Shared types and config
├── .env                # Backend env vars (✅ already in .gitignore)
├── .gitignore          # Git ignore rules (needs update: add database-config.json)
├── database-config.json # ❌ REMOVE THIS (hardcoded credentials, not gitignored)
└── dist/               # Build output (gitignored)

.gitignore              # Root .gitignore (update needed)
```

**Structure Decision**: Web application monorepo structure. The project uses `platform/core` as the main workspace with frontend/backend separation. Feature 014 already migrated database configuration from server-side files to client-side localStorage, making `database-config.json` obsolete.

## Phase 0: Outline & Research

### Research Topics

1. **Git History Analysis**
   - Decision: Check if `database-config.json` was ever committed to git
   - Rationale: If committed, credentials are exposed in git history and must be rotated
   - Command: `git log --all -- platform/core/database-config.json`

2. **.gitignore Best Practices**
   - Decision: Add `database-config.json` to `.gitignore` at repository root
   - Rationale: Prevent future accidental commits of this file pattern
   - Alternatives considered: Adding to `platform/core/.gitignore` (rejected - root is more comprehensive)

3. **Feature 014 localStorage Implementation**
   - Decision: Verify Feature 014 successfully migrated to localStorage-based config
   - Rationale: Confirms `database-config.json` is truly obsolete
   - Implementation: Check `platform/core/src/frontend/utils/api-client.ts` and `connectionUtils.ts`

4. **Credential Search Patterns**
   - Decision: Search for hardcoded credentials using multiple patterns
   - Rationale: Ensure no other sensitive data exists in unexpected locations
   - Patterns: Connection strings, API keys, passwords, tokens

5. **Application Functionality Verification**
   - Decision: Test app after removing `database-config.json`
   - Rationale: Ensure Feature 014 localStorage fallback works correctly
   - Test: Run dev server, verify database connection still works

**Output**: research.md with consolidated findings

## Phase 1: Design & Contracts

### Data Model
**No data model changes needed** - this is a file cleanup operation. Existing data models remain unchanged.

### API Contracts
**No API contracts needed** - this feature involves file system operations only. No backend API changes required.

### Quickstart Test Scenarios

Based on Feature Spec acceptance scenarios:

1. **Audit Repository**
   - Manual: Search for `database-config.json` and sensitive credentials
   - Expected: Identify `platform/core/database-config.json` as containing credentials

2. **Remove Sensitive File**
   - Manual: Delete `platform/core/database-config.json`
   - Expected: File removed from file system

3. **Update .gitignore**
   - Manual: Add `database-config.json` to root `.gitignore`
   - Expected: Entry added, `git status` shows file would be ignored

4. **Verify .env Protection**
   - Manual: Check `.env` is in `.gitignore`
   - Expected: `.env` already listed (Feature 014 requirement)

5. **Search for Remaining Credentials**
   - Manual: Run `grep -r "urgmsorlmjbdwilxsaud\|Bnknnkw4R9Zq4JJC" --exclude-dir={node_modules,.git,dist}`
   - Expected: Only `.env` contains credentials (protected by .gitignore)

6. **Verify Application Works**
   - Manual: Run `npm run dev`, test database connection
   - Expected: App uses localStorage config (Feature 014), no errors

7. **Check Git History (if file was committed)**
   - Manual: Run `git log --all -- platform/core/database-config.json`
   - Expected: If commits exist, warn user to rotate credentials

### Agent Context Update
**No agent context update needed** - this is a one-time cleanup operation with no lasting architectural changes.

**Output**: quickstart.md with manual verification steps

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate simple sequential tasks (no parallelization needed)
- Each task is a single file operation or verification step
- Order: audit → backup (optional) → delete → gitignore → verify → document

**Task Breakdown**:
1. **Audit Phase** (1 task)
   - Search repository for hardcoded credentials
   - Identify all files containing sensitive data

2. **Cleanup Phase** (2 tasks)
   - Delete `platform/core/database-config.json`
   - Add `database-config.json` to root `.gitignore`

3. **Verification Phase** (3 tasks)
   - Verify `.env` is in `.gitignore`
   - Run comprehensive credential search
   - Test application with localStorage config

4. **Documentation Phase** (1 task)
   - Add security warning to README or docs
   - Document use of localStorage config (Feature 014)

5. **Security Advisory** (1 task)
   - Check git history for exposed credentials
   - Warn user to rotate credentials if needed

**Ordering Strategy**:
- Sequential execution (no parallel tasks)
- Safety-first: audit before delete, verify after delete
- Dependencies: cleanup before verification, verification before documentation

**Estimated Output**: 8-10 numbered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following best practices)
**Phase 5**: Validation (run quickstart.md scenarios, verify no credentials remain)

## Complexity Tracking
*No complexity deviations - straightforward file cleanup operation*

**No violations to document** - this feature aligns with all standard best practices:
- Minimal scope: Only removes obsolete file
- No new dependencies
- No architectural changes
- Leverages existing Feature 014 implementation

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - tasks.md created with 8 tasks
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (none existed)
- [x] Complexity deviations documented (none exist)

**Artifacts Generated**:
- [x] research.md - Git history analysis, security research, best practices
- [x] quickstart.md - 8 manual verification scenarios
- [x] tasks.md - 8 sequential tasks (T001-T008)
- [ ] contracts/ - Not needed (no API changes)
- [ ] data-model.md - Not needed (no data modeling)

---
*Based on project best practices and security standards*
