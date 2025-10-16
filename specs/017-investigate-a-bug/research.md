# Research: Progress Date 2-Minute Consolidation Window

**Date**: 2025-10-15
**Feature**: 017-investigate-a-bug
**Input**: [plan.md](./plan.md) Phase 0 research tasks

## Research Task 1: Consolidation Window Implementation Patterns

### Time-Based Window Management in TypeScript

**Pattern: Fixed Window with Timestamp Tracking**
```typescript
interface ConsolidationWindow {
  jobId: number;
  windowStartTime: number;  // Unix timestamp (ms)
  windowEndTime: number;    // Fixed: windowStartTime + 120000
  firstStatus: string;       // Status when window started
  isActive: boolean;         // False after consolidation completes
}
```

**Decision: Use timestamp-based expiration detection**
- Store `windowStartTime` when first status update occurs
- Calculate `windowEndTime = windowStartTime + 120000` (immutable)
- Check expiration: `Date.now() >= windowEndTime`
- **Rationale**: Simple, stateless, works across server restarts

### Fixed vs Sliding Window Implementations

**Fixed Window (CHOSEN)**:
```typescript
// First update at T=0, subsequent updates at T=30, T=60, T=90
// Window expires at T=120 (fixed from first update)
if (!activeWindow) {
  activeWindow = { windowStartTime: Date.now(), windowEndTime: Date.now() + 120000 }
} else {
  // Subsequent updates DON'T modify windowStartTime or windowEndTime
}
```

**Sliding Window (REJECTED)**:
```typescript
// Each update resets the timer
activeWindow.windowEndTime = Date.now() + 120000  // ❌ NOT what user wants
```

**Decision: Implement fixed window**
- **Rationale**: Spec.md clarification (line 44): "Timer is locked to 2 minutes from the FIRST update in the window"
- **Alternative considered**: Sliding window (simpler) - rejected because user explicitly chose fixed window

### Client-Side Timer Patterns with Cleanup

**Pattern: useEffect with setTimeout + cleanup on unmount**
```typescript
const consolidationTimerRef = React.useRef<NodeJS.Timeout | null>(null)

React.useEffect(() => {
  return () => {
    if (consolidationTimerRef.current) {
      clearTimeout(consolidationTimerRef.current)
    }
  }
}, [])

// On status update:
if (consolidationTimerRef.current) {
  clearTimeout(consolidationTimerRef.current) // Clear old timer
}
consolidationTimerRef.current = setTimeout(() => {
  // Trigger consolidation
}, 120000)
```

**Decision: Use setTimeout with fixed delay calculated from windowStartTime**
- Store `windowStartTime` in component state (from API response)
- Calculate remaining time: `Math.max(0, windowStartTime + 120000 - Date.now())`
- Set timer for remaining duration (not always 120000ms)
- **Rationale**: Handles page reload - timer resumes with correct remaining time

### Data Structure for Tracking Active Consolidation Windows

**Option A: In-Memory Map (REJECTED)**
```typescript
// Backend: Store in memory
const activeWindows = new Map<number, ConsolidationWindow>()
```
- ❌ Problem: Lost on server restart
- ❌ Problem: Session-based architecture - different backend instances per request

**Option B: Database Table (CHOSEN)**
```typescript
// Create consolidation_windows table
CREATE TABLE consolidation_windows (
  job_id INTEGER PRIMARY KEY,
  window_start_time BIGINT NOT NULL,   -- Unix timestamp (ms)
  window_end_time BIGINT NOT NULL,     -- Fixed: window_start_time + 120000
  first_status VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
)
```

**Decision: Use database table for persistent window tracking**
- **Rationale**: Works with session-based architecture (each request queries database)
- **Rationale**: Survives server restarts
- **Rationale**: Enables lazy consolidation (backend checks on each request)
- **Alternative considered**: localStorage only - rejected because backend needs window state for lazy consolidation

---

## Research Task 2: Lazy Consolidation Pattern

### Backend Lazy Cleanup Patterns (Check-on-Access)

