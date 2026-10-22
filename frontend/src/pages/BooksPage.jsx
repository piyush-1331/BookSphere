import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks } from '../store/slices/booksSlice';
import { borrowBook } from '../store/slices/borrowSlice';
import { fetchFavorites } from '../store/slices/favoritesSlice';

import SearchBar from '../components/books/SearchBar';
import FilterPanel from '../components/books/FilterPanel';
import BookGrid from '../components/books/BookGrid';
import Pagination from '../components/common/Pagination';
import ErrorState from '../components/common/ErrorState';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

export const BooksPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux books slice state
  const { books, pagination, loading, error } = useSelector((state) => state.books);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Modal state for borrowing
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState(null);
  const [borrowDuration, setBorrowDuration] = useState(14);
  const [borrowFormat, setBorrowFormat] = useState('epub');
  const [borrowFeedback, setBorrowFeedback] = useState({ error: '', success: '' });
  const [borrowingLoading, setBorrowingLoading] = useState(false);

  // Extract filter and search state directly from URL search parameters
  const currentQuery = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      title: searchParams.get('title') || '',
      genre: searchParams.get('genre') || '',
      category: searchParams.get('category') || '',
      author: searchParams.get('author') || '',
      availability:
        searchParams.get('availability') || searchParams.get('available') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      order: searchParams.get('order') || 'desc',
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
      limit: Math.max(1, parseInt(searchParams.get('limit') || '12', 10)),
    };
  }, [searchParams]);

  // Synchronize catalog with API whenever URL search params change
  useEffect(() => {
    dispatch(fetchBooks(currentQuery));
  }, [dispatch, currentQuery]);

  // Ensure favorites are populated for authenticated patrons
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, isAuthenticated]);

  // Search handler supporting title, author, and general keyword modes
  const handleSearch = ({ term, type = 'general' }) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    nextParams.delete('title');

    if (type === 'title') {
      if (term) nextParams.set('title', term);
    } else if (type === 'author') {
      if (term) nextParams.set('author', term);
      else nextParams.delete('author');
    } else {
      if (term) nextParams.set('search', term);
    }

    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  // Filter change handler (updates parameters and resets to page 1)
  const handleFilterChange = (filterUpdates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(filterUpdates).forEach(([key, val]) => {
      if (val && val !== 'all' && val !== 'All Genres' && val !== 'All Categories') {
        nextParams.set(key, val);
      } else {
        nextParams.delete(key);
      }
    });
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  // Reset all filters and search query parameters
  const handleResetFilters = () => {
    setSearchParams({});
  };

  // Pagination page change handler
  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newPage > 1) {
      nextParams.set('page', String(newPage));
    } else {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Page limit (items per page) change handler
  const handleLimitChange = (newLimit) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newLimit !== 12) {
      nextParams.set('limit', String(newLimit));
    } else {
      nextParams.delete('limit');
    }
    nextParams.delete('page');
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Borrow Modal Handlers
  const handleOpenBorrowModal = (book) => {
    setSelectedBookForBorrow(book);
    setBorrowDuration(14);
    setBorrowFormat(book.formats?.[0] || 'epub');
    setBorrowFeedback({ error: '', success: '' });
    setBorrowModalOpen(true);
  };

  const handleConfirmBorrow = async () => {
    if (!selectedBookForBorrow) return;
    setBorrowingLoading(true);
    setBorrowFeedback({ error: '', success: '' });

    try {
      await dispatch(
        borrowBook({
          bookId: selectedBookForBorrow._id || selectedBookForBorrow.id,
          durationDays: borrowDuration,
          format: borrowFormat,
        })
      ).unwrap();

      setBorrowFeedback({
        error: '',
        success: `"${selectedBookForBorrow.title}" successfully checked out! Due in ${borrowDuration} days.`,
      });

      // Refresh catalog list to reflect decremented availability
      dispatch(fetchBooks(currentQuery));

      setTimeout(() => {
        setBorrowModalOpen(false);
        setSelectedBookForBorrow(null);
      }, 1600);
    } catch (err) {
      setBorrowFeedback({
        error: typeof err === 'string' ? err : err?.message || 'Failed to borrow volume.',
        success: '',
      });
    } finally {
      setBorrowingLoading(false);
    }
  };

  const totalResults = pagination?.total ?? books.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 w-full flex flex-col gap-8 pb-16">
      {/* Editorial Header Section with tactile index badge */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-primary bg-surface neo-pressed-sm tracking-wider uppercase">
              Archival Registry
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              / Collective Municipal Stacks
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-headline font-semibold text-on-surface tracking-tight m-0">
            Book Catalog Directory
          </h1>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
            Search and discover curated physical volumes, digital e-books, and audiobooks across our library network.
          </p>
        </div>

        {/* Total Results Metric Pill */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="px-5 py-3 rounded-2xl bg-surface neo-raised flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Catalog Index
              </span>
              <span className="text-sm font-semibold text-on-surface font-headline">
                {totalResults} {totalResults === 1 ? 'volume' : 'volumes'} found
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Multi-Scope Search Bar: Title, Author, or General Keyword */}
      <section aria-label="Search Catalog" className="w-full">
        <SearchBar
          search={currentQuery.search}
          title={currentQuery.title}
          author={currentQuery.author}
          onSearch={handleSearch}
          className="w-full max-w-3xl"
        />
      </section>

      {/* Filter and Sorting Panel */}
      <section aria-label="Catalog Filters">
        <FilterPanel
          filters={currentQuery}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />
      </section>

      {/* Book Catalog Grid & States */}
      <section aria-label="Catalog Volumes">
        {error ? (
          <ErrorState
            title="Archival Communication Notice"
            message={typeof error === 'string' ? error : 'Unable to retrieve books catalog at this time.'}
            retryLabel="Retry Catalog Query"
            onRetry={() => dispatch(fetchBooks(currentQuery))}
          />
        ) : (
          <div className="space-y-8">
            <BookGrid
              books={books}
              loading={loading}
              onBorrowClick={isAuthenticated ? handleOpenBorrowModal : null}
              showBorrowButton={true}
              skeletonCount={currentQuery.limit}
              emptyTitle="No Catalog Volumes Discovered"
              emptyDescription="We could not find any books matching your specific search query or active filter criteria. Try broadening your keywords or clearing selected filters."
              emptyActionLabel="Reset All Filters"
              onEmptyAction={handleResetFilters}
            />

            {/* Pagination Controls with Page Size / Limit Selector */}
            {!loading && books.length > 0 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={handlePageChange}
                onPageSizeChange={handleLimitChange}
              />
            )}
          </div>
        )}
      </section>

      {/* Borrow Book Modal (Authenticated Checkout) */}
      <Modal
        isOpen={borrowModalOpen}
        onClose={() => !borrowingLoading && setBorrowModalOpen(false)}
        title="Check Out Library Volume"
        subtitle={selectedBookForBorrow?.title}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={borrowingLoading}
              onClick={() => setBorrowModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="menu_book"
              loading={borrowingLoading}
              onClick={handleConfirmBorrow}
            >
              Confirm Checkout
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          {borrowFeedback.success ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>{borrowFeedback.success}</span>
            </div>
          ) : (
            <>
              {borrowFeedback.error && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{borrowFeedback.error}</span>
                </div>
              )}

              {selectedBookForBorrow && (
                <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3.5">
                  <img
                    src={
                      selectedBookForBorrow.coverImage ||
                      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={selectedBookForBorrow.title}
                    className="w-12 h-16 object-cover rounded shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface truncate m-0">
                      {selectedBookForBorrow.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      by {selectedBookForBorrow.author} • {selectedBookForBorrow.genre || 'Literature'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary">
                      {selectedBookForBorrow.availableCopies > 0
                        ? `${selectedBookForBorrow.availableCopies} Copies Available`
                        : 'Currently Checked Out'}
                    </span>
                  </div>
                </div>
              )}

              {/* Format selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Edition Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['epub', 'pdf', 'audio'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setBorrowFormat(fmt)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                        borrowFormat === fmt
                          ? 'bg-surface text-primary neo-pressed-sm'
                          : 'bg-surface text-on-surface-variant neo-raised-sm hover:text-on-surface'
                      }`}
                    >
                      {fmt === 'audio' ? 'Audiobook' : fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Loan Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 21].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setBorrowDuration(days)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                        borrowDuration === days
                          ? 'bg-surface text-primary neo-pressed-sm'
                          : 'bg-surface text-on-surface-variant neo-raised-sm hover:text-on-surface'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BooksPage;
