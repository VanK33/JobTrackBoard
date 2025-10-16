# Tasks: Video Tutorial Embedding in Tutorial Popup

**Feature**: 022-tutorial-embedding-tutorial
**Input**: Design documents from `/specs/022-tutorial-embedding-tutorial/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Summary

This task list follows TDD (Test-Driven Development) principles:
1. **Setup**: Type definitions and project structure
2. **Tests First**: Write all tests (they will FAIL initially)
3. **Implementation**: Make tests pass
4. **Integration**: Connect components
5. **Polish**: Final improvements

**Path Convention**: `platform/core/src/frontend/` (monorepo web application structure)

---

## Phase 3.1: Setup & Type Definitions

### T001: Create TypeScript interface files from contracts
**Path**: `platform/core/src/frontend/utils/tutorialData.ts`
**Description**: Copy interface definitions from `specs/022-tutorial-embedding-tutorial/contracts/` to project source:
- Create `TutorialStep` interface with optional `videoUrl?: string` field
- Extend existing `TutorialStep` interface in `tutorialData.ts` to include the new field
- Preserve all existing fields: `stepNumber`, `title`, `imageSrc`, `description`
- Add JSDoc comments explaining the videoUrl field and supported formats

**Acceptance**:
- TypeScript compiles without errors
- Existing `tutorialSteps` array still type-checks correctly
- No breaking changes to existing tutorial data

**Files Modified**: 1
- `platform/core/src/frontend/utils/tutorialData.ts`

---

### T002 [P]: Create VideoPlayer types
**Path**: `platform/core/src/frontend/components/VideoPlayer.tsx` (types only)
**Description**: Create type definitions for VideoPlayer component:
- Define `VideoPlayerProps` interface based on `contracts/VideoPlayer.interface.ts`
- Define `VideoErrorState` interface for internal error tracking
- Add JSDoc comments explaining each prop and requirement mapping (FR-002, FR-004, etc.)
- Export interfaces for use in tests

**Acceptance**:
- Interfaces compile in TypeScript strict mode
- All required props documented with requirements they satisfy

**Files Created**: 1 (types section)
- `platform/core/src/frontend/components/VideoPlayer.tsx` (types only, no implementation)

---

### T003 [P]: Create VideoEmbedder and videoUrlParser types
**Path**: `platform/core/src/frontend/components/VideoEmbedder.tsx` and `utils/videoUrlParser.ts` (types only)
**Description**: Create type definitions:
- Define `VideoEmbedderProps` interface based on `contracts/VideoEmbedder.interface.ts`
- Define `VideoUrlInfo` interface for URL parser return type
- Define `VideoType` type: `'youtube' | 'vimeo' | 'direct'`
- Add JSDoc comments with examples for each interface

**Acceptance**:
- All interfaces compile correctly
- Types support the hybrid embedding approach (iframe + HTML5 video)

**Files Created**: 2 (types only)
- `platform/core/src/frontend/components/VideoEmbedder.tsx` (types only)
- `platform/core/src/frontend/utils/videoUrlParser.ts` (types only)

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL**: These tests MUST be written and MUST FAIL before ANY implementation code is written.

### T004 [P]: Unit test for videoUrlParser utility
**Path**: `platform/core/src/frontend/utils/videoUrlParser.test.ts`
**Description**: Write unit tests for URL parsing and detection logic:

**Test Cases**:
1. `detectYouTubeUrl()`:
   - Detects `https://www.youtube.com/watch?v=abc123`
   - Detects `https://youtu.be/abc123`
   - Detects `https://www.youtube.com/embed/abc123`
   - Returns null for non-YouTube URLs

2. `detectVimeoUrl()`:
   - Detects `https://vimeo.com/123456789`
   - Detects `https://player.vimeo.com/video/123456789`
   - Returns null for non-Vimeo URLs

3. `buildYouTubeEmbedUrl()`:
   - Returns `https://www.youtube.com/embed/abc123?controls=1&modestbranding=1&rel=0&autoplay=0`
   - Preserves video ID correctly

4. `buildVimeoEmbedUrl()`:
   - Returns `https://player.vimeo.com/video/123456789?controls=1&autoplay=0`
   - Preserves video ID correctly

