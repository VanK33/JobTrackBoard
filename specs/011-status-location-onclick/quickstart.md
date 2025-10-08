# Quickstart: Hover-Based Filter Interaction

**Feature**: 011-status-location-onclick
**Date**: 2025-10-08
**Purpose**: Manual validation guide for hover-based filter interaction

## Prerequisites

- ✅ Development environment running: `npm run dev`
- ✅ Browser open: http://localhost:5173 (or port shown in terminal)
- ✅ JobDashboard page loaded with test data (jobs visible)

## Test Scenarios

### Scenario 1: Hover Opens Filter Panel (FR-002)

**Objective**: Verify hover trigger opens filter panel immediately

**Steps**:
1. Navigate to JobDashboard page
2. Move mouse cursor over the **"Status"** button (do not click)
3. Observe panel appearance

**Expected**:
- ✅ Status filter panel appears **immediately** when cursor enters button area
- ✅ Panel displays checkbox list (interested, applied, interviewing, offered, rejected)
- ✅ Panel remains visible while cursor stays over button

**Acceptance**: FR-002 satisfied if panel appears on hover

---

### Scenario 2: Panel Stays Open During Checkbox Interaction (FR-002 Sticky Selection)

**Objective**: Verify "sticky selection" behavior - panel remains open while interacting with checkboxes

**Steps**:
1. Hover over **"Status"** button (panel opens)
2. Move cursor from button **into the filter panel** area
3. Click a checkbox (e.g., "Applied")
4. Click another checkbox (e.g., "Interviewing")
5. Observe panel behavior

**Expected**:
- ✅ Panel **remains visible** when cursor moves from button to panel
- ✅ Checkboxes are clickable
- ✅ Job list updates immediately with filter applied
- ✅ Panel does **not close** while interacting with checkboxes

**Acceptance**: FR-002 satisfied if panel stays open during checkbox interaction

---

### Scenario 3: Panel Closes When Mouse Leaves Region (FR-004)

**Objective**: Verify automatic close when mouse exits button+panel compound region

**Steps**:
1. Hover over **"Status"** button (panel opens)
2. Move cursor **away from both** button and panel (e.g., to empty space in header)
3. Observe panel behavior

**Expected**:
- ✅ Panel **closes automatically** when cursor leaves button+panel region
- ✅ Close happens immediately (no delay/lag)
- ✅ Selected filters remain applied (job list stays filtered)

**Acceptance**: FR-004 satisfied if panel closes on region exit

---

### Scenario 4: Mutual Exclusion - Only One Panel at a Time (FR-001, FR-003)

**Objective**: Verify only one filter panel can be visible at a time

**Steps**:
1. Hover over **"Status"** button (Status panel opens)
2. Without closing Status panel, move cursor to **"Location"** button
3. Observe both panels

**Expected**:
- ✅ **Status panel closes** automatically when hovering Location button
- ✅ **Location panel opens** immediately
- ✅ Only **one panel visible** at any moment
- ✅ No overlap or visual conflict between panels

**Acceptance**: FR-001 and FR-003 satisfied if panels mutually exclude each other

---

### Scenario 5: Rapid Hover Switching

**Objective**: Verify smooth transitions when rapidly hovering between filters

**Steps**:
1. Quickly hover Status → Location → Status → Location (rapid succession)
2. Observe panel transitions

**Expected**:
- ✅ Panels switch smoothly without flicker
- ✅ No "stuck" open panels
- ✅ No performance lag or delayed updates
- ✅ Final panel matches last button hovered

**Acceptance**: Handles rapid interaction gracefully

---

### Scenario 6: Filter Selections Persist (FR-006)

**Objective**: Verify filter checkbox selections persist across panel open/close cycles

**Steps**:
1. Hover **"Status"** button (opens panel)
2. Check "Applied" and "Interviewing" checkboxes
3. Move cursor away (panel closes)
4. Verify job list shows only Applied/Interviewing jobs
5. Hover **"Status"** button again (re-open panel)
6. Observe checkbox states

**Expected**:
- ✅ Job list remains filtered after panel closes
- ✅ When panel re-opens, "Applied" and "Interviewing" checkboxes **remain checked**
- ✅ Filter state **not lost** by closing panel

**Acceptance**: FR-006 satisfied if selections persist

---

### Scenario 7: Mobile/Touch Fallback (Accessibility)

**Objective**: Verify onClick fallback works on touch devices

**Steps**:
1. Open browser DevTools
2. Enable device emulation (e.g., iPhone 14)
3. **Tap** (not hover) the **"Status"** button
4. Observe panel behavior
5. Tap button again

**Expected**:
- ✅ Panel **toggles open** on first tap
- ✅ Panel **toggles closed** on second tap
- ✅ Touch interaction works (no broken hover-only behavior)

