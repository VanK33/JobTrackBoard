# Quickstart: Welcome Homepage and Database Setup Testing Guide

## Prerequisites
- Development server running (`npm run dev`)
- Browser with DevTools open
- Clear localStorage before each test scenario
- Test with Chrome, Firefox, and Safari

---

## Test Scenario 1: First-Time User - Welcome Page Display ✅

### Goal
Verify welcome page is shown when no database configuration exists

### Setup
1. Clear localStorage: `localStorage.clear()`
2. Refresh page

### Steps
1. Navigate to application URL (`http://localhost:5173`)
2. Observe initial page load

### Validation
**MUST Display**:
- Application title and tagline
- Hero section with 2-3 feature cards
- Supabase recommendation box with:
  - Title: "Recommended: Use Supabase"
  - Brief instructions (1-2 steps)
  - Link to supabase.com
- **Primary Button**: "Get Started" (prominent styling)
- **Secondary Link**: "Custom Database Setup"

**MUST NOT Display**:
- Job dashboard
- Database settings page (unless user clicks secondary link)

### Pass Criteria
✅ Welcome page renders within 2 seconds
✅ All required elements present
✅ Minimalistic design matching existing pages
✅ No console errors

---

## Test Scenario 2: Interactive Tutorial Launch ✅

### Steps
1. On WelcomePage, click "Get Started" button
2. Observe tutorial overlay appears

### Validation
**Tutorial Overlay**:
- Semi-transparent backdrop covering entire screen
- Tooltip box displaying:
  - Title: "Step 1 of 4"
  - Content: "Welcome to Job Tracker! Track all your job applications..."
  - "Next" button (enabled)
  - "Previous" button (disabled on first step)
  - "Skip Tutorial" button
  - Close (X) button
- Tooltip positioned in center of screen (no target element for step 1)

**localStorage Check**:
```javascript
const onboardingState = JSON.parse(localStorage.getItem('onboardingState'))
// Expected: { tutorialStatus: 'in_progress', currentStep: 0, ... }
```

### Pass Criteria
✅ Tutorial launches on button click
✅ Step 1 content displayed correctly
✅ Navigation buttons visible and appropriately enabled/disabled
✅ localStorage updated with in_progress status

---

## Test Scenario 3: Tutorial Navigation (All Steps) ✅

### Steps
1. Launch tutorial (click "Get Started")
2. Click "Next" button 3 times to proceed through all 4 steps
3. Observe each step content and positioning

### Validation Per Step

**Step 1 (Center)**:
- Title: "Welcome to Job Tracker"
- Content: Application overview
- Position: Center of screen
- Previous: Disabled, Next: Enabled

**Step 2 (Features)**:
- Title: "Key Features"
- Content: 3 key features listed
- Position: Arrow pointing to feature cards
- Previous: Enabled, Next: Enabled

**Step 3 (Database Setup)**:
- Title: "Database Setup"
- Content: Supabase recommendation explanation
- Position: Arrow pointing to Supabase recommendation box
- Previous: Enabled, Next: Enabled

**Step 4 (Get Started)**:
- Title: "Get Started"
- Content: Instructions to click "Custom Database Setup"
- Position: Arrow pointing to setup button
- Previous: Enabled, Next: "Finish" (calls onComplete)

### Pass Criteria
✅ All 4 steps display correct content
✅ Tooltips positioned relative to target elements
✅ Progress indicator updates ("Step 2 of 4", etc.)
✅ Navigation buttons work correctly
✅ Arrows point to correct targets

---

## Test Scenario 4: Tutorial Completion ✅

### Steps
1. Complete tutorial (Step 4, click "Finish" or "Next")
2. Observe tutorial closes
3. Check localStorage

### Validation
**Behavior**:
- Tutorial overlay fades out (300ms animation)
- Returns to WelcomePage (tutorial dismissed)
- Can still click "Custom Database Setup" to proceed

**localStorage Check**:
```javascript
const onboardingState = JSON.parse(localStorage.getItem('onboardingState'))
// Expected: { tutorialStatus: 'completed', currentStep: undefined, databaseConfigured: false, ... }
```