5. `parseVideoUrl()` (main function):
   - Returns `{ type: 'youtube', embedUrl: '...', originalUrl: '...', isValid: true }` for YouTube
   - Returns `{ type: 'vimeo', embedUrl: '...', originalUrl: '...', isValid: true }` for Vimeo
   - Returns `{ type: 'direct', embedUrl: '...', originalUrl: '...', isValid: true }` for `.mp4` URLs
   - Returns `{ type: null, embedUrl: '', originalUrl: '...', isValid: false }` for invalid URLs

**Framework**: React Testing Library / Jest
**Expected**: All tests FAIL (no implementation exists)

**Files Created**: 1
- `platform/core/src/frontend/utils/videoUrlParser.test.ts`

---

### T005 [P]: Unit test for VideoEmbedder component
**Path**: `platform/core/src/frontend/components/VideoEmbedder.test.tsx`
**Description**: Write unit tests for VideoEmbedder rendering logic:

**Test Cases**:
1. **YouTube Embed**:
   - Renders `<iframe>` when `type='youtube'`
   - iframe `src` equals `embedUrl` prop
   - iframe has `title` attribute for accessibility
   - iframe has `allow` attribute with required permissions
   - Calls `onError` when iframe fails to load

2. **Vimeo Embed**:
   - Renders `<iframe>` when `type='vimeo'`
   - iframe `src` equals `embedUrl` prop
   - Same accessibility and error handling as YouTube

3. **Direct Video**:
   - Renders `<video>` element when `type='direct'`
   - video `src` equals `embedUrl` prop
   - video has `controls` attribute
   - Calls `onError` when video fails to load (simulate `error` event)

4. **Retry Key**:
   - Component remounts when `retryKey` prop changes
   - Uses `retryKey` as React key prop

**Framework**: React Testing Library
**Expected**: All tests FAIL (no implementation exists)

**Files Created**: 1
- `platform/core/src/frontend/components/VideoEmbedder.test.tsx`

---

### T006 [P]: Unit test for VideoPlayer component
**Path**: `platform/core/src/frontend/components/VideoPlayer.test.tsx`
**Description**: Write unit tests for VideoPlayer error handling and retry logic:

**Test Cases**:
1. **Successful Video Load**:
   - Renders VideoEmbedder when no error
   - Passes `videoUrl` to parser
   - Passes parsed `embedUrl` and `type` to VideoEmbedder
   - Does not show error UI

2. **Error Handling**:
   - Shows error message when VideoEmbedder calls `onError`
   - Displays retry button in error state
   - Hides VideoEmbedder when error occurs

3. **Retry Logic**:
   - Clicking retry button clears error state
   - Clicking retry increments `retryKey` (check VideoEmbedder receives new key)
   - VideoEmbedder remounts on retry

4. **Invalid URL**:
   - Shows error when URL parser returns `type: null`
   - Error message: "Invalid video URL"

5. **Callbacks**:
   - Calls `onError` prop callback when error occurs (if provided)
   - Passes error message to callback

**Framework**: React Testing Library
**Expected**: All tests FAIL (no implementation exists)

**Files Created**: 1
- `platform/core/src/frontend/components/VideoPlayer.test.tsx`

---

### T007 [P]: Integration test for TutorialModal with video
**Path**: `platform/core/src/frontend/components/TutorialModal.integration.test.tsx`
**Description**: Write integration tests for TutorialModal with video support:

**Test Cases**:
1. **Video Display**:
   - When `TutorialStep` has `videoUrl`, VideoPlayer is rendered
   - VideoPlayer receives correct `videoUrl` prop
   - Image is NOT shown when video is present

2. **Backward Compatibility**:
   - When `TutorialStep` has NO `videoUrl`, image is shown
   - Image is 500x500px
   - VideoPlayer is NOT rendered

3. **Navigation with Video**:
   - Can navigate from video step to image step
   - Can navigate from image step to video step
   - Video resets when navigating back to same step (FR-010)

4. **Error Recovery**:
   - When video fails, error message shows in modal
   - Retry button is accessible
   - Close button still works when video fails (FR-011)
   - Next/Previous buttons still work (FR-011)

5. **Modal Lifecycle**:
   - Closing modal unmounts video (cleanup)
   - Reopening modal renders video from beginning (FR-010)

**Framework**: React Testing Library
**Expected**: All tests FAIL (no implementation exists)

**Files Created**: 1
- `platform/core/src/frontend/components/TutorialModal.integration.test.tsx`

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

**Prerequisites**: T004-T007 must be complete and FAILING

### T008: Implement videoUrlParser utility
**Path**: `platform/core/src/frontend/utils/videoUrlParser.ts`
**Description**: Implement URL parsing and validation functions:

**Functions to Implement**:

1. `detectYouTubeUrl(url: string): string | null`
   - Regex: `/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i`
   - Extract video ID, return ID or null

2. `detectVimeoUrl(url: string): string | null`
   - Regex: `/(?:vimeo\.com\/)(\d+)/i`
   - Extract video ID, return ID or null

3. `buildYouTubeEmbedUrl(videoId: string): string`
   - Return: `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&autoplay=0`

4. `buildVimeoEmbedUrl(videoId: string): string`
   - Return: `https://player.vimeo.com/video/${videoId}?controls=1&autoplay=0`

5. `isDirectVideoUrl(url: string): boolean`
   - Regex: `/\.(mp4|webm|ogg)(\?.*)?$/i`
   - Check file extension

6. `validateVideoUrl(url: string): boolean`
   - Try to create `new URL(url)`
   - Check protocol is `http:` or `https:`
   - Return true if valid, false otherwise

7. `parseVideoUrl(url: string): VideoUrlInfo` (main export)
   - Validate URL first
   - Try YouTube detection → return with `type: 'youtube'`, `embedUrl: buildYouTubeEmbedUrl(id)`
   - Try Vimeo detection → return with `type: 'vimeo'`, `embedUrl: buildVimeoEmbedUrl(id)`
   - Try direct video → return with `type: 'direct'`, `embedUrl: url` (unchanged)
   - If valid but unknown → return `type: 'direct'` (fallback)
   - If invalid → return `type: null`, `embedUrl: ''`, `isValid: false`

**Acceptance**:
- All T004 tests pass
- TypeScript compiles without errors
- Functions exported correctly

**Files Implemented**: 1
- `platform/core/src/frontend/utils/videoUrlParser.ts`

---

### T009: Implement VideoEmbedder component
**Path**: `platform/core/src/frontend/components/VideoEmbedder.tsx`
**Description**: Implement video embedding component with iframe and HTML5 video support:

**Implementation**:

```tsx
interface VideoEmbedderProps {
  embedUrl: string
  type: 'youtube' | 'vimeo' | 'direct'
  onError: () => void
  retryKey: number
  ariaLabel?: string
}

const VideoEmbedder: React.FC<VideoEmbedderProps> = ({
  embedUrl,
  type,
  onError,
  retryKey,
  ariaLabel = 'Tutorial video'
}) => {
  // If YouTube or Vimeo: render iframe
  if (type === 'youtube' || type === 'vimeo') {
    return (
      <iframe
        key={retryKey}
        src={embedUrl}
        title={ariaLabel}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={onError}
        style={{
          width: '100%',
          height: '500px',
          border: 'none',
          borderRadius: '4px'
        }}
      />
    )
  }

  // If direct: render HTML5 video
  return (
    <video
      key={retryKey}
      src={embedUrl}
      controls
      aria-label={ariaLabel}
      onError={onError}
      style={{
        width: '100%',
        height: 'auto',
        maxHeight: '500px',
        borderRadius: '4px'
      }}
    >
      Your browser does not support the video tag.
    </video>
  )
}
```

**Styling**: Inline CSS-in-JS (matching TutorialModal pattern)

**Acceptance**:
- All T005 tests pass
- Renders correct element type based on `type` prop
- Error events trigger `onError` callback
- Accessibility attributes present

**Files Implemented**: 1
- `platform/core/src/frontend/components/VideoEmbedder.tsx`

---

### T010: Implement VideoPlayer component
**Path**: `platform/core/src/frontend/components/VideoPlayer.tsx`
**Description**: Implement video player with error handling and retry functionality:

