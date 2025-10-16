# Tasks: Update README and Remove SQLite Support

**Input**: Design documents from `/specs/019-update-readme-md/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/database-api.md, quickstart.md

## Execution Flow
```
1. Load plan.md → Extract: TypeScript/Node.js stack, PostgreSQL-only architecture
2. Load research.md → Identify: 9 files to modify/delete, sql.js dependency
3. Load data-model.md → Extract: DatabaseConfig interface changes
4. Load contracts/database-api.md → Identify: API rejection behavior
5. Generate tasks:
   → Dependency removal (sql.js)
   → Code deletion (sqlite-service.ts)
   → Code cleanup (6 backend files)
   → Documentation update (README.md)
   → Validation (quickstart.md)
6. Order: dependency → deletion → cleanup → docs → validation
7. Parallel: All cleanup tasks can run in parallel (different files)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Project root**: `/Users/vankee/Downloads/job_seek_app/`
- **Backend**: `platform/core/src/backend/`
- **Package**: `platform/core/package.json`
- **Docs**: `README.md`

## Phase 3.1: Dependency Removal
- [x] T001 Remove sql.js from platform/core/package.json and run npm install

## Phase 3.2: Code Deletion
- [x] T002 Delete platform/core/src/backend/database/sqlite-service.ts

## Phase 3.3: Code Cleanup (Parallel Execution Possible)
**All tasks in this phase modify different files - can run in parallel**

- [x] T003 [P] Remove SQLite logic from platform/core/src/backend/database/connection-pool-manager.ts
- [x] T004 [P] Remove SQLite logic from platform/core/src/backend/database/database-manager.ts
- [x] T005 [P] Fix imports in platform/core/src/backend/database/postgresql-service.ts
- [x] T006 [P] Add SQLite rejection to platform/core/src/backend/api/database.ts
- [x] T007 [P] Update validation in platform/core/src/backend/middleware/database-config.ts
- [x] T008 [P] Verify no SQLite deps in platform/core/src/backend/database/data-mapper.ts, type-mappers.ts, config-persistence.ts

## Phase 3.4: Documentation Update
- [x] T009 Update README.md to remove SQLite/SQL.js references and update database setup instructions

## Phase 3.5: Validation
- [x] T010 Run quickstart.md validation steps to verify SQLite removal

## Task Details

### T001: Remove sql.js Dependency
**File**: `platform/core/package.json`

**Steps**:
1. Open platform/core/package.json
2. Locate sql.js dependency (v1.13.0) in dependencies section
3. Remove the entire line: `"sql.js": "^1.13.0",`
4. Run `cd platform/core && npm install` to update package-lock.json
5. Verify node_modules no longer contains sql.js

**Expected Changes**:
```diff
- "sql.js": "^1.13.0",
```

**Validation**: `grep "sql.js" platform/core/package.json` should return no results

---

### T002: Delete SQLite Service
**File**: `platform/core/src/backend/database/sqlite-service.ts`

**Steps**:
1. Delete the entire file (802 lines)
2. Verify no other files import from this file (except those in cleanup tasks)

**Command**:
```bash
rm platform/core/src/backend/database/sqlite-service.ts
```

**Validation**: File should not exist

---

### T003: Remove SQLite from Connection Pool Manager [P]
**File**: `platform/core/src/backend/database/connection-pool-manager.ts`

**Steps**:
1. Remove import of SQLiteService
2. Remove SQLite case from connection pool creation logic
3. Remove SQLite pool management code
4. Ensure PostgreSQL logic remains unchanged

**Expected Changes**:
- Remove: `import { SQLiteService } from './sqlite-service.js';` (or similar)
- Remove: SQLite case in switch/if statements
- Keep: All PostgreSQL connection pool logic

**Validation**:
- File compiles without errors
- No references to SQLiteService remain
- PostgreSQL connection pool logic intact

---

### T004: Remove SQLite from Database Manager [P]
**File**: `platform/core/src/backend/database/database-manager.ts`

**Steps**:
1. Remove SQLiteService instance variable
2. Remove SQLite initialization branches
3. Remove SQLite-specific method calls
4. Keep all PostgreSQL logic unchanged