### Pass Criteria
✅ Tutorial closes on completion
✅ Smooth fade-out animation (≤300ms)
✅ localStorage updated to 'completed'
✅ User can still proceed to database setup

---

## Test Scenario 5: Tutorial Skip ✅

### Steps
1. Launch tutorial
2. Click "Skip Tutorial" button (on any step)
3. Observe tutorial closes immediately

### Validation
**Behavior**:
- Tutorial closes without completing all steps
- Returns to WelcomePage

**localStorage Check**:
```javascript
const onboardingState = JSON.parse(localStorage.getItem('onboardingState'))
// Expected: { tutorialStatus: 'completed', currentStep: undefined, ... }
```

### Pass Criteria
✅ Skip button works from any step
✅ Tutorial marked as completed (not in_progress)
✅ No errors in console

---

## Test Scenario 6: Tutorial Dismissal (Escape Key) ✅

### Steps
1. Launch tutorial
2. Press "Escape" key
3. Observe tutorial closes

### Validation
Same as Scenario 5 (Skip)

### Pass Criteria
✅ Escape key closes tutorial
✅ localStorage updated correctly
✅ Accessible via keyboard

---

## Test Scenario 7: Custom Database Setup Navigation ✅

### Steps
1. On WelcomePage, click "Custom Database Setup" link (without starting tutorial)
2. Observe navigation to DatabaseSettings page

### Validation
**DatabaseSettings Page**:
- Simplified layout (no recommended providers section)
- Connection string input visible (pre-selected/default)
- Connection string history dropdown (if exists)
- SSL checkbox (checked by default)
- "Test Connection" and "Save Configuration" buttons
- "← Back" button to return to WelcomePage

### Pass Criteria
✅ Navigation works
✅ Simplified database page shown
✅ No provider recommendations visible
✅ Connection string input is default option

---

## Test Scenario 8: Database Configuration - Successful Connection ✅

### Steps
1. Navigate to DatabaseSettings (via "Custom Database Setup")
2. Enter valid connection string:
   ```
   postgresql://postgres:password@db.example.supabase.co:5432/postgres
   ```
3. Click "Test Connection"
4. Wait for validation
5. Observe success message
6. Navigate to dashboard

### Validation
**During Test**:
- "Testing..." button state (disabled)
- No errors in console

**After Success**:
- Success message: "Connection successful!"
- Green status indicator
- Database initialized prompt (if tables not yet created)
- Can click "Back" or navigate to dashboard

**localStorage Check**:
```javascript
const dbConfig = JSON.parse(localStorage.getItem('databaseConfig'))
// Expected: { type: 'postgresql', connectionString: '...', ssl: true }

const onboardingState = JSON.parse(localStorage.getItem('onboardingState'))
// Expected: { databaseConfigured: true, ... }
```

### Pass Criteria
✅ Connection test succeeds
✅ DatabaseConfig saved to localStorage
✅ OnboardingState.databaseConfigured = true
✅ Success feedback shown

---

## Test Scenario 9: Returning User - Skip Welcome Page ✅

### Setup
1. Complete Scenario 8 (database configured)
2. Refresh page

### Steps
1. Navigate to application URL
2. Observe initial page load

### Validation
**Behavior**:
- Welcome page is **NOT** shown
- Application goes directly to JobDashboard
- Database connection is active

**localStorage Check**:
```javascript
const onboardingState = JSON.parse(localStorage.getItem('onboardingState'))
// Expected: { databaseConfigured: true, tutorialStatus: 'completed', ... }
```

### Pass Criteria
✅ Welcome page bypassed
✅ JobDashboard shown immediately
✅ No delay or flicker
✅ No unnecessary API calls

---

## Test Scenario 10: Settings Menu - Database Configuration ✅

### Steps
1. On JobDashboard (as returning user)
2. Click settings icon (top-right corner)
3. Click "Database Configuration" menu item
4. Observe navigation to DatabaseSettings

### Validation
**Settings Menu**:
- Appears on click (dropdown)
- Contains "Database Configuration" option
- Contains "View Tutorial" option
- Closes on click outside
- Closes on Escape key