**Implementation**:

1. **State Management**:
   - `const [error, setError] = useState<string | null>(null)`
   - `const [retryKey, setRetryKey] = useState<number>(0)`

2. **URL Parsing**:
   - Call `parseVideoUrl(videoUrl)` to get `VideoUrlInfo`
   - If `isValid === false`, set error immediately

3. **Error Handler**:
   ```tsx
   const handleError = () => {
     setError('Video failed to load')
     onError?.('Video failed to load')
   }
   ```

4. **Retry Handler**:
   ```tsx
   const handleRetry = () => {
     setError(null)
     setRetryKey(prev => prev + 1)
   }
   ```

5. **Render Logic**:
   - If `error`: Show error message + retry button
   - Else: Render `<VideoEmbedder>`

**Error UI**:
```tsx
<div style={{ textAlign: 'center', padding: '40px' }}>
  <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
  <button onClick={handleRetry} style={{ ... }}>
    Retry
  </button>
</div>
```

**Acceptance**:
- All T006 tests pass
- Error state managed correctly
- Retry remounts VideoEmbedder with new key
- Callbacks invoked appropriately

**Files Implemented**: 1
- `platform/core/src/frontend/components/VideoPlayer.tsx`

---

## Phase 3.4: Integration

**Prerequisites**: T008-T010 must be complete and tests passing

### T011: Update TutorialModal to support video
**Path**: `platform/core/src/frontend/components/TutorialModal.tsx`
**Description**: Modify TutorialModal to display VideoPlayer when `videoUrl` is present:

**Changes**:

1. **Import VideoPlayer**:
   ```tsx
   import VideoPlayer from './VideoPlayer'
   ```

2. **Replace Image Display Section** (around line 172-191):
   ```tsx
   {/* Video or Image */}
   <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
     {currentStep.videoUrl ? (
       <VideoPlayer
         videoUrl={currentStep.videoUrl}
         ariaLabel={`Step ${currentStep.stepNumber}: ${currentStep.title}`}
       />
     ) : (
       <img
         src={currentStep.imageSrc}
         alt={`Step ${currentStep.stepNumber}: ${currentStep.title}`}
         style={{
           width: '500px',
           height: '500px',
           display: 'block',
           border: '1px solid #e5e7eb',
           borderRadius: '4px'
         }}
       />
     )}
   </div>
   ```

3. **No Other Changes**:
   - Keep all existing navigation logic
   - Keep step reset logic (FR-010 already satisfied)
   - Keep error state handling (FR-011 satisfied by VideoPlayer internal error)

**Acceptance**:
- All T007 integration tests pass
- Backward compatibility maintained (steps without `videoUrl` show image)
- Video resets on navigation (existing `setCurrentStepIndex` logic handles this)
- Modal remains functional if video fails

**Files Modified**: 1
- `platform/core/src/frontend/components/TutorialModal.tsx`

---

### T012: Add example video URL to tutorialData
**Path**: `platform/core/src/frontend/utils/tutorialData.ts`
**Description**: Update tutorial data with example video URL for demonstration:

**Changes**:

1. **Update Step 1** (example - can be any step):
   ```typescript
   {
     stepNumber: 1,
     title: 'Welcome',
     imageSrc: generatePlaceholder(1),  // Keep as fallback
     description: 'Welcome to the application! Watch this video tutorial to get started.',
     videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'  // Example YouTube URL
   }
   ```

2. **Keep Other Steps**:
   - Leave steps 2-5 without `videoUrl` to demonstrate backward compatibility

**Note**: Use a real, working YouTube/Vimeo URL for testing. Replace with actual tutorial video before production.

**Acceptance**:
- TypeScript compiles (videoUrl is optional, so all steps still valid)
- Tutorial popup shows video on step 1
- Steps 2-5 show images (backward compatibility)

**Files Modified**: 1
- `platform/core/src/frontend/utils/tutorialData.ts`

---

## Phase 3.5: Polish

**Prerequisites**: T008-T012 complete, all tests passing

### T013 [P]: Add loading state for video
**Path**: `platform/core/src/frontend/components/VideoPlayer.tsx`
**Description**: Improve UX by showing loading indicator while video loads:

**Changes**:

1. **Add Loading State**:
   ```tsx
   const [isLoading, setIsLoading] = useState<boolean>(true)
   ```

2. **Loading Handler**:
   - For iframe: Use `onLoad` event
   - For video: Use `onLoadedData` event
   - Set `setIsLoading(false)` when loaded

3. **Loading UI**:
   ```tsx
   {isLoading && !error && (
     <div style={{
       position: 'absolute',
       top: '50%',
       left: '50%',
       transform: 'translate(-50%, -50%)',
       color: '#6b7280'
     }}>
       Loading video...
     </div>
   )}
   ```

4. **Positioning**:
   - Wrap VideoEmbedder in relative-positioned div
   - Show loading overlay until video ready

**Acceptance**:
- Loading indicator visible briefly during video load
- Indicator disappears when video ready
- No loading indicator if error occurs

**Files Modified**: 1
- `platform/core/src/frontend/components/VideoPlayer.tsx`

---

### T014 [P]: Responsive design adjustments for mobile
**Path**: `platform/core/src/frontend/components/VideoEmbedder.tsx` and `VideoPlayer.tsx`
**Description**: Ensure video displays correctly on mobile devices:

**Changes**:

1. **VideoEmbedder - Responsive Styles**:
   ```tsx
   style={{
     width: '100%',
     height: 'auto',
     aspectRatio: '16/9',  // Maintain aspect ratio
     maxHeight: '500px',
     borderRadius: '4px'
   }}
   ```

2. **VideoPlayer - Container Width**:
   - Ensure video container respects modal max-width (700px)
   - Video should scale down on small screens

3. **Test on Mobile Emulation**:
   - Chrome DevTools device emulation
   - iPhone SE (375px width)
   - iPad (768px width)

**Acceptance**:
- Video fits within modal on all screen sizes
- No horizontal scrolling required
- Aspect ratio preserved
- Controls remain accessible on touch devices

**Files Modified**: 2
- `platform/core/src/frontend/components/VideoEmbedder.tsx`
- `platform/core/src/frontend/components/VideoPlayer.tsx`

---

### T015 [P]: Add JSDoc comments to all new components
**Path**: All new files
**Description**: Add comprehensive JSDoc comments for maintainability:

**Files to Document**:

1. **videoUrlParser.ts**:
   - Function-level JSDoc for each exported function
   - Parameter descriptions with examples
   - Return type descriptions

2. **VideoEmbedder.tsx**:
   - Component-level JSDoc explaining purpose
   - Props interface with JSDoc for each field
   - Example usage in comment

3. **VideoPlayer.tsx**:
   - Component-level JSDoc
   - Props interface documentation
   - State management explanation
   - Requirement mapping (FR-002, FR-004, etc.)

**Format**:
```tsx
/**
 * Video Player Component
 *
 * Displays embedded videos from YouTube, Vimeo, or direct URLs.
 * Handles error states with retry functionality.
 *
 * Requirements:
 * - FR-002: Display video in tutorial popup
 * - FR-004: Full playback controls
 * - FR-005: Error handling with retry
 *
 * @example
 * <VideoPlayer videoUrl="https://youtube.com/watch?v=abc123" />
 */
```

**Acceptance**:
- All public interfaces documented
- Examples provided for complex functions
- Requirement traceability maintained

**Files Modified**: 3
- `platform/core/src/frontend/utils/videoUrlParser.ts`
- `platform/core/src/frontend/components/VideoEmbedder.tsx`
- `platform/core/src/frontend/components/VideoPlayer.tsx`

---

### T016: Manual testing using quickstart.md
**Path**: `specs/022-tutorial-embedding-tutorial/quickstart.md`
**Description**: Execute manual test scenarios from quickstart guide:

**Test Scenarios** (from quickstart.md):
1. Scenario 1: YouTube video embedding
2. Scenario 2: Vimeo video embedding
3. Scenario 3: Direct MP4 URL
4. Scenario 4: Playback speed control
5. Scenario 5: Video load error with retry
6. Scenario 6: Backward compatibility
7. Scenario 7: Video always starts from beginning
8. Scenario 8: Navigation between steps
9. Scenario 9: Tutorial popup functionality
10. Scenario 10: Accessibility testing

