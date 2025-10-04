# Contract: Markdown Utilities Module

**Purpose**: Centralize Markdown conversion, sanitization, and rendering logic

**Location**: `platform/core/src/frontend/utils/markdown.ts`

## Public API

### 1. `htmlToMarkdown(html: string): string`

Converts HTML to Markdown with intelligent format preservation.

**Input**: HTML string (from clipboard or external source)
**Output**: Markdown string

**Supported Conversions**:
| HTML | Markdown |
|------|----------|
| `<strong>`, `<b>` | `**text**` |
| `<em>`, `<i>` | `*text*` |
| `<u>` | `<u>text</u>` (HTML passthrough) |
| `<ul><li>` | `- item` |
| `<ol><li>` | `1. item` |
| `<a href="">` | `[text](url)` |
| `<h1>` - `<h3>` | `#` / `##` / `###` |

**Stripped Elements**:
- Images (if not required)
- Tables
- Scripts, styles
- Complex formatting (colors, fonts)

**Error Handling**:
- Invalid HTML → Returns original HTML as plain text
- Malformed tags → Best-effort conversion

**Example**:
```typescript
const html = '<strong>Bold</strong> and <em>italic</em>';
const md = htmlToMarkdown(html);
// Result: '**Bold** and *italic*'
```

---

### 2. `sanitizeMarkdown(markdown: string): string`

Sanitizes Markdown to prevent XSS attacks (defense-in-depth).

**Input**: Markdown string (user-generated)
**Output**: Sanitized Markdown string

**Sanitization Rules**:
- Strips `<script>` tags
- Strips `<iframe>` tags
- Sanitizes inline HTML
- Preserves safe Markdown syntax

**Note**: react-markdown already sanitizes, this is additional layer.

**Example**:
```typescript
const unsafe = '**Bold** <script>alert("xss")</script>';
const safe = sanitizeMarkdown(unsafe);
// Result: '**Bold** '
```

---

### 3. `truncateMarkdown(markdown: string, maxLength: number): string`

Truncates Markdown text while preserving formatting.

**Input**:
- `markdown`: Markdown string
- `maxLength`: Maximum character count

**Output**: Truncated Markdown with "..." if truncated

**Behavior**:
- Truncates at word boundary
- Preserves Markdown syntax validity
- Adds "..." if truncated

**Example**:
```typescript
const long = '**Bold text** that goes on and on...';
const short = truncateMarkdown(long, 20);
// Result: '**Bold text** that...'
```

---

### 4. `stripMarkdown(markdown: string): string`

Removes all Markdown formatting, returning plain text.

**Input**: Markdown string
**Output**: Plain text string

**Use Case**: Search indexing, preview generation

**Example**:
```typescript
const md = '**Bold** and *italic*';
const plain = stripMarkdown(md);
// Result: 'Bold and italic'
```

---

## Internal Helpers (Not Exported)

### `configureurndown(): TurndownService`

Configures turndown library with custom rules.

**Custom Rules**:
- Underline: `<u>` → `<u>text</u>` (HTML passthrough since Markdown lacks underline)
- Preserve newlines
- Strip classes/ids/styles

---

## Dependencies

- `turndown`: HTML to Markdown conversion
- `DOMPurify` (optional): Additional sanitization layer

**Installation**:
```bash
npm install turndown
npm install --save-dev @types/turndown
```

---

## Error Handling

All functions catch and log errors, returning safe fallback values:
- `htmlToMarkdown`: Returns empty string on fatal error
- `sanitizeMarkdown`: Returns empty string if sanitization fails
- `truncateMarkdown`: Returns original if truncation fails
- `stripMarkdown`: Returns original if stripping fails

---

## Performance

- **htmlToMarkdown**: <10ms for typical paste (1-5KB HTML)
- **sanitizeMarkdown**: <5ms for typical description
- **truncateMarkdown**: O(n) complexity, <1ms
- **stripMarkdown**: <5ms for typical description

---

## Testing Contract

### Unit Tests
- `htmlToMarkdown`:
  - Converts bold, italic, lists correctly
  - Strips unsupported tags
  - Handles nested tags
  - Handles malformed HTML gracefully

- `sanitizeMarkdown`:
  - Strips script tags
  - Strips iframe tags
  - Preserves safe Markdown

- `truncateMarkdown`:
  - Truncates at word boundary
  - Adds "..." when truncated
  - Preserves Markdown syntax
  - Doesn't truncate if under limit

- `stripMarkdown`:
  - Removes all formatting
  - Preserves text content
  - Handles nested formatting

### Integration Tests
- Works with MarkdownEditor paste events
- Works with MarkdownRenderer display

---

## Example Usage

```typescript
import {
  htmlToMarkdown,
  sanitizeMarkdown,
  truncateMarkdown,
  stripMarkdown
} from '../utils/markdown';

// Handle paste event
function handlePaste(e: ClipboardEvent) {
  const html = e.clipboardData.getData('text/html');
  if (html) {
    const markdown = htmlToMarkdown(html);
    insertContent(markdown);
  }
}

// Display preview
function JobPreview({ description }: { description: string }) {
  const preview = truncateMarkdown(description, 200);
  return <MarkdownRenderer content={preview} />;
}

// Search indexing
function indexJob(job: Job) {
  const plainText = stripMarkdown(job.description);
  searchIndex.add(job.id, plainText);
}
```

---

## Type Definitions

```typescript
export function htmlToMarkdown(html: string): string;
export function sanitizeMarkdown(markdown: string): string;
export function truncateMarkdown(markdown: string, maxLength: number): string;
export function stripMarkdown(markdown: string): string;
```
