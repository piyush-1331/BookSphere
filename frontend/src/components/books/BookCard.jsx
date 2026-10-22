import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addFavorite, removeFavorite } from '../../store/slices/favoritesSlice';

/**
 * Reusable BookCard displaying Stitch 3D book covers, spine shadows, tactile controls,
 * availability status badges, View Details link, and Redux favorite toggling.
 */
export const BookCard = ({ book, onBorrowClick = null, showBorrowButton = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { favorites, actionLoadingId } = useSelector((state) => state.favorites);
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!book) return null;

  const bookId = book._id || book.id;
  const isFavorited = (favorites || []).some((f) => {
    const fId = f.book?._id || f.book || f._id;
    return fId === bookId;
  });

  const isFavoriteLoading = actionLoadingId === bookId;
  const availableCopies = book.availableCopies ?? 0;
  const isAvailable = availableCopies > 0;

  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isFavorited) {
      dispatch(removeFavorite(bookId));
    } else {
      dispatch(addFavorite({ bookId, notes: '' }));
    }
  };

  const coverUrl =
    book.coverImage ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group relative rounded-2xl bg-surface p-4 shadow-[6px_6px_14px_rgba(0,0,0,0.07),-6px_-6px_14px_rgba(255,255,255,0.8)] hover:shadow-[8px_8px_18px_rgba(0,0,0,0.09),-8px_-8px_18px_rgba(255,255,255,0.95)] transition-all flex flex-col justify-between">
      <div className="flex flex-col gap-3">
        {/* 3D Book Elevation & Spine Illusion */}
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),4px_6px_12px_rgba(0,0,0,0.18)] flex items-center justify-center bg-surface-container">
          <img
            src={coverUrl}
            alt={book.title || 'Book cover'}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Book Spine Shadow Illusion */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none" />

          {/* Availability Status Badge */}
          <div
            className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md shadow-[2px_2px_5px_rgba(0,0,0,0.12)] text-[10px] font-semibold ${
              isAvailable
                ? availableCopies > 3
                  ? 'text-primary'
                  : 'text-amber-600'
                : 'text-error'
            }`}
          >
            {isAvailable
              ? availableCopies > 3
                ? 'Available Now'
                : `${availableCopies} Copies Left`
              : 'Checked Out'}
          </div>

          {/* Favorite Toggle Action Button */}
          <button
            type="button"
            onClick={handleFavoriteToggle}
            disabled={isFavoriteLoading}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center bg-surface/90 backdrop-blur-md shadow-[2px_2px_5px_rgba(0,0,0,0.12)] transition-all ${
              isFavorited
                ? 'text-rose-500 font-fill'
                : 'text-on-surface-variant hover:text-rose-500'
            }`}
            title={
              !isAuthenticated
                ? 'Sign in to add to favorites'
                : isFavorited
                ? 'Remove from favorites'
                : 'Add to favorites'
            }
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span className={`material-symbols-outlined text-[17px] ${isFavorited ? 'font-fill' : ''}`}>
              favorite
            </span>
          </button>
        </div>

        {/* Metadata Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
            <span className="text-tertiary font-semibold uppercase tracking-wider text-[10px] truncate max-w-[130px]">
              {book.genre || 'Literature'}
            </span>
            <span className="flex items-center gap-0.5 text-on-surface font-semibold shrink-0">
              <span className="material-symbols-outlined text-[13px] text-amber-500 font-fill">
                star
              </span>
              <span>{Number(book.rating || 4.8).toFixed(1)}</span>
            </span>
          </div>

          <Link
            to={`/books/${bookId}`}
            className="text-sm font-semibold text-on-surface font-headline leading-snug line-clamp-1 hover:text-primary transition-colors"
            title={book.title}
          >
            {book.title}
          </Link>
          <p className="text-xs text-on-surface-variant font-medium truncate">
            {book.author || 'Unknown Author'}
          </p>
        </div>
      </div>

      {/* Action Footer Buttons: View Details & Optional Borrow */}
      <div className="flex items-center gap-2 pt-4 mt-2">
        <Link
          to={`/books/${bookId}`}
          className="flex-1 py-2 px-3 rounded-xl bg-surface shadow-[3px_3px_7px_rgba(0,0,0,0.07),-3px_-3px_7px_rgba(255,255,255,0.8)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] text-primary text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[15px]">info</span>
          <span>View Details</span>
        </Link>

        {showBorrowButton && onBorrowClick && isAvailable && (
          <button
            type="button"
            onClick={() => onBorrowClick(book)}
            className="py-2 px-3 rounded-xl bg-surface shadow-[3px_3px_7px_rgba(0,0,0,0.07),-3px_-3px_7px_rgba(255,255,255,0.8)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] text-on-surface hover:text-primary text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
            title="Check out volume"
          >
            <span className="material-symbols-outlined text-[15px]">menu_book</span>
            <span className="hidden sm:inline">Borrow</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;
