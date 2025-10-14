# Feature Specification: Interactive Tutorial Carousel

**Feature Branch**: `013-tutorial-popup-3`
**Created**: 2025-10-13
**Status**: Draft
**Input**: User description: "我希望在现在tutorial的popup里面设计一个教程. 大概是图文并茂, 最多大概3-5张图, 每张图最多1-2句话. 然后我的设计是显性的可以有下一步, 上一步. 然后会提示现在到第几步了. 图片暂时是用placeholder. 尺寸的话, 我应该会控制在500x500."

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature involves tutorial carousel in existing popup
2. Extract key concepts from description
   → Actors: Users (new users, or users accessing tutorial)
   → Actions: Navigate tutorial steps (next/previous), view images and text
   → Data: Tutorial steps (exactly 5), each with image + 1-2 sentences
   → Constraints: Image size 500x500, placeholders for now
3. For each unclear aspect:
   → (Remaining clarifications handled)
4. Fill User Scenarios & Testing section
   → Primary flow: Open tutorial, navigate steps, see progress
5. Generate Functional Requirements
   → Navigation (next/prev), progress indicator, image+text display
6. Identify Key Entities
   → TutorialStep, TutorialState (optional, if state tracked)
7. Run Review Checklist
   → WARN "Spec has uncertainties" (clarifications needed)
8. Return: SUCCESS (spec ready for planning after clarifications)
```

---

## Clarifications

### Session 2025-10-13
- Q: How should the tutorial be triggered? → A: Both automatic on first login and manual access via tutorial button (located in bottom right corner, existing Supabase area)
- Q: Can users close the tutorial early (before completing all steps)? → A: Yes, via X button or clicking outside popup
- Q: Should the tutorial remember the user's progress if they close and reopen it? → A: No, always start from step 1
- Q: How many tutorial steps should the system support? → A: Exactly 5 steps (fixed)
- Q: Where should the descriptive text be positioned relative to the image? → A: Below the image (vertical layout)

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
A user opens the tutorial popup and sees a step-by-step guide with images and brief explanations. They can navigate through 5 steps using explicit "Next" and "Previous" buttons, with a clear indicator showing their current position (e.g., "Step 2 of 5"). Each step displays a 500x500 image (placeholder for now) and 1-2 sentences of descriptive text. The tutorial helps users understand key features or workflows of the application.

### Acceptance Scenarios
1. **Given** a user logs in for the first time, **When** the login completes, **Then** the tutorial popup automatically opens on step 1
2. **Given** a user has already seen the tutorial, **When** they log in again, **Then** the tutorial does NOT automatically display
3. **Given** a user wants to review the tutorial, **When** they click the tutorial button in the bottom right corner, **Then** the tutorial popup opens on step 1
4. **Given** a user opens the tutorial popup, **When** they view the first step, **Then** they see an image (500x500), 1-2 sentences of text, a "Next" button, and a progress indicator showing "Step 1 of N"
5. **Given** a user is on step 2 of 4, **When** they click "Next", **Then** the tutorial advances to step 3, showing new image and text, with indicator updating to "Step 3 of 4"
6. **Given** a user is on step 3 of 4, **When** they click "Previous", **Then** the tutorial goes back to step 2, showing the previous image and text, with indicator showing "Step 2 of 4"
7. **Given** a user is on the first step, **When** they view the interface, **Then** the "Previous" button is either hidden or disabled
8. **Given** a user is on the last step, **When** they view the interface, **Then** the "Next" button is replaced with a "Finish" or "Close" button
9. **Given** a user reaches the last step and clicks "Finish", **When** the action completes, **Then** the tutorial popup closes
10. **Given** a user is on any step, **When** they click the X button or click outside the popup, **Then** the tutorial closes immediately

### Edge Cases
- What happens if a user closes the tutorial popup mid-way (via X button or outside click)? Tutorial closes immediately; user can reopen anytime via manual button.
- Should the tutorial remember the user's last visited step if they close and reopen? No, always starts from step 1.
- How does the tutorial handle very short text (1 sentence) vs. longer text (2 sentences) - does layout adjust?
- What if tutorial content needs to be updated? Tutorial has exactly 5 fixed steps; content updates require modifying the step data.
- What happens if images fail to load (placeholders are missing)? (Deferred to planning: show placeholder with broken image indicator or alt text)

## Requirements

### Functional Requirements
- **FR-001**: System MUST display a tutorial popup with step-by-step content
- **FR-002**: System MUST support exactly 5 tutorial steps (fixed)
- **FR-003**: Each tutorial step MUST display an image with dimensions of 500x500 pixels
- **FR-004**: Each tutorial step MUST display 1-2 sentences of descriptive text positioned below the image (vertical layout)
- **FR-005**: System MUST provide a visible "Next" button to advance to the next step
- **FR-006**: System MUST provide a visible "Previous" button to return to the previous step
- **FR-007**: System MUST display a progress indicator showing current step and total steps (e.g., "Step 2 of 4")
- **FR-008**: System MUST disable or hide the "Previous" button when on the first step
- **FR-009**: System MUST replace the "Next" button with a "Finish" or "Close" button when on the last step
- **FR-010**: System MUST close the tutorial popup when the user clicks "Finish" on the last step
- **FR-011**: System MUST use placeholder images for all tutorial steps (actual content to be added later)
- **FR-012**: System MUST automatically display the tutorial popup on a user's first login
- **FR-012a**: System MUST provide a manual tutorial button in the bottom right corner for users to access the tutorial at any time
- **FR-012b**: System MUST track whether a user has seen the tutorial to prevent automatic display on subsequent logins
- **FR-013**: System MUST allow users to close the tutorial early by clicking an X button on the popup
- **FR-013a**: System MUST allow users to close the tutorial early by clicking outside the popup (overlay click)
- **FR-014**: System MUST always start the tutorial from step 1 when opened (no progress persistence between sessions)

### Key Entities
- **TutorialStep**: Represents a single step in the tutorial. Contains: step number (1-N), image (500x500 placeholder), description text (1-2 sentences), and position in sequence.
- **TutorialState**: Tracks whether a user has seen the tutorial (to prevent automatic display on subsequent logins). Does not track progress or current step.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all critical clarifications resolved)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (step navigation, progress indicator)
- [x] Scope is clearly bounded (tutorial carousel with exactly 5 steps)
- [x] Dependencies and assumptions identified (existing popup, placeholder images)

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (all resolved)
- [x] User scenarios defined
- [x] Requirements generated (17 functional requirements)
- [x] Entities identified (2 key entities)
- [x] Review checklist passed

---