**DatabaseSettings Page**:
- Shows current configuration (pre-filled)
- Can modify and re-test connection
- "← Back" button returns to JobDashboard

### Pass Criteria
✅ Settings menu accessible
✅ Navigation works
✅ Current config pre-filled
✅ Can modify database settings

---

## Test Scenario 11: Settings Menu - View Tutorial (Replay) ✅

### Steps
1. On JobDashboard
2. Click settings icon
3. Click "View Tutorial" menu item
4. Observe tutorial overlay on dashboard

### Validation
**Tutorial Overlay**:
- Appears over JobDashboard (not WelcomePage)
- Same 4 steps as initial tutorial
- Can navigate through steps
- Closing tutorial returns to JobDashboard (no navigation)

**localStorage Check**:
```javascript
// OnboardingState should NOT change (tutorial replay doesn't update state)
```

### Pass Criteria
✅ Tutorial replays on demand
✅ Overlay shown over dashboard
✅ No state changes in localStorage
✅ Closing returns to dashboard

---

## Test Scenario 12: Tutorial Interruption & Resume ✅

### Steps
1. Clear localStorage
2. Launch tutorial on WelcomePage
3. Navigate to step 2 or 3
4. Close browser tab (or refresh page)
5. Reopen application

### Validation
**Behavior**:
- WelcomePage shows (database not configured)
- Tutorial does NOT auto-launch
- User can click "Get Started" to resume

**localStorage Check**:
```javascript
const onboardingState = JSON.parse(localStorage.getItem('onboardingState'))
// Expected: { tutorialStatus: 'in_progress', currentStep: 2, databaseConfigured: false, ... }
```

**Resume Tutorial** (optional enhancement):
- If auto-resume implemented: Tutorial launches at saved step
- If not: User clicks "Get Started", tutorial starts from step 0

### Pass Criteria
✅ Tutorial progress persisted
✅ Application state recovers gracefully
✅ No errors on reload
✅ User can complete tutorial from where they left off (if implemented) or restart

---

## Test Scenario 13: Database Selection - Connection Failure ✅

### Steps
1. Navigate to DatabaseSettings
2. Enter invalid connection string: `postgresql://invalid:invalid@nonexistent:5432/db`
3. Click "Test Connection"
4. Observe error handling

### Validation
**During Test**:
- "Testing..." button state

**After Failure**:
- Error message displayed: "Connection failed" or specific error
- Red status indicator
- Connection string not saved to localStorage
- User can retry with different credentials

**localStorage Check**:
```javascript
const onboardingState = JSON.parse(localStorage.getItem('onboardingState'))
// Expected: { databaseConfigured: false, ... }
```

### Pass Criteria
✅ Error message shown
✅ No save to localStorage
✅ User can retry
✅ No crashes or unhandled errors

---

## Test Scenario 14: Connection String History ✅

### Steps
1. Navigate to DatabaseSettings
2. Enter connection string A, test (success or failure)
3. Enter connection string B, test
4. Enter connection string C, test
5. Refresh page
6. Navigate to DatabaseSettings
7. Check connection string history dropdown

### Validation
**History Dropdown**:
- Shows up to 5 recent connection strings
- Most recent at top
- Selecting a string autofills input
- Duplicates removed (keeps most recent)

**localStorage Check**:
```javascript
const history = JSON.parse(localStorage.getItem('databaseConnectionHistory'))
// Expected: ['C', 'B', 'A'] (most recent first)
```

### Pass Criteria
✅ History persisted across sessions
✅ Max 5 entries maintained
✅ Selecting autofills input
✅ No duplicates

---

## Test Scenario 15: Empty State - No Tutorial, No Database ✅

### Steps
1. Clear localStorage
2. Navigate to application
3. Do NOT click "Get Started"
4. Click "Custom Database Setup" directly

### Validation
**Behavior**:
- WelcomePage → DatabaseSettings navigation works
- Can configure database without ever seeing tutorial
- OnboardingState: `{ tutorialStatus: 'not_started', databaseConfigured: false }`

