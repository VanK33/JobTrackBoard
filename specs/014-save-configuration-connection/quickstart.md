# Quickstart Test Scenarios: Database Connection String Security

**Feature**: 014-save-configuration-connection
**Date**: 2025-10-14
**Purpose**: Manual test scenarios to validate all functional requirements (FR-001 through FR-015)

## Prerequisites

1. Start dev environment: `npm run dev`
2. Open browser to: `http://localhost:5173`
3. Navigate to Database Settings page
4. Open browser DevTools → Application → Local Storage → `http://localhost:5173`

---

## Test Scenario 1: Auto-save Prevention (FR-001, FR-002)

**Objective**: Verify connection strings are NOT saved while typing, only on explicit save.

**Steps**:
1. Navigate to Database Settings
2. Type a connection string in the input field: `postgresql://test:pass123@localhost:5432/testdb`
3. **Do NOT click "Save Configuration"**
4. Open DevTools → Local Storage
5. Check for `namedDatabaseConnections` key

**Expected Result**:
- ✅ `namedDatabaseConnections` key does NOT exist (or does not contain new connection)
- ✅ Connection string NOT auto-saved during typing

**Clean Up**: Refresh page (discard unsaved input)

---

## Test Scenario 2: Save Named Connection (FR-003, FR-004, FR-010)

**Objective**: Verify user can provide a name and save a connection.

**Steps**:
1. Navigate to Database Settings
2. Enter connection name: `Test Connection`
3. Enter connection string: `postgresql://user:pass@localhost:5432/db`
4. Click "Save Configuration"
5. Check DevTools → Local Storage → `namedDatabaseConnections`

**Expected Result**:
- ✅ localStorage contains JSON array with one entry
- ✅ Entry has `name: "Test Connection"` and matching `connectionString`
- ✅ Success message or visual confirmation

**Clean Up**: Keep for next test

---

## Test Scenario 3: Display Named Connections (FR-005, FR-006)

**Objective**: Verify saved connections appear in dropdown with names only (no passwords exposed).

**Steps**:
1. After Test Scenario 2 (connection saved)
2. Refresh the page
3. Locate the connection history dropdown
4. Open the dropdown

**Expected Result**:
- ✅ Dropdown shows "Test Connection" (not the full connection string)
- ✅ No password visible in dropdown options

**Steps (continued)**:
5. Click "Test Connection" in dropdown
6. Check connection string input field

**Expected Result**:
- ✅ Connection string field populated with `postgresql://user:pass@localhost:5432/db`
- ✅ Full connection string restored from saved config

**Clean Up**: Keep for next test

---

## Test Scenario 4: Save Unnamed Connection (FR-003, FR-005)

**Objective**: Verify connection can be saved without a name, displays masked string.

**Steps**:
1. Clear connection name field (leave empty)
2. Enter connection string: `postgresql://admin:secret@aws.com:5432/prod`
3. Click "Save Configuration"
4. Check DevTools → Local Storage

**Expected Result**:
- ✅ Saved with masked name: `postgresql://***:***@aws.com:5432/prod`
- ✅ Actual connectionString preserved with credentials

**Steps (continued)**:
5. Refresh page
6. Open connection history dropdown

**Expected Result**:
- ✅ Dropdown shows both:
  - "Test Connection"
  - `postgresql://***:***@aws.com:5432/prod` (masked)

**Clean Up**: Keep for next test

---

## Test Scenario 5: Duplicate Name Rejection (FR-008, FR-011)

**Objective**: Verify system prevents saving duplicate connection names.

**Steps**:
1. Enter connection name: `Test Connection` (already exists from Scenario 2)
2. Enter different connection string: `postgresql://new:pass@host:5432/newdb`
3. Click "Save Configuration"

**Expected Result**:
- ✅ Error message displayed: "A connection with this name already exists. Please choose a different name."
- ✅ Connection NOT saved (check localStorage, count unchanged)

