# Feature Specification: Fix Job Deletion Functionality

**Feature Branch**: `002-job-entry-test`
**Created**: 2025-10-03
**Status**: Draft
**Input**: User description: "修复 job entry 删除功能 - 用户添加了 TEST job，输入 DELETE 后点击删除按钮，但删除没有生效"

## Execution Flow (main)
```
1. Parse user description from Input
   → User added a TEST job, typed DELETE, clicked delete button, but deletion failed
2. Extract key concepts from description
   → Actors: User managing job applications
   → Actions: Delete job entry with confirmation
   → Data: Job records in database
   → Constraints: Must type "DELETE" to confirm
3. Root cause identified:
   → PostgreSQL deleteJob() returns void instead of boolean
   → API expects boolean to determine success/failure
   → Frontend receives 404 error even when deletion succeeds
4. Fill User Scenarios & Testing section
5. Generate Functional Requirements
6. Identify Key Entities
7. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Problem Statement

Users cannot successfully delete job entries from their job tracker. When attempting to delete a job:
1. User types "DELETE" in the confirmation dialog
2. User clicks the delete button
3. Frontend shows error: "Failed to delete job from server"
4. Job remains in the list (not deleted)

**Root Cause**: Database service method returns incorrect type, causing API to treat successful deletions as failures.

---

## User Scenarios & Testing

### Primary User Story
A user has created a job application entry (e.g., "TEST") and wants to permanently remove it from their tracker. They:
1. Select the job from their list
2. Click the delete button
3. Type "DELETE" in the confirmation dialog to confirm
4. Click "Delete Permanently"
5. **Expected**: Job is removed from the list and database
6. **Actual**: Error message appears, job remains

### Acceptance Scenarios

#### Scenario 1: Successful Job Deletion
**Given** a user has a job entry in their tracker
**When** the user types "DELETE" correctly and confirms deletion
**Then** the job MUST be permanently removed from the database
**And** the job MUST disappear from the user's job list immediately
**And** no error messages MUST be shown

#### Scenario 2: Job Not Found (Edge Case)
**Given** a user attempts to delete a job that no longer exists
**When** the deletion is attempted
**Then** the system MUST return a clear "Job not found" error
**And** the user interface MUST be updated accordingly

#### Scenario 3: Database Connection Failure
**Given** the database connection is lost
**When** a user attempts to delete a job
**Then** the system MUST show an appropriate error message
**And** the job MUST remain in the list (no partial deletion)

### Edge Cases
- What happens when multiple users try to delete the same job concurrently?
  - System should handle race conditions gracefully
- What happens if deletion succeeds in database but fails to update UI?
  - UI should re-fetch data to stay synchronized
- What happens if user has no database configured?
  - Deletion should not be attempted, appropriate error shown

---

## Requirements

### Functional Requirements

#### Core Delete Functionality
- **FR-001**: System MUST successfully delete job entries from the database when user confirms
- **FR-002**: System MUST return accurate success/failure status from delete operations
- **FR-003**: System MUST verify that rows were actually deleted (not just execute DELETE query)
- **FR-004**: System MUST update the user interface immediately after successful deletion
- **FR-005**: System MUST maintain data consistency across all database implementations (PostgreSQL, SQLite)

#### Error Handling
- **FR-006**: System MUST distinguish between "job not found" and "delete operation failed"
- **FR-007**: System MUST display clear error messages when deletion fails
- **FR-008**: System MUST log deletion failures with sufficient detail for debugging
- **FR-009**: System MUST handle database connection errors gracefully

#### User Confirmation Flow
- **FR-010**: System MUST continue requiring "DELETE" text confirmation before deletion
- **FR-011**: System MUST disable delete button until "DELETE" is correctly typed
- **FR-012**: System MUST clear confirmation dialog after successful deletion
- **FR-013**: System MUST allow users to cancel deletion at any point

### Key Entities

- **Job Entry**: A job application record in the tracker
  - Attributes: ID, company name, position, status, dates, notes
  - Lifecycle: Created → Updated → Deleted
  - Deletion is permanent and cascades to related data (files, status history)

- **Delete Operation**: Represents a deletion request
  - Attributes: target job ID, success status, error details
  - Returns: Boolean indicating whether row(s) were deleted
  - Must be atomic and consistent across all database types

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Root cause identified
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Current System Analysis

### Issue Identified
The PostgreSQL database service's `deleteJob()` method has a return type mismatch:
- **PostgreSQL**: Returns `Promise<void>` (no success indicator)
- **SQLite**: Returns `Promise<boolean>` (correct)
- **API Layer**: Expects `boolean` to determine success

**Impact**:
1. API receives `undefined` from PostgreSQL deleteJob()
2. `if (success)` check fails (undefined is falsy)
3. API returns 404 "Job not found" even when deletion succeeded
4. Frontend shows error, but job is actually deleted in database
5. UI state becomes inconsistent with database state

### Required Fix
Database service method signatures must be consistent:
- All deleteJob() methods must return Promise<boolean>
- Return true when rows were deleted
- Return false when no rows matched (job not found)
- Throw errors for actual failures (connection issues, etc.)
