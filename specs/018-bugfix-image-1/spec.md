# Feature Specification: Progress Dates Consolidation Bug Fix

**Feature Branch**: `018-bugfix-image-1`
**Created**: 2025-10-15
**Status**: Draft
**Input**: User description: "BUGFIX - [Image #1] 请参考这个window, 我的设想中Progress Dates里面的信息, 应该是, 如果用户在2分钟的设定里面出现反复切换. 那么两分钟结束后, 最新的2条, 也就是最上面的那条Status: Applied和Status:Screening, 应该再前端和后端都被删除. 或者说这里应该依赖的是stage_timestamp. 我没记错的话, 我们更新job_stage_timestamp的逻辑是如果这里被重置了就会变成null?"

## Execution Flow (main)
```
1. Parse user description from Input
   → User reports bug in Progress Dates consolidation after 2-minute window
2. Extract key concepts from description
   → Actors: User updating job status repeatedly
   → Actions: Status changes within 2-minute consolidation window
   → Data: Progress Dates display, job_status_history, job_stage_timestamps
   → Constraints: After 2 minutes, show only FINAL status reached
3. For each unclear aspect:
   → [NEEDS CLARIFICATION: Should job_stage_timestamps be reset/nullified during consolidation?]
   → [NEEDS CLARIFICATION: What is the desired behavior if user returns to original status?]
4. Fill User Scenarios & Testing section
   → Scenario: User changes status Applied → Screening → Applied within 2 minutes
5. Generate Functional Requirements
   → Consolidation must keep only final status
   → All intermediate status history entries must be deleted
6. Identify Key Entities
   → job_status_history: Status change timeline
   → job_stage_timestamps: First-time arrival tracking per stage
7. Run Review Checklist
   → WARN "Spec has uncertainties regarding stage_timestamp behavior"
8. Return: SUCCESS (spec ready for planning with clarifications needed)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-15
- Q: What is the core consolidation logic after 2-minute window expires? → A: Keep FIRST entry (original status before window) and LAST entry (final status at window end). Delete ALL intermediate entries.
- Q: Example A→B→C→D→B, what remains after consolidation? → A: Only A (first) and B (last) remain. B, C, D (intermediate) are deleted.
- Q: Example B→C→D→A→D→C→B (returns to original), what remains? → A: Only ONE entry "B" remains, using the original timestamp from before consolidation window started.
- Q: When should job_stage_timestamps be nullified during consolidation? → A: Reset timestamps to NULL for any intermediate stages that were deleted (stages between first and last)

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a user managing job applications, when I experiment with different status changes within a 2-minute window (e.g., Applied → Screening → Applied), I expect the Progress Dates section to show only the **final status** I settled on after the consolidation period ends. All intermediate status changes made during my experimentation should be removed from both the display and the historical record.

**Current Bug**: After 2-minute consolidation, the Progress Dates still shows intermediate entries instead of consolidating to only the final status.

**Example from Image**:
```
Progress Dates shows:
- Oct 15, 2025    Status: Applied     ← Latest (top)
- Oct 15, 2025    Status: Screening   ← Intermediate
- Oct 15, 2025    Status: Applied     ← Original (bottom)

