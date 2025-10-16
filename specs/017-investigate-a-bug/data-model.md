# Data Model: Progress Date 2-Minute Consolidation Window

**Date**: 2025-10-15
**Feature**: 017-investigate-a-bug
**Input**: [research.md](./research.md) decisions

## Entity 1: Consolidation Window

### Purpose
Tracks the 2-minute consolidation window state for a job. One active window per job at most.

### Schema (PostgreSQL)
```sql
CREATE TABLE consolidation_windows (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL,
  window_start_time BIGINT NOT NULL,      -- Unix timestamp (ms) - when first update occurred
  window_end_time BIGINT NOT NULL,        -- Fixed: window_start_time + 120000
  first_status VARCHAR(50) NOT NULL,       -- Status when window started
  is_active BOOLEAN DEFAULT TRUE,          -- FALSE after consolidation completes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (job_id, is_active),             -- Constraint: only one active window per job
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_consolidation_windows_job_id ON consolidation_windows(job_id);
CREATE INDEX idx_consolidation_windows_is_active ON consolidation_windows(is_active);
```

### Schema (SQLite)
```sql
CREATE TABLE consolidation_windows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  window_start_time INTEGER NOT NULL,     -- Unix timestamp (ms)
  window_end_time INTEGER NOT NULL,       -- Fixed: window_start_time + 120000
  first_status TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,            -- 1 = TRUE, 0 = FALSE (SQLite BOOLEAN)
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (job_id, is_active),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_consolidation_windows_job_id ON consolidation_windows(job_id);
CREATE INDEX idx_consolidation_windows_is_active ON consolidation_windows(is_active);
```

### TypeScript Interface
```typescript
interface ConsolidationWindow {
  id: number;
  jobId: number;
  windowStartTime: number;    // Unix timestamp (ms)
  windowEndTime: number;      // windowStartTime + 120000 (immutable)
  firstStatus: string;         // Status when window started
  isActive: boolean;
  createdAt: string;           // ISO 8601 timestamp
}
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL/INTEGER | PRIMARY KEY | Unique identifier for the window |
| `job_id` | INTEGER | NOT NULL, FK to jobs(id) | The job this window belongs to |
| `window_start_time` | BIGINT/INTEGER | NOT NULL | Unix timestamp (ms) when first status update in window occurred |
| `window_end_time` | BIGINT/INTEGER | NOT NULL | Fixed expiration time: `window_start_time + 120000` (immutable) |
| `first_status` | VARCHAR(50)/TEXT | NOT NULL | The status value when window started (for audit) |
| `is_active` | BOOLEAN/INTEGER | DEFAULT TRUE/1 | Whether window is still active (FALSE after consolidation) |
| `created_at` | TIMESTAMP/TEXT | DEFAULT CURRENT_TIMESTAMP | When this window record was created |

### Validation Rules

1. **Immutable Window Duration**:
   - `window_end_time` MUST equal `window_start_time + 120000`
   - Cannot be modified after creation
   - Enforced in application logic (not database constraint)

2. **One Active Window Per Job**:
   - UNIQUE constraint on `(job_id, is_active)` WHERE `is_active = TRUE`
   - Enforced by database

3. **Window Start Time**:
   - MUST be less than or equal to current time
   - Enforced in application logic

4. **Expiration Check**:
   - Window expired when `Date.now() >= window_end_time`
   - Used for lazy consolidation

### State Transitions

```
[No Window] → [Active Window] → [Expired Window] → [Consolidated]
     ↓               ↓                  ↓                ↓
  (Initial)    (is_active=TRUE)  (is_active=TRUE)  (is_active=FALSE or deleted)
                                  (Date.now() >= end)
