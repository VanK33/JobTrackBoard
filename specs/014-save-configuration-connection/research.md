# Research: Database Connection String Security and Save Behavior

**Feature**: 014-save-configuration-connection
**Date**: 2025-10-14
**Purpose**: Technical research to resolve unknowns and establish implementation patterns

## Research Areas

### 1. localStorage Data Migration Strategy

**Question**: How should we handle existing `databaseConnectionHistory` entries when users upgrade?

**Decision**: Auto-migration on component mount with format detection

**Rationale**:
- Users have existing connections saved as `string[]` in `'databaseConnectionHistory'` key
- Breaking existing data would force users to re-enter credentials (poor UX)
- One-time migration cost is acceptable vs ongoing dual-format complexity

**Alternatives Considered**:
1. Force users to re-enter connections
   - **Rejected**: Terrible UX, loses user data
2. Maintain dual storage (old + new formats)
   - **Rejected**: Adds complexity, eventual consistency problems
3. Prompt user to manually migrate
   - **Rejected**: Extra friction, many users would skip

**Implementation Approach**:
```typescript
// Pseudo-code
const legacyHistory = localStorage.getItem('databaseConnectionHistory');
if (legacyHistory) {
  const oldConnections: string[] = JSON.parse(legacyHistory);
  const migrated: NamedConnection[] = oldConnections.map((connStr, index) => ({
    name: `old connection string ${index + 1}`,
    connectionString: connStr,
    createdAt: new Date().toISOString()
  }));
  localStorage.setItem('namedDatabaseConnections', JSON.stringify(migrated));
  localStorage.removeItem('databaseConnectionHistory'); // Clean up
}
```

**Migration Timing**: `useEffect` hook on component mount (before rendering dropdown)

---

### 2. Connection String Masking Algorithm

**Question**: How should we display connection strings when no name is provided?

**Decision**: Regex-based credential masking: `postgresql://user:password@host` → `postgresql://***:***@host`

**Rationale**:
- PostgreSQL connection strings follow predictable format
- Users need to see protocol + host for identification ("which database is this?")
- Credentials (user:password) must be hidden to prevent exposure
- Keep enough context for users to distinguish connections

**Alternatives Considered**:
1. Show only protocol + host (e.g., `postgresql://aws.com`)
   - **Rejected**: Loses port and database name, insufficient context
2. Full hash (e.g., `Connection #a3f9b2`)
   - **Rejected**: Completely opaque, users can't identify which connection
3. Show first 20 chars + ellipsis
   - **Rejected**: May still expose username, unpredictable truncation

**Implementation Approach**:
```typescript
function maskConnectionString(connStr: string): string {
  // Match pattern: protocol://user:password@host:port/database
  return connStr.replace(
    /(postgresql|postgres|mysql|mongodb):\/\/([^:]+):([^@]+)@/,
    '$1://***:***@'
  );
}

// Example:
// Input:  postgresql://admin:secret123@aws-prod.rds.com:5432/appdb
// Output: postgresql://***:***@aws-prod.rds.com:5432/appdb
```

**Edge Cases Handled**:
- Connection strings without credentials (pass through unchanged)
- Different protocols (postgresql, postgres, mysql, mongodb)
- Connection strings without port (host followed by /)

---

### 3. Uniqueness Validation Strategy

**Question**: How should we validate connection name uniqueness?

**Decision**: Case-sensitive name matching, inline error message on save attempt

**Rationale**:
- Names are user-provided identifiers (like folder names)
- Case sensitivity expected by users ("Production" ≠ "production")
- Clarification Q2 answer: "Show error message, prevent save" (not silent overwrite)

**Alternatives Considered**:
1. Case-insensitive matching (normalize to lowercase)
   - **Rejected**: May surprise users who intentionally use case
2. Auto-suffix duplicates ("Production", "Production (2)")
   - **Rejected**: Clarification explicitly rejected this approach
3. Silent overwrite
   - **Rejected**: Clarification explicitly rejected this approach

**Implementation Approach**:
```typescript
const handleSaveConnection = () => {
  const trimmedName = connectionName.trim();
  const isDuplicate = savedConnections.some(c => c.name === trimmedName);

  if (isDuplicate) {
    setError('A connection with this name already exists. Please choose a different name.');
    return;
  }

  // Proceed with save...
};
```

**Error Display**: `useState` hook for error message, shown above save button, red text

---

### 4. Dropdown UI Pattern for Delete/Rename

**Question**: How should users delete and rename saved connections?

**Decision**: Custom dropdown with inline action icons (edit/delete) next to each connection name

**Rationale**:
- Native `<select>` doesn't support custom content (icons, buttons)
- Inline actions keep operations contextual (see connection, act on connection)
- Common pattern (Gmail labels, VS Code recent files, Slack channels)
- Clarification Q3/Q5: Users need both delete and rename functionality

**Alternatives Considered**:
1. Native `<select>` + separate "Manage Connections" modal
   - **Rejected**: Extra navigation, disconnected from usage context
2. Right-click context menu
   - **Rejected**: Poor discoverability, not mobile-friendly
3. Swipe-to-delete (mobile pattern)
   - **Rejected**: Desktop-focused app, unfamiliar on web

