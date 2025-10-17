# Data Model: Video Tutorial Embedding

**Feature**: 022-tutorial-embedding-tutorial
**Date**: 2025-10-16

## Overview

This document defines the data structures for video tutorial embedding. Changes are additive (backward compatible) to the existing tutorial system.

---

## Core Entities

### TutorialStep (Extended)

Represents a single step in the tutorial carousel, now with optional video support.

**Location**: `platform/core/src/frontend/utils/tutorialData.ts`

```typescript
interface TutorialStep {
  /**
   * Step number (1-5 for current implementation)
   */
  stepNumber: number

  /**
   * Step title (used for alt text and accessibility)
   */
  title: string

  /**
   * Image URL - required for backward compatibility and fallback
   * Shown when videoUrl is not present or fails to load
   */
  imageSrc: string

  /**
   * Description text shown below the video/image
   */
  description: string

  /**
   * Optional video URL
   * Supports: YouTube, Vimeo, or direct video URLs (MP4, WebM)
   * When present, video is shown instead of image
   *
   * @example "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   * @example "https://vimeo.com/123456789"
   * @example "https://example.com/tutorial.mp4"
   */
  videoUrl?: string
}
```

**Changes from Original**:
- **Added**: `videoUrl?: string` field (optional)
- **Preserved**: All existing fields remain required

**Validation Rules**:
- `stepNumber`: Must be 1-5 (enforced by array index)
- `title`: Non-empty string
- `imageSrc`: Valid URL or data URI
- `description`: Non-empty string
- `videoUrl` (when present):
  - Must be valid URL format
  - Recommended: YouTube, Vimeo, or direct video URLs
  - Optional query parameters allowed

**Migration Path**:
```typescript
// Before (existing):
{
  stepNumber: 1,
  title: 'Welcome',
  imageSrc: '/images/step1.png',
  description: 'Welcome to the app'
}

// After (with video):
{
  stepNumber: 1,
  title: 'Welcome',
  imageSrc: '/images/step1.png',  // Kept as fallback
  description: 'Welcome to the app',
  videoUrl: 'https://www.youtube.com/watch?v=abc123'  // NEW
}
```

---

## Component Data Models

### VideoPlayerProps

Props interface for the VideoPlayer component.

**Location**: `platform/core/src/frontend/components/VideoPlayer.tsx`

```typescript
interface VideoPlayerProps {
  /**
   * Video URL to embed
   * Supports YouTube, Vimeo, or direct video URLs
   */
  videoUrl: string

  /**
   * Callback invoked when video fails to load
   * @param error - Error message describing the failure
   */
  onError?: (error: string) => void

  /**
   * Optional CSS class for custom styling
   */
  className?: string

  /**
   * Optional ARIA label for accessibility
   * @default "Tutorial video"
   */
  ariaLabel?: string
}
```

---

### VideoEmbedderProps

Props interface for the VideoEmbedder component (internal, used by VideoPlayer).

**Location**: `platform/core/src/frontend/components/VideoEmbedder.tsx`

```typescript
interface VideoEmbedderProps {
  /**
   * Processed embed URL (already transformed for platform)
   */
  embedUrl: string

  /**
   * Video type determined by URL parser
   */
  type: 'youtube' | 'vimeo' | 'direct'

  /**
   * Callback invoked when iframe/video fails to load
   */
  onError: () => void

  /**
   * Unique key for forcing remount on retry
   */
  retryKey: number

  /**
   * Optional ARIA label
   */
  ariaLabel?: string
}
```

---

### VideoUrlInfo

Return type for video URL parsing utility.

**Location**: `platform/core/src/frontend/utils/videoUrlParser.ts`

```typescript
interface VideoUrlInfo {
  /**
   * Detected video type
   * null if URL is invalid or unsupported
   */
  type: 'youtube' | 'vimeo' | 'direct' | null

  /**
   * Transformed embed URL ready for iframe/video element
   * For YouTube/Vimeo: includes embed path and parameters
   * For direct URLs: original URL unchanged
   * Empty string if type is null
   */
  embedUrl: string

  /**
   * Original URL that was parsed
   */
  originalUrl: string

  /**
   * Whether the URL format is valid
   */
  isValid: boolean
}
```

---

## State Management

### Video Error State

Managed within VideoPlayer component, not persisted.

```typescript
interface VideoErrorState {
  /**
   * Whether an error has occurred
   */
  hasError: boolean

  /**
   * User-friendly error message
   */
  message: string

  /**
   * Number of retry attempts (for UX/debugging)
   */
  retryCount: number
}
```

**Lifecycle**:
- Initialized on component mount: `{ hasError: false, message: '', retryCount: 0 }`
- Set on error: `{ hasError: true, message: 'Video failed to load', retryCount: 0 }`
- Reset on retry: `{ hasError: false, message: '', retryCount: retryCount + 1 }`
- Cleared on component unmount (modal close)

---

### Retry State

Simple counter for forcing component remount.

