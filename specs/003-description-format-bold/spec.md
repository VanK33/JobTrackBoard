# Feature Specification: Rich Text Description Editor with Modal Viewer

**Feature Branch**: `003-description-format-bold`
**Created**: 2025-10-03
**Status**: Draft
**Input**: User description: "我现在的description并不能保存工作的format, 并且如果我自己手打上去也不能添加各种bold等字体. 我希望看能否在edit/add application的时候添加这个功能. 另外, 我不喜欢现在的description的hover + roll的, 我在想能否点击之后出一个很简单的弹窗, 然后点开的弹窗会固定页面本来的位置, 然后前面的description 可以用滚轮, 这样会比较清楚. 而且这个框可以大一点, 保持和page的style. 然后右上角带个小x"

## Execution Flow (main)
```
1. Parse user description from Input
   → User wants rich text formatting in job descriptions
   → User dislikes current hover+scroll description display
   → User wants click-to-open modal for viewing descriptions
2. Extract key concepts from description
   → Actors: Job tracker users writing/viewing job descriptions
   → Actions: Format text (bold, etc.), view descriptions in modal
   → Data: Job description text with formatting
   → Constraints: Modal should lock page scroll, match page style, have close button
3. For each unclear aspect:
   → [NEEDS CLARIFICATION: What formatting options beyond bold? (italic, underline, lists, links?)]
   → [NEEDS CLARIFICATION: Should formatting be saved as HTML, Markdown, or other format?]
4. Fill User Scenarios & Testing section
5. Generate Functional Requirements
6. Identify Key Entities
7. Run Review Checklist
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-03
- Q: What formatting options should be supported beyond bold? → A: Extended - Bold, Italic, Underline, Bullet lists, Numbered lists, Links, Headings
- Q: How should the formatted description be stored in the database? → A: Markdown - Plain text with formatting markers
- Q: When a user pastes formatted text from an external source, what should happen? → A: Smart - Convert compatible formatting to Markdown, strip unsupported formats

---

## User Scenarios & Testing

### Primary User Story
A user wants to write detailed job descriptions with formatted text (bold, italic, etc.) when adding or editing job applications. The current plain text field loses all formatting. Additionally, when viewing long descriptions, the current hover-and-scroll interaction is difficult to use. The user wants to click on a description to open it in a clean, scrollable modal dialog that locks the background page position.

### Acceptance Scenarios

#### Scenario 1: Adding Job with Formatted Description
**Given** a user is creating a new job application
**When** the user types in the description field
**Then** the user MUST be able to apply text formatting (bold, italic, etc.)
**And** the formatting MUST be preserved when saved
**And** the formatted description MUST display correctly when viewed later

#### Scenario 2: Editing Existing Description with Formatting
**Given** a user has a job with existing description text
**When** the user edits the description
**Then** existing formatting MUST be preserved
**And** the user MUST be able to add new formatting
**And** the user MUST be able to remove existing formatting

#### Scenario 3: Viewing Description in Modal
**Given** a user is viewing the job list
**When** the user clicks on a job description
**Then** a modal dialog MUST open showing the full description
**And** the modal MUST lock the background page scroll position
**And** the description inside the modal MUST be scrollable
**And** the modal MUST match the page's visual style
**And** the modal MUST have a close button (X) in the top-right corner

#### Scenario 4: Closing Description Modal
**Given** a description modal is open
**When** the user clicks the X button or clicks outside the modal
**Then** the modal MUST close
**And** the background page position MUST remain unchanged
**And** the user MUST return to the exact scroll position they were at before opening the modal

#### Scenario 5: Formatting Persistence
**Given** a user has added bold and italic text to a description
**When** the user saves the job
**And** refreshes the page
**Then** the description MUST still show the bold and italic formatting

### Edge Cases
- What happens when description is empty?
  - Modal should still open but show empty state or placeholder
- What happens with very long descriptions (thousands of words)?
  - Modal should scroll smoothly without performance issues
- What happens if user pastes formatted text from external source?
  - System should intelligently convert compatible formatting (bold, italic, lists, etc.) to Markdown and strip unsupported formats
- What happens on mobile devices with the modal?
  - Modal should be responsive and usable on small screens
- What happens if user clicks description while another modal is open?
  - Previous modal should close first

---

## Requirements

### Functional Requirements

#### Rich Text Editing
- **FR-001**: System MUST provide a text editor that supports rich text formatting in the description field
- **FR-002**: System MUST support bold text formatting as a minimum
- **FR-003**: System MUST allow users to apply formatting while typing
- **FR-004**: System MUST allow users to apply formatting to selected text
- **FR-005**: System MUST preserve formatting when saving job data
- **FR-006**: System MUST display formatted descriptions with correct styling
- **FR-007**: System MUST support the following formatting options: Italic, Underline, Bullet lists, Numbered lists, Links, and Headings (H1-H3)
- **FR-008**: System MUST store formatted descriptions as Markdown text in the database
- **FR-009**: System MUST intelligently convert pasted formatted text to Markdown
- **FR-010**: System MUST preserve compatible formatting when pasting (bold, italic, underline, lists, links, headings)
- **FR-011**: System MUST strip unsupported formatting when pasting

#### Modal Description Viewer
- **FR-012**: System MUST open a modal dialog when user clicks on a job description
- **FR-013**: Modal MUST display the full description text with all formatting preserved
- **FR-014**: Modal MUST prevent the background page from scrolling when open
- **FR-015**: Modal MUST preserve the background page's scroll position
- **FR-016**: Description content inside modal MUST be scrollable independently
- **FR-017**: Modal MUST have a larger size than the current description preview area
- **FR-018**: Modal MUST match the visual style of the rest of the page (colors, fonts, borders, spacing)
- **FR-019**: Modal MUST have a close button (X icon) in the top-right corner
- **FR-020**: Modal MUST close when user clicks the X button
- **FR-021**: Modal MUST close when user clicks outside the modal area
- **FR-022**: Modal MUST close when user presses the Escape key
- **FR-023**: System MUST remove the current hover-and-scroll description display mechanism

#### Data Persistence
- **FR-024**: System MUST save formatted descriptions to the database
- **FR-025**: System MUST retrieve and display formatted descriptions correctly
- **FR-026**: System MUST maintain formatting across page refreshes
- **FR-027**: System MUST handle both new jobs (with formatting) and existing jobs (plain text) gracefully

### Key Entities

- **Job Description**: Text content associated with a job application
  - Attributes: Markdown-formatted text content, plain text fallback for legacy data
  - Supported formats: Bold, Italic, Underline, Bullet lists, Numbered lists, Links, Headings (H1-H3)
  - Lifecycle: Created during job creation, editable, displayed in modal
  - Formatting must be preserved across save/load cycles
  - Paste behavior: Smart conversion from external sources to Markdown

- **Description Modal**: UI component for viewing full descriptions
  - Attributes: open/closed state, content, scroll position
  - Behavior: Locks background scroll, independently scrollable content
  - Visual style: Matches page design with close button

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
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Current System Analysis

### Current Behavior
- Description field is a plain text input (no formatting)
- All formatting (bold, italic, line breaks) is lost when typed
- Description preview uses hover + scroll interaction
- Long descriptions are difficult to read in small preview area

### Desired Behavior
- **Rich Text Editor**: Description field supports formatting (bold, italic, etc.)
- **Formatting Persistence**: Formatting is saved and displayed correctly
- **Modal Viewer**: Click description to open large, scrollable modal
- **Better UX**: Modal locks background scroll, matches page style, has close button (X)

### Key Improvements
1. Replace plain text input with rich text editor during add/edit
2. Store formatted description data
3. Replace hover-scroll preview with click-to-open modal
4. Modal should be larger, scrollable, and match page design
5. Background page scroll position preserved when modal opens/closes
