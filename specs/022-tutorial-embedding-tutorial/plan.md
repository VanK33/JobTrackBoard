# Implementation Plan: Video Tutorial Embedding in Tutorial Popup

**Branch**: `022-tutorial-embedding-tutorial` | **Date**: 2025-10-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-tutorial-embedding-tutorial/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   ✓ Loaded and analyzed
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   ✓ All clarifications resolved in spec
   ✓ Project Type: Web application (React frontend + Express backend)
   ✓ Structure Decision: Monorepo with platform/core structure
3. Fill the Constitution Check section
   ✓ Constitution file is template - no specific project rules identified
4. Evaluate Constitution Check section
   ✓ No constitutional violations - using existing patterns
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   ✓ Technical decisions documented
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   ✓ Design artifacts created
7. Re-evaluate Constitution Check section
   ✓ No violations introduced
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Task generation approach described
9. STOP - Ready for /tasks command
```

## Summary

Replace the current image-based tutorial carousel with video embedding support. The tutorial popup will accept external video URLs (YouTube, Vimeo, or direct video URLs) and display them with full playback controls. Videos will not auto-play and will always start from the beginning (no position tracking). Error handling includes retry functionality for failed video loads.

**Key Changes**:
- Extend `TutorialStep` interface to support `videoUrl` field
- Update `TutorialModal` component to render video player when `videoUrl` is present
- Implement video player component with iframe embedding for YouTube/Vimeo and HTML5 video for direct URLs
- Add error handling with retry button for failed video loads
- Maintain backward compatibility with existing image-based steps

## Technical Context

**Language/Version**: TypeScript 5.0+ (React 18, Node.js 18+)
**Primary Dependencies**: React 18, Vite 5, Express.js (existing)
**Storage**: Browser localStorage for tutorial state (existing pattern)
**Testing**: React Testing Library (frontend), manual integration testing
**Target Platform**: Modern web browsers with video support
**Project Type**: Web application (monorepo with frontend/backend separation)
**Performance Goals**: Video load time <3s on broadband, responsive UI
**Constraints**: External video hosting only, no server-side storage, must work with existing session-based architecture
**Scale/Scope**: Single tutorial popup with 5 steps (existing), optional video per step

## Constitution Check

*Constitution file is a template placeholder. Following existing project patterns:*

### Existing Project Patterns (from CLAUDE.md)
- ✅ **Modular Organization**: Changes isolated to tutorial-related files
- ✅ **TypeScript Strict Mode**: All new code will use explicit types
- ✅ **Inline Styles**: Consistent with existing TutorialModal pattern
- ✅ **No External Dependencies**: Using native HTML5 video and iframe APIs
- ✅ **Backward Compatible**: Existing image-based tutorials continue to work

### Design Principles Applied
- **Separation of Concerns**: Video player as separate component
- **Error Handling**: Graceful degradation with retry mechanism
- **Accessibility**: Proper ARIA labels and keyboard support
- **Type Safety**: Strong typing for all interfaces and props

**Gate Status**: PASS - No constitutional violations, follows established patterns

## Project Structure

### Documentation (this feature)
```
specs/022-tutorial-embedding-tutorial/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── TutorialStep.interface.ts
│   ├── VideoPlayer.interface.ts
│   └── VideoEmbedder.interface.ts
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)
```
platform/core/src/
├── frontend/
│   ├── components/
│   │   ├── TutorialModal.tsx           # [MODIFY] Add video support
│   │   ├── VideoPlayer.tsx             # [NEW] Video player component
│   │   └── VideoEmbedder.tsx           # [NEW] URL type detector & embedder
│   ├── utils/
│   │   ├── tutorialData.ts             # [MODIFY] Add videoUrl to steps
│   │   └── videoUrlParser.ts           # [NEW] Parse and validate video URLs
│   └── hooks/
│       └── useTutorialState.ts         # [NO CHANGE] Existing state management
└── backend/
    └── (no backend changes required)

tests/
└── frontend/
    ├── VideoPlayer.test.tsx            # [NEW] Unit tests
    ├── VideoEmbedder.test.tsx          # [NEW] Unit tests
    ├── videoUrlParser.test.ts          # [NEW] Unit tests
    └── TutorialModal.integration.test.tsx  # [NEW] Integration test
```

**Structure Decision**: Web application with frontend-only changes. Using existing platform/core/src/frontend structure. No backend changes required since video URLs are stored in frontend data files (tutorialData.ts) and no server-side processing is needed.

## Phase 0: Outline & Research

**Research Complete** - See [research.md](./research.md)

### Key Technical Decisions

