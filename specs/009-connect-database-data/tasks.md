# Tasks: Remove Data Migration Section

**Input**: Design documents from `/specs/009-connect-database-data/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md
**Branch**: `009-connect-database-data`

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript 5.0+, React 18, Frontend-only changes
2. Load design documents:
   → research.md: Lines to remove (3, 33, 287-318, 480-554)
   → data-model.md: State changes (migrationStatus removal)
   → contracts/ui-component.contract.md: Component modifications
   → quickstart.md: 4 test scenarios + regression checklist
3. Generate tasks by category:
   → Preparation: Code review
   → Core: 4 removal tasks (import, state, function, JSX)
   → Verification: Compilation check, HMR verification
   → Testing: Manual test execution per quickstart.md
4. Apply task rules:
   → All modifications to same file = sequential
   → Top-to-bottom order (imports → state → functions → JSX)
   → No parallel tasks (single file)
5. Number tasks sequentially (T001-T008)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] Description`
- No [P] markers - all tasks are sequential (same file)
- Include exact file paths and line numbers

## Path Conventions
- **Web app structure**: `platform/core/src/frontend/`
- **Target file**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`

---

## Phase 3.1: Preparation

- [x] **T001** Review design documents and understand removal scope
  - Read `specs/009-connect-database-data/research.md` (lines to remove)
  - Read `specs/009-connect-database-data/contracts/ui-component.contract.md` (component changes)
  - Verify current implementation matches documented line numbers
  - Confirm "Database Ready" section location (lines 464-478)
  - Reference: research.md section "Current Implementation Analysis"

---

## Phase 3.2: Core Implementation (Sequential)

All tasks modify `platform/core/src/frontend/pages/DatabaseSettings.tsx` and must be executed in order.

- [x] **T002** Remove DataMigrationService import
  - File: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Action: Delete line 3: `import { DataMigrationService } from '../utils/data-migration'`
  - Verify: No TypeScript errors after removal
  - Reference: research.md "What to Remove" section item 2

- [x] **T003** Remove migrationStatus state declaration
  - File: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Action: Delete line 33 and the entire state object definition:
    ```typescript
    const [migrationStatus, setMigrationStatus] = useState<{
      isRunning: boolean
      completed: boolean
      found: number
      imported: number
      errors: string[]
      summary: string
    }>({
      isRunning: false,
      completed: false,
      found: 0,
      imported: 0,
      errors: [],
      summary: ''
    })
    ```
  - Verify: No unused variable warnings
  - Reference: data-model.md "Removed State" section

- [x] **T004** Remove runDataMigration handler function
  - File: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Action: Delete lines 287-318 (entire `runDataMigration` async function)
  - Includes: Function declaration, DataMigrationService.migrateAll() call, state updates, error handling
  - Verify: No unused function warnings
  - Reference: data-model.md "Removed Functions" section

- [x] **T005** Remove Data Migration JSX block
  - File: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Action: Delete lines 480-554 (entire nested Data Migration section)
  - Delete from: `{/* Data Migration Section */}`
  - Delete to: End of nested `</div>` before outer container closing
  - Preserve: Lines 473-478 ("Database Ready" header and description)
  - Verify: Only "Database Ready" message remains in blue container
  - Reference: contracts/ui-component.contract.md "Modified Section: Database Ready Display"

- [x] **T006** Optional: Adjust description marginBottom
  - File: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Action: Update description text style (around line 476 after previous deletions)
  - Change: `marginBottom: '12px'` → remove marginBottom (no longer needed)
  - Reason: No content below description anymore
  - Optional: Can be skipped if visual spacing looks good
  - Reference: contracts/ui-component.contract.md "Styling Contract"

---

## Phase 3.3: Verification

- [x] **T007** Verify TypeScript compilation and HMR
  - Check: No TypeScript compilation errors in terminal
  - Check: Vite HMR update succeeds without errors
  - Check: No console warnings about unused imports or variables
  - Action: Monitor dev server output during T002-T006
  - Expected: Clean compilation after each removal
  - Reference: quickstart.md "Scenario 3: No Console Errors"

---

## Phase 3.4: Manual Testing

Execute all scenarios from `specs/009-connect-database-data/quickstart.md`

**Note**: Tasks T008-T012 require manual browser testing. The implementation is complete and ready for validation.

- [ ] **T008** Execute Scenario 1: Database Ready Display (Fresh Connection)
  - Setup: Clear localStorage, navigate to Database Settings
  - Steps: Enter connection string → Click "Connect Database"
  - Assert: Blue "Database Ready" section appears
  - Assert: NO nested white "Data Migration" section
  - Assert: NO "Migrate Data from Browser" button
  - Document: Result in quickstart.md (PASS/FAIL)
  - Reference: quickstart.md lines 13-38

- [ ] **T009** Execute Scenario 2: Database Ready Display (Returning User)
  - Setup: Database already connected from Scenario 1
  - Steps: Refresh page → Navigate to Database Settings
  - Assert: "Database Ready" section still visible
  - Assert: No migration UI elements
  - Document: Result in quickstart.md (PASS/FAIL)
  - Reference: quickstart.md lines 42-60

- [ ] **T010** Execute Scenario 3: No Console Errors
  - Setup: Open DevTools Console, clear console
  - Steps: Navigate to Database Settings → Connect database
  - Assert: No JavaScript errors
  - Assert: No React warnings
  - Assert: No warnings about unused imports
  - Document: Console output in quickstart.md
  - Reference: quickstart.md lines 64-86

- [ ] **T011** Execute Scenario 4: Database Ready Styling
  - Setup: Database connected successfully
  - Steps: Inspect "Database Ready" section in browser
  - Assert: Light blue background (#f0f9ff)
  - Assert: Blue border (#e0f2fe)
  - Assert: Checkmark emoji "✅" visible
  - Assert: Title in darker blue (#0369a1)
  - Document: Result in quickstart.md (PASS/FAIL)
  - Reference: quickstart.md lines 90-110

- [ ] **T012** Execute Regression Testing Checklist
  - Test: Database connection flow still works
  - Test: Advanced options toggle functions
  - Test: Connection string history works
  - Test: Tutorial modal opens/closes
  - Test: Save configuration works
  - Document: All regression test results
  - Reference: quickstart.md "Regression Testing" section lines 114-136

---

## Dependencies

**Sequential Dependencies**:
- T001 (review) must complete before T002-T006
- T002-T006 must execute in order (top-to-bottom file edits)
- T007 (verification) depends on T002-T006 completion
- T008-T012 (testing) require T002-T006 complete

**Critical Path**:
```
T001 (Review)
  ↓