### Pass Criteria
✅ Tutorial is optional (not forced)
✅ User can skip directly to setup
✅ No blocking behavior

---

## Test Scenario 16: Accessibility - Keyboard Navigation ✅

### Steps
1. On WelcomePage, use Tab key to navigate
2. Expected tab order:
   - Get Started button
   - Custom Database Setup link
3. Press Enter on "Get Started"
4. Tutorial launches
5. Use Tab key within tutorial:
   - Previous button
   - Next button
   - Skip Tutorial button
   - Close (X) button
6. Press Escape to close tutorial

### Validation
- All interactive elements reachable via Tab
- Enter/Space activates buttons
- Escape closes tutorial
- Focus visible (outline or ring)
- No focus traps (unless intentional in dialog)

### Pass Criteria
✅ Full keyboard navigation
✅ Logical tab order
✅ Escape key works
✅ Focus indicators visible

---

## Test Scenario 17: Accessibility - Screen Reader ✅

### Setup
Enable screen reader (VoiceOver on macOS, NVDA on Windows)

### Steps
1. Navigate to WelcomePage
2. Use screen reader to explore page
3. Launch tutorial
4. Listen to step announcements

### Validation
**Announcements**:
- Page title announced
- Button labels clear: "Get Started button", "Custom Database Setup link"
- Tutorial step changes announced: "Step 2 of 4"
- Step content announced
- Button purposes clear: "Next step button", "Skip tutorial button"

**ARIA Attributes**:
- Tutorial has `role="dialog"`
- `aria-labelledby` and `aria-describedby` present
- `aria-live="polite"` for step changes

### Pass Criteria
✅ All content accessible
✅ Step changes announced
✅ Button purposes clear
✅ No ARIA errors in DevTools

---

## Test Scenario 18: Mobile Responsive ✅

### Setup
Use browser DevTools to simulate mobile viewport (375px width)

### Steps
1. Navigate to WelcomePage
2. Observe layout
3. Launch tutorial
4. Test navigation

### Validation
**WelcomePage**:
- Feature cards stack vertically (no horizontal overflow)
- Buttons large enough for touch (min 44×44px)
- Text readable without zooming

**Tutorial**:
- Tooltip fits on screen (no overflow)
- Buttons touch-friendly
- Close button accessible

### Pass Criteria
✅ No horizontal scrolling
✅ Touch targets ≥44×44px
✅ Text readable
✅ Tutorial usable on mobile

---

## Test Scenario 19: Browser Compatibility ✅

### Browsers to Test
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Steps
Run Scenarios 1-9 in each browser

### Validation
- All features work identically
- localStorage support
- CSS styling consistent
- No browser-specific errors

### Pass Criteria
✅ Works in all 3 browsers
✅ No cross-browser issues
✅ Graceful degradation if localStorage unavailable

---

## Test Scenario 20: Performance Validation ✅

### Steps
1. Open browser DevTools (Performance tab)
2. Start recording
3. Navigate to WelcomePage
4. Launch tutorial
5. Navigate through steps
6. Stop recording

### Validation
**Metrics**:
- WelcomePage initial render: <100ms
- Tutorial launch: <50ms
- Step transitions: <50ms
- Opacity fade animation: 300ms (smooth, no jank)
- localStorage read/write: <5ms

**Network**:
- No blocking API calls on WelcomePage
- No unnecessary requests

### Pass Criteria
✅ All operations within target times
✅ Smooth animations (60 FPS)
✅ No UI lag

---

## Edge Case Testing

### Edge Case 1: localStorage Quota Exceeded
**Scenario**: Fill localStorage to capacity (unlikely, but test gracefully)
**Expected**: Fallback to in-memory state, show warning

### Edge Case 2: localStorage Disabled
**Scenario**: User has disabled localStorage (privacy mode)
**Expected**: Application shows error: "localStorage required for this application"

### Edge Case 3: Corrupted OnboardingState
**Scenario**: Manually corrupt localStorage data
**Expected**: Reinitialize to default state, log warning

