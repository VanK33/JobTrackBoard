# Contract: DescriptionModal Component

**Purpose**: Display full job description in a modal dialog with scroll lock and clean UX

**Location**: `platform/core/src/frontend/components/DescriptionModal.tsx`

## Interface

```typescript
interface DescriptionModalProps {
  isOpen: boolean;                  // Modal open/closed state
  onClose: () => void;              // Callback to close modal
  description: string;              // Markdown content to display
  jobTitle?: string;                // Optional job title for header
}
```

## Behavior

### Lifecycle
1. **Open**:
   - Save current scroll position
   - Lock background scroll (`overflow: hidden` on body)
   - Render modal via portal to `document.body`
   - Focus trap within modal

2. **Close**:
   - Restore background scroll
   - Restore scroll position
   - Remove modal from DOM
   - Return focus to trigger element

### Interaction
- **Click Outside**: Clicking overlay (outside content) closes modal
- **Escape Key**: Pressing Escape closes modal
- **Close Button**: X button in top-right closes modal
- **Scroll**: Content area scrolls independently, background locked

### Visual
- **Overlay**: Semi-transparent black (`rgba(0,0,0,0.5)`)
- **Content**: White background, rounded corners, shadow
- **Size**: 80% viewport width, 90% viewport height (max 1200px wide)
- **Positioning**: Centered vertically and horizontally
- **Close Button**: Top-right, X icon, hover state

## Dependencies

- `react-dom` (createPortal)
- `MarkdownRenderer` component (for content display)
- No external modal libraries

## State Management

- No internal state (fully controlled via `isOpen` prop)
- Uses `useEffect` for scroll lock side effects

## Error Handling

- **Missing Description**: Shows "No description available" message
- **onClose Failure**: Catches errors, logs, attempts cleanup
- **Portal Target Missing**: Falls back to inline rendering

## Performance

- **Open/Close Animation**: <100ms
- **Scroll Performance**: Smooth scrolling for long content
- **Memory**: Minimal (removed from DOM when closed)

## Accessibility

- **ARIA Role**: `role="dialog"`, `aria-modal="true"`
- **ARIA Label**: `aria-labelledby` points to job title
- **Focus Trap**: Tab cycles within modal
- **Keyboard**: Escape to close, Tab navigation
- **Screen Reader**: Announces modal open/close

## Testing Contract

### Unit Tests
- Renders when `isOpen=true`
- Does not render when `isOpen=false`
- Calls `onClose` when overlay clicked
- Calls `onClose` when Escape pressed
- Calls `onClose` when X button clicked
- Locks scroll when open
- Restores scroll when closed

### Integration Tests
- Opens from JobDashboard correctly
- Preserves scroll position after close
- Works with keyboard navigation
- Displays Markdown content correctly

## Example Usage

```typescript
function JobList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');

  const handleDescriptionClick = (description: string) => {
    setSelectedDescription(description);
    setModalOpen(true);
  };

  return (
    <>
      <div onClick={() => handleDescriptionClick(job.description)}>
        View Description
      </div>

      <DescriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        description={selectedDescription}
        jobTitle="Software Engineer at Google"
      />
    </>
  );
}
```

## Styling (Inline CSS-in-JS)

```typescript
const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    width: '80%',
    maxWidth: '1200px',
    height: '90%',
    maxHeight: '800px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto' as const,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666666',
  },
};
```

## Mobile Responsiveness

- **Small Screens** (<768px): 95% width, 95% height
- **Touch**: Tap outside or close button to close
- **Scroll**: Touch scrolling within content area
