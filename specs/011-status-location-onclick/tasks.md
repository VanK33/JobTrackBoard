# Tasks: Change Status and Location Filters from Toggle to Hover

**Input**: Design documents from `/specs/011-status-location-onclick/`
**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md

## Execution Flow (main)
```
1. Loaded plan.md: TypeScript 5.9.2 + React 18.3.1, single file modification
2. Loaded data-model.md: State refactoring (two booleans → single enum)
3. Loaded quickstart.md: 9 manual test scenarios documented
4. No contracts/: Pure frontend UI change (no API endpoints)
5. Generated UI refactoring tasks (not TDD - manual visual testing)
6. Applied sequential ordering: State → Handlers → Validation
7. Numbered tasks: T001-T008 (8 total tasks)
8. Validation: All requirements covered by tasks
9. SUCCESS: Tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different code sections, no dependencies)
- Include exact file paths in task descriptions
- **Note**: This is a UI refactoring with manual testing (no automated tests)

## Path Conventions
- **Target file**: `platform/core/src/frontend/pages/JobDashboard.tsx`
- **Validation**: Manual testing via browser at http://localhost:5173
- **Dev server**: Must be running (`npm run dev`)

---

## Phase 3.1: State Refactoring

### T001: Add New State Variable and Type Definition
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Location**: Near line 126-127 (where existing `showStatusFilter` and `showLocationFilter` are defined)
**Action**: Add new state alongside existing states (don't delete old ones yet)

```typescript
// Add type definition (near top of component or file)
type OpenFilterType = 'status' | 'location' | null

