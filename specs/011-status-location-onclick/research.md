# Research: Hover-Based Filter Interaction

**Feature**: 011-status-location-onclick
**Date**: 2025-10-08
**Input**: Phase 0 research from plan.md

## Current Implementation Analysis

### Existing State Management
```typescript
// File: platform/core/src/frontend/pages/JobDashboard.tsx (line ~126-127)
const [showStatusFilter, setShowStatusFilter] = useState(false)
const [showLocationFilter, setShowLocationFilter] = useState(false)
```

**Problems**:
1. **Independent Toggles**: Each filter has its own boolean state
2. **No Mutual Exclusion**: Both filters can be `true` simultaneously → panels overlap
3. **Toggle Confusion**: Clicking same button toggles open/closed (unintuitive for dropdowns)
4. **Click-Only**: No hover interaction support

### Existing Event Handlers
```typescript
// Status filter trigger (line ~1830)
onClick={() => setShowStatusFilter(!showStatusFilter)}

// Location filter trigger (line ~1898)
onClick={() => setShowLocationFilter(!showLocationFilter)}
```

**Issues**:
- Toggle pattern (`!showStatusFilter`) requires explicit close
- No coordination between filters
- No hover support

## Hover Interaction Patterns Research

### Pattern 1: Simple Hover (Tooltip-style)
**Implementation**:
```typescript
onMouseEnter={() => setShowFilter(true)}
onMouseLeave={() => setShowFilter(false)}
```

**Pros**: Simple, immediate response
**Cons**: Closes as soon as mouse leaves button (can't interact with panel content)
**Verdict**: ❌ Rejected - Doesn't support "sticky selection" requirement (FR-002)

### Pattern 2: Hover with Delay/Timeout
**Implementation**:
```typescript
onMouseEnter={() => setShowFilter(true)}
onMouseLeave={() => {
  setTimeout(() => setShowFilter(false), 300)
}}
```

**Pros**: Gives user time to move into panel
**Cons**: Timing-dependent, can feel laggy, complex state management with timeouts
**Verdict**: ❌ Rejected - Brittle timing logic, doesn't truly solve sticky panel

### Pattern 3: Compound Hover Region ✅
**Implementation**:
```typescript
<div onMouseLeave={() => setOpenFilter(null)}>  {/* Container */}
  <button onMouseEnter={() => setOpenFilter('status')}>Status</button>
  {openFilter === 'status' && <div>{/* Panel */}</div>}
</div>
```

**Pros**:
- Natural hover behavior: panel stays open while mouse in button+panel region
- Clean state management: single `onMouseLeave` for entire region
- Supports checkbox interaction inside panel
- React batching handles rapid state updates

**Cons**: Requires restructuring JSX (wrapping in container div)
**Verdict**: ✅ **Chosen** - Best matches FR-002 and FR-004 requirements

## State Management Refactoring

### Before: Two Independent Booleans
```typescript
const [showStatusFilter, setShowStatusFilter] = useState(false)
const [showLocationFilter, setShowLocationFilter] = useState(false)
```

**Problems**:
- Both can be `true` → FR-001 violation (only one panel at a time)
- Requires coordination logic to enforce mutual exclusion
- More complex state space (4 combinations vs 3)

### After: Single Nullable Enum ✅
```typescript
type OpenFilterType = 'status' | 'location' | null
const [openFilter, setOpenFilter] = useState<OpenFilterType>(null)
```

**Benefits**:
- **Enforces FR-001**: Only one filter can be open (type system guarantee)
- **Simpler State Space**: 3 states (`null`, `'status'`, `'location'`) vs 4 (2² booleans)
- **Natural Mutual Exclusion**: `setOpenFilter('status')` automatically closes location
- **Clear Semantics**: `null` = closed, string value = which filter is open

**State Transition Table**:
| Current | Event | New State | Effect |
|---------|-------|-----------|--------|
| `null` | Hover Status | `'status'` | Open Status panel |
| `null` | Hover Location | `'location'` | Open Location panel |
| `'status'` | Hover Location | `'location'` | Close Status, open Location |
| `'location'` | Hover Status | `'status'` | Close Location, open Status |
| `'status'` | Leave Region | `null` | Close Status panel |
| `'location'` | Leave Region | `null` | Close Location panel |

## Accessibility & Mobile Support

### Requirement: Dual Trigger (Hover + Click)
**Why**:
- Touch devices don't support hover
- Keyboard-only users need click/Enter access
- Maintains backward compatibility

**Implementation**:
```typescript
<button
  onMouseEnter={() => setOpenFilter('status')}  // Hover trigger
  onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}  // Click toggle
>
  Status ▼
</button>
```

**Behavior**:
- **Desktop + Mouse**: Hover opens, mouse leave closes
- **Touch/Mobile**: Tap toggles open/closed (existing behavior preserved)
- **Keyboard**: Focus + Enter toggles (onClick handler)

### Screen Reader Compatibility
**Decision**: No changes needed
- Existing ARIA labels/roles preserved
- Button semantic already correct (`<button>` element)
- Panel visibility controlled by React rendering (accessible by default)

## Edge Case Handling

### Case 1: Rapid Hover Switching
**Scenario**: User quickly hovers Status → Location → Status
**Handling**: React's state batching automatically handles
**No Special Code Needed**: `setOpenFilter()` calls queue naturally

### Case 2: Mouse Path Anomalies
**Scenario**: Mouse moves from Status button directly to Location panel (skipping Location button)
**Handling**:
- `onMouseLeave` on Status container triggers → closes Status panel
- User must hover Location button to open Location panel
- **Acceptable**: User explicitly navigates to Location button

### Case 3: Panel Positioning Edge of Viewport
**Scenario**: Panel extends beyond viewport on narrow screens
**Decision** (from clarification): Keep desktop behavior (may extend off-screen)
- **Rationale**: Simplicity, responsive design deferred
- **Future**: Could add `position: 'fixed'` + viewport boundary detection

## Implementation Decisions Summary

| Decision | Choice | Rationale | Alternatives Rejected |
|----------|--------|-----------|----------------------|
| **State Structure** | Single enum (`'status' \| 'location' \| null`) | Enforces mutual exclusion naturally | Two booleans (requires coordination logic) |
| **Hover Pattern** | Compound hover region (button+panel container) | Enables sticky selection (FR-002) | Simple hover (closes too fast), timeout-based (timing issues) |
| **Event Handlers** | `onMouseEnter` (button) + `onMouseLeave` (container) | Clean separation: open vs close triggers | `onMouseOver`/`onMouseOut` (bubble issues) |
| **Mobile Fallback** | Keep `onClick` as dual trigger | Accessibility + touch support | Remove onClick (breaks mobile) |
| **Panel Exclusivity** | Single state variable enforces | Type system guarantee (FR-001) | Manual coordination logic |
| **Positioning** | Maintain existing absolute positioning | No changes to visual layout | Responsive repositioning (complexity) |

## Technical Constraints Verified

- ✅ React 18.3.1 supports all required event handlers
- ✅ TypeScript 5.9.2 supports literal union types
- ✅ Inline CSS-in-JS preserved (no style changes needed)
- ✅ Existing filter logic (`filters.status`, `filters.location`) unchanged
- ✅ No new dependencies required

## Validation Strategy

### Manual Testing Required
1. **Hover Behavior**: Visual inspection (panel appears/disappears on hover)
2. **Mutual Exclusion**: Verify only one panel visible at a time
3. **Sticky Selection**: Confirm checkboxes clickable without closing panel
4. **Touch Fallback**: Test on mobile/tablet device (tap toggle works)

### No Automated Tests
- **Rationale**: Pure UI interaction (hover events difficult to test)
- **Alternative**: Manual QA per quickstart.md scenarios

## Research Complete

**Status**: ✅ All technical unknowns resolved
**Blockers**: None
**Next Phase**: Design (data-model.md, quickstart.md)
