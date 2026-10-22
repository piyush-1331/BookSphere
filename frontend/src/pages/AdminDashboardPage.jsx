import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks } from '../store/slices/booksSlice';
import { fetchAllUsers } from '../store/slices/userSlice';
import { fetchAllBorrows, auditOverdue, clearAuditMessage } from '../store/slices/borrowSlice';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { books, pagination: bookPagination } = useSelector((state) => state.books);
  const { usersList, pagination: userPagination } = useSelector((state) => state.user);
  const { allBorrows, pagination: borrowPagination, loading: borrowLoading, auditMessage } = useSelector((state) => state.borrow);

  const [auditing, setAuditing] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState('7d');

  useEffect(() => {
    dispatch(fetchBooks({ limit: 5 }));
    dispatch(fetchAllUsers({ limit: 5 }));
    dispatch(fetchAllBorrows({ limit: 5 }));
  }, [dispatch]);

  const handleAuditOverdue = async () => {
    setAuditing(true);
    await dispatch(auditOverdue());
    setAuditing(false);
    dispatch(fetchAllBorrows({ limit: 5 }));
  };

  const totalCatalogCount = bookPagination?.total || books.length;
  const totalPatronsCount = userPagination?.total || usersList.length;
  const totalBorrowsCount = borrowPagination?.total || allBorrows.length;
  const overdueCount = allBorrows.filter((b) => b.status === 'overdue').length;

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="admin" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* Top Action & Context Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface neo-pressed-sm text-[11px] font-semibold text-primary tracking-wide">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              METROPOLITAN LIBRARY • LIVE CIRCULATION
            </div>

            <h1 className="text-2xl lg:text-3xl font-headline font-semibold text-on-surface tracking-tight m-0">
              Institutional Circulation &amp; Inventory Overview
            </h1>
            <p className="text-xs lg:text-sm text-on-surface-variant leading-relaxed">
              Real-time monitoring across cataloged volumes, regional inter-library loan conduits, and active patron circulations.
            </p>
          </div>

          {/* Timeframe & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex p-1 rounded-xl bg-surface neo-pressed text-xs font-medium">
              {[
                { label: 'Today', key: 'today' },
                { label: 'Last 7 Days', key: '7d' },
                { label: 'MTD', key: 'mtd' },
                { label: 'Quarter', key: 'quarter' },
              ].map((tf) => (
                <button
                  key={tf.key}
                  type="button"
                  onClick={() => setActiveTimeframe(tf.key)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTimeframe === tf.key
                      ? 'bg-surface neo-raised-sm text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                icon="schedule"
                loading={auditing}
                onClick={handleAuditOverdue}
              >
                Audit Overdue
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="add_circle"
                onClick={() => navigate('/admin/books')}
              >
                Add Volume
              </Button>
            </div>
          </div>
        </div>

        {/* Audit Notification */}
        {auditMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="font-medium">{auditMessage}</span>
            </div>
            <button
              onClick={() => dispatch(clearAuditMessage())}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* KPI Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Stat 1: Total Catalog Volumes */}
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Total Catalog Volumes
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-headline font-semibold text-on-surface tracking-tight">
                    {totalCatalogCount}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">library_books</span>
              </div>
            </div>
            <div className="mt-4 pt-3.5 flex flex-col gap-2 border-t border-surface-container-high">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">On Shelves vs Loan</span>
                <span className="font-semibold text-on-surface">Available</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface neo-pressed overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '78%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> Healthy Stock
                </span>
                <span>Active Registry</span>
              </div>
            </div>
          </div>

          {/* Stat 2: Active Borrowers & Patrons */}
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Registered Patrons
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-headline font-semibold text-on-surface tracking-tight">
                    {totalPatronsCount}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
            </div>
            <div className="mt-4 pt-3.5 flex flex-col gap-2 border-t border-surface-container-high">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Card Standing</span>
                <span className="font-semibold text-emerald-600">98% In Good Standing</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface neo-pressed overflow-hidden">
                <div className="h-full bg-tertiary rounded-full" style={{ width: '98%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="text-primary font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> Active Network
                </span>
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Stat 3: Active Loans */}
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Circulation Velocity
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-headline font-semibold text-on-surface tracking-tight">
                    {totalBorrowsCount}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">sync_alt</span>
              </div>
            </div>
            <div className="mt-4 pt-3.5 flex flex-col gap-2 border-t border-surface-container-high">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Fulfillment Rate</span>
                <span className="font-semibold text-on-surface">99% Return Efficiency</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface neo-pressed overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '94%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="text-on-surface font-medium">Digital &amp; Print</span>
                <span className="text-primary font-semibold">Live Audit</span>
              </div>
            </div>
          </div>

          {/* Stat 4: Overdue & Grace Flags */}
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Overdue Critical Flags
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-headline font-semibold tracking-tight ${overdueCount > 0 ? 'text-error' : 'text-on-surface'}`}>
                    {overdueCount}
                  </span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center ${overdueCount > 0 ? 'text-error' : 'text-emerald-600'}`}>
                <span className="material-symbols-outlined text-[22px]">
                  {overdueCount > 0 ? 'warning' : 'verified_user'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3.5 flex flex-col gap-2 border-t border-surface-container-high">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Patron Grace Protocol</span>
                <span className="font-semibold text-primary">$0 Penalty Node</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface neo-pressed overflow-hidden">
                <div className="h-full bg-error rounded-full" style={{ width: `${Math.min(overdueCount * 10, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="text-on-surface-variant">Overdue notices sent</span>
                <span>Auto-monitored</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/books"
            className="p-6 rounded-2xl bg-surface neo-raised hover:neo-pressed transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-surface neo-raised-sm group-hover:neo-pressed-sm flex items-center justify-center text-primary mb-4 transition-all">
              <span className="material-symbols-outlined text-2xl">menu_book</span>
            </div>
            <h3 className="text-lg font-headline font-semibold text-on-surface group-hover:text-primary transition-colors m-0">
              Manage Catalog Inventory
            </h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Add new titles, edit volume metadata, adjust physical stock counts, and retire archives.
            </p>
          </Link>

          <Link
            to="/admin/borrows"
            className="p-6 rounded-2xl bg-surface neo-raised hover:neo-pressed transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-surface neo-raised-sm group-hover:neo-pressed-sm flex items-center justify-center text-emerald-600 mb-4 transition-all">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <h3 className="text-lg font-headline font-semibold text-on-surface group-hover:text-primary transition-colors m-0">
              Circulation Desk
            </h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Inspect active patron checkouts, process volume returns, and run automated due date audits.
            </p>
          </Link>

          <Link
            to="/admin/users"
            className="p-6 rounded-2xl bg-surface neo-raised hover:neo-pressed transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-surface neo-raised-sm group-hover:neo-pressed-sm flex items-center justify-center text-tertiary mb-4 transition-all">
              <span className="material-symbols-outlined text-2xl">manage_accounts</span>
            </div>
            <h3 className="text-lg font-headline font-semibold text-on-surface group-hover:text-primary transition-colors m-0">
              Patrons Directory
            </h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Browse registered library cardholders, check membership tiers, and view borrowing velocities.
            </p>
          </Link>
        </div>

        {/* Recent Circulation Activity */}
        <div className="rounded-2xl bg-surface neo-raised overflow-hidden">
          <div className="p-5 border-b border-surface-container-high flex items-center justify-between">
            <h3 className="font-headline font-semibold text-on-surface text-base m-0">
              Recent Circulation Loans
            </h3>
            <Link to="/admin/borrows" className="text-xs font-semibold text-primary hover:underline">
              View All Loans →
            </Link>
          </div>

          {borrowLoading ? (
            <div className="p-4">
              <LoadingSkeleton variant="tableRow" count={3} />
            </div>
          ) : allBorrows.length === 0 ? (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              No recent borrow records in circulation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-on-surface-variant">
                <thead className="bg-surface neo-pressed text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Book Title</th>
                    <th className="px-6 py-3.5">Patron</th>
                    <th className="px-6 py-3.5">Borrowed Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {allBorrows.slice(0, 5).map((loan) => (
                    <tr key={loan._id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-on-surface">
                        {loan.book?.title || 'Unknown Title'}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-on-surface-variant">
                        {loan.user?.name || loan.user?.email || 'Patron'}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-on-surface-variant">
                        {loan.borrowedAt ? new Date(loan.borrowedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            loan.status === 'borrowed'
                              ? 'bg-surface neo-pressed-sm text-primary'
                              : loan.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700 font-bold'
                              : 'bg-surface neo-pressed-sm text-emerald-700'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
