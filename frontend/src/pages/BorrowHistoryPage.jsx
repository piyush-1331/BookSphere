import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyBorrows, returnBook } from '../store/slices/borrowSlice';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Modal from '../components/common/Modal';

/**
 * BorrowHistoryPage (/borrow-history)
 * Displays historical borrowing ledger for the authenticated patron.
 * Supports status filtering: borrowed, returned, overdue, rejected.
 * Includes return flow, pagination, and session verification.
 */
export const BorrowHistoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user);
  const { myBorrows, pagination, loading, actionLoading, returningId, error } = useSelector(
    (state) => state.borrow
  );

  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Return modal state
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

  // Fetch borrowing history whenever page, pageSize or statusFilter changes
  useEffect(() => {
    if (isAuthenticated) {
      const params = { page: currentPage, limit: pageSize };
      if (statusFilter) {
        params.status = statusFilter;
      }
      dispatch(fetchMyBorrows(params));
    }
  }, [dispatch, isAuthenticated, currentPage, pageSize, statusFilter]);

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

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
      const successNotice = `"${bookTitle}" has been returned and restored to circulation.`;

      setReturnMessage(successNotice);
      setPageToast({
        type: 'success',
        message: successNotice,
      });

      // Refetch history records
      const params = { page: currentPage, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      dispatch(fetchMyBorrows(params));

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

  // Status Badge Helper supporting borrowed, returned, overdue, rejected
  const getStatusBadge = (status, isOverdue) => {
    if (status === 'overdue' || (status === 'borrowed' && isOverdue)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
          Overdue
        </span>
      );
    }

    switch (status) {
      case 'borrowed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface neo-pressed-sm text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Active Loan
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface neo-pressed-sm text-emerald-700">
            <span className="material-symbols-outlined text-[15px]">done_all</span>
            Returned
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface neo-pressed-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px]">cancel</span>
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface neo-pressed-sm text-on-surface-variant capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="patron" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-primary bg-surface neo-pressed-sm">
                Circulation Ledger
              </span>
              <span className="text-xs text-outline font-medium tracking-tight">
                CARD #{profile?.profile?.cardId || user?.profile?.cardId || 'BKSP-ACTIVE'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-headline font-semibold text-on-surface tracking-tight m-0">
              Borrowing &amp; Reading History
            </h1>
            <p className="text-sm text-on-surface-variant max-w-2xl font-normal leading-relaxed">
              Complete archival record of all volumes loaned, renewal terms, return dates, and circulation history on your account.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              icon="book"
              onClick={() => navigate('/my-books')}
            >
              Active Shelf
            </Button>
            <Button
              variant="primary"
              size="md"
              icon="explore"
              onClick={() => navigate('/books')}
            >
              Browse Catalog
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

        {/* Status Filter Tabs supporting borrowed, returned, overdue, rejected */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { label: 'All Records', value: '' },
            { label: 'Active Loans', value: 'borrowed' },
            { label: 'Returned', value: 'returned' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Rejected', value: 'rejected' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-surface text-primary neo-pressed-sm'
                  : 'bg-surface text-on-surface-variant hover:text-on-surface neo-raised-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {loading ? (
          <LoadingSkeleton variant="tableRow" count={5} />
        ) : error ? (
          <ErrorState
            title="Failed to Load History"
            message={typeof error === 'string' ? error : 'Unable to retrieve your borrowing history at this time.'}
            retryLabel="Retry"
            onRetry={() => {
              const params = { page: currentPage, limit: pageSize };
              if (statusFilter) params.status = statusFilter;
              dispatch(fetchMyBorrows(params));
            }}
          />
        ) : !myBorrows || myBorrows.length === 0 ? (
          <EmptyState
            icon="history_toggle_off"
            title="No circulation history found"
            description={
              statusFilter
                ? `No circulation records found matching the status filter "${statusFilter}". Try viewing All Records or selecting another filter.`
                : "You have not borrowed any books from BookSphere yet. Discover thousands of volumes in our catalog to begin reading!"
            }
            actionLabel="Explore Books"
            onAction={() => navigate('/books')}
          />
        ) : (
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl neo-raised overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-on-surface-variant">
                  <thead className="bg-surface neo-pressed text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                    <tr>
                      <th className="px-6 py-4">Volume &amp; Contributor</th>
                      <th className="px-6 py-4">Format</th>
                      <th className="px-6 py-4">Borrowed Date</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4">Returned Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {myBorrows.map((loan) => {
                      const book = loan.book;
                      const isOverdue = loan.isOverdue || loan.status === 'overdue';
                      const isReturningThis = returningId === loan._id;

                      const borrowedDate = loan.borrowedAt
                        ? new Date(loan.borrowedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';

                      const dueDate = loan.dueDate
                        ? new Date(loan.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';

                      const returnedDate = loan.returnedAt
                        ? new Date(loan.returnedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';

                      const canReturn = loan.status === 'borrowed' || loan.status === 'overdue';

                      return (
                        <tr
                          key={loan._id}
                          className="hover:bg-surface-container-high/40 transition-colors"
                        >
                          {/* Book Details */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  book?.coverImage ||
                                  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80'
                                }
                                alt={book?.title || 'Volume'}
                                className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80';
                                }}
                              />
                              <div className="min-w-0">
                                <Link
                                  to={`/books/${book?._id}`}
                                  className="font-headline font-semibold text-sm text-on-surface hover:text-primary transition-colors block truncate max-w-xs"
                                  title={book?.title}
                                >
                                  {book?.title || 'Archived Title'}
                                </Link>
                                <p className="text-xs text-on-surface-variant truncate">
                                  by {book?.author || 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Format */}
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md bg-surface neo-pressed-sm text-on-surface text-[11px] font-semibold uppercase">
                              {loan.format || 'Standard'}
                            </span>
                          </td>

                          {/* Borrowed Date */}
                          <td className="px-6 py-4 text-xs font-medium text-on-surface">
                            {borrowedDate}
                          </td>

                          {/* Due Date */}
                          <td className="px-6 py-4 text-xs font-medium">
                            <span className={isOverdue ? 'text-error font-bold' : 'text-on-surface'}>
                              {dueDate}
                            </span>
                          </td>

                          {/* Returned Date */}
                          <td className="px-6 py-4 text-xs text-on-surface-variant">
                            {returnedDate}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {getStatusBadge(loan.status, isOverdue)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/books/${book?._id}`}
                                className="px-2.5 py-1.5 rounded-lg bg-surface neo-raised-sm hover:neo-pressed-sm text-xs font-semibold text-primary transition-all inline-block"
                              >
                                Details
                              </Link>

                              {canReturn && (
                                <button
                                  type="button"
                                  disabled={actionLoading || isReturningThis}
                                  onClick={() => handleReturnClick(loan)}
                                  className="px-2.5 py-1.5 rounded-lg bg-surface neo-raised-sm hover:neo-pressed-sm text-xs font-semibold text-error hover:text-rose-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {isReturningThis ? 'Returning...' : 'Return'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {pagination && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            )}
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
                Are you ready to return this volume to the library? Once confirmed, this book will be restored to active library circulation.
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BorrowHistoryPage;
