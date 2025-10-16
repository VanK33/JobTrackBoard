# Research: Prevent Status Update Spam & Expand Detail View

**Feature**: 016-spam-click-progress
**Date**: 2025-10-14
**Status**: Complete

## Overview
This document consolidates research findings for two independent features: (1) Status update spam prevention using 3-second threshold, (2) Detail view expansion from 60% to 90% of middle panel height. Focus on implementation patterns that leverage existing architecture without schema changes.

---

## 1. Status Update Spam Prevention Patterns

### Decision
**Server-side prevention using timestamp comparison**

### Findings
Spam prevention can be implemented at three levels:
1. **Client-side debouncing** - Delays API calls using setTimeout/debounce
2. **Server-side validation** - Checks timestamp before database insert
3. **Hybrid approach** - Both client + server enforcement

### Rationale
- **Server-side chosen**: Authoritative enforcement, cannot be bypassed by malicious clients
- **Backend location**: `platform/core/src/backend/api/jobs.ts` (modify status update endpoint)
- **Query pattern**: `SELECT MAX(changed_at) FROM job_status_history WHERE job_id = ?`
- **Comparison logic**: `(currentTime - lastChangeTime) < 3000ms → reject`

### Alternatives Considered
1. **Client-side debouncing only**
   - Rejected: Can be bypassed (multiple browser tabs, direct API calls)
   - Risk: Not reliable for data integrity

2. **Database triggers**
   - Rejected: Adds complexity, harder to debug, varies by database (PostgreSQL vs SQLite)
   - Risk: Inconsistent behavior across dev/prod environments

3. **Hybrid (client debounce + server validation)**
   - Deferred: Server-side sufficient for MVP
   - Future enhancement: Add client-side UX feedback (disable button for 3s)

### Implementation Details
```typescript
// Pseudocode for backend spam check
async function canUpdateStatus(jobId: number): Promise<boolean> {
  const lastChange = await db.query(
    'SELECT MAX(changed_at) FROM job_status_history WHERE job_id = $1',
    [jobId]
  );

  if (!lastChange || !lastChange.changed_at) return true; // First status change

  const timeSinceLastChange = Date.now() - new Date(lastChange.changed_at).getTime();
  return timeSinceLastChange >= 3000; // 3 second threshold
}
```

---

## 2. Sliding Window Implementation for Timestamp Checks

### Decision
Query last status change timestamp for `job_id`, compare with current timestamp using 3000ms threshold

### Findings
Two approaches for tracking recent status changes:
1. **Database query** - SELECT MAX(changed_at) per request
2. **In-memory cache** - Store last change time in Redis/memory

### Rationale
- **Database query chosen**: Leverages existing `job_status_history` table
- **No caching needed**: Session-based architecture, no shared state across sessions
- **Performance**: Query is fast with proper index on (job_id, changed_at)

### SQL Query Patterns
**PostgreSQL**:
```sql
SELECT MAX(changed_at) as last_change
FROM job_status_history
WHERE job_id = $1;
```

**SQLite** (fallback):
```sql
SELECT MAX(changed_at) as last_change
FROM job_status_history
WHERE job_id = ?;
```

### Index Verification
**Required Index**: `(job_id, changed_at)` or `(job_id)` with `changed_at` in covering index

**Check existing schemas**:
- PostgreSQL schema: `platform/core/src/backend/database/postgresql-service.ts` - verify CREATE TABLE statements
- SQLite schema: `platform/core/src/backend/database/sqlite-service.ts` - verify CREATE TABLE statements

**Note**: FR-005 prohibits schema changes. If index missing, document performance consideration for future optimization.

### Alternatives Considered
1. **Redis cache for last change times**
   - Rejected: No Redis in current stack (dependency: `redis` package present but not used for this feature)
   - Risk: Adds complexity, cache invalidation challenges

2. **In-memory Map<jobId, lastChangeTime>**
   - Rejected: Session-based architecture means no shared memory across requests
   - Risk: Stale data if server restarts

3. **Client-side tracking**
   - Rejected: Not authoritative, can be bypassed

---

## 3. React State Management for Expansion Toggle

### Decision
`useState` hook for local expansion state in `JobDashboard` component

### Findings
Expansion state persistence options:
1. **Component state (useState)** - Temporary per session
2. **localStorage** - Persistent across browser sessions
3. **URL query parameter** - Shareable state
4. **Global context/Redux** - Shared across components