// Add new state variable (keep existing showStatusFilter and showLocationFilter for now)
const [openFilter, setOpenFilter] = useState<OpenFilterType>(null)
```

**Expected Result**: New state variable exists, TypeScript compiles without errors
**Verification**:
```bash
npm run type-check  # Should pass
# Dev server should hot-reload without errors
```
**Dependencies**: None (first task)
**Status**: ✅ Complete

---

## Phase 3.2: Update Status Filter

### T002 [P]: Update Status Filter Conditional Rendering
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Location**: Status filter panel rendering (search for `{showStatusFilter &&`)
**Action**: Replace boolean conditional with enum check

```typescript
// Before:
{showStatusFilter && (
  <div>...Status panel content...</div>
)}

// After:
{openFilter === 'status' && (
  <div>...Status panel content...</div>
)}
```

**Expected Result**: Status panel rendering controlled by new state
**Verification**: Visual inspection - Status filter should not be visible initially
**Dependencies**: T001 complete
**Status**: ✅ Complete

### T003 [P]: Add Hover Handlers to Status Filter
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Location**: Status filter button (line ~1830, search for `onClick={() => setShowStatusFilter`)
**Action**: Create handler functions and add event listeners

```typescript
// Add handler functions (near other handlers in component)
const handleOpenStatus = () => setOpenFilter('status')
const handleCloseFilter = () => setOpenFilter(null)

// Update button (keep existing onClick for now as fallback)
<button
  onMouseEnter={handleOpenStatus}
  onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}  // Toggle for touch devices
  style={{...existing styles...}}
>
  Status ▼
</button>
```

**Expected Result**: Status filter opens on hover, toggles on click
**Verification**:
- Hover over Status button → panel appears
- Click Status button → panel toggles
**Dependencies**: T001, T002 complete
**Status**: ✅ Complete

### T004 [P]: Wrap Status Filter in Compound Hover Region
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Location**: Status filter section (wrap button + panel)
**Action**: Add container div with `onMouseLeave` handler

```typescript
// Wrap existing Status filter code
<div
  style={{ position: 'relative' }}  // Positioning context
  onMouseLeave={handleCloseFilter}  // Close when leaving button+panel region
>
  <button onMouseEnter={handleOpenStatus} onClick={...}>
    Status ▼
  </button>
  {openFilter === 'status' && (
    <div style={{ position: 'absolute', ...existing panel styles }}>
      ...Status panel content...
    </div>
  )}
</div>
```

**Expected Result**: Panel stays open when moving from button to panel, closes when leaving region
**Verification**:
- Hover Status button → panel opens
- Move mouse into panel → panel stays open
- Move mouse away from region → panel closes
**Dependencies**: T001, T002, T003 complete
**Status**: ✅ Complete

---

## Phase 3.3: Update Location Filter

### T005 [P]: Update Location Filter Conditional Rendering
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Location**: Location filter panel rendering (search for `{showLocationFilter &&`)
**Action**: Replace boolean conditional with enum check

```typescript
// Before:
{showLocationFilter && (
  <div>...Location panel content...</div>
)}

// After:
{openFilter === 'location' && (
  <div>...Location panel content...</div>
)}
```

**Expected Result**: Location panel rendering controlled by new state
**Verification**: Visual inspection - Location filter should not be visible initially
**Dependencies**: T001 complete
**Status**: ✅ Complete

### T006 [P]: Add Hover Handlers to Location Filter
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Location**: Location filter button (line ~1898, search for `onClick={() => setShowLocationFilter`)
**Action**: Create handler function and add event listeners

```typescript
// Add handler function (near other handlers in component)
const handleOpenLocation = () => setOpenFilter('location')
// Note: handleCloseFilter already created in T003

// Update button (keep existing onClick for now as fallback)
<button
  onMouseEnter={handleOpenLocation}
  onClick={() => setOpenFilter(openFilter === 'location' ? null : 'location')}  // Toggle for touch devices
  style={{...existing styles...}}
>
  Location ▼
</button>
```

**Expected Result**: Location filter opens on hover, toggles on click
**Verification**:
- Hover over Location button → panel appears
- Click Location button → panel toggles
**Dependencies**: T001, T005 complete
**Status**: ✅ Complete

### T007 [P]: Wrap Location Filter in Compound Hover Region
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Location**: Location filter section (wrap button + panel)
**Action**: Add container div with `onMouseLeave` handler

```typescript
// Wrap existing Location filter code
<div
  style={{ position: 'relative' }}  // Positioning context
  onMouseLeave={handleCloseFilter}  // Close when leaving button+panel region
>
  <button onMouseEnter={handleOpenLocation} onClick={...}>
    Location ▼
  </button>
  {openFilter === 'location' && (
    <div style={{ position: 'absolute', ...existing panel styles }}>
      ...Location panel content...
    </div>
  )}
</div>
```

**Expected Result**: Panel stays open when moving from button to panel, closes when leaving region
**Verification**:
- Hover Location button → panel opens
- Move mouse into panel → panel stays open
- Move mouse away from region → panel closes
**Dependencies**: T001, T005, T006 complete
**Status**: ✅ Complete

---

## Phase 3.4: Cleanup and Validation

### T008: Remove Old State Variables
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Location**: State declarations (line ~126-127)
**Action**: Delete old boolean state variables

```typescript
// DELETE these lines:
const [showStatusFilter, setShowStatusFilter] = useState(false)
const [showLocationFilter, setShowLocationFilter] = useState(false)
```

**Expected Result**: Only `openFilter` state exists, TypeScript compiles without errors
**Verification**:
```bash
npm run type-check  # Should pass
# Search for "showStatusFilter" and "showLocationFilter" - should find 0 results
```
**Dependencies**: T002, T003, T004, T005, T006, T007 complete (all usages replaced)
**Status**: ✅ Complete

---

## Phase 3.5: Manual Testing

### T009: Execute Manual Test Scenarios
**File**: N/A (manual testing task)
**Action**: Run all 9 test scenarios from `quickstart.md`

**Test Checklist**:
1. ✅ Scenario 1: Hover opens filter panel immediately
2. ✅ Scenario 2: Panel stays open during checkbox interaction (sticky selection)
3. ✅ Scenario 3: Panel closes when mouse leaves region
4. ✅ Scenario 4: Only one panel visible at a time (mutual exclusion)
5. ✅ Scenario 5: Rapid hover switching works smoothly
6. ✅ Scenario 6: Filter selections persist across open/close cycles
7. ✅ Scenario 7: Mobile/touch fallback (tap toggles panel)
8. ✅ Scenario 8: Visual feedback unchanged (active filter indicators)
9. ✅ Scenario 9: Edge case handling (abnormal mouse paths)

**Regression Checklist**:
- ✅ Multi-select still works (multiple statuses/locations selectable)
- ✅ Job list updates in real-time as filters change
- ✅ Clear filters button still works
- ✅ Filter combinations work (Status + Location together)
- ✅ Panel positioning unchanged
- ✅ No console errors
- ✅ Performance: Hover response <50ms, smooth transitions

**Expected Result**: All test scenarios pass, no regressions
**Verification**:
```bash
# Ensure dev server running
npm run dev
# Open http://localhost:5173 in browser
# Execute all test scenarios per quickstart.md
```
**Dependencies**: T001-T008 complete (all implementation done)
**Success Criteria**: All 9 scenarios pass + no regressions
**Status**: Pending

---

## Dependencies

**Sequential Chains**:
- T001 → T002, T003, T005, T006 (new state must exist before use)
- T002, T003 → T004 (Status conditionals and handlers before wrapping)
- T005, T006 → T007 (Location conditionals and handlers before wrapping)
- T002, T003, T004, T005, T006, T007 → T008 (all usages replaced before deleting old state)
- T001-T008 → T009 (all implementation done before testing)

**Parallel Groups**:
- Group A [P]: T002, T005 (independent conditional rendering updates)
- Group B [P]: T003, T006 (independent handler additions - different code sections)
- Group C [P]: T004, T007 (independent container wrapping - different code sections)

**Critical Path**: T001 → [T002, T005] → [T003, T006] → [T004, T007] → T008 → T009

---

## Parallel Execution Examples

### Execute Conditional Updates Together (After T001):
```bash
# Terminal 1
Task: "Update Status filter conditional rendering to use openFilter === 'status'"

# Terminal 2
Task: "Update Location filter conditional rendering to use openFilter === 'location'"
```

### Execute Handler Additions Together (After T002, T005):
```bash
# Terminal 1
Task: "Add hover handlers (handleOpenStatus) and onMouseEnter/onClick to Status filter button"

# Terminal 2
Task: "Add hover handlers (handleOpenLocation) and onMouseEnter/onClick to Location filter button"
```

### Execute Container Wrapping Together (After T003, T006):
```bash
# Terminal 1
Task: "Wrap Status filter (button + panel) in compound hover region div with onMouseLeave"

# Terminal 2
Task: "Wrap Location filter (button + panel) in compound hover region div with onMouseLeave"
```

---

## Validation Checklist

*GATE: Verify before marking complete*

- [x] All 8 functional requirements have corresponding implementation tasks
- [x] Tasks ordered by dependencies (state → handlers → validation)
- [x] Parallel tasks truly independent (different code sections)
- [x] Sequential dependencies documented (T001 → T002-T007 → T008 → T009)
- [x] Each task specifies exact file path and line numbers
- [x] Validation task included (T009 with quickstart.md reference)
- [x] No contracts needed (pure frontend change)

---

## Notes

- **Not TDD**: This is a UI refactoring. Manual visual testing replaces automated tests.
- **After Each Task**: Verify in browser at http://localhost:5173 (hot reload should work)
- **Commit Strategy**: Commit after T008 (before manual testing) for atomic change
- **Dev Server**: Keep `npm run dev` running throughout implementation
- **Hot Reload**: Changes should appear immediately (no manual refresh needed)

---

**Tasks Status**: 9 tasks generated, ready for execution. Run `/implement` or execute manually.
