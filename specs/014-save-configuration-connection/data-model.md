# Data Model: Database Connection String Security

**Feature**: 014-save-configuration-connection
**Date**: 2025-10-14

## Entities

### NamedConnection

**Purpose**: Represents a saved database connection configuration with an optional user-friendly name.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `name` | `string` | Yes | Human-readable identifier. May be user-provided (e.g., "Production DB") or auto-generated masked string if user didn't provide a name. | Non-empty after trim. Unique within saved connections (case-sensitive). |
| `connectionString` | `string` | Yes | Full PostgreSQL connection URI including credentials (e.g., `postgresql://user:password@host:port/database`). | Non-empty. Valid URI format (basic check). |
| `createdAt` | `string` (ISO 8601) | No | Timestamp when connection was first saved. Used for sorting (newest first) and metadata. | ISO 8601 format (e.g., `2025-10-14T10:30:00.000Z`). |

**Example**:
```typescript
{
  name: "Production Supabase",
  connectionString: "postgresql://postgres.abc123:secretpassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  createdAt: "2025-10-14T10:30:00.000Z"
}
```

**Example (unnamed connection)**:
```typescript
{
  name: "postgresql://***:***@aws-0-us-east-1.pooler.supabase.com:5432/postgres", // Masked for display
  connectionString: "postgresql://postgres.abc123:secretpassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  createdAt: "2025-10-14T10:35:00.000Z"
}
```

**Example (migrated legacy connection)**:
```typescript
{
  name: "old connection string 1",
  connectionString: "postgresql://user:pass@old-host.com:5432/olddb",
  createdAt: "2025-10-14T10:00:00.000Z" // Migration timestamp
}
```

---

## Relationships

**NamedConnection** has no foreign key relationships (isolated localStorage entity).

**Cardinality**:
- One user → Many NamedConnections (1:N)
- Stored as array in localStorage: `NamedConnection[]`

**Constraints**:
- `name` must be unique within the array (enforced at save time)
- Max array length: Limited only by localStorage quota (~5-10MB per origin)

---

## localStorage Schema

### Primary Storage

**Key**: `'namedDatabaseConnections'`

**Value**: `JSON.stringify(NamedConnection[])`

**Example**:
```json
[
  {
    "name": "Production Supabase",
    "connectionString": "postgresql://postgres.abc:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    "createdAt": "2025-10-14T10:30:00.000Z"
  },
  {
    "name": "Staging Neon",
    "connectionString": "postgresql://neon_user:pass@staging.neon.tech:5432/staging_db",
    "createdAt": "2025-10-14T11:00:00.000Z"
  }
]
```

### Legacy Storage (Deprecated)

**Key**: `'databaseConnectionHistory'` (old format, pre-feature)

**Value**: `JSON.stringify(string[])` (raw connection strings)

**Migration Rule**:
- On component mount, if legacy key exists:
  1. Parse `string[]`
  2. Convert each string to `NamedConnection` with auto-generated name
  3. Write to new key (`'namedDatabaseConnections'`)
  4. Delete legacy key

**Example Migration**:
```typescript
// Before (legacy):
["postgresql://user:pass@host1:5432/db1", "postgresql://user:pass@host2:5432/db2"]

// After (migrated):
[
  { name: "old connection string 1", connectionString: "postgresql://user:pass@host1:5432/db1", createdAt: "2025-10-14T10:00:00.000Z" },
  { name: "old connection string 2", connectionString: "postgresql://user:pass@host2:5432/db2", createdAt: "2025-10-14T10:00:00.000Z" }
]
```

---

## State Transitions

### Connection Lifecycle

```
[NEW] --save--> [SAVED] --rename--> [SAVED (updated name)]
                  |
                  |--delete--> [DELETED (removed from array)]
                  |
                  |--update connectionString--> [SAVED (updated connectionString)]
```

**States**:
1. **NEW**: User typing in form, not yet saved
2. **SAVED**: Persisted in localStorage, appears in dropdown
3. **DELETED**: Removed from array, no longer appears in dropdown

**Transitions**:
- **Save**: `NEW → SAVED` (validation: unique name, non-empty connectionString)
- **Rename**: `SAVED → SAVED` (validation: unique new name)
- **Update**: `SAVED → SAVED` (same name, different connectionString)
- **Delete**: `SAVED → DELETED` (no validation, immediate removal)

---

## Validation Rules

### At Save Time

1. **Connection String**:
   - Must be non-empty after trim
   - Must contain `://` (basic URI format check)
   - No character limits (PostgreSQL URIs can be long)

2. **Connection Name**:
   - If provided: Must be non-empty after trim
   - If provided: Must be unique (case-sensitive match against existing names)
   - If not provided: Auto-generate from masked connectionString