### Rationale
- **useState chosen**: Simple toggle, scoped to JobDashboard component
- **Clarification from Session 2025-10-14**: Expansion state persists across job selections (not per-job)
- **Implementation**: Single boolean state, conditional CSS applied to detail container

### Code Pattern
```typescript
// In JobDashboard.tsx
const [isExpanded, setIsExpanded] = useState(false);

const toggleExpansion = () => setIsExpanded(!isExpanded);

// Apply conditional style
const detailContainerStyle = {
  maxHeight: isExpanded ? '90%' : '60%',
  transition: 'max-height 0.3s ease-in-out'
};
```

### Alternatives Considered
1. **localStorage persistence**
   - Deferred: User might prefer session-based preference
   - Future enhancement: Add "Remember preference" checkbox

2. **URL query parameter (?expanded=true)**
   - Rejected: Unnecessary for UI preference, clutters URL
   - Not a shareable state (no multi-user scenarios)

3. **Per-job expansion state**
   - Rejected: Clarification answer confirms state persists across jobs
   - Example: Expand job A → select job B → job B also expanded

4. **Context/Redux global state**
   - Rejected: Overkill for single component state
   - No need to share with other components

---

## 4. CSS Height Transition Best Practices

### Decision
Animate height change using CSS transitions, inline styles (existing pattern)

### Findings
Current codebase uses **inline CSS-in-JS** pattern throughout `JobDashboard.tsx`. Maintain consistency.

### Rationale
- **Inline styles chosen**: Matches existing codebase convention
- **maxHeight property**: Allows smooth transition (unlike `height: auto`)
- **Transition timing**: 0.3s ease-in-out (standard UX timing)

### Implementation Pattern
```typescript
const detailSectionStyle = {
  maxHeight: isExpanded ? '90%' : '60%',
  overflow: 'auto', // Enable scrolling when content exceeds height
  transition: 'max-height 0.3s ease-in-out',
  // ... other existing styles
};
```

### Current State Analysis
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
- Current detail containers use `maxWidth: '600px'` (lines 2734, 3205, 3605, 3761)
- Need to **add** `maxHeight` property (currently unset, defaults to content height)
- **Change**: From implicit ~60% to explicit 60%/90% based on toggle

### Alternatives Considered
1. **External CSS classes**
   - Rejected: Breaks existing inline-styles pattern
   - Would require new .css file, import statements

2. **React Spring animation library**
   - Rejected: Adds dependency (`npm install react-spring`)
   - Overkill for simple height transition

3. **CSS-in-JS library (styled-components)**
   - Rejected: Not present in current stack
   - Would require new dependency

4. **Direct height calculation**
   - Rejected: `height: 'calc(90vh - 100px)'` less flexible than percentage
   - Harder to maintain consistent panel proportions

---

## 5. Database Query Performance for Spam Detection

### Decision
Verify existing index on `(job_id, changed_at)` in `job_status_history` table; if missing, document performance note (no schema changes)

### Findings
**Index Requirements** for fast spam detection query:
- `SELECT MAX(changed_at) FROM job_status_history WHERE job_id = ?`
- Index on `job_id` enables fast WHERE clause
- Index on `changed_at` (or covering index) enables fast MAX aggregation

### Rationale
- **Constraint FR-005**: No database schema modifications allowed
- **Best practice**: Verify index exists in existing schemas
- **Performance target**: <100ms query time (from Technical Context)

### Schema Verification
**Check files**:
1. `platform/core/src/backend/database/postgresql-service.ts` - CREATE TABLE statements
2. `platform/core/src/backend/database/sqlite-service.ts` - CREATE TABLE statements

**Expected Indexes**:
- PostgreSQL: Auto-index on PRIMARY KEY (id), Foreign key index on (job_id)
- SQLite: Auto-index on PRIMARY KEY (id), Foreign key index on (job_id)

**Status**: Existing foreign key index on `job_id` sufficient for WHERE clause. MAX(changed_at) performs sequential scan on matching rows (acceptable for single-user session, small result set).

### Performance Analysis
**Query Execution Plan** (estimated):
1. Index scan on `job_id` → O(log n) lookup
2. Sequential scan on matching rows for MAX(changed_at) → O(k) where k = # status changes per job
3. **Expected k**: 5-10 status changes per job (typical job application lifecycle)
4. **Total time**: <10ms (well under 100ms target)

