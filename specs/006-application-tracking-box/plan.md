
# Implementation Plan: UI Improvements - Compact Layout and Sorting/Filtering

**Branch**: `006-application-tracking-box` | **Date**: 2025-10-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-application-tracking-box/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ All context resolved
3. Fill the Constitution Check section
   → ✅ No violations - pure UI enhancement
4. Evaluate Constitution Check section
   → ✅ PASS - No complexity added
5. Execute Phase 0 → research.md
   → ✅ research.md complete
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ All artifacts complete
7. Re-evaluate Constitution Check section
   → ✅ PASS - Design maintains simplicity
8. Plan Phase 2 → Describe task generation approach
   → ✅ Strategy documented below
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS here. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**Primary Requirement**: Reduce vertical spacing in job application tracking boxes by ~40% and add sorting/filtering capabilities (by status, date, location).

**Technical Approach**:
- **Compact Layout**: Reduce padding from 12-16px to 10px, margin from 6-8px to 5px (35% reduction)
- **Sorting**: Add dropdown with 5 options (recent, oldest, status, location, company)
- **Filtering**: Multi-select dropdowns for status and location with AND logic
- **Persistence**: localStorage for user preferences across sessions
- **Implementation**: Frontend-only changes to `JobDashboard.tsx` using React hooks and useMemo

## Technical Context

**Language/Version**: TypeScript 5.0+ with React 18
**Primary Dependencies**: React 18, Vite 5 (build tool)
**Storage**: localStorage for preferences (no backend changes)
**Testing**: Manual testing via quickstart.md scenarios
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari)
**Project Type**: web (monorepo: platform/core with frontend + backend)
**Performance Goals**: <50ms filter/sort operations for 100 jobs
**Constraints**: Client-side only, no new dependencies, ~100 lines of code changes
**Scale/Scope**: 10-100 jobs per user (supports up to 1000 before performance degradation)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ PASS - No Violations Detected**

This feature:
- ✅ **No new abstractions**: Uses existing React patterns (useState, useEffect, useMemo)
- ✅ **No new dependencies**: Pure React/TypeScript implementation
- ✅ **No backend changes**: Frontend-only enhancement
- ✅ **Minimal complexity**: ~100 lines of straightforward filtering/sorting logic
- ✅ **Clear boundaries**: All changes contained to JobDashboard component
- ✅ **No architectural changes**: Maintains existing component structure

**Rationale**: This is a pure UI enhancement with well-understood React patterns. The sorting and filtering logic is simple array operations with standard localStorage persistence.

## Project Structure

### Documentation (this feature)
```
specs/006-application-tracking-box/
├── spec.md              # Feature specification
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command) ✅
├── data-model.md        # Phase 1 output (/plan command) ✅
├── quickstart.md        # Phase 1 output (/plan command) ✅
├── contracts/           # Phase 1 output (/plan command) ✅
│   └── ui-controls.contract.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created yet)
```

### Source Code (repository root)

```
platform/core/
├── src/
│   ├── frontend/
│   │   ├── pages/
│   │   │   └── JobDashboard.tsx    # PRIMARY FILE - All changes here
│   │   ├── components/              # No changes needed
│   │   ├── services/                # No changes needed
│   │   ├── hooks/                   # No changes needed
│   │   └── utils/                   # No changes needed
│   └── backend/                     # No changes needed
└── tests/                           # Manual testing via quickstart.md
```

**Structure Decision**: Web application (Option 2). This feature modifies only the frontend layer (`JobDashboard.tsx`) with no backend or shared changes. All sorting, filtering, and persistence logic is client-side within a single React component.

## Phase 0: Outline & Research

**✅ COMPLETED** - See `research.md`

### Key Research Findings:

1. **Current Implementation Analysis**:
   - Job cards at line ~1711 with conditional padding (12-16px) and margin (6-8px)
   - No sorting controls - jobs displayed in database order
   - No filtering capabilities
   - No state persistence

2. **Spacing Reduction Decision**:
   - **Target**: 35% reduction (10px padding, 5px margin)
   - **Result**: ~40% more cards visible on screen
   - **Rationale**: 10px maintains usability while maximizing space

3. **Sorting Strategy**:
   - Use `updatedAt` field (not `createdAt`) - tracks recent activity
   - Default: "Recent" (updatedAt descending)
   - Status order: interested → applied → interviewing → offered → accepted → rejected
   - Location/Company: Alphabetical with null values last

4. **Filtering Strategy**:
   - Multi-select dropdowns for status and location
   - AND logic between filter types (most restrictive, clearer UX)
   - Dynamic location options (based on existing jobs)
   - "Clear All" button when filters active

