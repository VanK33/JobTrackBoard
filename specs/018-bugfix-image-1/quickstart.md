# Quickstart: Testing Progress Dates Consolidation Bug Fix

**Feature**: 018-bugfix-image-1
**Date**: 2025-10-15
**Type**: Manual Browser Testing Guide

## Prerequisites

1. **Development Environment Running**:
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173 (or 5174)

2. **Database Connected**: Ensure you have a database configured (PostgreSQL or SQLite)

3. **Job Created**: Create at least one test job to experiment with

## Testing Strategy

This bug fix uses **manual browser testing** (following Feature 017 precedent). All tests are performed via the Job Dashboard UI.

## Test Scenario 1: Rollback to Original Status

**Objective**: Verify that when user returns to original status, only ONE entry remains with original timestamp

### Steps

1. **Navigate to Job Dashboard**: http://localhost:5173 (or 5174)

2. **Find a test job** with status "Applied"

3. **Record the original "Applied" timestamp**:
   - Expand the job card
   - Note the timestamp in Progress Dates (e.g., "Oct 15, 2025 10:00:00")

4. **Change status rapidly within 2 minutes**:
   - Change Applied → Screening (wait 5 seconds)
   - Change Screening → Applied (wait 5 seconds)

5. **Verify immediate state** (within 2-minute window):
   - Progress Dates should show all 3 entries:
     - Applied (newest)
     - Screening (intermediate)
     - Applied (original)

6. **Wait 2 minutes** for consolidation window to expire

7. **Refresh the job** (collapse and re-expand the card)

8. **Verify consolidated state**:
   - ✅ **PASS**: Progress Dates shows only ONE "Applied" entry
   - ✅ **PASS**: Timestamp matches the ORIGINAL timestamp from step 3
   - ❌ **FAIL**: If multiple "Applied" entries remain
   - ❌ **FAIL**: If timestamp changed to the newest one

### Browser Console Verification

Open browser DevTools Console and check for logs:

```
Consolidation: Rollback detected {jobId: 123, windowId: 45, status: "applied", kept: 1, deleted: 2}
Stage timestamp nullified {jobId: 123, status: "screening", column: "screening_at"}
```

## Test Scenario 2: Multiple Status Changes

**Objective**: Verify that first and last entries are kept, intermediate entries are deleted

### Steps

1. **Find a test job** with status "Applied"

2. **Record the original "Applied" timestamp**

3. **Change status within 2 minutes**:
   - Applied → Screening (wait 10 seconds)
   - Screening → Interview (wait 10 seconds)
   - Interview → Screening (final status, wait 10 seconds)

4. **Verify immediate state** (within 2-minute window):
   - Progress Dates should show all 4 entries:
     - Screening (newest/last)
     - Interview (intermediate)
     - Screening (intermediate)
     - Applied (original/first)

5. **Wait 2 minutes** for consolidation

6. **Refresh the job**

7. **Verify consolidated state**:
   - ✅ **PASS**: Progress Dates shows exactly 2 entries:
     - Screening (last) - with newest timestamp
     - Applied (first) - with original timestamp
   - ✅ **PASS**: Intermediate entries deleted (Interview, middle Screening)
   - ❌ **FAIL**: If more than 2 entries remain
   - ❌ **FAIL**: If only 1 entry remains

### Database Verification (Optional)

Query the database directly:

**PostgreSQL**:
```sql
SELECT id, job_id, status, changed_at, consolidation_window_id
FROM job_status_history
WHERE job_id = 123  -- Replace with actual job ID
ORDER BY changed_at;
```

**Expected Result**: 2 rows (Applied and Screening)

### Stage Timestamp Verification

Check `job_stage_timestamps` table:

**PostgreSQL**:
```sql
SELECT job_id, applied_at, screening_at, interview_at
FROM job_stage_timestamps
WHERE job_id = 123;
```

**Expected Result**:
- `applied_at`: NOT NULL (preserved)
- `screening_at`: NOT NULL (preserved)
- `interview_at`: NULL (nullified - only appeared in intermediate entry)

## Test Scenario 3: Single Status Change

**Objective**: Verify that when only one status change occurs, both entries are preserved

### Steps

1. **Find a test job** with status "Applied"

2. **Change status once**:
   - Applied → Screening

3. **Wait 2 minutes** for consolidation

4. **Refresh the job**

5. **Verify consolidated state**:
   - ✅ **PASS**: Progress Dates shows 2 entries:
     - Screening (last)
     - Applied (first)
   - ✅ **PASS**: Both timestamps preserved
   - ❌ **FAIL**: If only 1 entry remains
   - ❌ **FAIL**: If entries are missing

