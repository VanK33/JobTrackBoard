/**
 * TutorialModal Component
 * Modal dialog for displaying 5-step tutorial carousel
 * Spec: 013-tutorial-popup-3
 */

import React, { useEffect, useState } from 'react'
import { tutorialSteps } from '../utils/tutorialData'
import { useTutorialState } from '../hooks/useTutorialState'

interface TutorialModalProps {
  /**
   * Controls whether the modal is visible
   * @default false
   */
  isOpen: boolean

  /**
   * Callback invoked when user requests to close the modal
   * Triggered by:
   * - Clicking the close (X) button
   * - Pressing Escape key
   * - Clicking the modal backdrop/overlay
   */
  onClose: () => void
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const { markAsSeen } = useTutorialState()

  const currentStep = tutorialSteps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === 4

  const goToNextStep = () => {
    if (currentStepIndex < 4) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleFinish = () => {
    markAsSeen()
    setCurrentStepIndex(0) // Reset for next open (FR-014)
    onClose()
  }

  const handleClose = () => {
    setCurrentStepIndex(0) // Reset on close (FR-014)
    onClose()
  }

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Render nothing when modal is closed
  if (!isOpen) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
    >
      {/* Modal content box */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '95vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close tutorial"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            lineHeight: 1,
            padding: '4px'
          }}
        >
          ✕
        </button>

        {/* Title */}
        <h2
          id="tutorial-modal-title"
          style={{
            margin: '0 0 16px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827'
          }}
        >
          Tutorial
        </h2>

        {/* Tutorial carousel content */}
        <div
          style={{
            marginTop: '16px'
          }}
        >
          {/* Progress Indicator */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '16px',
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            Step {currentStepIndex + 1} of 5
          </div>

          {/* Image (500x500px, centered) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <img
              src={currentStep.imageSrc}
              alt={`Step ${currentStep.stepNumber}: ${currentStep.title}`}
              style={{
                width: '500px',
                height: '500px',
                display: 'block',
                border: '1px solid #e5e7eb',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Description Text */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '24px',
              color: '#374151'
            }}
          >
            {currentStep.description}
          </p>

          {/* Navigation Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              alignItems: 'center'
            }}
          >
            {!isFirstStep && (
              <button
                onClick={goToPreviousStep}
                aria-label="Go to previous step"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                Previous
              </button>
            )}
            {isFirstStep && <div style={{ flex: 1 }}></div>}
            {!isLastStep ? (
              <button
                onClick={goToNextStep}
                aria-label="Go to next step"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginLeft: 'auto',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                aria-label="Finish tutorial"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginLeft: 'auto',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorialModal
