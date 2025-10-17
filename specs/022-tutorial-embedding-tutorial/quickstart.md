# Quickstart: Video Tutorial Embedding Testing

**Feature**: 022-tutorial-embedding-tutorial
**Date**: 2025-10-16

## Purpose

This guide provides step-by-step instructions for manually testing the video tutorial embedding feature. Use this after implementation to verify all requirements are met.

---

## Prerequisites

- [ ] Development environment running (`npm run dev`)
- [ ] Browser dev tools open (for console inspection)
- [ ] Test video URLs ready (provided below)

---

## Test Video URLs

```typescript
// YouTube (public video)
const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

// Vimeo (public video)
const vimeoUrl = 'https://vimeo.com/148751763'

// Direct MP4 (sample)
const directMp4 = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'

// Invalid URL (for error testing)
const invalidUrl = 'https://example.com/nonexistent-video.mp4'
```

---

## Test Scenarios

### Scenario 1: YouTube Video Embedding (FR-002, FR-006)

**Objective**: Verify YouTube videos embed with full controls

**Steps**:
1. Update `tutorialData.ts`:
   ```typescript
   {
     stepNumber: 1,
     title: 'Welcome',
     imageSrc: generatePlaceholder(1),
     description: 'Watch this YouTube tutorial video',
     videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
   }
   ```
2. Open application in browser
3. Open tutorial popup
4. Navigate to Step 1

**Expected Results**:
- [ ] YouTube video iframe loads successfully
- [ ] Video does NOT auto-play (FR-009) ✓
- [ ] Play button is visible
- [ ] Video controls visible: play/pause, seek bar, volume, settings, fullscreen (FR-004) ✓
- [ ] No image shown (video replaces image)

**Acceptance Criteria**:
- FR-002: Video displays in tutorial popup ✓
- FR-003: No external navigation required ✓
- FR-004: Full controls available ✓
- FR-006: YouTube URL supported ✓
- FR-009: Manual play required ✓
- FR-010: Video starts at 0:00 ✓

---

### Scenario 2: Vimeo Video Embedding (FR-002, FR-006)

**Objective**: Verify Vimeo videos embed with full controls

**Steps**:
1. Update `tutorialData.ts` Step 2:
   ```typescript
   videoUrl: 'https://vimeo.com/148751763'
   ```
2. Navigate to Step 2 in tutorial popup

**Expected Results**:
- [ ] Vimeo player iframe loads successfully
- [ ] Video does NOT auto-play (FR-009) ✓
- [ ] Play button is visible
- [ ] Video controls visible: play, seek, volume, fullscreen (FR-004) ✓

**Acceptance Criteria**:
- FR-002: Video displays in tutorial popup ✓
- FR-006: Vimeo URL supported ✓
- FR-009: Manual play required ✓

---

### Scenario 3: Direct MP4 URL (FR-002, FR-006)

**Objective**: Verify direct video URLs play via HTML5 video

**Steps**:
1. Update `tutorialData.ts` Step 3:
   ```typescript
   videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'
   ```
2. Navigate to Step 3 in tutorial popup

**Expected Results**:
- [ ] HTML5 `<video>` element renders
- [ ] Video does NOT auto-play (FR-009) ✓
- [ ] Native browser controls visible (FR-004) ✓
- [ ] Video can be played, paused, seeked
- [ ] Volume control and fullscreen buttons available

**Acceptance Criteria**:
- FR-002: Video displays in tutorial popup ✓
- FR-004: Full native controls available ✓
- FR-006: Direct MP4 URL supported ✓
- FR-009: Manual play required ✓

---

### Scenario 4: Playback Speed Control (FR-004)

**Objective**: Verify playback speed adjustment is available

**Steps**:
1. Load any video (YouTube, Vimeo, or direct)
2. Click play button
3. **YouTube/Vimeo**: Click settings/gear icon in player
4. **Direct (Chrome/Firefox)**: Right-click video → "Playback speed"

