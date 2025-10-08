# Data Model: Hover-Based Filter Interaction

**Feature**: 011-status-location-onclick
**Date**: 2025-10-08
**Input**: Phase 1 design from plan.md

## State Structure

### Component State (JobDashboard.tsx)

#### Before Refactoring
```typescript
// Two independent boolean states
const [showStatusFilter, setShowStatusFilter] = useState<boolean>(false)
const [showLocationFilter, setShowLocationFilter] = useState<boolean>(false)
```

**State Space**: 4 combinations (2² = 4)
| showStatusFilter | showLocationFilter | Meaning |
|------------------|-------------------|---------|
| false | false | Both closed |
| true | false | Status open |
| false | true | Location open |
| **true** | **true** | **Both open (VIOLATION of FR-001)** |

#### After Refactoring ✅
```typescript
// Single nullable enum state
type OpenFilterType = 'status' | 'location' | null

const [openFilter, setOpenFilter] = useState<OpenFilterType>(null)
```

**State Space**: 3 values (mutual exclusion guaranteed)
| openFilter Value | Meaning | Panel Visibility |
|------------------|---------|------------------|
| `null` | No filter open | Both panels hidden |
| `'status'` | Status filter open | Status panel visible, Location hidden |
| `'location'` | Location filter open | Location panel visible, Status hidden |

**Type Safety**: TypeScript enforces only one filter can be open at a time

## State Transitions

### Transition Diagram
```
       null (initial)
         │
    ┌────┴────┐
    │         │
    ↓         ↓
'status'  'location'
    │         │
    └────┬────┘
         │
         ↓
       null (closed)
```

### Transition Table

| Current State | User Action | New State | React Rendering Effect |
|---------------|-------------|-----------|------------------------|
| `null` | Hover Status button | `'status'` | Render Status panel |
| `null` | Hover Location button | `'location'` | Render Location panel |
| `'status'` | Hover Location button | `'location'` | Re-render: Hide Status panel, Show Location panel |
| `'location'` | Hover Status button | `'status'` | Re-render: Hide Location panel, Show Status panel |
| `'status'` | Mouse leaves Status region | `null` | Unmount Status panel |
| `'location'` | Mouse leaves Location region | `null` | Unmount Location panel |
| `'status'` | Click Status button (toggle) | `null` | Unmount Status panel |
| `'location'` | Click Location button (toggle) | `null` | Unmount Location panel |

### Event Handler Mappings

```typescript
// Open handlers (onMouseEnter)
const handleOpenStatus = () => setOpenFilter('status')
const handleOpenLocation = () => setOpenFilter('location')

// Close handler (onMouseLeave)
const handleCloseFilter = () => setOpenFilter(null)

// Toggle handler (onClick - accessibility fallback)
const handleToggleStatus = () => {
  setOpenFilter(openFilter === 'status' ? null : 'status')
}
const handleToggleLocation = () => {
  setOpenFilter(openFilter === 'location' ? null : 'location')
}
```

## Data Relationships

### Filter Panel Visibility
**Dependency**: `openFilter` state → Conditional rendering

```typescript
// Status panel rendering
{openFilter === 'status' && (
  <div>Status filter panel content</div>
)}

// Location panel rendering
{openFilter === 'location' && (
  <div>Location filter panel content</div>
)}
```

**Invariant**: At most one conditional renders `true` at any time

### Filter Selections (Unchanged)
**Independence**: Panel visibility state does NOT affect filter selection data

```typescript
// Existing filter data (unchanged by this feature)
const [filters, setFilters] = useState({
  status: [],      // Selected status values (e.g., ['applied', 'interviewing'])
  location: []     // Selected location values (e.g., ['Remote', 'New York'])
})
```

**Relationship**: `openFilter` controls **which panel is visible**, `filters` controls **which checkboxes are checked**

## Component Structure

### Hover Region Architecture

