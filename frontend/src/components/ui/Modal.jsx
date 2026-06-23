import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// COMPONENTS/UI/MODAL.JSX - FRONTEND - Modal reutilizavel com design premium
// =============================================================================

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const titleId = useId();
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    const modalElement = modalRef.current;
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const getFocusableElements = () => {
      if (!modalElement) {
        return [];
      }

      return Array.from(modalElement.querySelectorAll(selectors.join(','))).filter(
        (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
      );
    };

    const previousActiveElement = document.activeElement;
    const focusableElements = getFocusableElements();
    const initialFocusTarget = focusableElements[0] || modalElement;

    if (initialFocusTarget) {
      initialFocusTarget.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusable = getFocusableElements();

      if (currentFocusable.length === 0) {
        event.preventDefault();
        modalElement?.focus();
        return;
      }

      const firstElement = currentFocusable[0];
      const lastElement = currentFocusable[currentFocusable.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--surface-overlay)] p-2 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-panel)] shadow-[var(--shadow-lg)] sm:max-h-[calc(100vh-2rem)] sm:rounded-[1.75rem] ${sizes[size]}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(248,242,231,0.92),rgba(255,253,249,0.98))] px-4 py-4 sm:px-6 sm:py-5">
              <h3 id={titleId} className="min-w-0 text-lg font-bold text-[var(--copy-strong)] sm:text-xl">{title}</h3>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-xl p-2 text-[var(--copy-muted)] transition-all duration-200 hover:bg-[var(--surface-panel-soft)] hover:text-[var(--copy-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-panel)]"
                aria-label="Fechar modal"
              >
                <X size={22} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