### Edge Case 4: Tutorial Target Element Not Found
**Scenario**: CSS selector in tutorial step doesn't match any element
**Expected**: Tooltip positioned at center of screen (fallback)

---

## Manual Testing Checklist

Execute all scenarios and check off:

**Welcome Page & Tutorial**:
- [ ] Scenario 1: Welcome page displays for first-time users
- [ ] Scenario 2: Tutorial launches on "Get Started"
- [ ] Scenario 3: All 4 tutorial steps navigate correctly
- [ ] Scenario 4: Tutorial completion updates state
- [ ] Scenario 5: Skip button works
- [ ] Scenario 6: Escape key closes tutorial
- [ ] Scenario 12: Tutorial interruption & resume

**Database Setup**:
- [ ] Scenario 7: Custom setup navigation
- [ ] Scenario 8: Successful database connection
- [ ] Scenario 13: Connection failure handling
- [ ] Scenario 14: Connection string history

**Returning Users**:
- [ ] Scenario 9: Welcome page skipped for returning users
- [ ] Scenario 10: Settings menu → Database Configuration
- [ ] Scenario 11: Settings menu → View Tutorial (replay)

**Accessibility**:
- [ ] Scenario 16: Keyboard navigation
- [ ] Scenario 17: Screen reader support
- [ ] Scenario 18: Mobile responsive

**Quality**:
- [ ] Scenario 19: Browser compatibility (3 browsers)
- [ ] Scenario 20: Performance validation
- [ ] Edge cases: localStorage errors, corrupted data

---

## Success Criteria

**All scenarios must pass with expected results**

Key validations:
1. ✅ Welcome page shown for first-time users
2. ✅ Interactive tutorial works with all 4 steps
3. ✅ Tutorial can be completed, skipped, or resumed
4. ✅ Database setup simplified (no recommendations on setup page)
5. ✅ Returning users skip welcome page
6. ✅ Settings menu provides access to database config and tutorial replay
7. ✅ Keyboard and screen reader accessible
8. ✅ Mobile responsive (viewport ≥ 320px)
9. ✅ Performance targets met (<2s page load, <50ms operations)
10. ✅ No regressions in existing features

---

## Debugging Tips

### If welcome page not showing:
- Check localStorage: `localStorage.getItem('databaseConfig')`
- If exists: Clear it to test first-time user flow
- Check console for routing errors

### If tutorial not launching:
- Check `onGetStarted` callback is defined
- Check `GuidedTutorial` component receives `isActive: true`
- Verify `tutorialSteps` array is not empty

### If tutorial positioning wrong:
- Check CSS selector in `step.target` matches element
- Inspect element positioning with DevTools
- Verify `position: 'relative'` or 'absolute' on target elements

### If localStorage not persisting:
- Check browser privacy settings (localStorage enabled?)
- Look for quota errors in console
- Verify JSON.stringify/parse not throwing errors

### If navigation broken:
- Check `onNavigateBack` and `onNavigateToSettings` props passed correctly
- Verify routing logic in `App.tsx`
- Check for state management issues (useState not updating)

---

## Automated Test Commands

```bash
# Run dev server
npm run dev

# Open browser
open http://localhost:5173

# Check localStorage in Console
localStorage.getItem('onboardingState')
localStorage.getItem('databaseConfig')
localStorage.getItem('databaseConnectionHistory')

# Clear localStorage for testing
localStorage.clear()

# Simulate mobile viewport (Chrome DevTools)
# Toggle device toolbar: Cmd+Shift+M (macOS) or Ctrl+Shift+M (Windows)
```

---

## Test Data

### Valid Connection Strings
```
# Supabase
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Neon
postgresql://[USER]:[PASSWORD]@[HOST].neon.tech:5432/[DBNAME]

# Local PostgreSQL
postgresql://postgres:password@localhost:5432/jobtracker
```

### Invalid Connection Strings (for error testing)
```
# Missing credentials
postgresql://localhost:5432/db

# Wrong port
postgresql://user:pass@host:9999/db

# Non-existent host
postgresql://user:pass@nonexistent.example.com:5432/db
```
