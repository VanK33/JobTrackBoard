# UI Controls Contract

## Internal Component Contract (Frontend Only)

### Component State

```typescript
// State Hooks
const [sortBy, setSortBy] = useState<string>('recent')
const [filters, setFilters] = useState<FilterState>({
  status: [],
  location: []
})

// Derived State
const filteredAndSortedJobs = useMemo(() => {
  // Apply filters then sort
}, [jobs, sortBy, filters])

// Unique locations for filter dropdown
const uniqueLocations = useMemo(() => {
  return [...new Set(jobs.map(j => j.location).filter(Boolean))].sort()
}, [jobs])
```

---

### Function: applySorting(jobs: Job[], sortBy: string): Job[]

**Purpose**: Sort job array based on selected criterion

**Input**:
- `jobs`: Array of Job objects
- `sortBy`: Sort criterion ('recent' | 'oldest' | 'status' | 'location' | 'company')

**Logic**:
```typescript
const applySorting = (jobs: Job[], sortBy: string): Job[] => {
  return [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'oldest':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      case 'status':
        const statusPriority = {
          'interested': 1,
          'applied': 2,
          'interviewing': 3,
          'offered': 4,
          'accepted': 5,
          'rejected': 6
        }
        return statusPriority[a.status] - statusPriority[b.status]
      case 'location':
        return (a.location || '\uffff').localeCompare(b.location || '\uffff')
      case 'company':
        return (a.company || '\uffff').localeCompare(b.company || '\uffff')
      default:
        return 0
    }
  })
}
```

**Output**: Sorted array of jobs

**Error Handling**:
- Invalid sortBy → No sorting applied (return original order)
- Null/undefined location/company → Sorted to end using '\uffff'

---

### Function: applyFilters(jobs: Job[], filters: FilterState): Job[]

**Purpose**: Filter job array based on selected filters

**Input**:
- `jobs`: Array of Job objects
- `filters`: FilterState object with status and location arrays

**Logic**:
```typescript
const applyFilters = (jobs: Job[], filters: FilterState): Job[] => {
  return jobs.filter(job => {
    // Status filter (AND logic)
    if (filters.status.length > 0) {
      if (!filters.status.includes(job.status)) {
        return false
      }
    }

    // Location filter (AND logic)
    if (filters.location.length > 0) {
      if (!filters.location.includes(job.location)) {
        return false
      }
    }

    return true
  })
}
```

**Output**: Filtered array of jobs

**Error Handling**:
- Empty filter arrays → No filtering (return all jobs)
- Non-existent status values → Ignored
- Non-existent locations → No matches returned

---

### Function: loadPreferences(): { sortBy: string, filters: FilterState }

**Purpose**: Load saved preferences from localStorage on component mount

**Logic**:
```typescript
const loadPreferences = () => {
  try {
    const savedSort = localStorage.getItem('job-dashboard-sort')
    const savedFilters = localStorage.getItem('job-dashboard-filters')

    return {
      sortBy: (savedSort && ['recent', 'oldest', 'status', 'location', 'company'].includes(savedSort))
        ? savedSort
        : 'recent',
      filters: savedFilters ? JSON.parse(savedFilters) : { status: [], location: [] }
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
    return {
      sortBy: 'recent',
      filters: { status: [], location: [] }
    }
  }
}
```

**Output**: Preferences object or defaults

**Error Handling**:
- localStorage unavailable → Return defaults
- JSON parse error → Return defaults
- Invalid values → Return defaults

---

### Function: savePreferences(sortBy: string, filters: FilterState): void

**Purpose**: Save preferences to localStorage on change

**Logic**:
```typescript
const savePreferences = (sortBy: string, filters: FilterState) => {
  try {
    localStorage.setItem('job-dashboard-sort', sortBy)
    localStorage.setItem('job-dashboard-filters', JSON.stringify(filters))
  } catch (error) {
    console.error('Failed to save preferences:', error)
    // Fail silently - not critical
  }
}
```

**Output**: void

**Error Handling**:
- localStorage full → Log error, continue
- localStorage unavailable → Log error, continue
- Non-critical errors → Fail silently

---

### Function: clearFilters(): void

**Purpose**: Reset all filters to empty state

**Logic**:
```typescript
const clearFilters = () => {
  setFilters({ status: [], location: [] })
}
```

