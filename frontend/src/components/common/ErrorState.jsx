import Button from './Button';

/**
 * Reusable ErrorState component with alert graphic, error message, and retry button in Silk neomorphic style.
 */
export const ErrorState = ({
  title = 'An unexpected error occurred',
  message = 'We encountered an issue communicating with the BookSphere archival service.',
  errorCode = null,
  onRetry = null,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-surface neo-raised ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface neo-pressed flex items-center justify-center text-error mb-4">
        <span className="material-symbols-outlined text-[32px]">warning</span>
      </div>
      <h3 className="text-lg font-headline font-semibold text-on-surface mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-md mb-2 leading-relaxed">
        {message}
      </p>
      {errorCode && (
        <span className="inline-block px-3 py-1 rounded-lg bg-surface neo-pressed-sm text-error text-xs font-mono font-semibold mb-6">
          ERR::{errorCode}
        </span>
      )}
      {onRetry && (
        <Button variant="danger" onClick={onRetry} icon="refresh">
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
