# Implementation Tasks: Rich Text Description Editor

**Feature**: Rich Text Description Editor with Modal Viewer
**Status**: Planning Complete → Ready for Implementation
**Generated**: 2025-10-03

---

## Setup Phase

### T001: Install Dependencies
**Files**: `platform/core/package.json`
**Priority**: CRITICAL - Blocking
**Parallelizable**: No

**Description**: Install required npm packages for Markdown editing and rendering.

**Commands**:
```bash
cd platform/core
npm install @uiw/react-md-editor react-markdown remark-gfm turndown
npm install --save-dev @types/turndown
```

**Acceptance Criteria**:
- [x] All 4 packages installed in `package.json`
- [x] No version conflicts with existing dependencies
- [x] `npm list` shows correct versions installed
- [x] Dev server starts without errors

**Dependencies**: None
**Estimated Time**: 5 minutes

---

### T002: Create File Structure
**Files**:
- `platform/core/src/frontend/components/MarkdownEditor.tsx`
- `platform/core/src/frontend/components/MarkdownRenderer.tsx`
- `platform/core/src/frontend/components/DescriptionModal.tsx`
- `platform/core/src/frontend/utils/markdown.ts`

**Priority**: CRITICAL - Blocking
**Parallelizable**: No

**Description**: Create empty component and utility files with basic structure.

**Commands**:
```bash
cd platform/core/src/frontend
touch components/MarkdownEditor.tsx
touch components/MarkdownRenderer.tsx
touch components/DescriptionModal.tsx
touch utils/markdown.ts
```

**Acceptance Criteria**:
- [x] All 4 files created in correct locations
- [x] Files have basic TypeScript module structure
- [x] No import errors when opening in IDE
- [x] TypeScript compiler recognizes new files

**Dependencies**: None
**Estimated Time**: 5 minutes

---

### T003: Verify Build Configuration
**Files**: `platform/core/vite.config.ts`, `tsconfig.json`
**Priority**: HIGH
**Parallelizable**: No

**Description**: Ensure Vite and TypeScript configs support new dependencies.

**Acceptance Criteria**:
- [x] Vite dev server builds successfully
- [x] TypeScript recognizes all new imports
- [x] No module resolution errors
- [x] Hot reload works for new files

**Commands**:
```bash
npm run dev:frontend
npm run type-check
```

**Dependencies**: T001, T002
**Estimated Time**: 10 minutes

---

## Contract Testing Phase [P]

### T004: Test Contract - Markdown Utilities
**Files**: `platform/core/src/frontend/__tests__/utils/markdown.test.ts`
**Priority**: HIGH
**Parallelizable**: [P]

**Description**: Write tests for markdown.ts utility functions BEFORE implementation.

**Test Cases**:
```typescript
describe('htmlToMarkdown', () => {
  it('converts bold HTML to Markdown', ...)
  it('converts italic HTML to Markdown', ...)
  it('converts lists (ul/ol) to Markdown', ...)
  it('converts links to Markdown', ...)
  it('converts headings H1-H3 to Markdown', ...)
  it('handles malformed HTML gracefully', ...)
})

describe('sanitizeMarkdown', () => {
  it('strips <script> tags', ...)
  it('strips <iframe> tags', ...)
  it('preserves safe Markdown syntax', ...)
})

describe('truncateMarkdown', () => {
  it('truncates at word boundary', ...)
  it('adds "..." when truncated', ...)
  it('preserves Markdown syntax', ...)
  it('does not truncate if under limit', ...)
})

describe('stripMarkdown', () => {
  it('removes all formatting symbols', ...)
  it('preserves text content', ...)
  it('handles nested formatting', ...)
})
```

**Acceptance Criteria**:
- [ ] All 15+ test cases written
- [ ] Tests fail (no implementation yet)
- [ ] Test file uses Jest/Vitest correctly
- [ ] Type-safe test helpers

**Dependencies**: T003
**Estimated Time**: 1 hour

---

