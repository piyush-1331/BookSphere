/**
 * Reusable animated loading skeleton component with Silk neomorphic layout variants.
 */
export const LoadingSkeleton = ({ variant = 'bookGrid', count = 4, className = '' }) => {
  if (variant === 'bookCard') {
    return (
      <div className={`rounded-2xl bg-surface p-4 neo-raised animate-pulse flex flex-col gap-3 ${className}`}>
        <div className="w-full aspect-[3/4] rounded-xl bg-surface-container-high" />
        <div className="flex flex-col gap-2 pt-1">
          <div className="h-4 w-3/4 rounded-lg bg-surface-container-high" />
          <div className="h-3 w-1/2 rounded-lg bg-surface-container" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-16 rounded-full bg-surface-container" />
            <div className="h-6 w-20 rounded-full bg-surface-container" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'bookGrid') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <LoadingSkeleton key={`skel-card-${i}`} variant="bookCard" />
        ))}
      </div>
    );
  }

  if (variant === 'tableRow') {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`skel-row-${i}`}
            className="flex items-center justify-between p-4 rounded-xl bg-surface neo-raised animate-pulse"
          >
            <div className="flex items-center gap-3 w-1/3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high shrink-0" />
              <div className="flex flex-col gap-1.5 w-full">
                <div className="h-3.5 w-3/4 rounded bg-surface-container-high" />
                <div className="h-2.5 w-1/2 rounded bg-surface-container" />
              </div>
            </div>
            <div className="h-3.5 w-24 rounded bg-surface-container" />
            <div className="h-6 w-20 rounded-full bg-surface-container" />
            <div className="h-8 w-24 rounded-lg bg-surface-container-high" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
        <div className="lg:col-span-5 p-8 rounded-2xl bg-surface neo-raised flex flex-col items-center">
          <div className="w-48 aspect-[3/4.2] rounded-xl bg-surface-container-high mb-6" />
          <div className="w-full h-10 rounded-xl bg-surface-container" />
        </div>
        <div className="lg:col-span-7 p-8 rounded-2xl bg-surface neo-raised space-y-4">
          <div className="h-8 w-3/4 rounded bg-surface-container-high" />
          <div className="h-4 w-1/2 rounded bg-surface-container" />
          <div className="h-24 w-full rounded-xl bg-surface-container-low" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl bg-surface neo-raised animate-pulse space-y-4 ${className}`}>
      <div className="h-6 w-1/3 rounded-lg bg-surface-container-high" />
      <div className="h-4 w-full rounded-lg bg-surface-container" />
      <div className="h-4 w-5/6 rounded-lg bg-surface-container" />
    </div>
  );
};

export default LoadingSkeleton;