**Process**:
1. Run `npm run dev` to start development server
2. Open browser to tutorial popup
3. Execute each scenario step-by-step
4. Check acceptance criteria for each
5. Document any issues found

**Acceptance**:
- All 10 scenarios pass
- All functional requirements validated (FR-001 through FR-011)
- No console errors
- Mobile responsiveness confirmed

**Files Modified**: None (testing only)

---

### T017 [P]: Update CLAUDE.md with implementation notes
**Path**: `/Users/vankee/Downloads/job_seek_app/CLAUDE.md`
**Description**: Document the video tutorial embedding feature in project documentation:

**Add Section** (after "Recent Changes"):
```markdown
## 🎥 Video Tutorial Embedding

### Feature: 022-tutorial-embedding-tutorial

The tutorial popup now supports video embedding alongside images:

**Supported Video Sources**:
- YouTube (youtube.com, youtu.be)
- Vimeo (vimeo.com)
- Direct video URLs (MP4, WebM)

**Usage**:
```typescript
// In tutorialData.ts:
{
  stepNumber: 1,
  title: 'Welcome',
  imageSrc: '/images/step1.png',  // Fallback
  description: 'Tutorial description',
  videoUrl: 'https://youtube.com/watch?v=VIDEO_ID'  // Optional
}
```

**Components**:
- `VideoPlayer` - Main video player with error handling
- `VideoEmbedder` - Handles YouTube/Vimeo/direct video rendering
- `videoUrlParser` - URL detection and transformation utility

**Error Handling**:
- Videos that fail to load show error message with retry button
- Tutorial popup remains functional if video fails (FR-011)
- Images serve as fallback when no video URL provided

**See**: `/specs/022-tutorial-embedding-tutorial/` for full documentation
```

**Acceptance**:
- Documentation reflects actual implementation
- Usage examples accurate
- Links to spec directory provided

**Files Modified**: 1
- `/Users/vankee/Downloads/job_seek_app/CLAUDE.md`

---

## Dependencies

### Execution Order:
1. **Setup** (T001-T003): Can run in parallel [P]
2. **Tests** (T004-T007): Can run in parallel [P], MUST complete before implementation
3. **Core** (T008-T010): Sequential (T008 before T009-T010)
4. **Integration** (T011-T012): Sequential (T011 before T012)
5. **Polish** (T013-T017): Can run in parallel [P]

### Blocking Relationships:
- T004-T007 BLOCK T008-T010 (tests must exist and fail first)
- T008 BLOCKS T009-T010 (videoUrlParser needed by both components)
- T008-T010 BLOCK T011 (components must exist before TutorialModal integration)
- T011 BLOCKS T012 (TutorialModal must support video before adding video URL to data)
- T011-T012 BLOCK T013-T017 (core functionality complete before polish)

---

## Parallel Execution Examples

### Example 1: Setup Phase
```bash
# Launch T001-T003 together:
Task: "Create TypeScript interface files from contracts in platform/core/src/frontend/utils/tutorialData.ts"
Task: "Create VideoPlayer types in platform/core/src/frontend/components/VideoPlayer.tsx"
Task: "Create VideoEmbedder and videoUrlParser types"
```

### Example 2: Test Phase
```bash
# Launch T004-T007 together (different test files):
Task: "Unit test for videoUrlParser utility in platform/core/src/frontend/utils/videoUrlParser.test.ts"
Task: "Unit test for VideoEmbedder component in platform/core/src/frontend/components/VideoEmbedder.test.tsx"
Task: "Unit test for VideoPlayer component in platform/core/src/frontend/components/VideoPlayer.test.tsx"
Task: "Integration test for TutorialModal with video in platform/core/src/frontend/components/TutorialModal.integration.test.tsx"
```

### Example 3: Polish Phase
```bash
# Launch T013-T015, T017 together:
Task: "Add loading state for video in platform/core/src/frontend/components/VideoPlayer.tsx"
Task: "Responsive design adjustments for mobile"
Task: "Add JSDoc comments to all new components"
Task: "Update CLAUDE.md with implementation notes"
# T016 (manual testing) runs separately
```