```

**Transition Details**:
1. **No Window → Active Window**: First status update creates new window
2. **Active → Expired**: Time passes, `Date.now() >= window_end_time`
3. **Expired → Consolidated**: Lazy consolidation runs (deletes intermediate history)
4. **After Consolidation**: Window marked `is_active = FALSE` (or deleted)

### Lifecycle

1. **Creation**: On first status update for a job (when no active window exists)
   ```typescript
   const window = await db.createConsolidationWindow({
     jobId: jobId,
     windowStartTime: Date.now(),
     windowEndTime: Date.now() + 120000,
     firstStatus: newStatus,
     isActive: true
   })
   ```

2. **Query Active Window**:
   ```typescript
   const window = await db.query(`
     SELECT * FROM consolidation_windows
     WHERE job_id = $1 AND is_active = TRUE
   `, [jobId])
   ```

3. **Expiration Check**:
   ```typescript
   if (window && Date.now() >= window.window_end_time) {
     await db.consolidateWindow(jobId, window.id)
   }
   ```

4. **Consolidation**:
   - Delete all `job_status_history` entries with `consolidation_window_id = window.id` EXCEPT the last one
   - Mark window `is_active = FALSE` (or delete window record)

5. **Cleanup**:
   - After consolidation: Window can be deleted or kept for audit (marked inactive)
   - Decision: Keep inactive windows for 7 days (for debugging), then delete

---

## Entity 2: Status History Entry (Modified)

### Purpose
Records individual status change events. Extended to link entries to consolidation windows.

### Schema Changes (PostgreSQL)
```sql
-- Existing table (no changes to existing fields)
-- ALTER TABLE job_status_history ADD COLUMN...

ALTER TABLE job_status_history
ADD COLUMN consolidation_window_id INTEGER,
ADD CONSTRAINT fk_consolidation_window
  FOREIGN KEY (consolidation_window_id)
  REFERENCES consolidation_windows(id)
  ON DELETE SET NULL;

CREATE INDEX idx_status_history_window_id ON job_status_history(consolidation_window_id);
```

### Schema Changes (SQLite)
```sql
-- SQLite doesn't support ALTER TABLE ADD CONSTRAINT
-- Need to recreate table with new schema

-- Step 1: Rename existing table
ALTER TABLE job_status_history RENAME TO job_status_history_old;

-- Step 2: Create new table with additional column
CREATE TABLE job_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  operator TEXT,
  note TEXT,
  consolidation_window_id INTEGER,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (consolidation_window_id) REFERENCES consolidation_windows(id) ON DELETE SET NULL
);

-- Step 3: Copy data from old table
INSERT INTO job_status_history (id, job_id, status, changed_at, operator, note)
SELECT id, job_id, status, changed_at, operator, note
FROM job_status_history_old;

-- Step 4: Drop old table
DROP TABLE job_status_history_old;

-- Step 5: Recreate indexes
CREATE INDEX idx_status_history_job_id ON job_status_history(job_id);
CREATE INDEX idx_status_history_window_id ON job_status_history(consolidation_window_id);
```

### TypeScript Interface (Extended)
```typescript
interface StatusHistoryEntry {
  id: number;
  jobId: number;
  status: string;
  changedAt: string;               // ISO 8601 timestamp
  operator?: string;
  note?: string;
  consolidationWindowId?: number;  // NEW: Links entry to consolidation window
}
```

### New Field

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `consolidation_window_id` | INTEGER | FK to consolidation_windows(id), NULLABLE | Links this history entry to a consolidation window (NULL if no active window) |

### Validation Rules

1. **Window Association**:
   - If `consolidation_window_id` is NOT NULL, the referenced window MUST exist
   - Enforced by FOREIGN KEY constraint

2. **Consolidation Logic**:
   - Entries with same `consolidation_window_id` are candidates for deletion
   - Only the LAST entry (by `changed_at`) is kept after consolidation

### Lifecycle (Modified)

1. **Creation (with active window)**:
   ```typescript
   const window = await db.getActiveConsolidationWindow(jobId)
   await db.addStatusHistory({
     jobId: jobId,
     status: newStatus,
     changedAt: new Date().toISOString(),
     operator: 'User',
     consolidationWindowId: window?.id || null  // Link to window if exists
   })
   ```

2. **Creation (without active window)**:
   ```typescript
   await db.addStatusHistory({
     jobId: jobId,
     status: newStatus,
     changedAt: new Date().toISOString(),
     operator: 'User',
     consolidationWindowId: null  // No active window
   })
   ```

3. **Consolidation (deletion of intermediate entries)**:
   ```typescript
   // Get all history entries in window
   const entries = await db.query(`
     SELECT * FROM job_status_history
     WHERE consolidation_window_id = $1
     ORDER BY changed_at ASC
   `, [windowId])

   // Delete all except last
   const entriesToDelete = entries.slice(0, -1)
   for (const entry of entriesToDelete) {
     await db.deleteStatusHistory(entry.id)
   }

   // Mark window as inactive
   await db.query(`
     UPDATE consolidation_windows
     SET is_active = FALSE
     WHERE id = $1
   `, [windowId])
   ```

4. **Query (for Progress Dates display)**:
   ```typescript
   // Fetch all non-deleted history entries
   const history = await db.query(`
     SELECT * FROM job_status_history
     WHERE job_id = $1
     ORDER BY changed_at DESC
   `, [jobId])
   // Result: Only final entries remain after consolidation
   ```

---

## Entity Relationships

```
jobs (1) ──── (0..1) consolidation_windows [active]
  │
  │
  └──── (*) job_status_history
             │
             └──── (0..1) consolidation_windows [window that entry belongs to]
