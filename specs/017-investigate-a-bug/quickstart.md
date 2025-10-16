# Quickstart: Testing 2-Minute Consolidation Window

**Date**: 2025-10-15
**Feature**: 017-investigate-a-bug
**Purpose**: Manual and automated test scenarios for validating Feature 017 implementation

## Prerequisites

- Backend running on port 3000
- Frontend running on port 5173
- Database initialized with sample jobs
- Browser with Developer Tools open (for localStorage inspection)

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend

# Terminal 3: Run tests (after implementation)
npm test -- --testPathPattern=consolidation
```

---

## Scenario 1: Rapid Updates Within Window → All Visible Immediately

**Reference**: spec.md line 63
**User Story**: All intermediate changes shown in Progress Dates during experimentation

### Manual Test Steps

1. Navigate to http://localhost:5173
2. Select a job with status "applied"
3. Open Browser DevTools → Console tab
4. Rapidly change status (within 30 seconds):
   - Click "Screening" (T=0)
   - Click "Interview" (T=10 sec)
   - Click "Screening" (T=20 sec)
5. Open "Progress Dates" section
6. **Expected**: See all 3 changes immediately:
   ```
   2025-10-15 10:00:00 - Applied
   2025-10-15 10:00:10 - Screening
   2025-10-15 10:00:20 - Interview
   2025-10-15 10:00:30 - Screening
   ```
7. Wait exactly 2 minutes from first change (T=120 sec)
8. **Expected**: Progress Dates auto-updates to show only:
   ```
   2025-10-15 10:00:00 - Applied
   2025-10-15 10:00:30 - Screening
   ```
   (Intermediate "Interview" entry deleted)

### Automated Test (Integration)

```typescript
// tests/integration/consolidation-rapid-updates.test.ts

describe('Scenario 1: Rapid Updates Within Window', () => {
  it('should display all intermediate changes during 2-minute window', async () => {
    const job = await createTestJob({ status: 'applied' })

    // Make rapid status changes
    await updateJobStatus(job.id, 'screening')  // T=0
    await sleep(10000)
    await updateJobStatus(job.id, 'interview')  // T=10
    await sleep(10000)
    await updateJobStatus(job.id, 'screening')  // T=20

    // Fetch job data
    const updatedJob = await getJob(job.id)

    // Assert: All 4 history entries exist (applied + 3 updates)
    expect(updatedJob.statusHistory).toHaveLength(4)
    expect(updatedJob.statusHistory.map(h => h.status)).toEqual([
      'screening',  // Latest
      'interview',
      'screening',
      'applied'     // Initial
    ])

    // Assert: Active consolidation window exists
    expect(updatedJob.consolidationWindow).toBeDefined()
    expect(updatedJob.consolidationWindow.isActive).toBe(true)
    expect(updatedJob.consolidationWindow.firstStatus).toBe('screening')
  })

  it('should consolidate to final status after 2 minutes', async () => {
    const job = await createTestJob({ status: 'applied' })

    // Record start time
    const startTime = Date.now()

    // Make rapid changes
    await updateJobStatus(job.id, 'screening')
    await updateJobStatus(job.id, 'interview')
    await updateJobStatus(job.id, 'screening')

    // Wait for consolidation window to expire (2 minutes)
    const elapsedTime = Date.now() - startTime
    const remainingTime = 120000 - elapsedTime
    await sleep(remainingTime + 1000)  // Wait 1 extra second

    // Trigger lazy consolidation by making new request
    const updatedJob = await getJob(job.id)

    // Assert: Only 2 history entries remain (applied + final screening)
    expect(updatedJob.statusHistory).toHaveLength(2)
    expect(updatedJob.statusHistory.map(h => h.status)).toEqual([
      'screening',  // Final status
      'applied'     // Initial (before window)
    ])

    // Assert: Consolidation window marked inactive
    // (or no active window if deleted)
    expect(updatedJob.consolidationWindow).toBeNull()
  })
})
```

---

## Scenario 2: After 2 Minutes → Consolidated to Final Status Only

**Reference**: spec.md line 65
**User Story**: System automatically consolidates history after exactly 2 minutes

### Manual Test Steps

1. Navigate to job dashboard
2. Select a job with status "applied"
3. Change status to "screening" (T=0)
4. Note the current time (e.g., 10:00:00)
5. Open Browser DevTools → Application → Local Storage → `consolidation_window_${jobId}`
6. **Expected**: See `windowStartTime` timestamp
7. Change status to "interview" at T=30 sec
8. Change status back to "screening" at T=60 sec
9. **DO NOT interact** with the UI for 2 minutes
10. At T=120 sec (exactly 2 min after first change):
    - **Expected**: Frontend timer fires automatically
    - **Expected**: Progress Dates refreshes
    - **Expected**: Only 2 entries remain:
      ```
      2025-10-15 10:00:00 - Applied
      2025-10-15 10:02:00 - Screening
      ```
11. Check localStorage again
12. **Expected**: `consolidation_window_${jobId}` key deleted

### Automated Test (Integration)

```typescript
// tests/integration/consolidation-final-status.test.ts

