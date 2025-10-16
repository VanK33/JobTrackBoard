/**
 * TutorialModal Component
 * Modal dialog for displaying 5-step tutorial carousel
 * Spec: 013-tutorial-popup-3, 022-tutorial-embedding-tutorial
 */

import React, { useEffect } from 'react'
import { tutorialSteps } from '../utils/tutorialData'
import { useTutorialState } from '../hooks/useTutorialState'
import VideoPlayer from './VideoPlayer'

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
  const { markAsSeen } = useTutorialState()

  const currentStep = tutorialSteps[0]

  const handleFinish = () => {
    markAsSeen()
    onClose()
  }

  const handleClose = () => {
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
          maxWidth: '1200px',
          width: '95%',
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

        {/* Tutorial content */}
        <div
          style={{
            marginTop: '16px'
          }}
        >
          {/* Video or Image */}
          <div
            style={{
              width: '100%',
              marginBottom: '16px'
            }}
          >
            {currentStep.videoUrl ? (
              <VideoPlayer
                videoUrl={currentStep.videoUrl}
                ariaLabel={`Step ${currentStep.stepNumber}: ${currentStep.title}`}
              />
            ) : (
              <img
                src={currentStep.imageSrc}
                alt={`Step ${currentStep.stepNumber}: ${currentStep.title}`}
                style={{
                  width: '500px',
                  height: '500px',
                  display: 'block',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  margin: '0 auto'
                }}
              />
            )}
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

          {/* Finish Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px'
            }}
          >
            <button
              onClick={handleFinish}
              aria-label="Close tutorial"
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorialModal
