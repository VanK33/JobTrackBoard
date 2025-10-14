# Contracts: Database Connection String Security

**Feature**: 014-save-configuration-connection
**Date**: 2025-10-14

## Overview

This feature is **frontend-only** with no backend API changes. All operations are performed client-side via browser localStorage.

## localStorage Contracts

While there are no HTTP API contracts, the localStorage interface serves as a contract between the component and browser storage.

### Contract 1: Load Named Connections

**Operation**: Read from localStorage
**Key**: `'namedDatabaseConnections'`
**Returns**: `NamedConnection[] | null`

**Signature**:
```typescript
function loadNamedConnections(): NamedConnection[]
```

**Behavior**:
- Reads `localStorage.getItem('namedDatabaseConnections')`
- If legacy format detected (`databaseConnectionHistory` key), performs auto-migration
- Parses JSON to `NamedConnection[]`
- Returns empty array `[]` if key doesn't exist or parse fails
- Side effect: May delete legacy key after successful migration

**Error Handling**:
- `SyntaxError` (JSON parse failure) → Log error, return `[]`
- `SecurityError` (localStorage disabled) → Log error, return `[]`

---

### Contract 2: Save Named Connection

**Operation**: Write to localStorage
**Key**: `'namedDatabaseConnections'`
**Input**: `{ name: string, connectionString: string }`
**Returns**: `void`

**Signature**:
```typescript
function saveNamedConnection(
  name: string,
  connectionString: string,
  existing: NamedConnection[]
): NamedConnection[]
```

**Behavior**:
- Validates name uniqueness (throws error if duplicate)
- Validates connectionString non-empty (throws error if empty)
- Creates new `NamedConnection` object with `createdAt` timestamp
- Appends to existing array
- Writes to localStorage via `JSON.stringify()`
- Returns updated array

**Error Handling**:
- `QuotaExceededError` (storage full) → Alert user, don't save
- `SecurityError` (localStorage disabled) → Alert user, don't save
- Validation errors → Throw `Error` with message

---

### Contract 3: Delete Named Connection

**Operation**: Write to localStorage
**Key**: `'namedDatabaseConnections'`
**Input**: `name: string`
**Returns**: `void`

**Signature**:
```typescript
function deleteNamedConnection(
  name: string,
  existing: NamedConnection[]
): NamedConnection[]
```

**Behavior**:
- Filters out connection with matching name
- Writes updated array to localStorage
- Returns updated array
- No error if name not found (idempotent)

**Error Handling**:
- `QuotaExceededError` → Unlikely (deleting reduces size), log if occurs
- `SecurityError` → Alert user, don't delete

---

### Contract 4: Rename Named Connection

**Operation**: Write to localStorage
**Key**: `'namedDatabaseConnections'`
**Input**: `{ oldName: string, newName: string }`
**Returns**: `void`

**Signature**:
```typescript
function renameNamedConnection(
  oldName: string,
  newName: string,
  existing: NamedConnection[]
): NamedConnection[]
```

**Behavior**:
- Validates newName uniqueness (excluding connection being renamed)
- Maps over array, updating name for matching connection
- Writes updated array to localStorage
- Returns updated array

**Error Handling**:
- Validation errors → Throw `Error` with message
- `QuotaExceededError` → Alert user, don't rename
- Connection not found → No-op (idempotent)

---

### Contract 5: Migrate Legacy Connections

**Operation**: Read from `databaseConnectionHistory`, write to `namedDatabaseConnections`
**Input**: `string[]` (legacy format)
**Returns**: `NamedConnection[]`

**Signature**:
```typescript
function migrateLegacyConnections(
  legacyConnections: string[]
): NamedConnection[]
```

**Behavior**:
- Maps each string to `NamedConnection` with auto-generated name
- Name format: `"old connection string 1"`, `"old connection string 2"`, etc.
- Adds `createdAt` timestamp (migration time)
- Writes to new key `namedDatabaseConnections`
- Deletes legacy key `databaseConnectionHistory`
- Returns migrated array

**Error Handling**:
- Parse failure → Log error, return empty array, preserve legacy data
- Write failure → Log error, preserve legacy data

---

## Type Definitions (Contract Schema)

```typescript
/**
 * Named database connection configuration.
 * Stored in localStorage as JSON array.
 */
interface NamedConnection {
  /**
   * Human-readable identifier or masked connection string.
   * Must be unique within saved connections (case-sensitive).
   */
  name: string;

  /**
   * Full PostgreSQL connection URI with credentials.
   * Format: postgresql://user:password@host:port/database
   */
  connectionString: string;

  /**
   * ISO 8601 timestamp when connection was saved.
   * Used for sorting and metadata.
   */
  createdAt?: string;
}
```

---

## localStorage Keys

| Key | Type | Description | Ownership |
|-----|------|-------------|-----------|
| `namedDatabaseConnections` | `NamedConnection[]` | New format storage (this feature) | This feature |
| `databaseConnectionHistory` | `string[]` | Legacy format (deprecated) | Previous implementation |
| `databaseConfig` | `DatabaseConfig` | Current active connection | Existing feature (unchanged) |

**Key Isolation**: This feature uses a distinct key to avoid conflicts with existing `databaseConfig`.

---

## Testing Contracts

Since these are localStorage operations (not HTTP APIs), testing is manual via quickstart.md scenarios.

**Contract Test Approach** (if automated testing added):
1. Mock localStorage (`jest.spyOn(Storage.prototype, 'getItem')`)
2. Test each function in isolation
3. Verify correct localStorage calls
4. Verify correct error handling

**Example Test** (pseudocode):
```typescript
test('saveNamedConnection rejects duplicate names', () => {
  const existing = [{ name: 'Prod', connectionString: 'postgres://...', createdAt: '...' }];

  expect(() => {
    saveNamedConnection('Prod', 'postgres://other', existing);
  }).toThrow('duplicate');
});
```

---

## Migration Contract

**Trigger**: Component mount (`useEffect` with empty deps)

**Preconditions**:
- `databaseConnectionHistory` key exists in localStorage
- `namedDatabaseConnections` key does NOT exist

**Postconditions**:
- `namedDatabaseConnections` key exists with migrated data
- `databaseConnectionHistory` key deleted
- All legacy connection strings preserved (wrapped in `NamedConnection` objects)

**Rollback**: Not automatic. If users report issues, manual rollback via console (see quickstart.md).

---

## Security Contract

**Password Masking**:
- Display: Masked format (`postgresql://***:***@host`) for unnamed connections
- Storage: Full credentials preserved in `connectionString` field
- Transmission: N/A (no network requests, localStorage only)

**Data Exposure**:
- localStorage is accessible to any script on same origin
- DevTools can view all stored data
- This is acceptable tradeoff for client-side storage (no server persistence needed)

**Input Sanitization**:
- Connection names trimmed (whitespace removed)
- Connection strings trimmed
- No XSS risk (React escapes by default)

---

**Contracts Complete**: ✅ No HTTP APIs, localStorage operations documented