**Pattern: Check expiration on every status update request**
```typescript
async updateJobStatus(jobId: number, newStatus: string): Promise<Job> {
  // STEP 1: Check for expired windows (lazy consolidation)
  await this.checkAndConsolidateExpiredWindow(jobId)

  // STEP 2: Get or create active window
  let window = await this.getActiveConsolidationWindow(jobId)
  if (!window) {
    window = await this.startConsolidationWindow(jobId, newStatus)
  }

  // STEP 3: Record status update
  await this.addStatusHistory(jobId, newStatus, window.id)

  // STEP 4: Return updated job with window info
  return await this.getJob(jobId)
}
```

**Decision: Implement lazy consolidation in status update endpoints**
- Check for expired windows at the START of every PATCH `/api/jobs/:id/status` request
- If window expired: consolidate immediately before processing new update
- **Rationale**: No need for scheduled jobs or background workers
- **Rationale**: Works with session-based architecture (no shared state)

### Timestamp-Based Expiration Detection

**Pattern: Simple timestamp comparison**
```typescript
async checkAndConsolidateExpiredWindow(jobId: number): Promise<void> {
  const window = await db.query(`
    SELECT * FROM consolidation_windows
    WHERE job_id = $1 AND is_active = TRUE
  `, [jobId])

  if (window && Date.now() >= window.window_end_time) {
    await this.consolidateWindow(jobId, window.id)
  }
}
```

**Decision: Use `Date.now() >= windowEndTime` for expiration check**
- **Rationale**: Simple, deterministic, no timezone issues
- **Rationale**: Unix timestamps (milliseconds) avoid date parsing complexity

### Storage Decision: Where to Store Consolidation Window Metadata

**Decision: Database table (as decided in Research Task 1)**
- Table: `consolidation_windows` (schema shown above)
- One row per job (PRIMARY KEY on job_id)
- Row deleted or marked inactive after consolidation
- **Rationale**: Persistent, queryable, works with lazy consolidation pattern

---

## Research Task 3: Data Model for Windowed Cleanup

### Extending Existing statusHistory Table vs New consolidation_windows Table

**Option A: Add fields to job_status_history table (REJECTED)**
```sql
ALTER TABLE job_status_history ADD COLUMN consolidation_window_id INTEGER;
ALTER TABLE job_status_history ADD COLUMN is_pending_consolidation BOOLEAN;
```
- ❌ Problem: Window metadata scattered across multiple rows
- ❌ Problem: Hard to query "is there an active window for this job?"

**Option B: Create separate consolidation_windows table (CHOSEN)**
- One table for window state (`consolidation_windows`)
- Existing table for history entries (`job_status_history`)
- Link via `consolidation_window_id` foreign key in history entries (optional)
- ✅ Clear separation of concerns
- ✅ Easy to query active windows: `SELECT * FROM consolidation_windows WHERE job_id = ? AND is_active = TRUE`

**Decision: Create new `consolidation_windows` table + optionally link history entries**

### How to Mark History Entries as "Pending Consolidation"

**Pattern: Link history entries to window via foreign key**
```sql
-- Option 1: Add FK to statusHistory (CHOSEN for clarity)
ALTER TABLE job_status_history ADD COLUMN consolidation_window_id INTEGER REFERENCES consolidation_windows(id);

-- Query: Get all history entries in active window
SELECT * FROM job_status_history
WHERE job_id = $1 AND consolidation_window_id = $2
ORDER BY changed_at ASC

-- Consolidation: Delete all except last
DELETE FROM job_status_history
WHERE consolidation_window_id = $1 AND id != $2  -- Keep last entry (id = $2)
```

**Alternative: Time-based query without FK (REJECTED)**
```sql
-- Query based on timestamps (no FK needed)
SELECT * FROM job_status_history
WHERE job_id = $1
  AND changed_at >= $2  -- window_start_time
  AND changed_at <= $3  -- window_end_time
ORDER BY changed_at ASC
```
- ❌ Problem: What if system clock changes? (NTP adjustment)
- ❌ Problem: Edge cases with exact timestamp matches

**Decision: Use foreign key `consolidation_window_id` in job_status_history**
- **Rationale**: Explicit relationship, immune to clock skew
- **Rationale**: Easy to identify which entries belong to which window

### Schema Changes Required

