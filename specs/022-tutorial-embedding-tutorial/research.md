# Research: Video Tutorial Embedding

**Feature**: 022-tutorial-embedding-tutorial
**Date**: 2025-10-16

## Research Questions

### 1. How to embed YouTube/Vimeo videos with full controls?

**Decision**: Use iframe embedding with query parameters

**YouTube Embed URL Structure**:
```
https://www.youtube.com/embed/{VIDEO_ID}?controls=1&modestbranding=1&rel=0&autoplay=0
```

**Vimeo Embed URL Structure**:
```
https://player.vimeo.com/video/{VIDEO_ID}?controls=1&autoplay=0
```

**Parameters**:
- `controls=1`: Show player controls (play, pause, seek, volume, fullscreen)
- `autoplay=0`: Disable auto-play (FR-009)
- `modestbranding=1` (YouTube): Minimal branding
- `rel=0` (YouTube): No related videos at end

**Rationale**:
- Native platform controls provide all required features (FR-004)
- No additional JavaScript libraries needed
- Works across all modern browsers
- Playback speed control available via native player UI

**Sources**:
- YouTube IFrame Player API: https://developers.google.com/youtube/iframe_api_reference
- Vimeo Player SDK: https://developer.vimeo.com/player/sdk

---

### 2. How to handle direct video URLs (MP4, WebM)?

**Decision**: Use HTML5 `<video>` element with controls attribute

**Implementation**:
```tsx
<video
  src={videoUrl}
  controls          // Provides play, pause, seek, volume, fullscreen
  style={{ width: '100%', height: 'auto' }}
>
  Your browser does not support the video tag.
</video>
```

**Format Support**:
- MP4 (H.264): Supported in all modern browsers
- WebM (VP8/VP9): Supported in Chrome, Firefox, Edge
- Fallback: Error message if format unsupported

**Controls Provided by HTML5 Video**:
- ✅ Play/Pause
- ✅ Seek/Scrub timeline
- ✅ Volume control
- ✅ Fullscreen mode
- ✅ Playback speed (via browser context menu in Chrome/Firefox)

**Rationale**:
- Native browser support, no dependencies
- Meets all FR-004 requirements
- Consistent UX with platform video players
- No auto-play by default (FR-009 compliant)

**Sources**:
- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
- Can I Use (video format support): https://caniuse.com/video

---

### 3. How to detect video URL type (YouTube vs Vimeo vs direct)?

**Decision**: Regex pattern matching

**URL Patterns**:

**YouTube**:
```typescript
const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
```
Matches:
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- `https://www.youtube.com/embed/dQw4w9WgXcQ`

**Vimeo**:
```typescript
const vimeoRegex = /(?:vimeo\.com\/)(\d+)/i
```
Matches:
- `https://vimeo.com/123456789`
- `https://player.vimeo.com/video/123456789`

**Direct URL**:
```typescript
const directVideoRegex = /\.(mp4|webm|ogg)(\?.*)?$/i
```
Matches:
- `https://example.com/video.mp4`
- `https://example.com/video.webm?version=2`

**Fallback**: If no pattern matches, treat as direct URL

**Rationale**:
- Deterministic detection without external API calls
- Enables proper embed URL construction
- Handles common URL variations
- Zero-dependency solution

---

### 4. How to handle video loading errors with retry?

**Decision**: Component-level error state with retry via key change

**Error Sources**:
- iframe `onerror` event (network failure, blocked content)
- HTML5 video `error` event (unsupported format, CORS issues, 404)

**Implementation Pattern**:
```tsx
const [retryKey, setRetryKey] = useState(0)
const [error, setError] = useState<string | null>(null)

const handleError = () => {
  setError('Video failed to load')
}

const handleRetry = () => {
  setError(null)
  setRetryKey(prev => prev + 1) // Force remount
}

return error ? (
  <div>
    <p>{error}</p>
    <button onClick={handleRetry}>Retry</button>
  </div>
) : (
  <iframe key={retryKey} src={embedUrl} onError={handleError} />
)
```

**Rationale**:
- Key change forces React to remount component, retrying load
- Simple state management without complex error boundaries
- Allows users to retry without refreshing entire page (FR-005)
- Graceful degradation (FR-011)

**Sources**:
- React docs: https://react.dev/learn/preserving-and-resetting-state

---

### 5. How to maintain backward compatibility with image-based tutorials?

**Decision**: Make `videoUrl` optional in `TutorialStep` interface

**Pattern**:
```typescript
interface TutorialStep {
  stepNumber: number
  title: string
  imageSrc: string        // Required - used as fallback
  description: string
  videoUrl?: string       // Optional - when present, video shown instead
}

// In TutorialModal:
{currentStep.videoUrl ? (
  <VideoPlayer videoUrl={currentStep.videoUrl} />
) : (
  <img src={currentStep.imageSrc} alt={...} />
)}
```

