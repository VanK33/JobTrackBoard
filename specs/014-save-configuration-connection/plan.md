# Implementation Plan: Database Connection String Security and Save Behavior

**Branch**: `014-save-configuration-connection` | **Date**: 2025-10-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-save-configuration-connection/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded and analyzed
2. Fill Technical Context
   → ✅ Project type: Web (React + Express)
   → ✅ Structure: Web application (platform/core monorepo)
3. Fill Constitution Check
   → ✅ No constitution defined (template placeholder)
4. Evaluate Constitution Check
   → ✅ No violations (no active constitution)
5. Execute Phase 0 → research.md
   → ✅ Complete (research.md generated)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → ✅ Complete (all artifacts generated)
7. Re-evaluate Constitution Check
   → ✅ PASS (no violations)
8. Plan Phase 2 → Describe task generation approach
   → ✅ Complete (documented in plan.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phase 2 is executed by /tasks command.

## Summary
Fix two critical security/UX issues in Database Settings:
1. **Auto-save prevention**: Connection strings are currently saved to localStorage on every keystroke (lines 141-148 in DatabaseSettings.tsx), exposing sensitive credentials unnecessarily
2. **Password exposure**: Connection history dropdown shows full raw connection strings including passwords

**Technical Approach**:
- Add optional connection name input field
- Store connections as `{ name, connectionString }` pairs in localStorage
- Display only names (or masked strings) in dropdown
- Add delete and rename functionality for saved connections
- Auto-migrate legacy history entries to new format
- Prevent save until user clicks "Save Configuration" button

## Technical Context
**Language/Version**: TypeScript 5.0+ (frontend), Node.js 18+ (backend)
**Primary Dependencies**:
- Frontend: React 18, Vite 5
- Backend: Express.js, PostgreSQL/Supabase client
- Storage: Browser localStorage (session-based)
**Storage**: localStorage for connection configurations (client-side only, no server persistence)
**Testing**: Manual testing via quickstart.md scenarios
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web (monorepo: platform/core/src/frontend + backend)
**Performance Goals**: <100ms UI response for save/load/delete operations
**Constraints**:
- No backend API changes (localStorage only)
- Must maintain backward compatibility via auto-migration
- Inline CSS-in-JS (existing pattern)
**Scale/Scope**: ~5 localStorage operations, ~200 lines of React component changes, 15 manual test scenarios

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No active constitution - using template placeholder)

**Notes**: Project does not have a defined constitution. Default best practices apply:
- Maintainable code (clear naming, separation of concerns)
- Security-first (mask sensitive data, validate user input)
- Backward compatibility (auto-migrate legacy data)

## Project Structure

### Documentation (this feature)
```
specs/014-save-configuration-connection/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
platform/core/
├── src/
│   ├── frontend/
│   │   ├── pages/
│   │   │   └── DatabaseSettings.tsx    # Main file to modify
│   │   ├── components/                  # Potential new components
│   │   ├── hooks/                       # Potential custom hooks
│   │   ├── utils/
│   │   │   └── api-client.ts           # Update storage functions
│   │   └── types/
│   │       └── index.ts                # Update DatabaseConfig type
│   └── backend/
│       └── (no changes required)
└── dist/
```

**Structure Decision**: Web application (monorepo). Frontend changes only - no backend API modifications. Core work in `DatabaseSettings.tsx` (~920 lines currently), with supporting utilities in `api-client.ts` for localStorage operations. Follows existing monorepo structure under `platform/core/src/frontend/`.

## Phase 0: Outline & Research

### Research Tasks

1. **localStorage Data Migration Strategy**
   - **Decision**: Detect legacy format (`string[]`) vs new format (`Array<{name, connectionString}>`) on component mount
   - **Rationale**: Must preserve existing user data; users may have active connections in old format
   - **Alternatives considered**:
     - Force users to re-enter connections (rejected: poor UX)
     - Keep dual storage (rejected: complexity)
   - **Implementation**: Check first array element type, migrate if string

2. **Connection String Masking Algorithm**
   - **Decision**: Regex-based masking to hide credentials in `user:pass@host` patterns
   - **Rationale**: PostgreSQL connection strings follow predictable format `postgresql://user:password@host:port/database`
   - **Alternatives considered**:
     - Show only protocol + host (rejected: insufficient context for user identification)
     - Full hash (rejected: completely opaque, hard to identify connections)
   - **Implementation**: Replace `://.*:.*@` with `://***:***@` for display, preserve original for actual connection

