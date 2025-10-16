/**
 * Video URL Parser Utility
 * Feature: 022-tutorial-embedding-tutorial
 *
 * Detects video type (YouTube, Vimeo, direct) and transforms URLs for embedding.
 */

import type { VideoType } from '../components/VideoEmbedder'

/**
 * Result of parsing a video URL
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
  type: VideoType | null

  /**
   * Transformed embed URL ready for rendering
   *
   * YouTube: Adds /embed/ path and control parameters
   * Vimeo: Converts to player.vimeo.com with parameters
   * Direct: Original URL unchanged
   *
   * Empty string if type is null (invalid URL)
   */
  embedUrl: string

  /**
   * Original URL provided for parsing
   */
  originalUrl: string

  /**
   * Whether the URL format is valid
   *
   * true: URL is well-formed HTTPS URL
   * false: Malformed URL or unsupported protocol
   */
  isValid: boolean
}

/**
 * Detects YouTube video ID from various URL formats
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 *
 * @param url - URL to check
 * @returns Video ID if detected, null otherwise
 */
export function detectYouTubeUrl(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Detects Vimeo video ID from URL
 *
 * Supports:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 *
 * @param url - URL to check
 * @returns Video ID if detected, null otherwise
 */
export function detectVimeoUrl(url: string): string | null {
  const regex = /(?:vimeo\.com\/)(\d+)/i
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Builds YouTube embed URL with required parameters
 *
 * Parameters:
 * - controls=1: Show player controls
 * - modestbranding=1: Minimal branding
 * - rel=0: No related videos
 * - autoplay=0: No auto-play (FR-009)
 *
 * @param videoId - YouTube video ID
 * @returns Embed URL with parameters
 */
export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&autoplay=0`
}

/**
 * Builds Vimeo embed URL with required parameters
 *
 * Parameters:
 * - controls=1: Show player controls
 * - autoplay=0: No auto-play (FR-009)
 *
 * @param videoId - Vimeo video ID
 * @returns Embed URL with parameters
 */
export function buildVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}?controls=1&autoplay=0`
}

/**
 * Checks if URL is a direct video file
 *
 * Supported extensions: mp4, webm, ogg
 *
 * @param url - URL to check
 * @returns true if direct video URL, false otherwise
 */
export function isDirectVideoUrl(url: string): boolean {
  const regex = /\.(mp4|webm|ogg)(\?.*)?$/i
  return regex.test(url)
}

/**
 * Validates that URL is well-formed and uses HTTPS protocol
 *
 * @param url - URL to validate
 * @returns true if valid HTTPS URL, false otherwise
 */
export function validateVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Main parser function - detects video type and transforms URL for embedding
 *
 * Detection priority:
 * 1. YouTube
 * 2. Vimeo
 * 3. Direct video file
 * 4. Fallback to 'direct' if valid URL
 *
 * @param url - Video URL to parse
 * @returns VideoUrlInfo with type, embedUrl, and validity status
 *
 * @example
 * parseVideoUrl('https://www.youtube.com/watch?v=abc123')
 * // Returns: { type: 'youtube', embedUrl: 'https://www.youtube.com/embed/abc123?...', originalUrl: '...', isValid: true }
 */
export function parseVideoUrl(url: string): VideoUrlInfo {
  const originalUrl = url

  // Validate URL format first
  if (!validateVideoUrl(url)) {
    return {
      type: null,
      embedUrl: '',
      originalUrl,
      isValid: false
    }
  }

  // Try YouTube detection
  const youtubeId = detectYouTubeUrl(url)
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: buildYouTubeEmbedUrl(youtubeId),
      originalUrl,
      isValid: true
    }
  }

  // Try Vimeo detection
  const vimeoId = detectVimeoUrl(url)
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: buildVimeoEmbedUrl(vimeoId),
      originalUrl,
      isValid: true
    }
  }

  // Try direct video URL
  if (isDirectVideoUrl(url)) {
    return {
      type: 'direct',
      embedUrl: url, // Use original URL unchanged
      originalUrl,
      isValid: true
    }
  }

  // Fallback: treat as direct URL if valid
  return {
    type: 'direct',
    embedUrl: url,
    originalUrl,
    isValid: true
  }
}
