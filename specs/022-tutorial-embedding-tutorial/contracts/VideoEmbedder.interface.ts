/**
 * Video Embedder Component Interface Contract
 * Feature: 022-tutorial-embedding-tutorial
 *
 * Internal component used by VideoPlayer to render the appropriate video element.
 * Handles iframe embedding for YouTube/Vimeo and HTML5 video for direct URLs.
 */

export interface VideoEmbedderProps {
  /**
   * Processed embed URL ready for rendering
   *
   * For YouTube: https://www.youtube.com/embed/{ID}?controls=1&...
   * For Vimeo: https://player.vimeo.com/video/{ID}?controls=1&...
   * For direct: Original URL unchanged
   *
   * URL has been validated and transformed by videoUrlParser
   */
  embedUrl: string

  /**
   * Video type determined by URL pattern matching
   *
   * Determines rendering strategy:
   * - 'youtube' | 'vimeo': Render as <iframe>
   * - 'direct': Render as <video> element
   */
  type: 'youtube' | 'vimeo' | 'direct'

  /**
   * Callback invoked when iframe or video element fails to load
   *
   * Triggered by:
   * - iframe 'error' event (network failure, blocked content)
   * - video 'error' event (unsupported format, CORS, 404)
   *
   * Propagated up to VideoPlayer for error UI display
   */
  onError: () => void

  /**
   * Unique key for forcing component remount on retry
   *
   * When user clicks retry button, this key is incremented,
   * causing React to unmount and remount the video element,
   * effectively retrying the load.
   *
   * Requirement: FR-005 (retry button functionality)
   */
  retryKey: number

  /**
   * ARIA label for accessibility
   * Applied to iframe or video element
   *
   * @default "Tutorial video"
   */
  ariaLabel?: string
}

/**
 * Video URL Parser Result Interface
 * Feature: 022-tutorial-embedding-tutorial
 *
 * Return type for videoUrlParser utility functions.
 * Contains detected video type and transformed embed URL.
 */

export interface VideoUrlInfo {
  /**
   * Detected video type based on URL pattern
   *
   * null if URL is invalid or unsupported
   *
   * Detection priority:
   * 1. YouTube (most common)
   * 2. Vimeo
   * 3. Direct (file extension check)
   * 4. Fallback to 'direct' if valid HTTPS URL
   */
  type: 'youtube' | 'vimeo' | 'direct' | null

  /**
   * Transformed embed URL ready for rendering
   *
   * YouTube: Adds /embed/ path and control parameters
   * Vimeo: Converts to player.vimeo.com with parameters
   * Direct: Original URL unchanged
   *
   * Empty string if type is null (invalid URL)
   *
   * Parameters added for YouTube/Vimeo (FR-009, FR-004):
   * - controls=1: Enable full playback controls
   * - autoplay=0: Disable auto-play
   * - modestbranding=1 (YouTube): Minimal branding
   * - rel=0 (YouTube): No related videos
   */
  embedUrl: string

  /**
   * Original URL provided for parsing
   * Preserved for debugging and logging
   */
  originalUrl: string

  /**
   * Whether the URL format is valid
   *
   * true: URL is well-formed HTTPS URL
   * false: Malformed URL or unsupported protocol
   *
   * Requirement: FR-008 (URL validation)
   */
  isValid: boolean
}

/**
 * Video Type Enumeration
 *
 * Supported video platform types
 */
export type VideoType = 'youtube' | 'vimeo' | 'direct'
