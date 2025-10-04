# Quickstart Guide: Rich Text Description Editor

**Feature**: Rich Text Description Editor with Modal Viewer
**Target Audience**: Developers implementing this feature
**Estimated Time**: 15 minutes setup + development time

## Prerequisites

- Node.js 18+ and npm 9+
- Repository cloned: `job_seek_app`
- Development server running: `npm run dev`
- Familiarity with React 18 and TypeScript

## Setup (5 minutes)

### 1. Install Dependencies

```bash
cd /path/to/job_seek_app/platform/core

npm install @uiw/react-md-editor react-markdown remark-gfm turndown
npm install --save-dev @types/turndown
```

**Dependencies Added**:
- `@uiw/react-md-editor`: Markdown editor component
- `react-markdown`: Markdown renderer (XSS-safe)
- `remark-gfm`: GitHub-Flavored Markdown support
- `turndown`: HTML → Markdown converter (for paste)

### 2. Verify Installation

```bash
npm list @uiw/react-md-editor react-markdown
```

Expected output:
```
@platform/core@1.0.0
├── @uiw/react-md-editor@3.23.0
└── react-markdown@9.0.0
```

### 3. Create Directory Structure

```bash
cd src/frontend

# Create component files
mkdir -p components
touch components/MarkdownEditor.tsx
touch components/MarkdownRenderer.tsx
touch components/DescriptionModal.tsx

# Create utilities
mkdir -p utils
touch utils/markdown.ts

# Create tests
mkdir -p __tests__/components
mkdir -p __tests__/utils
touch __tests__/components/MarkdownEditor.test.tsx
touch __tests__/components/MarkdownRenderer.test.tsx
touch __tests__/components/DescriptionModal.test.tsx
touch __tests__/utils/markdown.test.ts
```

## Development Workflow

### Phase 1: Build Utilities (1-2 hours)

**Start with**: `utils/markdown.ts`

**Why first?** Other components depend on these utilities.

**Contract**: See [contracts/markdown.contract.md](./contracts/markdown.contract.md)

**Steps**:
1. Implement `htmlToMarkdown()` using turndown
2. Implement `sanitizeMarkdown()`
3. Implement helper functions
4. Write unit tests
5. Verify: `npm test -- markdown.test.ts`

**Validation**:
```typescript
// Quick manual test
import { htmlToMarkdown } from './utils/markdown';

const html = '<strong>Bold</strong> and <em>italic</em>';
console.log(htmlToMarkdown(html));
// Expected: "**Bold** and *italic*"
```

### Phase 2: Build Components (4-6 hours)

#### A. MarkdownRenderer (1 hour)

**Start with**: `components/MarkdownRenderer.tsx`

**Why?** Simplest component, no complex interactions.

**Contract**: Display-only Markdown renderer

**Steps**:
1. Create functional component
2. Use `react-markdown` with `remark-gfm`
3. Add inline styling
4. Write unit tests
5. Verify: Render sample Markdown in isolation

**Quick Test**:
```typescript
// In JobDashboard.tsx temporarily
import MarkdownRenderer from '../components/MarkdownRenderer';

<MarkdownRenderer content="**Bold** and *italic*" />
```

#### B. MarkdownEditor (2-3 hours)

**Next**: `components/MarkdownEditor.tsx`

**Contract**: See [contracts/editor.contract.md](./contracts/editor.contract.md)

**Steps**:
1. Wrap `@uiw/react-md-editor`
2. Add paste event handler (use `markdown.ts`)
3. Configure toolbar
4. Add inline styling
5. Write unit tests
6. Verify: Type and see formatted output

**Quick Test**:
```typescript
import MarkdownEditor from '../components/MarkdownEditor';

function TestEditor() {
  const [value, setValue] = useState('');
  return (
    <>
      <MarkdownEditor value={value} onChange={setValue} />
      <pre>{value}</pre>
    </>
  );
}
```

#### C. DescriptionModal (1-2 hours)

**Finally**: `components/DescriptionModal.tsx`

**Contract**: See [contracts/modal.contract.md](./contracts/modal.contract.md)

**Steps**:
1. Create portal-based modal structure
2. Implement scroll lock with useEffect
3. Add keyboard handlers (Escape key)
4. Add click-outside handler
5. Integrate MarkdownRenderer
6. Write unit tests
7. Verify: Open/close, scroll lock, content display

**Quick Test**:
```typescript
import DescriptionModal from '../components/DescriptionModal';

function TestModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <DescriptionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        description="# Test\n**Bold** text"
      />
    </>
  );
}
```

### Phase 3: Integration (2-3 hours)

**Integrate into**: `pages/JobDashboard.tsx`

