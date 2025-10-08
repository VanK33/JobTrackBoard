# Feature Specification: Change Status and Location Filters from Toggle to Hover/Non-Toggle

**Feature Branch**: `011-status-location-onclick`
**Created**: 2025-10-08
**Status**: Draft
**Input**: User description: "现在status和location的效果是onclick, 所以两个都点的话, 一个框会覆盖另一个, 我希望把他们变成类似于hover, 或者说至少不是toggle的形式"

## Execution Flow (main)
```
1. Parse user description from Input
   → User reports: Status and location filters use onClick toggle behavior
   → Problem: When both are clicked, one overlay covers the other
   → Goal: Change to hover interaction or non-toggle form
2. Extract key concepts from description
   → Actors: Users filtering jobs
   → Actions: Showing/hiding status and location filter panels
   → Data: Filter selections (status values, location values)
   → Constraints: Multiple filters should be usable simultaneously
3. For each unclear aspect:
   → ✓ RESOLVED: Only one filter visible at a time (auto-closes other when hovering new filter)
   → ✓ RESOLVED: Hover with sticky selection (stays open during interaction)
   → ✓ RESOLVED: Close on mouse leave from button+panel region
4. Fill User Scenarios & Testing section
   → Primary flow: User wants to filter by both status and location
5. Generate Functional Requirements
   → Each requirement must be testable
6. Identify Key Entities (if data involved)
   → Filter state, filter overlay positioning
7. Run Review Checklist
   → WARN "Spec has uncertainties" - clarifications needed
8. Return: SUCCESS (spec ready for planning after clarification)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-08
- Q: What interaction triggers the filter panel to open? → A: Hover with sticky selection (Panel appears on hover, stays open while user interacts with checkboxes inside)
- Q: How should filter panels close? → A: Mouse leaves both button and panel (Panel disappears when mouse exits the button+panel region entirely)
- Q: Can both filter panels be visible at the same time, or only one at a time? → A: Only one at a time (Opening one filter automatically closes the other filter panel)
- Q: Should there be visual feedback indicating which filters have active selections? → A: Keep current visual feedback behavior (no change to existing active filter indicators)
- Q: How should filter panels position themselves when the viewport is narrow? → A: Keep desktop behavior (Panels remain positioned next to their buttons, may extend off-screen if needed)

---

## User Scenarios & Testing

### Primary User Story
As a user reviewing job applications, I need to filter jobs by both status and location. Currently, when I click on the Status filter button, a dropdown appears and toggles on/off with each click. If I then click on the Location filter button, its dropdown appears but overlaps or replaces the Status dropdown. I want hover-based access to each filter, where hovering over a filter button shows its options, and I can quickly switch between filters without the toggle behavior causing confusion or overlapping panels.

### Acceptance Scenarios

1. **Given** I am on the job dashboard with multiple jobs displayed, **When** I hover over the Status filter button, **Then** the status filter panel should appear immediately

2. **Given** the Status filter panel is open, **When** I hover over the Location filter button, **Then** the Location filter panel should appear and the Status filter panel should close automatically

3. **Given** I have opened a filter panel, **When** my mouse leaves both the button and panel region entirely, **Then** the filter panel should close automatically

4. **Given** I hover over a filter button, **When** my mouse enters the button area, **Then** the filter options panel should appear and remain open while I interact with checkboxes inside the panel

5. **Given** I am interacting with checkboxes inside a filter panel, **When** I select or deselect options, **Then** the panel should remain open until my mouse leaves the button+panel region

### Edge Cases
- How does the system handle rapid interactions (e.g., quickly hovering over both filters in succession)?
- What happens if user moves mouse very quickly from Status button directly to Location panel (skipping Location button)?
- How should the system behave if mouse pointer moves from one filter button to another without leaving the header area?

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow only one filter panel to be visible at a time (opening one filter automatically closes any other open filter panel)

- **FR-002**: System MUST display filter panel on hover with sticky selection behavior (panel appears when mouse enters button area, remains visible while user interacts with checkboxes inside the panel)

- **FR-003**: System MUST automatically close the currently open filter panel when user hovers over a different filter button

- **FR-004**: System MUST close filter panels automatically when the mouse leaves both the filter button and panel region entirely

- **FR-005**: System MUST maintain current filter functionality (allowing multi-select for status values, location values)

- **FR-006**: System MUST preserve selected filter values when user interacts with other filters

- **FR-007**: System MUST maintain current visual indication of which filters are currently active/applied (no change to existing behavior)

- **FR-008**: System MUST maintain consistent filter panel positioning across all viewport sizes (panels positioned next to their buttons, may extend beyond viewport if necessary)

### Key Entities

- **Status Filter Panel**: Displays available job status options (interested, applied, interviewing, offered, rejected)
- **Location Filter Panel**: Displays available job location options (all unique locations from job records)
- **Filter State**: Tracks which status values and location values are currently selected by user
- **Filter Panel Visibility**: Tracks whether each filter panel is currently displayed

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain - **All 5 clarifications resolved**
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded (Status and Location filters only)
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted (toggle problem, overlay conflict, simultaneous access needed)
- [x] Ambiguities resolved (5 clarifications completed via /clarify)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

**Ready for**: `/plan` command