**New Table: consolidation_windows**
```sql
CREATE TABLE consolidation_windows (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL,
  window_start_time BIGINT NOT NULL,   -- Unix timestamp (ms)
  window_end_time BIGINT NOT NULL,     -- Fixed: window_start_time + 120000
  first_status VARCHAR(50) NOT NULL,    -- Status when window started
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (job_id, is_active),          -- Only one active window per job
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
)
```

**Modify Existing Table: job_status_history**
```sql
ALTER TABLE job_status_history
ADD COLUMN consolidation_window_id INTEGER REFERENCES consolidation_windows(id) ON DELETE SET NULL;
```
- **Note**: `ON DELETE SET NULL` - if window deleted, history entries remain (for audit trail)

---

## Research Task 4: Existing Cleanup Logic (Feature 016)

### How cleanupStatusRollback() Works (5-Second Rollback Pattern)

**Current Implementation (Feature 016)**:
- File: `platform/core/src/backend/database/postgresql-service.ts` (lines 275-318)
- Logic:
  1. Get all status history ordered by `changed_at DESC` (newest first)
  2. Find previous occurrence of `currentStatus` within 5 seconds
  3. If found: Delete all records between latest and previous (rollback spam)
  4. Example: A→B→C→B within 5 sec → Deletes B and C, keeps only first A

**Key Code (simplified)**:
```typescript
async cleanupStatusRollback(jobId: number, currentStatus: string): Promise<void> {
  const history = await this.getStatusHistory(jobId) // DESC order
  const latest = history[0]
  const latestTime = new Date(latest.changedAt).getTime()

  for (let i = 1; i < history.length; i++) {
    const prev = history[i]
    const timeDiff = latestTime - new Date(prev.changedAt).getTime()

    if (timeDiff > 5000) break  // Beyond 5-second window

    if (prev.status === currentStatus) {
      // Delete records from index 0 to i-1 (rollback detected)
      await this.deleteHistoryRecords(history.slice(0, i))
      break
    }
  }
}
```

### Interaction Between Feature 016 (5-sec) and Feature 017 (2-min)

**Conflict Analysis**:
- Feature 016: Detects rollback pattern (A→B→A) within 5 seconds → deletes B immediately
- Feature 017: Keeps all updates during 2-minute window → consolidates at end

**Scenario 1: User does A→B→A within 5 seconds**
- Feature 016 fires: Deletes B, keeps only A
- Feature 017: 2-minute window started at first update (A)
  - Window now contains only A (B already deleted)
  - At 2-minute mark: No consolidation needed (only one entry)
- **Result**: ✅ No conflict - Feature 016 cleanup happens first, Feature 017 consolidates remaining

**Scenario 2: User does A→B→C→B within 2 minutes (but not within 5 seconds)**
- Feature 016: No rollback detected (A→B takes 30 sec, B→C takes 30 sec, C→B takes 30 sec - all > 5 sec apart)
- Feature 017: 2-minute window contains A, B, C, B
  - At 2-minute mark: Consolidates to final status (B)
- **Result**: ✅ No conflict - Feature 016 doesn't fire, Feature 017 handles it

**Scenario 3: User does A→B→A within 3 seconds, then continues to C→D within 2-minute window**
- Feature 016: Deletes B at T=3sec, keeps only A
- Feature 017: Window contains A, C, D
  - At 2-minute mark: Consolidates to D
- **Result**: ✅ No conflict - Feature 016 runs immediately, Feature 017 consolidates final state

### Decision: Should Feature 017 Replace or Coexist with Feature 016?

**Decision: Coexist (keep both)**
- Feature 016: Immediate cleanup for obvious mistakes (rollback within 5 sec)
- Feature 017: Delayed consolidation for experimentation period (2 min)
- **Rationale**: Complementary behaviors
  - Feature 016 = quick fix for accidental clicks
  - Feature 017 = structured experimentation window
- **Rationale**: No conflicts detected in scenario analysis
- **Implementation**: Feature 016 runs first (in `updateJob`), Feature 017 consolidation runs after 2 minutes

**Alternative considered**: Replace Feature 016 with Feature 017
- ❌ Rejected: User might want immediate feedback for obvious mistakes
- ❌ Rejected: 2-minute window too long for accidental rollback detection

---

## Research Task 5: Browser Close/Reload Handling

### localStorage Persistence Patterns for Timer State