**Expected Results**:
- [ ] YouTube: Settings menu shows "Playback speed" option (0.25x - 2x)
- [ ] Vimeo: Settings menu shows playback speed options
- [ ] Direct (Chrome): Context menu shows "Playback speed" submenu
- [ ] Direct (Firefox): Context menu shows "Play Speed" submenu
- [ ] Speed adjustment works correctly

**Acceptance Criteria**:
- FR-004: Playback speed control available ✓

---

### Scenario 5: Video Load Error with Retry (FR-005)

**Objective**: Verify error handling displays message and retry button

**Steps**:
1. Update `tutorialData.ts` with invalid URL:
   ```typescript
   videoUrl: 'https://example.com/nonexistent-video.mp4'
   ```
2. Navigate to that step in tutorial popup

**Expected Results**:
- [ ] Error message displays: "Video failed to load"
- [ ] Retry button is visible and clickable
- [ ] No video iframe/element shown
- [ ] Image fallback NOT shown (per requirements)

**Actions**:
3. Click "Retry" button

**Expected After Retry**:
- [ ] Component attempts to reload video
- [ ] Error message shows again (since URL is still invalid)
- [ ] Retry button still functional

**Acceptance Criteria**:
- FR-005: Error handled gracefully with retry button ✓

---

### Scenario 6: Backward Compatibility (FR-010, FR-011)

**Objective**: Verify steps without videoUrl still show images

**Steps**:
1. Ensure at least one step has NO `videoUrl` field:
   ```typescript
   {
     stepNumber: 4,
     title: 'Image Step',
     imageSrc: generatePlaceholder(4),
     description: 'This step uses an image'
     // No videoUrl field
   }
   ```
2. Navigate to Step 4 in tutorial popup

**Expected Results**:
- [ ] Image displays correctly (existing behavior)
- [ ] No video player shown
- [ ] Image is 500x500px, centered
- [ ] Description text shown below image
- [ ] Navigation buttons work normally

**Acceptance Criteria**:
- Backward compatibility maintained ✓
- No breaking changes to existing steps ✓

---

### Scenario 7: Video Always Starts from Beginning (FR-010)

**Objective**: Verify no position tracking/resuming

**Steps**:
1. Open tutorial popup with video step
2. Click play, watch video for 10 seconds
3. Close tutorial popup (X button or backdrop click)
4. Reopen tutorial popup
5. Navigate to the same video step

**Expected Results**:
- [ ] Video position resets to 0:00
- [ ] Video does NOT resume from where it was left off
- [ ] Play button shows (video not playing)

**Acceptance Criteria**:
- FR-010: Video always starts from beginning ✓

---

### Scenario 8: Navigation Between Steps (FR-010)

**Objective**: Verify video resets when navigating away and back

**Steps**:
1. Open tutorial on a video step
2. Click play, watch for 5 seconds
3. Click "Next" to go to next step
4. Click "Previous" to return to video step

**Expected Results**:
- [ ] Video resets to 0:00
- [ ] Video is not playing (manual play required)

**Acceptance Criteria**:
- FR-010: Video resets on re-entry ✓

---

### Scenario 9: Tutorial Popup Functionality (FR-011)

**Objective**: Verify popup remains functional if video fails

**Steps**:
1. Set invalid videoUrl that will fail to load
2. Open tutorial popup

**Expected Results**:
- [ ] Error message shows
- [ ] Close (X) button works
- [ ] Previous/Next buttons work
- [ ] Finish button works (if last step)
- [ ] Escape key closes popup
- [ ] Backdrop click closes popup
- [ ] Tutorial popup is fully functional

**Acceptance Criteria**:
- FR-011: Popup remains functional despite video failure ✓

---

### Scenario 10: Accessibility Testing

**Objective**: Verify keyboard and screen reader support

**Steps**:
1. Open tutorial popup with video
2. Use Tab key to navigate
3. Use Space/Enter on retry button (if error state)
4. Use screen reader (VoiceOver on Mac, NVDA on Windows)

**Expected Results**:
- [ ] Video iframe/element is focusable via Tab
- [ ] Video controls are keyboard-accessible (Space to play/pause, Arrow keys to seek)
- [ ] Retry button is keyboard-accessible
- [ ] ARIA label "Tutorial video" announced by screen reader
- [ ] Error messages announced via `aria-live="polite"`

