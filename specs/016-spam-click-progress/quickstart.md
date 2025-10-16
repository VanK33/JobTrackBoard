# Quickstart: Prevent Status Update Spam & Expand Detail View

**Feature**: 016-spam-click-progress
**Date**: 2025-10-14
**Purpose**: Manual verification guide for spam prevention and detail view expansion features

---

## Prerequisites

Before starting this quickstart:
- [ ] Development server is running (`npm run dev`)
- [ ] Database is connected (PostgreSQL or SQLite fallback)
- [ ] At least one job application exists in the database
- [ ] Browser DevTools open (Console tab) to check for errors

---

## Quick Reference

### Files Modified
- **Backend**: `platform/core/src/backend/api/jobs.ts` (or equivalent status update endpoint)
- **Backend**: `platform/core/src/backend/database/*-service.ts` (spam detection logic)
- **Frontend**: `platform/core/src/frontend/pages/JobDashboard.tsx` (expansion toggle)

### Testing URLs
- **Dev Frontend**: `http://localhost:5173`
- **Dev Backend**: `http://localhost:3000`

### Key Behaviors
- **Spam threshold**: 3 seconds between status changes
- **Expansion sizes**: 60% (collapsed) → 90% (expanded) of middle panel height
- **Persistence**: Expansion state persists across job selections

---

## Scenario 1: Rapid Status Changes (Same Status Return)

**Goal**: Verify spam prevention ignores intermediate status when user quickly changes back to original

**Given**: A job application with status "applied"

**Steps**:
1. Navigate to `http://localhost:5173`
2. Select a job with status "applied" in the job list
3. Click the status dropdown/button to change to "screening"
4. **Immediately** (within 1 second) change status back to "applied"
5. Open browser DevTools → Network tab to check API responses
6. View the job's status history section

**Expected Results**:
- ✅ API call for "screening" returns 200 OK with `spamDetected: true` (or similar indicator)
- ✅ Status history shows only the original "applied" entry
- ✅ No intermediate "screening" entry in history
- ✅ Current job status remains "applied"

**Actual Results**: [Record actual behavior]

---

## Scenario 2: Legitimate Status Changes

**Goal**: Verify status changes are recorded when sufficient time passes

**Given**: A job application with status "applied"

**Steps**:
1. Select a job with status "applied"
2. Change status to "screening"
3. **Wait 4 seconds** (use timer or count)
4. Change status to "interview"
5. Check status history section

**Expected Results**:
- ✅ Both status changes recorded in history
- ✅ "applied" → "screening" entry with timestamp T1
- ✅ "screening" → "interview" entry with timestamp T2
- ✅ T2 - T1 ≥ 3 seconds (verify timestamps)

**Actual Results**: [Record actual behavior]

---

## Scenario 3: Multiple Rapid Changes

**Goal**: Verify only first status is kept when user spam-clicks multiple status changes

**Given**: A job application with status "applied"

**Steps**:
1. Select a job with status "applied"
2. **Rapidly click** (within 2 seconds total):
   - Change to "screening" (wait 0.5s)
   - Change to "interview" (wait 0.5s)
   - Change back to "applied" (wait 0.5s)
3. Check status history section
4. Verify final job status in UI

**Expected Results**:
- ✅ Status history shows only original "applied" entry
- ✅ All intermediate changes ("screening", "interview", final "applied") ignored
- ✅ Current job status is "applied"
- ✅ Only 1 entry in status history (not 4)

**Actual Results**: [Record actual behavior]

---

## Scenario 4: Expand Detail View

**Goal**: Verify expand button increases detail view height from 60% to 90%

**Given**: User is viewing a job's details in the middle panel

**Steps**:
1. Select any job from the list
2. Observe the current height of the job detail section (right panel)
3. Measure approximate height as percentage of screen (use browser DevTools → Elements → Computed tab)
4. Click the "Expand" button (should be near top of detail panel)
5. Observe the new height
6. Measure new height as percentage

**Expected Results**:
- ✅ **Before**: Detail section occupies ~60% of middle panel height
- ✅ **After**: Detail section occupies ~90% of middle panel height
- ✅ Transition is smooth (CSS animation, ~0.3s duration)
- ✅ Scroll bar appears if content exceeds 90% height
- ✅ Button label changes from "Expand" to "Collapse" (or icon changes)

**Actual Results**: [Record actual behavior]

**Measurement Helper**:
```
Open DevTools → Elements → Select detail container element
→ Computed tab → Check height value
→ Compare to parent panel height
```

---

## Scenario 5: Collapse Detail View

**Goal**: Verify collapse button returns detail view to original size

**Given**: User has expanded the job details (from Scenario 4)

**Steps**:
1. With detail view in expanded state (90%)
2. Click the "Collapse" button (same button as "Expand", now toggled)
3. Observe height change
4. Measure height as percentage

**Expected Results**:
- ✅ Detail section returns to ~60% of middle panel height
- ✅ Transition is smooth (CSS animation)
- ✅ Button label changes from "Collapse" back to "Expand"
- ✅ Content scrolls to top (or maintains scroll position)

**Actual Results**: [Record actual behavior]

---

## Scenario 6: Expansion Persists Across Jobs

**Goal**: Verify expansion state is maintained when switching between jobs

**Given**: Detail view is in expanded state (90%)

**Steps**:
1. Expand detail view using button (Scenario 4)
2. Verify detail section is at 90% height
3. **Select a different job** from the job list
4. Observe the detail view height for the new job
5. Switch to a third job
6. Observe detail view height again

**Expected Results**:
- ✅ Second job's detail view also shows 90% height (expanded state persists)
- ✅ Third job's detail view also shows 90% height
- ✅ Expansion state is NOT reset when changing selected job
- ✅ User must manually collapse if desired

**Actual Results**: [Record actual behavior]

---

## Scenario 7: Spam Prevention After Legitimate Change

**Goal**: Verify spam prevention works correctly after a valid status update

**Given**: A job with status "applied"

**Steps**:
1. Select job with status "applied"
2. Change status to "screening" (legitimate change)
3. **Wait 1 second** (less than 3s threshold)
4. **Spam-click** back to "applied" **three times rapidly** (within 1 second)
5. Check status history
6. Check network requests in DevTools

**Expected Results**:
- ✅ First change to "screening" is recorded (timestamp T1)
- ✅ First "applied" click triggers status update (timestamp T2, T2-T1 < 3s but allowed as legitimate)
- ✅ Second and third "applied" clicks are ignored (spam detected)
- ✅ Status history shows 2 entries: original "applied" → "screening"
- ✅ Current status is "applied"

**Note**: This tests the edge case where user makes legitimate change, then spam-clicks back.

**Actual Results**: [Record actual behavior]

---

## Scenario 8: Expansion with No Job Selected

**Goal**: Verify expand button behavior when no job is selected

**Given**: No job selected in the job list

**Steps**:
1. Click anywhere in empty space to deselect current job (or refresh page)
2. Verify no job detail panel is showing
3. Locate the expand/collapse button
4. Attempt to click the button
5. Check button visual state (enabled/disabled)

**Expected Results**:
- ✅ Expand button is **disabled** (or hidden) when no job selected
- ✅ Button has visual indicator of disabled state (opacity, cursor, etc.)
- ✅ Clicking disabled button has no effect
- ✅ No errors in console

**Alternative Design** (if implemented differently):
- Expand button is **hidden** when no job selected (not just disabled)

**Actual Results**: [Record actual behavior]

---

## Scenario 9: API Response Validation (Developer Check)

**Goal**: Verify backend API correctly implements spam detection

**Given**: Developer access to backend code and API

**Steps**:
1. Open browser DevTools → Network tab
2. Filter for XHR/Fetch requests
3. Perform Scenario 1 (rapid status change)
4. Inspect the network requests:
   - First status change request (to "screening")
   - Second status change request (back to "applied")
5. Check response bodies and status codes

**Expected Results**:
- ✅ First request: `PUT /api/jobs/:id` → 200 OK, status updated
- ✅ Second request (spam): `PUT /api/jobs/:id` → 200 OK, response includes `spamDetected: true` (or similar flag)
- ✅ Database query count: SELECT for spam check + UPDATE for legitimate changes only
- ✅ No 500 errors or exceptions

**Actual Results**: [Record actual behavior]

---

## Scenario 10: Visual Consistency (UX Check)

**Goal**: Verify UI maintains readability in both expanded and collapsed states

**Given**: Detail view in both states

**Steps**:
1. Select a job with long job description text
2. Test collapsed state (60%):
   - Check if text is readable
   - Verify scroll bar appears if content exceeds height
   - Check if all sections (description, history, documents) are accessible
3. Expand detail view (90%)
4. Test expanded state:
   - Verify more content visible without scrolling
   - Check if layout remains consistent
   - Verify no text overflow or cut-off

**Expected Results**:
- ✅ **Collapsed (60%)**: Text readable, scrollbar present, all sections accessible
- ✅ **Expanded (90%)**: More content visible, layout consistent, no overflow issues
- ✅ **Transition**: Smooth animation, no flickering or layout jumps
- ✅ **Responsive**: Works on different screen sizes (test 1920x1080, 1366x768)

**Actual Results**: [Record actual behavior]

---

## Summary Checklist

Use this checklist to verify all scenarios completed successfully:

### Status Spam Prevention
- [ ] Scenario 1: Rapid status return ignored (A→B→A)
- [ ] Scenario 2: Legitimate changes recorded (wait 3+ seconds)
- [ ] Scenario 3: Multiple rapid changes keep only first
- [ ] Scenario 7: Spam prevention after legitimate change
- [ ] Scenario 9: API responses correct (200 OK with spam flag)

### Detail View Expansion
- [ ] Scenario 4: Expand increases height 60% → 90%
- [ ] Scenario 5: Collapse returns height 90% → 60%
- [ ] Scenario 6: Expansion persists across job selections
- [ ] Scenario 8: Button disabled/hidden when no job selected
- [ ] Scenario 10: Visual consistency in both states

### Edge Cases
- [ ] Multi-click spam prevention works correctly
- [ ] Timestamps accurately recorded in status history
- [ ] No console errors during any scenario
- [ ] Performance acceptable (no lag during transitions)

---

## Troubleshooting

### Spam Prevention Not Working
**Symptom**: All status changes are recorded (duplicates appear)

**Possible Causes**:
1. Backend spam check not implemented
2. Threshold incorrectly set (not 3 seconds)
3. Timestamp comparison logic error

**Debug Steps**:
```bash
# Check backend logs for spam detection messages
npm run dev:backend
# Watch console for "Spam detected" or similar logs

# Test API directly
curl -X PUT http://localhost:3000/api/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "screening"}'
```

### Expansion Not Working
**Symptom**: Detail view height doesn't change when clicking expand

**Possible Causes**:
1. useState not updating correctly
2. CSS transition not applied
3. Button onClick not wired

**Debug Steps**:
```javascript
// Open browser console
// Check if state is changing
console.log('isExpanded:', isExpanded);

// Check computed styles
const detailContainer = document.querySelector('[data-detail-container]');
console.log('maxHeight:', getComputedStyle(detailContainer).maxHeight);
```

### Expansion Doesn't Persist
**Symptom**: Expansion resets when switching jobs

**Possible Causes**:
1. isExpanded state reset in useEffect
2. Component re-mounting incorrectly

**Debug Steps**:
- Add console.log in component to track state changes
- Check if useEffect has dependency on selectedJob (should NOT reset isExpanded)

---

## Performance Validation

### Backend Spam Check Performance
**Target**: <100ms per status update request

**Measurement**:
1. Open DevTools → Network tab
2. Perform status update
3. Check request timing (Timing tab in Network inspector)
4. Verify database query time

**Expected**:
- Total request time: <100ms
- Database query (MAX timestamp check): <10ms

### Frontend Transition Performance
**Target**: 60 FPS during expansion animation

**Measurement**:
1. Open DevTools → Performance tab
2. Start recording
3. Click expand button
4. Stop recording after transition completes
5. Check FPS graph (should stay at 60 FPS)

**Expected**:
- No frame drops during 0.3s transition
- CSS transition uses GPU acceleration (check Layers panel)

---

## Next Steps

After completing this quickstart:

1. **If all scenarios pass**:
   - [ ] Mark feature as complete
   - [ ] Document any edge cases discovered
   - [ ] Create PR for review

2. **If scenarios fail**:
   - [ ] Document failures in "Actual Results" sections
   - [ ] File issues for each failed scenario
   - [ ] Re-run quickstart after fixes

3. **Future Enhancements** (optional):
   - [ ] Add client-side toast notification for spam detection
   - [ ] Persist expansion preference in localStorage
   - [ ] Add keyboard shortcuts (e.g., Ctrl+E to expand)
   - [ ] Animate expansion with easing functions

---

**Feature Status**: ✅ Ready for implementation (all manual test scenarios documented)
