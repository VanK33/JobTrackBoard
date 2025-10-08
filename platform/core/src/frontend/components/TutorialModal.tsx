/**
 * TutorialModal Component
 * Modal dialog for displaying tutorial content
 */

import React, { useEffect } from 'react'

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
  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
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
  }, [isOpen, onClose])

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
      onClick={onClose}
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
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
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

        {/* Empty scrollable content area */}
        <div
          style={{
            minHeight: '200px',
            marginTop: '16px',
            color: '#6b7280',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        >
          {/* Empty - ready for future content */}
        </div>
      </div>
    </div>
  )
}

export default TutorialModal