**Changes**:
1. **Add Job Form**: Replace `<textarea>` with `<MarkdownEditor>`
2. **Edit Job Form**: Use `<MarkdownEditor>` for description
3. **Job List View**: Add click handler to open modal
4. **Remove Hover Scroll**: Delete old description preview mechanism
5. **Add Modal**: Include `<DescriptionModal>` component

**Example Integration**:
```typescript
import MarkdownEditor from '../components/MarkdownEditor';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DescriptionModal from '../components/DescriptionModal';

function JobDashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [newJobDescription, setNewJobDescription] = useState('');

  return (
    <>
      {/* Add/Edit Form */}
      <MarkdownEditor
        value={newJobDescription}
        onChange={setNewJobDescription}
        placeholder="Enter job description with formatting..."
      />

      {/* Job List */}
      {jobs.map(job => (
        <div
          key={job._id}
          onClick={() => {
            setSelectedDescription(job.description);
            setModalOpen(true);
          }}
        >
          {job.title}
          {/* Preview snippet */}
          <MarkdownRenderer content={truncateMarkdown(job.description, 100)} />
        </div>
      ))}

      {/* Modal */}
      <DescriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        description={selectedDescription}
      />
    </>
  );
}
```

### Phase 4: Testing (1-2 hours)

#### Unit Tests

```bash
npm test -- MarkdownEditor.test.tsx
npm test -- MarkdownRenderer.test.tsx
npm test -- DescriptionModal.test.tsx
npm test -- markdown.test.ts
```

#### Integration Testing (Manual)

**Test Checklist**:
- [ ] Create new job with formatted description → Save → Reload → Formatting preserved
- [ ] Edit existing job → Add formatting → Save → Formatting preserved
- [ ] Click description in job list → Modal opens → Content displayed correctly
- [ ] Scroll modal content → Background locked → Scroll works inside modal
- [ ] Click outside modal → Modal closes → Scroll restored
- [ ] Press Escape → Modal closes
- [ ] Click X button → Modal closes
- [ ] Paste from Word/Google Docs → Formatting converted to Markdown
- [ ] Type Markdown syntax (**, *, #) → Preview shows formatting
- [ ] Legacy plain text job → Displays correctly (backward compatibility)

#### Browser Testing

**Test in**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Troubleshooting

### Issue: Editor not rendering

**Solution**: Check imports and dependencies
```bash
npm list @uiw/react-md-editor
# Reinstall if missing
npm install @uiw/react-md-editor
```

### Issue: Paste not converting HTML

**Solution**: Verify turndown is installed and paste handler is registered
```typescript
// In MarkdownEditor.tsx
import TurndownService from 'turndown';
```

### Issue: Modal not locking scroll

**Solution**: Check useEffect cleanup
```typescript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.removeProperty('overflow');
    };
  }
}, [isOpen]);
```

### Issue: XSS vulnerability warnings

**Solution**: Verify react-markdown is used (NOT dangerouslySetInnerHTML)
```typescript
// ✅ Correct
<ReactMarkdown>{content}</ReactMarkdown>

// ❌ Wrong
<div dangerouslySetInnerHTML={{ __html: marked(content) }} />
```

### Issue: Formatting not saved to database

**Solution**: Verify description field is being sent in API request
```typescript
// Check network tab: POST /api/jobs
{
  "title": "Job Title",
  "description": "**Bold** text",  // ✅ Should be Markdown string
  ...
}
```

## Performance Optimization (Optional)

### Lazy Load Editor

```typescript
import { lazy, Suspense } from 'react';

const MarkdownEditor = lazy(() => import('../components/MarkdownEditor'));

function JobForm() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <MarkdownEditor ... />
    </Suspense>
  );
}
```

**Benefit**: Reduces initial bundle size by ~50KB

### Memoize Renderer

```typescript
import { memo } from 'react';

const MarkdownRenderer = memo(({ content }: { content: string }) => {
  return <ReactMarkdown>{content}</ReactMarkdown>;
});
```

**Benefit**: Prevents unnecessary re-renders

## Next Steps

1. ✅ Complete setup (dependencies, file structure)
2. ✅ Build utilities → Components → Integration
3. ✅ Write and run tests
4. ✅ Manual testing checklist
5. ✅ Browser compatibility testing
6. ✅ Performance profiling (optional)
7. 🚀 **Ready for production!**

## Resources

- **Contracts**: See `contracts/` directory for detailed component specs
- **Data Model**: See `data-model.md` for storage format
- **Research**: See `research.md` for library evaluations
- **Tasks**: Run `/tasks` command for detailed task breakdown

## Support

**Questions?**
- Check contract files for detailed component behavior
- Review research.md for library documentation links
- Test in isolation before integration

**Common Patterns**:
- Component styling: Inline CSS-in-JS (matches project pattern)
- State management: React hooks (no external state library)
- Testing: Jest + React Testing Library

---

**Happy coding! 🚀**
