/**
 * Tutorial Data Utility
 *
 * Provides the 5-step tutorial carousel content with placeholder images and optional videos.
 * Spec: 013-tutorial-popup-3, 022-tutorial-embedding-tutorial
 */

export interface TutorialStep {
  stepNumber: number;
  title: string;
  imageSrc: string;
  description: string;
  /**
   * Optional video URL for tutorial step
   *
   * Supported formats:
   * - YouTube: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
   * - Vimeo: https://vimeo.com/VIDEO_ID
   * - Direct URLs: https://example.com/video.mp4 or .webm
   *
   * When present, video is displayed instead of image.
   * Image serves as fallback if video fails to load.
   *
   * @example "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   */
  videoUrl?: string;
}

function generatePlaceholder(stepNumber: number): string {
  const svg = `<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
    <rect width="500" height="500" fill="#e5e7eb"/>
    <text x="250" y="250" font-size="48" font-family="Arial, sans-serif" text-anchor="middle" dominant-baseline="middle" fill="#6b7280">
      Step ${stepNumber}
    </text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

export const tutorialSteps: TutorialStep[] = [
  {
    stepNumber: 1,
    title: 'Tutorial',
    imageSrc: generatePlaceholder(1),
    description: 'Watch this video to learn how to use the application.',
    videoUrl: 'https://www.youtube.com/watch?v=agGze8YiydQ'
  }
];