**Implementation Approach**:
- Replace native `<select>` with custom dropdown (`<div>` + absolute positioning)
- Each connection rendered as:
  ```tsx
  <div className="connection-item">
    <span onClick={() => selectConnection(conn)}>{conn.name || maskConnectionString(conn.connectionString)}</span>
    <button onClick={() => startRename(conn)} aria-label="Rename">✎</button>
    <button onClick={() => deleteConnection(conn)} aria-label="Delete">🗑</button>
  </div>
  ```
- Inline rename: Click edit icon → span becomes input → Enter/blur to save → validate uniqueness

**Accessibility**: ARIA labels on icon buttons, keyboard navigation support

---

### 5. React State Management Approach

**Question**: How should we manage saved connections state?

**Decision**: Single `useState<NamedConnection[]>`, load from localStorage on mount, sync on changes

**Rationale**:
- Existing DatabaseSettings uses `useState` extensively (no state library)
- CRUD operations are simple (no complex state transitions)
- localStorage is source of truth (component state is cache)
- Follows project conventions (see App.tsx, other components)

**Alternatives Considered**:
1. `useReducer` with actions (LOAD/ADD/DELETE/RENAME)
   - **Rejected**: Overkill for simple CRUD, adds boilerplate
2. Context API for global state
   - **Rejected**: No cross-component needs (settings page is isolated)
3. Direct localStorage reads on every render
   - **Rejected**: Performance cost, parsing JSON repeatedly

**Implementation Approach**:
```typescript
const [savedConnections, setSavedConnections] = useState<NamedConnection[]>([]);
const [connectionName, setConnectionName] = useState<string>('');
const [editingConnection, setEditingConnection] = useState<NamedConnection | null>(null);
const [error, setError] = useState<string>('');

useEffect(() => {
  // Load + migrate on mount
  const loaded = loadNamedConnections(); // Handles migration internally
  setSavedConnections(loaded);
}, []);

// Save: Update state + localStorage
const saveConnection = (conn: NamedConnection) => {
  const updated = [...savedConnections, conn];
  setSavedConnections(updated);
  localStorage.setItem('namedDatabaseConnections', JSON.stringify(updated));
};
```

**State Synchronization**: Every mutation updates both state and localStorage atomically

---

## Implementation Patterns

### localStorage Key Convention
- **New key**: `'namedDatabaseConnections'` (distinct from legacy)
- **Legacy key**: `'databaseConnectionHistory'` (deprecated, migrated on first load)
- **Current config**: `'databaseConfig'` (unchanged, stores active connection)

### Type Definitions
```typescript
interface NamedConnection {
  name: string;              // May be masked string if user didn't provide name
  connectionString: string;  // Full URI with credentials
  createdAt?: string;        // ISO timestamp for sorting/metadata
}
```

### Error Handling
- localStorage full: Catch `QuotaExceededError`, show user-friendly message
- JSON parse failure: Log error, fall back to empty array
- Migration failure: Log error, preserve legacy data, notify user

---

## Dependencies Analysis

**New Dependencies**: None required

**Existing Dependencies**:
- React 18: `useState`, `useEffect` hooks
- TypeScript 5.0+: Interface definitions, type checking
- Browser localStorage API: Native, no polyfill needed

**Browser Compatibility**: All modern browsers (Chrome 4+, Firefox 3.5+, Safari 4+, Edge 12+)

---

## Performance Considerations

**localStorage Operations**:
- Read on mount: <10ms (one-time cost)
- Write on save/delete/rename: <5ms (synchronous, blocking)
- Parse JSON: <1ms for typical array (<100 connections)

**UI Rendering**:
- Custom dropdown: ~50 DOM nodes for 10 connections (negligible)
- Inline edit: No modal overhead, instant feedback

**Bottlenecks**: None expected. If users save >1000 connections, consider pagination in dropdown.

---

## Security Considerations

1. **Credential Masking**: Regex must handle all PostgreSQL URI variants
2. **localStorage Exposure**: Data visible in DevTools (acceptable tradeoff for client-side storage)
3. **XSS Protection**: React escapes text by default, but validate user input for connection names
4. **Input Sanitization**: Trim whitespace, prevent empty names

**Not in Scope**: Encryption (would require key management, adds complexity, localStorage still accessible to scripts)

---

## Testing Strategy

**Manual Testing** (via quickstart.md):
- 15 test scenarios covering all FR-001 to FR-015
- Focus areas: Migration, masking, CRUD operations, error handling

**Automated Testing** (optional, out of scope):
- Unit tests for masking function
- Unit tests for uniqueness validation
- Integration test for migration logic

**User Acceptance**: User manually verifies via quickstart.md before marking complete

---

## Open Questions: RESOLVED

All questions resolved via /clarify command:
1. Empty name handling → Allow save, display masked string
2. Duplicate names → Show error, prevent save
3. Delete functionality → Yes, add delete button
4. Migration strategy → Auto-migrate with "old connection string N" names
5. Rename functionality → Yes, add rename/edit capability

---

**Research Complete**: ✅ All unknowns resolved, ready for Phase 1 design