**Output**: void (updates state)

---

## UI Component Contracts

### Sort Dropdown Component

**Rendered HTML**:
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <label htmlFor="sort-select" style={{ fontSize: '14px', color: '#666' }}>
    Sort by:
  </label>
  <select
    id="sort-select"
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    style={{
      padding: '6px 12px',
      fontSize: '14px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      backgroundColor: '#fff',
      cursor: 'pointer'
    }}
  >
    <option value="recent">Recent</option>
    <option value="oldest">Oldest First</option>
    <option value="status">Status Progress</option>
    <option value="location">Location A-Z</option>
    <option value="company">Company A-Z</option>
  </select>
</div>
```

**Behavior**:
- On change → Update sortBy state
- State change triggers localStorage save
- State change triggers useMemo recomputation

---

### Filter Control Component

**Rendered HTML**:
```tsx
<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  {/* Status Filter */}
  <div>
    <button
      onClick={() => setShowStatusFilter(!showStatusFilter)}
      style={{
        padding: '6px 12px',
        fontSize: '14px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: filters.status.length > 0 ? '#f0f0f0' : '#fff',
        cursor: 'pointer'
      }}
    >
      Status
      {filters.status.length > 0 && (
        <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>
          ({filters.status.length})
        </span>
      )}
    </button>
    {showStatusFilter && (
      <div style={{
        position: 'absolute',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px',
        marginTop: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        {['interested', 'applied', 'interviewing', 'offered', 'accepted', 'rejected'].map(status => (
          <label key={status} style={{ display: 'block', marginBottom: '4px' }}>
            <input
              type="checkbox"
              checked={filters.status.includes(status)}
              onChange={(e) => {
                const newStatus = e.target.checked
                  ? [...filters.status, status]
                  : filters.status.filter(s => s !== status)
                setFilters({ ...filters, status: newStatus })
              }}
            />
            <span style={{ marginLeft: '6px' }}>{statusLabels[status]}</span>
          </label>
        ))}
      </div>
    )}
  </div>

  {/* Location Filter (similar structure) */}

  {/* Clear All Button */}
  {(filters.status.length > 0 || filters.location.length > 0) && (
    <button
      onClick={clearFilters}
      style={{
        padding: '6px 12px',
        fontSize: '14px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#ff4444',
        color: '#fff',
        cursor: 'pointer'
      }}
    >
      Clear All
    </button>
  )}
</div>
```

**Behavior**:
- Checkboxes toggle filter selections
- Counter badges show active filter count
- Clear All button appears when filters active
- State changes trigger localStorage save
- State changes trigger useMemo recomputation

---

## Empty State Component

**Displayed When**: `filteredAndSortedJobs.length === 0 && filters have values`

**Rendered HTML**:
```tsx
<div style={{
  textAlign: 'center',
  padding: '60px 20px',
  color: '#999'
}}>
  <p style={{ fontSize: '16px', marginBottom: '12px' }}>
    No applications match your filters
  </p>
  <button
    onClick={clearFilters}
    style={{
      padding: '8px 16px',
      fontSize: '14px',
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    Clear Filters
  </button>
</div>
```

---

## Testing Contracts

### Unit Tests Required
1. `applySorting()` with each sort option
2. `applyFilters()` with various filter combinations
3. `loadPreferences()` with valid/invalid localStorage data
4. `savePreferences()` success and error cases

### Integration Tests Required
1. Sort dropdown changes → list updates
2. Filter checkbox toggles → list updates
3. Multiple filters (status + location) → AND logic
4. Clear All → resets to all jobs
5. Page refresh → preferences persist

### Visual Tests Required
1. Compact layout → measure vertical space
2. Filter badges → count accuracy
3. Empty state → appears when no matches
4. Dropdown positioning → doesn't overflow

---

## Accessibility Requirements

### Keyboard Navigation
- All dropdowns focusable and operable via keyboard
- Tab order: Sort dropdown → Filter buttons → Clear All
- Enter/Space to toggle checkboxes
- Escape to close filter dropdowns

### ARIA Labels
```tsx
<select aria-label="Sort applications by">
<button aria-label="Filter by status" aria-expanded={showStatusFilter}>
<button aria-label="Clear all filters">
```

### Screen Reader Support
- Announce filter count changes
- Announce when list updates
- Announce empty state
