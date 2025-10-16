# Feature Specification: Progress Date 2-Minute Consolidation Window

**Feature Branch**: `017-investigate-a-bug`
**Created**: 2025-10-15
**Status**: Draft
**Input**: User description: "我需要investigate a bug where progress date update insync with database. 目前我希望的设计是用户误操作update工作的status之后, 如果2分钟内回滚到最开始的状态, 或者一系列的action之后回到之前的某一个状态, 那么只保留这个状态. 举个例子 A->B->C->D->C->D->A->B,那么会回到B. 并且我希望progress date里面的信息, 再这个2分钟的period结束之后, 至更新最后的状态, 比如现在是 xxx - Apllied, 然后再2分钟内, 做了各种测试之后,都被记录在Progress date, 但是2分钟后假设停留在了screening, 那最后清除掉中间, 只保留 xxxx - screening"

## Execution Flow (main)
```
1. Parse user description from Input
   → User wants 2-minute consolidation window for job status changes
2. Extract key concepts from description
   → Actors: Job application user
   → Actions: Update job status multiple times, rollback, consolidate history
   → Data: Job status history, Progress Date display
   → Constraints: 2-minute time window
3. For each unclear aspect:
   → [NEEDS CLARIFICATION: What happens if user updates status again after 2 minutes? Does a new 2-minute window start?]
   → [NEEDS CLARIFICATION: Should the system show a countdown timer to users during the 2-minute window?]
4. Fill User Scenarios & Testing section
   → ✅ Clear user flow identified
5. Generate Functional Requirements
   → ✅ All requirements testable
6. Identify Key Entities
   → ✅ Job Status History entries identified
7. Run Review Checklist
   → ⚠️ WARN: 2 clarification questions remain
8. Return: SUCCESS (spec ready for planning with clarifications)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-15

- Q: Should subsequent status updates within the 2-minute consolidation window reset the timer (sliding window), or is it fixed at 2 minutes from the first update? → A: Fixed Window - Timer is locked to 2 minutes from the FIRST update in the window
- Q: When a user updates job status AFTER history has been consolidated (after the 2-minute window ended), does this trigger a new consolidation window? → A: New Window - Any status change after consolidation starts a fresh 2-minute consolidation window
- Q: Should consolidation happen server-side (requires storing connection strings) or client-side only? → A: Hybrid Approach - Client-side timer normally, but backend provides lazy consolidation (checks for expired windows on any status update request) for eventual consistency
- Q: Should users see visual feedback during the consolidation window (e.g., countdown timer, indicator)? → A: Transparent - Consolidation happens silently in the background with no visual indication to the user

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A user is updating job statuses rapidly while experimenting or testing different status values. They want the system to:
1. Allow free experimentation during a 2-minute window (counted from the first status change)
2. Show all intermediate changes in Progress Dates during experimentation
3. After exactly 2 minutes from the first update, automatically consolidate the history to show only the final status reached

**Why this matters**: Users make mistakes or want to test different statuses without cluttering their permanent job history with accidental changes. The fixed 2-minute window provides predictable consolidation timing.

### Acceptance Scenarios

1. **Given** a job with status "Applied" at 10:00:00, **When** user changes status to "Screening" at 10:00:10, "Interview" at 10:00:20, and "Screening" at 10:00:30, **Then** Progress Dates shows all three changes immediately (Applied → Screening → Interview → Screening)

2. **Given** the scenario above with first change at 10:00:10, **When** exactly 2 minutes elapse from the first update (at 10:02:10), **Then** Progress Dates consolidates to show only "Applied → Screening" (final status)

3. **Given** a job with status "Applied", **When** user performs rapid status changes: A→B→C→D→C→D→A→B within 2 minutes, **Then** Progress Dates immediately reflects all changes during the window

4. **Given** the scenario above with first update at 10:01:00, **When** 2 minutes elapse from first update (at 10:03:00), **Then** system consolidates history and Progress Dates shows only the final transition: "A → B"

5. **Given** a job with consolidated history showing "Applied → Screening", **When** user updates status to "Interview" at 10:05:00, **Then** a new 2-minute consolidation window begins (timer starts fresh from this update)

6. **Given** user makes first status change at 10:00:00 (starting consolidation window), **When** user makes another status change at 10:01:59, **Then** consolidation still happens at 10:02:00 (timer does NOT reset)

### Edge Cases

- **What happens when user updates status at 1:59 into the window?** ✅ **CLARIFIED**: Consolidation happens at the original 2-minute mark (10:02:00 if first update at 10:00:00). The timer is fixed and does NOT reset.

- **What happens if user closes the browser during the 2-minute window?** ✅ **CLARIFIED**: Hybrid approach - Client-side timer runs normally, but backend also checks for expired consolidation windows on any status update request (lazy consolidation). This provides eventual consistency without requiring server-side scheduled jobs or storing connection strings.

- **What happens if there are multiple jobs being updated simultaneously?** Does each job have its own independent 2-minute window?

- **What if the last status in the sequence is identical to the first?** Example: A→B→C→A. Should this delete the entire sequence and show no change?

## Requirements *(mandatory)*

### Functional Requirements

**Status Update Recording:**
- **FR-001**: System MUST allow users to update job status multiple times without restriction during a 2-minute consolidation window
- **FR-002**: System MUST record all status changes with accurate timestamps during the active window
- **FR-003**: System MUST display all intermediate status changes in Progress Dates immediately during the 2-minute window

**Consolidation Behavior:**
- **FR-004**: System MUST automatically consolidate status history exactly 2 minutes after the FIRST status change in a consolidation window (fixed window, not sliding)
- **FR-005**: System MUST retain only the final status reached during the consolidation window
- **FR-006**: System MUST delete all intermediate status history entries that occurred during the consolidation window
- **FR-007**: System MUST preserve the original starting status before the consolidation window began
- **FR-015**: Backend MUST check for and consolidate any expired consolidation windows (older than 2 minutes) on every status update request (lazy consolidation pattern)
- **FR-016**: Frontend MUST run a client-side timer to trigger consolidation at the 2-minute mark during normal operation

**Display & Feedback:**
- **FR-008**: Progress Dates display MUST immediately reflect the consolidated history after the 2-minute window expires
- **FR-009**: System MUST automatically refresh Progress Dates display to show consolidated data without requiring user action
- **FR-017**: System MUST NOT show visual indicators, countdown timers, or notifications during the consolidation window (transparent operation)

**Window Management:**
- **FR-010**: Each job MUST have its own independent consolidation window
- **FR-011**: Consolidation timer MUST be fixed at exactly 2 minutes from the first status update in the window (subsequent updates within the window do NOT reset or extend the timer)
- **FR-014**: Any status change made after a consolidation window has completed MUST start a new 2-minute consolidation window for that job

**Example Behavior:**
- **FR-012**: Given status sequence A→B→C→D→C→D→A→B, system MUST consolidate to final status B
- **FR-013**: Given initial status "Applied" and final status "Screening" after 2-minute window, Progress Dates MUST show only "Applied → Screening"

### Key Entities

- **Job Status History Entry**: Records a single status change event
  - Attributes: job identifier, status value, timestamp, consolidation window identifier
  - Lifecycle: Created immediately on status update, deleted during consolidation if not the final status
  - Relationships: Belongs to one job, part of a consolidation window group

- **Consolidation Window**: Represents a 2-minute period of status experimentation
  - Attributes: start timestamp (from first update), fixed end timestamp (start + 2 minutes), final status
  - Behavior: Automatically triggers cleanup at fixed end time regardless of subsequent updates
  - Relationships: Contains multiple status history entries for one job

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] ✅ No [NEEDS CLARIFICATION] markers remain - **All 4 critical questions resolved**
- [x] Requirements are testable and unambiguous (except where marked)
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (all resolved)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed - **All clarifications complete**

---

## Clarification Questions Summary

Before proceeding to planning phase, please clarify:

1. ~~**Timer Reset Behavior**~~ ✅ **CLARIFIED**: Fixed window (2 minutes from first update, does not reset)

2. ~~**Post-Window Updates**~~ ✅ **CLARIFIED**: New Window - Any status change after consolidation starts a fresh 2-minute window

3. ~~**Browser Close Behavior**~~ ✅ **CLARIFIED**: Hybrid Approach - Client-side timer for normal operation, backend lazy consolidation (checks expired windows on status update requests) for eventual consistency

4. ~~**Visual Feedback**~~ ✅ **CLARIFIED**: Transparent - No visual indicators, countdown timers, or notifications shown during consolidation window

---

## Comparison with Current Implementation (Feature 016)

**Current (Feature 016)**:
- 5-second window
- Rollback pattern detection (A→B→A deletes B)
- Immediate cleanup on each update

**Proposed (Feature 017)**:
- 2-minute (120-second) fixed window from first update
- Final-state-only consolidation (keeps last status regardless of pattern)
- Delayed batch cleanup at fixed time

**Key Difference**: Feature 016 detects specific rollback patterns and cleans up immediately. Feature 017 waits exactly 2 minutes from the first update and keeps only the final status, regardless of the pattern.
