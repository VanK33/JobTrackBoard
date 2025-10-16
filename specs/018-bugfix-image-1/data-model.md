# Data Model: Progress Dates Consolidation Bug Fix

**Feature**: 018-bugfix-image-1
**Date**: 2025-10-15
**Type**: Bug Fix (No Schema Changes)

## Overview

This bug fix does NOT require any database schema changes. The fix is purely a logic change within the existing `consolidateWindow()` method in the database service layer.

## Existing Schema (No Changes)

### Tables Involved

#### `job_status_history`
**Purpose**: Records each status change with timestamp and consolidation window reference

**Columns** (unchanged):
- `id` - Primary key
- `job_id` - Foreign key to jobs table
- `status` - Status value at this point in time
- `changed_at` - Timestamp when status was changed
- `changed_by` - Operator who made the change
- `note` - Optional note about the change
- `consolidation_window_id` - Foreign key to consolidation_windows (nullable)

**Current Behavior**: All entries within a 2-minute window are linked to the same `consolidation_window_id`

**New Behavior**: Same linking, but consolidation logic will delete different entries:
- Current: Deletes all except LAST entry (`slice(0, -1)`)
- Fixed: Deletes only INTERMEDIATE entries (`slice(1, -1)`), or all except FIRST if rollback (`slice(1)`)

#### `consolidation_windows`
**Purpose**: Tracks active 2-minute consolidation periods

**Columns** (unchanged):
- `id` - Primary key
- `job_id` - Foreign key to jobs table
- `window_start_time` - Timestamp when window started
- `window_end_time` - Timestamp when window expires (start + 2 minutes)
- `first_status` - Original status before window started
- `is_active` - Boolean flag (true during window, false after consolidation)

**Behavior**: No changes to this table's logic

#### `job_stage_timestamps`
**Purpose**: Tracks first arrival time at each stage

**Columns** (unchanged):
- `job_id` - Foreign key to jobs table
- `applied_at` - First time job reached "Applied" status
- `screening_at` - First time job reached "Screening" status
- `interview_at` - First time job reached "Interview" status
- `offered_at` - First time job reached "Offered" status
- `rejected_at` - First time job reached "Rejected" status

**Current Behavior**: No timestamp management during consolidation

**New Behavior**: During consolidation, timestamps are set to NULL for stages that appear ONLY in intermediate entries (not in first or last entry)

**Example**:
- Sequence: Applied → Screening → Interview → Screening
- After consolidation: Applied (first) and Screening (last) remain
- Intermediate entries deleted: Screening (intermediate), Interview
- Stage timestamps:
  - `applied_at` - Preserved (appears in first entry)
  - `screening_at` - Preserved (appears in last entry)
  - `interview_at` - Set to NULL (appears only in intermediate entry)

## Logic Changes Only

### Method: `consolidateWindow(jobId: number, windowId: number)`

**Location**:
- `platform/core/src/backend/database/postgresql-service.ts:830`
- `platform/core/src/backend/database/sqlite-service.ts` (equivalent)

**Current Implementation** (INCORRECT):
```typescript
const entriesToDelete = entries.slice(0, -1)  // Keeps only LAST entry
```

**Fixed Implementation**:
```typescript
// Determine which entries to delete based on rollback scenario
let entriesToDelete: StatusHistoryEntry[];

if (entries[0].status === entries[entries.length - 1].status) {
  // Rollback scenario: first and last have same status
  // Keep only FIRST entry (delete all others including last)
  entriesToDelete = entries.slice(1);
  logger.info('Consolidation: Rollback detected', {
    jobId,
    windowId,
    status: entries[0].status,
    kept: 1,
    deleted: entriesToDelete.length
  });
} else {
  // Normal scenario: first and last have different statuses
  // Keep FIRST and LAST, delete only intermediate
  entriesToDelete = entries.slice(1, -1);
  logger.info('Consolidation: Normal scenario', {
    jobId,
    windowId,
    kept: 2,
    deleted: entriesToDelete.length
  });
}

// Identify intermediate statuses (those appearing only in deleted entries)
const keptStatuses = new Set([entries[0].status]);
if (entries[0].status !== entries[entries.length - 1].status) {
  keptStatuses.add(entries[entries.length - 1].status);
}

const deletedStatuses = entriesToDelete
  .map(e => e.status)
  .filter(s => !keptStatuses.has(s));

// Delete intermediate entries (existing loop unchanged)
for (const entry of entriesToDelete) {
  await this.deleteStatusHistory(entry.id);
}

// Nullify stage timestamps for intermediate stages only
for (const status of new Set(deletedStatuses)) {
  await this.nullifyStageTimestamp(jobId, status);
}
```