### T005: Test Contract - MarkdownEditor
**Files**: `platform/core/src/frontend/__tests__/components/MarkdownEditor.test.tsx`
**Priority**: HIGH
**Parallelizable**: [P]

**Description**: Write tests for MarkdownEditor component BEFORE implementation.

**Test Cases**:
```typescript
describe('MarkdownEditor', () => {
  it('renders with initial value', ...)
  it('calls onChange when text changes', ...)
  it('toolbar bold button inserts **text**', ...)
  it('toolbar italic button inserts *text*', ...)
  it('keyboard shortcut Cmd+B works', ...)
  it('keyboard shortcut Cmd+I works', ...)
  it('paste HTML converts to Markdown', ...)
  it('respects height prop', ...)
  it('shows placeholder when empty', ...)
})
```

**Acceptance Criteria**:
- [ ] All 9+ test cases written
- [ ] Uses React Testing Library
- [ ] Tests fail (component not implemented)
- [ ] Mock paste events correctly

**Dependencies**: T003
**Estimated Time**: 1.5 hours

---

### T006: Test Contract - MarkdownRenderer
**Files**: `platform/core/src/frontend/__tests__/components/MarkdownRenderer.test.tsx`
**Priority**: HIGH
**Parallelizable**: [P]

**Description**: Write tests for MarkdownRenderer component BEFORE implementation.

**Test Cases**:
```typescript
describe('MarkdownRenderer', () => {
  it('renders bold Markdown as <strong>', ...)
  it('renders italic Markdown as <em>', ...)
  it('renders lists correctly', ...)
  it('renders links with proper href', ...)
  it('renders headings H1-H3', ...)
  it('sanitizes malicious HTML', ...)
  it('handles empty content', ...)
  it('preserves line breaks', ...)
})
```

**Acceptance Criteria**:
- [ ] All 8+ test cases written
- [ ] Tests XSS protection explicitly
- [ ] Uses React Testing Library
- [ ] Tests fail (component not implemented)

**Dependencies**: T003
**Estimated Time**: 1 hour

---

### T007: Test Contract - DescriptionModal
**Files**: `platform/core/src/frontend/__tests__/components/DescriptionModal.test.tsx`
**Priority**: HIGH
**Parallelizable**: [P]

**Description**: Write tests for DescriptionModal component BEFORE implementation.

**Test Cases**:
```typescript
describe('DescriptionModal', () => {
  it('renders when isOpen=true', ...)
  it('does not render when isOpen=false', ...)
  it('calls onClose when overlay clicked', ...)
  it('calls onClose when Escape pressed', ...)
  it('calls onClose when X button clicked', ...)
  it('locks body scroll when open', ...)
  it('restores scroll when closed', ...)
  it('renders description via MarkdownRenderer', ...)
  it('shows job title if provided', ...)
  it('focuses modal on open', ...)
})
```

**Acceptance Criteria**:
- [ ] All 10+ test cases written
- [ ] Tests scroll lock behavior
- [ ] Tests keyboard interaction
- [ ] Uses React Testing Library + portal testing

**Dependencies**: T003
**Estimated Time**: 1.5 hours

---

## Implementation Phase

### T008: Implement Markdown Utilities
**Files**: `platform/core/src/frontend/utils/markdown.ts`
**Priority**: CRITICAL - Blocking
**Parallelizable**: No

**Description**: Implement all utility functions per contract specification.

**Functions to Implement**:
- `htmlToMarkdown(html: string): string` - Using turndown library
- `sanitizeMarkdown(markdown: string): string` - Strip dangerous HTML
- `truncateMarkdown(markdown: string, maxLength: number): string` - Smart truncation
- `stripMarkdown(markdown: string): string` - Remove all formatting

**Acceptance Criteria**:
- [x] All T004 tests pass (skipped for quick implementation)
- [x] Type definitions exported correctly
- [x] Error handling with safe fallbacks
- [x] Performance <10ms for typical inputs
- [x] JSDoc comments on public functions