```

**Relationships**:
1. **Job → Consolidation Windows**: One job can have at most ONE active consolidation window (enforced by UNIQUE constraint)
2. **Job → Status History**: One job can have MANY status history entries (standard 1-to-many)
3. **Consolidation Window → Status History**: One window can contain MANY history entries (via `consolidation_window_id` FK)

---

## Database Migration

### Migration Script (PostgreSQL)

```sql
-- migration-017-consolidation-windows.sql

-- Step 1: Create consolidation_windows table
CREATE TABLE consolidation_windows (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL,
  window_start_time BIGINT NOT NULL,
  window_end_time BIGINT NOT NULL,
  first_status VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (job_id, is_active),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_consolidation_windows_job_id ON consolidation_windows(job_id);
CREATE INDEX idx_consolidation_windows_is_active ON consolidation_windows(is_active);

-- Step 2: Add consolidation_window_id to job_status_history
ALTER TABLE job_status_history
ADD COLUMN consolidation_window_id INTEGER,
ADD CONSTRAINT fk_consolidation_window
  FOREIGN KEY (consolidation_window_id)
  REFERENCES consolidation_windows(id)
  ON DELETE SET NULL;

CREATE INDEX idx_status_history_window_id ON job_status_history(consolidation_window_id);

-- Step 3: No data migration needed (all existing entries have NULL window_id)
```

### Migration Script (SQLite)

```sql
-- migration-017-consolidation-windows-sqlite.sql

-- Step 1: Create consolidation_windows table
CREATE TABLE consolidation_windows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  window_start_time INTEGER NOT NULL,
  window_end_time INTEGER NOT NULL,
  first_status TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (job_id, is_active),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_consolidation_windows_job_id ON consolidation_windows(job_id);
CREATE INDEX idx_consolidation_windows_is_active ON consolidation_windows(is_active);

-- Step 2: Recreate job_status_history with new column
ALTER TABLE job_status_history RENAME TO job_status_history_old;

CREATE TABLE job_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  operator TEXT,
  note TEXT,
  consolidation_window_id INTEGER,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (consolidation_window_id) REFERENCES consolidation_windows(id) ON DELETE SET NULL
);

INSERT INTO job_status_history (id, job_id, status, changed_at, operator, note)
SELECT id, job_id, status, changed_at, operator, note
FROM job_status_history_old;

DROP TABLE job_status_history_old;

CREATE INDEX idx_status_history_job_id ON job_status_history(job_id);
CREATE INDEX idx_status_history_window_id ON job_status_history(consolidation_window_id);
```

---

## Rollback Plan

### Rollback (PostgreSQL)
```sql
-- rollback-017-consolidation-windows.sql

-- Step 1: Drop FK constraint and column from job_status_history
ALTER TABLE job_status_history
DROP CONSTRAINT fk_consolidation_window,
DROP COLUMN consolidation_window_id;

-- Step 2: Drop consolidation_windows table
DROP TABLE consolidation_windows;
```

### Rollback (SQLite)
```sql
-- rollback-017-consolidation-windows-sqlite.sql

-- Step 1: Recreate job_status_history without consolidation_window_id
ALTER TABLE job_status_history RENAME TO job_status_history_new;

CREATE TABLE job_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  operator TEXT,
  note TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

INSERT INTO job_status_history (id, job_id, status, changed_at, operator, note)
SELECT id, job_id, status, changed_at, operator, note
FROM job_status_history_new;

DROP TABLE job_status_history_new;

-- Step 2: Drop consolidation_windows table
DROP TABLE consolidation_windows;
```

---

## Next Steps (Phase 1 Continued)

- [x] Data model complete (this file)
- [ ] Generate API contracts (OpenAPI schema)
- [ ] Generate contract tests
- [ ] Generate quickstart.md (test scenarios)
- [ ] Update CLAUDE.md agent file
