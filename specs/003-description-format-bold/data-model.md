# Data Model: Rich Text Description Storage

**Feature**: Rich Text Description Editor with Modal Viewer
**Date**: 2025-10-03

## Overview

This feature adds rich text formatting to job descriptions WITHOUT requiring database schema changes. The existing `description` field (string type) will store Markdown-formatted text instead of plain text.

## Database Schema

### Current Schema (NO CHANGES)

```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  description TEXT,              -- ✅ Already supports any string (plain text or Markdown)
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- ... other fields
);
```

**Key Point**: The `description TEXT` field already accepts any string content. We're simply changing the content from plain text to Markdown-formatted text. No migration needed.

## Data Format

### Storage Format: Markdown

**Example Plain Text (Legacy)**:
```
Software Engineer position requiring:
- 5+ years experience
- Strong communication skills
- Bachelor's degree
```

**Example Markdown (New)**:
```markdown
## Software Engineer Position

**Requirements:**
- 5+ years experience
- Strong **communication** skills
- Bachelor's degree in *Computer Science* or related field

**Responsibilities:**
1. Design and implement features
2. Code reviews
3. Mentoring junior developers

[Company Website](https://example.com)
```

### Backward Compatibility

**Handling Legacy Data**:
- Plain text descriptions render correctly as Markdown (no special characters)
- Example: "Hello world" renders as "Hello world" in both plain text and Markdown

**Migration Strategy**:
- ✅ **No migration required** - Plain text is valid Markdown
- Existing descriptions work without changes
- New descriptions use Markdown formatting
- Users can add formatting to legacy descriptions by editing them

## TypeScript Types

### Frontend Types (`platform/core/src/frontend/types.ts`)

```typescript
// NO CHANGES NEEDED - description is already string type

interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;           // ✅ Already string (plain text or Markdown)
  status: JobStatus;
  created_at: string;
  updated_at: string;
  // ... other fields
}
```

### Component Types

```typescript
// MarkdownEditor props
interface MarkdownEditorProps {
  value: string;                  // Markdown content
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

// MarkdownRenderer props
interface MarkdownRendererProps {
  content: string;                // Markdown content
  className?: string;
}

// DescriptionModal props
interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;            // Markdown content
  jobTitle?: string;
}
```

## Data Flow

### Write Path (Add/Edit Job)

```
User types in MarkdownEditor
       ↓
MarkdownEditor component (value: string)
       ↓
JobDashboard state (description: string)
       ↓
API POST/PUT /api/jobs
       ↓
Backend (Express)
       ↓
Database (PostgreSQL/SQL.js)
       ↓
jobs.description TEXT field
```

**Data Format at Each Step**: Markdown string

**Example**:
```
"**Bold** text" → "**Bold** text" → "**Bold** text" → stored as "**Bold** text"
```

### Read Path (View Job)

```
Database (PostgreSQL/SQL.js)
       ↓
Backend (Express)
       ↓
API GET /api/jobs
       ↓
Frontend (JobDashboard)
       ↓
MarkdownRenderer component
       ↓
react-markdown library
       ↓
Rendered HTML (sanitized)
```

**Data Format**:
- Storage: `"**Bold** text"`
- Rendered: `<strong>Bold</strong> text`

### Modal View Path

```
User clicks description
       ↓
DescriptionModal opens
       ↓
MarkdownRenderer displays content
       ↓
User sees formatted text
```

## Validation

### Frontend Validation

```typescript
function validateDescription(description: string): string[] {
  const errors: string[] = [];

  // Max length check
  if (description.length > 10000) {
    errors.push('Description must be less than 10,000 characters');
  }

  // Optional: Check for potentially unsafe content
  if (description.includes('<script>')) {
    errors.push('Invalid content detected');
  }

  return errors;
}
```

### Backend Validation

```typescript
// In jobs.ts API route
router.post('/api/jobs', (req, res) => {
  const { description } = req.body;

  // Length validation
  if (description && description.length > 10000) {
    return res.status(400).json({ error: 'Description too long' });
  }

  // No other validation needed - store as-is
  // ...
});
```

## Security Considerations

### XSS Protection

**Problem**: User-generated Markdown could contain malicious HTML

**Solution**: react-markdown sanitizes output by default

**Example Attack Attempt**:
```markdown
**Bold** <script>alert('xss')</script>
```

**Rendered Output** (Safe):
```html
<strong>Bold</strong> &lt;script&gt;alert('xss')&lt;/script&gt;
```

**Additional Protection**:
- `remark-gfm` plugin only allows safe GitHub-Flavored Markdown
- No `dangerouslySetInnerHTML` used anywhere
- Optional: Additional sanitization in `markdown.ts` utils

### SQL Injection Protection

**Already Handled**: Existing parameterized queries prevent SQL injection

**Example** (PostgreSQL):
```typescript
await client.query(
  'UPDATE jobs SET description = $1 WHERE id = $2',
  [description, jobId]  // ✅ Parameterized - safe
);
```

## Performance Characteristics

### Storage

| Metric | Value |
|--------|-------|
| Plain Text Example | 100 bytes |
| Markdown Example | 150 bytes |
| Overhead | ~50% increase |
| Impact | Negligible (descriptions are small) |

### Rendering

| Operation | Time |
|-----------|------|
| Parse Markdown (500 words) | <50ms |
| Parse Markdown (5000 words) | <200ms |
| Render to HTML | Immediate (React) |

### Indexing

**Search Compatibility**:
- Full-text search works on Markdown strings
- Formatting syntax (**, *, etc.) indexed as-is
- Consider `stripMarkdown()` utility for cleaner search indexing

## Migration Plan

### Phase 1: Deploy (No Migration Needed)

✅ **No database migration required**

**Steps**:
1. Deploy new frontend components
2. Deploy backend (no changes needed)
3. Existing data works immediately

### Phase 2: Gradual Enhancement

**Users can**:
- Edit existing jobs to add formatting
- Create new jobs with formatting
- Mix formatted and plain text jobs

**No forced migration** - Legacy data remains valid

### Phase 3: Optional Cleanup (Future)

If desired, could add utility to detect/upgrade plain text descriptions:

```typescript
function detectAndUpgradePlainText(description: string): string {
  // Detect if description is plain text (no Markdown syntax)
  const hasMarkdown = /[*#\[\]_]/.test(description);

  if (!hasMarkdown) {
    // Optionally preserve newlines, add basic formatting
    return description; // Or enhance minimally
  }

  return description; // Already Markdown
}
```

**Decision**: Not implementing this initially - let users upgrade manually

## Example Data Samples

### Sample 1: Basic Formatting
```markdown
**Senior Software Engineer** at TechCorp

Responsibilities:
- Lead development team
- Architect solutions
- *Mentor* junior developers

Requirements: 5+ years experience in **JavaScript**
```

### Sample 2: Rich Formatting
```markdown
# Full-Stack Developer

## About the Role
We're seeking a talented developer to join our team!

### Required Skills
1. **Frontend**: React, TypeScript
2. **Backend**: Node.js, PostgreSQL
3. **DevOps**: Docker, AWS

### Benefits
- Competitive salary
- Remote work options
- [Health insurance](https://example.com/benefits)

*Apply now!*
```

### Sample 3: Legacy Plain Text (Still Valid)
```
Software Engineer
Must have 5 years experience
Good communication skills
Apply at jobs@example.com
```

---

**Conclusion**: No database changes needed. Markdown storage is backward-compatible with existing plain text descriptions. Simple, clean, maintainable approach.