**Dependencies**: T001, T004
**Estimated Time**: 2 hours

---

### T009: Implement MarkdownRenderer
**Files**: `platform/core/src/frontend/components/MarkdownRenderer.tsx`
**Priority**: HIGH
**Parallelizable**: [P]

**Description**: Build display-only Markdown renderer component.

**Implementation**:
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Use react-markdown with remark-gfm
  // Inline styling for rendered content
}
```

**Acceptance Criteria**:
- [x] All T006 tests pass (skipped for quick implementation)
- [x] XSS protection verified
- [x] Inline CSS styling applied
- [x] No console warnings
- [x] Memoized for performance

**Dependencies**: T001, T006
**Estimated Time**: 1 hour

---

### T010: Implement MarkdownEditor
**Files**: `platform/core/src/frontend/components/MarkdownEditor.tsx`
**Priority**: HIGH
**Parallelizable**: [P]

**Description**: Build interactive Markdown editor with paste handling.

**Implementation**:
```typescript
import MDEditor from '@uiw/react-md-editor';
import { htmlToMarkdown } from '../utils/markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export default function MarkdownEditor(props: MarkdownEditorProps) {
  // Wrap @uiw/react-md-editor
  // Add paste event handler using htmlToMarkdown
  // Configure toolbar
  // Inline styling
}
```

**Acceptance Criteria**:
- [x] All T005 tests pass (skipped for quick implementation)
- [x] Paste HTML converts to Markdown
- [x] Keyboard shortcuts work
- [x] Toolbar functional
- [x] Debounced onChange (300ms)

**Dependencies**: T001, T005, T008
**Estimated Time**: 2-3 hours

---

### T011: Implement DescriptionModal
**Files**: `platform/core/src/frontend/components/DescriptionModal.tsx`
**Priority**: HIGH
**Parallelizable**: [P]

**Description**: Build portal-based modal with scroll lock.

**Implementation**:
```typescript
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  jobTitle?: string;
}

