/**
 * Video Player Component Interface Contract
 * Feature: 022-tutorial-embedding-tutorial
 *
 * Component responsible for displaying embedded videos with error handling.
 * Supports YouTube, Vimeo, and direct video URLs.
 */

export interface VideoPlayerProps {
  /**
   * Video URL to embed
   *
   * Supported types:
   * - YouTube: Will be transformed to embed URL with controls enabled
   * - Vimeo: Will be transformed to player URL with controls enabled
   * - Direct: MP4, WebM formats displayed via HTML5 video element
   *
   * Requirements satisfied:
   * - FR-002: Display video in tutorial popup
   * - FR-003: View video without external navigation
   * - FR-004: Full playback controls (play, pause, seek, volume, speed, fullscreen)
   * - FR-006: Support YouTube, Vimeo, direct URLs
   * - FR-009: Manual play only (no auto-play)
   * - FR-010: Always start from beginning
   *
   * @example "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   */
  videoUrl: string

  /**
   * Callback invoked when video fails to load
   *
   * Error scenarios:
   * - Network failure during load
   * - Invalid URL format
   * - CORS blocked content
   * - 404 Not Found
   * - Unsupported video format
   *
   * Requirement: FR-005 (error handling with retry)
   *
   * @param error - Human-readable error message
   * @example onError("Video failed to load")
   */
  onError?: (error: string) => void

  /**
   * Optional CSS class for custom styling
   * Applied to the container div
   *
   * @default undefined
   */
  className?: string

  /**
   * ARIA label for accessibility
   * Announced to screen readers
   *
   * @default "Tutorial video"
   */
  ariaLabel?: string
}

/**
 * Video Player Error State (internal)
 *
 * Managed within VideoPlayer component, not exposed via props.
 * Tracks error status and retry attempts.
 */
export interface VideoErrorState {
  /**
   * Whether an error has occurred during video load
   */
  hasError: boolean

  /**
   * User-friendly error message
   * Displayed in error UI along with retry button
   *
   * Requirement: FR-005 (display error message)
   */
  message: string

  /**
   * Number of retry attempts made by user
   * Used for debugging and potential rate limiting
   */
  retryCount: number
}
