/**
 * Video Player Component
 * Feature: 022-tutorial-embedding-tutorial
 *
 * Displays embedded videos from YouTube, Vimeo, or direct URLs with error handling.
 *
 * Requirements:
 * - FR-002: Display video in tutorial popup
 * - FR-003: View video without external navigation
 * - FR-004: Full playback controls (play, pause, seek, volume, speed, fullscreen)
 * - FR-005: Error handling with retry button
 * - FR-009: Manual play only (no auto-play)
 * - FR-010: Video always starts from beginning
 *
 * @example
 * <VideoPlayer videoUrl="https://youtube.com/watch?v=abc123" />
 */

import React, { useState } from 'react'
import VideoEmbedder from './VideoEmbedder'
import { parseVideoUrl } from '../utils/videoUrlParser'

/**
 * Props for VideoPlayer component
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
   * @example "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   */
  videoUrl: string

  /**
   * Callback invoked when video fails to load
   *
   * @param error - Human-readable error message
   * @example onError("Video failed to load")
   */
  onError?: (error: string) => void

  /**
   * Optional CSS class for custom styling
   */
  className?: string

  /**
   * ARIA label for accessibility
   *
   * @default "Tutorial video"
   */
  ariaLabel?: string
}

/**
 * Internal error state for VideoPlayer component
 */
export interface VideoErrorState {
  /**
   * Whether an error has occurred during video load
   */
  hasError: boolean

  /**
   * User-friendly error message displayed in error UI
   */
  message: string

  /**
   * Number of retry attempts made by user
   */
  retryCount: number
}

/**
 * VideoPlayer Component
 *
 * Main video player with error handling and retry functionality.
 * Parses video URL, delegates rendering to VideoEmbedder, and manages error states.
 *
 * @param props - VideoPlayerProps
 * @returns React element (VideoEmbedder or error UI)
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onError,
  className,
  ariaLabel = 'Tutorial video'
}) => {
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState<number>(0)

  // Parse video URL to detect type and get embed URL
  const videoInfo = parseVideoUrl(videoUrl)

  // Handle invalid URL
  if (!videoInfo.isValid || videoInfo.type === null) {
    if (!error) {
      const errorMsg = 'Invalid video URL'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }

  // Error handler for video/iframe load failures
  const handleError = () => {
    const errorMsg = 'Video failed to load'
    setError(errorMsg)
    onError?.(errorMsg)
  }

  // Retry handler - clears error and increments key to remount video
  const handleRetry = () => {
    setError(null)
    setRetryKey(prev => prev + 1)
  }

  // Show error UI if error occurred
  if (error) {
    return (
      <div
        className={className}
        style={{
          textAlign: 'center',
          padding: '40px',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <p
          style={{
            color: '#ef4444',
            marginBottom: '16px',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {error}
        </p>
        <button
          onClick={handleRetry}
          aria-label="Retry loading video"
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Retry
        </button>
      </div>
    )
  }

  // Render video embedder (if valid type)
  if (videoInfo.type) {
    return (
      <div className={className} style={{ width: '100%' }}>
        <VideoEmbedder
          embedUrl={videoInfo.embedUrl}
          type={videoInfo.type}
          onError={handleError}
          retryKey={retryKey}
          ariaLabel={ariaLabel}
        />
      </div>
    )
  }

  return null
}

export default VideoPlayer