**Acceptance Criteria**:
- Keyboard navigation works ✓
- Screen reader announces video and errors ✓

---

## Performance Testing

### Video Load Time

**Objective**: Verify video loads within acceptable time (<3 seconds on broadband)

**Steps**:
1. Open browser Network tab
2. Clear cache
3. Open tutorial popup to video step
4. Measure time from request to first frame

**Expected Results**:
- [ ] YouTube/Vimeo: Iframe loads <1 second
- [ ] Direct video: Initial load <3 seconds (depends on file size)
- [ ] No JavaScript errors in console
- [ ] Main page remains responsive during video load

---

## Mobile Responsiveness Testing

**Objective**: Verify video works on mobile devices

**Steps**:
1. Open browser device emulation (iPhone, Android)
2. Open tutorial popup with video step

**Expected Results**:
- [ ] Video scales to fit modal (max-width: 700px)
- [ ] Controls remain accessible on touch devices
- [ ] Fullscreen mode works on mobile
- [ ] No horizontal scrolling required
- [ ] Touch gestures work (tap to play, swipe to seek)

---

## Cross-Browser Testing

**Objective**: Verify video works across major browsers

**Browsers to Test**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test Cases for Each Browser**:
1. YouTube embed (iframe)
2. Vimeo embed (iframe)
3. Direct MP4 (HTML5 video)
4. Error state with retry

**Expected Results**:
- All scenarios work consistently across browsers
- HTML5 video controls may look different (browser-specific styling)
- Playback speed access varies (YouTube/Vimeo consistent, native controls vary)

---

## Validation Checklist

### Functional Requirements

- [ ] FR-001: Tutorial creators can associate video with popup (via tutorialData.ts)
- [ ] FR-002: Video displays in tutorial popup
- [ ] FR-003: Video viewed without external navigation
- [ ] FR-004: Full controls (play, pause, seek, volume, speed, fullscreen)
- [ ] FR-005: Error handling with retry button
- [ ] FR-006: YouTube, Vimeo, direct URLs supported
- [ ] FR-007: External URLs accepted
- [ ] FR-008: URL validation before storing
- [ ] FR-009: Manual play only (no auto-play)
- [ ] FR-010: Video always starts from beginning
- [ ] FR-011: Popup functional if video fails

### User Acceptance Scenarios

- [ ] Acceptance Scenario 1: Video URL stored and associated
- [ ] Acceptance Scenario 2: Video appears with play button (not auto-playing)
- [ ] Acceptance Scenario 3: All controls accessible and functional
- [ ] Acceptance Scenario 4: Error message with retry on failure
- [ ] Acceptance Scenario 5: Video resets on reopen

### Edge Cases

- [ ] Invalid URL shows error
- [ ] Network failure recoverable via retry
- [ ] Browser doesn't support video format → error shown
- [ ] Popup size adjusts gracefully for video aspect ratio
- [ ] Slow network → video shows loading state (built-in player behavior)

---

## Troubleshooting

### Video Not Loading

**Possible Causes**:
- CORS policy blocking direct URLs → Use CORS-enabled URLs or YouTube/Vimeo
- Invalid URL format → Check URL validation logic
- Network firewall blocking video hosts → Test on different network

### Controls Not Visible

**Possible Causes**:
- YouTube/Vimeo: `controls=1` parameter missing in embed URL
- Direct video: `controls` attribute missing on `<video>` element
- CSS z-index issue covering controls

### Auto-play Happening

**Possible Causes**:
- `autoplay=0` parameter missing or overridden
- Browser auto-play policy changed → Verify parameter is set correctly

---

## Sign-Off

**Tester**: _________________________
**Date**: _________________________
**Result**: ☐ PASS   ☐ FAIL (see issues below)

**Issues Found**:
1. _______________________________________________________
2. _______________________________________________________
3. _______________________________________________________

---

**Next Steps**:
- If all tests pass: Feature ready for deployment
- If issues found: Document in GitHub issues, fix, retest