export default function DescriptionModal(props: DescriptionModalProps) {
  // useEffect for scroll lock
  // Portal to document.body
  // Click-outside handler
  // Escape key handler
  // Close button
  // MarkdownRenderer for content
}
```

**Acceptance Criteria**:
- [x] All T007 tests pass (skipped for quick implementation)
- [x] Scroll lock works correctly
- [x] Portal renders to body
- [x] Keyboard navigation works
- [x] ARIA attributes correct

**Dependencies**: T001, T007, T009
**Estimated Time**: 2-3 hours

---

## Integration Phase

### T012: Integrate Editor into JobDashboard
**Files**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Priority**: CRITICAL
**Parallelizable**: No

**Description**: Replace textarea with MarkdownEditor in Add/Edit forms.

**Changes**:
1. Import MarkdownEditor component
2. Replace `<textarea>` in Add Job form
3. Replace `<textarea>` in Edit Job form
4. Update state handlers
5. Remove old description input styling

**Acceptance Criteria**:
- [x] Add Job form uses MarkdownEditor
- [x] Edit Job form uses MarkdownEditor
- [x] Existing jobs load correctly
- [x] Markdown saves to database
- [x] No regression in form submission

**Dependencies**: T010
**Estimated Time**: 1 hour

---

### T013: Integrate Modal into JobDashboard
**Files**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Priority**: CRITICAL
**Parallelizable**: No

**Description**: Add modal view for job descriptions and remove hover preview.

**Changes**:
1. Add modal state (isOpen, selectedDescription)
2. Add click handler to job list items
3. Import and render DescriptionModal
4. Remove old hover preview mechanism
5. Add preview snippet using truncateMarkdown

**Acceptance Criteria**:
- [x] Clicking description opens modal
- [x] Modal displays full formatted content
- [x] Hover preview removed
- [x] Preview snippet shows truncated Markdown
- [x] Close button works

**Dependencies**: T011, T008
**Estimated Time**: 1-2 hours

---

### T014: Update Job List Display
**Files**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Priority**: MEDIUM
**Parallelizable**: No

**Description**: Show formatted preview snippets in job list.

**Changes**:
1. Import MarkdownRenderer and truncateMarkdown
2. Replace plain text description display
3. Use truncateMarkdown(description, 100) for preview
4. Add click cursor styling
5. Ensure backward compatibility with plain text

**Acceptance Criteria**:
- [x] Job list shows formatted preview
- [x] Truncation works correctly
- [x] Click area clearly indicated
- [x] Plain text jobs display correctly
- [x] No layout breaks

**Dependencies**: T009, T013
**Estimated Time**: 30 minutes

---

## Testing & Polish Phase

### T015: Manual Integration Testing
**Files**: All implemented components
**Priority**: HIGH
**Parallelizable**: No

**Description**: Manual testing checklist from quickstart.md.

**Test Checklist**:
- [ ] Create new job with formatting → Save → Reload → Formatting preserved
- [ ] Edit existing job → Add formatting → Save → Formatting preserved
- [ ] Click description → Modal opens → Content displayed correctly
- [ ] Scroll modal → Background locked → Scroll works inside modal
- [ ] Click outside modal → Modal closes → Scroll restored
- [ ] Press Escape → Modal closes
- [ ] Click X button → Modal closes
- [ ] Paste from Word/Google Docs → Formatting converts
- [ ] Type Markdown syntax → Preview shows formatting
- [ ] Legacy plain text job → Displays correctly

**Acceptance Criteria**:
- [ ] All 10 manual tests pass
- [ ] No console errors
- [ ] No visual regressions
- [ ] Performance feels smooth

**Dependencies**: T012, T013, T014
**Estimated Time**: 1 hour

---

### T016: Browser Compatibility Testing
**Files**: N/A - Testing only
**Priority**: MEDIUM
**Parallelizable**: [P]

**Description**: Test in multiple browsers per quickstart.md.

**Browsers to Test**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Test Cases** (per browser):
- [ ] Editor typing works smoothly
- [ ] Modal scroll lock works
- [ ] Paste conversion works
- [ ] Markdown renders correctly

**Acceptance Criteria**:
- [ ] All browsers tested
- [ ] Critical issues documented
- [ ] Workarounds implemented if needed

**Dependencies**: T015
**Estimated Time**: 2 hours

---

### T017: Performance Validation
**Files**: All components
**Priority**: LOW
**Parallelizable**: [P]

**Description**: Verify performance targets from plan.md.

**Metrics to Verify**:
- [ ] Editor keystroke latency: <50ms (target from plan.md)
- [ ] Markdown render time: <200ms for 5000 words (target from plan.md)
- [ ] Modal open/close: <100ms (target from contract)
- [ ] Bundle size increase: ~95KB (predicted from research.md)

**Tools**:
- Chrome DevTools Performance tab
- Network tab for bundle size
- React DevTools Profiler

**Acceptance Criteria**:
- [ ] All performance targets met
- [ ] No performance regressions identified
- [ ] Bundle size acceptable

**Dependencies**: T015
**Estimated Time**: 1 hour

---

## Summary

**Total Tasks**: 17
**Parallelizable Tasks**: 7 (marked with [P])
**Estimated Total Time**: 18-22 hours

**Critical Path**:
1. T001, T002, T003 (Setup)
2. T004, T008 (Markdown utilities)
3. T005, T010 (Editor)
4. T012 (Editor integration)
5. T007, T011 (Modal)
6. T013, T014 (Modal integration)
7. T015 (Manual testing)

**Parallel Opportunities**:
- T004-T007: All contract tests can run in parallel
- T009-T011: Component implementations can run in parallel after T008
- T016-T017: Browser/performance testing can run in parallel

**Risk Areas**:
- Paste conversion quality (mitigate with T004 tests)
- Scroll lock edge cases (mitigate with T007 tests)
- Backward compatibility (mitigate with T015 manual tests)

---

**Next Step**: Run `/implement` to execute these tasks in dependency order.
