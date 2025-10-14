# Feature Specification: Database Settings UI Improvements

**Feature Branch**: `008-1-use-connection`
**Created**: 2025-10-07
**Status**: Draft
**Input**: User description: "1) 希望use connection string是作为default的选项, 而不是备用. 2) 对于Database Setting 我希望变成, 如果是第一次来, 没有database connection configuration的话, 上面换成Database initialization, 不然就保持现在的database setting. 然后在Supabase的框内, 和docs一行但是是右侧的位置显示一个Tutorial. 出现一个弹框. 里面暂时是空的 3) Notes里面的信息改成类似: 这个project natively support Supabase. Other PostgreSQL 不太确定."

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## Clarifications

### Session 2025-10-07

- Q: Should individual database field inputs (host, port, username, password) remain available as an alternative to connection string? → A: Keep individual fields but hidden by default (e.g., "Advanced" toggle)
- Q: What UI elements should the tutorial modal contain? → A: Close button + title "Tutorial" + empty scrollable content area
- Q: When the user closes the tutorial modal, should they be able to re-open it? → A: Yes - Tutorial button remains clickable and re-opens modal
- Q: What is the exact wording for the Supabase support message? → A: "This project is designed for Supabase by default. Should work with other PostgreSQL"
- Q: How should the system determine if a user is "first-time" vs "returning"? → A: Check for presence of stored database configuration in browser storage

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

**First-time User**: A user opening the application for the first time needs to configure their database connection. They should be guided to use a connection string (the recommended approach) and see clear messaging that this application is optimized for Supabase, with a tutorial available to help them get started.

**Returning User**: A user who has already configured their database connection should see the familiar "Database Settings" interface, allowing them to modify or update their existing connection configuration.

### Acceptance Scenarios

1. **Given** the user has never configured a database connection, **When** they open the database configuration page, **Then** they should see a page titled "Database Initialization" (not "Database Settings")

2. **Given** the user has already configured a database connection, **When** they open the database configuration page, **Then** they should see a page titled "Database Settings"

3. **Given** the user is on the database configuration page, **When** they view the connection input options, **Then** the connection string input method should be the default and primary option (not hidden or secondary)

4. **Given** the user is viewing the Supabase provider recommendation section, **When** they look at the same row as the documentation link, **Then** they should see a "Tutorial" button or link on the right side

5. **Given** the user clicks the Tutorial button, **When** the action completes, **Then** a modal/popup dialog should appear with a title "Tutorial", a close button, and an empty scrollable content area

6. **Given** the user is viewing database configuration help text, **When** they read the notes or information section, **Then** they should see the message: "This project is designed for Supabase by default. Should work with other PostgreSQL"

### Edge Cases

- Tutorial modal can be re-opened after dismissal via the Tutorial button (remains permanently accessible)
- System determines "first-time" vs "returning" user by presence of stored database configuration
- User can access individual field inputs via an "Advanced" toggle or similar disclosure control

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST default to connection string input method when user accesses database configuration page
- **FR-002**: System MUST display page title as "Database Initialization" when no database configuration exists in browser storage
- **FR-003**: System MUST display page title as "Database Settings" when database configuration already exists in browser storage
- **FR-003a**: System MUST determine user status (first-time vs returning) by checking for presence of stored database configuration in browser storage
- **FR-004**: System MUST display a "Tutorial" interactive element (button/link) in the Supabase provider section, positioned on the right side of the same row as the documentation link
- **FR-005**: System MUST open a modal/popup dialog when user clicks the Tutorial element
- **FR-006**: Tutorial modal MUST contain a title displaying "Tutorial", a close/dismiss button, and an empty scrollable content area
- **FR-006a**: Tutorial button MUST remain clickable after modal dismissal, allowing users to re-open the tutorial modal at any time
- **FR-007**: System MUST display the following informational text in the notes/help section: "This project is designed for Supabase by default. Should work with other PostgreSQL"
- **FR-008**: System MUST NOT require users to toggle or switch to access connection string input (it should be the primary visible option)
- **FR-009**: System MUST provide an "Advanced" toggle or disclosure control that reveals individual database field inputs (host, port, username, password) when activated
- **FR-010**: Individual database field inputs MUST be hidden by default until user activates the advanced/disclosure control

### Key Entities

- **Database Configuration State**: Represents whether user has completed initial database setup (determines "Initialization" vs "Settings" page title)
- **Connection Method Preference**: The default and preferred input method is connection string (vs individual fields)
- **Tutorial Modal**: An interactive overlay/dialog that can be triggered from the Supabase section

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

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
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed (with clarifications noted)

---