**Clean Up**: Keep for next test

---

## Test Scenario 6: Delete Connection (FR-012)

**Objective**: Verify user can delete saved connections.

**Steps**:
1. Open connection history dropdown
2. Locate "Test Connection"
3. Click delete button/icon next to "Test Connection"
4. Confirm deletion (if prompt appears)

**Expected Result**:
- ✅ "Test Connection" removed from dropdown immediately
- ✅ localStorage updated (only masked connection remains)

**Steps (continued)**:
5. Refresh page
6. Open dropdown

**Expected Result**:
- ✅ "Test Connection" still absent (deletion persisted)

**Clean Up**: Keep for next test

---

## Test Scenario 7: Rename Connection (FR-014)

**Objective**: Verify user can rename saved connections with uniqueness validation.

**Steps**:
1. Open connection history dropdown
2. Locate the masked connection (`postgresql://***:***@aws.com:5432/prod`)
3. Click edit/rename button/icon
4. Enter new name: `Production AWS`
5. Confirm rename (Enter key or blur)

**Expected Result**:
- ✅ Dropdown now shows "Production AWS" (not masked string)
- ✅ localStorage updated with new name
- ✅ connectionString unchanged

**Steps (continued - test uniqueness)**:
6. Add another connection with name: `Staging AWS`
7. Try to rename "Production AWS" to "Staging AWS"

**Expected Result**:
- ✅ Error message: "A connection with this name already exists"
- ✅ Rename prevented

**Clean Up**: Keep for next test

---

## Test Scenario 8: Update Connection String (FR-015)

**Objective**: Verify updating a connection string with same name overwrites existing entry.

**Steps**:
1. Select "Production AWS" from dropdown
2. Modify connection string to: `postgresql://admin:newsecret@aws.com:5432/prod`
3. Keep name as "Production AWS"
4. Click "Save Configuration"

**Expected Result**:
- ✅ No duplicate created (still one connection named "Production AWS")
- ✅ Connection string updated to new value in localStorage

**Steps (continued)**:
5. Refresh page
6. Select "Production AWS" from dropdown

**Expected Result**:
- ✅ Connection string shows updated value: `...newsecret...`

**Clean Up**: Keep for next test

---

## Test Scenario 9: Legacy History Migration (FR-013)

**Objective**: Verify automatic migration from old format to new format.

**Setup**:
1. Open DevTools → Console
2. Run migration setup:
   ```javascript
   // Clear new format
   localStorage.removeItem('namedDatabaseConnections');

   // Add legacy format
   localStorage.setItem('databaseConnectionHistory', JSON.stringify([
     'postgresql://legacy1:pass@host1:5432/db1',
     'postgresql://legacy2:pass@host2:5432/db2'
   ]));
   ```
3. Refresh page

**Expected Result**:
- ✅ Page loads without errors
- ✅ Open dropdown, see:
  - "old connection string 1"
  - "old connection string 2"
- ✅ localStorage contains `namedDatabaseConnections` with migrated entries
- ✅ Legacy key `databaseConnectionHistory` deleted

**Steps (continued)**:
4. Select "old connection string 1" from dropdown

**Expected Result**:
- ✅ Connection string populated correctly: `postgresql://legacy1:pass@host1:5432/db1`

**Clean Up**: Keep for next test

---

## Test Scenario 10: Test Connection Without Save (FR-009)

**Objective**: Verify "Test Connection" button works without saving to localStorage.

**Steps**:
1. Clear connection name and connection string fields
2. Enter connection string: `postgresql://test:temp@localhost:5432/tempdb`
3. **Do NOT save**
4. Click "Test Connection" button (or "Connect Database" button)

**Expected Result**:
- ✅ Connection test executes (success or failure message)
- ✅ Check localStorage: `namedDatabaseConnections` unchanged (temp connection not saved)

**Clean Up**: Keep for next test

---

## Test Scenario 11: Password Masking in Input Field (FR-007)