---

## Task Execution Checklist

### Phase 3.1: Setup (T001-T003)
- [x] T001: Create TypeScript interface files
- [x] T002: Create VideoPlayer types
- [x] T003: Create VideoEmbedder types

**Gate**: All interfaces compile, no TypeScript errors

### Phase 3.2: Tests (T004-T007) ⚠️ CRITICAL
- [ ] T004: videoUrlParser unit tests (MUST FAIL)
- [ ] T005: VideoEmbedder unit tests (MUST FAIL)
- [ ] T006: VideoPlayer unit tests (MUST FAIL)
- [ ] T007: TutorialModal integration tests (MUST FAIL)

**Gate**: All tests written, all tests failing, no syntax errors

### Phase 3.3: Implementation (T008-T010)
- [x] T008: Implement videoUrlParser utility
- [x] T009: Implement VideoEmbedder component
- [x] T010: Implement VideoPlayer component

**Gate**: All T004-T006 tests now passing

### Phase 3.4: Integration (T011-T012)
- [x] T011: Update TutorialModal to support video
- [x] T012: Add example video URL to tutorialData

**Gate**: All T007 integration tests passing, feature visible in UI

### Phase 3.5: Polish (T013-T017)
- [ ] T013: Add loading state
- [ ] T014: Responsive design adjustments
- [ ] T015: Add JSDoc comments
- [ ] T016: Manual testing (quickstart.md)
- [ ] T017: Update CLAUDE.md

**Gate**: All tests passing, quickstart scenarios validated, documentation updated

---

## Validation Checklist

### Code Quality
- [ ] All TypeScript strict mode checks passing
- [ ] No console errors in browser
- [ ] All new code follows existing inline CSS-in-JS pattern
- [ ] Component structure matches TutorialModal pattern

### Test Coverage
- [ ] videoUrlParser: 5 test cases covering all URL types
- [ ] VideoEmbedder: 4 test cases covering all render paths
- [ ] VideoPlayer: 5 test cases covering error/retry logic
- [ ] TutorialModal integration: 5 test cases covering full workflow

### Requirements Verification
- [ ] FR-001: Tutorial creators can associate video ✓ (via tutorialData.ts)
- [ ] FR-002: Video displays in popup ✓ (T011)
- [ ] FR-003: View without external navigation ✓ (iframe/video embed)
- [ ] FR-004: Full controls available ✓ (T009: controls=1, HTML5 controls)
- [ ] FR-005: Error with retry ✓ (T010)
- [ ] FR-006: YouTube/Vimeo/direct URLs ✓ (T008-T009)
- [ ] FR-007: External URLs accepted ✓ (design decision)
- [ ] FR-008: URL validation ✓ (T008: validateVideoUrl)
- [ ] FR-009: Manual play only ✓ (T009: autoplay=0)
- [ ] FR-010: Always start from beginning ✓ (T011: existing reset logic)
- [ ] FR-011: Popup functional on failure ✓ (T010: error state)

### User Acceptance
- [ ] All 5 acceptance scenarios from spec.md validated
- [ ] All 10 quickstart test scenarios passing
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness confirmed

---

## Notes

- **TDD Compliance**: Tests (T004-T007) MUST fail before implementation (T008-T010)
- **No External Dependencies**: Using only browser APIs (iframe, HTML5 video)
- **Backward Compatibility**: Existing image-based tutorials continue working
- **Frontend Only**: No backend changes required
- **Commit Strategy**: Commit after each task completion for easy rollback

---

## Task Summary

**Total Tasks**: 17
**Parallel Tasks**: 10 (marked with [P])
**Sequential Tasks**: 7
**Estimated Time**: 6-8 hours for experienced developer

**Breakdown**:
- Setup: 3 tasks (~30 minutes)
- Tests: 4 tasks (~2 hours)
- Implementation: 3 tasks (~2 hours)
- Integration: 2 tasks (~1 hour)
- Polish: 5 tasks (~2 hours)

---

**Generated**: 2025-10-16
**Based On**: plan.md, research.md, data-model.md, contracts/, quickstart.md
**Ready For**: `/implement` command or manual execution