describe('Scenario 2: Consolidation After 2 Minutes', () => {
  it('should keep only final status after window expires', async () => {
    const job = await createTestJob({ status: 'applied' })
    const startTime = Date.now()

    // Simulate user actions
    await updateJobStatus(job.id, 'screening')   // T=0
    await sleep(30000)
    await updateJobStatus(job.id, 'interview')   // T=30
    await sleep(30000)
    await updateJobStatus(job.id, 'screening')   // T=60

    // Wait for window to expire
    const elapsed = Date.now() - startTime
    await sleep(120000 - elapsed + 1000)

    // Trigger lazy consolidation
    await updateJobStatus(job.id, 'interview')   // New update after window

    const updatedJob = await getJob(job.id)

    // Assert: Old window consolidated (only final status kept)
    const oldWindowEntries = updatedJob.statusHistory.filter(h =>
      new Date(h.changedAt).getTime() < startTime + 120000
    )
    expect(oldWindowEntries).toHaveLength(2)  // applied + screening (final)

    // Assert: New window started for latest update
    expect(updatedJob.consolidationWindow).toBeDefined()
    expect(updatedJob.consolidationWindow.firstStatus).toBe('interview')
  })
})
```

---

## Scenario 3: Complex Pattern A→B→C→D→C→D→A→B → Final State B

**Reference**: spec.md line 67
**User Story**: Consolidation keeps only final status regardless of pattern

### Manual Test Steps

1. Select a job with status "applied" (A)
2. Perform the following rapid changes (all within 2 minutes):
   - Change to "screening" (B) at T=0
   - Change to "interview" (C) at T=15 sec
   - Change to "offered" (D) at T=30 sec
   - Change to "interview" (C) at T=45 sec
   - Change to "offered" (D) at T=60 sec
   - Change to "applied" (A) at T=75 sec
   - Change to "screening" (B) at T=90 sec
3. Open Progress Dates immediately
4. **Expected**: See all 8 entries (initial A + 7 updates)
5. Wait until T=120 sec (2 min from first change)
6. **Expected**: Progress Dates consolidates to show:
   ```
   2025-10-15 10:00:00 - Applied (initial, before window)
   2025-10-15 10:01:30 - Screening (final status)
   ```
7. All intermediate entries (B→C→D→C→D→A) deleted

### Automated Test (Integration)

```typescript
// tests/integration/consolidation-complex-pattern.test.ts

