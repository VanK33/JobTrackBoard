# Tasks: Database Connection String Security and Save Behavior

**Input**: Design documents from `/specs/014-save-configuration-connection/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Tech stack: TypeScript 5.0+, React 18, Vite 5
   → ✅ Structure: Web app (platform/core/src/frontend)
2. Load optional design documents:
   → ✅ data-model.md: NamedConnection entity
   → ✅ contracts/: localStorage operations (no HTTP APIs)
   → ✅ research.md: 5 technical decisions
   → ✅ quickstart.md: 15 test scenarios
3. Generate tasks by category:
   → Setup: Type definitions
   → Tests: Manual testing via quickstart.md
   → Core: Utils, UI components, state management
   → Integration: Migration logic, validation
   → Polish: Error handling, cleanup
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → No TDD (manual testing only per quickstart.md)
5. Number tasks sequentially (T001-T013)
6. Dependencies: Types → Utils → UI → Validation → Testing
7. Parallel execution: Utils functions, some UI components
8. Validate task completeness:
   → ✅ All entities have types
   → ✅ All localStorage ops have utilities
   → ✅ All FR requirements have implementation tasks
   → ✅ All test scenarios in quickstart.md
9. Return: SUCCESS (13 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files/sections, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Project**: Monorepo at `platform/core/`
- **Frontend**: `platform/core/src/frontend/`
- **Types**: `platform/core/src/frontend/types/index.ts`
- **Utils**: `platform/core/src/frontend/utils/`
- **Pages**: `platform/core/src/frontend/pages/`
- **Components**: `platform/core/src/frontend/components/` (if needed)

---

## Phase 3.1: Setup & Type Definitions

- [x] **T001** [P] Add `NamedConnection` interface to `platform/core/src/frontend/types.ts`
  - Define: `interface NamedConnection { name: string; connectionString: string; createdAt?: string; }`
  - Export for use in components and utils
  - **File**: `platform/core/src/frontend/types/index.ts`
  - **Dependencies**: None
  - **Validation**: TypeScript compiles without errors

---

## Phase 3.2: Utility Functions (localStorage operations)

- [x] **T002** [P] Create `maskConnectionString` utility in `platform/core/src/frontend/utils/connectionUtils.ts`
  - Implement regex-based masking: `postgresql://user:pass@host` → `postgresql://***:***@host`
  - Handle multiple protocols: postgresql, postgres, mysql, mongodb, mongodb+srv
  - Export function: `export function maskConnectionString(connStr: string): string`
  - **File**: `platform/core/src/frontend/utils/connectionUtils.ts` (new file)
  - **Dependencies**: None
  - **Validation**: Masking preserves host/port/database, hides credentials

- [x] **T003** [P] Create `loadNamedConnections` utility in `platform/core/src/frontend/utils/connectionUtils.ts`
  - Load from localStorage key `'namedDatabaseConnections'`
  - Auto-detect legacy format (`'databaseConnectionHistory'`) and call migration function
  - Parse JSON to `NamedConnection[]`, return empty array on error
  - Export function: `export function loadNamedConnections(): NamedConnection[]`
  - **File**: `platform/core/src/frontend/utils/connectionUtils.ts`
  - **Dependencies**: T001 (NamedConnection type)
  - **Validation**: Returns valid array, handles missing key

- [x] **T004** [P] Create `migrateLegacyConnections` utility in `platform/core/src/frontend/utils/connectionUtils.ts`
  - Input: `string[]` (legacy format)
  - Map to `NamedConnection[]` with names: "old connection string 1", "old connection string 2", etc.
  - Write to `'namedDatabaseConnections'`, delete `'databaseConnectionHistory'`
  - Export function: `export function migrateLegacyConnections(legacyConnections: string[]): NamedConnection[]`
  - **File**: `platform/core/src/frontend/utils/connectionUtils.ts`
  - **Dependencies**: T001 (NamedConnection type)
  - **Validation**: Legacy data preserved with auto-generated names

- [x] **T005** [P] Create `saveNamedConnection` utility in `platform/core/src/frontend/utils/connectionUtils.ts`
  - Input: `name: string, connectionString: string, existing: NamedConnection[]`
  - Validate uniqueness (throw error if duplicate name)
  - Create new `NamedConnection` with `createdAt` timestamp
  - Append to array, write to localStorage
  - Export function: `export function saveNamedConnection(...): NamedConnection[]`
  - **File**: `platform/core/src/frontend/utils/connectionUtils.ts`
  - **Dependencies**: T001 (NamedConnection type)
  - **Validation**: Rejects duplicates, saves correctly