```typescript
const [retryKey, setRetryKey] = useState<number>(0)

// Increment on retry to force remount
const handleRetry = () => {
  setRetryKey(prev => prev + 1)
}
```

**Purpose**: Changing `key` prop forces React to unmount and remount the video element, effectively retrying the load.

---

## URL Transformation Examples

### YouTube Transformations

```typescript
// Input variations:
"https://www.youtube.com/watch?v=dQw4w9WgXcQ"
"https://youtu.be/dQw4w9WgXcQ"
"https://www.youtube.com/embed/dQw4w9WgXcQ"

// Output (standardized embed URL):
"https://www.youtube.com/embed/dQw4w9WgXcQ?controls=1&modestbranding=1&rel=0&autoplay=0"
```

### Vimeo Transformations

```typescript
// Input variations:
"https://vimeo.com/123456789"
"https://player.vimeo.com/video/123456789"

// Output (standardized embed URL):
"https://player.vimeo.com/video/123456789?controls=1&autoplay=0"
```

### Direct URL (No Transformation)

```typescript
// Input:
"https://example.com/videos/tutorial.mp4"

// Output (unchanged):
"https://example.com/videos/tutorial.mp4"
```

---

## Data Flow Diagram

```
tutorialData.ts (TutorialStep[])
           ↓
TutorialModal (selects current step)
           ↓
    step.videoUrl? ←── Yes ──→ VideoPlayer
           ↓ No                       ↓
    <img> fallback       videoUrlParser.parse()
                                       ↓
                              VideoUrlInfo { type, embedUrl }
                                       ↓
                              VideoEmbedder
                                    ↙    ↘
                         type === 'direct'?
                              /              \
                        Yes: <video>    No: <iframe>
                              |                |
                          onError         onError
                              ↘                ↙
                              error state
                                    ↓
                              <ErrorMessage>
                                    ↓
                              <RetryButton>
```

---

## Storage & Persistence

### Static Data (tutorialData.ts)
- **Location**: `platform/core/src/frontend/utils/tutorialData.ts`
- **Format**: Exported TypeScript array
- **Persistence**: None (part of frontend bundle)
- **Modification**: Requires code change and redeploy

### Runtime State (localStorage)
- **Existing**: Tutorial "seen" flag (no changes needed)
- **New**: None (video state is ephemeral, not persisted)

### Session State (React component state)
- **VideoPlayer**: Error state, retry counter
- **TutorialModal**: Current step index (existing)
- **Lifetime**: Cleared on modal close

---

## Validation & Constraints

### URL Validation

```typescript
function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}
```

### Type Detection Priority

1. **YouTube**: Check first (most common)
2. **Vimeo**: Check second
3. **Direct**: Check file extension (`.mp4`, `.webm`, `.ogg`)
4. **Fallback**: Treat as direct URL if valid HTTPS

### Error Scenarios

| Scenario | Detection | User Feedback | Retry Behavior |
|----------|-----------|---------------|----------------|
| Invalid URL format | URL parser fails | "Invalid video URL" | Retry button (no effect) |
| Network failure | iframe/video `onerror` | "Video failed to load" | Retry button (remount) |
| CORS blocked | video `error` event | "Video cannot be loaded" | Retry button (remount) |
| 404 Not Found | iframe/video `onerror` | "Video not found" | Retry button (remount) |
| Unsupported format | video `error` event | "Video format unsupported" | Retry button (no effect) |

---

## Backward Compatibility Matrix

| Tutorial Data | VideoPlayer Behavior | Fallback Behavior |
|---------------|---------------------|-------------------|
| No `videoUrl` field | Not rendered | Image shown (existing) |
| `videoUrl: undefined` | Not rendered | Image shown |
| `videoUrl: null` | Not rendered | Image shown |
| `videoUrl: ""` (empty) | Not rendered | Image shown |
| `videoUrl: "https://..."` | Rendered | Image shown on error |

---

## Testing Data

### Valid Test URLs

```typescript
export const testVideoUrls = {
  youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  vimeo: 'https://vimeo.com/148751763',
  directMp4: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
  directWebm: 'https://example.com/video.webm'
}
```

### Invalid Test URLs

```typescript
export const invalidVideoUrls = {
  malformed: 'not-a-url',
  unsupportedProtocol: 'ftp://example.com/video.mp4',
  noExtension: 'https://example.com/video',
  unsupportedDomain: 'https://unknown-platform.com/video/123'
}
```

---

## Migration Checklist

- [x] Define extended TutorialStep interface
- [x] Document VideoPlayerProps contract
- [x] Document VideoEmbedderProps contract
- [x] Document VideoUrlInfo structure
- [x] Document state management approach
- [x] Document validation rules
- [x] Document backward compatibility
- [ ] Create TypeScript interface files (Phase 1)
- [ ] Update tutorialData.ts with example videoUrl (Phase 3)
- [ ] Write unit tests for data validation (Phase 1)

---

**Next**: Create contract interface files in `contracts/` directory
