import BookCard from './BookCard';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';

/**
 * Reusable BookGrid container managing grid layouts, skeleton states, and empty states.
 */
export const BookGrid = ({
  books = [],
  loading = false,
  onBorrowClick = null,
  showBorrowButton = true,
  emptyTitle = 'No volumes discovered',
  emptyDescription = 'There are no catalog books matching your specified filters or search query.',
  emptyActionLabel = null,
  onEmptyAction = null,
  skeletonCount = 8,
  className = '',
}) => {
  if (loading) {
    return <LoadingSkeleton variant="bookGrid" count={skeletonCount} className={className} />;
  }

  if (!books || books.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        className={className}
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}
    >
      {books.map((book) => {
        const key = book._id || book.id;
        return (
          <BookCard
            key={key}
            book={book}
            onBorrowClick={onBorrowClick}
            showBorrowButton={showBorrowButton}
          />
        );
      })}
    </div>
  );
};

export default BookGrid;
