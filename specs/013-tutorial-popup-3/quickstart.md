# Quickstart: Manual Testing Guide

**Feature**: Interactive Tutorial Carousel (013-tutorial-popup-3)
**Date**: 2025-10-13
**Status**: Ready for implementation testing

## Overview
This document provides step-by-step manual test scenarios for validating the tutorial carousel feature. All tests should pass before considering the feature complete.

---

## Prerequisites

**Development Environment**:
```bash
cd /Users/vankee/Downloads/job_seek_app
npm run dev:frontend
```

**Browser**: Open http://localhost:5173 (or configured dev server port)

**Tools**:
- Browser DevTools (F12)
- localStorage inspector (Application tab → Local Storage)

---

## Test Suite

### Test 1: First-Time User Auto-Trigger

**Objective**: Verify tutorial automatically opens on first login (FR-012)

**Steps**:
1. Open browser DevTools (F12) → Application tab → Local Storage
2. Clear localStorage: Right-click → Clear or run `localStorage.clear()` in console
3. Refresh the page (F5)
4. **Verify**: Tutorial modal opens automatically
5. **Verify**: Modal displays Step 1 content:
   - Image: 500x500px placeholder with "Step 1" text
   - Description: 1-2 sentences below image
   - Progress indicator: "Step 1 of 5"
   - Buttons: "Next" visible, "Previous" hidden
   - Close button (X) visible in top-right

**Expected Result**: ✅ Tutorial opens automatically on first visit

**Cleanup**: Navigate through tutorial and close it

---

### Test 2: No Auto-Trigger on Subsequent Logins

**Objective**: Verify tutorial does NOT auto-open after first view (FR-012b)

**Prerequisites**: Complete Test 1 (tutorial has been seen)

**Steps**:
1. Verify localStorage contains `tutorial_seen = "true"`:
   - DevTools → Application → Local Storage
   - Look for key: `tutorial_seen`, value: `true`
2. Refresh the page (F5)
3. **Verify**: Tutorial modal does NOT open automatically
4. **Verify**: Application loads normally without tutorial

**Expected Result**: ✅ Tutorial does not re-trigger on subsequent visits

---

### Test 3: Manual Access via Tutorial Button

**Objective**: Verify users can manually open tutorial anytime (FR-012a)

**Steps**:
1. Locate the Tutorial button in the bottom-right corner of the screen
   - Should be in the existing "Supabase button area"
2. Click the Tutorial button
3. **Verify**: Tutorial modal opens
4. **Verify**: Tutorial starts at Step 1 (not where user left off)
5. Close the tutorial (X button)
6. Click Tutorial button again
7. **Verify**: Tutorial reopens at Step 1 (FR-014: no progress persistence)

**Expected Result**: ✅ Manual trigger always starts from Step 1

---

### Test 4: Navigation - Forward Through All Steps

**Objective**: Verify Next button advances through all 5 steps (FR-005)

**Steps**:
1. Open tutorial (manual or auto-trigger)
2. **Step 1**: Verify "Step 1 of 5", click "Next"
3. **Step 2**: Verify "Step 2 of 5", click "Next"
4. **Step 3**: Verify "Step 3 of 5", click "Next"
5. **Step 4**: Verify "Step 4 of 5", click "Next"
6. **Step 5**: Verify "Step 5 of 5"
   - **Verify**: "Next" button is replaced with "Finish" button (FR-009)
   - **Verify**: "Previous" button visible

**Expected Result**: ✅ All 5 steps accessible, Finish button on last step

**Checklist per Step**:
- [ ] Image changes (different "Step X" placeholder)
- [ ] Description text changes
- [ ] Progress indicator updates ("Step X of 5")
- [ ] Layout: Image above text (vertical layout, FR-004)

---

### Test 5: Navigation - Backward Through Steps

**Objective**: Verify Previous button returns to earlier steps (FR-006)

**Steps**:
1. Open tutorial and navigate to Step 5 (see Test 4)
2. Click "Previous" → Verify on Step 4
3. Click "Previous" → Verify on Step 3
4. Click "Previous" → Verify on Step 2
5. Click "Previous" → Verify on Step 1
6. **Verify**: "Previous" button is hidden on Step 1 (FR-008)