**Objective**: Verify connection string input field masks passwords.

**Steps**:
1. Locate connection string input field
2. Check HTML attribute: `type="password"`
3. Type: `postgresql://user:visible123@host:5432/db`

**Expected Result**:
- ✅ Input field displays masked characters (dots or asterisks)
- ✅ Actual value stored correctly (not visually masked in code)

**Clean Up**: N/A (visual test only)

---

## Test Scenario 12: Empty Name Handling (FR-003)

**Objective**: Verify empty or whitespace-only names default to masked string.

**Steps**:
1. Enter connection name: `   ` (3 spaces)
2. Enter connection string: `postgresql://user:pass@host:5432/db`
3. Click "Save Configuration"

**Expected Result**:
- ✅ Saved with masked string as name (whitespace trimmed to empty → use masked)
- ✅ Dropdown shows `postgresql://***:***@host:5432/db`

**Clean Up**: Delete this connection

---

## Test Scenario 13: Case-Sensitive Name Validation (FR-011)

**Objective**: Verify connection names are case-sensitive.

**Steps**:
1. Save connection with name: `Production`
2. Try to save another connection with name: `production` (lowercase)

**Expected Result**:
- ✅ Second save succeeds (different from "Production")
- ✅ Dropdown shows both "Production" and "production"

**Clean Up**: Delete both connections

---

## Test Scenario 14: Multiple Connection Management (FR-008, FR-012)

**Objective**: Verify system handles multiple connections correctly.

**Steps**:
1. Save 5 connections with names: `Conn1`, `Conn2`, `Conn3`, `Conn4`, `Conn5`
2. Open dropdown

**Expected Result**:
- ✅ All 5 connections visible
- ✅ Each has delete and rename buttons

**Steps (continued)**:
3. Delete `Conn3`
4. Refresh page

**Expected Result**:
- ✅ Only 4 connections remain: `Conn1`, `Conn2`, `Conn4`, `Conn5`

**Clean Up**: Delete all test connections

---

## Test Scenario 15: Dropdown Selection (FR-006)

**Objective**: Verify selecting a connection from dropdown populates the form.

**Steps**:
1. Save connection: Name=`MyDB`, String=`postgresql://user:pass@host:5432/mydb`
2. Clear the form fields
3. Open dropdown, select `MyDB`

**Expected Result**:
- ✅ Connection string field populated: `postgresql://user:pass@host:5432/mydb`
- ✅ Connection name field populated: `MyDB` (optional, based on UX design)

**Clean Up**: Clear localStorage for fresh state:
```javascript
localStorage.removeItem('namedDatabaseConnections');
localStorage.removeItem('databaseConnectionHistory');
```

---

## Post-Testing Verification

After completing all scenarios:

1. **localStorage State**:
   - Check `namedDatabaseConnections` is an array
   - Verify no legacy `databaseConnectionHistory` key
   - Inspect structure matches `NamedConnection[]` type

2. **UI Consistency**:
   - Dropdown reflects localStorage state
   - No duplicate entries
   - All delete/rename actions persisted

3. **Error Handling**:
   - Duplicate names rejected
   - Empty connections not saved
   - Graceful handling of invalid data

---

## Success Criteria

**All 15 scenarios pass** ✅ = Feature ready for production

**Any scenario fails** ❌ = Review implementation, fix bugs, retest

---

## Rollback Procedure (if needed)

If feature causes critical issues:

1. Revert code changes
2. Run migration cleanup:
   ```javascript
   // Restore legacy format if users complain
   const named = JSON.parse(localStorage.getItem('namedDatabaseConnections'));
   const legacy = named.map(c => c.connectionString);
   localStorage.setItem('databaseConnectionHistory', JSON.stringify(legacy));
   localStorage.removeItem('namedDatabaseConnections');
   ```
3. Communicate rollback to users

---

**Test Plan Complete**: ✅ Ready for manual execution
