# Quickstart: UI Improvements Testing Guide

## Prerequisites
- Development server running (`npm run dev`)
- At least 10 test jobs in different statuses and locations
- Browser DevTools open to check localStorage

---

## Test Scenario 1: Compact Layout ✅

### Goal
Verify 30-40% more jobs visible on screen

### Steps
1. Navigate to Job Dashboard
2. Count visible jobs before scrolling (write down number)
3. **Expected**: Padding reduced to 10px, margin to 5px
4. **Expected**: ~40% more cards visible vs previous layout

### Validation
- Measure using DevTools:
  - Inspect job card element
  - Verify `padding: 10px 16px`
  - Verify `marginBottom: 5px`
- Visual: All text readable, buttons clickable
- Counting: If previously saw 8 cards, now see ~11-12 cards

### Pass Criteria
✅ Padding/margin values correct
✅ 30-40% more cards visible
✅ All content readable and interactive

---

## Test Scenario 2: Sorting - Recent (Default) ✅

### Steps
1. Refresh page (clear state)
2. Observe job list order
3. Check sort dropdown shows "Recent" selected

### Validation
- Newest job (highest `updatedAt`) at top
- Oldest job at bottom
- Dropdown default value is "Recent"

### Pass Criteria
✅ Jobs sorted by `updatedAt` descending
✅ "Recent" selected by default

---

## Test Scenario 3: Sorting - All Options ✅

### Steps for Each Sort Option
1. **Oldest First**:
   - Select from dropdown
   - Verify oldest job now at top

2. **Status Progress**:
   - Select from dropdown
   - Verify order: interested → applied → interviewing → offered → accepted/rejected

3. **Location A-Z**:
   - Select from dropdown
   - Verify alphabetical by location

4. **Company A-Z**:
   - Select from dropdown
   - Verify alphabetical by company

### Pass Criteria
✅ Each sort option reorders list correctly
✅ No console errors
✅ Transitions smooth

---

## Test Scenario 4: Sorting Persistence ✅

### Steps
1. Select "Status Progress" from dropdown
2. Refresh page
3. Check if "Status Progress" still selected

### Validation
- Check localStorage:
  ```javascript
  localStorage.getItem('job-dashboard-sort') === 'status'
  ```
- Job list still sorted by status

### Pass Criteria
✅ Sort preference persists across refresh
✅ localStorage contains correct value

---

## Test Scenario 5: Filtering - Single Filter ✅

### Test 5A: Status Filter Only
1. Click "Status" filter button
2. Check "Interviewing"
3. Observe list updates

**Expected**: Only jobs with status="interviewing" visible

### Test 5B: Location Filter Only
1. Clear status filter
2. Click "Location" filter button
3. Check "Remote"
4. Observe list updates

**Expected**: Only jobs with location="Remote" visible

### Pass Criteria
✅ Filter dropdowns appear/hide correctly
✅ Checkboxes toggle filter state
✅ List updates immediately
✅ Badge shows filter count (1)

---

## Test Scenario 6: Filtering - Multiple Filters (AND Logic) ✅

### Steps
1. Select Status filter: "Applied" AND "Interviewing"
2. Select Location filter: "Remote"
3. Observe results

### Validation
- Jobs shown must have:
  - (status="applied" OR status="interviewing") **AND**
  - location="Remote"
- Badge shows total count (3)

### Pass Criteria
✅ Multiple filters combine with AND logic
✅ Badge count accurate
✅ Only matching jobs visible

---

## Test Scenario 7: Filter Persistence ✅

### Steps
1. Apply filters: Status="Applied", Location="San Francisco"
2. Refresh page
3. Check if filters still active

### Validation
- Check localStorage:
  ```javascript
  JSON.parse(localStorage.getItem('job-dashboard-filters'))
  // Should return: { status: ['applied'], location: ['San Francisco'] }
  ```
- Filters still applied to list
- Checkboxes still checked

### Pass Criteria
✅ Filter state persists across refresh
✅ localStorage contains correct JSON
✅ UI reflects persisted state

---

## Test Scenario 8: Clear All Filters ✅

### Steps
1. Apply multiple filters (status + location)
2. Click "Clear All" button
3. Observe all jobs reappear

### Validation
- All filter checkboxes unchecked
- "Clear All" button disappears
- Badge counters gone
- All jobs visible again

### Pass Criteria
✅ Filters cleared
✅ UI updates correctly
✅ Full job list restored

---

## Test Scenario 9: Empty State ✅

### Steps
1. Apply very restrictive filters (e.g., Status="Offered" + Location="Mars")
2. Observe empty state message

### Validation
- Message displayed: "No applications match your filters"
- "Clear Filters" button visible
- No job cards shown
- Clicking "Clear Filters" restores list

### Pass Criteria
✅ Empty state shows when no matches
✅ Clear button functional
✅ User-friendly message