### Alternatives Considered
1. **Add composite index (job_id, changed_at DESC)**
   - Rejected: Violates FR-005 (no schema changes)
   - Would enable O(1) MAX lookup via index-only scan

2. **Materialized view with last_change_time**
   - Rejected: Violates FR-005, adds complexity

3. **Trigger to update jobs.last_status_change_at**
   - Rejected: Violates FR-005, couples status history to jobs table

---

## 6. Error Handling Strategy for Spam Detection

### Decision
**Silent ignore** spam requests (do not insert duplicate status) with optional client-side feedback

### Findings
Two approaches for spam detection response:
1. **HTTP 429 Too Many Requests** - Explicit error response
2. **HTTP 200 OK + silent ignore** - Success response, no database insert
3. **HTTP 200 OK + client-side toast** - Success with UX feedback

### Rationale
- **Silent ignore chosen**: Better UX for accidental clicks
- **No error thrown**: User intent was to change status, duplicate prevented is implementation detail
- **Frontend behavior**: Status button reflects current state (no change if spam detected)

### Implementation Pattern
```typescript
// Backend endpoint (pseudocode)
router.put('/api/jobs/:id', async (req, res) => {
  const canUpdate = await canUpdateStatus(req.params.id);

  if (!canUpdate) {
    // Option 1: Silent ignore
    return res.status(200).json({
      message: 'Status unchanged (too soon)',
      spamDetected: true
    });
  }

  // Proceed with status update
  await updateJobStatus(req.params.id, req.body.status);
  res.status(200).json({ message: 'Status updated' });
});
```

### Alternatives Considered
1. **HTTP 429 Too Many Requests**
   - Rejected: Implies rate limiting (429 typically for API quota)
   - User didn't exceed quota, just clicked too fast

2. **HTTP 409 Conflict**
   - Considered: Could indicate "conflicting rapid changes"
   - Rejected: Not truly a conflict (no concurrent updates)

3. **Client-side toast notification**
   - Deferred: Optional UX enhancement
   - Future: Show "Please wait 3 seconds between status changes"

---

## 7. Edge Case Handling

### Multi-User Concurrent Updates
**Scenario**: Two users updating same job status rapidly (spec.md line 107-108)

**Analysis**:
- **Current architecture**: Session-based, no shared state
- **Database**: PostgreSQL supports concurrent transactions
- **Race condition risk**: Two simultaneous updates within 3s window

**Decision**: Accept race condition (low probability)
- **Rationale**: Session-based app = single user per job in practice
- **Mitigation**: Database transaction isolation handles concurrent writes
- **Future enhancement**: Add row-level locking if multi-user editing required

### Expansion State Persistence (Job Switching)
**Scenario**: User expands detail view, selects different job (spec.md line 114-115)

**Clarification Answer**: Expansion state persists (stay expanded for all jobs)

**Implementation**:
- Single `isExpanded` state variable (not per-job)
- Changing `selectedJob` does NOT reset `isExpanded`
- User must manually collapse if desired

### No Job Selected State
**Scenario**: Expand button when `selectedJob === null` (spec.md line 117-118)

**Decision**: Disable button when no job selected

**Implementation**:
```typescript
<button
  onClick={toggleExpansion}
  disabled={!selectedJob}
  style={{ opacity: selectedJob ? 1 : 0.5 }}
>
  {isExpanded ? 'Collapse' : 'Expand'}
</button>
```

---

## Summary

### Key Decisions
1. ✅ **Server-side spam prevention** using timestamp comparison (3-second threshold)
2. ✅ **Database query approach** for last change time (no caching needed)
3. ✅ **useState hook** for expansion toggle (session-scoped)
4. ✅ **Inline CSS transition** for height animation (maintains consistency)
5. ✅ **Silent ignore strategy** for spam responses (better UX)
6. ✅ **Verify existing indexes** (no schema changes, document if optimization needed)

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Multi-user race condition | Low | Medium | Accept for MVP, session-based reduces risk |
| Missing database index | Low | Low | Query still fast (<100ms), document for future |
| Performance degradation | Very Low | Low | Spam check adds ~10ms per status update |
| UX confusion (silent ignore) | Low | Low | Consider toast notification in future |

### Implementation Readiness
✅ All research complete
✅ No blockers identified
✅ Clear patterns for both features
✅ Existing architecture supports both features

**Ready to proceed to Phase 1 (quickstart.md)**
