# Quickstart: Database Settings UI Improvements Testing

**Feature**: 008-1-use-connection
**Date**: 2025-10-07
**Purpose**: Manual test scenarios to validate all functional requirements

## Prerequisites

1. **Development Environment Running**:
   ```bash
   npm run dev
   # Frontend: http://localhost:5173
   # Backend: http://localhost:3000
   ```

2. **Browser DevTools Open**: Console + Application/Storage tabs for localStorage inspection

3. **Test Data**: Have a valid Supabase connection string ready (or use test data below)
   ```
   Example: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

## Test Scenarios

### Scenario 1: First-Time User - Database Initialization Title

**Requirement**: FR-002 - Display "Database Initialization" when no config exists

**Setup**:
1. Open browser DevTools → Application/Storage → Local Storage
2. Clear `databaseConfig` key (or clear all localStorage)
3. Refresh page: `http://localhost:5173`

**Steps**:
1. Navigate to database settings page
2. Observe page title

**Expected Result**:
- ✅ Page title reads "Database Initialization" (NOT "Database Settings")

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 2: Returning User - Database Settings Title

**Requirement**: FR-003 - Display "Database Settings" when config exists

**Setup**:
1. Ensure a database configuration is saved in localStorage
   - OR complete Scenario 3 first (save a connection string)

**Steps**:
1. Refresh page: `http://localhost:5173`
2. Navigate to database settings page
3. Observe page title

**Expected Result**:
- ✅ Page title reads "Database Settings" (NOT "Database Initialization")

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 3: Connection String Visible by Default

**Requirement**: FR-001, FR-008 - Connection string is default input method

**Setup**:
1. Clear localStorage (fresh state)
2. Navigate to database settings page

**Steps**:
1. Observe the database connection input section
2. Check visibility of connection string input field
3. Check visibility of individual fields (host, port, username, password)

**Expected Result**:
- ✅ Connection string input field is visible immediately (no toggle required)
- ✅ Individual database fields (host, port, etc.) are NOT visible by default
- ✅ No checkbox or toggle required to access connection string input

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 4: Tutorial Button in Supabase Section

**Requirement**: FR-004 - Tutorial button on right side of docs link row

**Setup**:
1. Navigate to database settings page
2. Locate the Supabase provider recommendation section

**Steps**:
1. Find the row containing the Supabase documentation link
2. Observe the right side of that same row

**Expected Result**:
- ✅ A "Tutorial" button or link appears on the right side
- ✅ It is on the SAME ROW as the documentation link (not above/below)
- ✅ Button is clickable

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 5: Tutorial Modal Opens and Displays Correctly

**Requirement**: FR-005, FR-006 - Modal opens with title, close button, empty content area

**Setup**:
1. Navigate to database settings page
2. Locate Tutorial button from Scenario 4

**Steps**:
1. Click the "Tutorial" button
2. Observe the modal that appears
3. Verify modal structure:
   - Title text
   - Close button (X icon)
   - Content area

**Expected Result**:
- ✅ Modal overlay appears (semi-transparent backdrop)
- ✅ Modal content box centered on screen
- ✅ Title displays "Tutorial"
- ✅ Close button (X) visible in top-right corner
- ✅ Empty scrollable content area present
- ✅ Modal has white background and rounded corners

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 6: Tutorial Modal Close Behavior

**Requirement**: FR-006, FR-006a - Modal closes and can be re-opened

**Setup**:
1. Complete Scenario 5 (modal is open)

**Steps**:
1. **Test close button**: Click the X close button
   - Expected: Modal closes
2. Re-open modal via Tutorial button
3. **Test Escape key**: Press Escape key
   - Expected: Modal closes
4. Re-open modal via Tutorial button
5. **Test backdrop click**: Click on the semi-transparent overlay (outside modal content)
   - Expected: Modal closes
6. Re-open modal via Tutorial button again

**Expected Result**:
- ✅ Close button dismisses modal
- ✅ Escape key dismisses modal
- ✅ Backdrop click dismisses modal
- ✅ Modal can be re-opened unlimited times
- ✅ Tutorial button remains clickable after each dismissal (FR-006a)

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 7: Help Text Message

**Requirement**: FR-007 - Correct informational text about Supabase support

**Setup**:
1. Navigate to database settings page

**Steps**:
1. Scroll to the notes/help text section (typically near bottom or top of form)
2. Read the informational text about database compatibility

**Expected Result**:
- ✅ Text reads EXACTLY: "This project is designed for Supabase by default. Should work with other PostgreSQL"
- ✅ Message is prominently displayed and easy to read

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 8: Advanced Options Toggle - Show Individual Fields

**Requirement**: FR-009, FR-010 - Advanced toggle reveals individual fields