Expected after consolidation:
- Oct 15, 2025    Status: Applied     ← Only the FINAL status remains
```

### Acceptance Scenarios

1. **Given** a job with status "Applied", **When** user changes Applied → Screening → Applied within 2 minutes, **Then** Progress Dates should show only one "Status: Applied" entry (first and last are same, merged with original timestamp) after consolidation completes

2. **Given** a job with status "Applied", **When** user changes Applied → Screening → Interview → Screening within 2 minutes, **Then** Progress Dates should show "Applied" (first) and "Screening" (last) after consolidation. Intermediate "Screening" and "Interview" entries are deleted.

3. **Given** a job with status "Applied", **When** user changes Applied → Screening → Interview within 2 minutes, **Then** Progress Dates should show "Applied" (first) and "Interview" (last) after consolidation. Intermediate "Screening" entry is deleted.

4. **Given** consolidation has completed for a job, **When** user views Progress Dates, **Then** only the FIRST status (before window) and LAST status (at window end) should be visible

### Edge Cases

- **What happens when consolidation window contains only one status change?**
  Example: Applied → Screening (no further changes)
  Both entries are preserved: "Applied" (first) and "Screening" (last). No intermediate entries to delete.

- **What happens to job_stage_timestamps when intermediate statuses are deleted?**
  Timestamps are reset to NULL for any intermediate stages that were deleted during consolidation. Example: Applied → Screening → Interview → Screening results in "Applied" and "Screening" being kept, so `interview_at` is set to NULL because Interview was an intermediate stage.

- **How does system handle status rollback to original state?**
  Example: Applied → Screening → Applied (returns to original)
  Only ONE entry "Applied" remains, using the original timestamp from before the consolidation window started. All intermediate entries (including the "Screening") are deleted because first and last status are identical.


## Requirements *(mandatory)*

### Functional Requirements

**Consolidation Behavior:**
- **FR-001**: System MUST keep only FIRST entry (status before consolidation window) and LAST entry (status at window end) after 2-minute consolidation window expires
- **FR-002**: System MUST delete ALL intermediate status history entries between first and last during consolidation
- **FR-003**: System MUST remove intermediate status entries from both frontend display and backend database during consolidation
- **FR-004**: System MUST preserve original timestamps for both first entry (timestamp before window started) and last entry (timestamp when last status was set)
- **FR-004a**: System MUST merge first and last into ONE entry using original timestamp when first status equals last status (rollback scenario)

**Status History Management:**
- **FR-005**: System MUST identify which status history entries are "first", "intermediate", and "last" based on consolidation window boundaries
- **FR-006**: System MUST delete all intermediate entries (between first and last), keeping only first and last entries

**Stage Timestamps Handling:**
- **FR-007**: System MUST reset stage timestamps to NULL for any intermediate stages that were deleted during consolidation (stages that appear only in intermediate entries, not in first or last)
- **FR-008**: System MUST preserve stage timestamps for stages that appear in either first entry or last entry (not deleted during consolidation)

**Edge Case Handling:**
- **FR-009**: System MUST merge first and last into ONE entry when they have the same status (rollback scenario), using the original timestamp from first entry
- **FR-010**: System MUST preserve both first and last entries when only one status change occurred during the consolidation window (first ≠ last, no intermediate entries exist)

### Key Entities *(include if feature involves data)*

- **job_status_history**: Records each status change with timestamp, operator, and note. Contains `consolidation_window_id` to link entries to a consolidation window. During consolidation, all intermediate entries (between first and last) are deleted, keeping only first and last entries.

- **consolidation_windows**: Tracks active 2-minute consolidation periods for each job. Contains `job_id`, `window_start_time`, `window_end_time`, `first_status`, and `is_active` flag.

- **job_stage_timestamps**: Tracks the first time a job reaches each stage (applied_at, screening_at, interview_at, offered_at, rejected_at). During consolidation: timestamps are reset to NULL for intermediate stages that were deleted (stages appearing only in intermediate entries, not in first or last entries).

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all clarified in Session 2025-10-15)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

**Clarifications Completed**:
1. ✓ Core logic: Keep FIRST and LAST entries, delete ALL intermediate
2. ✓ Rollback scenario: Merge into ONE entry when first = last
3. ✓ Single change: Keep both first and last (no intermediate to delete)
4. ✓ Stage timestamps: Nullify only for intermediate stages that were deleted

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked and resolved (4 clarifications completed)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Additional Context

### Current Behavior (Bug)
According to the provided image, after consolidation, Progress Dates shows:
```
Oct 15, 2025    Status: Applied
Oct 15, 2025    Status: Screening
Oct 15, 2025    Status: Applied
```

This indicates that consolidation is NOT deleting intermediate entries as intended.

### Expected Behavior (Fix)
After consolidation completes, Progress Dates should show only:
```
Oct 15, 2025    Status: Applied  ← Only the FINAL status
```

All intermediate status changes (the middle "Screening" entry and potentially one of the "Applied" entries) should be removed.

### Related Features
- **Feature 016**: 5-second rollback pattern detection (Applied → Screening → Applied deletes the Screening entry immediately)
- **Feature 017**: 2-minute consolidation window (keeps all intermediate entries during window, consolidates after expiry)

**Question**: Should Feature 016 and Feature 017 interact? If user does Applied → Screening → Applied within 5 seconds, Feature 016 would delete entries immediately. If it takes longer than 5 seconds but less than 2 minutes, Feature 017 should handle it.