1. **Video Embedding Approach**
   - **Decision**: Hybrid approach - iframe for YouTube/Vimeo, HTML5 `<video>` for direct URLs
   - **Rationale**:
     - YouTube/Vimeo provide embed APIs with built-in controls
     - Direct URLs need HTML5 video element
     - Allows full control support (FR-004) without custom player library
   - **Alternatives Considered**:
     - Single unified video.js library (rejected: adds 200KB+ dependency)
     - Only iframe embedding (rejected: doesn't support direct MP4/WebM URLs)

2. **URL Detection Strategy**
   - **Decision**: Regex pattern matching for YouTube/Vimeo, fallback to direct URL
   - **Rationale**:
     - YouTube/Vimeo have predictable URL patterns
     - Enables proper iframe parameter configuration
     - Simple, no external libraries needed
   - **Patterns**:
     - YouTube: `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`
     - Vimeo: `vimeo.com/ID`, `player.vimeo.com/video/ID`

3. **Error Handling Pattern**
   - **Decision**: React error boundary + component-level error state
   - **Rationale**:
     - Iframe errors caught via `onerror` event
     - HTML5 video errors via `error` event
     - Retry button triggers component remount with key change
   - **Implementation**: Error state + conditional rendering

4. **Backward Compatibility**
   - **Decision**: Optional `videoUrl` field in `TutorialStep` interface
   - **Rationale**:
     - Existing image-based steps continue to work
     - Gradual migration possible
     - No breaking changes to existing data
   - **Pattern**: `videoUrl ? <VideoPlayer /> : <img />`

5. **Control Requirements (FR-004)**
   - **YouTube/Vimeo**: Use embed parameters to enable all controls
     - `controls=1` - show controls
     - `modestbranding=1` - minimal branding
     - `rel=0` - no related videos
   - **Direct URLs**: HTML5 video with `controls` attribute provides:
     - Play/pause, seek, volume, fullscreen (built-in)
     - Playback speed via browser context menu (Chrome/Firefox native)

## Phase 1: Design & Contracts

**Design Complete** - See artifacts:
- [data-model.md](./data-model.md) - Data structures
- [contracts/](./contracts/) - TypeScript interfaces
- [quickstart.md](./quickstart.md) - Testing guide

### Key Components

1. **VideoPlayer Component**
   - Props: `videoUrl`, `onError`, `onRetry`
   - Delegates to VideoEmbedder based on URL type
   - Manages error state and retry UI
   - Enforces no-autoplay (FR-009) via iframe parameters

2. **VideoEmbedder Component**
   - Props: `url`, `type` (youtube|vimeo|direct), `onError`
   - Renders appropriate element (iframe vs video)
   - Configures controls and parameters
   - Handles load errors

3. **videoUrlParser Utility**
   - Functions: `detectVideoType()`, `buildYouTubeEmbedUrl()`, `buildVimeoEmbedUrl()`, `validateVideoUrl()`
   - Returns: `{ type: 'youtube' | 'vimeo' | 'direct' | null, embedUrl: string }`

### Updated Data Model

```typescript
interface TutorialStep {
  stepNumber: number;
  title: string;
  imageSrc: string;        // Still used as fallback
  description: string;
  videoUrl?: string;       // NEW: Optional video URL
}
```

### API Contracts

**Frontend Only** - No backend API changes required. Video URLs are static data in `tutorialData.ts`.

### Testing Strategy

1. **Unit Tests**:
   - `videoUrlParser` - URL detection and validation
   - `VideoEmbedder` - Rendering logic for each type
   - `VideoPlayer` - Error handling and retry logic

2. **Integration Tests**:
   - `TutorialModal` - Video display in carousel context
   - Step navigation with video content
   - Error scenarios with retry flow

3. **Manual Testing** (quickstart.md):
   - YouTube embed with all controls
   - Vimeo embed with all controls
   - Direct MP4 URL playback
   - Error state with retry
   - Mobile responsiveness

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - NOT executed during /plan*

**Task Generation Strategy**:

1. **Phase 1: Foundation** (Tests first, TDD)
   - Create interface files from contracts/ (3 tasks)
   - Write unit tests for each new component (3 tasks)
   - Tests should FAIL (no implementation yet)

2. **Phase 2: Core Implementation**
   - Implement videoUrlParser utility (1 task)
   - Implement VideoEmbedder component (1 task)
   - Implement VideoPlayer component (1 task)
   - Update TutorialStep interface (1 task)

3. **Phase 3: Integration**
   - Update TutorialModal to support video (1 task)
   - Update tutorialData.ts with example video URL (1 task)
   - Write integration tests (1 task)

4. **Phase 4: Polish**
   - Add loading states for video (1 task)
   - Responsive design adjustments (1 task)
   - Documentation and comments (1 task)

**Ordering Strategy**:
- TDD order: Interfaces → Tests → Implementation
- Dependency order: Utilities → Components → Integration
- Mark [P] for parallel-safe tasks (tests, independent components)

**Estimated Output**: 15-18 numbered, dependency-ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD)
**Phase 5**: Validation (run tests, manual testing via quickstart.md)

## Complexity Tracking

*No constitutional violations or complexity deviations identified*

This implementation follows established patterns:
- Existing component structure (TutorialModal pattern)
- Existing styling approach (inline CSS-in-JS)
- Existing state management (React hooks)
- No new external dependencies
- Frontend-only changes (no backend complexity)

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach described (/plan command)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Following job_seek_app patterns - See `/CLAUDE.md` and `/platform/core/README.md`*
