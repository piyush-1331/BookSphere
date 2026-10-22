import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '../store/slices/userSlice';
import { fetchMyBorrows, returnBook, borrowBook } from '../store/slices/borrowSlice';
import { fetchFavorites } from '../store/slices/favoritesSlice';
import { fetchRecommendations } from '../store/slices/recommendationSlice';

import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import BookCard from '../components/books/BookCard';

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux Shared State
  const { user } = useSelector((state) => state.auth);
  const { profile, stats, loading: profileLoading } = useSelector((state) => state.user);
  const { myBorrows, pagination, loading: borrowsLoading } = useSelector(
    (state) => state.borrow
  );
  const { favorites, loading: favoritesLoading } = useSelector((state) => state.favorites);
  const { items: recs, loading: recsLoading } = useSelector((state) => state.recommendations);

  // Return Book Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [loanToReturn, setLoanToReturn] = useState(null);
  const [returnFeedback, setReturnFeedback] = useState({ error: '', success: '' });
  const [returningInProgress, setReturningInProgress] = useState(false);

  // Borrow Book Modal State (from Recommended Books)
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [bookToBorrow, setBookToBorrow] = useState(null);
  const [borrowDuration, setBorrowDuration] = useState(14);
  const [borrowFormat, setBorrowFormat] = useState('epub');
  const [borrowFeedback, setBorrowFeedback] = useState({ error: '', success: '' });
  const [borrowingInProgress, setBorrowingInProgress] = useState(false);

  // Initial authenticated data fetching
  const refreshDashboardData = useCallback(() => {
    dispatch(fetchProfile());
    dispatch(fetchMyBorrows({ limit: 10, sortBy: 'borrowedAt', order: 'desc' }));
    dispatch(fetchFavorites());
    dispatch(fetchRecommendations({ limit: 4, allowFallback: true }));
  }, [dispatch]);

  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  // Derived loan statistics
  const activeLoans = useMemo(() => {
    return (myBorrows || []).filter(
      (loan) => loan.status === 'borrowed' || loan.status === 'overdue' || (!loan.returnedAt && loan.status !== 'returned')
    );
  }, [myBorrows]);

  const overdueLoans = useMemo(() => {
    return (myBorrows || []).filter((loan) => loan.isOverdue || loan.status === 'overdue');
  }, [myBorrows]);

  const totalBorrowedCount = stats?.totalLoansCount ?? pagination?.total ?? (myBorrows || []).length;
  const activeLoansCount = stats?.activeLoansCount ?? activeLoans.length;
  const favoritesCount = stats?.favoritesCount ?? (favorites || []).length;
  const overdueCount = overdueLoans.length;

  const hasBorrowHistory = totalBorrowedCount > 0 || (myBorrows && myBorrows.length > 0);

  // Reading Goal / Challenge Progress
  const booksReadCount = stats?.totalLoansCount ?? 0;
  const challengeTarget = 40;
  const challengePercentage = Math.min(Math.round((booksReadCount / challengeTarget) * 100), 100);

  // Normalize recommended books
  const recommendedBooks = useMemo(() => {
    return (recs || [])
      .map((item) => {
        const bookObj = item.book || item;
        if (!bookObj) return null;
        return {
          ...bookObj,
          _id: bookObj._id || bookObj.id,
          rating: typeof bookObj.rating === 'number' ? bookObj.rating : 4.8,
        };
      })
      .filter((b) => b && (b._id || b.title));
  }, [recs]);

  // Synthesize recent chronological activity from authenticated data
  const recentActivities = useMemo(() => {
    const list = [];

    (myBorrows || []).forEach((loan) => {
      const book = loan.book;
      if (loan.borrowedAt) {
        list.push({
          id: `borrow-${loan._id}`,
          type: 'borrow',
          actionText: 'Checked out volume',
          bookTitle: book?.title || 'Library Volume',
          bookId: book?._id,
          timestamp: new Date(loan.borrowedAt),
          icon: 'menu_book',
          badgeColor: 'text-primary bg-primary/10',
          detail: `Format: ${loan.format?.toUpperCase() || 'EPUB'} • Due ${loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'in 14 days'}`,
        });
      }

      if (loan.returnedAt || loan.status === 'returned') {
        list.push({
          id: `return-${loan._id}`,
          type: 'return',
          actionText: 'Returned to circulation desk',
          bookTitle: book?.title || 'Library Volume',
          bookId: book?._id,
          timestamp: loan.returnedAt ? new Date(loan.returnedAt) : new Date(loan.borrowedAt),
          icon: 'check_circle',
          badgeColor: 'text-emerald-600 bg-emerald-500/10',
          detail: 'Loan completed in good standing',
        });
      }

      if (loan.isOverdue || loan.status === 'overdue') {
        list.push({
          id: `overdue-${loan._id}`,
          type: 'overdue',
          actionText: 'Overdue notice',
          bookTitle: book?.title || 'Library Volume',
          bookId: book?._id,
          timestamp: loan.dueDate ? new Date(loan.dueDate) : new Date(),
          icon: 'warning',
          badgeColor: 'text-error bg-error/10',
          detail: `Due date was ${loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'past due'}. Please return promptly.`,
        });
      }
    });

    (favorites || []).forEach((fav) => {
      const book = fav.book;
      if (book) {
        list.push({
          id: `fav-${fav._id || book._id}`,
          type: 'favorite',
          actionText: 'Saved to favorites shelf',
          bookTitle: book.title || 'Curated Book',
          bookId: book._id,
          timestamp: fav.createdAt ? new Date(fav.createdAt) : null,
          icon: 'bookmark_heart',
          badgeColor: 'text-rose-500 bg-rose-500/10',
          detail: `${book.author ? `by ${book.author} • ` : ''}${book.genre || 'General Catalog'}`,
        });
      }
    });

    // Sort by timestamp desc, items without timestamp at bottom
    return list
      .sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [myBorrows, favorites]);

  // Relative time formatter
  const formatTimeAgo = (date) => {
    if (!date) return 'Recently';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Return Book Handlers
  const handleOpenReturnModal = (loan) => {
    setLoanToReturn(loan);
    setReturnFeedback({ error: '', success: '' });
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!loanToReturn) return;
    setReturningInProgress(true);
    setReturnFeedback({ error: '', success: '' });

    try {
      await dispatch(returnBook(loanToReturn._id)).unwrap();
      setReturnFeedback({
        error: '',
        success: `"${loanToReturn.book?.title || 'Book'}" has been successfully returned!`,
      });
      setTimeout(() => {
        setReturnModalOpen(false);
        setLoanToReturn(null);
        refreshDashboardData();
      }, 1400);
    } catch (err) {
      setReturnFeedback({
        error: typeof err === 'string' ? err : err?.message || 'Failed to return volume.',
        success: '',
      });
    } finally {
      setReturningInProgress(false);
    }
  };

  // Borrow Book Handlers (from BookCard)
  const handleOpenBorrowModal = (book) => {
    setBookToBorrow(book);
    setBorrowDuration(14);
    setBorrowFormat(book.formats?.[0] || 'epub');
    setBorrowFeedback({ error: '', success: '' });
    setBorrowModalOpen(true);
  };

  const handleConfirmBorrow = async () => {
    if (!bookToBorrow) return;
    const bookId = bookToBorrow._id || bookToBorrow.id;
    setBorrowingInProgress(true);
    setBorrowFeedback({ error: '', success: '' });

    try {
      await dispatch(
        borrowBook({
          bookId,
          durationDays: borrowDuration,
          format: borrowFormat,
        })
      ).unwrap();

      setBorrowFeedback({
        error: '',
        success: `Successfully loaned "${bookToBorrow.title}" for ${borrowDuration} days!`,
      });
      setTimeout(() => {
        setBorrowModalOpen(false);
        setBookToBorrow(null);
        refreshDashboardData();
      }, 1500);
    } catch (err) {
      setBorrowFeedback({
        error: typeof err === 'string' ? err : err?.message || 'Failed to check out volume.',
        success: '',
      });
    } finally {
      setBorrowingInProgress(false);
    }
  };

  // Safe non-sensitive patron info
  const patronName = user?.name || profile?.name || 'Reader';
  const patronBranch = profile?.profile?.branch || user?.profile?.branch || 'Metropolitan Central';
  const patronCardId = profile?.profile?.cardId || user?.profile?.cardId || 'BKSP-ACTIVE';

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      {/* Patron Left Navigation Sidebar */}
      <Sidebar mode="patron" />

      {/* Main Patron Dashboard Content */}
      <main className="flex-1 space-y-8 min-w-0">
        {/* ========================================================= */}
        {/* 1. WELCOME SECTION (Tactile Extruded Panel with Ambient Glow) */}
        {/* ========================================================= */}
        <section
          aria-label="Welcome section"
          className="w-full rounded-2xl bg-surface p-6 sm:p-8 md:p-10 neo-raised relative overflow-hidden"
        >
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            {/* Patron Welcome & Goal Tracker */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-primary bg-surface neo-pressed-sm flex items-center gap-1.5 select-none">
                  <span className="material-symbols-outlined text-sm font-fill text-amber-500">
                    local_fire_department
                  </span>
                  <span>18 Day Reading Streak</span>
                </span>
                <span className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Branch: {patronBranch}</span>
                  <span>•</span>
                  <span>Card ID: #{patronCardId}</span>
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-semibold text-on-surface tracking-tight m-0">
                  Welcome back, {patronName}
                </h1>
                <p className="text-sm text-on-surface-variant mt-1.5 max-w-xl leading-relaxed">
                  Your reading portfolio is in sync. Discover new volumes, manage active digital checkouts, or explore algorithmic recommendations.
                </p>
              </div>

              {/* Reading Challenge Progress Bar */}
              <div className="pt-2 max-w-xl">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">emoji_events</span>
                    <span>2024 Reading Challenge</span>
                  </span>
                  <span className="text-primary font-bold">
                    {booksReadCount}{' '}
                    <span className="text-on-surface-variant font-normal">
                      of {challengeTarget} books ({challengePercentage}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-surface neo-pressed p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(challengePercentage, 6)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Shortcut Buttons (Top Panel) */}
            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-3 shrink-0 justify-start lg:justify-center">
              <Button
                variant="primary"
                size="md"
                icon="explore"
                onClick={() => navigate('/books')}
              >
                Browse Books
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon="book"
                onClick={() => navigate('/my-books')}
              >
                My Books
              </Button>
              <Button
                variant="outline"
                size="md"
                icon="bookmark_heart"
                onClick={() => navigate('/favorites')}
              >
                Favorites
              </Button>
              <Button
                variant="outline"
                size="md"
                icon="auto_awesome"
                onClick={() => navigate('/recommendations')}
              >
                Recommendations
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. QUICK ACTIONS (Dedicated Stitch Neomorphic Navigation Bento) */}
        {/* ========================================================= */}
        <section aria-label="Quick Actions" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5 m-0">
              <span className="material-symbols-outlined text-sm text-primary">touch_app</span>
              <span>Quick Actions</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Action 1: Browse Books */}
            <Link
              to="/books"
              className="p-4 rounded-2xl bg-surface neo-raised hover:neo-raised-lg active:neo-pressed transition-all group flex flex-col justify-between gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">explore</span>
              </div>
              <div>
                <div className="text-sm font-headline font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Browse Books</span>
                  <span className="material-symbols-outlined text-xs text-outline group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                  Explore full library catalog
                </p>
              </div>
            </Link>

            {/* Quick Action 2: My Books */}
            <Link
              to="/my-books"
              className="p-4 rounded-2xl bg-surface neo-raised hover:neo-raised-lg active:neo-pressed transition-all group flex flex-col justify-between gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">book</span>
              </div>
              <div>
                <div className="text-sm font-headline font-semibold text-on-surface group-hover:text-tertiary transition-colors flex items-center justify-between">
                  <span>My Books</span>
                  <span className="material-symbols-outlined text-xs text-outline group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                  Active checkouts &amp; returns
                </p>
              </div>
            </Link>

            {/* Quick Action 3: Favorites */}
            <Link
              to="/favorites"
              className="p-4 rounded-2xl bg-surface neo-raised hover:neo-raised-lg active:neo-pressed transition-all group flex flex-col justify-between gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">bookmark_heart</span>
              </div>
              <div>
                <div className="text-sm font-headline font-semibold text-on-surface group-hover:text-rose-500 transition-colors flex items-center justify-between">
                  <span>Favorites</span>
                  <span className="material-symbols-outlined text-xs text-outline group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                  Personal wishlist &amp; shelves
                </p>
              </div>
            </Link>

            {/* Quick Action 4: Recommendations */}
            <Link
              to="/recommendations"
              className="p-4 rounded-2xl bg-surface neo-raised hover:neo-raised-lg active:neo-pressed transition-all group flex flex-col justify-between gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div>
                <div className="text-sm font-headline font-semibold text-on-surface group-hover:text-amber-500 transition-colors flex items-center justify-between">
                  <span>Recommendations</span>
                  <span className="material-symbols-outlined text-xs text-outline group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                  AI neural literary discovery
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2-5. METRICS ROW: Total, Currently Borrowed, Favorites, Overdue */}
        {/* ========================================================= */}
        <section aria-label="Key library statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Borrowed Books */}
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                Total Borrowed
              </span>
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-tertiary neo-pressed-sm">
                <span className="material-symbols-outlined text-[20px]">auto_stories</span>
              </div>
            </div>
            <div className="mt-4">
              {profileLoading || borrowsLoading ? (
                <div className="h-8 w-20 rounded bg-surface-container animate-pulse mb-2" />
              ) : (
                <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">
                  {totalBorrowedCount}{' '}
                  <span className="text-sm font-normal text-on-surface-variant">volumes</span>
                </div>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                <span>Circulation history ledger</span>
              </div>
            </div>
          </div>

          {/* Card 2: Currently Borrowed */}
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                Currently Borrowed
              </span>
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-primary neo-pressed-sm">
                <span className="material-symbols-outlined text-[20px]">book</span>
              </div>
            </div>
            <div className="mt-4">
              {profileLoading || borrowsLoading ? (
                <div className="h-8 w-24 rounded bg-surface-container animate-pulse mb-2" />
              ) : (
                <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">
                  {activeLoansCount}{' '}
                  <span className="text-sm font-normal text-on-surface-variant">/ 10 max limit</span>
                </div>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>
                  {activeLoansCount > 0
                    ? `${activeLoansCount} active digital & print folio(s)`
                    : 'No active loans currently'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Favorites Count */}
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                Favorites Shelf
              </span>
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-rose-500 neo-pressed-sm">
                <span className="material-symbols-outlined text-[20px]">bookmark_heart</span>
              </div>
            </div>
            <div className="mt-4">
              {favoritesLoading ? (
                <div className="h-8 w-16 rounded bg-surface-container animate-pulse mb-2" />
              ) : (
                <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">
                  {favoritesCount}{' '}
                  <span className="text-sm font-normal text-on-surface-variant">saved</span>
                </div>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-sm text-rose-500">favorite</span>
                <span>Curated personal collection</span>
              </div>
            </div>
          </div>

          {/* Card 4: Overdue Books */}
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                Overdue Books
              </span>
              <div
                className={`w-9 h-9 rounded-xl bg-surface flex items-center justify-center neo-pressed-sm ${
                  overdueCount > 0 ? 'text-error' : 'text-emerald-600'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {overdueCount > 0 ? 'warning' : 'verified_user'}
                </span>
              </div>
            </div>
            <div className="mt-4">
              {borrowsLoading ? (
                <div className="h-8 w-20 rounded bg-surface-container animate-pulse mb-2" />
              ) : (
                <div
                  className={`text-2xl font-bold font-headline tracking-tight ${
                    overdueCount > 0 ? 'text-error' : 'text-on-surface'
                  }`}
                >
                  {overdueCount}{' '}
                  <span className="text-sm font-normal text-on-surface-variant">
                    {overdueCount === 1 ? 'volume' : 'volumes'}
                  </span>
                </div>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    overdueCount > 0 ? 'bg-error animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span>
                  {overdueCount > 0 ? 'Return promptly to avoid fines' : 'Account status: In good standing'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TWO-COLUMN LAYOUT: Recently Borrowed (Left) + Recent Activity (Right) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 6. RECENTLY BORROWED BOOKS (8 Columns) */}
          <section aria-label="Recently borrowed books" className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl">auto_stories</span>
                <h2 className="text-lg font-headline font-semibold text-on-surface tracking-tight m-0">
                  Recently Borrowed Books
                </h2>
              </div>
              <Link
                to="/my-books"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View All Shelf</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {borrowsLoading ? (
              <LoadingSkeleton variant="tableRow" count={3} />
            ) : !hasBorrowHistory ? (
              /* Empty state when the user has no borrowing history */
              <EmptyState
                icon="menu_book"
                title="No Borrowing History Yet"
                description="Your reading shelf is currently empty. Explore our catalog of physical volumes and digital e-books to start checking out books."
                actionLabel="Browse Books"
                onAction={() => navigate('/books')}
              />
            ) : (
              <div className="space-y-4">
                {myBorrows.slice(0, 5).map((loan) => {
                  const book = loan.book;
                  const bookId = book?._id || book?.id;
                  const isReturned = loan.status === 'returned' || Boolean(loan.returnedAt);
                  const isOverdue = !isReturned && (loan.isOverdue || loan.status === 'overdue');
                  const dueDateString = loan.dueDate
                    ? new Date(loan.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';
                  const returnDateString = loan.returnedAt
                    ? new Date(loan.returnedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : null;

                  return (
                    <div
                      key={loan._id}
                      className="p-5 sm:p-6 rounded-2xl bg-surface neo-raised flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                    >
                      {/* Book Thumbnail & Information */}
                      <div className="flex gap-4 items-start sm:items-center min-w-0 flex-1">
                        <div className="relative w-16 h-22 sm:w-18 sm:h-24 rounded-lg bg-surface neo-pressed overflow-hidden shrink-0 flex items-center justify-center p-1">
                          <img
                            src={
                              book?.coverImage ||
                              'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80'
                            }
                            alt={book?.title || 'Book cover'}
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface neo-pressed-sm text-on-surface-variant uppercase tracking-wider">
                              {loan.format || 'Physical Copy'}
                            </span>

                            {isReturned ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                <span>Returned {returnDateString ? `(${returnDateString})` : ''}</span>
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-error">
                                <span className="material-symbols-outlined text-xs">warning</span>
                                <span>Overdue (Due {dueDateString})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                <span className="material-symbols-outlined text-xs">timer</span>
                                <span>Due: {dueDateString}</span>
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/books/${bookId}`}
                            className="text-base font-headline font-semibold text-on-surface hover:text-primary transition-colors leading-snug block truncate"
                            title={book?.title}
                          >
                            {book?.title || 'Unknown Title'}
                          </Link>

                          <p className="text-xs text-on-surface-variant font-medium truncate">
                            by {book?.author || 'Unknown Author'} • {book?.genre || 'Literature'}
                          </p>
                        </div>
                      </div>

                      {/* Item Action Buttons */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon="visibility"
                          onClick={() => navigate(`/books/${bookId}`)}
                        >
                          Inspect
                        </Button>

                        {!isReturned && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon="assignment_return"
                            disabled={returningInProgress}
                            onClick={() => handleOpenReturnModal(loan)}
                          >
                            Return Volume
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 9. RECENT ACTIVITY (4 Columns) */}
          <section aria-label="Recent activity" className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">history</span>
                <h2 className="text-lg font-headline font-semibold text-on-surface tracking-tight m-0">
                  Recent Activity
                </h2>
              </div>
              <span className="text-[11px] font-mono text-outline uppercase tracking-wider">Patron Log</span>
            </div>

            <div className="p-5 rounded-2xl bg-surface neo-raised space-y-4">
              {borrowsLoading || favoritesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`skel-act-${i}`} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-xl bg-surface-container shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-3/4 rounded bg-surface-container" />
                        <div className="h-2 w-1/2 rounded bg-surface-container-low" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-surface neo-pressed space-y-2">
                  <span className="material-symbols-outlined text-outline text-2xl">pending_actions</span>
                  <p className="text-xs text-on-surface-variant m-0">
                    No recent library activity recorded yet.
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/books')}>
                    Browse Catalog
                  </Button>
                </div>
              ) : (
                <div className="relative space-y-4 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-surface-container-high/80">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="relative flex items-start gap-3">
                      {/* Activity Type Icon */}
                      <div
                        className={`relative z-10 w-7 h-7 rounded-lg bg-surface neo-pressed-sm flex items-center justify-center shrink-0 ${act.badgeColor}`}
                      >
                        <span className="material-symbols-outlined text-[15px]">{act.icon}</span>
                      </div>

                      {/* Activity Details */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-xs font-semibold text-on-surface truncate">
                            {act.actionText}
                          </span>
                          <span className="text-[10px] text-outline font-medium shrink-0">
                            {formatTimeAgo(act.timestamp)}
                          </span>
                        </div>

                        {act.bookId ? (
                          <Link
                            to={`/books/${act.bookId}`}
                            className="text-xs font-medium text-primary hover:underline truncate block"
                            title={act.bookTitle}
                          >
                            {act.bookTitle}
                          </Link>
                        ) : (
                          <p className="text-xs font-medium text-on-surface-variant truncate m-0">
                            {act.bookTitle}
                          </p>
                        )}

                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                          {act.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Branch Circulation Notice Card */}
              <div className="pt-3 border-t border-surface-container-high/70">
                <div className="p-3 rounded-xl bg-surface neo-pressed-sm flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-base">domain</span>
                    <span>{patronBranch}</span>
                  </div>
                  <span className="font-semibold text-primary">Open until 9 PM</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================= */}
        {/* 7. RECOMMENDED BOOKS (Tactile Neomorphic Carousel Grid using BookCard) */}
        {/* ========================================================= */}
        <section aria-label="Book Recommendations" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-xl">auto_awesome</span>
                <h2 className="text-xl font-headline font-semibold text-on-surface tracking-tight m-0">
                  Recommended Books
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Personalized suggestions computed from your literary portfolio and reading history
              </p>
            </div>

            <Link
              to="/recommendations"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Recommendations</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Meaningful Loading State for Recommendations */}
          {recsLoading ? (
            <LoadingSkeleton variant="bookGrid" count={4} />
          ) : recommendedBooks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface neo-pressed space-y-3">
              <span className="material-symbols-outlined text-outline text-[36px]">psychology</span>
              <h3 className="text-base font-semibold text-on-surface m-0">
                Generating Personalized Recommendations
              </h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Explore books or add titles to your favorites to teach our neural recommendation engine your literary taste.
              </p>
              <Button
                size="sm"
                variant="primary"
                icon="explore"
                onClick={() => navigate('/books')}
              >
                Explore Books Catalog
              </Button>
            </div>
          ) : (
            /* Recommendations rendered with BookCard components */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedBooks.slice(0, 4).map((book) => (
                <BookCard
                  key={book._id || book.id}
                  book={book}
                  onBorrowClick={handleOpenBorrowModal}
                  showBorrowButton={true}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ========================================================= */}
      {/* RETURN CONFIRMATION MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => !returningInProgress && setReturnModalOpen(false)}
        title="Confirm Return of Volume"
        subtitle="Circulation Return Desk"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={returningInProgress}
              onClick={() => setReturnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="assignment_return"
              loading={returningInProgress}
              onClick={handleConfirmReturn}
            >
              Confirm Return
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          {returnFeedback.success ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>{returnFeedback.success}</span>
            </div>
          ) : (
            <>
              {returnFeedback.error && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{returnFeedback.error}</span>
                </div>
              )}

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Are you ready to return this volume to the library collection? Once returned, it will be marked complete in your borrowing history.
              </p>

              {loanToReturn && (
                <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3.5">
                  <img
                    src={
                      loanToReturn.book?.coverImage ||
                      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={loanToReturn.book?.title}
                    className="w-12 h-16 object-cover rounded shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface truncate m-0">
                      {loanToReturn.book?.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      by {loanToReturn.book?.author || 'Author'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary uppercase">
                      {loanToReturn.format || 'Physical Copy'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* BORROW BOOK MODAL (For Recommended Books) */}
      {/* ========================================================= */}
      <Modal
        isOpen={borrowModalOpen}
        onClose={() => !borrowingInProgress && setBorrowModalOpen(false)}
        title="Check Out Library Volume"
        subtitle="Municipal Digital Circulation Desk"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={borrowingInProgress}
              onClick={() => setBorrowModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="menu_book"
              loading={borrowingInProgress}
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

              {bookToBorrow && (
                <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3.5">
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
                      by {bookToBorrow.author} • {bookToBorrow.genre || 'Literature'}
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

export default DashboardPage;
