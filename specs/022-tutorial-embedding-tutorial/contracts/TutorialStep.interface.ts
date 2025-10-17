/**
 * Tutorial Step Interface Contract
 * Feature: 022-tutorial-embedding-tutorial
 *
 * Extended interface for tutorial carousel steps with optional video support.
 * Backward compatible with existing image-only steps.
 */

export interface TutorialStep {
  /**
   * Step number in the tutorial sequence (1-5)
   */
  stepNumber: number

  /**
   * Step title
   * Used for accessibility and alt text
   */
  title: string

  /**
   * Image source URL or data URI
   * Required for backward compatibility and fallback
   * Displayed when videoUrl is absent or video fails to load
   */
  imageSrc: string

  /**
   * Description text displayed below the video/image
   */
  description: string

  /**
   * Optional video URL
   *
   * Supported formats:
   * - YouTube: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
   * - Vimeo: https://vimeo.com/VIDEO_ID
   * - Direct URLs: https://example.com/video.mp4 or .webm
   *
   * Requirements:
   * - FR-007: Must be external URL only
   * - FR-008: Must be valid URL format
   * - FR-009: Video will not auto-play
   * - FR-010: Video always starts from beginning (no position tracking)
   *
   * When present, video is displayed instead of image.
   * If video fails to load, image is shown as fallback.
   *
   * @example "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   * @example "https://vimeo.com/123456789"
   * @example "https://example.com/tutorial.mp4"
   */
  videoUrl?: string
}
