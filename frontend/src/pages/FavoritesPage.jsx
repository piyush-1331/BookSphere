import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFavorites } from '../store/slices/favoritesSlice';
import { borrowBook } from '../store/slices/borrowSlice';
import { fetchBookById } from '../store/slices/booksSlice';
import BookGrid from '../components/books/BookGrid';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Modal from '../components/common/Modal';

/**
 * FavoritesPage (/favorites)
 * Displays the authenticated patron's personal saved volumes.
 * Supports:
 * - Real backend synchronization with GET/POST/DELETE /api/favorites
 * - Safe handling for deleted/deactivated book volumes
 * - Real-time Redux state management
 * - In-shelf search and availability filters
 * - Direct checkout borrowing workflow
 */
export const FavoritesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { favorites, loading, error } = useSelector((state) => state.favorites);

  const [activeTab, setActiveTab] = useState('all');
  const [shelfSearch, setShelfSearch] = useState('');
  const [feedbackToast, setFeedbackToast] = useState({ type: '', message: '' });

  // Borrow Modal State
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState(null);
  const [borrowDuration, setBorrowDuration] = useState(14);
  const [borrowFormat, setBorrowFormat] = useState('epub');
  const [borrowFeedback, setBorrowFeedback] = useState({ error: '', success: '' });
  const [borrowingLoading, setBorrowingLoading] = useState(false);

  // Require authentication: redirect to login if session is expired
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch patron favorites on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, isAuthenticated]);

  // Safely extract populated book objects from favorites, discarding deleted or null records
  const validFavoriteBooks = useMemo(() => {
    return (favorites || [])
      .map((fav) => {
        if (!fav) return null;
        const bookObj = fav.book;
        // Verify bookObj is a populated object with a valid ID
        if (!bookObj || typeof bookObj !== 'object' || !bookObj._id) return null;
        // Exclude archived or deactivated catalog books
        if (bookObj.status === 'archived') return null;
        return bookObj;
      })
      .filter(Boolean);
  }, [favorites]);

  // Count available and waitlisted titles
  const availableCount = useMemo(() => {
    return validFavoriteBooks.filter((b) => (b.availableCopies || 0) > 0).length;
  }, [validFavoriteBooks]);

  const waitlistCount = useMemo(() => {
    return validFavoriteBooks.filter((b) => (b.availableCopies || 0) === 0).length;
  }, [validFavoriteBooks]);

  // Filter books based on active tab and search query
  const filteredBooks = useMemo(() => {
    return validFavoriteBooks.filter((book) => {
      if (shelfSearch.trim()) {
        const q = shelfSearch.toLowerCase().trim();
        const matchesQuery =
          book.title?.toLowerCase().includes(q) ||
          book.author?.toLowerCase().includes(q) ||
          book.genre?.toLowerCase().includes(q) ||
          book.ISBN?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (activeTab === 'available') return (book.availableCopies || 0) > 0;
      if (activeTab === 'waitlist') return (book.availableCopies || 0) === 0;
      return true;
    });
  }, [validFavoriteBooks, shelfSearch, activeTab]);

  // Borrow Modal Handlers
  const handleOpenBorrowModal = (book) => {
    if (!book || (book.availableCopies || 0) <= 0) return;
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

    const bookId = selectedBookForBorrow._id || selectedBookForBorrow.id;

    try {
      await dispatch(
        borrowBook({
          bookId,
          durationDays: borrowDuration,
          format: borrowFormat,
        })
      ).unwrap();

      const successNotice = `"${selectedBookForBorrow.title}" checked out successfully! Due in ${borrowDuration} days.`;
      setBorrowFeedback({
        error: '',
        success: successNotice,
      });

      setFeedbackToast({
        type: 'success',
        message: successNotice,
      });

      // Synchronize book and favorites data
      dispatch(fetchFavorites());
      dispatch(fetchBookById(bookId));

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

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="patron" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* Header & Editorial Breadth */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase text-primary bg-surface neo-pressed-sm">
                Archival Folio • Personal Shelf
              </span>
              <span className="text-xs font-mono text-outline">WISHLIST CURATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-semibold tracking-tight text-on-surface leading-tight m-0">
              Favorites &amp; Reading Wishlist
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Curate preferred reading volumes, monitor physical and digital catalog availability in real time, and borrow directly from your personal collection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon="explore"
              onClick={() => navigate('/books')}
            >
              Browse Catalog
            </Button>
            <Button
              variant="outline"
              size="md"
              icon="auto_awesome"
              onClick={() => navigate('/recommendations')}
            >
              AI Suggestions
            </Button>
          </div>
        </section>

        {/* Global Feedback Banner */}
        {feedbackToast.message && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium transition-all ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800'
                : 'bg-error/10 border border-error/20 text-error'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">
                {feedbackToast.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{feedbackToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast({ type: '', message: '' })}
              className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Metric Pills & Shelf Health Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface neo-raised flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-primary neo-pressed-sm shrink-0">
              <span className="material-symbols-outlined text-[24px]">collections_bookmark</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-headline font-semibold text-on-surface tracking-tight leading-none">
                {validFavoriteBooks.length}
              </div>
              <div className="text-xs text-on-surface-variant font-medium mt-1 truncate">Volumes Saved</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-emerald-600 neo-pressed-sm shrink-0">
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-headline font-semibold text-on-surface tracking-tight leading-none">
                {availableCount}
              </div>
              <div className="text-xs text-on-surface-variant font-medium mt-1 truncate">Available Now</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-amber-600 neo-pressed-sm shrink-0">
              <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-headline font-semibold text-on-surface tracking-tight leading-none">
                {waitlistCount}
              </div>
              <div className="text-xs text-on-surface-variant font-medium mt-1 truncate">On Waitlist / Holds</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-tertiary neo-pressed-sm shrink-0">
              <span className="material-symbols-outlined text-[24px]">sync</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-headline font-semibold text-on-surface tracking-tight leading-none">
                Active
              </div>
              <div className="text-xs text-on-surface-variant font-medium mt-1 truncate">Cloud Sync Active</div>
            </div>
          </div>
        </section>

        {/* Shelf Tabs & Search Controls */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-surface text-primary neo-pressed-sm'
                  : 'bg-surface text-on-surface-variant hover:text-on-surface neo-raised-sm'
              }`}
            >
              All Saved ({validFavoriteBooks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'available'
                  ? 'bg-surface text-primary neo-pressed-sm'
                  : 'bg-surface text-on-surface-variant hover:text-on-surface neo-raised-sm'
              }`}
            >
              Available Now ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('waitlist')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'waitlist'
                  ? 'bg-surface text-primary neo-pressed-sm'
                  : 'bg-surface text-on-surface-variant hover:text-on-surface neo-raised-sm'
              }`}
            >
              Waitlist ({waitlistCount})
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface neo-pressed-input max-w-xs w-full">
            <span className="material-symbols-outlined text-[18px] text-outline">search</span>
            <input
              type="text"
              value={shelfSearch}
              onChange={(e) => setShelfSearch(e.target.value)}
              placeholder="Search in favorites..."
              className="bg-transparent border-0 outline-none text-xs text-on-surface placeholder:text-outline w-full font-medium"
            />
            {shelfSearch && (
              <button
                type="button"
                onClick={() => setShelfSearch('')}
                className="text-outline hover:text-on-surface text-xs cursor-pointer p-0.5"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* Favorites Content: Loading, Error, Empty, or BookGrid */}
        {loading ? (
          <LoadingSkeleton variant="bookGrid" count={8} />
        ) : error ? (
          <ErrorState
            title="Failed to Load Favorites"
            message={typeof error === 'string' ? error : 'Unable to retrieve your favorites shelf at this time.'}
            retryLabel="Retry"
            onRetry={() => dispatch(fetchFavorites())}
          />
        ) : filteredBooks.length === 0 ? (
          <EmptyState
            icon="favorite_border"
            title={validFavoriteBooks.length === 0 ? 'Your favorites shelf is empty' : 'No matching favorites'}
            description={
              validFavoriteBooks.length === 0
                ? "You haven't saved any books to your favorites shelf yet. Explore our library catalog and click the heart on any title to curate your wishlist."
                : 'No saved books match your current filter or search criteria.'
            }
            actionLabel={validFavoriteBooks.length === 0 ? 'Explore Catalog' : 'Clear Search'}
            onAction={() => {
              if (validFavoriteBooks.length === 0) {
                navigate('/books');
              } else {
                setShelfSearch('');
                setActiveTab('all');
              }
            }}
          />
        ) : (
          <BookGrid
            books={filteredBooks}
            loading={false}
            onBorrowClick={handleOpenBorrowModal}
            showBorrowButton={true}
          />
        )}
      </main>

      {/* Borrow Confirmation Modal */}
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
                <div className="p-3.5 rounded-xl bg-surface neo-pressed flex items-center gap-3">
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
                  {['epub', 'pdf', 'audiobook'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setBorrowFormat(fmt)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                        borrowFormat === fmt
                          ? 'bg-surface text-primary neo-pressed-sm'
                          : 'bg-surface text-on-surface-variant neo-raised-sm hover:text-on-surface'
                      }`}
                    >
                      {fmt === 'audiobook' ? 'Audio' : fmt.toUpperCase()}
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
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

export default FavoritesPage;