**Migration Path**:
1. Deploy code with optional `videoUrl` support
2. Existing tutorials continue working (no videoUrl field)
3. Gradually add `videoUrl` to desired steps
4. Image remains as fallback if video fails

**Rationale**:
- Zero breaking changes to existing data
- Progressive enhancement approach
- Image as fallback provides resilience
- Team can migrate tutorials at their own pace

---

## Technology Stack Decisions

### Frontend Framework: React 18 (Existing)
- **Why**: Already in use, no need to introduce new frameworks
- **Components**: Functional components with hooks
- **Styling**: Inline CSS-in-JS (matching existing TutorialModal pattern)

### TypeScript: 5.0+ (Existing)
- **Why**: Strong typing for video URL handling and props
- **Benefits**: Compile-time validation of URL types and component contracts

### Testing: React Testing Library (Existing)
- **Unit Tests**: Component rendering, URL parsing logic
- **Integration Tests**: TutorialModal with video steps
- **Manual Tests**: Actual video playback across browsers

### Build Tool: Vite 5 (Existing)
- **Why**: Fast dev server, optimal for React development
- **No Changes**: Existing build pipeline handles new components

---

## Alternatives Considered

### Video.js Library
- **Pros**: Unified player for all video types, custom styling
- **Cons**:
  - 200KB+ bundle size
  - Overkill for simple embedding
  - External dependency to maintain
- **Rejected**: Native solutions meet all requirements without bloat

### Only Support iframe Embedding
- **Pros**: Single implementation path
- **Cons**:
  - Can't support direct MP4/WebM URLs (FR-006)
  - Requires video hosting on YouTube/Vimeo only
- **Rejected**: Spec requires direct URL support

### Custom Video Player
- **Pros**: Complete control over UI/UX
- **Cons**:
  - Complex implementation (seek, buffering, etc.)
  - Browser compatibility issues
  - No advantage over native controls
- **Rejected**: Native controls sufficient for requirements

---

## Risk Assessment

### Low Risk
- ✅ HTML5 video widely supported (99%+ browser coverage)
- ✅ iframe embedding well-documented and stable
- ✅ No external dependencies to maintain

### Medium Risk
- ⚠️ **CORS issues with direct URLs**: Mitigated by error handling + retry
- ⚠️ **Browser auto-play policies**: Mitigated by manual play requirement (FR-009)

### Mitigation Strategies
1. **CORS Errors**: Clear error message instructing user to use CORS-enabled URLs
2. **Unsupported Formats**: HTML5 video fallback message
3. **Network Failures**: Retry button for transient errors

---

## Performance Considerations

### Video Load Time
- **Target**: <3 seconds on broadband
- **Factors**:
  - YouTube/Vimeo: Platform-optimized delivery
  - Direct URLs: Depends on host CDN
- **Optimization**: Lazy load video (only when modal visible)

### Bundle Size Impact
- **New Code**: ~5KB (3 small components + 1 utility)
- **Dependencies**: 0 (using browser APIs only)
- **Total Impact**: Negligible (<1% increase)

### Runtime Performance
- **iframe**: Isolated context, no performance impact on main app
- **HTML5 video**: Browser-optimized rendering
- **Memory**: Video unloaded when modal closes (React unmount)

---

## Security Considerations

### External Content (YouTube/Vimeo)
- **Sandboxed**: iframes provide isolation
- **Trusted Sources**: YouTube/Vimeo are trusted platforms

### Direct Video URLs
- **Risk**: Arbitrary URL hosting
- **Mitigation**:
  - URL validation (format checking)
  - Same-origin policy applies
  - Content-Security-Policy enforced by browser

### No Server-Side Processing
- **Benefit**: No backend validation needed
- **Risk Surface**: Minimal (client-side only)

---

## Accessibility Considerations

### Keyboard Navigation
- ✅ Video players support keyboard controls (Space, Arrow keys)
- ✅ Retry button is keyboard-accessible

### Screen Readers
- Add ARIA labels: `aria-label="Tutorial video"`
- Error messages announced via `aria-live="polite"`

### Caption Support
- YouTube/Vimeo: Built-in caption support (user-enabled)
- Direct URLs: Can use `<track>` element for WebVTT subtitles (future enhancement)

---

## Conclusion

All technical decisions support the feature requirements without introducing unnecessary complexity or dependencies. The hybrid approach (iframe + HTML5 video) provides maximum flexibility while maintaining simplicity and following existing project patterns.

**Next Phase**: Design & Contracts (data-model.md, contracts/, quickstart.md)