T002 (Remove import)
  ↓
T003 (Remove state)
  ↓
T004 (Remove function)
  ↓
T005 (Remove JSX)
  ↓
T006 (Optional styling)
  ↓
T007 (Verify compilation)
  ↓
T008-T012 (Manual testing in parallel - different test scenarios)
```

**No Parallel Tasks**: All core modifications (T002-T006) edit the same file sequentially.

---

## Notes

- **Single file modification**: All tasks modify `DatabaseSettings.tsx`
- **No automated tests**: Manual testing only per project pattern
- **Inline styles**: All styling via inline `style` prop (existing pattern)
- **No dependencies**: Zero new npm packages
- **Backward compatible**: No prop changes, no API changes
- **HMR enabled**: Dev server supports hot module replacement

---

## Validation Checklist
*GATE: Verify before marking feature complete*

- [ ] All code removals complete (import, state, function, JSX)
- [ ] TypeScript compilation passes
- [ ] No console errors or warnings
- [ ] "Database Ready" message preserved and displays correctly
- [ ] Data Migration section completely removed (no button, no status)
- [ ] All quickstart.md scenarios pass (T008-T012)
- [ ] Regression tests pass (existing features work)
- [ ] Visual styling matches contract (blue container, checkmark)

---

## Success Criteria

**Implementation Complete When**:
1. ✅ All removal tasks (T002-T006) executed successfully
2. ✅ TypeScript compilation passes without errors
3. ✅ Dev server runs without warnings (T007)
4. ✅ All manual test scenarios pass (T008-T012)
5. ✅ Regression testing shows no broken features

**Ready for Merge When**:
- All validation checklist items checked
- Code reviewed (if required by project workflow)
- Tested in at least 2 browsers (Chrome + Firefox/Safari)

---

## Rollback Plan

If issues arise during implementation:

```bash
# Undo last commit
git reset --soft HEAD~1

# Or revert specific file
git checkout HEAD~1 platform/core/src/frontend/pages/DatabaseSettings.tsx

# Or restore from specific line numbers
git show HEAD~1:platform/core/src/frontend/pages/DatabaseSettings.tsx > temp.tsx
# Then manually copy needed sections
```

**Estimated rollback time**: < 5 minutes
**Risk level**: Low (UI-only changes, no data impact)
