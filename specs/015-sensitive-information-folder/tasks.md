# Tasks: Remove Sensitive Database Information from Repository

**Input**: Design documents from `/specs/015-sensitive-information-folder/`
**Prerequisites**: plan.md ✅, research.md ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Tech stack: TypeScript 5.0+, Node.js 18+, monorepo structure
   → ✅ No code changes needed (file operations only)
2. Load optional design documents:
   → research.md: ✅ Git history shows file was committed (security issue)
   → quickstart.md: ✅ 8 manual verification scenarios documented
   → data-model.md: N/A (no data modeling needed)
   → contracts/: N/A (no API changes)
3. Generate tasks by category:
   → Setup: Verify Feature 014 localStorage implementation exists
   → Audit: Search for hardcoded credentials
   → Cleanup: Delete file, update .gitignore
   → Verification: Test app, search again
   → Security: Git history analysis, credential rotation advisory
4. Apply task rules:
   → Sequential execution (safety-first approach)
   → No parallel tasks needed (each task depends on previous)
   → File operations are atomic and fast
5. Number tasks sequentially (T001-T008)
6. Generate dependency graph (linear sequence)
7. No parallel execution (all tasks sequential)
8. Validate task completeness:
   → ✅ All FR requirements covered (FR-001 to FR-009)
   → ✅ All quickstart scenarios have corresponding tasks
   → ✅ Security advisory task included
9. Return: SUCCESS (8 tasks ready for execution)
```

## Format: `[ID] Description`
- No [P] markers - all tasks must run sequentially
- Include exact file paths in descriptions
- Each task maps to quickstart.md scenarios

## Path Conventions
- **Project**: Monorepo at `/Users/vankee/Downloads/job_seek_app`
- **Core**: `platform/core/`
- **Git root**: Repository root for `.gitignore`

---

## Phase 3.1: Pre-Flight Verification

- [x] **T001** Verify Feature 014 localStorage implementation exists
  - **File**: `platform/core/src/frontend/utils/api-client.ts`, `platform/core/src/frontend/utils/connectionUtils.ts`
  - **Action**: Read files to confirm `getStoredDatabaseConfig()` and `loadNamedConnections()` exist
  - **Validation**: Functions are implemented and handle localStorage-based configuration
  - **Dependencies**: None
  - **Maps to**: research.md Section 3 (Feature 014 localStorage Implementation)
  - **Success Criteria**: Both functions exist and are exported

---

## Phase 3.2: Security Audit

- [ ] **T002** Audit repository for hardcoded database credentials
  - **Command**: `grep -r "urgmsorlmjbdwilxsaud\|Bnknnkw4R9Zq4JJC" --exclude-dir={node_modules,.git,dist} .`
  - **Expected Findings**:
    - `platform/core/.env` (protected by .gitignore ✅)
    - `platform/core/database-config.json` (NOT protected ❌)
  - **Validation**: Only 2 files found, no credentials in source code
  - **Dependencies**: T001 (verify app can work without database-config.json)
  - **Maps to**: quickstart.md Scenario 1 (Audit Repository)
  - **Success Criteria**: Identified exactly 2 files with credentials

---

## Phase 3.3: File Cleanup

- [ ] **T003** Delete `platform/core/database-config.json`
  - **File**: `platform/core/database-config.json`
  - **Command**: `rm platform/core/database-config.json`
  - **Validation**: File no longer exists (`ls platform/core/database-config.json` returns error)
  - **Dependencies**: T002 (audit complete, confirmed file is obsolete)
  - **Maps to**: quickstart.md Scenario 2 (Remove Sensitive File)
  - **Success Criteria**: File deleted successfully, no errors

- [ ] **T004** Add `database-config.json` to root `.gitignore`
  - **File**: `.gitignore` (repository root)
  - **Content to Add**:
    ```gitignore
    # Database configuration files (sensitive)
    database-config.json
    platform/core/database-config.json
    ```
  - **Validation**: Pattern exists in `.gitignore`, `git status` ignores the file pattern
  - **Dependencies**: T003 (file already deleted)
  - **Maps to**: quickstart.md Scenario 3 (Update .gitignore)
  - **Success Criteria**: Patterns added with comment, git ignores files

---

## Phase 3.4: Verification

- [ ] **T005** Verify `.env` is protected by `.gitignore`
  - **File**: `.gitignore` (repository root)
  - **Command**: `grep "^\.env$" .gitignore`
  - **Expected**: `.env` is listed in .gitignore
  - **Validation**: `.env` exists in .gitignore, `git status` does not show `.env`
  - **Dependencies**: T004 (gitignore updates complete)
  - **Maps to**: quickstart.md Scenario 4 (Verify .env Protection)
  - **Success Criteria**: `.env` is in .gitignore and protected

- [ ] **T006** Run comprehensive credential search to verify cleanup
  - **Command**: `grep -r "urgmsorlmjbdwilxsaud\|Bnknnkw4R9Zq4JJC\|postgresql://.*:.*@" --exclude-dir={node_modules,.git,dist} --exclude="*.md" .`
  - **Expected**: Only `platform/core/.env` contains credentials (protected)
  - **Validation**: No `database-config.json` in results, no credentials in source code
  - **Dependencies**: T003 (file deleted), T004 (gitignore updated)
  - **Maps to**: quickstart.md Scenario 5 (Search for Remaining Credentials)
  - **Success Criteria**: Only protected `.env` file contains credentials

- [ ] **T007** Test application works without `database-config.json`
  - **Command**: `npm run dev` (then open browser to localhost:5173)
  - **Expected Behavior**:
    - Server starts without errors
    - No console errors about missing database-config.json
    - App loads DatabaseSettings page (if localStorage empty) or main app (if config exists)
    - Database connection works via localStorage config (Feature 014)
  - **Validation**: Check browser console for errors, test database operations
  - **Dependencies**: T003 (file deleted), T006 (credentials verified)
  - **Maps to**: quickstart.md Scenario 6 (Verify Application Works)
  - **Success Criteria**: App works normally, uses localStorage for configuration

---

## Phase 3.5: Security Advisory

- [ ] **T008** Check git history and warn user about credential rotation
  - **Command**: `git log --all --oneline -- platform/core/database-config.json`
  - **Expected**: Shows commit `f1b13c5` from 2025-09-27
  - **Action**:
    1. Confirm file was committed to git history
    2. Display security warning to user:
       ```
       ⚠️ CRITICAL SECURITY ALERT ⚠️

       database-config.json was committed to git (commit f1b13c5 on 2025-09-27).

       IMMEDIATE ACTION REQUIRED:
       1. Rotate Supabase database credentials (change password)
       2. Update platform/core/.env with new credentials
       3. Update any production deployments

       OPTIONAL:
       - Rewrite git history to remove commit (if repo is private)
       - Command: git filter-branch --force --index-filter \
         'git rm --cached --ignore-unmatch platform/core/database-config.json' \
         --prune-empty --tag-name-filter cat -- --all

       For detailed steps, see quickstart.md Scenario 7.
       ```
  - **Validation**: Warning displayed to user
  - **Dependencies**: T007 (app verified working)
  - **Maps to**: quickstart.md Scenario 7 (Check Git History)
  - **Success Criteria**: User is aware of credential exposure and rotation requirement

---

## Dependencies

**Linear Sequence** (must execute in order):
```
T001 (verify Feature 014)
  ↓