describe('Scenario 3: Complex Pattern A→B→C→D→C→D→A→B', () => {
  it('should keep only final status B after consolidation', async () => {
    const job = await createTestJob({ status: 'applied' })  // A
    const startTime = Date.now()

    // Simulate complex pattern
    const updates = [
      'screening',  // B (T=0)
      'interview',  // C (T=15)
      'offered',    // D (T=30)
      'interview',  // C (T=45)
      'offered',    // D (T=60)
      'applied',    // A (T=75)
      'screening'   // B (T=90)
    ]

    for (let i = 0; i < updates.length; i++) {
      if (i > 0) await sleep(15000)  // 15 sec between updates
      await updateJobStatus(job.id, updates[i])
    }

    // Assert: All entries exist during window
    let job After = await getJob(job.id)
    expect(jobAfter.statusHistory).toHaveLength(8)  // Initial + 7 updates

    // Wait for consolidation
    const elapsed = Date.now() - startTime
    await sleep(120000 - elapsed + 1000)

    // Trigger consolidation
    jobAfter = await getJob(job.id)

    // Assert: Only 2 entries remain
    expect(jobAfter.statusHistory).toHaveLength(2)
    expect(jobAfter.statusHistory[0].status).toBe('screening')  // B (final)
    expect(jobAfter.statusHistory[1].status).toBe('applied')    // A (initial)
  })
})
```

---

## Scenario 5: Post-Consolidation Update → New Window Starts

**Reference**: spec.md line 71
**User Story**: Status change after consolidation triggers new 2-minute window

### Manual Test Steps

1. Create consolidation window (change status at T=0)
2. Wait 2 minutes for consolidation to complete
3. Verify Progress Dates shows consolidated history
4. Change status again (T=125 sec, after consolidation)
5. **Expected**: New consolidation window starts
6. Check localStorage: `consolidation_window_${jobId}` key created with new `windowStartTime`
7. **Expected**: `windowStartTime` reflects the time of step 4 (not original window)
8. Make another status change within 2 minutes (T=150 sec)
9. **Expected**: Timer does NOT reset (still expires at T=125 + 120 = 245 sec)

### Automated Test (Integration)

```typescript
// tests/integration/consolidation-new-window.test.ts

describe('Scenario 5: New Window After Consolidation', () => {
  it('should start new window after old window consolidates', async () => {
    const job = await createTestJob({ status: 'applied' })

    // First window
    const window1StartTime = Date.now()
    await updateJobStatus(job.id, 'screening')
    await updateJobStatus(job.id, 'interview')

    // Wait for consolidation
    await sleep(120000)

    // Trigger consolidation + start new window
    const window2StartTime = Date.now()
    await updateJobStatus(job.id, 'offered')

    const updatedJob = await getJob(job.id)

    // Assert: New window exists
    expect(updatedJob.consolidationWindow).toBeDefined()
    expect(updatedJob.consolidationWindow.firstStatus).toBe('offered')

    // Assert: New window start time is AFTER first window
    expect(updatedJob.consolidationWindow.windowStartTime).toBeGreaterThan(
      window1StartTime + 120000
    )

    // Assert: Old window entries consolidated
    const consolidatedEntries = updatedJob.statusHistory.filter(h =>
      new Date(h.changedAt).getTime() < window1StartTime + 120000
    )
    expect(consolidatedEntries).toHaveLength(2)  // applied + interview (final)
  })
})
```

---

## Scenario 6: Fixed Timer (Update at 1:59 → Consolidate at 2:00)

**Reference**: spec.md line 73
**User Story**: Timer is locked to first update (does not reset on subsequent updates)

### Manual Test Steps

1. Change job status (T=0, starts window)
2. Wait 119 seconds (1 min 59 sec)
3. Change status again (T=119 sec, 1 second before expiration)
4. **Expected**: Timer does NOT reset
5. **Expected**: Window expires at T=120 sec (exactly 2 min from first update)
6. Observe: Progress Dates consolidates at T=120 sec (not at T=119+120=239 sec)

### Automated Test (Integration)

```typescript
// tests/integration/consolidation-fixed-timer.test.ts