3. **Uniqueness Validation Strategy**
   - **Decision**: Case-sensitive name matching on save, error display via `useState` hook
   - **Rationale**: Names are user-provided identifiers; case matters ("Production" ≠ "production")
   - **Alternatives considered**:
     - Case-insensitive (rejected: may surprise users)
     - Auto-suffix duplicates (rejected: clarification answer specified error message)
   - **Implementation**: `savedConnections.find(c => c.name === inputName)` before save

4. **Dropdown UI Pattern for Delete/Rename**
   - **Decision**: Inline action buttons within each dropdown option
   - **Rationale**: Follows common pattern (Gmail labels, Trello boards), keeps actions contextual
   - **Alternatives considered**:
     - Separate management modal (rejected: adds UI complexity)
     - Right-click context menu (rejected: discoverability issues)
   - **Implementation**: Each `<option>` rendered as custom component with name + icon buttons

5. **React State Management Approach**
   - **Decision**: Single `useState<NamedConnection[]>` for saved connections, lift from localStorage on mount
   - **Rationale**: Simple, follows existing DatabaseSettings pattern (no external state library)
   - **Alternatives considered**:
     - useReducer (rejected: overkill for CRUD operations)
     - Context API (rejected: no cross-component state needs)
   - **Implementation**: `const [savedConnections, setSavedConnections] = useState<NamedConnection[]>([])`

**Output**: research.md (see separate file)

## Phase 1: Design & Contracts

### Data Model

**Entity: NamedConnection**
```typescript
interface NamedConnection {
  name: string;              // Optional in UX, defaults to masked connectionString
  connectionString: string;  // Full PostgreSQL URI with credentials
  createdAt?: string;        // ISO timestamp for sorting (optional)
}
```

**localStorage Schema**:
- **Key**: `'namedDatabaseConnections'` (new key, distinct from legacy `'databaseConnectionHistory'`)
- **Value**: `JSON.stringify(NamedConnection[])`
- **Migration**: On detect legacy key, convert `string[]` → `NamedConnection[]` with names "old connection string 1", etc.

### Contracts

**No API contracts** (frontend-only feature). localStorage operations:

1. **Load Connections**
   - Input: None
   - Output: `NamedConnection[]`
   - Side Effect: Auto-migrate legacy format if detected

2. **Save Connection**
   - Input: `{ name?: string, connectionString: string }`
   - Output: `void`
   - Side Effect: Write to localStorage
   - Validation: Unique name (if provided), non-empty connectionString

3. **Delete Connection**
   - Input: `name: string`
   - Output: `void`
   - Side Effect: Remove from localStorage array

4. **Rename Connection**
   - Input: `{ oldName: string, newName: string }`
   - Output: `void`
   - Side Effect: Update name in localStorage array
   - Validation: Unique newName

### Test Scenarios (from quickstart.md)

15 manual test scenarios covering:
- Auto-save prevention (type without saving)
- Named connection save/load
- Unnamed connection save (masked display)
- Duplicate name rejection
- Delete functionality
- Rename functionality
- Legacy history migration
- Connection string update

**Output**: data-model.md, /contracts/* (N/A - no API), quickstart.md, CLAUDE.md update (see separate files)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. Update type definitions (`NamedConnection` interface)
2. Create utility functions for localStorage operations (load, save, delete, rename, migrate)
3. Add connection name input field to DatabaseSettings UI
4. Modify connection history dropdown to show names (or masked strings)
5. Add delete button/icon to each dropdown option
6. Add rename functionality (inline edit or modal)
7. Remove auto-save behavior from `handleConfigChange`
8. Add duplicate name validation to save handler
9. Add migration logic to `useEffect` hook
10. Manual testing of all 15 quickstart scenarios

**Ordering Strategy**:
- Foundation: Types → Utils → Migration logic
- UI changes: Input field → Dropdown display → Action buttons
- Validation: Duplicate check → Error display
- Testing: Unit tests (optional) → Manual quickstart validation

**Estimated Output**: 12-15 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following best practices)
**Phase 5**: Validation (manual testing via quickstart.md, 15 scenarios)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No violations - no active constitution.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach documented (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (via /clarify)
- [x] Complexity deviations documented (N/A)

---
*Based on project best practices - No formal constitution defined*
