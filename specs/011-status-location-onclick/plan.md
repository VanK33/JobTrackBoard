
# Implementation Plan: Change Status and Location Filters from Toggle to Hover

**Branch**: `011-status-location-onclick` | **Date**: 2025-10-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-status-location-onclick/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Loaded: 8 functional requirements, 5 acceptance scenarios
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: web (React frontend)
   → All clarifications resolved via /clarify session
3. Fill the Constitution Check section
   → Constitution: Template only (not ratified)
   → Proceed with industry standards
4. Evaluate Constitution Check section
   → No violations: Pure UI interaction change
   → Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → Analysis of current onClick toggle implementation
   → Research hover event handling patterns
6. Execute Phase 1 → data-model.md, quickstart.md, CLAUDE.md
   → No API contracts needed (pure frontend)
   → Data model: React state management
7. Re-evaluate Constitution Check section
   → Post-design: PASS (no new complexity)
   → Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Task generation approach described
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Replace onClick toggle behavior with hover-based interaction for Status and Location filter dropdowns in JobDashboard. Users will hover over filter buttons to open panels, which remain open during checkbox interaction and close when mouse leaves the button+panel region. Only one filter panel visible at a time, with automatic switching when hovering between filters.

## Technical Context
**Language/Version**: TypeScript 5.9.2, React 18.3.1
**Primary Dependencies**: React (useState for state management), inline CSS-in-JS for styling
**Storage**: Browser state only (no persistence needed for this UI change)
**Testing**: Manual testing via browser (no unit tests required for pure UI interaction)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: web (monorepo: platform/core/src/frontend)
**Performance Goals**: Instant hover response (<50ms), smooth panel transitions
**Constraints**: Maintain existing filter functionality (multi-select, state persistence during session), no changes to filter logic or data structures
**Scale/Scope**: Single file modification (JobDashboard.tsx), ~100 lines of code change

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Status**: Template constitution found (not ratified)

Since the constitution is still a template placeholder, we proceed with industry-standard UI/UX practices:

### UI/UX Quality Gates
- ✅ **Accessibility**: Hover-based interactions supplement (don't replace) keyboard/click access
- ✅ **Usability**: One panel at a time prevents visual clutter and overlap issues
- ✅ **Consistency**: Follows common dropdown/tooltip hover patterns
- ✅ **Performance**: No network calls, pure client-side state transitions

### Code Quality Gates
- ✅ **Minimal Change**: Scoped to single component (JobDashboard.tsx)
- ✅ **No Breaking Changes**: Preserves existing filter functionality
- ✅ **Backward Compatibility**: Filter selections and application logic unchanged
- ✅ **Testability**: Visual behavior testable via manual QA

**Initial Assessment**: PASS (pure UI refinement, no architectural changes)

## Project Structure

### Documentation (this feature)
```
specs/011-status-location-onclick/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
platform/core/
├── src/
│   └── frontend/
│       └── pages/
│           └── JobDashboard.tsx  # PRIMARY MODIFICATION: Filter interaction logic
```

**Structure Decision**: Web application monorepo. Modification scope:
1. **platform/core/src/frontend/pages/JobDashboard.tsx**
   - Replace onClick handlers with onMouseEnter/onMouseLeave
   - Add hover region detection for button+panel compound area
   - Implement mutual exclusion (one panel at a time)
   - Maintain existing filter state management

## Phase 0: Outline & Research

### Current Implementation Analysis

**Existing Behavior**:
- State: `const [showStatusFilter, setShowStatusFilter] = useState(false)`
- State: `const [showLocationFilter, setShowLocationFilter] = useState(false)`
- Trigger: `onClick={() => setShowStatusFilter(!showStatusFilter)}`
- Trigger: `onClick={() => setShowLocationFilter(!showLocationFilter)}`
- Problem: Independent boolean toggles, no mutual exclusion, click-based

**Issues Identified**:
1. Toggle pattern confusing (click to close same filter)
2. No coordination between filters (both can be open, causing overlap)
3. Click-based requires explicit close action

### Hover Interaction Research

**Pattern 1: Simple Hover (Tooltip-style)**
- `onMouseEnter`: Set state true
- `onMouseLeave`: Set state false
- **Limitation**: Closes immediately when mouse leaves button (can't interact with panel)

**Pattern 2: Hover with Sticky Panel**
- Button `onMouseEnter`: Open panel
- Panel `onMouseLeave`: Close panel (with timeout)
- **Chosen**: Allows checkbox interaction inside panel

**Pattern 3: Compound Hover Region**
- Wrap button+panel in container
- Container `onMouseEnter`: Open panel
- Container `onMouseLeave`: Close panel
- **Chosen**: Cleanest approach for sticky selection behavior

### Implementation Strategy

**State Management**:
```typescript
// Replace two booleans with single state tracking which panel is open
const [openFilter, setOpenFilter] = useState<'status' | 'location' | null>(null)
```

**Event Handlers**:
```typescript
// Button hover: Open this filter, close others
onMouseEnter={() => setOpenFilter('status')}

// Compound region leave: Close panel
onMouseLeave={() => setOpenFilter(null)}
```

**Conditional Rendering**:
```typescript
{openFilter === 'status' && (
  <div>Status filter panel</div>
)}
```

**Edge Case Handling**:
- Rapid hover switching: State updates handle automatically (React batching)
- Mouse path anomalies: onMouseLeave on compound div handles all exit paths
- Panel positioning: Maintain existing absolute positioning

### Accessibility Considerations

**Keyboard Access**: Maintain existing onClick as fallback
```typescript
// Dual trigger: hover OR click
onMouseEnter={() => setOpenFilter('status')}
onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
```

**Screen Readers**: No changes needed (existing ARIA labels preserved)

**Touch Devices**: onClick provides fallback for mobile (no hover support)

### Research Findings

**Decision 1**: Use single state variable `openFilter` instead of two booleans
- **Rationale**: Enforces mutual exclusion naturally
- **Alternatives Considered**: Keep two booleans + coordination logic (rejected: more complex)

**Decision 2**: Wrap button+panel in hover-sensitive container div
- **Rationale**: Enables "sticky selection" behavior for checkbox interaction
- **Alternatives Considered**: Panel-only hover region (rejected: can't reach panel from button)

**Decision 3**: Keep onClick as dual trigger (hover OR click)
- **Rationale**: Accessibility and mobile support
- **Alternatives Considered**: Remove onClick entirely (rejected: breaks touch devices)

**Output**: research.md complete, no NEEDS CLARIFICATION remaining

## Phase 1: Design & Contracts

### Data Model

**State Structure**:
```typescript
// Before (two independent booleans)
const [showStatusFilter, setShowStatusFilter] = useState(false)
const [showLocationFilter, setShowLocationFilter] = useState(false)

// After (single nullable enum state)
type OpenFilterType = 'status' | 'location' | null
const [openFilter, setOpenFilter] = useState<OpenFilterType>(null)
```

**State Transitions**:
- `null` → `'status'`: User hovers Status button
- `null` → `'location'`: User hovers Location button
- `'status'` → `null`: User exits Status button+panel region
- `'status'` → `'location'`: User hovers Location button (automatic close + open)
- `'location'` → `'status'`: User hovers Status button (automatic close + open)

**Validation Rules**:
- Only one filter can be non-null at any time (enforced by type system)
- Filter state persists while mouse within button+panel compound region
- Mouse leave from compound region always sets state to null

**Relationships**:
- `openFilter` state → Controls conditional rendering of filter panels
- Filter selections (`filters.status`, `filters.location`) → Unchanged, independent of panel visibility

### Component Structure

**Hover Region Layout**:
```
<div onMouseLeave={handleCloseFilter}>  {/* Compound hover region */}
  <button onMouseEnter={handleOpenStatus}>  {/* Trigger */}
    Status ▼
  </button>
  {openFilter === 'status' && (
    <div>  {/* Panel content */}
      [Checkboxes]
    </div>
  )}
</div>
```

**Handler Functions**:
```typescript
const handleOpenStatus = () => setOpenFilter('status')
const handleOpenLocation = () => setOpenFilter('location')
const handleCloseFilter = () => setOpenFilter(null)
```

### Quickstart Validation

**Manual Test Scenarios**:

1. **Hover Status Filter**
   - Action: Move mouse over "Status" button
   - Expected: Status panel appears immediately
   - Expected: Location panel closed (if was open)

2. **Interact with Checkboxes**
   - Prerequisite: Status panel open
   - Action: Move mouse into panel, click checkboxes
   - Expected: Panel remains open
   - Expected: Filter selections apply to job list

3. **Switch Between Filters**
   - Prerequisite: Status panel open
   - Action: Move mouse to "Location" button
   - Expected: Status panel closes, Location panel opens

4. **Close Panel**
   - Prerequisite: Any panel open
   - Action: Move mouse away from button+panel region
   - Expected: Panel closes automatically

5. **Mobile/Touch Fallback**
   - Action: Tap "Status" button (touch device)
   - Expected: Panel toggles (onClick fallback works)

### Agent Context Update

**Run update script**:
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

**New context to add**:
- Feature: Hover-based filter interaction in JobDashboard
- Pattern: Single state variable for mutual exclusion
- Accessibility: Dual hover+click triggers
- State: `openFilter: 'status' | 'location' | null`

**Output**: CLAUDE.md updated (O(1) operation, under 150 lines)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from implementation strategy in research.md
- UI-only change, no backend/API/database modifications
- No TDD (manual visual testing only)

**Ordering Strategy**:
1. Refactor state management (two booleans → single enum) [Sequential]
2. Update Status filter: replace onClick with hover handlers [P - can parallelize with Location]
3. Update Location filter: replace onClick with hover handlers [P]
4. Wrap filters in compound hover regions [Sequential - depends on 2 & 3]
5. Test mutual exclusion behavior [Validation]
6. Test sticky selection (checkbox interaction) [Validation]
7. Test mobile/touch fallback [Validation]

**Mark [P] for parallel execution**: Tasks 2 and 3 (independent filter updates)

**Estimated Output**: 7-9 tasks (simple UI refactoring)

**Validation After Each Task**: Visual inspection in browser during `npm run dev`

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following quickstart.md validation)
**Phase 5**: Validation (manual testing per quickstart.md scenarios)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations | No complexity added |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - Hover patterns analyzed, implementation strategy defined
- [x] Phase 1: Design complete (/plan command) - State structure designed, quickstart scenarios documented, CLAUDE.md updated
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - 7-9 tasks estimated
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (pure UI refinement)
- [x] Post-Design Constitution Check: PASS (no new complexity)
- [x] All NEEDS CLARIFICATION resolved (5 clarifications from /clarify)
- [x] Complexity deviations documented (none - no violations)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