describe('Scenario 6: Fixed Timer Does Not Reset', () => {
  it('should NOT reset timer on subsequent updates', async () => {
    const job = await createTestJob({ status: 'applied' })

    // First update (T=0)
    const startTime = Date.now()
    await updateJobStatus(job.id, 'screening')

    // Get window info
    let updatedJob = await getJob(job.id)
    const windowEndTime = updatedJob.consolidationWindow.windowEndTime

    // Wait 119 seconds (1 sec before expiration)
    await sleep(119000)

    // Second update (T=119)
    await updateJobStatus(job.id, 'interview')

    // Get window info again
    updatedJob = await getJob(job.id)

    // Assert: windowEndTime UNCHANGED
    expect(updatedJob.consolidationWindow.windowEndTime).toBe(windowEndTime)

    // Assert: Remaining time is ~1 second (not 120 seconds)
    expect(updatedJob.consolidationWindow.remainingMs).toBeLessThan(2000)
    expect(updatedJob.consolidationWindow.remainingMs).toBeGreaterThan(0)

    // Wait for consolidation (1 more second)
    await sleep(2000)

    // Trigger consolidation check
    updatedJob = await getJob(job.id)

    // Assert: Window expired and consolidated
    // Time elapsed: 121 sec (should be consolidated)
    expect(Date.now() - startTime).toBeGreaterThan(120000)
    expect(updatedJob.consolidationWindow).toBeNull()  // Window consolidated
  })
})
```

---

## Edge Case: Browser Close During Consolidation Window

**Reference**: spec.md clarification (line 79)
**User Story**: Consolidation continues even if user closes browser

### Manual Test Steps

1. Change job status (T=0, starts window)
2. Make 2-3 more status changes within 30 seconds
3. **Close browser tab** (before 2 minutes elapse)
4. Wait 90 seconds (enough for window to expire: total 120 sec)
5. **Reopen browser** → Navigate to job dashboard
6. Select the same job
7. **Expected**: Progress Dates shows consolidated history (only final status)
8. **Expected**: Backend lazy consolidation ran when job was fetched

### Automated Test (Integration)

```typescript
// tests/integration/consolidation-browser-close.test.ts

describe('Edge Case: Browser Close During Window', () => {
  it('should consolidate via backend lazy consolidation', async () => {
    const job = await createTestJob({ status: 'applied' })

    // Simulate user actions (frontend timer running)
    await updateJobStatus(job.id, 'screening')
    await updateJobStatus(job.id, 'interview')
    await updateJobStatus(job.id, 'screening')

    // Simulate browser close (no frontend timer cleanup)
    // Window is now "abandoned" but still active in database

    // Wait for window to expire (2 minutes)
    await sleep(120000)

    // Simulate page reload → fetch job (triggers lazy consolidation)
    const updatedJob = await getJob(job.id)

    // Assert: Backend detected expired window and consolidated
    expect(updatedJob.statusHistory).toHaveLength(2)  // applied + screening
    expect(updatedJob.consolidationWindow).toBeNull()  // Window inactive
  })
})
```

---

## Edge Case: Multiple Jobs with Concurrent Windows

**Reference**: spec.md clarification (line 81)
**User Story**: Each job has independent consolidation window

### Manual Test Steps

1. Open 2 jobs side-by-side (use browser split view or 2 tabs)
2. Job A: Change status (T=0)
3. Job B: Change status (T=30 sec)
4. Job A: Change status again (T=60 sec)
5. Job B: Change status again (T=90 sec)
6. **Expected**: Job A window expires at T=120 sec (2 min from T=0)
7. **Expected**: Job B window expires at T=150 sec (2 min from T=30)
8. Observe: Each job consolidates independently at different times

### Automated Test (Integration)

```typescript
// tests/integration/consolidation-concurrent-windows.test.ts

