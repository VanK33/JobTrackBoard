# Contract: MarkdownEditor Component

**Purpose**: Provide a rich text editing interface for job descriptions with Markdown formatting support

**Location**: `platform/core/src/frontend/components/MarkdownEditor.tsx`

## Interface

```typescript
interface MarkdownEditorProps {
  value: string;                    // Current Markdown content
  onChange: (value: string) => void; // Callback when content changes
  placeholder?: string;              // Optional placeholder text
  height?: number;                   // Editor height in pixels (default: 300)
  previewOptions?: 'edit' | 'live' | 'preview'; // Edit mode (default: 'edit')
}
```

## Behavior

### Input
- Accepts Markdown text string as `value` prop
- Supports controlled component pattern (external state management)

### Output
- Calls `onChange` with updated Markdown string on every edit
- Debounced updates (300ms) to prevent excessive re-renders

### Features
- **Toolbar**: Bold, Italic, Underline, Heading (H1-H3), Lists (ordered/unordered), Link
- **Keyboard Shortcuts**:
  - Ctrl/Cmd + B: Bold
  - Ctrl/Cmd + I: Italic
  - Ctrl/Cmd + K: Insert link
- **Paste Handling**: Converts HTML to Markdown (see markdown.contract.md)
- **Preview Mode**: Optional live or side-by-side preview

### State Management
- No internal state for content (fully controlled)
- Internal state for UI (toolbar visibility, preview mode)

## Dependencies

- `@uiw/react-md-editor` (external library)
- `turndown` (for paste handling)
- `markdown.ts` utility (for conversion functions)

## Error Handling

- **Invalid Markdown**: Renders as-is (Markdown is forgiving)
- **Paste Errors**: Falls back to plain text on conversion failure
- **onChange Errors**: Catches and logs, prevents crash

## Performance

- **Keystroke Latency**: <16ms per keystroke
- **Preview Render**: Debounced to 300ms
- **Memory**: <10MB for typical descriptions (1-10KB text)

## Accessibility

- **ARIA Labels**: Editor has `aria-label="Job description editor"`
- **Keyboard Navigation**: Full keyboard support via library
- **Focus Management**: Auto-focus on mount if requested

## Testing Contract

### Unit Tests
- Renders with initial value
- Calls onChange when text changes
- Toolbar buttons insert correct Markdown syntax
- Keyboard shortcuts work correctly
- Paste handling converts HTML to Markdown

### Integration Tests
- Works within JobDashboard form
- Preserves content on re-render
- Handles rapid typing without lag

## Example Usage

```typescript
function JobForm() {
  const [description, setDescription] = useState('');

  return (
    <MarkdownEditor
      value={description}
      onChange={setDescription}
      placeholder="Enter job description with formatting..."
      height={400}
    />
  );
}
```

## Styling

- Uses inline CSS-in-JS (matches project pattern)
- Inherits theme from page (fonts, colors)
- Responsive: Adapts to container width
- Dark mode: Follows system preference (via library)