**Expected Changes**:
- Remove: SQLite service instance
- Remove: SQLite initialization code
- Keep: PostgreSQL service integration
- Keep: All CRUD operations

**Validation**:
- File compiles without errors
- No SQLiteService references
- PostgreSQL operations unchanged

---

### T005: Fix PostgreSQL Service Imports [P]
**File**: `platform/core/src/backend/database/postgresql-service.ts`

**Steps**:
1. Review imports for any references to sqlite-service.ts
2. Remove or update imports that depended on SQLite types
3. If shared types needed, extract to common file first
4. Ensure PostgreSQL service compiles independently

**Expected Changes**:
- Remove: Any imports from sqlite-service.ts
- Add: Shared types to common location if needed
- Keep: All PostgreSQL functionality

**Validation**:
- File compiles without errors
- No imports from deleted sqlite-service.ts
- All PostgreSQL methods work

---

### T006: Add SQLite Rejection to Database API [P]
**File**: `platform/core/src/backend/api/database.ts`

**Steps**:
1. Locate POST /api/database/test endpoint
2. Add validation to reject type='sqlite' with 400 error
3. Locate POST /api/database/initialize endpoint
4. Add same validation with helpful error message
5. Follow contract specification from contracts/database-api.md

**Expected Changes**:
```typescript
// In both /test and /initialize endpoints
if (config.type === 'sqlite') {
  return res.status(400).json({
    connected: false,
    error: 'Unsupported database type: sqlite. SQLite is no longer supported. Please use PostgreSQL or Supabase. See README for setup instructions.'
  });
}
```

**Validation**:
- Test with SQLite config returns 400 error
- Error message matches contract
- PostgreSQL requests still work

---

### T007: Update Database Config Validation [P]
**File**: `platform/core/src/backend/middleware/database-config.ts`

**Steps**:
1. Locate DatabaseConfig type validation
2. Update type enum to remove 'sqlite'
3. Remove filePath validation (SQLite-specific)
4. Add error for sqlite type if received

**Expected Changes**:
```typescript
// Update type definition or validation
type: 'postgresql' | 'mysql' | 'mongodb'  // Removed 'sqlite'
```

**Validation**:
- Validation rejects sqlite type
- PostgreSQL validation unchanged
- filePath no longer accepted

---

### T008: Verify No SQLite Dependencies in Supporting Files [P]
**Files**:
- `platform/core/src/backend/database/data-mapper.ts`
- `platform/core/src/backend/database/type-mappers.ts`
- `platform/core/src/backend/database/config-persistence.ts`

**Steps**:
1. Search each file for 'sqlite', 'SQLite', 'sql.js'
2. If found in comments only: Update comments to remove mention
3. If found in code: Remove SQLite-specific logic
4. Verify PostgreSQL logic unchanged

**Expected Outcome**:
- No SQLite code references (comments OK if historical)
- All three files compile without errors
- PostgreSQL functionality unchanged

**Validation**:
```bash
grep -i "sqlite" platform/core/src/backend/database/data-mapper.ts
grep -i "sqlite" platform/core/src/backend/database/type-mappers.ts
grep -i "sqlite" platform/core/src/backend/database/config-persistence.ts
```
Should return no results (or only historical comments)

---

### T009: Update README.md Documentation
**File**: `README.md`

**Steps**:
1. **Tech Stack Section** (around line 21):
   - Change: "Database: PostgreSQL/Supabase (with SQL.js fallback)"
   - To: "Database: PostgreSQL/Supabase"

2. **Database Setup Section** (around lines 46-55):
   - Remove: Any mention of SQL.js as "no setup" option
   - Add: Emphasis that PostgreSQL is required for development
   - Update: Setup instructions for PostgreSQL/Supabase only

3. **Database Configuration Section** (around lines 120-134):
   - Remove: Entire SQL.js section
   - Keep: PostgreSQL and Supabase sections

4. **Current Status Section** (around lines 221-248):
   - Remove: "Multi-database support" as completed feature
   - Update: "PostgreSQL/Supabase support" instead

5. **Add PostgreSQL Setup Guide** (optional but recommended):
   - Local PostgreSQL installation
   - Docker Compose example
   - Supabase quick start
   - Connection string examples