**Setup**:
1. Navigate to database settings page
2. Ensure connection string input is visible by default (Scenario 3)

**Steps**:
1. Look for "Show Advanced Options" or "Advanced" button/link
2. Click the button to show advanced options
3. Observe the fields that appear

**Expected Result**:
- ✅ "Show Advanced Options" (or similar) button is visible
- ✅ Clicking reveals individual database field inputs:
   - Host input field
   - Port input field
   - Database name input field
   - Username input field
   - Password input field
- ✅ Button text changes to "Hide Advanced Options" (or similar)

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 9: Advanced Options Toggle - Hide Individual Fields

**Requirement**: FR-009, FR-010 - Advanced toggle hides individual fields

**Setup**:
1. Complete Scenario 8 (advanced fields visible)

**Steps**:
1. Click "Hide Advanced Options" button
2. Observe the individual fields disappear

**Expected Result**:
- ✅ All individual fields (host, port, database, username, password) are hidden
- ✅ Connection string input remains visible
- ✅ Button text changes back to "Show Advanced Options"

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 10: Connection String Functionality Preserved

**Requirement**: Backward compatibility - existing connection string logic works

**Setup**:
1. Navigate to database settings page
2. Clear any existing database configuration

**Steps**:
1. Enter a valid connection string in the connection string input:
   ```
   postgresql://test:password@localhost:5432/testdb
   ```
2. Click "Test Connection" button
3. Observe auto-detection of database type (should show "PostgreSQL")
4. Click "Save Configuration" button
5. Refresh the page
6. Navigate back to database settings

**Expected Result**:
- ✅ Connection string is parsed and database type auto-detected
- ✅ Connection test executes (may fail if no actual database, but should attempt)
- ✅ Configuration saves to localStorage
- ✅ After refresh, saved connection string appears in input field
- ✅ Connection string history dropdown shows recent connections
- ✅ Page title shows "Database Settings" (not "Database Initialization")

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

### Scenario 11: Individual Fields Still Functional

**Requirement**: Backward compatibility - individual fields still work via Advanced toggle

**Setup**:
1. Navigate to database settings page
2. Clear localStorage

**Steps**:
1. Click "Show Advanced Options" to reveal individual fields
2. Fill in individual fields:
   - Host: `localhost`
   - Port: `5432`
   - Database: `testdb`
   - Username: `testuser`
   - Password: `testpass`
   - Check SSL checkbox
3. Click "Test Connection"
4. Click "Save Configuration"
5. Refresh page
6. Re-open Advanced Options

**Expected Result**:
- ✅ Individual fields accept input
- ✅ Connection test executes with individual field values
- ✅ Configuration saves successfully
- ✅ After refresh, individual field values persist (visible in Advanced section)
- ✅ Page title shows "Database Settings" after save

**Actual Result**: [ PASS / FAIL ]

**Notes**: _______________

---

## Regression Testing

### Existing Features to Verify (No Regressions)

1. **Connection String History Dropdown**:
   - [ ] History dropdown still appears
   - [ ] Recent connection strings saved (last 5)
   - [ ] Selecting from history populates input

2. **SSL Checkbox**:
   - [ ] SSL checkbox visible and functional
   - [ ] State persists with configuration

3. **Provider Recommendations**:
   - [ ] Supabase provider card still displays
   - [ ] Documentation link still functional
   - [ ] Sign-up link still functional

4. **Connection Test**:
   - [ ] "Test Connection" button functional
   - [ ] Loading state displays during test
   - [ ] Success/error messages display correctly

5. **Navigation**:
   - [ ] "Back" or navigation button still works (if present)
   - [ ] Component unmounts cleanly

---

## Accessibility Testing

### Keyboard Navigation

1. **Tab Navigation**:
   - [ ] Can tab through all interactive elements
   - [ ] Tutorial button is keyboard accessible
   - [ ] Modal close button receives focus when modal opens
   - [ ] Escape key closes modal

2. **Screen Reader** (if available):
   - [ ] Modal has proper ARIA attributes
   - [ ] Page title change is announced
   - [ ] Button labels are descriptive

---

## Browser Compatibility

Test on at least 2 browsers:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge

**No IE11 testing required** (per project constraints: modern browsers only)

---

## Performance Check

1. **Modal Open/Close**:
   - [ ] Modal opens instantly (<300ms)
   - [ ] Modal closes instantly (<300ms)
   - [ ] No visual lag or flickering

2. **Page Title Update**:
   - [ ] Title updates immediately after save
   - [ ] No delay when checking localStorage

---

## Sign-Off

**Tester**: _______________
**Date**: _______________
**Overall Status**: [ PASS / FAIL / NEEDS REVISION ]

**Issues Found**:
1. _______________
2. _______________
3. _______________

**Notes**:
_______________
_______________
_______________
