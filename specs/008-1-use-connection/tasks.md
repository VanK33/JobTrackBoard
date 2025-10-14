# Tasks: Database Settings UI Improvements

**Input**: Design documents from `/specs/008-1-use-connection/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md
**Branch**: `008-1-use-connection`

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript 5.0+, React 18, frontend-only changes
2. Load design documents:
   → data-model.md: UI state changes (3 state variables)
   → contracts/ui-components.contract.md: TutorialModal + DatabaseSettings interfaces
   → quickstart.md: 11 manual test scenarios
3. Generate tasks by category:
   → Preparation: New component creation, state additions
   → Core: UI modifications (page title, connection string default, advanced toggle)
   → Integration: Tutorial modal integration, help text update
   → Testing: Manual test execution per quickstart.md
4. Apply task rules:
   → Component files different = parallel [P]
   → Same component file = sequential
   → No automated tests (manual only per project pattern)
5. Number tasks sequentially (T001-T014)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `platform/core/src/frontend/`
- **Pages**: `platform/core/src/frontend/pages/`
- **Components**: `platform/core/src/frontend/components/`

---

## Phase 3.1: Preparation [P]

These tasks can be executed in parallel as they operate on different files with no dependencies.

- [ ] **T001** [P] Create TutorialModal component skeleton in `platform/core/src/frontend/components/TutorialModal.tsx`
  - Create new file with React functional component
  - Define `TutorialModalProps` interface (isOpen, onClose)
  - Return `null` when `isOpen === false`
  - Implement basic modal structure with overlay and content box
  - Add close button, title "Tutorial", empty scrollable content area
  - Include ARIA attributes: `role="dialog"`, `aria-labelledby`, `aria-modal="true"`
  - Add Escape key handler to call onClose
  - Use inline styles matching existing codebase pattern
  - Reference: `contracts/ui-components.contract.md` lines 10-88

- [ ] **T002** [P] Add new state variables to DatabaseSettings component in `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Add `showTutorialModal` state variable (default: `false`)
  - Add `showAdvancedFields` state variable (default: `false`)
  - Add `handleOpenTutorial` handler function
  - Add `handleCloseTutorial` handler function
  - Add `handleToggleAdvancedFields` handler function
  - Import TutorialModal component at top of file
  - Reference: `data-model.md` lines 15-30, `contracts/ui-components.contract.md` lines 139-165

---

## Phase 3.2: Core Implementation

These tasks must be executed sequentially as they all modify the same file (`DatabaseSettings.tsx`).

- [ ] **T003** Change `useConnectionString` default value to `true` in `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Modify line 29: Change `useState(false)` to `useState(true)`
  - Verify connection string input becomes visible by default
  - Ensure existing logic (lines 148-166) remains functional
  - Reference: `data-model.md` lines 15-21, FR-001 in spec.md

- [ ] **T004** Add dynamic page title logic in `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Create computed value using `getStoredDatabaseConfig()`
  - Implement ternary: `const pageTitle = getStoredDatabaseConfig() ? "Database Settings" : "Database Initialization"`
  - Update page title JSX to use computed value: `<h1>{pageTitle}</h1>`
  - Locate existing page title element (search for `<h1>` or similar heading)
  - Reference: `data-model.md` lines 38-47, FR-002, FR-003 in spec.md

- [ ] **T005** Implement Advanced Options toggle for individual fields in `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Find the section rendering individual fields (host, port, username, password, database)
  - Wrap individual fields section in conditional: `{showAdvancedFields && ( ... )}`
  - Add "Show/Hide Advanced Options" button ABOVE the conditional section
  - Button text should change based on `showAdvancedFields` state
  - Button onClick calls `handleToggleAdvancedFields`
  - Ensure connection string input remains visible when advanced fields hidden
  - Reference: `data-model.md` lines 61-77, FR-009, FR-010 in spec.md

- [ ] **T006** Add Tutorial button to Supabase provider section in `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Locate the Supabase provider recommendation section (search for "supabase" or providers array usage around lines 66-103)
  - Find the row containing the documentation link
  - Add Tutorial button on the RIGHT SIDE of the same row (flexbox or grid layout)
  - Button text: "Tutorial"
  - Button onClick calls `handleOpenTutorial`
  - Ensure button and docs link are horizontally aligned
  - Reference: `contracts/ui-components.contract.md` lines 176-184, FR-004 in spec.md