- [x] **T006** [P] Create `deleteNamedConnection` utility in `platform/core/src/frontend/utils/connectionUtils.ts`
  - Input: `name: string, existing: NamedConnection[]`
  - Filter out connection with matching name
  - Write updated array to localStorage
  - Export function: `export function deleteNamedConnection(...): NamedConnection[]`
  - **File**: `platform/core/src/frontend/utils/connectionUtils.ts`
  - **Dependencies**: T001 (NamedConnection type)
  - **Validation**: Removes connection, updates localStorage

- [x] **T007** [P] Create `renameNamedConnection` utility in `platform/core/src/frontend/utils/connectionUtils.ts`
  - Input: `oldName: string, newName: string, existing: NamedConnection[]`
  - Validate new name uniqueness (excluding connection being renamed)
  - Map over array, update name for matching connection
  - Write to localStorage
  - Export function: `export function renameNamedConnection(...): NamedConnection[]`
  - **File**: `platform/core/src/frontend/utils/connectionUtils.ts`
  - **Dependencies**: T001 (NamedConnection type)
  - **Validation**: Renames correctly, validates uniqueness

---

## Phase 3.3: UI Implementation (DatabaseSettings.tsx modifications)

⚠️ **IMPORTANT**: Tasks T008-T012 modify the same file (`DatabaseSettings.tsx`), so they CANNOT be parallel. Complete in sequence.

- [x] **T008** Add connection name input field to DatabaseSettings UI
  - Add state: `const [connectionName, setConnectionName] = useState<string>('')`
  - Add input field above connection string field
  - Label: "Connection Name (optional)"
  - **File**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - **Lines**: Insert after line 33 (after existing state declarations)
  - **Dependencies**: T001 (types)
  - **Validation**: Input field visible, controlled by state

- [x] **T009** Remove auto-save behavior from `handleConfigChange`
  - **Current behavior** (lines 127-154): Saves to localStorage on every keystroke for connectionString
  - **New behavior**: Remove lines 141-148 (auto-save and history update)
  - Keep type detection logic, remove `setSavedConnectionString` and history updates
  - **File**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - **Lines**: Lines 127-154 (handleConfigChange function)
  - **Dependencies**: T008 (name input added)
  - **Validation**: Typing in connection string does NOT save to localStorage

- [x] **T010** Replace connection history dropdown with custom dropdown showing named connections
  - **Current** (lines 660-695): Native `<select>` with raw connection strings
  - **New**: Custom dropdown with:
    - Load connections on mount via `loadNamedConnections()` (T003)
    - Display `name` (or masked string via `maskConnectionString()` from T002)
    - Inline delete button/icon per connection
    - Inline rename button/icon per connection
  - Update state: `const [savedConnections, setSavedConnections] = useState<NamedConnection[]>([])`
  - Add `useEffect` to load connections on mount
  - **File**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - **Lines**: Replace lines 660-695 (connection history section)
  - **Dependencies**: T002 (masking), T003 (load), T008 (name state)
  - **Validation**: Dropdown shows names, not raw strings with passwords

- [x] **T011** Implement delete connection functionality
  - Add handler: `const handleDeleteConnection = (name: string) => { ... }`
  - Call `deleteNamedConnection()` (T006)
  - Update state: `setSavedConnections(updated)`
  - Wire delete button from T010 to this handler
  - **File**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - **Lines**: Add handler around line 175 (after existing handlers)
  - **Dependencies**: T006 (delete util), T010 (delete button)
  - **Validation**: Delete removes connection, updates UI and localStorage

- [x] **T012** Implement rename connection functionality
  - Add state: `const [editingConnection, setEditingConnection] = useState<NamedConnection | null>(null)`
  - Add state: `const [newName, setNewName] = useState<string>('')`
  - Add handler: `const handleRenameConnection = (oldName: string, newName: string) => { ... }`
  - Call `renameNamedConnection()` (T007), handle validation errors
  - Inline edit: Click rename icon → show input → Enter/blur to save
  - **File**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - **Lines**: Add state and handler around line 175
  - **Dependencies**: T007 (rename util), T010 (rename button)
  - **Validation**: Rename updates name, validates uniqueness, shows errors

---

## Phase 3.4: Validation & Error Handling