5. **Persistence Strategy**:
   - localStorage keys: `job-dashboard-sort`, `job-dashboard-filters`
   - Load on mount, save on change (useEffect)
   - Graceful fallback to defaults if corrupted

**Output**: research.md with all decisions documented and rationale provided

## Phase 1: Design & Contracts

**✅ COMPLETED** - See artifacts below

### 1. Data Model (`data-model.md`)

**Entities Defined**:
- `FilterState`: `{ status: string[], location: string[] }`
- `SortPreference`: `'recent' | 'oldest' | 'status' | 'location' | 'company'`
- Status priority mapping for status-based sorting
- LocalStorage schema and persistence logic

### 2. Contracts (`contracts/ui-controls.contract.md`)

**Function Signatures**:
- `applySorting(jobs: Job[], sortBy: string): Job[]`
- `applyFilters(jobs: Job[], filters: FilterState): Job[]`
- `loadPreferences(): { sortBy: string, filters: FilterState }`
- `savePreferences(sortBy: string, filters: FilterState): void`
- `clearFilters(): void`

**UI Component Contracts**:
- Sort dropdown component with 5 options
- Filter control components with badges and checkboxes
- Empty state component for no results
- Accessibility requirements (ARIA labels, keyboard nav)

### 3. Test Scenarios (`quickstart.md`)

**12 Comprehensive Test Scenarios**:
1. Compact layout (40% more visible)
2. Default sort (Recent)
3. All sort options
4. Sort persistence
5. Single filters
6. Multiple filters (AND logic)
7. Filter persistence
8. Clear all filters
9. Empty state
10. Sort + filter interaction
11. Dynamic location filter
12. New job respects filters/sort

**Additional Tests**:
- Performance testing (<50ms operations)
- Browser compatibility (Chrome, Firefox, Safari)
- Mobile responsive testing
- Accessibility testing (keyboard + screen reader)

### 4. Agent Context Update

✅ Updated `CLAUDE.md` with recent changes via `.specify/scripts/bash/update-agent-context.sh claude`

**Output**: All Phase 1 artifacts complete and ready for task generation

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

### Task Generation Strategy

**Source Documents**:
- Load `.specify/templates/tasks-template.md` as base
- Generate from Phase 1 artifacts: data-model.md, contracts/, quickstart.md

**Task Categories**:
1. **Quick Win (1 task)**: Reduce spacing in job card styles
2. **Sorting (3-4 tasks)**:
   - Add sort dropdown UI
   - Implement sorting logic (useMemo)
   - Add localStorage persistence for sort
   - Test all sort options
3. **Filtering (5-6 tasks)**:
   - Add filter dropdown UI (status)
   - Add filter dropdown UI (location)
   - Implement filter logic (useMemo)
   - Add "Clear All" button
   - Add empty state component
   - Add filter count badges
   - Test filter combinations
4. **Integration (2-3 tasks)**:
   - Test sort + filter interaction
   - Test persistence across refresh
   - Test new job respects filters/sort
5. **Polish (2-3 tasks)**:
   - Mobile responsive adjustments
   - Accessibility (ARIA labels)
   - Performance validation

### Ordering Strategy

**Phase-Based Ordering**:
1. **Phase 1: Spacing** (Quick win, immediate value) [P]
2. **Phase 2: Sorting** (Foundation for filtering)
3. **Phase 3: Filtering** (Builds on sorting)
4. **Phase 4: Integration** (Validate combined behavior)
5. **Phase 5: Polish** (Accessibility, mobile, performance) [P]

**Parallelization**:
- Mark `[P]` for independent tasks (spacing, accessibility, tests)
- Sequential for dependent tasks (sorting before filtering)

### Estimated Output

**12-15 numbered, ordered tasks** in tasks.md format:
- T001: Reduce job card spacing
- T002-T004: Sorting implementation
- T005-T009: Filtering implementation
- T010-T011: Integration testing
- T012-T015: Polish and validation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run quickstart.md scenarios, performance validation)

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations to track** - This feature passes all constitutional checks.

## Progress Tracking

*This checklist is updated during execution flow*

### Phase Status

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

### Gate Status

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no violations)

### Artifacts Completed

- [x] spec.md (from /specify command)
- [x] research.md (Phase 0)
- [x] data-model.md (Phase 1)
- [x] contracts/ui-controls.contract.md (Phase 1)
- [x] quickstart.md (Phase 1)
- [x] CLAUDE.md updated (Phase 1)
- [x] plan.md (this file)
- [ ] tasks.md (awaiting /tasks command)

---

**Ready for /tasks command** - All planning complete. Next step: Generate implementation tasks.

*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