### New Helper Method: `nullifyStageTimestamp(jobId: number, status: string)`

**Purpose**: Set stage timestamp to NULL for a specific status

**Implementation** (PostgreSQL):
```typescript
async nullifyStageTimestamp(jobId: number, status: string): Promise<void> {
  const columnMap: Record<string, string> = {
    'applied': 'applied_at',
    'screening': 'screening_at',
    'interview': 'interview_at',
    'offered': 'offered_at',
    'rejected': 'rejected_at'
  };

  const column = columnMap[status.toLowerCase()];
  if (!column) {
    logger.warn('Unknown status for timestamp nullification', { jobId, status });
    return;
  }

  await this.query(
    `UPDATE job_stage_timestamps SET ${column} = NULL WHERE job_id = $1`,
    [jobId]
  );

  logger.info('Stage timestamp nullified', { jobId, status, column });
}
```

**Implementation** (SQLite): Similar logic using `db.run()` instead of `this.query()`

## Data Flow

### Before Consolidation (2-minute window active)
```
job_status_history:
  id=1  status=Applied     consolidation_window_id=10
  id=2  status=Screening   consolidation_window_id=10
  id=3  status=Interview   consolidation_window_id=10
  id=4  status=Screening   consolidation_window_id=10

consolidation_windows:
  id=10  is_active=true  first_status=Applied

job_stage_timestamps:
  applied_at=2025-10-15T10:00:00
  screening_at=2025-10-15T10:00:30
  interview_at=2025-10-15T10:01:00
```

### After Consolidation (current INCORRECT behavior)
```
job_status_history:
  id=4  status=Screening   consolidation_window_id=10  ← Only LAST kept

consolidation_windows:
  id=10  is_active=false  first_status=Applied

job_stage_timestamps:
  (All timestamps preserved - incorrect!)
```

### After Consolidation (new CORRECT behavior)
```
job_status_history:
  id=1  status=Applied     consolidation_window_id=10  ← FIRST kept
  id=4  status=Screening   consolidation_window_id=10  ← LAST kept

consolidation_windows:
  id=10  is_active=false  first_status=Applied

job_stage_timestamps:
  applied_at=2025-10-15T10:00:00     ← Preserved (in first entry)
  screening_at=2025-10-15T10:00:30   ← Preserved (in last entry)
  interview_at=NULL                  ← Nullified (only in intermediate)
```

## No Schema Migrations Required

**Database Version**: No change
**Migration Scripts**: None needed
**Backwards Compatibility**: Fully compatible (only changes deletion logic)
**Data Migration**: None required (affects only future consolidations)

## Impact on Existing Data

**Existing consolidated windows**: No changes (already consolidated using old logic)

**Future consolidations**: Will use new logic automatically

**Manual cleanup**: Not needed (old consolidated data is already finalized)

## Performance Impact

**Query Count**: Same or fewer DELETE queries
- Current: N-1 deletions (keep last)
- New: N-2 deletions (keep first and last) or N-1 (rollback)

**Database Load**: No change (same operations, different targets)

**Index Usage**: No change (existing indexes on `job_id`, `consolidation_window_id` still used)

## Summary

This is a **logic-only bug fix** with:
- ✅ Zero schema changes
- ✅ Zero data migrations
- ✅ Fully backwards compatible
- ✅ Same or better performance
- ✅ One new helper method (`nullifyStageTimestamp`)
- ✅ Modified logic in existing `consolidateWindow()` method