```typescript
// Compound hover region for Status filter
<div
  style={{ position: 'relative' }}  // Positioning context
  onMouseLeave={handleCloseFilter}  // Close on region exit
>
  <button
    onMouseEnter={handleOpenStatus}  // Open on button hover
    onClick={handleToggleStatus}     // Fallback for touch/keyboard
  >
    Status ▼
  </button>

  {openFilter === 'status' && (
    <div
      style={{ position: 'absolute', top: '100%', left: 0 }}
      // Panel is inside hover region, so mouse entering panel doesn't trigger onMouseLeave
    >
      {/* Checkbox list */}
    </div>
  )}
</div>
```

**Key Properties**:
1. **Compound Region**: Container div wraps both button and panel
2. **Single Close Trigger**: `onMouseLeave` only on container (not button or panel individually)
3. **Hover Opens, Leave Closes**: Natural hover behavior
4. **Panel Positioning**: Absolute positioning relative to container

### Event Propagation Flow

```
User Action: Hover over Status button
  ↓
onMouseEnter fires on <button>
  ↓
handleOpenStatus() called
  ↓
setOpenFilter('status')
  ↓
React re-renders
  ↓
Conditional: openFilter === 'status' → true
  ↓
Status panel <div> inserted into DOM
```

```
User Action: Mouse leaves button+panel region
  ↓
onMouseLeave fires on container <div>
  ↓
handleCloseFilter() called
  ↓
setOpenFilter(null)
  ↓
React re-renders
  ↓
Conditional: openFilter === 'status' → false
  ↓
Status panel <div> removed from DOM
```

## Validation Rules

### State Consistency Rules
1. **Mutual Exclusion**: `openFilter` can never be both `'status'` AND `'location'` (enforced by type)
2. **Single Source of Truth**: Only one state variable controls panel visibility (no derived states)
3. **Idempotent Operations**: `setOpenFilter('status')` when already `'status'` is safe (no-op)

### UI Consistency Rules
1. **Panel Count**: Maximum 1 filter panel visible at any time
2. **Panel Alignment**: Panel position relative to parent button (existing positioning preserved)
3. **Selection Persistence**: Checkbox states (`filters.status`, `filters.location`) persist across panel open/close cycles

## Type Definitions

```typescript
// New type for filter panel state
type OpenFilterType = 'status' | 'location' | null

// State variable
const [openFilter, setOpenFilter] = useState<OpenFilterType>(null)

// Event handler signatures
type FilterOpenHandler = () => void
type FilterCloseHandler = () => void

const handleOpenStatus: FilterOpenHandler = () => setOpenFilter('status')
const handleOpenLocation: FilterOpenHandler = () => setOpenFilter('location')
const handleCloseFilter: FilterCloseHandler = () => setOpenFilter(null)
```

## Migration Path

### Step 1: Add New State
```typescript
// Add alongside existing states (don't delete yet)
const [openFilter, setOpenFilter] = useState<OpenFilterType>(null)
```

### Step 2: Update Conditionals
```typescript
// Replace: {showStatusFilter && <div>...</div>}
// With:    {openFilter === 'status' && <div>...</div>}
```

### Step 3: Update Event Handlers
```typescript
// Replace: onClick={() => setShowStatusFilter(!showStatusFilter)}
// With:    onMouseEnter={handleOpenStatus} onClick={handleToggleStatus}
```

### Step 4: Remove Old States
```typescript
// Delete these lines:
// const [showStatusFilter, setShowStatusFilter] = useState(false)
// const [showLocationFilter, setShowLocationFilter] = useState(false)
```

## Data Flow Summary

```
User Interaction (hover/click)
  ↓
Event Handler (handleOpenStatus, handleOpenLocation, handleCloseFilter)
  ↓
State Update (setOpenFilter)
  ↓
React Re-render
  ↓
Conditional Rendering ({openFilter === 'status' && ...})
  ↓
DOM Update (panel appears/disappears)
  ↓
Visual Feedback (user sees filter panel)
```

**Key Insight**: Single state variable (`openFilter`) naturally enforces FR-001 (only one panel at a time) without additional coordination logic.
