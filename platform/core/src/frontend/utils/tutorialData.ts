/**
 * Tutorial Data Utility
 *
 * Provides the 5-step tutorial carousel content with placeholder images.
 * Spec: 013-tutorial-popup-3
 */

export interface TutorialStep {
  stepNumber: number;
  title: string;
  imageSrc: string;
  description: string;
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
    title: 'Welcome',
    imageSrc: generatePlaceholder(1),
    description: 'Welcome to the application! This tutorial will guide you through the main features.'
  },
  {
    stepNumber: 2,
    title: 'Navigation',
    imageSrc: generatePlaceholder(2),
    description: 'Use the menu on the left to navigate between different sections of the app.'
  },
  {
    stepNumber: 3,
    title: 'Adding Items',
    imageSrc: generatePlaceholder(3),
    description: 'Click the "Add" button to create new items. Fill out the form and save your changes.'
  },
  {
    stepNumber: 4,
    title: 'Searching',
    imageSrc: generatePlaceholder(4),
    description: 'Use the search bar at the top to quickly find items. Filter results using the dropdown menu.'
  },
  {
    stepNumber: 5,
    title: 'Get Started',
    imageSrc: generatePlaceholder(5),
    description: 'You\'re all set! Click "Finish" to start using the application. You can access this tutorial anytime from the bottom-right corner.'
  }
];