- [ ] **T007** Wire up TutorialModal component in `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Add TutorialModal JSX at end of component return statement (before closing tag)
  - Pass props: `isOpen={showTutorialModal}` and `onClose={handleCloseTutorial}`
  - Verify modal opens when Tutorial button clicked
  - Verify modal closes when close button clicked
  - Verify modal closes on Escape key press
  - Reference: `contracts/ui-components.contract.md` lines 247-255, FR-005, FR-006 in spec.md

- [ ] **T008** Update help text/notes message in `platform/core/src/frontend/pages/DatabaseSettings.tsx`
  - Locate the notes or help text section (search for "Note:" or similar informational text)
  - Replace existing database compatibility message with: "This project is designed for Supabase by default. Should work with other PostgreSQL"
  - Ensure text is prominently displayed (not hidden or low contrast)
  - Reference: FR-007 in spec.md, clarification session answer

---

## Phase 3.3: Testing

These tasks are manual test execution scenarios from quickstart.md. Execute sequentially to validate all requirements.

- [ ] **T009** Execute Scenario 1-2: Page title validation in `specs/008-1-use-connection/quickstart.md`
  - Clear localStorage and verify "Database Initialization" title displays
  - Save database config and verify "Database Settings" title displays
  - Document pass/fail in quickstart.md
  - Reference: `quickstart.md` lines 24-67

- [ ] **T010** Execute Scenario 3: Connection string visibility validation in `specs/008-1-use-connection/quickstart.md`
  - Verify connection string input visible by default
  - Verify individual fields NOT visible by default
  - Verify no toggle required for connection string access
  - Document pass/fail in quickstart.md
  - Reference: `quickstart.md` lines 71-94

- [ ] **T011** Execute Scenario 4-6: Tutorial modal validation in `specs/008-1-use-connection/quickstart.md`
  - Verify Tutorial button appears in Supabase section on right side
  - Verify modal opens with title, close button, empty content area
  - Test all three close mechanisms: button, Escape key, backdrop click
  - Verify modal can be re-opened unlimited times
  - Document pass/fail in quickstart.md
  - Reference: `quickstart.md` lines 98-151

- [ ] **T012** Execute Scenario 7: Help text validation in `specs/008-1-use-connection/quickstart.md`
  - Verify exact text: "This project is designed for Supabase by default. Should work with other PostgreSQL"
  - Document pass/fail in quickstart.md
  - Reference: `quickstart.md` lines 155-174

- [ ] **T013** Execute Scenario 8-9: Advanced toggle validation in `specs/008-1-use-connection/quickstart.md`
  - Verify "Show Advanced Options" button appears
  - Click to reveal individual fields (host, port, database, username, password)
  - Verify button text changes to "Hide Advanced Options"
  - Click again to hide fields
  - Document pass/fail in quickstart.md
  - Reference: `quickstart.md` lines 178-228

- [ ] **T014** Execute Scenario 10-11: Regression testing in `specs/008-1-use-connection/quickstart.md`
  - Test connection string functionality (auto-detection, save, load)
  - Test individual fields functionality via Advanced toggle
  - Verify connection string history, SSL checkbox, provider cards, connection test, navigation
  - Test keyboard navigation and modal accessibility
  - Test on 2+ browsers (Chrome, Firefox, Safari, or Edge)
  - Verify performance: modal <300ms open/close, title updates instantly
  - Document all pass/fail results in quickstart.md
  - Reference: `quickstart.md` lines 232-343

---

## Dependencies

**Sequential Dependencies**:
- T001, T002 must complete before T007 (TutorialModal must exist before integration)
- T003-T008 modify same file (DatabaseSettings.tsx) → must be sequential
- T009-T014 testing requires T001-T008 complete

**Parallel Opportunities**:
- T001 and T002 can run in parallel (different files, different concerns)
- T009-T014 individual scenarios could be tested in parallel by different testers

**Critical Path**:
```
T001 (Create TutorialModal) [P]
T002 (Add state to DatabaseSettings) [P]
  ↓
T003 (Connection string default)
  ↓
T004 (Page title logic)
  ↓
T005 (Advanced toggle)
  ↓
T006 (Tutorial button)
  ↓
T007 (Modal integration)
  ↓
T008 (Help text)
  ↓
T009-T014 (Manual testing)
```

---

## Parallel Execution Example

Launch preparation tasks in parallel:

```bash
# Terminal 1: Create TutorialModal component
Task: "Create TutorialModal component skeleton in platform/core/src/frontend/components/TutorialModal.tsx per T001"

# Terminal 2 (or parallel agent): Add state to DatabaseSettings
Task: "Add new state variables to DatabaseSettings component per T002"
```

After both complete, proceed with T003-T008 sequentially.

---

## Notes

- **No automated tests**: Per project pattern, only manual testing via quickstart.md
- **Inline styles**: All styling must use inline `style` prop (no CSS files)
- **No dependencies**: Zero new npm packages to install
- **Backward compatible**: All existing functionality must be preserved
- **TypeScript strict**: All code must pass TypeScript compilation
- **Hot reload**: Dev server (npm run dev) supports HMR for rapid iteration

---

## Validation Checklist
*GATE: Verify before marking phase complete*

- [x] All UI state changes from data-model.md have corresponding tasks
- [x] TutorialModal component contract fully implemented (T001)
- [x] DatabaseSettings modifications cover all FR-001 through FR-010
- [x] All 11 quickstart scenarios have testing tasks (T009-T014)
- [x] Parallel tasks (T001, T002) operate on different files
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Testing phase covers regression, accessibility, browser compatibility

---

## Success Criteria

**Implementation Complete When**:
1. ✅ All tasks T001-T014 marked complete
2. ✅ TypeScript compilation passes (`npm run type-check`)
3. ✅ Dev server runs without errors (`npm run dev`)
4. ✅ All quickstart.md scenarios marked PASS
5. ✅ No regressions in existing features (connection test, save, history)

**Ready for Production When**:
- Manual testing complete (T009-T014)
- Code reviewed
- Merged to main branch