describe('Edge Case: Multiple Jobs with Concurrent Windows', () => {
  it('should handle independent windows for multiple jobs', async () => {
    const jobA = await createTestJob({ status: 'applied' })
    const jobB = await createTestJob({ status: 'applied' })

    // Start window for Job A (T=0)
    const jobAStartTime = Date.now()
    await updateJobStatus(jobA.id, 'screening')

    // Wait 30 seconds
    await sleep(30000)

    // Start window for Job B (T=30)
    const jobBStartTime = Date.now()
    await updateJobStatus(jobB.id, 'interview')

    // Add more updates
    await updateJobStatus(jobA.id, 'interview')  // Job A: T=60
    await updateJobStatus(jobB.id, 'offered')    // Job B: T=90

    // Wait for Job A window to expire (90 more seconds)
    await sleep(90000)

    // Fetch Job A → should consolidate
    let jobAData = await getJob(jobA.id)
    expect(jobAData.consolidationWindow).toBeNull()  // Consolidated

    // Fetch Job B → should still be active
    let jobBData = await getJob(jobB.id)
    expect(jobBData.consolidationWindow).toBeDefined()  // Still active
    expect(jobBData.consolidationWindow.isActive).toBe(true)

    // Wait for Job B window to expire (30 more seconds)
    await sleep(30000)

    // Fetch Job B → should consolidate now
    jobBData = await getJob(jobB.id)
    expect(jobBData.consolidationWindow).toBeNull()  // Consolidated
  })
})
```

---

## Testing Checklist

**Manual Testing (Before Commit)**:
- [ ] Scenario 1: Rapid updates visible immediately ✅
- [ ] Scenario 2: Consolidation after 2 minutes ✅
- [ ] Scenario 3: Complex pattern A→B→C→D→C→D→A→B ✅
- [ ] Scenario 5: New window after consolidation ✅
- [ ] Scenario 6: Fixed timer (no reset) ✅
- [ ] Edge case: Browser close during window ✅
- [ ] Edge case: Multiple concurrent windows ✅

**Automated Testing (CI/CD)**:
- [ ] All contract tests pass (tests/contract/)
- [ ] All integration tests pass (tests/integration/)
- [ ] Unit tests for database methods pass (tests/unit/)
- [ ] Performance: Status update < 100ms p95
- [ ] Performance: Lazy consolidation < 50ms p95

**Frontend Validation**:
- [ ] localStorage persists windowStartTime correctly
- [ ] Timer cleanup on component unmount (no memory leaks)
- [ ] Progress Dates auto-refreshes after consolidation
- [ ] No visual indicators during window (transparent operation)

**Backend Validation**:
- [ ] Lazy consolidation runs on every status update request
- [ ] Database constraint: Only one active window per job
- [ ] Foreign key constraint: consolidationWindowId → consolidation_windows
- [ ] Migration scripts work for both PostgreSQL and SQLite

---

## Performance Benchmarks

**Target Metrics** (from plan.md):
- Status update endpoint: < 100ms p95
- Lazy consolidation check: < 50ms p95
- Frontend timer setup: < 10ms
- Progress Dates re-render: < 50ms

**Benchmarking Commands**:
```bash
# Measure status update latency
curl -w "@curl-format.txt" -o /dev/null -s \
  -X PATCH http://localhost:3000/api/jobs/123/status \
  -H "Content-Type: application/json" \
  -H "x-database-config: ${DB_CONFIG_BASE64}" \
  -d '{"status": "screening"}'

# Load test: 100 concurrent status updates
npm run benchmark -- --test=consolidation-load
```

---

## Next Steps

- [ ] Implement backend database methods (postgresql-service.ts, sqlite-service.ts)
- [ ] Update API endpoints (jobs.ts)
- [ ] Implement frontend timer (JobDashboard.tsx)
- [ ] Write contract tests
- [ ] Write integration tests
- [ ] Run manual validation with this quickstart guide
- [ ] Performance benchmarking
- [ ] Update documentation (CLAUDE.md, memory.md)
