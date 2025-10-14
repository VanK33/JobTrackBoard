/**
 * Tutorial Data Contract
 *
 * Type definitions and validation for tutorial step content.
 * Spec: 013-tutorial-popup-3
 * Requirements: FR-002 (5 steps), FR-003 (500x500 images), FR-004 (text below image), FR-011 (placeholders)
 */

/**
 * Single tutorial step structure
 */
export interface TutorialStep {
  /**
   * Step number (1-5, human-readable)
   * Requirement: FR-002 (exactly 5 steps)
   */
  stepNumber: number;

  /**
   * Brief step title (optional, for display)
   * Example: "Welcome", "Navigation", "Get Started"
   */
  title: string;

  /**
   * Image source (data URI with SVG placeholder)
   * Dimensions: 500x500px
   * Format: data:image/svg+xml;charset=UTF-8,<encoded SVG>
   * Requirement: FR-003, FR-011
   */
  imageSrc: string;

  /**
   * Descriptive text (1-2 sentences)
   * Displayed below image (vertical layout)
   * Max length: ~200 characters (guideline)
   * Requirement: FR-004
   */
  description: string;
}

/**
 * Tutorial steps array (fixed length: 5)
 */
export type TutorialSteps = readonly [
  TutorialStep, // Step 1
  TutorialStep, // Step 2
  TutorialStep, // Step 3
  TutorialStep, // Step 4
  TutorialStep  // Step 5
];

/**
 * Validation rules
 */
export const TutorialDataValidation = {
  /**
   * Validate step number is in range 1-5
   */
  isValidStepNumber: (num: number): boolean => {
    return Number.isInteger(num) && num >= 1 && num <= 5;
  },

  /**
   * Validate title is non-empty and within length limits
   */
  isValidTitle: (title: string): boolean => {
    return title.length > 0 && title.length <= 50;
  },

  /**
   * Validate image source is a data URI
   */
  isValidImageSrc: (src: string): boolean => {
    return src.startsWith('data:image/svg+xml');
  },

  /**
   * Validate description is non-empty and within guidelines
   */
  isValidDescription: (desc: string): boolean => {
    return desc.length > 0 && desc.length <= 200;
  },

  /**
   * Validate entire TutorialStep object
   */
  isValidStep: (step: TutorialStep): boolean => {
    return (
      TutorialDataValidation.isValidStepNumber(step.stepNumber) &&
      TutorialDataValidation.isValidTitle(step.title) &&
      TutorialDataValidation.isValidImageSrc(step.imageSrc) &&
      TutorialDataValidation.isValidDescription(step.description)
    );
  },

  /**
   * Validate tutorialSteps array has exactly 5 steps
   */
  isValidStepsArray: (steps: TutorialStep[]): steps is TutorialSteps => {
    return (
      steps.length === 5 &&
      steps.every((step, index) =>
        step.stepNumber === index + 1 &&
        TutorialDataValidation.isValidStep(step)
      )
    );
  }
};

/**
 * Placeholder image generator (utility function contract)
 */
export interface PlaceholderGenerator {
  /**
   * Generate SVG data URI for a given step number
   * @param stepNumber - Step number (1-5)
   * @returns Data URI with 500x500px SVG placeholder
   * Requirement: FR-011 (placeholder images)
   */
  generatePlaceholder: (stepNumber: number) => string;
}

/**
 * Example implementation (for documentation)
 */
export const PlaceholderGeneratorExample: PlaceholderGenerator = {
  generatePlaceholder: (stepNumber: number): string => {
    const svg = `
      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="500" fill="#e5e7eb"/>
        <text
          x="250"
          y="250"
          font-size="48"
          font-family="Arial, sans-serif"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#6b7280"
        >
          Step ${stepNumber}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
  }
};

/**
 * Test data (for contract validation)
 */
export const TutorialDataTestCases = {
  /**
   * Valid tutorial step
   */
  validStep: {
    stepNumber: 1,
    title: 'Welcome',
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22...',
    description: 'Welcome to the tutorial. This will guide you through the app.'
  } as TutorialStep,

  /**
   * Invalid step: stepNumber out of range
   */
  invalidStepNumber: {
    stepNumber: 6, // Invalid: > 5
    title: 'Invalid',
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg...',
    description: 'This step is invalid.'
  } as TutorialStep,

  /**
   * Invalid step: empty title
   */
  invalidTitle: {
    stepNumber: 1,
    title: '', // Invalid: empty
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg...',
    description: 'Valid description.'
  } as TutorialStep,

  /**
   * Invalid step: wrong image format
   */
  invalidImageSrc: {
    stepNumber: 1,
    title: 'Valid',
    imageSrc: 'https://example.com/image.png', // Invalid: not data URI
    description: 'Valid description.'
  } as TutorialStep,

  /**
   * Invalid step: description too long
   */
  invalidDescription: {
    stepNumber: 1,
    title: 'Valid',
    imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg...',
    description: 'A'.repeat(201) // Invalid: > 200 chars
  } as TutorialStep
};

/**
 * Module export contract
 */
export interface TutorialDataModule {
  /**
   * Array of exactly 5 tutorial steps
   * Requirement: FR-002
   */
  tutorialSteps: TutorialSteps;

  /**
   * Utility to generate placeholder images
   * Requirement: FR-011
   */
  generatePlaceholder?: (stepNumber: number) => string;
}
