# Implementation Plan: Rich Text Description Editor with Modal Viewer

**Branch**: `003-description-format-bold` | **Date**: 2025-10-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-description-format-bold/spec.md`

## Execution Flow (/plan command scope)
```
1. ✅ Load feature spec from Input path
2. ✅ Fill Technical Context
   → Project Type: web (frontend + backend)
   → React 18 + TypeScript + Express
3. ✅ Fill Constitution Check
   → No formal constitution - using general best practices
4. ✅ Evaluate Constitution Check
   → No violations
5. ✅ Execute Phase 0 → research.md
6. ✅ Execute Phase 1 → contracts, data-model.md, quickstart.md
7. ✅ Re-evaluate Constitution Check
   → No new violations
8. ✅ Plan Phase 2 → Task generation approach described
9. ✅ STOP - Ready for /tasks command
```

## Summary

Add rich text formatting support to job descriptions using Markdown storage, replace hover-scroll preview with click-to-open modal viewer. Users can format descriptions with bold, italic, underline, lists, links, and headings during add/edit operations. Modal provides better UX with background scroll lock, larger size, and cleaner presentation matching page style.

**Technical Approach**:
- Frontend: Markdown editor component (edit mode) + Markdown renderer (view mode)
- Backend: Store/retrieve Markdown strings in existing `description` field
- Modal: React component with scroll lock and keyboard/click handlers

## Technical Context

**Language/Version**: TypeScript 5.0+ (Frontend & Backend)
**Primary Dependencies**:
- Frontend: React 18, Vite 5, Markdown editor library (TBD in research)
- Backend: Express 4, PostgreSQL/SQL.js (existing)
**Storage**: PostgreSQL (production) + SQL.js fallback (existing database layer)
**Testing**: Jest (existing setup)
**Target Platform**: Web browsers (modern Chrome, Firefox, Safari, Edge)
**Project Type**: web (frontend + backend monorepo structure)
**Performance Goals**:
- Editor: <50ms keystroke latency
- Modal open/close: <100ms animation
- Markdown render: <200ms for typical descriptions (1-2KB)
**Constraints**:
- Must work with existing Job model (backward compatible with plain text)
- No new database migrations unless absolutely necessary
- Must support existing inline CSS-in-JS styling approach
**Scale/Scope**:
- Typical description length: 100-1000 words
- Max description length: 10,000 characters
- Expected concurrent users: <100

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS

No formal project constitution exists. Applying general best practices:

### General Principles Applied
- **Backward Compatibility**: Existing plain text descriptions must continue to work
- **Minimal Dependencies**: Prefer lightweight libraries over feature-rich heavy frameworks
- **Type Safety**: All TypeScript interfaces properly defined
- **Testing**: Unit tests for Markdown conversion, integration tests for editor/modal
- **Performance**: No blocking operations during typing or scrolling

### Post-Phase 1 Re-evaluation
- ✅ No new architectural violations introduced
- ✅ Design maintains backward compatibility with existing Job schema
- ✅ Markdown storage approach is simple and maintainable

## Project Structure

### Documentation (this feature)
```
specs/003-description-format-bold/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── editor.contract.md
│   ├── modal.contract.md
│   └── markdown.contract.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
platform/core/src/
├── backend/
│   ├── api/
│   │   └── jobs.ts                    # [MODIFY] No changes needed
│   └── database/
│       ├── postgresql-service.ts      # [MODIFY] No changes (description already string)
│       └── sqlite-service.ts          # [MODIFY] No changes (description already string)
│
├── frontend/
│   ├── components/
│   │   ├── MarkdownEditor.tsx         # [NEW] Rich text editor component
│   │   ├── MarkdownRenderer.tsx       # [NEW] Markdown display component
│   │   └── DescriptionModal.tsx       # [NEW] Modal dialog for viewing descriptions
│   │
│   ├── pages/
│   │   └── JobDashboard.tsx           # [MODIFY] Integrate editor + modal
│   │
│   ├── utils/
│   │   └── markdown.ts                # [NEW] Markdown conversion utilities
│   │
│   └── types.ts                       # [MODIFY] Add modal-related types if needed
│
└── shared/
    └── types/
        └── job.ts                     # [NO CHANGE] Description already string type
```

### Testing
```
platform/core/src/
└── __tests__/
    ├── components/
    │   ├── MarkdownEditor.test.tsx     # [NEW] Editor component tests
    │   ├── MarkdownRenderer.test.tsx   # [NEW] Renderer component tests
    │   └── DescriptionModal.test.tsx   # [NEW] Modal component tests
    │
    └── utils/
        └── markdown.test.ts            # [NEW] Markdown utility tests
```

## Phase 0: Research (✅ Completed)

**Output**: `research.md` ([view](./research.md))

Key findings:
- Markdown editor libraries evaluated (react-md-editor, react-simplemde-editor, @uiw/react-md-editor)
- Markdown parser libraries compared (marked, markdown-it, react-markdown)
- Modal implementation patterns assessed (portal-based vs inline)
- Scroll lock techniques documented
- Paste handling strategies researched

## Phase 1: Design & Contracts (✅ Completed)

**Artifacts**:
- `data-model.md` ([view](./data-model.md)) - Data structures and storage format
- `contracts/` - Component contracts and interfaces
- `quickstart.md` ([view](./quickstart.md)) - Setup and testing guide

**Key Decisions**:
1. **Markdown Editor**: Use @uiw/react-md-editor (lightweight, TypeScript support)
2. **Markdown Parser**: Use react-markdown (security, extensibility)
3. **Modal Pattern**: Portal-based with React.createPortal
4. **Scroll Lock**: CSS `overflow: hidden` on body + position preservation
5. **Storage**: No schema changes - description field already accepts strings

**Component Contracts**:
- MarkdownEditor: Edit interface with toolbar and preview
- MarkdownRenderer: Read-only display with styling
- DescriptionModal: Full-screen overlay with scroll management

## Phase 2: Task Generation (Planned for /tasks command)

**Approach**:
1. **Setup Tasks**: Install dependencies, create file structure
2. **Component Development**: Build editor, renderer, modal in isolation
3. **Integration Tasks**: Wire components into JobDashboard
4. **Testing Tasks**: Unit tests, integration tests, manual testing
5. **Refinement Tasks**: Polish styling, keyboard shortcuts, accessibility

**Task Ordering**:
- Bottom-up: Utilities → Components → Integration
- Parallel where possible: Editor and Modal can be developed simultaneously
- Test-driven: Write component tests before implementation

**Estimated Complexity**:
- Total: ~8-12 hours
- Phase breakdown:
  - Setup & utilities: 1-2 hours
  - Components: 4-6 hours
  - Integration: 2-3 hours
  - Testing & polish: 1-2 hours

## Complexity Tracking

### Additions
- 3 new React components (~400 LOC total)
- 1 utility module (~100 LOC)
- 1 new npm dependency (@uiw/react-md-editor + react-markdown)

### Modifications
- JobDashboard.tsx: Replace textarea with MarkdownEditor, add modal trigger

### Justifications
- **New Dependency**: Markdown editor requires specialized library (reinventing would be 10x effort)
- **Modal Component**: Reusable pattern for future features
- **Utilities Module**: Centralizes Markdown conversion logic for consistency

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Library bundle size | Medium | Choose lightweight options, lazy load editor |
| Backward compatibility | High | Test with existing plain text data, graceful handling |
| XSS via Markdown | High | Use react-markdown with sanitization enabled |
| Mobile UX issues | Medium | Responsive modal, touch-friendly editor |

## Progress Tracking

- [x] Initial Constitution Check
- [x] Phase 0: Research completed
- [x] Phase 1: Design artifacts generated
- [x] Phase 1: Contracts defined
- [x] Post-Design Constitution Check
- [ ] Phase 2: Tasks generated (awaiting /tasks command)
- [ ] Phase 3: Implementation
- [ ] Phase 4: Testing & refinement

---

**Status**: ✅ Ready for `/tasks` command

**Next Steps**: Run `/tasks` to generate detailed implementation tasks from this plan.