**Acceptance**: onClick fallback functional for touch devices

---

### Scenario 8: Visual Feedback Unchanged (FR-007)

**Objective**: Verify existing active filter indicators preserved

**Steps**:
1. Apply filters (e.g., Status: "Applied", Location: "Remote")
2. Observe filter button appearance
3. Compare to pre-refactoring behavior

**Expected**:
- ✅ Active filter buttons show existing visual indicators (e.g., badge, color, count)
- ✅ No changes to visual feedback system
- ✅ Users can still identify which filters are active

**Acceptance**: FR-007 satisfied if visual feedback unchanged

---

### Scenario 9: Edge Case - Mouse Path Anomaly

**Objective**: Verify behavior when mouse moves unexpectedly (e.g., Status button → Location panel directly)

**Steps**:
1. Hover **"Status"** button (Status panel opens)
2. Move cursor **directly to Location panel** (skip Location button)
3. Observe panel behavior

**Expected**:
- ✅ Status panel **closes** (mouse left Status region)
- ✅ Location panel does **not open** (button not hovered)
- ✅ No panels visible (correct state: `openFilter = null`)

**Acceptance**: Handles abnormal mouse paths gracefully

---

## Regression Testing

### Verify Unchanged Functionality

**Filter Logic**:
- ✅ Multi-select still works (multiple statuses/locations selectable)
- ✅ Job list updates in real-time as filters change
- ✅ Clear filters button still works
- ✅ Filter combinations work (Status + Location together)

**Layout**:
- ✅ Filter panel positioning unchanged (absolute positioning)
- ✅ Panel width/height unchanged
- ✅ Panel z-index correct (appears above job cards)
- ✅ No visual regressions (spacing, colors, fonts)

**Performance**:
- ✅ No console errors
- ✅ No memory leaks (check DevTools after 10+ panel open/close cycles)
- ✅ Smooth hover response (<50ms)

---

## Pass/Fail Criteria

### Pass Criteria (All Must Pass)
- [x] Scenario 1: Hover opens panel immediately
- [x] Scenario 2: Panel stays open during checkbox interaction
- [x] Scenario 3: Panel closes on mouse leave
- [x] Scenario 4: Only one panel visible at a time
- [x] Scenario 5: Rapid hover switching works smoothly
- [x] Scenario 6: Filter selections persist across open/close
- [x] Scenario 7: Touch/tap fallback functional
- [x] Scenario 8: Visual feedback unchanged
- [x] Scenario 9: Handles edge case mouse paths
- [x] Regression: All existing filter functionality works

### Fail Criteria (Any Fails Test)
- ❌ Panel doesn't open on hover
- ❌ Panel closes when trying to click checkboxes
- ❌ Both panels can be open simultaneously
- ❌ Panel doesn't close when mouse leaves
- ❌ Filter selections reset when closing panel
- ❌ Touch devices broken (no way to open panel)
- ❌ Visual regressions or layout issues
- ❌ Console errors during interaction
- ❌ Performance degradation (lag, flicker)

---

## Testing Checklist

**Browser Testing**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Device Testing**:
- [ ] Desktop (1920x1080)
- [ ] Tablet (iPad - 1024x768)
- [ ] Mobile (iPhone 14 - 390x844)

**Accessibility**:
- [ ] Keyboard navigation (Tab to button, Enter to toggle)
- [ ] Screen reader announces button and panel correctly

---

## Troubleshooting

### Issue: Panel doesn't open on hover
**Check**:
- `onMouseEnter` handler attached to button
- `setOpenFilter('status')` called correctly
- React Developer Tools: verify state change

### Issue: Panel closes immediately when moving to checkboxes
**Check**:
- Container `<div>` wraps both button and panel
- `onMouseLeave` only on container (not button or panel individually)
- Panel positioned inside container (DOM hierarchy)

### Issue: Both panels open at once
**Check**:
- Single `openFilter` state variable used (not two booleans)
- Conditionals use `openFilter === 'status'` (not separate boolean)

### Issue: Touch devices broken
**Check**:
- `onClick` handler still present on button
- Toggle logic: `openFilter === 'status' ? null : 'status'`

---

## Success Metrics

**Quantitative**:
- ✅ Zero console errors during 20 panel open/close cycles
- ✅ Panel response time <50ms (measured in DevTools Performance tab)
- ✅ No memory leaks (heap snapshot before/after identical)

**Qualitative**:
- ✅ Interaction feels natural and intuitive
- ✅ No visual glitches or flicker
- ✅ Mobile experience not degraded

---

## Sign-off

**Tested By**: _____________
**Date**: _____________
**Result**: ☐ PASS  ☐ FAIL
**Notes**: _____________________________________________