T002 (audit credentials)
  ↓
T003 (delete file)
  ↓
T004 (update .gitignore)
  ↓
T005 (verify .env protection)
  ↓
T006 (search remaining credentials)
  ↓
T007 (test app works)
  ↓
T008 (security advisory)
```

**Rationale for Sequential Execution**:
- T001 must verify Feature 014 exists before deleting database-config.json
- T002 must audit before T003 deletes (confirm file location)
- T003 must delete before T004 updates gitignore (prevent confusion)
- T004 must update gitignore before T005-T006 verify (ensure protection)
- T005-T006 must verify before T007 tests (confirm safety)
- T007 must test app before T008 advisory (ensure no breakage)

---

## Parallel Execution

**No parallel execution** - all tasks are sequential for safety:
- File operations are atomic and fast (<1 second each)
- Each task depends on previous task completion
- Sequential execution ensures data integrity
- Total estimated time: <5 minutes for all 8 tasks

---

## Notes

### Implementation Approach
- **Manual execution**: User can run commands directly (fastest for simple cleanup)
- **Automated execution**: Can be scripted, but manual is recommended for this security-sensitive task
- **Verification**: Each task includes validation criteria for immediate feedback

### Critical Warnings
1. ⚠️ **Credential Rotation Required**: File was committed to git, credentials are exposed
2. ⚠️ **Backup Recommended**: Though file is obsolete, user may want to backup before deletion
3. ⚠️ **Feature 014 Dependency**: Deletion is safe only because Feature 014 provides replacement

### Task Completion Checklist
- [ ] All 8 tasks completed successfully
- [ ] No errors during execution
- [ ] App works normally with localStorage configuration
- [ ] User has been warned about credential rotation
- [ ] `.gitignore` updated to prevent future commits

---

## Validation Checklist
*GATE: Checked before marking feature complete*

- [x] All FR requirements have tasks:
  - FR-001: T002 (identify files with credentials)
  - FR-002: T003 (remove database-config.json)
  - FR-003: T004 (add to .gitignore)
  - FR-004: T005 (verify .env in .gitignore)
  - FR-005: T006 (search entire repository)
  - FR-006: T007 (verify app still works)
  - FR-007: T005 (do not remove .env)
  - FR-008: Documented in quickstart.md and tasks.md
  - FR-009: T008 (warn user about git history)

- [x] All quickstart scenarios have corresponding tasks:
  - Scenario 1 (Audit): T002
  - Scenario 2 (Remove File): T003
  - Scenario 3 (Update .gitignore): T004
  - Scenario 4 (Verify .env): T005
  - Scenario 5 (Search Remaining): T006
  - Scenario 6 (Verify App Works): T007
  - Scenario 7 (Check Git History): T008
  - Scenario 8 (Final Verification): Covered by T006-T007

- [x] All tasks have clear file paths
- [x] All tasks have validation criteria
- [x] Dependencies are clearly documented
- [x] Security implications are addressed

---

## Task Execution Order

**Recommended sequence** (execute in this exact order):
1. **T001** - Verify Feature 014 exists (safety check)
2. **T002** - Audit credentials (identify files)
3. **T003** - Delete database-config.json (remove exposure)
4. **T004** - Update .gitignore (prevent future commits)
5. **T005** - Verify .env protection (confirm backend safety)
6. **T006** - Search for remaining credentials (verify cleanup)
7. **T007** - Test application (ensure no breakage)
8. **T008** - Display security advisory (warn user)

**Total tasks**: 8 (T001-T008)
**Estimated effort**: ~5-10 minutes (manual execution) or ~2 minutes (automated script)

---

**Tasks Complete**: ✅ Ready for execution via quickstart.md or automated script