**Expected Result**: ✅ Previous button works, hidden on first step

**Checklist**:
- [ ] Progress indicator decrements correctly
- [ ] Image and text revert to previous step content
- [ ] "Finish" button reverts to "Next" when leaving Step 5

---

### Test 6: Boundary Condition - First Step

**Objective**: Verify Previous button behavior on Step 1 (FR-008)

**Steps**:
1. Open tutorial (starts at Step 1)
2. **Verify**: "Previous" button is NOT visible
   - Should be hidden (conditional rendering) or disabled
3. **Verify**: "Next" button is visible and clickable
4. **Verify**: Progress indicator shows "Step 1 of 5"

**Expected Result**: ✅ No Previous button on Step 1

---

### Test 7: Boundary Condition - Last Step

**Objective**: Verify Finish button behavior on Step 5 (FR-009, FR-010)

**Steps**:
1. Navigate to Step 5
2. **Verify**: "Next" button is replaced with "Finish" button
3. **Verify**: "Previous" button is visible
4. **Verify**: Progress indicator shows "Step 5 of 5"
5. Click "Finish"
6. **Verify**: Modal closes
7. **Verify**: localStorage updated: `tutorial_seen = "true"`

**Expected Result**: ✅ Finish button closes modal and sets flag

---

### Test 8: Early Close - X Button

**Objective**: Verify X button closes tutorial at any step (FR-013)

**Steps**:
1. Open tutorial
2. Navigate to Step 3 (mid-tutorial)
3. Click the X button (top-right corner)
4. **Verify**: Modal closes immediately
5. Reopen tutorial (manual button)
6. **Verify**: Tutorial starts at Step 1, not Step 3 (FR-014)

**Expected Result**: ✅ X button closes modal, no progress saved

---

### Test 9: Early Close - Overlay Click

**Objective**: Verify clicking outside modal closes tutorial (FR-013a)

**Steps**:
1. Open tutorial
2. Navigate to Step 4
3. Click outside the modal (on the dark overlay/backdrop)
4. **Verify**: Modal closes immediately
5. Reopen tutorial
6. **Verify**: Tutorial starts at Step 1, not Step 4 (FR-014)

**Expected Result**: ✅ Overlay click closes modal, no progress saved

---

### Test 10: Keyboard Navigation - Escape Key

**Objective**: Verify Escape key closes tutorial (existing feature)

**Steps**:
1. Open tutorial
2. Navigate to Step 2
3. Press Escape key
4. **Verify**: Modal closes
5. Reopen tutorial
6. **Verify**: Starts at Step 1

**Expected Result**: ✅ Escape key works (existing functionality preserved)

---

### Test 11: Progress Indicator Accuracy

**Objective**: Verify "Step X of 5" updates correctly (FR-007)

**Steps**:
1. Open tutorial (Step 1)
2. **Verify**: "Step 1 of 5" displayed
3. Click Next → **Verify**: "Step 2 of 5"
4. Click Next → **Verify**: "Step 3 of 5"
5. Click Previous → **Verify**: "Step 2 of 5"
6. Navigate to Step 5 → **Verify**: "Step 5 of 5"

**Expected Result**: ✅ Progress indicator always accurate

---

### Test 12: Image Dimensions

**Objective**: Verify placeholder images are 500x500px (FR-003)

**Steps**:
1. Open tutorial (any step)
2. Right-click on the placeholder image → Inspect Element
3. In DevTools Elements panel, check `<img>` or `<svg>` dimensions
4. **Verify**: Width = 500px, Height = 500px

**Alternative**: Use DevTools ruler/measure tool to verify dimensions

**Expected Result**: ✅ All images are exactly 500x500px

---

### Test 13: Vertical Layout (Image Above Text)

**Objective**: Verify text positioned below image (FR-004)

**Steps**:
1. Open tutorial (any step)
2. **Verify**: Visual layout is vertical:
   - Image at the top
   - Description text below the image
   - Not side-by-side (horizontal layout)