**Pattern: Store window start time in localStorage**
```typescript
// On status update (client-side):
if (!activeWindow) {
  const windowStartTime = Date.now()
  localStorage.setItem(`consolidation_window_${jobId}`, String(windowStartTime))
  // Start timer
}

// On page load:
const storedStartTime = localStorage.getItem(`consolidation_window_${jobId}`)
if (storedStartTime) {
  const windowStartTime = parseInt(storedStartTime)
  const remainingTime = Math.max(0, windowStartTime + 120000 - Date.now())

  if (remainingTime > 0) {
    // Resume timer with remaining time
    setTimeout(() => consolidate(), remainingTime)
  } else {
    // Window already expired, trigger consolidation
    consolidate()
  }
}
```

**Decision: Store windowStartTime in localStorage (per job)**
- Key format: `consolidation_window_${jobId}`
- Value: Unix timestamp (milliseconds)
- Clean up after consolidation completes
- **Rationale**: Survives browser close/reload
- **Rationale**: Frontend can resume timer with correct remaining time

### Resuming Consolidation Windows After Page Reload

**Pattern: Check localStorage on component mount**
```typescript
React.useEffect(() => {
  if (selectedJob) {
    const storedStartTime = localStorage.getItem(`consolidation_window_${selectedJob.id}`)
    if (storedStartTime) {
      const windowStartTime = parseInt(storedStartTime)
      const elapsed = Date.now() - windowStartTime

      if (elapsed < 120000) {
        // Window still active - resume timer
        const remainingTime = 120000 - elapsed
        consolidationTimerRef.current = setTimeout(() => {
          consolidateAndRefetch(selectedJob.id)
        }, remainingTime)
      } else {
        // Window expired while browser was closed - consolidate now
        consolidateAndRefetch(selectedJob.id)
        localStorage.removeItem(`consolidation_window_${selectedJob.id}`)
      }
    }
  }
}, [selectedJob])
```

**Decision: Resume timer on page load using localStorage**
- Check for stored `windowStartTime` in `useEffect`
- Calculate remaining time: `120000 - (Date.now() - windowStartTime)`
- If remaining > 0: Resume timer
- If remaining <= 0: Trigger immediate consolidation
- **Rationale**: Provides seamless UX across page reloads
- **Rationale**: Backend lazy consolidation provides safety net (eventual consistency)

### Recovery Decision: How to Recover Window Start Time Across Sessions

**Hybrid Approach (CHOSEN)**:
1. **Frontend**: localStorage stores `windowStartTime` for timer resumption
2. **Backend**: Database stores window state for lazy consolidation
3. **On page reload**:
   - Frontend checks localStorage → resumes timer if active
   - Frontend also fetches job data → API response includes active window info
   - If mismatch: Trust backend (source of truth)

**Decision: Backend is source of truth, frontend uses localStorage for optimization**
- **Rationale**: Handles edge case where localStorage cleared but backend still has active window
- **Rationale**: Backend lazy consolidation ensures eventual consistency even if frontend timer fails

---

## Summary of Decisions

| Research Area | Decision | Rationale |
|---------------|----------|-----------|
| **Window Type** | Fixed window (2 min from first update) | User clarification: timer locked to first update |
| **Timer Implementation** | setTimeout with calculated remaining time | Handles page reload correctly |
| **Storage** | Database table `consolidation_windows` | Persistent, works with session-based architecture |
| **Expiration Check** | Lazy consolidation on status update requests | No background workers needed |
| **History Linking** | Foreign key `consolidation_window_id` | Explicit relationship, immune to clock skew |
| **Schema Changes** | New table + alter existing table | Clear separation of concerns |
| **Feature 016 Interaction** | Coexist (keep both features) | Complementary behaviors, no conflicts |
| **Browser Reload** | localStorage + backend source of truth | Seamless UX + eventual consistency |

---

## Next Steps (Phase 1)

Based on research decisions:
1. Design data model for `consolidation_windows` table and modified `job_status_history` table
2. Define API contracts for modified PATCH `/api/jobs/:id/status` endpoint
3. Generate contract tests for lazy consolidation behavior
4. Create quickstart.md with test scenarios from spec.md
5. Update CLAUDE.md with new technical context

**Phase 0 Complete** - All research decisions documented with rationale.