**Expected Changes**:
- No mentions of SQLite or SQL.js in setup instructions
- Tech stack reflects PostgreSQL-only architecture
- Clear PostgreSQL setup guidance
- Historical mentions in changelog are OK

**Validation**:
```bash
cat README.md | grep -i "sqlite\|sql.js"
```
Should only return historical/changelog mentions, not setup instructions

---

### T010: Run Validation Steps
**Reference**: `specs/019-update-readme-md/quickstart.md`

**Steps**:
1. **Verify No SQLite Code** (30 seconds):
   ```bash
   cd /Users/vankee/Downloads/job_seek_app
   grep -r "sqlite\|SQLite" platform/core/src --exclude-dir=node_modules
   # Expected: No results
   ```

2. **Verify sql.js Dependency Removed** (10 seconds):
   ```bash
   grep "sql.js" platform/core/package.json
   # Expected: No results
   ```

3. **Verify Build Success** (1 minute):
   ```bash
   cd platform/core
   npm install
   npm run type-check
   # Expected: Build completes without errors
   ```

4. **Verify PostgreSQL Still Works** (2 minutes):
   ```bash
   npm run dev:backend
   # In another terminal:
   npm run dev:frontend
   # Open browser to http://localhost:5173
   # Navigate to database settings
   # Test PostgreSQL connection
   # Create a test job
   ```

5. **Verify README Accuracy** (1 minute):
   ```bash
   cat README.md | grep -i "sqlite\|sql.js"
   # Expected: No SQLite/SQL.js as supported database
   ```

6. **Verify API Rejects SQLite** (1 minute):
   ```bash
   curl -X POST http://localhost:3000/api/database/test \
     -H "Content-Type: application/json" \
     -d '{"type":"sqlite","filePath":"./test.db"}'
   # Expected: 400 error with helpful message
   ```

**Success Criteria**: All 6 validation steps pass

---

## Dependencies

**Strict Sequential Order**:
1. T001 (Remove dependency) BLOCKS T002-T010
2. T002 (Delete sqlite-service) BLOCKS T003-T008
3. T003-T008 (Cleanup) BLOCKS T009
4. T009 (Documentation) BLOCKS T010
5. T010 (Validation) is final step

**Parallel Execution Groups**:
- T003, T004, T005, T006, T007, T008 can run in parallel (different files)

---

## Parallel Execution Example

After completing T001 and T002, launch T003-T008 together:

```bash
# All these tasks can run concurrently (different files)
Task 1: "Remove SQLite logic from platform/core/src/backend/database/connection-pool-manager.ts"
Task 2: "Remove SQLite logic from platform/core/src/backend/database/database-manager.ts"
Task 3: "Fix imports in platform/core/src/backend/database/postgresql-service.ts"
Task 4: "Add SQLite rejection to platform/core/src/backend/api/database.ts"
Task 5: "Update validation in platform/core/src/backend/middleware/database-config.ts"
Task 6: "Verify no SQLite deps in data-mapper.ts, type-mappers.ts, config-persistence.ts"
```

---

## Notes

- **Breaking Change**: This feature removes SQLite support entirely
- **No Data Migration**: SQLite was never used in production
- **PostgreSQL Must Work**: All PostgreSQL functionality must remain unchanged
- **Build Must Pass**: TypeScript compilation is mandatory at each step
- **Single Commit**: Consider making all changes in one atomic commit
- **Rollback Plan**: Keep git commit before starting for easy rollback

---

## Validation Checklist
*GATE: Must pass before declaring feature complete*

- [ ] No SQLite code in codebase search
- [ ] sql.js dependency removed from package.json
- [ ] TypeScript compilation succeeds
- [ ] PostgreSQL connection works
- [ ] PostgreSQL CRUD operations work
- [ ] Database UI does not show SQLite option
- [ ] README has no SQLite setup instructions
- [ ] README tech stack lists PostgreSQL only
- [ ] API returns error for SQLite config
- [ ] Error message is user-friendly with migration guidance

---

**Total Tasks**: 10 (1 dependency + 1 deletion + 6 cleanup + 1 docs + 1 validation)
**Estimated Time**: 2-3 hours for implementation + 5 minutes for validation
**Parallel Opportunities**: 6 tasks (T003-T008) can run simultaneously
