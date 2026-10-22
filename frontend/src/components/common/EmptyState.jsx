import Button from './Button';

/**
 * Reusable EmptyState component displaying a Stitch neomorphic soft surface, icon, title, description, and optional action.
 */
export const EmptyState = ({
  icon = 'auto_stories',
  title = 'No volumes discovered',
  description = 'There are no catalog records matching your current criteria or selection.',
  actionLabel = null,
  onAction = null,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-surface neo-raised ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface neo-pressed flex items-center justify-center text-primary mb-4">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="text-lg font-headline font-semibold text-on-surface mb-1.5">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
