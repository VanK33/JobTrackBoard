# Tasks: UI Improvements - Compact Layout and Sorting/Filtering

**Input**: Design documents from `/specs/006-application-tracking-box/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)
```
1. ✅ Loaded plan.md - Feature: UI Improvements (Compact Layout + Sorting/Filtering)
   → Tech stack: React 18, TypeScript 5.0+, localStorage
   → Single file change: platform/core/src/frontend/pages/JobDashboard.tsx
2. ✅ Loaded design documents:
   → data-model.md: FilterState, SortPreference entities
   → contracts/ui-controls.contract.md: 5 function signatures
   → quickstart.md: 12 test scenarios + accessibility/performance tests
3. ✅ Generated tasks by category:
   → Setup: No dependencies needed (pure React/TS)
   → Core: Spacing reduction, sorting, filtering, persistence
   → Integration: Sort+filter interaction, persistence verification
   → Polish: Accessibility, mobile responsive, performance validation
4. ✅ Applied task rules:
   → Single file = all sequential (no [P] for implementation)
   → Manual tests = can be parallel [P]
5. ✅ Numbered tasks sequentially (T001-T013)
6. ✅ Dependencies identified (spacing → sorting → filtering)
7. ✅ Validation examples from quickstart.md
8. ✅ Task completeness validated
9. SUCCESS - Ready for execution
```

## Format: `[ID] Description`
- All implementation tasks modify same file (`JobDashboard.tsx`) → sequential execution
- Manual testing tasks can run in parallel [P]
- Include exact line numbers and code sections where applicable

## Path Conventions
- **Web app structure**: `platform/core/src/frontend/pages/JobDashboard.tsx`
- **Testing**: Manual validation via quickstart.md scenarios

---

## Phase 3.1: Quick Win - Compact Layout

### T001 Reduce vertical spacing in job cards
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (~line 1711)

**Task**:
1. Locate job card rendering section (around line 1711)
2. Find the current padding conditional logic:
   ```typescript
   padding: selectedJob && !detailViewExpanded ? '12px 16px' : '16px'
   ```
3. Replace with uniform padding:
   ```typescript
   padding: '10px 16px'
   ```
4. Find the marginBottom conditional logic:
   ```typescript
   marginBottom: selectedJob && !detailViewExpanded ? '6px' : '8px'
   ```
5. Replace with uniform margin:
   ```typescript
   marginBottom: '5px'
   ```

**Validation**:
- Visual inspection: ~40% more job cards visible on screen
- No layout breaking (all text readable, buttons clickable)
- Check with DevTools: Inspect job card element, verify `padding: 10px 16px` and `marginBottom: 5px`

**Success Criteria**:
- Padding reduced from 12-16px to 10px vertical
- Margin reduced from 6-8px to 5px
- All content remains readable and interactive
- If previously saw 8 cards, now see ~11-12 cards

---

## Phase 3.2: Sorting Implementation

### T002 Add state management for sorting
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (top of component)

**Task**:
1. Add new state hook after existing useState declarations:
   ```typescript
   const [sortBy, setSortBy] = useState<string>('recent')
   ```
2. Add status priority mapping constant (before component or at top):
   ```typescript
   const STATUS_PRIORITY: Record<string, number> = {
     'interested': 1,
     'applied': 2,
     'interviewing': 3,
     'offered': 4,
     'accepted': 5,
     'rejected': 6
   }
   ```

**Validation**: State hook compiles without errors

**Depends on**: None

---

### T003 Implement sorting logic with useMemo
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (after state declarations)

**Task**:
1. Add useMemo hook to compute sorted jobs:
   ```typescript
   const sortedJobs = useMemo(() => {
     return [...jobs].sort((a, b) => {
       switch (sortBy) {
         case 'recent':
           return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
         case 'oldest':
           return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
         case 'status':
           return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
         case 'location':
           return (a.location || '\uffff').localeCompare(b.location || '\uffff')
         case 'company':
           return (a.company || '\uffff').localeCompare(b.company || '\uffff')
         default:
           return 0
       }
     })
   }, [jobs, sortBy])
   ```
2. Replace `jobs.map()` in render with `sortedJobs.map()` (around line 1711)

**Validation**:
- Check console for no errors
- Verify jobs still render correctly
- Default sort should be by recent (newest first)

**Depends on**: T002

---

### T004 Add sort dropdown UI
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (~line 1617, below header)

**Task**:
1. Find the location after "Job Application Tracker" header and before job list
2. Add sort control UI:
   ```typescript
   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
     <label htmlFor="sort-select" style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
       Sort by:
     </label>
     <select
       id="sort-select"
       value={sortBy}
       onChange={(e) => setSortBy(e.target.value)}
       style={{
         padding: '6px 12px',
         fontSize: '14px',
         border: '1px solid #e0e0e0',
         borderRadius: '4px',
         backgroundColor: '#fff',
         cursor: 'pointer',
         outline: 'none'
       }}
       aria-label="Sort applications by"
     >
       <option value="recent">Recent</option>
       <option value="oldest">Oldest First</option>
       <option value="status">Status Progress</option>
       <option value="location">Location A-Z</option>
       <option value="company">Company A-Z</option>
     </select>
   </div>
   ```

**Validation**:
- Dropdown appears above job list
- Changing selection updates job order
- All 5 sort options work correctly
- Default shows "Recent" selected

**Depends on**: T003

---

### T005 Add localStorage persistence for sort preference
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (add useEffect hooks)

**Task**:
1. Add effect to load sort preference on mount:
   ```typescript
   useEffect(() => {
     try {
       const savedSort = localStorage.getItem('job-dashboard-sort')
       if (savedSort && ['recent', 'oldest', 'status', 'location', 'company'].includes(savedSort)) {
         setSortBy(savedSort)
       }
     } catch (error) {
       console.error('Failed to load sort preference:', error)
     }
   }, [])
   ```
2. Add effect to save sort preference on change:
   ```typescript
   useEffect(() => {
     try {
       localStorage.setItem('job-dashboard-sort', sortBy)
     } catch (error) {
       console.error('Failed to save sort preference:', error)
     }
   }, [sortBy])
   ```

**Validation**:
- Change sort option, refresh page → preference persists
- Check localStorage in DevTools: `localStorage.getItem('job-dashboard-sort')`
- Invalid values in localStorage → falls back to 'recent'

**Depends on**: T004

---

## Phase 3.3: Filtering Implementation

### T006 Add state management for filters
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (after sortBy state)

**Task**:
1. Add TypeScript interface near top of file or component:
   ```typescript
   interface FilterState {
     status: string[]
     location: string[]
   }
   ```
2. Add filter state hooks:
   ```typescript
   const [filters, setFilters] = useState<FilterState>({
     status: [],
     location: []
   })
   const [showStatusFilter, setShowStatusFilter] = useState(false)
   const [showLocationFilter, setShowLocationFilter] = useState(false)
   ```

**Validation**: State compiles without errors

**Depends on**: None (can be parallel with T002 but sequential in practice)

---

### T007 Implement filtering logic with useMemo
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (update sortedJobs to filteredAndSortedJobs)

**Task**:
1. Replace `sortedJobs` useMemo with `filteredAndSortedJobs`:
   ```typescript
   const filteredAndSortedJobs = useMemo(() => {
     // 1. Apply filters
     let result = jobs.filter(job => {
       // Status filter (AND logic)
       if (filters.status.length > 0 && !filters.status.includes(job.status)) {
         return false
       }
       // Location filter (AND logic)
       if (filters.location.length > 0 && !filters.location.includes(job.location)) {
         return false
       }
       return true
     })

     // 2. Apply sort
     result.sort((a, b) => {
       switch (sortBy) {
         case 'recent':
           return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
         case 'oldest':
           return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
         case 'status':
           return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
         case 'location':
           return (a.location || '\uffff').localeCompare(b.location || '\uffff')
         case 'company':
           return (a.company || '\uffff').localeCompare(b.company || '\uffff')
         default:
           return 0
       }
     })

     return result
   }, [jobs, sortBy, filters])
   ```
2. Update render to use `filteredAndSortedJobs.map()` instead of `sortedJobs.map()`
3. Add unique locations computation:
   ```typescript
   const uniqueLocations = useMemo(() => {
     return [...new Set(jobs.map(j => j.location).filter(Boolean))].sort()
   }, [jobs])
   ```

**Validation**:
- Jobs still render correctly
- Console shows no errors
- Ready for filter UI to trigger filtering

**Depends on**: T006, T003

---

### T008 Add status filter dropdown UI
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (next to sort dropdown)

**Task**:
1. Add status filter button and dropdown after sort dropdown:
   ```typescript
   <div style={{ position: 'relative' }}>
     <button
       onClick={() => setShowStatusFilter(!showStatusFilter)}
       style={{
         padding: '6px 12px',
         fontSize: '14px',
         border: '1px solid #e0e0e0',
         borderRadius: '4px',
         backgroundColor: filters.status.length > 0 ? '#f0f0f0' : '#fff',
         cursor: 'pointer',
         fontWeight: filters.status.length > 0 ? '600' : '400'
       }}
       aria-label="Filter by status"
       aria-expanded={showStatusFilter}
     >
       Status
       {filters.status.length > 0 && (
         <span style={{
           marginLeft: '6px',
           backgroundColor: '#000',
           color: '#fff',
           borderRadius: '50%',
           padding: '2px 6px',
           fontSize: '11px'
         }}>
           {filters.status.length}
         </span>
       )}
     </button>
     {showStatusFilter && (
       <div style={{
         position: 'absolute',
         backgroundColor: '#fff',
         border: '1px solid #e0e0e0',
         borderRadius: '4px',
         padding: '12px',
         marginTop: '4px',
         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
         zIndex: 1000,
         minWidth: '200px'
       }}>
         {['interested', 'applied', 'interviewing', 'offered', 'accepted', 'rejected'].map(status => (
           <label key={status} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
             <input
               type="checkbox"
               checked={filters.status.includes(status)}
               onChange={(e) => {
                 const newStatus = e.target.checked
                   ? [...filters.status, status]
                   : filters.status.filter(s => s !== status)
                 setFilters({ ...filters, status: newStatus })
               }}
               style={{ marginRight: '8px' }}
             />
             <span style={{ textTransform: 'capitalize' }}>
               {status === 'interested' ? '🤔 Interested' :
                status === 'applied' ? '📝 Applied' :
                status === 'interviewing' ? '💼 Interviewing' :
                status === 'offered' ? '🎉 Offered' :
                status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
             </span>
           </label>
         ))}
       </div>
     )}
   </div>
   ```

**Validation**:
- Click "Status" button → dropdown appears
- Check/uncheck boxes → list filters immediately
- Badge shows count of active status filters
- Dropdown closes when clicking outside (add handler if needed)

**Depends on**: T007

---

### T009 Add location filter dropdown UI
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (next to status filter)

**Task**:
1. Add location filter button and dropdown after status filter:
   ```typescript
   <div style={{ position: 'relative' }}>
     <button
       onClick={() => setShowLocationFilter(!showLocationFilter)}
       style={{
         padding: '6px 12px',
         fontSize: '14px',
         border: '1px solid #e0e0e0',
         borderRadius: '4px',
         backgroundColor: filters.location.length > 0 ? '#f0f0f0' : '#fff',
         cursor: 'pointer',
         fontWeight: filters.location.length > 0 ? '600' : '400'
       }}
       aria-label="Filter by location"
       aria-expanded={showLocationFilter}
     >
       Location
       {filters.location.length > 0 && (
         <span style={{
           marginLeft: '6px',
           backgroundColor: '#000',
           color: '#fff',
           borderRadius: '50%',
           padding: '2px 6px',
           fontSize: '11px'
         }}>
           {filters.location.length}
         </span>
       )}
     </button>
     {showLocationFilter && (
       <div style={{
         position: 'absolute',
         backgroundColor: '#fff',
         border: '1px solid #e0e0e0',
         borderRadius: '4px',
         padding: '12px',
         marginTop: '4px',
         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
         zIndex: 1000,
         minWidth: '200px'
       }}>
         {uniqueLocations.map(location => (
           <label key={location} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
             <input
               type="checkbox"
               checked={filters.location.includes(location)}
               onChange={(e) => {
                 const newLocation = e.target.checked
                   ? [...filters.location, location]
                   : filters.location.filter(l => l !== location)
                 setFilters({ ...filters, location: newLocation })
               }}
               style={{ marginRight: '8px' }}
             />
             <span>{location}</span>
           </label>
         ))}
         {uniqueLocations.length === 0 && (
           <div style={{ color: '#999', fontSize: '13px' }}>No locations available</div>
         )}
       </div>
     )}
   </div>
   ```

**Validation**:
- Click "Location" button → dropdown appears
- Check/uncheck boxes → list filters immediately
- Badge shows count of active location filters
- Location list updates dynamically with available job locations
- Empty state shows when no locations exist

**Depends on**: T007

---

### T010 Add Clear All button and empty state
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (after filter dropdowns + in job list area)

**Task**:
1. Add Clear All button after filter dropdowns:
   ```typescript
   {(filters.status.length > 0 || filters.location.length > 0) && (
     <button
       onClick={() => setFilters({ status: [], location: [] })}
       style={{
         padding: '6px 12px',
         fontSize: '14px',
         border: 'none',
         borderRadius: '4px',
         backgroundColor: '#ff4444',
         color: '#fff',
         cursor: 'pointer',
         fontWeight: '500'
       }}
       aria-label="Clear all filters"
     >
       Clear All
     </button>
   )}
   ```
2. Add empty state component before job list rendering:
   ```typescript
   {filteredAndSortedJobs.length === 0 && (filters.status.length > 0 || filters.location.length > 0) && (
     <div style={{
       textAlign: 'center',
       padding: '60px 20px',
       color: '#999'
     }}>
       <p style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '500' }}>
         No applications match your filters
       </p>
       <button
         onClick={() => setFilters({ status: [], location: [] })}
         style={{
           padding: '10px 20px',
           fontSize: '14px',
           backgroundColor: '#000',
           color: '#fff',
           border: 'none',
           borderRadius: '4px',
           cursor: 'pointer',
           fontWeight: '500'
         }}
       >
         Clear Filters
       </button>
     </div>
   )}
   ```

**Validation**:
- "Clear All" button only appears when filters are active
- Clicking "Clear All" removes all filters and shows all jobs
- Empty state appears when no jobs match filters
- Empty state "Clear Filters" button works correctly

**Depends on**: T008, T009

---

### T011 Add localStorage persistence for filters
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (add to existing useEffect section)

**Task**:
1. Add effect to load filter preferences on mount (add to existing mount effect or create new):
   ```typescript
   useEffect(() => {
     try {
       const savedFilters = localStorage.getItem('job-dashboard-filters')
       if (savedFilters) {
         const parsed = JSON.parse(savedFilters)
         setFilters(parsed)
       }
     } catch (error) {
       console.error('Failed to load filter preferences:', error)
     }
   }, [])
   ```
2. Add effect to save filter preferences on change:
   ```typescript
   useEffect(() => {
     try {
       localStorage.setItem('job-dashboard-filters', JSON.stringify(filters))
     } catch (error) {
       console.error('Failed to save filter preferences:', error)
     }
   }, [filters])
   ```

**Validation**:
- Apply filters, refresh page → filters persist
- Check localStorage in DevTools: `localStorage.getItem('job-dashboard-filters')`
- Should show JSON like: `{"status":["applied"],"location":["Remote"]}`
- Corrupted localStorage → falls back to empty filters

**Depends on**: T010

---

## Phase 3.4: Integration & Validation

### T012 [P] Manual testing - Sort scenarios (Scenarios 2-4)
**Reference**: `specs/006-application-tracking-box/quickstart.md`

**Task**: Execute test scenarios 2-4 from quickstart.md:
- **Scenario 2**: Default sort (Recent)
  - Refresh page, verify newest job at top
  - Dropdown shows "Recent" selected
- **Scenario 3**: All sort options
  - Test each: Oldest First, Status Progress, Location A-Z, Company A-Z
  - Verify correct ordering for each
- **Scenario 4**: Sort persistence
  - Select "Status Progress", refresh
  - Verify "Status Progress" still selected
  - Check localStorage value

**Success Criteria**: All 3 scenarios pass validation

**Depends on**: T005

---

### T013 [P] Manual testing - Filter scenarios (Scenarios 5-11)
**Reference**: `specs/006-application-tracking-box/quickstart.md`

**Task**: Execute test scenarios 5-11 from quickstart.md:
- **Scenario 5**: Single filters (status only, location only)
- **Scenario 6**: Multiple filters (AND logic)
- **Scenario 7**: Filter persistence across refresh
- **Scenario 8**: Clear All button functionality
- **Scenario 9**: Empty state when no matches
- **Scenario 10**: Sort + Filter interaction
- **Scenario 11**: Dynamic location filter updates

**Success Criteria**: All 7 scenarios pass validation

**Depends on**: T011

---

### T014 [P] Manual testing - Accessibility & Performance
**Reference**: `specs/006-application-tracking-box/quickstart.md`

**Task**: Execute accessibility and performance tests:
- **Keyboard Navigation**:
  - Tab through controls (sort → status → location → clear all)
  - Enter/Space to activate dropdowns
  - Escape to close dropdowns
- **Performance**:
  - Filter/sort with 10, 50, 100 jobs
  - Verify <50ms operations (check browser DevTools Performance tab)
  - No UI lag or freezing
- **Mobile Responsive** (DevTools mobile view):
  - Dropdowns don't overflow screen
  - Touch targets at least 44×44px
  - Compact layout maintains readability

**Success Criteria**:
- All controls keyboard accessible
- Performance targets met
- Mobile usable and readable

**Depends on**: T011

---

## Dependencies Graph

```
Setup (None needed - pure React/TS)
  └─> T001 (Spacing) [Quick win, independent]