3. Inspect with DevTools if unsure (flexbox direction or div ordering)

**Expected Result**: ✅ Image-text layout is vertical

---

### Test 14: localStorage Persistence Across Browser Restarts

**Objective**: Verify "seen" flag survives browser restart (FR-012b)

**Steps**:
1. Open tutorial and complete it (click Finish on Step 5)
2. Verify localStorage: `tutorial_seen = "true"`
3. Close the browser completely (quit application)
4. Reopen browser and navigate to the app
5. **Verify**: Tutorial does NOT auto-trigger
6. **Verify**: localStorage still contains `tutorial_seen = "true"`

**Expected Result**: ✅ Flag persists across sessions

---

### Test 15: Multiple Manual Opens

**Objective**: Verify tutorial can be opened multiple times via button

**Steps**:
1. Click Tutorial button → Modal opens
2. Close modal (X button)
3. Click Tutorial button again → Modal opens
4. Close modal (overlay click)
5. Click Tutorial button again → Modal opens
6. Navigate to Step 5, click Finish
7. Click Tutorial button again → Modal opens

**Expected Result**: ✅ Tutorial button always functional, always starts Step 1

---

## Test Summary Checklist

### Functional Requirements Coverage

- [ ] **FR-001**: Tutorial popup displays step-by-step content
- [ ] **FR-002**: Exactly 5 tutorial steps supported
- [ ] **FR-003**: Images are 500x500 pixels
- [ ] **FR-004**: Text positioned below image (vertical layout)
- [ ] **FR-005**: Next button advances to next step
- [ ] **FR-006**: Previous button returns to previous step
- [ ] **FR-007**: Progress indicator shows "Step X of 5"
- [ ] **FR-008**: Previous button hidden on Step 1
- [ ] **FR-009**: Finish button replaces Next on Step 5
- [ ] **FR-010**: Finish button closes modal
- [ ] **FR-011**: Placeholder images used
- [ ] **FR-012**: Auto-trigger on first login
- [ ] **FR-012a**: Manual trigger button (bottom-right)
- [ ] **FR-012b**: "Seen" flag prevents re-trigger
- [ ] **FR-013**: X button closes modal early
- [ ] **FR-013a**: Overlay click closes modal early
- [ ] **FR-014**: No progress persistence (always start Step 1)

### Edge Cases Verified

- [ ] First-time user experience (auto-trigger)
- [ ] Returning user (no auto-trigger)
- [ ] Boundary: Step 1 (no Previous button)
- [ ] Boundary: Step 5 (Finish button)
- [ ] Early close preserves no state
- [ ] localStorage survives browser restart
- [ ] Multiple manual opens work correctly

---

## Debugging Tips

**Tutorial Not Auto-Opening**:
1. Check localStorage: `tutorial_seen` should be missing or `"false"`
2. Verify auto-trigger logic in App component
3. Check console for JavaScript errors

**Navigation Not Working**:
1. Open DevTools console, check for errors
2. Verify `currentStepIndex` state updates (use React DevTools)
3. Check button onClick handlers

**localStorage Not Persisting**:
1. Verify browser is not in incognito/private mode
2. Check browser localStorage quota (should have plenty of space)
3. Try different browser to rule out browser-specific issues

**Images Not Displaying**:
1. Inspect `<img>` src attribute → should be data URI starting with `data:image/svg+xml`
2. Verify `tutorialData.ts` exports correct placeholder URIs
3. Check browser console for image loading errors

---

## Acceptance Criteria

**All tests must pass** before feature is considered complete:
- ✅ 15 manual test scenarios pass
- ✅ All 17 functional requirements verified
- ✅ No console errors during testing
- ✅ localStorage behavior correct
- ✅ User experience smooth and intuitive

**Sign-off**: Feature complete when all checkboxes marked ✅

---

## Next Steps After Testing

1. If tests pass → Feature ready for production
2. If tests fail → Return to implementation, fix issues, retest
3. Document any discovered edge cases not in original spec
4. Update CLAUDE.md with any lessons learned

**End of Quickstart Guide**
