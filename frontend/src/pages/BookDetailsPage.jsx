import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookById, clearSelectedBook } from '../store/slices/booksSlice';
import { addFavorite, removeFavorite, fetchFavorites } from '../store/slices/favoritesSlice';
import { borrowBook } from '../store/slices/borrowSlice';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import ErrorState from '../components/common/ErrorState';

/**
 * BookDetailsPage (/books/:id)
 * Fetches actual book record from GET /api/books/:id
 * Displays comprehensive bibliographic details, availability statuses,
 * and allows authenticated patron borrowing and favorites curation.
 */
export const BookDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedBook: book, detailLoading: loading, error } = useSelector((state) => state.books);
  const { favorites, actionLoadingId } = useSelector((state) => state.favorites);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Modal & Feedback States
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [borrowDuration, setBorrowDuration] = useState(14);
  const [borrowFormat, setBorrowFormat] = useState('epub');
  const [borrowFeedback, setBorrowFeedback] = useState({ error: '', success: '' });
  const [borrowingLoading, setBorrowingLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

  // Validate ObjectId format (24 hex characters)
  const isValidObjectId = useMemo(() => {
    return /^[0-9a-fA-F]{24}$/.test(id || '');
  }, [id]);

  // Fetch book details on mount or ID change
  useEffect(() => {
    if (isValidObjectId) {
      dispatch(fetchBookById(id));
    }
    return () => {
      dispatch(clearSelectedBook());
    };
  }, [dispatch, id, isValidObjectId]);

  // Sync patron favorites when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, isAuthenticated]);

  // Check if book is already in patron's favorites list
  const isFavorited = useMemo(() => {
    return (favorites || []).some((f) => {
      const fId = f.book?._id || f.book || f._id;
      return fId === id;
    });
  }, [favorites, id]);

  const availableCopies = book?.availableCopies ?? 0;
  const totalCopies = book?.totalCopies ?? 1;
  const isAvailable = availableCopies > 0;

  // Calculate return due date based on chosen duration
  const calculatedDueDate = useMemo(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + Number(borrowDuration));
    return targetDate.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [borrowDuration]);

  // Availability Badge Styling & Semantics
  const availabilityBadge = useMemo(() => {
    if (!isAvailable) {
      return {
        label: 'Checked Out',
        badgeClass: 'text-error bg-error/10 border border-error/20',
        dotClass: 'bg-error',
        subtext: '0 Copies Currently in Stacks',
      };
    }
    if (availableCopies <= 2) {
      return {
        label: `Low Inventory (${availableCopies} left)`,
        badgeClass: 'text-amber-700 bg-amber-500/10 border border-amber-500/20',
        dotClass: 'bg-amber-500',
        subtext: `${availableCopies} of ${totalCopies} Available`,
      };
    }
    return {
      label: 'Available Now',
      badgeClass: 'text-emerald-700 bg-emerald-500/10 border border-emerald-500/20',
      dotClass: 'bg-emerald-500',
      subtext: `${availableCopies} of ${totalCopies} Available`,
    };
  }, [isAvailable, availableCopies, totalCopies]);

  // Toggle Favorite Action (Add or Remove)
  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    setActionFeedback({ type: '', message: '' });

    try {
      if (isFavorited) {
        await dispatch(removeFavorite(id)).unwrap();
        setActionFeedback({
          type: 'success',
          message: `"${book?.title || 'Volume'}" removed from your favorites.`,
        });
      } else {
        await dispatch(addFavorite({ bookId: id, notes: '' })).unwrap();
        setActionFeedback({
          type: 'success',
          message: `"${book?.title || 'Volume'}" added to your favorites shelf.`,
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: typeof err === 'string' ? err : err?.message || 'Failed to update favorites.',
      });
    }
  };

  // Open Borrow Modal with checks
  const handleOpenBorrowModal = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    if (!isAvailable) {
      setActionFeedback({
        type: 'error',
        message: 'No copies of this volume are currently available for lending.',
      });
      return;
    }

    setBorrowDuration(14);
    setBorrowFormat(book.formats?.[0] || 'epub');
    setBorrowFeedback({ error: '', success: '' });
    setBorrowModalOpen(true);
  };

  // Confirm Borrow Action
  const handleConfirmBorrow = async () => {
    if (!book || !isAvailable) return;

    setBorrowingLoading(true);
    setBorrowFeedback({ error: '', success: '' });

    try {
      await dispatch(
        borrowBook({
          bookId: id,
          durationDays: borrowDuration,
          format: borrowFormat,
        })
      ).unwrap();

      const successNotice = `"${book.title}" successfully checked out in ${borrowFormat.toUpperCase()} edition. Due by ${calculatedDueDate}.`;
      setBorrowFeedback({
        error: '',
        success: successNotice,
      });

      setActionFeedback({
        type: 'success',
        message: successNotice,
      });

      // Refresh book data to sync decremented availableCopies in Redux & on screen
      dispatch(fetchBookById(id));

      setTimeout(() => {
        setBorrowModalOpen(false);
      }, 1600);
    } catch (err) {
      setBorrowFeedback({
        error: typeof err === 'string' ? err : err?.message || 'Failed to checkout volume.',
        success: '',
      });
    } finally {
      setBorrowingLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 w-full">
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  // Error State: Invalid ObjectId or 404 / Server Error
  if (!isValidObjectId || error || !book) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <ErrorState
          title={!isValidObjectId ? 'Invalid Archival Identifier' : 'Volume Not Discovered'}
          message={
            !isValidObjectId
              ? `The book identifier "${id}" is not a valid 24-character hexadecimal ObjectId.`
              : typeof error === 'string'
              ? error
              : 'The requested book volume does not exist or has been archived from the active catalog.'
          }
          errorCode={!isValidObjectId ? 'INVALID_ID_FORMAT' : 'BOOK_NOT_FOUND'}
          retryLabel="Return to Catalog"
          onRetry={() => navigate('/books')}
        />
      </div>
    );
  }

  const coverUrl =
    book.coverImage ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8 pb-16">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">home</span>
          Home
        </Link>
        <span className="text-outline text-[12px] font-mono">/</span>
        <Link to="/books" className="hover:text-primary transition-colors">
          Catalog
        </Link>
        <span className="text-outline text-[12px] font-mono">/</span>
        <span className="text-primary font-semibold">{book.genre || 'Literature'}</span>
        <span className="text-outline text-[12px] font-mono">/</span>
        <span className="text-on-surface font-semibold truncate max-w-xs sm:max-w-md">{book.title}</span>
      </nav>

      {/* Persistent Page Feedback Toast/Banner */}
      {actionFeedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800'
              : 'bg-error/10 border border-error/20 text-error'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base">
              {actionFeedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback({ type: '', message: '' })}
            className="text-on-surface-variant hover:text-on-surface p-1"
            title="Dismiss notification"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main Book Showcase: Asymmetric Two-Column Split Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
        {/* LEFT COLUMN: 3D Cover Canvas, Availability Badge & Primary Action Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 3D Rendered Book Canvas Box */}
          <div className="relative w-full rounded-2xl p-8 sm:p-10 bg-surface neo-raised flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Lighting Accents */}
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-tertiary/10 blur-3xl pointer-events-none" />

            {/* Quick Header Overlay: Availability Badge and ISBN */}
            <div className="w-full flex items-center justify-between mb-4 z-10 gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${availabilityBadge.badgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${availabilityBadge.dotClass}`} />
                {availabilityBadge.label}
              </span>
              <span className="text-[11px] font-mono tracking-wider uppercase text-on-surface-variant font-semibold">
                ISBN: {book.ISBN || 'ARCHIVE'}
              </span>
            </div>

            {/* 3D Book Display with Ribbon & Spine Shadow Illusion */}
            <div className="relative group cursor-pointer my-4 py-2">
              {/* Shadow Base Bed */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[85%] h-6 bg-on-surface/15 blur-xl rounded-full" />

              {/* Bookmark Ribbon */}
              <div className="absolute -top-3 right-8 w-5 h-20 bg-primary z-30 shadow-[2px_2px_6px_rgba(0,0,0,0.2)] rounded-t-sm flex flex-col justify-end pointer-events-none">
                <div className="w-full border-b-[8px] border-l-[10px] border-r-[10px] border-b-transparent border-l-primary border-r-primary" />
              </div>

              {/* 3D Book Canvas Body */}
              <div className="relative w-56 sm:w-64 h-80 sm:h-92 rounded-r-xl rounded-l-sm bg-surface overflow-hidden shadow-[14px_14px_28px_rgba(0,0,0,0.18),-6px_-6px_16px_rgba(255,255,255,0.7)] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-1">
                {/* Book Spine Fold & Shadow Strip */}
                <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-on-surface/30 via-transparent to-transparent z-20 pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-2 w-0.5 bg-surface/40 z-20 pointer-events-none" />

                {/* Cover Image */}
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Editorial Typography Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-5 flex flex-col justify-between text-white pointer-events-none">
                  <div className="pt-2">
                    <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-primary">
                      BookSphere Archival Folio
                    </p>
                  </div>
                  <div>
                    <h4 className="font-headline font-semibold text-lg leading-tight tracking-tight text-white m-0">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 font-medium">{book.author}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Catalog Stock Footnote */}
            <div className="mt-3 flex items-center justify-between w-full text-xs text-on-surface-variant z-10 px-1">
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Verified Archival Edition
              </span>
              <span className="text-[11px] font-semibold">
                {availabilityBadge.subtext}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons: Borrow & Favorite */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Borrow Action */}
            <Button
              variant={isAvailable ? 'primary' : 'secondary'}
              size="lg"
              disabled={!isAvailable}
              icon={isAvailable ? 'menu_book' : 'block'}
              className="flex-1"
              onClick={handleOpenBorrowModal}
              title={isAvailable ? 'Check out volume' : 'Currently checked out'}
            >
              {isAvailable ? 'Borrow Book' : 'Checked Out'}
            </Button>

            {/* Favorite Action: Add / Remove Toggle */}
            <Button
              variant={isFavorited ? 'secondary' : 'outline'}
              size="lg"
              icon={isFavorited ? 'favorite' : 'favorite_border'}
              loading={actionLoadingId === id}
              onClick={handleFavoriteToggle}
              className={`shrink-0 ${isFavorited ? 'text-rose-500' : ''}`}
              title={isFavorited ? 'Remove volume from favorites' : 'Add volume to favorites'}
            >
              {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Metadata, Specifications, Synopsis, and Citation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-surface neo-raised space-y-6">
            {/* Header: Badges, Title, and Author */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-surface neo-pressed-sm text-primary text-xs font-bold uppercase tracking-wider">
                  {book.genre || 'Literature'}
                </span>
                <span className="px-3 py-1 rounded-full bg-surface neo-raised-sm text-on-surface-variant text-xs font-semibold">
                  {book.category || 'General'}
                </span>
                <span className="px-3 py-1 rounded-full bg-surface neo-raised-sm text-on-surface-variant text-xs font-semibold">
                  Published: {book.publicationYear || 'N/A'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-headline font-semibold text-on-surface tracking-tight leading-tight m-0">
                {book.title}
              </h1>

              <p className="text-base text-on-surface-variant font-medium">
                authored by <span className="font-bold text-on-surface">{book.author}</span>
              </p>
            </div>

            {/* Metrics Bar: Rating, Status, Copies */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface neo-pressed">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Rating
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">star</span>
                  <span className="text-base font-bold text-on-surface">
                    {Number(book.rating || 4.5).toFixed(1)} / 5.0
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Availability
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${availabilityBadge.dotClass}`} />
                  <span className="text-xs font-bold text-on-surface">
                    {availableCopies} / {totalCopies} copies
                  </span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Status
                </p>
                <p className="text-xs font-bold capitalize text-primary mt-1">
                  {book.status || (isAvailable ? 'available' : 'borrowed')}
                </p>
              </div>
            </div>

            {/* Thematic Synopsis / Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary font-headline m-0 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">subject</span>
                <span>Thematic Synopsis</span>
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                {book.description || 'No synopsis registered for this volume in the catalog archives.'}
              </p>
            </div>

            {/* Archival & Bibliographic Specifications */}
            <div className="space-y-3 pt-2 border-t border-surface-container-high/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary font-headline m-0 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Bibliographic & Archival Details</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-surface neo-pressed-sm">
                {/* ISBN */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    ISBN
                  </span>
                  <span className="text-xs font-mono font-semibold text-on-surface select-all">
                    {book.ISBN || 'N/A'}
                  </span>
                </div>

                {/* Publication Year */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Publication Year
                  </span>
                  <span className="text-xs font-semibold text-on-surface">
                    {book.publicationYear || 'Unknown'}
                  </span>
                </div>

                {/* Publisher */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Publisher
                  </span>
                  <span className="text-xs font-semibold text-on-surface truncate" title={book.publisher}>
                    {book.publisher || 'BookSphere Press'}
                  </span>
                </div>

                {/* Language */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Language
                  </span>
                  <span className="text-xs font-semibold text-on-surface">
                    {book.language || 'English'}
                  </span>
                </div>

                {/* Genre */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Genre
                  </span>
                  <span className="text-xs font-semibold text-on-surface truncate" title={book.genre}>
                    {book.genre || 'Literature'}
                  </span>
                </div>

                {/* Category */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Category
                  </span>
                  <span className="text-xs font-semibold text-on-surface truncate" title={book.category}>
                    {book.category || 'General'}
                  </span>
                </div>

                {/* Available Copies */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Available Copies
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {availableCopies} copies
                  </span>
                </div>

                {/* Total Copies */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Total Inventory
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    {totalCopies} copies
                  </span>
                </div>

                {/* Shelf Location */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Shelf Call
                  </span>
                  <span className="text-xs font-mono font-semibold text-primary truncate" title={book.shelfLocation}>
                    {book.shelfLocation || 'GENERAL-STACKS'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lending Formats Available */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary font-headline m-0">
                Available Lending Formats
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {(book.formats || ['epub', 'audiobook', 'hardcover']).map((fmt) => (
                  <span
                    key={fmt}
                    className="px-3.5 py-1.5 rounded-xl bg-surface neo-raised-sm text-xs font-semibold text-on-surface uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm text-primary">
                      {fmt === 'audio' || fmt === 'audiobook'
                        ? 'headphones'
                        : fmt === 'pdf'
                        ? 'picture_as_pdf'
                        : 'menu_book'}
                    </span>
                    {fmt === 'audio' ? 'Audiobook' : fmt}
                  </span>
                ))}
              </div>
            </div>

            {/* Archival Citation Box */}
            <div className="p-4 rounded-xl bg-surface neo-pressed flex items-start gap-3 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-lg shrink-0">bookmark</span>
              <div>
                <p className="font-semibold text-on-surface">Archival Citation (APA 7th Edition)</p>
                <p className="text-[11px] font-mono mt-0.5">
                  {book.author} ({book.publicationYear || 'n.d.'}). <em>{book.title}</em>. {book.publisher || 'BookSphere Press'}. ISBN: {book.ISBN || 'N/A'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Borrow Confirmation Modal */}
      <Modal
        isOpen={borrowModalOpen}
        onClose={() => !borrowingLoading && setBorrowModalOpen(false)}
        title="Check Out Library Volume"
        subtitle={book?.title}
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
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2.5">
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

              {/* Book Summary Card */}
              <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3.5">
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-on-surface truncate m-0">
                    {book.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">
                    by {book.author} • {book.genre || 'Literature'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-primary">
                    {availableCopies} copies currently available
                  </span>
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Edition Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(book.formats && book.formats.length > 0
                    ? book.formats
                    : ['epub', 'pdf', 'audiobook']
                  ).map((fmt) => (
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
                      {fmt === 'audio' || fmt === 'audiobook' ? 'Audio' : fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface">Loan Duration</label>
                  <span className="text-[11px] text-primary font-semibold">Due: {calculatedDueDate}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 14, 21, 28].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setBorrowDuration(days)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                By confirming this checkout, the volume will be linked to your digital patron account. You may access reading materials directly through your patron dashboard.
              </p>
            </>
          )}
        </div>
      </Modal>

      {/* Authentication Prompt Modal */}
      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="Patron Authentication Required"
        subtitle="Sign in to check out volumes and curate your library shelf"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setLoginModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="login"
              onClick={() => {
                setLoginModalOpen(false);
                navigate('/login', { state: { from: location } });
              }}
            >
              Sign In
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-xl bg-surface neo-pressed flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">
              lock
            </span>
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-on-surface m-0 uppercase tracking-wide">
                Library Membership Benefit
              </h5>
              <p className="text-xs text-on-surface-variant leading-relaxed m-0">
                Borrowing physical and digital editions or saving titles to your reading shelf requires an active BookSphere patron account.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <span className="text-on-surface-variant">Don't have a patron account?</span>
            <button
              type="button"
              onClick={() => {
                setLoginModalOpen(false);
                navigate('/register');
              }}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Register here
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookDetailsPage;
