# Data Model: UI Improvements - Compact Layout and Sorting/Filtering

## Entity: FilterState (Frontend)

### Purpose
Represents the user's active filter selections for the job dashboard

### Fields
| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| status | string[] | No | Selected status filters | Must be subset of: ['interested', 'applied', 'interviewing', 'offered', 'accepted', 'rejected'] |
| location | string[] | No | Selected location filters | Must match existing job locations |

### Example
```typescript
{
  status: ['applied', 'interviewing'],
  location: ['Remote', 'San Francisco']
}
```

## Entity: SortPreference (Frontend)

### Purpose
Represents the user's selected sort order for the job list

### Fields
| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| sortBy | string | Yes | Sort criterion | One of: 'recent', 'oldest', 'status', 'location', 'company' |

### Values
- `'recent'`: Sort by `updatedAt` descending (newest first) - **DEFAULT**
- `'oldest'`: Sort by `updatedAt` ascending (oldest first)
- `'status'`: Sort by status progression order (interested → rejected)
- `'location'`: Sort by `location` alphabetically (A-Z)
- `'company'`: Sort by `company` alphabetically (A-Z)

## Modified Interfaces

### JobFile (No Changes)
Existing interface remains unchanged - no modifications needed for this feature

### Job (No Changes to Structure)
Existing Job interface sufficient. Relevant fields for sorting/filtering:
```typescript
interface Job {
  _id: string
  title: string
  company: string
  location: string
  status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'accepted' | 'rejected'
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp - USED FOR DATE SORTING
  appliedAt?: string
  // ... other fields
}
```

## New Component State

### JobDashboard Component (Updated)
```typescript
// NEW STATE
const [sortBy, setSortBy] = useState<string>('recent')
const [filters, setFilters] = useState<FilterState>({
  status: [],
  location: []
})

// DERIVED STATE (computed)
const filteredAndSortedJobs = useMemo(() => {
  // 1. Apply filters
  let result = jobs.filter(job => {
    // Status filter (AND logic)
    if (filters.status.length > 0 && !filters.status.includes(job.status)) {
      return false
    }
    // Location filter (AND logic)
    if (filters.location.length > 0 && !filters.location.includes(job.location)) {
      return false
    }
    return true
  })

  // 2. Apply sort
  result.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'oldest':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      case 'status':
        return statusPriority[a.status] - statusPriority[b.status]
      case 'location':
        return (a.location || 'zzz').localeCompare(b.location || 'zzz')
      case 'company':
        return (a.company || 'zzz').localeCompare(b.company || 'zzz')
      default:
        return 0
    }
  })

  return result
}, [jobs, sortBy, filters])
```

## LocalStorage Schema

### Storage Keys
```typescript
const STORAGE_KEYS = {
  SORT: 'job-dashboard-sort',
  FILTERS: 'job-dashboard-filters'
}
```

### Stored Data Format
```typescript
// localStorage['job-dashboard-sort']
"recent" | "oldest" | "status" | "location" | "company"

// localStorage['job-dashboard-filters']
{
  "status": ["applied", "interviewing"],
  "location": ["Remote"]
}
```

### Data Flow
```
[User Action]
    ↓
[Update State] (sortBy or filters)
    ↓
[Save to localStorage] (useEffect)
    ↓
[Recompute filteredAndSortedJobs] (useMemo)
    ↓
[Re-render Job List]
```

## Status Priority Mapping

### For Status-Based Sorting
```typescript
const statusPriority: Record<string, number> = {
  'interested': 1,
  'applied': 2,
  'interviewing': 3,
  'offered': 4,
  'accepted': 5,
  'rejected': 6
}
```

**Rationale**: Natural progression order, with 'rejected' always last

## UI Control State

### Sort Dropdown
```typescript
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
>
  <option value="recent">Recent</option>
  <option value="oldest">Oldest First</option>
  <option value="status">Status Progress</option>
  <option value="location">Location A-Z</option>
  <option value="company">Company A-Z</option>
</select>
```

### Filter Dropdowns (Multi-Select)
```typescript
// Status Filter
<div>
  {['interested', 'applied', 'interviewing', 'offered', 'accepted', 'rejected'].map(status => (
    <label key={status}>
      <input
        type="checkbox"
        checked={filters.status.includes(status)}
        onChange={(e) => {
          if (e.target.checked) {
            setFilters({...filters, status: [...filters.status, status]})
          } else {
            setFilters({...filters, status: filters.status.filter(s => s !== status)})
          }
        }}
      />
      {statusLabels[status]}
    </label>
  ))}
</div>

// Location Filter (Dynamic - based on unique job locations)
const uniqueLocations = [...new Set(jobs.map(j => j.location).filter(Boolean))]
<div>
  {uniqueLocations.map(location => (
    <label key={location}>
      <input
        type="checkbox"
        checked={filters.location.includes(location)}
        onChange={/* similar to status */}
      />
      {location}
    </label>
  ))}
</div>
```

## Validation Rules

### Filter State Validation
1. `filters.status` must be subset of valid status values
2. `filters.location` must match existing job locations (dynamic validation)
3. Empty arrays are valid (means "no filter applied")

### Sort Preference Validation
1. `sortBy` must be one of the 5 valid options
2. Invalid values → fallback to 'recent'
3. LocalStorage corruption → fallback to 'recent'

### Edge Cases
1. **No jobs match filters**: Show empty state message
2. **Null/empty location values**: Sorted to end when sorting by location
3. **Null/empty company values**: Sorted to end when sorting by company
4. **New job added**: Auto-applies filters and sorting (appears in correct position if visible)

## State Persistence Logic

### On Mount (Load)
```typescript
useEffect(() => {
  try {
    const savedSort = localStorage.getItem(STORAGE_KEYS.SORT)
    if (savedSort && ['recent', 'oldest', 'status', 'location', 'company'].includes(savedSort)) {
      setSortBy(savedSort)
    }

    const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS)
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters)
      setFilters(parsed)
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
    // Fallback to defaults
  }
}, [])
```

### On Change (Save)
```typescript
useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.SORT, sortBy)
}, [sortBy])

useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters))
}, [filters])
```

## Component Props (No Changes)

No prop changes required - all state is local to JobDashboard component

## CSS/Styling Changes

### Compact Layout (Reduced Spacing)
```typescript
// BEFORE
padding: selectedJob && !detailViewExpanded ? '12px 16px' : '16px'
marginBottom: selectedJob && !detailViewExpanded ? '6px' : '8px'

// AFTER (35% reduction)
padding: '10px 16px'  // Uniform for all states
marginBottom: '5px'   // Uniform for all states
```

**Impact**: Simpler code + ~40% more cards visible

## Filter Count Badges

### UI Indicator
```typescript
// Display active filter count
const activeFilterCount = filters.status.length + filters.location.length

{activeFilterCount > 0 && (
  <span style={{
    backgroundColor: '#000',
    color: '#fff',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    marginLeft: '4px'
  }}>
    {activeFilterCount}
  </span>
)}
```
