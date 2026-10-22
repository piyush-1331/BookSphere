/**
 * Reusable Pagination controls with Silk neomorphic styling.
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 12,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48],
  className = '',
}) => {
  if (totalPages <= 1 && totalItems <= pageSize && !onPageSizeChange) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 select-none ${className}`}
    >
      {/* Metric count and page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant font-medium">
        <div>
          Showing <span className="font-semibold text-on-surface">{startItem}</span> to{' '}
          <span className="font-semibold text-on-surface">{endItem}</span> of{' '}
          <span className="font-semibold text-on-surface">{totalItems}</span> volumes
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-surface-container-high">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Per page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="px-2.5 py-1 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface neo-pressed-sm">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface neo-raised-sm hover:neo-pressed-sm text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 text-center text-outline select-none text-xs font-mono"
            >
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                currentPage === page
                  ? 'bg-surface text-primary neo-pressed-sm font-bold'
                  : 'bg-surface text-on-surface hover:text-primary neo-raised-sm'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface neo-raised-sm hover:neo-pressed-sm text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
