import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations } from '../store/slices/recommendationSlice';
import { addFavorite, removeFavorite, fetchFavorites } from '../store/slices/favoritesSlice';
import { borrowBook } from '../store/slices/borrowSlice';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Modal from '../components/common/Modal';

/**
 * RecommendationsPage (/recommendations)
 *
 * Flow:
 * React -> Express POST /api/recommendations -> FastAPI POST /api/recommendations -> Express -> React
 *
 * Requirements:
 * 1. Require authentication (redirects to /login preserving state).
 * 2. Fetch recommendations from the real Express endpoint (never calling FastAPI directly).
 * 3. Never expose AI_SERVICE_TOKEN in client.
 * 4. Show a useful empty state when there is insufficient user history.
 * 5. Show loading skeletons.
 * 6. Handle FastAPI service errors gracefully with retry and catalog fallback.
 * 7. Allow the user to open book details (/books/:id).
 * 8. Keep recommendations synchronized with current availability.
 * 9. Explicitly disclaim that recommendations are NOT scientifically validated.
 */
export const RecommendationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Redux Store
  const { isAuthenticated, initializing, user } = useSelector((state) => state.auth);
  const {
    items,
    strategy,
    isPersonalized,
    isFallback,
    disclaimer,
    loading,
    error,
  } = useSelector((state) => state.recommendations);
  const { favorites } = useSelector((state) => state.favorites);
  const { myBorrows } = useSelector((state) => state.borrow);

  // Local Controls & State
  const [allowFallback, setAllowFallback] = useState(true);
  const [selectedLimit, setSelectedLimit] = useState(9);
  const [preferAvailable, setPreferAvailable] = useState(true);
  const [viewMode, setViewMode] = useState('recommended'); // 'recommended' | 'popular'
  const [feedbackToast, setFeedbackToast] = useState({ type: '', message: '' });

  // Borrow Modal State
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [bookToBorrow, setBookToBorrow] = useState(null);
  const [borrowDuration, setBorrowDuration] = useState(14);
  const [borrowFormat, setBorrowFormat] = useState('epub');
  const [borrowFeedback, setBorrowFeedback] = useState({ error: '', success: '' });
  const [borrowingLoading, setBorrowingLoading] = useState(false);

  // 1. Require authentication: Redirect unauthenticated patrons to login
  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, initializing, navigate, location]);

  // Fetch patron favorites on mount to track wishlist states
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, isAuthenticated]);

  // 2. Fetch recommendations from the Express backend
  const handleFetchRecommendations = useCallback(
    (opts = {}) => {
      if (!isAuthenticated) return;
      const fallbackFlag =
        typeof opts.allowFallback === 'boolean' ? opts.allowFallback : allowFallback;
      const limitVal = opts.limit || selectedLimit;
      const preferAvail =
        typeof opts.preferAvailable === 'boolean' ? opts.preferAvailable : preferAvailable;

      dispatch(
        fetchRecommendations({
          limit: limitVal,
          allowFallback: fallbackFlag,
          preferAvailable: preferAvail,
        })
      );
    },
    [allowFallback, dispatch, isAuthenticated, preferAvailable, selectedLimit]
  );

  useEffect(() => {
    if (isAuthenticated) {
      handleFetchRecommendations();
    }
  }, [handleFetchRecommendations, isAuthenticated]);

  // Check if patron has recorded reading history
  const hasReadingHistory = useMemo(() => {
    const borrowCount = (myBorrows || []).length;
    const favCount = (favorites || []).length;
    const prefCount =
      (user?.preferences?.favorite_genres || []).length +
      (user?.preferences?.favorite_categories || []).length +
      (user?.preferences?.favorite_authors || []).length;
    return borrowCount > 0 || favCount > 0 || prefCount > 0;
  }, [myBorrows, favorites, user]);

  // Check if book is saved in patron favorites
  const isBookFavorited = useCallback(
    (bookId) => {
      if (!bookId) return false;
      return (favorites || []).some((fav) => {
        const bId = fav?.book?._id || fav?.book?.id || fav?.book || fav?._id;
        return bId === bookId;
      });
    },
    [favorites]
  );

  // Toggle favorite status
  const handleToggleFavorite = async (e, book) => {
    e.preventDefault();
    e.stopPropagation();
    if (!book) return;
    const bookId = book._id || book.id;
    if (!bookId) return;

    const favorited = isBookFavorited(bookId);
    try {
      if (favorited) {
        await dispatch(removeFavorite(bookId)).unwrap();
        setFeedbackToast({
          type: 'success',
          message: `"${book.title}" removed from your favorites shelf.`,
        });
      } else {
        await dispatch(
          addFavorite({ bookId, notes: 'Saved from Recommended for You feed' })
        ).unwrap();
        setFeedbackToast({
          type: 'success',
          message: `"${book.title}" added to your favorites shelf.`,
        });
      }
    } catch (favErr) {
      setFeedbackToast({
        type: 'error',
        message: typeof favErr === 'string' ? favErr : 'Failed to update favorite status.',
      });
    }
  };

  // Open Borrow Modal
  const handleOpenBorrowModal = (book) => {
    if (!book || (book.availableCopies || 0) <= 0) return;
    setBookToBorrow(book);
    setBorrowDuration(14);
    setBorrowFormat(book.formats?.[0] || 'epub');
    setBorrowFeedback({ error: '', success: '' });
    setBorrowModalOpen(true);
  };

  // Confirm Borrow Checkout
  const handleConfirmBorrow = async () => {
    if (!bookToBorrow) return;
    setBorrowingLoading(true);
    setBorrowFeedback({ error: '', success: '' });

    const bookId = bookToBorrow._id || bookToBorrow.id;

    try {
      await dispatch(
        borrowBook({
          bookId,
          durationDays: borrowDuration,
          format: borrowFormat,
        })
      ).unwrap();

      const successNotice = `"${bookToBorrow.title}" successfully loaned for ${borrowDuration} days!`;
      setBorrowFeedback({
        error: '',
        success: successNotice,
      });

      setFeedbackToast({
        type: 'success',
        message: successNotice,
      });

      // Close modal after delay
      setTimeout(() => {
        setBorrowModalOpen(false);
        setBookToBorrow(null);
      }, 1600);
    } catch (err) {
      setBorrowFeedback({
        error: typeof err === 'string' ? err : err?.message || 'Failed to check out volume.',
        success: '',
      });
    } finally {
      setBorrowingLoading(false);
    }
  };

  // Separate Hero candidate from remaining grid items
  const heroItem = useMemo(() => (items && items.length > 0 ? items[0] : null), [items]);
  const gridItems = useMemo(
    () => (items && items.length > 1 ? items.slice(1) : []),
    [items]
  );

  // Scientific validation disclaimer
  const scientificDisclaimerText =
    disclaimer ||
    'Educational demonstration recommendation engine based on content-based filtering algorithms. Recommendations are exploratory literary suggestions and not scientifically validated or clinical assessments.';

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="patron" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* ========================================================= */}
        {/* HEADER: Recommended for You & Discovery Controls */}
        {/* ========================================================= */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface neo-pressed-sm text-xs text-primary font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Content-Based Recommendation Engine • Active</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-semibold tracking-tight text-on-surface m-0">
              Recommended for You
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant font-normal leading-relaxed">
              Personalized literary suggestions synthesized from your reading history, borrowing ledger, and genre affinities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon="tune"
              onClick={() => navigate('/profile')}
              title="Configure your reading taste and favorite genres"
            >
              Taste Profile
            </Button>
            <Button
              variant="primary"
              size="md"
              icon="autorenew"
              loading={loading}
              onClick={() => handleFetchRecommendations()}
              title="Request updated recommendation candidates"
            >
              Recalculate
            </Button>
          </div>
        </section>

        {/* Global Toast Feedback */}
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
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* ENGINE STATUS & TRANSPARENCY CONTROLS BAR */}
        {/* ========================================================= */}
        <div className="p-4 rounded-2xl bg-surface neo-raised flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Algorithm:
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface neo-pressed-sm text-primary uppercase">
                {strategy ? strategy.replace(/_/g, ' ') : 'Content-Based Filtering'}
              </span>
            </div>

            {isPersonalized ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface neo-pressed-sm text-emerald-700">
                <span className="material-symbols-outlined text-[15px]">person_check</span>
                Personalized for Patron
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface neo-pressed-sm text-amber-700">
                <span className="material-symbols-outlined text-[15px]">public</span>
                Catalog Popularity Model
              </span>
            )}

            {isFallback && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-800">
                <span className="material-symbols-outlined text-[15px]">alt_route</span>
                Database Fallback Active
              </span>
            )}
          </div>

          {/* Controls: Stock preference & limit */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 text-on-surface-variant cursor-pointer select-none">
              <input
                type="checkbox"
                checked={preferAvailable}
                onChange={(e) => {
                  setPreferAvailable(e.target.checked);
                  handleFetchRecommendations({ preferAvailable: e.target.checked });
                }}
                className="w-4 h-4 rounded text-primary accent-primary"
              />
              <span>Prefer Available in Stacks</span>
            </label>

            <label className="flex items-center gap-2 text-on-surface-variant cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowFallback}
                onChange={(e) => {
                  setAllowFallback(e.target.checked);
                  handleFetchRecommendations({ allowFallback: e.target.checked });
                }}
                className="w-4 h-4 rounded text-primary accent-primary"
              />
              <span>Allow DB Fallback</span>
            </label>

            <select
              value={selectedLimit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setSelectedLimit(newLimit);
                handleFetchRecommendations({ limit: newLimit });
              }}
              className="px-3 py-1.5 bg-surface neo-pressed-input rounded-xl text-on-surface font-medium outline-none cursor-pointer"
            >
              <option value="6">6 results</option>
              <option value="9">9 results</option>
              <option value="12">12 results</option>
              <option value="15">15 results</option>
            </select>
          </div>
        </div>

        {/* ========================================================= */}
        {/* NON-SCIENTIFIC DISCLAIMER NOTICE */}
        {/* ========================================================= */}
        <div className="p-3.5 rounded-xl bg-surface neo-pressed text-on-surface-variant text-xs flex items-start sm:items-center gap-2.5">
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5 sm:mt-0">
            info
          </span>
          <p className="m-0 leading-relaxed font-medium">
            <strong className="text-on-surface font-semibold">Educational Notice: </strong>
            {scientificDisclaimerText}
          </p>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: Loading Skeletons, Error State, Empty State, or Content */}
        {/* ========================================================= */}
        {loading ? (
          <div className="space-y-8">
            {/* Hero Card Skeleton */}
            <div className="rounded-2xl bg-surface neo-raised p-6 lg:p-8 animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 flex justify-center">
                <div className="w-full max-w-[240px] aspect-[2/3] rounded-2xl bg-surface-container-high" />
              </div>
              <div className="lg:col-span-8 space-y-4">
                <div className="h-4 w-32 rounded bg-surface-container-high" />
                <div className="h-8 w-3/4 rounded bg-surface-container-high" />
                <div className="h-4 w-1/2 rounded bg-surface-container" />
                <div className="h-20 w-full rounded-xl bg-surface-container-low" />
                <div className="flex gap-3 pt-2">
                  <div className="h-10 w-32 rounded-xl bg-surface-container-high" />
                  <div className="h-10 w-28 rounded-xl bg-surface-container" />
                </div>
              </div>
            </div>

            {/* Grid Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skel-rec-${i}`}
                  className="rounded-2xl bg-surface p-5 neo-raised animate-pulse space-y-4"
                >
                  <div className="w-full aspect-[3/4] rounded-xl bg-surface-container-high" />
                  <div className="h-4 w-2/3 rounded bg-surface-container-high" />
                  <div className="h-3 w-1/2 rounded bg-surface-container" />
                  <div className="h-14 rounded-xl bg-surface-container-low" />
                  <div className="h-9 rounded-xl bg-surface-container-high" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          /* Graceful Error State */
          <ErrorState
            title="Recommendation Engine Notice"
            message={
              typeof error === 'string'
                ? error
                : 'Unable to communicate with the recommendation engine at this time.'
            }
            retryLabel="Retry with Catalog Fallback"
            onRetry={() => {
              setAllowFallback(true);
              handleFetchRecommendations({ allowFallback: true });
            }}
          />
        ) : !isPersonalized && !hasReadingHistory && viewMode === 'recommended' && items.length > 0 ? (
          /* Useful Empty State when there is Insufficient User History */
          <div className="space-y-6">
            <EmptyState
              icon="psychology"
              title="Insufficient Reading History for Personalization"
              description="Our recommendation algorithms require at least one borrowed book, saved favorite volume, or configured reading preference to calculate your unique literary affinities. Explore our catalog or tune your taste profile to activate your personalized feed."
              actionLabel="Explore Library Catalog"
              onAction={() => navigate('/books')}
            />

            <div className="p-6 rounded-2xl bg-surface neo-raised flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-semibold text-on-surface m-0">
                  Ready to discover books immediately?
                </h3>
                <p className="text-xs text-on-surface-variant m-0">
                  You can explore popular, highly-rated volumes currently in our library stacks while building your reading history.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                icon="explore"
                onClick={() => setViewMode('popular')}
              >
                View Catalog Highlights
              </Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Completely empty candidate state */
          <EmptyState
            icon="psychology"
            title="No Recommended Volumes Available"
            description="Our recommendation engine could not find eligible matches with your current filter criteria. Try adjusting your preferences or exploring our general catalog."
            actionLabel="Explore Catalog"
            onAction={() => navigate('/books')}
          />
        ) : (
          /* Recommendations Display */
          <div className="space-y-12">
            {/* View Mode Switcher if in popular mode */}
            {viewMode === 'popular' && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface neo-pressed text-xs">
                <span className="text-on-surface-variant">
                  Showing <strong>General Catalog Highlights</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode('recommended')}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Back to Personalization Status
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* HERO RECOMMENDATION SPOTLIGHT */}
            {/* ========================================================= */}
            {heroItem && (
              <section className="relative rounded-2xl bg-surface neo-raised p-6 lg:p-10 overflow-hidden">
                <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                {/* Hero Top Bar: Score & Rationale Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-6 relative z-10 border-b border-surface-container-high/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface neo-pressed-sm flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    </div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                      Top Candidate • Recommended for You
                    </span>
                  </div>

                  {typeof heroItem.score === 'number' && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface neo-pressed-sm text-xs font-bold text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      {Math.round(heroItem.score * 100)}% Match Score
                    </div>
                  )}
                </div>

                {/* Hero Grid: Cover, Metadata, Rationale, Availability, Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6 relative z-10">
                  {/* Book Cover */}
                  <div className="lg:col-span-4 flex justify-center">
                    <Link
                      to={`/books/${heroItem.book?._id || heroItem.book?.id || heroItem._id}`}
                      className="relative group p-2.5 rounded-2xl bg-surface neo-raised w-full max-w-[260px] aspect-[2/3] block"
                      title={`Inspect ${heroItem.book?.title || heroItem.title}`}
                    >
                      <img
                        className="w-full h-full object-cover rounded-xl shadow-inner group-hover:scale-102 transition-transform duration-300"
                        src={
                          heroItem.book?.coverImage ||
                          heroItem.coverImage ||
                          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={heroItem.book?.title || heroItem.title || 'Book cover'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent pointer-events-none rounded-l-xl" />
                    </Link>
                  </div>

                  {/* Book Information & Rationale */}
                  <div className="lg:col-span-8 space-y-5">
                    <div className="space-y-2">
                      {/* Genre & Category Match Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {(heroItem.matched_genre || heroItem.book?.genre) && (
                          <span className="px-2.5 py-0.5 rounded-md bg-surface neo-pressed-sm text-[11px] font-semibold text-primary">
                            Genre Match: {heroItem.matched_genre || heroItem.book?.genre}
                          </span>
                        )}
                        {(heroItem.matched_category || heroItem.book?.category) && (
                          <span className="px-2.5 py-0.5 rounded-md bg-surface neo-raised-sm text-[11px] font-semibold text-on-surface-variant">
                            Category: {heroItem.matched_category || heroItem.book?.category}
                          </span>
                        )}
                        {heroItem.matched_author && (
                          <span className="px-2.5 py-0.5 rounded-md bg-surface neo-pressed-sm text-[11px] font-semibold text-tertiary">
                            Author Match: {heroItem.matched_author}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <Link
                        to={`/books/${heroItem.book?._id || heroItem.book?.id || heroItem._id}`}
                        className="text-2xl sm:text-3xl lg:text-4xl font-headline font-semibold text-on-surface hover:text-primary transition-colors tracking-tight leading-tight block m-0"
                      >
                        {heroItem.book?.title || heroItem.title}
                      </Link>

                      {/* Author */}
                      <p className="text-sm sm:text-base font-medium text-on-surface-variant">
                        by{' '}
                        <strong className="text-on-surface font-semibold">
                          {heroItem.book?.author || heroItem.author || 'Unknown Author'}
                        </strong>
                      </p>
                    </div>

                    {/* Recommendation Reason */}
                    <div className="p-4 rounded-xl bg-surface neo-pressed space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <span className="material-symbols-outlined text-[16px]">psychology_alt</span>
                        <span>Discovery Rationale</span>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed m-0 italic">
                        "{heroItem.reason || 'Curated catalog recommendation selected based on thematic relevance.'}"
                      </p>
                    </div>

                    {/* Real-time Availability Badge */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold text-on-surface-variant">Availability:</span>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                          (heroItem.book?.availableCopies ?? 0) > 0
                            ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                            : 'bg-error/10 text-error border border-error/20'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            (heroItem.book?.availableCopies ?? 0) > 0
                              ? 'bg-emerald-500'
                              : 'bg-error'
                          }`}
                        />
                        <span>
                          {(heroItem.book?.availableCopies ?? 0) > 0
                            ? `${heroItem.book.availableCopies} Copies Available in Stacks`
                            : 'Currently Checked Out'}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        variant={
                          (heroItem.book?.availableCopies ?? 0) > 0 ? 'primary' : 'secondary'
                        }
                        size="md"
                        icon="menu_book"
                        disabled={(heroItem.book?.availableCopies ?? 0) <= 0}
                        onClick={() => handleOpenBorrowModal(heroItem.book || heroItem)}
                      >
                        {(heroItem.book?.availableCopies ?? 0) > 0
                          ? 'Borrow Volume'
                          : 'Currently Unavailable'}
                      </Button>

                      <Button
                        variant="secondary"
                        size="md"
                        icon="visibility"
                        onClick={() =>
                          navigate(
                            `/books/${heroItem.book?._id || heroItem.book?.id || heroItem._id}`
                          )
                        }
                      >
                        Inspect Book
                      </Button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, heroItem.book || heroItem)}
                        className={`w-11 h-11 rounded-xl bg-surface neo-raised-sm hover:neo-pressed-sm flex items-center justify-center transition-all cursor-pointer ${
                          isBookFavorited(
                            heroItem.book?._id || heroItem.book?.id || heroItem._id
                          )
                            ? 'text-rose-500'
                            : 'text-on-surface-variant hover:text-rose-500'
                        }`}
                        title={
                          isBookFavorited(
                            heroItem.book?._id || heroItem.book?.id || heroItem._id
                          )
                            ? 'Remove from favorites'
                            : 'Save to favorites'
                        }
                      >
                        <span
                          className={`material-symbols-outlined text-[20px] ${
                            isBookFavorited(
                              heroItem.book?._id || heroItem.book?.id || heroItem._id
                            )
                              ? 'font-fill'
                              : ''
                          }`}
                        >
                          favorite
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* GRID OF ADDITIONAL RECOMMENDATIONS */}
            {/* ========================================================= */}
            {gridItems.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      auto_stories
                    </span>
                    <h2 className="text-xl font-headline font-semibold text-on-surface m-0">
                      Additional Recommended Volumes
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-outline">
                    {gridItems.length} SELECTIONS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridItems.map((item, idx) => {
                    const book = item.book || item;
                    const bookId = book._id || book.id;
                    const availableCopies = book.availableCopies ?? 0;
                    const isAvailable = availableCopies > 0;
                    const favorited = isBookFavorited(bookId);
                    const matchScore =
                      typeof item.score === 'number'
                        ? `${Math.round(item.score * 100)}% Match`
                        : null;

                    return (
                      <div
                        key={bookId || idx}
                        className="bg-surface rounded-2xl neo-raised p-5 flex flex-col justify-between space-y-4 hover:translate-y-[-2px] transition-all"
                      >
                        <div className="space-y-3.5">
                          {/* Book Cover Container */}
                          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-surface neo-pressed p-1">
                            <Link to={`/books/${bookId}`} className="block w-full h-full">
                              <img
                                src={
                                  book.coverImage ||
                                  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'
                                }
                                alt={book.title || 'Book cover'}
                                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80';
                                }}
                              />
                            </Link>

                            {/* Score Pill */}
                            {matchScore && (
                              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-surface/90 backdrop-blur-md neo-raised-sm text-[11px] font-bold text-primary">
                                {matchScore}
                              </span>
                            )}

                            {/* Favorite Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(e, book)}
                              className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
                                favorited
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-surface/80 text-on-surface hover:text-rose-500'
                              }`}
                              title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <span
                                className={`material-symbols-outlined text-[16px] ${
                                  favorited ? 'font-fill' : ''
                                }`}
                              >
                                favorite
                              </span>
                            </button>

                            {/* Book Spine Shadow */}
                            <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/30 to-transparent pointer-events-none rounded-l-lg" />
                          </div>

                          {/* Genre / Category Match Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(item.matched_genre || book.genre) && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                {item.matched_genre || book.genre}
                              </span>
                            )}
                            {(item.matched_category || book.category) && (
                              <span className="text-[10px] text-on-surface-variant font-medium">
                                • {item.matched_category || book.category}
                              </span>
                            )}
                          </div>

                          {/* Title & Author */}
                          <div>
                            <Link
                              to={`/books/${bookId}`}
                              className="font-headline font-semibold text-on-surface text-base line-clamp-1 hover:text-primary transition-colors block m-0"
                              title={book.title}
                            >
                              {book.title}
                            </Link>
                            <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                              by {book.author || 'Unknown Author'}
                            </p>
                          </div>

                          {/* Recommendation Reason */}
                          <div className="p-3 rounded-xl bg-surface neo-pressed text-xs text-on-surface-variant leading-relaxed">
                            <p className="italic line-clamp-2 m-0">
                              "{item.reason || `Curated recommendation for ${book.genre || 'literature'}.`}"
                            </p>
                          </div>

                          {/* Availability Badge */}
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isAvailable
                                  ? 'bg-emerald-500/10 text-emerald-700'
                                  : 'bg-error/10 text-error'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvailable ? 'bg-emerald-500' : 'bg-error'
                                }`}
                              />
                              <span>
                                {isAvailable
                                  ? availableCopies > 3
                                    ? 'Available Now'
                                    : `${availableCopies} Left`
                                  : 'Checked Out'}
                              </span>
                            </span>

                            <span className="text-[11px] font-semibold text-on-surface-variant">
                              ★ {Number(book.rating || 4.8).toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-surface-container-high/60">
                          <Button
                            size="sm"
                            variant={isAvailable ? 'primary' : 'outline'}
                            disabled={!isAvailable}
                            className="flex-1"
                            onClick={() => handleOpenBorrowModal(book)}
                            title={isAvailable ? 'Check out volume' : 'Currently checked out'}
                          >
                            {isAvailable ? 'Borrow' : 'Checked Out'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => navigate(`/books/${bookId}`)}
                          >
                            Inspect
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* BORROW CHECKOUT MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={borrowModalOpen}
        onClose={() => !borrowingLoading && setBorrowModalOpen(false)}
        title="Check Out Recommended Volume"
        subtitle={bookToBorrow?.title}
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
              <span className="material-symbols-outlined text-base text-emerald-600">
                check_circle
              </span>
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

              {bookToBorrow && (
                <div className="p-3.5 rounded-xl bg-surface neo-pressed flex items-center gap-3">
                  <img
                    src={
                      bookToBorrow.coverImage ||
                      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={bookToBorrow.title}
                    className="w-12 h-16 object-cover rounded shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface truncate m-0">
                      {bookToBorrow.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      by {bookToBorrow.author} • {bookToBorrow.genre || 'General'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary">
                      {bookToBorrow.availableCopies > 0
                        ? `${bookToBorrow.availableCopies} Copies Available`
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

export default RecommendationsPage;
