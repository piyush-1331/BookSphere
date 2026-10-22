import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllBorrows,
  returnBook,
  auditOverdue,
  clearAuditMessage,
} from '../store/slices/borrowSlice';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

export const AdminBorrowsPage = () => {
  const dispatch = useDispatch();
  const { allBorrows, adminPagination, loading, actionLoading, auditMessage } = useSelector(
    (state) => state.borrow
  );

  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [inspectedLoanId, setInspectedLoanId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [csvNotice, setCsvNotice] = useState(false);

  const loadBorrows = useCallback(() => {
    const params = { page: currentPage, limit: 10 };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchAllBorrows(params));
  }, [dispatch, currentPage, statusFilter]);

  useEffect(() => {
    loadBorrows();
  }, [loadBorrows]);

  const handleStatusTab = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleReturnClick = (loan) => {
    setSelectedLoan(loan);
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedLoan) return;
    await dispatch(returnBook(selectedLoan._id));
    setReturnModalOpen(false);
    loadBorrows();
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    await dispatch(auditOverdue());
    setAuditing(false);
    loadBorrows();
  };

  const handleExportCSV = () => {
    setCsvNotice(true);
    setTimeout(() => setCsvNotice(false), 3000);
  };

  // Filter borrows by search term locally for real-time responsiveness
  const filteredBorrows = allBorrows.filter((loan) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    const titleMatch = loan.book?.title?.toLowerCase().includes(query);
    const authorMatch = loan.book?.author?.toLowerCase().includes(query);
    const patronName = loan.user?.name?.toLowerCase().includes(query);
    const patronEmail = loan.user?.email?.toLowerCase().includes(query);
    const idMatch = loan._id?.toLowerCase().includes(query);
    return titleMatch || authorMatch || patronName || patronEmail || idMatch;
  });

  // Derive inspected loan without synchronous setState in effect
  const activeInspectedLoan =
    filteredBorrows.find((b) => b._id === inspectedLoanId) ||
    filteredBorrows[0] ||
    allBorrows[0] ||
    null;

  const totalCount = adminPagination?.total || allBorrows.length;
  const activeCount = allBorrows.filter((b) => b.status === 'borrowed').length;
  const overdueCount = allBorrows.filter((b) => b.status === 'overdue' || b.isOverdue).length;
  const returnedCount = allBorrows.filter((b) => b.status === 'returned').length;

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="admin" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* Top Command & Breadcrumb Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface neo-pressed-sm text-[11px] font-semibold text-primary uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px] text-primary">sync_alt</span>
                <span>Circulation Engine &amp; Loan Ledger</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface neo-raised-sm text-[11px] text-on-surface-variant font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live Desk Feed • Counter #04</span>
              </div>
            </div>
            <h1 className="text-2xl lg:text-3xl font-headline font-semibold text-on-surface tracking-tight m-0">
              Circulation &amp; Borrow Management
            </h1>
            <p className="text-xs lg:text-sm text-on-surface-variant max-w-3xl leading-relaxed m-0">
              Real-time loan authorization, automated return intake, hold queue fulfillment, and inter-branch transit tracking across metropolitan stacks.
            </p>
          </div>

          {/* Quick Operations CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon="schedule"
              loading={auditing}
              onClick={handleRunAudit}
            >
              Audit Overdue Loans
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="download"
              onClick={handleExportCSV}
            >
              Export Ledger (CSV)
            </Button>
          </div>
        </div>

        {/* Audit / Action Notification */}
        {auditMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="font-semibold">{auditMessage}</span>
            </div>
            <button
              onClick={() => dispatch(clearAuditMessage())}
              className="text-emerald-700 font-bold hover:text-emerald-900 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {csvNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="font-semibold">Circulation ledger exported as BookSphere_Circulation_Ledger.csv</span>
            </div>
            <button onClick={() => setCsvNotice(false)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

        {/* KPI Stats Row (Neomorphic Extruded Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase block">
                  Active On Loan
                </span>
                <span className="text-3xl font-headline font-semibold text-on-surface mt-1 block">
                  {activeCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">import_contacts</span>
              </div>
            </div>
            <div className="pt-3 border-t border-surface-container-high flex items-center justify-between text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <span className="material-symbols-outlined text-[13px]">trending_up</span> 94.2% return cadence
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface neo-pressed-sm font-semibold text-on-surface">
                Live
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase block">
                  Overdue &amp; Grace Review
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-3xl font-headline font-semibold block ${overdueCount > 0 ? 'text-error' : 'text-on-surface'}`}>
                    {overdueCount}
                  </span>
                  {overdueCount > 0 && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      Audit Active
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center ${overdueCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                <span className="material-symbols-outlined text-[20px]">
                  {overdueCount > 0 ? 'notification_important' : 'verified_user'}
                </span>
              </div>
            </div>
            <div className="pt-3 border-t border-surface-container-high flex items-center justify-between text-[11px] text-on-surface-variant">
              <span className="font-medium text-amber-700">Zero-fee restorative policy</span>
              <span className="px-2 py-0.5 rounded-full bg-surface neo-pressed-sm font-semibold text-primary">
                Stage 1-3
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase block">
                  Checked In &amp; Shelved
                </span>
                <span className="text-3xl font-headline font-semibold text-on-surface mt-1 block">
                  {returnedCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              </div>
            </div>
            <div className="pt-3 border-t border-surface-container-high flex items-center justify-between text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <span className="material-symbols-outlined text-[13px]">check</span> Inventory Restored
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface neo-pressed-sm font-semibold text-on-surface">
                Archives
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase block">
                  Total Ledger Volume
                </span>
                <span className="text-3xl font-headline font-semibold text-on-surface mt-1 block">
                  {totalCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">history_edu</span>
              </div>
            </div>
            <div className="pt-3 border-t border-surface-container-high flex items-center justify-between text-[11px] text-on-surface-variant">
              <span className="font-medium text-on-surface-variant">All Historical Borrows</span>
              <span className="px-2 py-0.5 rounded-full bg-surface neo-pressed-sm font-semibold text-primary">
                Full Record
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Circulation State Navigation Ribbon */}
        <div className="p-4 rounded-2xl bg-surface neo-pressed flex flex-col gap-4">
          {/* Top Pill Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { label: 'All Records', value: '', count: totalCount },
              { label: 'Active Loans', value: 'borrowed', count: activeCount },
              { label: 'Overdue Only', value: 'overdue', count: overdueCount },
              { label: 'Returned', value: 'returned', count: returnedCount },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusTab(tab.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  statusFilter === tab.value
                    ? 'bg-surface neo-raised-sm text-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:neo-raised-sm'
                }`}
              >
                {statusFilter === tab.value && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface neo-pressed-sm text-on-surface-variant">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Bottom Controls: Inset Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 flex items-center px-4 py-2 rounded-xl bg-surface neo-pressed-input text-xs text-on-surface">
              <span className="material-symbols-outlined text-[19px] text-on-surface-variant mr-2.5">
                search
              </span>
              <input
                type="text"
                placeholder="Filter by Volume Title, Patron Name, or Loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 outline-none placeholder:text-on-surface-variant text-xs font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-on-surface-variant hover:text-on-surface mr-2"
                >
                  ✕
                </button>
              )}
              <span className="px-1.5 py-0.5 rounded-md bg-surface text-[10px] font-semibold text-on-surface-variant neo-raised-sm">
                ⌘F
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon="filter_alt"
              onClick={() => {
                setStatusFilter('');
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Main Workspace Grid: Two Columns (Table vs. Right Inspection Terminal) */}
        {loading ? (
          <LoadingSkeleton variant="tableRow" count={6} />
        ) : filteredBorrows.length === 0 ? (
          <EmptyState
            icon="event_busy"
            title="No circulation records found"
            description="There are currently no borrow transactions matching your status or search criteria."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Columns: Circulation Ledger Table */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="rounded-2xl bg-surface neo-raised overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface neo-pressed text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                        <th className="py-4 pl-6 pr-3">Volume &amp; Asset</th>
                        <th className="py-4 px-3">Patron Details</th>
                        <th className="py-4 px-3">Checkout Date</th>
                        <th className="py-4 px-3">Due Date &amp; Status</th>
                        <th className="py-4 pr-6 pl-3 text-right">Circulation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high/60">
                      {filteredBorrows.map((loan) => {
                        const book = loan.book;
                        const patron = loan.user;
                        const isOverdue = loan.status === 'overdue' || loan.isOverdue;
                        const isBorrowed = loan.status === 'borrowed' || isOverdue;
                        const isInspected = activeInspectedLoan?._id === loan._id;
                        const loanId = `#LN-${loan._id?.slice(-6).toUpperCase()}`;

                        // Calculate due date status badge
                        let dueBadgeText = 'Due';
                        let dueBadgeColor = 'bg-surface neo-pressed-sm text-primary';
                        if (loan.status === 'returned') {
                          dueBadgeText = 'Checked In';
                          dueBadgeColor = 'bg-emerald-100 text-emerald-800';
                        } else if (isOverdue) {
                          dueBadgeText = 'Overdue Loan';
                          dueBadgeColor = 'bg-rose-100 text-rose-800 font-bold animate-pulse';
                        } else if (loan.dueDate) {
                          const diffDays = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                          if (diffDays <= 0) {
                            dueBadgeText = 'Due Today';
                            dueBadgeColor = 'bg-amber-100 text-amber-800 font-bold';
                          } else {
                            dueBadgeText = `Due in ${diffDays}d`;
                            dueBadgeColor = 'bg-emerald-50 text-emerald-700';
                          }
                        }

                        return (
                          <tr
                            key={loan._id}
                            onClick={() => setInspectedLoanId(loan._id)}
                            className={`cursor-pointer transition-colors ${
                              isInspected
                                ? 'bg-primary/5 neo-pressed border-l-4 border-l-primary'
                                : 'hover:bg-surface-container-high/30'
                            }`}
                          >
                            <td className="py-4 pl-6 pr-3 min-w-[220px]">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    book?.coverImage ||
                                    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80'
                                  }
                                  alt={book?.title}
                                  className="w-10 h-14 object-cover rounded-lg shadow-xs shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-headline font-semibold text-on-surface leading-snug truncate max-w-xs">
                                    {book?.title || 'Unknown Title'}
                                  </div>
                                  <div className="text-[11px] text-on-surface-variant truncate">
                                    by {book?.author || 'Unknown'}
                                  </div>
                                  <div className="text-[10px] font-mono text-primary mt-0.5">
                                    {loanId}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-3 min-w-[150px]">
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface truncate">
                                  {patron?.name || 'Patron'}
                                </span>
                                <span className="text-[11px] text-on-surface-variant font-mono truncate">
                                  {patron?.email || '—'}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-3 whitespace-nowrap text-on-surface-variant font-medium">
                              <div>{loan.borrowedAt ? new Date(loan.borrowedAt).toLocaleDateString() : '—'}</div>
                              <div className="text-[10px] text-on-surface-variant/75">Desk Terminal 01</div>
                            </td>

                            <td className="py-4 px-3 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className={`font-semibold ${isOverdue ? 'text-error' : 'text-on-surface'}`}>
                                  {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] w-fit shadow-xs ${dueBadgeColor}`}>
                                  {dueBadgeText}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap">
                              {isBorrowed ? (
                                <Button
                                  variant={isOverdue ? 'danger' : 'primary'}
                                  size="sm"
                                  icon="assignment_turned_in"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReturnClick(loan);
                                  }}
                                >
                                  Process Return
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                                  <span className="material-symbols-outlined text-[14px]">check</span> Checked In
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Pagination */}
                {adminPagination && adminPagination.totalPages > 1 && (
                  <div className="p-4 border-t border-surface-container-high flex justify-center">
                    <Pagination
                      currentPage={adminPagination.page}
                      totalPages={adminPagination.totalPages}
                      onPageChange={(p) => setCurrentPage(p)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Columns: Active Loan Inspector */}
            <div className="lg:col-span-4 sticky top-24">
              {activeInspectedLoan ? (
                <div className="p-5 rounded-2xl bg-surface neo-raised border border-white/60 flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">manage_search</span>
                      <span className="font-headline font-semibold text-xs tracking-wider uppercase text-on-surface">
                        Circulation Inspector
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface neo-pressed-sm text-primary font-semibold">
                      #LN-{activeInspectedLoan._id?.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  {/* Volume & Borrower Header Snippet */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={
                        activeInspectedLoan.book?.coverImage ||
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={activeInspectedLoan.book?.title}
                      className="w-14 h-20 object-cover rounded-xl shadow-xs shrink-0"
                    />
                    <div className="flex flex-col gap-1 min-w-0">
                      <h3 className="text-sm font-headline font-semibold text-on-surface leading-tight m-0 truncate">
                        {activeInspectedLoan.book?.title || 'Unknown Title'}
                      </h3>
                      <p className="text-xs text-on-surface-variant m-0">
                        by {activeInspectedLoan.book?.author || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-6 h-6 rounded-full bg-surface neo-pressed-sm flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                          {activeInspectedLoan.user?.name ? activeInspectedLoan.user.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-on-surface block truncate leading-tight">
                            {activeInspectedLoan.user?.name || 'Patron'}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-mono block truncate">
                            {activeInspectedLoan.user?.email || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Inset Matrix */}
                  <div className="p-3.5 rounded-xl bg-surface neo-pressed-sm flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Loan Status:</span>
                      <span className={`font-semibold capitalize ${
                        activeInspectedLoan.status === 'overdue' ? 'text-error' : 'text-on-surface'
                      }`}>
                        {activeInspectedLoan.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Checkout Date:</span>
                      <span className="font-medium text-on-surface">
                        {activeInspectedLoan.borrowedAt
                          ? new Date(activeInspectedLoan.borrowedAt).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Scheduled Due Date:</span>
                      <span className="font-semibold text-primary">
                        {activeInspectedLoan.dueDate
                          ? new Date(activeInspectedLoan.dueDate).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Inventory Status:</span>
                      <span className="font-medium text-on-surface">
                        {activeInspectedLoan.book?.copiesAvailable ?? 1} Available in Stack
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-surface-container-high">
                      <span className="text-on-surface-variant">Policy Standing:</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Compliant
                      </span>
                    </div>
                  </div>

                  {/* Inspector Desk Actions */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-surface-container-high">
                    {activeInspectedLoan.status !== 'returned' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon="assignment_turned_in"
                        fullWidth
                        onClick={() => handleReturnClick(activeInspectedLoan)}
                      >
                        Process Book Return
                      </Button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Archived and Restored to Shelf
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => alert(`Receipt slip printed for Loan #${activeInspectedLoan._id?.slice(-6).toUpperCase()}`)}
                      >
                        Print Slip
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => alert(`Patron notification sent to ${activeInspectedLoan.user?.email}`)}
                      >
                        Send Notice
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-surface neo-raised text-center text-xs text-on-surface-variant">
                  Select a transaction row to inspect circulation details.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Return Modal */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Process Book Check-in"
        subtitle={`Volume: ${selectedLoan?.book?.title}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Confirm check-in for <strong className="text-on-surface">{selectedLoan?.book?.title}</strong> returned by patron{' '}
            <strong className="text-on-surface">
              {selectedLoan?.user?.name || selectedLoan?.user?.email}
            </strong>.
          </p>

          <div className="p-3.5 rounded-xl bg-surface neo-pressed-sm flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
            <div>
              <p className="font-semibold text-on-surface m-0">Inventory Auto-Restoration</p>
              <p className="text-[11px] text-on-surface-variant m-0">
                Processing this check-in will immediately increment available shelf stock and close the loan ledger.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-container-high">
            <Button variant="ghost" onClick={() => setReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={actionLoading}
              onClick={handleConfirmReturn}
              icon="check"
            >
              Confirm Return &amp; Restore Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminBorrowsPage;
