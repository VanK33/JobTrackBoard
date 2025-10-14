# Data Model: Database Settings UI State

**Feature**: 008-1-use-connection
**Date**: 2025-10-07

## Overview

This feature modifies the UI state model for the DatabaseSettings component. No changes to persistent data structures, database schemas, or API contracts. All changes are local component state.

## Component State Model

### DatabaseSettings Component State

#### Modified State Variables

| Variable | Type | Old Default | New Default | Purpose |
|----------|------|-------------|-------------|---------|
| `useConnectionString` | `boolean` | `false` | `true` | Controls which input method is primary/visible |

**Rationale for Change**: Per FR-001, connection string must be the default input method, not individual fields.

#### New State Variables

| Variable | Type | Default | Purpose | Source Requirement |
|----------|------|---------|---------|-------------------|
| `showTutorialModal` | `boolean` | `false` | Controls visibility of tutorial modal dialog | FR-005, FR-006 |
| `showAdvancedFields` | `boolean` | `false` | Controls visibility of individual database field inputs | FR-009, FR-010 |

#### Unchanged State Variables

The following existing state variables remain unchanged:
- `config: DatabaseConfig` - Database connection configuration object
- `status: DatabaseStatus` - Connection test status
- `isTestingConnection: boolean` - Loading state during connection test
- `showAdvanced: boolean` - Legacy advanced section toggle (unrelated to new feature)
- `savedConnectionString: string` - Cached connection string value
- `connectionStringHistory: string[]` - Recent connection strings for dropdown
- `migrationStatus` - Data migration state object

## Derived State

### Page Title

**Derivation Logic**:
```typescript
const pageTitle = getStoredDatabaseConfig()
  ? "Database Settings"
  : "Database Initialization"
```

**Source**: FR-002, FR-003, FR-003a

**Dependencies**:
- `getStoredDatabaseConfig()` from `utils/api-client.ts`
- Returns `null` when no config exists in localStorage

## TutorialModal Component State

### Props Interface

```typescript
interface TutorialModalProps {
  isOpen: boolean        // Controls modal visibility
  onClose: () => void   // Callback when user closes modal
}
```

**Internal State**: None required (stateless presentation component)

**Source**: FR-006, FR-006a

## State Transitions

### Tutorial Modal Flow

```
Initial State: { showTutorialModal: false }
  ↓
User clicks "Tutorial" button → { showTutorialModal: true }
  ↓
Modal renders with close button
  ↓
User clicks close OR presses Escape → { showTutorialModal: false }
  ↓
Modal dismissed (can be re-opened via button)
```

**Constraint**: Per FR-006a, modal can be opened unlimited times (no "don't show again" state tracking)

### Advanced Fields Toggle Flow

```
Initial State: { useConnectionString: true, showAdvancedFields: false }
  ↓
Connection string input visible by default
Individual fields hidden
  ↓
User clicks "Show Advanced Options" → { showAdvancedFields: true }
  ↓
Individual fields (host, port, username, password) become visible
  ↓
User clicks "Hide Advanced Options" → { showAdvancedFields: false }
  ↓
Individual fields hidden again
```

**Constraint**: Per FR-009, FR-010, advanced fields always start hidden regardless of user history

### Connection String vs Individual Fields

**Current Behavior** (before changes):
- Default: Individual fields visible (`useConnectionString: false`)
- User must toggle checkbox to switch to connection string

**New Behavior** (after changes):
- Default: Connection string visible (`useConnectionString: true`)
- Individual fields available via "Advanced" disclosure
- Both methods remain functional, just inverted defaults

**Preserved Behavior**:
- Connection string auto-detection (lines 148-166 in DatabaseSettings.tsx)
- Connection string history tracking (lines 157-162)
- Config validation and saving logic unchanged

## Browser Storage Schema

### No Changes to localStorage Structure

The existing `databaseConfig` localStorage key structure remains unchanged:

```typescript
// Stored as JSON string in localStorage key "databaseConfig"
interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb'
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl?: boolean
  connectionString?: string
  storage?: object
}
```

**Detection Logic**:
- First-time user: `localStorage.getItem('databaseConfig') === null`
- Returning user: `localStorage.getItem('databaseConfig') !== null`

**Source**: FR-003a

## UI Component Hierarchy

```
DatabaseSettings (pages/DatabaseSettings.tsx)
├── Page Title (conditional: "Database Initialization" | "Database Settings")
├── Supabase Provider Section
│   └── Tutorial Button → opens TutorialModal
├── Connection String Input (visible by default)
├── Advanced Options Toggle Button
├── Individual Fields Section (conditional: showAdvancedFields)
│   ├── Host Input
│   ├── Port Input
│   ├── Database Input
│   ├── Username Input
│   └── Password Input
├── Help Text / Notes Section
│   └── "This project is designed for Supabase by default..."
└── Action Buttons (Test Connection, Save Configuration)

TutorialModal (components/TutorialModal.tsx)
├── Modal Overlay (semi-transparent backdrop)
└── Modal Content
    ├── Title: "Tutorial"
    ├── Close Button (X icon)
    └── Empty Scrollable Content Area
```

## Validation Rules

### No New Validation Required

Existing validation logic remains sufficient:
- Connection string format validation (lines 49-63 in DatabaseSettings.tsx)
- SSL checkbox state validation
- Connection test validation via backend API

### State Invariants

1. **Modal State**: `showTutorialModal` independent of other states (can open/close regardless of form state)
2. **Advanced Fields**: Only visible when `useConnectionString === true` (connection string is primary method)
3. **Page Title**: Computed on each render (no stale state risk)
4. **Connection String Default**: Always `true` on component mount (unless overridden by saved config)

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Page title derivation | O(1) | Synchronous localStorage.getItem call |
| Modal open/close | O(1) | React state update + re-render |
| Advanced toggle | O(1) | React state update + conditional render |
| Connection string validation | O(n) | String parsing, n = connection string length |

**No performance concerns** - All operations are local state updates or synchronous storage reads.

## Migration Notes

### No Data Migration Required

This feature changes only UI presentation, not data structure. Users with existing database configurations will:
- See "Database Settings" title (not "Database Initialization") ✓
- Have connection string visible by default if they previously used connection string
- Have individual fields hidden by default (accessible via Advanced toggle)
- Retain all saved configuration data unchanged

### Backward Compatibility

100% backward compatible:
- Existing localStorage data reads without modification
- Connection string history mechanism unchanged
- All existing functionality preserved (connection test, save, migration)

## References

- DatabaseSettings component: `/platform/core/src/frontend/pages/DatabaseSettings.tsx`
- DatabaseConfig interface: `/platform/core/src/frontend/types.ts` (lines 1-20 approximately)
- localStorage utilities: `/platform/core/src/frontend/utils/api-client.ts`
