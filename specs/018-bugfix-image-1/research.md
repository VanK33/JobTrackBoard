# Research: Progress Dates Consolidation Bug Fix

**Feature**: 018-bugfix-image-1
**Date**: 2025-10-15
**Researcher**: Implementation Planning Agent

## Research Questions

### 1. What is the current consolidation logic in Feature 017?

**Finding**:
The current `consolidateWindow()` implementation (introduced in Feature 017) uses:

```typescript
// PostgreSQL: platform/core/src/backend/database/postgresql-service.ts:830
// SQLite: platform/core/src/backend/database/sqlite-service.ts (equivalent)

const entriesToDelete = entries.slice(0, -1)  // Delete all except LAST
```

**Analysis**:
- `entries.slice(0, -1)` creates an array from index 0 to second-to-last
- This deletes ALL entries including the first one
- Only the LAST entry survives consolidation
- Result: Progress Dates shows only the final status, losing the original status timestamp

**Decision**: Change to `entries.slice(1, -1)` to preserve FIRST and LAST entries.

**Rationale**: The spec clarifies that users need to see the progression from original status to final status, not just the final status in isolation. Keeping only the first and last entries provides this context while still removing intermediate "experimentation" changes.

**Alternatives Considered**:
1. Keep all entries (no consolidation) - Rejected: Defeats the purpose of consolidation
2. Keep first 2 entries - Rejected: Doesn't handle long chains (A→B→C→D→E)
3. Keep first and last - ✅ Selected: Provides minimum meaningful context

### 2. How should the rollback scenario be handled?

**Scenario**: User changes B→C→D→A→D→C→B (returns to original status B)

**Current Behavior**:
- Keeps only last B entry
- Deletes first B entry (original timestamp lost)

**Required Behavior** (from clarifications):
- Keep only ONE entry "B"
- Use original timestamp from first B
- Delete all intermediate entries AND the last B

**Decision**: Add rollback detection logic:

```typescript
if (entries[0].status === entries[entries.length - 1].status) {
  // Rollback scenario: first and last are same status
  entriesToDelete = entries.slice(1)  // Delete all except first
} else {
  // Normal scenario: first and last are different
  entriesToDelete = entries.slice(1, -1)  // Delete only intermediate
}
```

**Rationale**: This preserves the "no net change" semantic (user ended where they started) while maintaining the original timestamp to accurately reflect when they first reached that status.

**Alternatives Considered**:
1. Keep both first and last B entries - Rejected: Shows duplicate status in Progress Dates
2. Keep last B entry - Rejected: Loses original timestamp
3. Merge into first B entry - ✅ Selected: Preserves original timestamp, shows single entry

### 3. How should `job_stage_timestamps` be updated during consolidation?

**Current Behavior**: No stage timestamp management during consolidation

**Problem**: If user reaches "Interview" stage but final status is "Screening", the `interview_at` timestamp persists even though the Interview entry was deleted from Progress Dates.

**Decision**: Nullify timestamps for intermediate stages only

**Logic**:
1. Identify which statuses appear in deleted intermediate entries
2. Check if those statuses also appear in first or last entry
3. If status appears ONLY in intermediate entries → set its timestamp to NULL
4. If status appears in first or last entry → preserve its timestamp

**Example**:
- A→B→C→B consolidates to A, B
- Deleted: C (intermediate)
- Stage timestamps: `c_timestamp` = NULL, `a_timestamp` and `b_timestamp` preserved

**Implementation Approach**:
```typescript
// After deleting intermediate entries
const keptStatuses = new Set([entries[0].status, entries[entries.length-1].status])
const deletedStatuses = entriesToDelete
  .map(e => e.status)
  .filter(s => !keptStatuses.has(s))

// For each unique deleted status, nullify its timestamp
for (const status of new Set(deletedStatuses)) {
  await nullifyStageTimestamp(jobId, status)
}
```

**Rationale**: Stage timestamps should reflect the final consolidated view of the job's progression. If a stage was only briefly visited during experimentation (within the 2-minute window) and didn't survive consolidation, its timestamp should be cleared.

**Alternatives Considered**:
1. Preserve all stage timestamps - Rejected: Inconsistent with consolidated history
2. Nullify all intermediate timestamps - Rejected: Loses information if status appears in both intermediate and final entries
3. Selective nullification (ONLY in intermediate) - ✅ Selected: Maintains consistency

### 4. How does this interact with Feature 016 (5-second rollback)?

**Feature 016**: Detects Applied→Screening→Applied within 5 seconds and immediately deletes the Screening entry

**Feature 017**: 2-minute consolidation window keeps all intermediate entries, consolidates after expiry

**Interaction Analysis**:

**Scenario 1**: User does A→B→A in 3 seconds
- Feature 016 activates: Immediately deletes B entry
- Feature 017: Never sees this pattern (already cleaned up)
- Result: No conflict

**Scenario 2**: User does A→B→A in 7 seconds (>5 seconds, <2 minutes)
- Feature 016 doesn't activate (>5 seconds)
- Feature 017 activates: Creates consolidation window
- After 2 minutes: Consolidates to single A entry (rollback logic)
- Result: No conflict, Feature 017 handles it

**Scenario 3**: User does A→B→C→D→B in 90 seconds
- Feature 016 doesn't activate (not immediate rollback to A)
- Feature 017 activates: Creates consolidation window
- After 2 minutes: Consolidates to A, B (this bugfix)
- Result: No conflict

**Decision**: No changes needed to Feature 016. The two features operate on different time scales and handle different patterns.

**Rationale**: Feature 016 is for immediate "oops" corrections (within 5 seconds). Feature 017 is for longer experimentation sessions (up to 2 minutes). The 5-second vs 2-minute thresholds provide clear separation.

## Technology Stack Decisions

**No new dependencies required**. The bugfix uses existing infrastructure:
- TypeScript 5.0+ (already in use)
- Node.js 18+ (already in use)
- pg (PostgreSQL client) - already in use
- sql.js (SQLite) - already in use

**Testing Approach**: Manual browser testing (following Feature 017 precedent)
- Feature 017 implementation did not include automated tests
- This bugfix follows the same approach for consistency
- Manual testing via browser console and UI observation

## Performance Considerations

**Query Impact**: Minimal
- Current implementation: SELECT + DELETE loop (N queries for N-1 deletions)
- New implementation: SELECT + DELETE loop (still N queries, but different N)
- No performance degradation expected

**Typical Case**: 3-5 status changes within consolidation window
- Current: 4 DELETE queries (delete all except last)
- New: 2 DELETE queries (delete only intermediate)
- Actual improvement: ~50% fewer DELETE queries

**Edge Case**: 20+ status changes (user clicking rapidly)
- Current: 19 DELETE queries
- New: 18 DELETE queries
- Impact: Negligible (<50ms difference)

**Decision**: No performance optimizations needed beyond the bug fix itself.

## Summary

**Key Findings**:
1. Bug is a simple array slice logic error: `slice(0, -1)` should be `slice(1, -1)`
2. Rollback scenario needs special handling: detect when first === last status
3. Stage timestamps need selective nullification for intermediate stages only
4. No conflicts with Feature 016 (5-second rollback)
5. No schema changes or new dependencies required

**Implementation Complexity**: LOW
- 2 files to modify (postgresql-service.ts, sqlite-service.ts)
- ~10 lines of logic change per file
- Estimated time: 30 minutes