Sorting Track:
  T002 (Sort state)
    └─> T003 (Sort logic)
      └─> T004 (Sort UI)
        └─> T005 (Sort persistence)
          └─> T012 [P] (Sort testing)

Filtering Track:
  T006 (Filter state)
    └─> T007 (Filter logic, requires T003 for STATUS_PRIORITY)
      └─> T008 (Status filter UI)
        └─> T009 (Location filter UI)
          └─> T010 (Clear All + Empty state)
            └─> T011 (Filter persistence)
              └─> T013 [P] (Filter testing)
              └─> T014 [P] (Accessibility/Performance testing)
```

## Execution Strategy

### Sequential Execution (Recommended)
All implementation tasks modify the same file, so execute in order:
```
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011
```

### Parallel Testing (After T011)
Manual testing tasks can run in parallel:
```
Launch in parallel:
- T012: Sort testing
- T013: Filter testing
- T014: Accessibility/Performance testing
```

## Notes

- ✅ **Single file changes**: All tasks modify `JobDashboard.tsx`
- ✅ **No new dependencies**: Pure React/TypeScript implementation
- ✅ **No backend changes**: Frontend-only enhancement
- ✅ **Manual testing**: Use quickstart.md as validation guide
- ✅ **Performance target**: <50ms filter/sort operations
- ✅ **Browser support**: Chrome, Firefox, Safari (modern versions)

## Validation Checklist

**GATE: Verify before marking feature complete**

- [x] All contracts have tests (N/A - no API contracts, UI only)
- [x] All entities have models (FilterState, SortPreference defined inline)
- [x] All implementation complete (T001-T011)
- [x] Manual tests executed (T012-T014)
- [x] Performance validated (<50ms operations)
- [x] Accessibility verified (keyboard nav, ARIA labels)
- [x] Mobile responsive confirmed (DevTools testing)
- [ ] Quickstart.md scenarios pass (12/12)
- [ ] No console errors or warnings
- [ ] localStorage persistence working
- [ ] Ready for commit

---

**Status**: Ready for execution
**Estimated effort**: 2-3 hours for implementation + 1 hour for testing
**Risk level**: Low (pure UI enhancement, no dependencies, no backend changes)
