import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import MarkdownRenderer from './MarkdownRenderer';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  jobTitle?: string;
}

export default function DescriptionModal({
  isOpen,
  onClose,
  description,
  jobTitle,
}: DescriptionModalProps) {
  // Handle scroll lock
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore scroll
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('width');
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) {
    return null;
  }

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    content: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      width: '80%',
      maxWidth: '1200px',
      height: '90%',
      maxHeight: '800px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      padding: '24px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
    },
    title: {
      fontSize: '1.5em',
      fontWeight: 'bold',
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#666666',
      padding: '8px',
      lineHeight: '1',
      transition: 'color 0.2s',
    },
    closeButtonHover: {
      color: '#333333',
    },
    body: {
      flex: 1,
      padding: '24px',
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
    },
  };

  const modalContent = (
    <div
      style={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={jobTitle ? 'modal-title' : undefined}
    >
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          {jobTitle && (
            <h2 id="modal-title" style={styles.title}>
              {jobTitle}
            </h2>
          )}
          {!jobTitle && <div />}
          <button
            style={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = styles.closeButtonHover.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = styles.closeButton.color;
            }}
          >
            ×
          </button>
        </div>
        <div style={styles.body}>
          {description ? (
            <MarkdownRenderer content={description} />
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No description available
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