---

## Test Scenario 10: Sort + Filter Interaction ✅

### Steps
1. Apply filter: Status="Applied"
2. Select sort: "Company A-Z"
3. Verify filtered jobs are sorted correctly

### Validation
- Only "applied" status jobs shown
- Those jobs sorted alphabetically by company
- Adding new "applied" job appears in sorted position

### Pass Criteria
✅ Sorting applies to filtered results
✅ Combined behavior correct

---

## Test Scenario 11: Dynamic Location Filter ✅

### Steps
1. Note locations available in filter dropdown
2. Delete all jobs from one location
3. Refresh and check filter dropdown

### Validation
- Deleted location no longer appears in filter options
- Only active locations shown
- List updates dynamically

### Pass Criteria
✅ Filter options match current job locations
✅ No orphaned filter options

---

## Test Scenario 12: New Job Respects Filters/Sort ✅

### Steps
1. Apply filter: Status="Interviewing"
2. Select sort: "Recent"
3. Create new job with status="Interviewing"

### Validation
- New job appears in filtered list
- New job positioned correctly (top of list for "Recent" sort)
- Badge count increments

### Pass Criteria
✅ New job respects active filters
✅ New job positioned by active sort
✅ UI updates correctly

---

## Performance Test

### Steps
1. Create 100 test jobs
2. Apply filters and change sorts
3. Measure response time

### Validation
- Filter/sort operations: <50ms
- No UI lag or freezing
- Smooth transitions

### Pass Criteria
✅ No performance degradation
✅ Instant UI feedback

---

## Browser Compatibility Test

### Browsers to Test
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Validation
- All features work
- LocalStorage support
- UI renders correctly
- No console errors

### Pass Criteria
✅ Works in all modern browsers
✅ Graceful degradation if localStorage unavailable

---

## Mobile Responsive Test

### Steps
1. Open in mobile viewport (DevTools or actual device)
2. Test sort dropdown
3. Test filter dropdowns
4. Test compact layout

### Validation
- Dropdowns don't overflow screen
- Touch targets at least 44×44px
- Compact layout maintains readability
- Filters usable on small screens

### Pass Criteria
✅ Fully functional on mobile
✅ Touch-friendly controls
✅ Readable on small screens

---

## Accessibility Test

### Keyboard Navigation
1. Tab through controls (sort → filters → clear all)
2. Use Enter/Space to activate dropdowns
3. Use Arrow keys in select dropdown
4. Use Escape to close filter dropdowns

### Screen Reader Test
1. Enable screen reader (VoiceOver/NVDA)
2. Navigate through controls
3. Verify announcements for filter changes

### Pass Criteria
✅ All controls keyboard accessible
✅ Proper focus indicators
✅ ARIA labels present and correct

---

## Manual Testing Checklist

Execute all scenarios above and check off:

- [ ] Scenario 1: Compact layout (40% more visible)
- [ ] Scenario 2: Default sort (Recent)
- [ ] Scenario 3: All sort options work
- [ ] Scenario 4: Sort persistence
- [ ] Scenario 5: Single filters work
- [ ] Scenario 6: Multiple filters (AND logic)
- [ ] Scenario 7: Filter persistence
- [ ] Scenario 8: Clear all filters
- [ ] Scenario 9: Empty state
- [ ] Scenario 10: Sort + filter interaction
- [ ] Scenario 11: Dynamic location options
- [ ] Scenario 12: New job respects filters/sort
- [ ] Performance: <50ms operations
- [ ] Browser compatibility (3 browsers)
- [ ] Mobile responsive
- [ ] Accessibility (keyboard + screen reader)

---

## Success Criteria

**All scenarios must pass with expected results**

Key validations:
1. ✅ ~40% more jobs visible (compact layout)
2. ✅ All 5 sort options functional
3. ✅ Filters work individually and combined
4. ✅ Preferences persist via localStorage
5. ✅ Empty state handles no results
6. ✅ Performance acceptable (<50ms)
7. ✅ No regressions in existing features

---

## Debugging Tips

### If sorts not working:
- Check console for errors
- Verify `updatedAt` field exists on all jobs
- Check `useMemo` dependencies

### If filters not working:
- Check console for filter state changes
- Verify filter logic (AND vs OR)
- Check if jobs have required fields

### If persistence not working:
- Check localStorage in DevTools (Application tab)
- Verify keys: 'job-dashboard-sort', 'job-dashboard-filters'
- Check for localStorage quota errors

### If UI not updating:
- Verify state changes triggering re-renders
- Check `useMemo` dependencies include all relevant state
- Look for stale closures

---

## Automated Test Commands

```bash
# Run dev server
npm run dev

# Open browser
open http://localhost:5173

# Check localStorage in Console
localStorage.getItem('job-dashboard-sort')
localStorage.getItem('job-dashboard-filters')
```