### Rationale

With only one status change, there are no intermediate entries to delete. The "first" and "last" are the only two entries, so both should be preserved.

## Edge Case: Feature 016 vs 017 Interaction

**Objective**: Verify that 5-second rollback (Feature 016) takes precedence over 2-minute consolidation (Feature 017)

### Steps

1. **Find a test job** with status "Applied"

2. **Change status very quickly** (within 5 seconds):
   - Applied → Screening (wait 2 seconds)
   - Screening → Applied (immediately)

3. **Verify immediate cleanup** (Feature 016 activates):
   - Progress Dates should show only 1 "Applied" entry
   - Screening entry deleted immediately (no 2-minute wait)

4. **Wait 2 minutes** (Feature 017 should not activate)

5. **Verify no further changes**:
   - ✅ **PASS**: Still shows only 1 "Applied" entry
   - ✅ **PASS**: No consolidation window was created (Feature 016 handled it)
   - ❌ **FAIL**: If additional consolidation occurs

### Browser Console Verification

Should see Feature 016 logs, NOT Feature 017 logs:

```
Feature 016: Rollback detected {jobId: 123, currentStatus: "applied", deletedEntryId: 456}
```

**Should NOT see**:
```
Started new consolidation window {jobId: 123, windowId: ...}
```

## Performance Validation

**Objective**: Verify that consolidation completes within performance budget

### Steps

1. **Create a stress test** with 20 status changes within 2 minutes:
   - Applied → Screening → Interview → Offered → Rejected → Applied (repeat 4 times)

2. **Open browser DevTools Performance tab**

3. **Wait for consolidation** (2 minutes)

4. **Check consolidation execution time** in console logs:
   ```
   Consolidation completed {jobId: 123, windowId: 45, executionTimeMs: 45}
   ```

5. **Verify performance**:
   - ✅ **PASS**: Execution time < 200ms (per plan.md performance goal)
   - ❌ **FAIL**: If execution time > 200ms

## Troubleshooting

### Issue: Consolidation not triggering after 2 minutes

**Check**:
1. Consolidation is **lazy** - it triggers on next status update
2. Try changing the job status again (any status) to force consolidation check
3. Check backend logs for `checkAndConsolidateExpiredWindow` calls

### Issue: Wrong entries being deleted

**Check**:
1. Verify you're on the correct git branch: `018-bugfix-image-1`
2. Rebuild backend: `npm run build:backend`
3. Restart dev server: `npm run dev`
4. Check `consolidateWindow()` implementation in `postgresql-service.ts:830`

### Issue: Stage timestamps not being nullified

**Check**:
1. Verify `nullifyStageTimestamp()` method exists in database service
2. Check backend logs for "Stage timestamp nullified" messages
3. Query `job_stage_timestamps` table directly to verify NULL values

## Browser Console Commands (Optional)

### Check active consolidation window

```javascript
const jobId = 123;  // Replace with actual job ID
fetch(`http://localhost:3000/api/jobs/${jobId}/consolidation-status`, {
  headers: {
    'x-database-config': localStorage.getItem('databaseConfig')
  }
})
.then(r => r.json())
.then(console.log);
```

### Manually trigger consolidation check

```javascript
const jobId = 123;  // Replace with actual job ID
fetch(`http://localhost:3000/api/jobs/${jobId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'x-database-config': localStorage.getItem('databaseConfig')
  },
  body: JSON.stringify({ status: 'applied' })  // Any status
})
.then(r => r.json())
.then(console.log);
```

## Success Criteria

All tests pass when:

1. ✅ **Rollback test**: ONE entry remains with original timestamp
2. ✅ **Multi-change test**: FIRST and LAST entries remain, intermediate deleted
3. ✅ **Single change test**: Both entries preserved
4. ✅ **Feature 016 test**: 5-second rollback takes precedence
5. ✅ **Performance test**: Consolidation completes in < 200ms
6. ✅ **Stage timestamps**: Intermediate stages nullified correctly

## Next Steps

After manual testing passes:

1. **Create pull request** with test results documented
2. **Code review** focusing on:
   - Correct array slicing logic
   - Rollback scenario handling
   - Stage timestamp nullification
3. **Merge to main** after approval
4. **Deploy to production** with monitoring

## Additional Resources

- **Spec**: `specs/018-bugfix-image-1/spec.md` - Requirements and acceptance criteria
- **Plan**: `specs/018-bugfix-image-1/plan.md` - Implementation approach
- **Research**: `specs/018-bugfix-image-1/research.md` - Technical analysis
- **Data Model**: `specs/018-bugfix-image-1/data-model.md` - Logic changes