- [x] **T013** Add duplicate name validation to save handler
  - Modify `saveConfig` function (lines 156-174)
  - Before saving, validate name uniqueness via `saveNamedConnection()` (T005)
  - Add error state: `const [saveError, setSaveError] = useState<string>('')`
  - Display error message: "A connection with this name already exists. Please choose a different name."
  - Show error above "Save Configuration" button (red text)
  - **File**: `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - **Lines**: Modify saveConfig function (lines 156-174), add error display near line 870
  - **Dependencies**: T005 (save util with validation), T008 (name input)
  - **Validation**: Duplicate names rejected, error message shown

---

## Phase 3.5: Manual Testing (via quickstart.md)

- [ ] **T014** Execute all 15 test scenarios from quickstart.md
  - Run dev server: `npm run dev`
  - Open browser to Database Settings page
  - Execute scenarios 1-15 from `specs/014-save-configuration-connection/quickstart.md`
  - **Critical scenarios**:
    1. Auto-save prevention (FR-001, FR-002)
    2. Save named connection (FR-003, FR-004, FR-010)
    3. Display named connections (FR-005, FR-006)
    4. Save unnamed connection (FR-003, FR-005)
    5. Duplicate name rejection (FR-008, FR-011)
    6. Delete connection (FR-012)
    7. Rename connection (FR-014)
    8. Update connection string (FR-015)
    9. Legacy history migration (FR-013)
    10. Test connection without save (FR-009)
    11. Password masking in input (FR-007)
    12. Empty name handling (FR-003)
    13. Case-sensitive validation (FR-011)
    14. Multiple connection management (FR-008, FR-012)
    15. Dropdown selection (FR-006)
  - **File**: `specs/014-save-configuration-connection/quickstart.md`
  - **Dependencies**: T001-T013 (all implementation complete)
  - **Validation**: All 15 scenarios pass ✅

---

## Dependencies

**Sequential Dependencies**:
- T001 (types) blocks T002-T007 (utils need types)
- T002-T007 (utils) block T008-T012 (UI needs utils)
- T008 (name input) blocks T009-T013 (other UI changes need name state)
- T009 (remove auto-save) before T010 (dropdown) before T011-T012 (actions)
- T001-T013 block T014 (manual testing needs full implementation)

**Parallel Opportunities**:
- T002-T007 can run in parallel (different functions in same file, independent)
- T001 can run alone while planning other tasks

**Same-File Conflicts** (MUST be sequential):
- T008-T013 all modify `DatabaseSettings.tsx` → complete in order

---

## Parallel Execution Example

**Phase 3.2 (Utility Functions)** - Launch T002-T007 together:
```bash
# T002-T007 can run in parallel (different function implementations)
# If using multiple agents or parallel task execution:
Task: "Create maskConnectionString utility in utils/connectionUtils.ts"
Task: "Create loadNamedConnections utility in utils/connectionUtils.ts"
Task: "Create migrateLegacyConnections utility in utils/connectionUtils.ts"
Task: "Create saveNamedConnection utility in utils/connectionUtils.ts"
Task: "Create deleteNamedConnection utility in utils/connectionUtils.ts"
Task: "Create renameNamedConnection utility in utils/connectionUtils.ts"
```

**Phase 3.3-3.4 (UI)** - MUST be sequential (same file):
```bash
# T008-T013 modify DatabaseSettings.tsx → run one at a time
Task: T008 → T009 → T010 → T011 → T012 → T013
```

---

## Notes

- **[P] tasks**: T002-T007 (utility functions, independent implementations)
- **Sequential tasks**: T008-T013 (same file, cumulative changes)
- **No automated tests**: Manual testing only via quickstart.md (15 scenarios)
- **Commit strategy**: Commit after each task for incremental progress
- **TypeScript compilation**: Run `npm run type-check` after each task
- **Browser testing**: Refresh page after each UI task to verify changes

---

## Validation Checklist
*GATE: Checked before marking feature complete*

- [x] All entities have types (T001: NamedConnection)
- [x] All localStorage ops have utilities (T002-T007: mask, load, migrate, save, delete, rename)
- [x] All FR requirements have implementation tasks:
  - FR-001, FR-002: T009 (remove auto-save)
  - FR-003, FR-010: T008 (name input)
  - FR-004: T005 (save function)
  - FR-005: T002 (masking), T010 (dropdown display)
  - FR-006: T010 (dropdown selection)
  - FR-007: Already exists (input type="password")
  - FR-008: T013 (uniqueness validation)
  - FR-009: Already exists (test connection button)
  - FR-011: T013 (duplicate rejection)
  - FR-012: T011 (delete)
  - FR-013: T004 (migration)
  - FR-014: T012 (rename)
  - FR-015: T013 (save with same name updates)
- [x] All test scenarios in quickstart.md (T014: 15 scenarios)
- [x] Parallel tasks truly independent (T002-T007: different functions)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

---

## Task Execution Order

**Recommended sequence**:
1. **T001** (types) - foundation
2. **T002-T007** (utils) - can run in parallel or sequentially
3. **T008** (name input) - first UI change
4. **T009** (remove auto-save) - critical security fix
5. **T010** (dropdown) - major UI replacement
6. **T011** (delete) - action button
7. **T012** (rename) - action button
8. **T013** (validation) - error handling
9. **T014** (manual testing) - validation

**Total tasks**: 14 (T001-T014)
**Estimated effort**: ~4-6 hours (experienced developer)

---

**Tasks Complete**: ✅ Ready for /implement command or manual execution