3. **Uniqueness**:
   - Check: `savedConnections.some(c => c.name === inputName.trim())`
   - Error message: "A connection with this name already exists. Please choose a different name."

### At Rename Time

1. **New Name**:
   - Must be non-empty after trim
   - Must be unique (excluding the connection being renamed)
   - Check: `savedConnections.filter(c => c !== editingConnection).some(c => c.name === newName.trim())`

### At Delete Time

No validation required (user confirms intent via button click).

---

## Data Access Patterns

### Load All Connections
```typescript
function loadNamedConnections(): NamedConnection[] {
  // Check for legacy format first
  const legacy = localStorage.getItem('databaseConnectionHistory');
  if (legacy) {
    return migrateLegacyConnections(JSON.parse(legacy));
  }

  // Load new format
  const stored = localStorage.getItem('namedDatabaseConnections');
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse named connections:', e);
    return [];
  }
}
```

### Save New Connection
```typescript
function saveConnection(name: string, connectionString: string, existing: NamedConnection[]): NamedConnection[] {
  const trimmedName = name.trim() || maskConnectionString(connectionString);

  // Validate uniqueness
  if (existing.some(c => c.name === trimmedName)) {
    throw new Error('Duplicate name');
  }

  const newConnection: NamedConnection = {
    name: trimmedName,
    connectionString: connectionString.trim(),
    createdAt: new Date().toISOString()
  };

  const updated = [...existing, newConnection];
  localStorage.setItem('namedDatabaseConnections', JSON.stringify(updated));
  return updated;
}
```

### Delete Connection
```typescript
function deleteConnection(name: string, existing: NamedConnection[]): NamedConnection[] {
  const updated = existing.filter(c => c.name !== name);
  localStorage.setItem('namedDatabaseConnections', JSON.stringify(updated));
  return updated;
}
```

### Rename Connection
```typescript
function renameConnection(oldName: string, newName: string, existing: NamedConnection[]): NamedConnection[] {
  const trimmedNewName = newName.trim();

  // Validate uniqueness (excluding current connection)
  if (existing.filter(c => c.name !== oldName).some(c => c.name === trimmedNewName)) {
    throw new Error('Duplicate name');
  }

  const updated = existing.map(c =>
    c.name === oldName ? { ...c, name: trimmedNewName } : c
  );

  localStorage.setItem('namedDatabaseConnections', JSON.stringify(updated));
  return updated;
}
```

---

## Masking Algorithm

**Purpose**: Hide credentials in connection strings when displaying unnamed connections.

**Pattern**: `protocol://username:password@host:port/database`

**Implementation**:
```typescript
function maskConnectionString(connStr: string): string {
  // Match and replace credentials section
  return connStr.replace(
    /(postgresql|postgres|mysql|mongodb|mongodb\+srv):\/\/([^:]+):([^@]+)@/,
    '$1://***:***@'
  );
}
```

**Examples**:
- Input: `postgresql://admin:secret123@aws-prod.rds.com:5432/appdb`
- Output: `postgresql://***:***@aws-prod.rds.com:5432/appdb`

- Input: `mongodb+srv://user:pass@cluster0.mongodb.net/mydb`
- Output: `mongodb+srv://***:***@cluster0.mongodb.net/mydb`

**Edge Cases**:
- Connection string without credentials (e.g., `postgresql://localhost:5432/db`) → Pass through unchanged
- Connection string with only username (no password) → Still mask: `postgresql://***:@host`

---

## Error Handling

### localStorage Quota Exceeded

**Scenario**: User has saved too many connections (unlikely, but possible).

**Error**: `QuotaExceededError`

**Handling**:
```typescript
try {
  localStorage.setItem('namedDatabaseConnections', JSON.stringify(updated));
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    alert('Storage quota exceeded. Please delete some saved connections.');
  } else {
    console.error('Failed to save connection:', e);
    alert('Failed to save connection. Please try again.');
  }
}
```

### JSON Parse Failure

**Scenario**: localStorage data corrupted (rare).

**Error**: `SyntaxError`

**Handling**:
```typescript
try {
  return JSON.parse(stored);
} catch (e) {
  console.error('Failed to parse connections, resetting:', e);
  localStorage.removeItem('namedDatabaseConnections');
  return [];
}
```

---

## Performance Characteristics

**Read Operations** (on component mount):
- localStorage.getItem: <5ms
- JSON.parse (100 connections): <10ms
- Total: <15ms (one-time cost)

**Write Operations** (on save/delete/rename):
- JSON.stringify (100 connections): <5ms
- localStorage.setItem: <10ms
- Total: <15ms (acceptable for user-triggered actions)

**Memory Usage**:
- 100 connections × ~200 chars each = ~20KB (negligible)
- localStorage limit: 5-10MB (supports 1000s of connections)

---

**Data Model Complete**: ✅ Ready for implementation
