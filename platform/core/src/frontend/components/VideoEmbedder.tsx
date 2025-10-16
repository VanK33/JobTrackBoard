/**
 * Video Embedder Component
 * Feature: 022-tutorial-embedding-tutorial
 *
 * Internal component that renders the appropriate video element (iframe or HTML5 video)
 * based on the detected video type.
 *
 * Requirements:
 * - FR-004: Full playback controls via platform native controls
 * - FR-006: Support YouTube, Vimeo, and direct video URLs
 */

import React from 'react'

/**
 * Video type enumeration
 */
export type VideoType = 'youtube' | 'vimeo' | 'direct'

/**
 * Props for VideoEmbedder component
 */
export interface VideoEmbedderProps {
  /**
   * Processed embed URL ready for rendering
   *
   * For YouTube: https://www.youtube.com/embed/{ID}?controls=1&...
   * For Vimeo: https://player.vimeo.com/video/{ID}?controls=1&...
   * For direct: Original URL unchanged
   */
  embedUrl: string

  /**
   * Video type determined by URL pattern matching
   *
   * Determines rendering strategy:
   * - 'youtube' | 'vimeo': Render as <iframe>
   * - 'direct': Render as <video> element
   */
  type: VideoType

  /**
   * Callback invoked when iframe or video element fails to load
   */
  onError: () => void

  /**
   * Unique key for forcing component remount on retry
   *
   * When incremented, causes React to unmount and remount the video element
   */
  retryKey: number

  /**
   * ARIA label for accessibility
   *
   * @default "Tutorial video"
   */
  ariaLabel?: string
}

/**
 * VideoEmbedder Component
 *
 * Renders YouTube/Vimeo as iframe, or direct URLs as HTML5 video.
 * Provides full playback controls via native player UIs.
 *
 * @param props - VideoEmbedderProps
 * @returns React element (iframe or video)
 */
const VideoEmbedder: React.FC<VideoEmbedderProps> = ({
  embedUrl,
  type,
  onError,
  retryKey,
  ariaLabel = 'Tutorial video'
}) => {
  // Render iframe for YouTube or Vimeo
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
          aspectRatio: '16/9',
          border: 'none',
          borderRadius: '4px'
        }}
      />
    )
  }

  // Render HTML5 video for direct URLs
  return (
    <video
      key={retryKey}
      src={embedUrl}
      controls
      aria-label={ariaLabel}
      onError={onError}
      style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '4px'
      }}
    >
      Your browser does not support the video tag.
    </video>
  )
}

export default VideoEmbedder
