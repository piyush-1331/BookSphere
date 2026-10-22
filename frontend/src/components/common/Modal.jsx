import { useEffect } from 'react';

/**
 * Reusable accessible Modal dialog with Silk neomorphic styling, backdrop blur, and ESC handling.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle = null,
  children,
  footer = null,
  maxWidth = 'max-w-xl',
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/35 backdrop-blur-sm transition-opacity"
        onClick={() => closeOnBackdrop && onClose()}
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${maxWidth} rounded-2xl bg-surface neo-raised-modal border border-surface-container-high/80 overflow-hidden transform transition-all z-10 my-8`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high/70 bg-surface">
          <div>
            <h3 className="text-base sm:text-lg font-headline font-semibold text-on-surface leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface neo-raised-sm hover:neo-pressed-sm flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-surface-container-high/70 bg-surface">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
