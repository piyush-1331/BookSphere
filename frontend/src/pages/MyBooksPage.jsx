import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyBorrows, returnBook } from '../store/slices/borrowSlice';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Modal from '../components/common/Modal';

/**
 * MyBooksPage (/my-books)
 * Displays currently borrowed volumes for the authenticated patron.
 * Provides return confirmation workflow, real-time Redux stock updates,
 * and handles overdue indicators and session timeouts.
 */
export const MyBooksPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user);
  const { myBorrows, loading, actionLoading, returningId, error } = useSelector(
    (state) => state.borrow
  );

  // Return modal states
  const [confirmReturnModal, setConfirmReturnModal] = useState(false);
  const [selectedLoanToReturn, setSelectedLoanToReturn] = useState(null);
  const [returnMessage, setReturnMessage] = useState('');
  const [returnError, setReturnError] = useState('');
  const [pageToast, setPageToast] = useState({ type: '', message: '' });

  // Handle expired authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch active borrowings on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyBorrows({ status: 'borrowed' }));
    }
  }, [dispatch, isAuthenticated]);

  // Filter down to currently borrowed volumes (borrowed or overdue)
  const activeLoans = (myBorrows || []).filter(
    (b) => b.status === 'borrowed' || b.status === 'overdue'
  );

  const overdueCount = activeLoans.filter((b) => b.isOverdue || b.status === 'overdue').length;

  const handleReturnClick = (loan) => {
    setSelectedLoanToReturn(loan);
    setReturnMessage('');
    setReturnError('');
    setConfirmReturnModal(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedLoanToReturn || returningId) return;

    setReturnError('');
    setReturnMessage('');

    try {
      await dispatch(returnBook(selectedLoanToReturn._id)).unwrap();
      const bookTitle = selectedLoanToReturn.book?.title || 'Volume';
      const successNotice = `"${bookTitle}" has been successfully returned and restored to library circulation.`;

      setReturnMessage(successNotice);
      setPageToast({
        type: 'success',
        message: successNotice,
      });

      // Refetch current active list to reflect return
      dispatch(fetchMyBorrows({ status: 'borrowed' }));

      setTimeout(() => {
        setConfirmReturnModal(false);
        setSelectedLoanToReturn(null);
      }, 1500);
    } catch (err) {
      const errorMsg =
        typeof err === 'string'
          ? err
          : err?.message || 'Failed to process volume return. Please try again.';
      setReturnError(errorMsg);
      setPageToast({
        type: 'error',
        message: errorMsg,
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="patron" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-primary bg-surface neo-pressed-sm">
                Patron Shelf
              </span>
              <span className="text-xs text-outline font-medium tracking-tight">
                CARD #{profile?.profile?.cardId || user?.profile?.cardId || 'BKSP-ACTIVE'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-headline font-semibold text-on-surface tracking-tight m-0">
              My Currently Borrowed Books
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl font-normal leading-relaxed">
              Volumes checked out to your patron account. Monitor loan durations, due dates, and return items when finished reading.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon="add"
              onClick={() => navigate('/books')}
            >
              Borrow More Books
            </Button>
            <Button
              variant="outline"
              size="md"
              icon="history"
              onClick={() => navigate('/borrow-history')}
            >
              Borrow History
            </Button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {pageToast.message && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium transition-all ${
              pageToast.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800'
                : 'bg-error/10 border border-error/20 text-error'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">
                {pageToast.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{pageToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setPageToast({ type: '', message: '' })}
              className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Quick Stats Metrics Bento */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-surface neo-raised flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center neo-pressed text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]">book_2</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-headline font-semibold text-on-surface">
                  {activeLoans.length}
                </span>
                {overdueCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" title="Items overdue" />
                )}
              </div>
              <p className="text-xs text-on-surface-variant font-medium truncate">
                Active Loans ({overdueCount > 0 ? `${overdueCount} Overdue` : 'In Good Standing'})
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface neo-raised flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center neo-pressed text-tertiary shrink-0">
              <span className="material-symbols-outlined text-[22px]">bookmark</span>
            </div>
            <div className="min-w-0">
              <span className="text-xl font-headline font-semibold text-on-surface">10</span>
              <p className="text-xs text-on-surface-variant font-medium truncate">Maximum Loan Limit</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface neo-raised flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center neo-pressed text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[22px]">sync</span>
            </div>
            <div className="min-w-0">
              <span className="text-xl font-headline font-semibold text-on-surface">Active</span>
              <p className="text-xs text-on-surface-variant font-medium truncate">Library Whispersync</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface neo-raised flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center neo-pressed text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div className="min-w-0">
              <span className="text-xl font-headline font-semibold text-on-surface">$0.00</span>
              <p className="text-xs text-on-surface-variant font-medium truncate">Zero Fines (Good Standing)</p>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="p-1.5 rounded-2xl bg-surface neo-pressed flex flex-wrap gap-1 items-center max-w-full overflow-x-auto">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-surface text-primary neo-raised flex items-center gap-2 shrink-0 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">local_library</span>
            <span>Currently Borrowed</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface neo-pressed font-bold">
              {activeLoans.length}
            </span>
          </button>
          <Link
            to="/borrow-history"
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center gap-2 shrink-0 transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">history_edu</span>
            <span>Borrowing History</span>
          </Link>
          <Link
            to="/favorites"
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center gap-2 shrink-0 transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">favorite</span>
            <span>Favorites Wishlist</span>
          </Link>
        </div>

        {/* Content Area */}
        {loading ? (
          <LoadingSkeleton variant="tableRow" count={3} />
        ) : error ? (
          <ErrorState
            title="Unable to Load Active Borrowings"
            message={typeof error === 'string' ? error : 'Failed to retrieve your active loan records.'}
            retryLabel="Retry"
            onRetry={() => dispatch(fetchMyBorrows({ status: 'borrowed' }))}
          />
        ) : activeLoans.length === 0 ? (
          <EmptyState
            icon="menu_book"
            title="No volumes currently checked out"
            description="You do not have any active book loans in your reading shelf right now. Explore our catalog to borrow books."
            actionLabel="Explore Catalog"
            onAction={() => navigate('/books')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeLoans.map((loan) => {
              const book = loan.book;
              const isOverdue = loan.isOverdue || loan.status === 'overdue';
              const isReturningThis = returningId === loan._id;

              const borrowedDate = loan.borrowedAt
                ? new Date(loan.borrowedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A';

              const dueDate = loan.dueDate
                ? new Date(loan.dueDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A';

              return (
                <div
                  key={loan._id}
                  className="rounded-2xl bg-surface neo-raised p-6 flex flex-col justify-between relative overflow-hidden group"
                >
                  {/* Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface neo-pressed-sm text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">book</span>
                      {loan.format || 'ePub'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-700 font-bold border border-rose-300'
                          : 'bg-surface text-primary neo-pressed-sm'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-error animate-pulse' : 'bg-primary'}`} />
                      {isOverdue ? 'Overdue' : `Due: ${dueDate}`}
                    </span>
                  </div>

                  {/* Book Metadata */}
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 neo-pressed p-1 bg-surface">
                        <img
                          src={
                            book?.coverImage ||
                            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={book?.title || 'Volume'}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/books/${book?._id}`}
                          className="text-base font-headline font-semibold text-on-surface hover:text-primary transition-colors leading-tight block truncate"
                          title={book?.title}
                        >
                          {book?.title || 'Archived Title'}
                        </Link>
                        <p className="text-xs text-on-surface-variant mt-0.5 font-medium truncate">
                          by {book?.author || 'Unknown Author'}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-tertiary uppercase tracking-wider">
                          {book?.genre || 'Literature'}
                        </span>

                        <div className="mt-2 text-[11px] text-on-surface-variant space-y-0.5 font-mono">
                          <div>Borrowed: {borrowedDate}</div>
                          <div className={isOverdue ? 'text-error font-bold' : 'text-primary font-medium'}>
                            Due Date: {dueDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-surface-container-high">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="visibility"
                      className="flex-1"
                      onClick={() => navigate(`/books/${book?._id}`)}
                    >
                      Details
                    </Button>
                    <Button
                      variant={isOverdue ? 'danger' : 'primary'}
                      size="sm"
                      icon="assignment_return"
                      loading={isReturningThis}
                      disabled={actionLoading}
                      className="flex-1"
                      onClick={() => handleReturnClick(loan)}
                    >
                      Return
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Return Confirmation Modal */}
      <Modal
        isOpen={confirmReturnModal}
        onClose={() => !actionLoading && setConfirmReturnModal(false)}
        title="Confirm Book Return"
        subtitle={selectedLoanToReturn?.book?.title}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => setConfirmReturnModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="assignment_return"
              loading={actionLoading}
              onClick={handleConfirmReturn}
            >
              Confirm Return
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          {returnMessage ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>{returnMessage}</span>
            </div>
          ) : (
            <>
              {returnError && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{returnError}</span>
                </div>
              )}

              {/* Volume Summary in Modal */}
              {selectedLoanToReturn && (
                <div className="p-3.5 rounded-xl bg-surface neo-pressed flex items-center gap-3">
                  <img
                    src={
                      selectedLoanToReturn.book?.coverImage ||
                      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={selectedLoanToReturn.book?.title}
                    className="w-12 h-16 object-cover rounded shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface truncate m-0">
                      {selectedLoanToReturn.book?.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      by {selectedLoanToReturn.book?.author}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-mono text-primary font-semibold">
                      Format: {selectedLoanToReturn.format?.toUpperCase() || 'EPUB'}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-on-surface-variant leading-relaxed m-0">
                Are you ready to return this volume to the library? Once confirmed, this book will be immediately restored to the active catalog circulation pool and removed from your active loans.
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MyBooksPage;
