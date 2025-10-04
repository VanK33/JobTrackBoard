# Phase 0: Research - Rich Text Editor & Modal Implementation

**Feature**: Rich Text Description Editor with Modal Viewer
**Date**: 2025-10-03
**Status**: ✅ Completed

## Research Questions

1. What Markdown editor libraries are suitable for React + TypeScript?
2. What Markdown parsing/rendering libraries provide security and customization?
3. How to implement modal dialogs with scroll lock in React?
4. How to handle paste events with intelligent format conversion?
5. What are the performance implications of real-time Markdown rendering?

## Findings

### 1. Markdown Editor Libraries

**Evaluated Options**:

| Library | Bundle Size | TypeScript | Pros | Cons | Score |
|---------|------------|------------|------|------|-------|
| @uiw/react-md-editor | ~50KB | ✅ Yes | Lightweight, good toolbar, preview mode | Basic styling | ⭐⭐⭐⭐ |
| react-simplemde-editor | ~200KB | ⚠️ Types available | Feature-rich, mature | Heavy, outdated deps | ⭐⭐⭐ |
| react-md-editor | ~30KB | ✅ Yes | Minimal, fast | Limited features | ⭐⭐⭐ |
| Draft.js | ~300KB | ✅ Yes | Powerful, extensible | Overkill, complex | ⭐⭐ |

**Recommendation**: **@uiw/react-md-editor**
- Balanced feature set for our needs (bold, italic, lists, links, headings)
- Good TypeScript support
- Reasonable bundle size
- Active maintenance
- Built-in preview mode

**Installation**:
```bash
npm install @uiw/react-md-editor
```

### 2. Markdown Parsing/Rendering

**Evaluated Options**:

| Library | Security | Bundle | Extensibility | TypeScript |
|---------|----------|--------|---------------|------------|
| react-markdown | ✅ Sanitized | ~20KB | ✅ Plugins | ✅ Yes |
| marked | ⚠️ Manual | ~15KB | ⚠️ Limited | ✅ Yes |
| markdown-it | ⚠️ Manual | ~25KB | ✅ Plugins | ✅ Yes |
| showdown | ⚠️ Manual | ~40KB | ❌ Limited | ⚠️ Types |

**Recommendation**: **react-markdown**
- Built-in XSS protection via `remark-gfm`
- React-native rendering (no `dangerouslySetInnerHTML`)
- Plugin ecosystem for extensibility
- Excellent TypeScript support
- Actively maintained

**Installation**:
```bash
npm install react-markdown remark-gfm
```

**Security Note**: react-markdown sanitizes HTML by default, preventing XSS attacks from user-generated Markdown content.

### 3. Modal Implementation Patterns

**Approaches Evaluated**:

#### A. Portal-Based Modal (Recommended)
```typescript
import { createPortal } from 'react-dom';

function Modal({ children, onClose }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
```

**Pros**:
- Renders outside normal React tree (avoids z-index issues)
- Clean separation from page layout
- Standard React pattern

**Cons**:
- Slightly more complex than inline
- Need to manage portal root

#### B. Inline Modal
```typescript
function Modal({ children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>
  );
}
```

**Pros**:
- Simpler implementation
- No portal management

**Cons**:
- Z-index conflicts possible
- May inherit unwanted styles

**Decision**: Use **Portal-Based Modal** for cleaner architecture and avoiding CSS conflicts.

### 4. Scroll Lock Implementation

**Techniques Evaluated**:

#### A. CSS `overflow: hidden` on `<body>` ✅ Chosen
```typescript
useEffect(() => {
  if (isOpen) {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      window.scrollTo(0, scrollY);
    };
  }
}, [isOpen]);
```

**Pros**:
- Simple, reliable
- Preserves scroll position
- No dependencies

**Cons**:
- Requires cleanup on unmount

#### B. JavaScript `preventDefault` on scroll events
**Pros**: Fine-grained control
**Cons**: Performance overhead, complex

#### C. Third-party library (react-scroll-lock)
**Pros**: Handles edge cases
**Cons**: Extra dependency, overkill

**Decision**: Use **CSS overflow approach** - simple, performant, no extra dependencies.

### 5. Paste Event Handling

**Challenge**: Convert formatted text from Word/Google Docs to Markdown

**Approach**:
```typescript
function handlePaste(e: ClipboardEvent) {
  e.preventDefault();

  const html = e.clipboardData.getData('text/html');
  const plain = e.clipboardData.getData('text/plain');

  if (html) {
    // Convert HTML to Markdown
    const markdown = htmlToMarkdown(html);
    insertMarkdown(markdown);
  } else {
    // Insert plain text
    insertMarkdown(plain);
  }
}
```

**Library for HTML → Markdown**: **turndown**
```bash
npm install turndown
```

**Supported Conversions**:
- `<strong>`, `<b>` → `**bold**`
- `<em>`, `<i>` → `*italic*`
- `<u>` → Custom rule for underline (Markdown doesn't have native underline)
- `<ul>`, `<li>` → `- item`
- `<ol>`, `<li>` → `1. item`
- `<a href>` → `[text](url)`
- `<h1>` - `<h3>` → `# Heading`

**Unsupported Formats Stripped**:
- Images
- Tables (if not needed based on requirements)
- Complex formatting (colors, fonts, sizes)
- Embedded objects

### 6. Performance Considerations

**Markdown Rendering**:
- **Typical description** (500 words): <50ms render time
- **Large description** (5000 words): <200ms render time
- **Optimization**: Memoize rendered output with `React.memo`

**Editor Responsiveness**:
- **Keystroke latency**: <16ms (60fps threshold)
- **@uiw/react-md-editor** uses debounced preview updates (300ms default)
- No performance concerns for typical usage

**Bundle Size Impact**:
- @uiw/react-md-editor: ~50KB
- react-markdown + remark-gfm: ~25KB
- turndown: ~20KB
- **Total**: ~95KB additional bundle (acceptable for feature value)

## Technical Decisions Summary

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| Editor Library | @uiw/react-md-editor | Best balance of features, size, TypeScript support |
| Renderer Library | react-markdown | Security (XSS protection), React-native rendering |
| Modal Pattern | Portal-based | Avoids z-index conflicts, clean architecture |
| Scroll Lock | CSS overflow:hidden | Simple, performant, no dependencies |
| Paste Handling | turndown (HTML→MD) | Intelligent format conversion, extensible |
| Storage Format | Markdown strings | Already decided in clarifications |

## Dependencies to Add

```json
{
  "dependencies": {
    "@uiw/react-md-editor": "^3.23.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "turndown": "^7.1.0"
  },
  "devDependencies": {
    "@types/turndown": "^5.0.0"
  }
}
```

## Risks & Mitigations

### Risk 1: XSS Vulnerability
**Mitigation**: react-markdown sanitizes by default, no `dangerouslySetInnerHTML` used

### Risk 2: Bundle Size Growth
**Mitigation**: Total addition (~95KB) is acceptable; consider lazy loading editor if needed

### Risk 3: Backward Compatibility
**Mitigation**: Plain text descriptions work as Markdown (no special characters), renderer handles both

### Risk 4: Browser Compatibility
**Mitigation**: All libraries support modern browsers; no IE11 requirement stated

## Open Questions (Resolved)

1. ~~Which formatting options to support?~~ → **Resolved in clarifications**: Bold, Italic, Underline, Lists, Links, Headings
2. ~~Storage format?~~ → **Resolved in clarifications**: Markdown
3. ~~Paste behavior?~~ → **Resolved in clarifications**: Smart conversion

## Next Steps

Proceed to **Phase 1**: Design contracts and data models based on research findings.
