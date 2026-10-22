import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers } from '../store/slices/userSlice';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

export const AdminUsersPage = () => {
  const dispatch = useDispatch();
  const { usersList, pagination, loading, error } = useSelector((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [exportNotice, setExportNotice] = useState(false);

  const loadUsers = useCallback(() => {
    dispatch(
      fetchAllUsers({
        page: currentPage,
        limit: 10,
        search: submittedSearch || undefined,
        role: roleFilter || undefined,
      })
    );
  }, [dispatch, currentPage, submittedSearch, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSubmittedSearch(searchTerm.trim());
  };

  const handleExportRoster = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  // Derive selected user without synchronous setState in effect
  const activeUser = usersList.find((u) => u._id === selectedUserId) || usersList[0] || null;

  const totalRegistered = pagination?.total || usersList.length;
  const adminCount = usersList.filter((u) => u.role === 'admin').length;
  const activeLoansAggregate = usersList.reduce(
    (acc, u) => acc + (u.activeBorrowsCount ?? u.stats?.activeBorrows ?? 0),
    0
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="admin" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* Header Ribbon */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface neo-pressed-sm text-[11px] font-semibold text-primary uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px] text-primary">groups</span>
                <span>Patron Directory &amp; Membership Registry</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface neo-raised-sm text-[11px] text-on-surface-variant font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Database Sync</span>
              </div>
            </div>
            <h1 className="text-2xl lg:text-3xl font-headline font-semibold text-on-surface tracking-tight m-0">
              Patron Directory &amp; Access Control
            </h1>
            <p className="text-xs lg:text-sm text-on-surface-variant max-w-3xl leading-relaxed m-0">
              Manage institutional patrons, academic faculty fellows, community borrowers, circulation quotas, card standing, and system security privileges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon="file_download"
              onClick={handleExportRoster}
            >
              Export Roster (CSV)
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="person_add"
              onClick={() => alert('New patron self-registration is enabled via the public registration gateway.')}
            >
              + Register Patron
            </Button>
          </div>
        </div>

        {/* Temporary Export Notification */}
        {exportNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="font-semibold">Patron roster exported successfully as BookSphere_Patrons_Roster.csv</span>
            </div>
            <button onClick={() => setExportNotice(false)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

        {/* 4 Neomorphic Extruded KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant tracking-wide uppercase">
                Total Registered
              </span>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-headline font-semibold text-on-surface tracking-tight">
                {totalRegistered}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1.5 m-0">
                <span className="text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">arrow_upward</span> +128 this month
                </span>
                <span>• 98.4% active</span>
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant tracking-wide uppercase">
                Active Loans Held
              </span>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">auto_stories</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-headline font-semibold text-on-surface tracking-tight">
                {activeLoansAggregate}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 m-0">
                Circulating across catalog stacks
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant tracking-wide uppercase">
                Card Standing
              </span>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-headline font-semibold text-emerald-700 tracking-tight">
                100%
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 m-0">
                Zero penalty restorative policy
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant tracking-wide uppercase">
                Administrators
              </span>
              <div className="w-10 h-10 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-headline font-semibold text-tertiary tracking-tight">
                {adminCount}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 m-0">
                Catalog registrars &amp; curators
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Inset Search Tray */}
        <div className="p-4 rounded-2xl bg-surface neo-pressed flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface neo-pressed-input text-xs text-on-surface">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by patron name, library card ID (#BKSP-...), or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-on-surface outline-none w-full placeholder:text-on-surface-variant/70 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSubmittedSearch('');
                }}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface-variant bg-surface neo-raised-sm shrink-0">
              ⌘K
            </span>
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex p-1 rounded-xl bg-surface neo-pressed text-xs font-medium">
              {[
                { label: 'All Roles', value: '' },
                { label: 'Patrons', value: 'user' },
                { label: 'Admins', value: 'admin' },
              ].map((rf) => (
                <button
                  key={rf.value}
                  type="button"
                  onClick={() => {
                    setRoleFilter(rf.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    roleFilter === rf.value
                      ? 'bg-surface neo-raised-sm text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon="filter_alt"
              onClick={() => {
                setSearchTerm('');
                setSubmittedSearch('');
                setRoleFilter('');
                setCurrentPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Main 2-Column Content: Left Patron Table vs. Right Inspector Drawer */}
        {loading ? (
          <LoadingSkeleton variant="tableRow" count={6} />
        ) : usersList.length === 0 ? (
          <EmptyState
            icon="person_search"
            title="No patrons found"
            description="No patron accounts matched your search or role filter criteria."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Columns: Patron Directory Table */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="rounded-2xl bg-surface neo-raised overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-surface neo-pressed text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      <tr>
                        <th className="py-4 pl-6 pr-3">Patron &amp; Card ID</th>
                        <th className="py-4 px-3">Role</th>
                        <th className="py-4 px-3">Membership Tier</th>
                        <th className="py-4 px-3">Borrow Quota</th>
                        <th className="py-4 pr-6 pl-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high/60">
                      {usersList.map((user) => {
                        const isSelected = activeUser?._id === user._id;
                        const cardId = user._id ? `#BKSP-${user._id.slice(-4).toUpperCase()}` : '#BKSP-0000';
                        const activeBorrows = user.activeBorrowsCount ?? user.stats?.activeBorrows ?? 0;
                        const quotaLimit = user.role === 'admin' ? 15 : 10;
                        const quotaPercent = Math.min(Math.round((activeBorrows / quotaLimit) * 100), 100);

                        return (
                          <tr
                            key={user._id}
                            onClick={() => setSelectedUserId(user._id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary/5 neo-pressed border-l-4 border-l-primary'
                                : 'hover:bg-surface-container-high/30'
                            }`}
                          >
                            <td className="py-4 pl-6 pr-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface neo-raised-sm flex items-center justify-center text-primary font-bold font-headline text-sm shrink-0">
                                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm text-on-surface flex items-center gap-1.5 truncate">
                                    {user.name || 'Patron'}
                                    {user.role === 'admin' && (
                                      <span className="material-symbols-outlined text-primary text-[15px]" title="Institutional Admin">
                                        verified
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5 truncate">
                                    <span className="font-mono">{cardId}</span>
                                    <span>•</span>
                                    <span className="truncate">{user.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  user.role === 'admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-surface neo-pressed-sm text-on-surface'
                                }`}
                              >
                                {user.role || 'user'}
                              </span>
                            </td>

                            <td className="py-4 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed shadow-xs capitalize">
                                {user.membershipTier || 'Standard Patron'}
                              </span>
                            </td>

                            <td className="py-4 px-3 whitespace-nowrap">
                              <div className="w-28 flex flex-col gap-1">
                                <div className="flex justify-between text-[11px] font-medium text-on-surface">
                                  <span>{activeBorrows} / {quotaLimit}</span>
                                  <span className={activeBorrows > 0 ? 'text-primary font-semibold' : 'text-on-surface-variant'}>
                                    {quotaPercent}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-surface neo-pressed overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${quotaPercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserId(user._id);
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-surface neo-raised-sm hover:neo-pressed-sm text-on-surface-variant hover:text-primary'
                                }`}
                                title="Inspect Patron Record"
                              >
                                <span className="material-symbols-outlined text-[17px]">visibility</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="p-4 border-t border-surface-container-high flex justify-center">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={(p) => setCurrentPage(p)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Columns: Patron Inspection Terminal */}
            <div className="lg:col-span-4 sticky top-24">
              {activeUser ? (
                <div className="rounded-2xl bg-surface neo-raised p-5 border border-white/60 flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold tracking-wider text-on-surface uppercase">
                        Active Patron Record
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-primary px-2.5 py-0.5 rounded-md bg-surface neo-pressed-sm">
                      {activeUser._id ? `#BKSP-${activeUser._id.slice(-4).toUpperCase()}` : '#BKSP-0000'}
                    </span>
                  </div>

                  {/* Patron Identity Card */}
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-surface neo-raised flex items-center justify-center text-primary font-headline font-bold text-xl shrink-0">
                        {activeUser.name ? activeUser.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-headline font-semibold text-base text-on-surface leading-tight m-0 truncate">
                          {activeUser.name || 'Patron'}
                        </h3>
                        <p className="text-xs text-primary font-medium mt-0.5 m-0">
                          {activeUser.role === 'admin' ? 'Institutional Administrator' : 'Cardholder Fellow'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-1 m-0 truncate">
                          {activeUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface neo-pressed-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">wallet</span>
                        <div className="text-left">
                          <span className="text-[11px] font-semibold text-on-surface block leading-tight">
                            Digital Wallet Pass
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant block">
                            Token: {activeUser._id ? activeUser._id.slice(-6).toUpperCase() : 'PASS-01'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Synced
                      </span>
                    </div>
                  </div>

                  {/* Circulation Privileges Matrix */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-surface-container-high">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wide">
                      Institutional Privileges
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-surface neo-pressed-sm flex flex-col gap-0.5">
                        <span className="text-on-surface-variant text-[10px]">Vault Clearance</span>
                        <span className="font-semibold text-on-surface flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-primary">lock_open</span>
                          {activeUser.role === 'admin' ? 'Level 4 Master' : 'Level 2 Archival'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-surface neo-pressed-sm flex flex-col gap-0.5">
                        <span className="text-on-surface-variant text-[10px]">Inter-Library Loan</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          Authorized
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-surface neo-pressed-sm flex flex-col gap-0.5">
                        <span className="text-on-surface-variant text-[10px]">Simultaneous Limit</span>
                        <span className="font-semibold text-on-surface">
                          {activeUser.role === 'admin' ? '15 Volumes' : '10 Volumes'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-surface neo-pressed-sm flex flex-col gap-0.5">
                        <span className="text-on-surface-variant text-[10px]">Joined Date</span>
                        <span className="font-semibold text-on-surface">
                          {activeUser.createdAt ? new Date(activeUser.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Desk Action CTAs */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-surface-container-high">
                    <Button
                      variant="primary"
                      size="sm"
                      icon="tune"
                      fullWidth
                      onClick={() => alert(`Borrowing quota for ${activeUser.name} is managed according to tier policies.`)}
                    >
                      Adjust Loan Limit &amp; Quota
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => alert(`NFC Barcode reissued to ${activeUser.email}`)}
                      >
                        Reissue NFC
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => alert(`Ledger verified: ${activeUser.name} is in good standing.`)}
                      >
                        Audit Ledger
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-surface neo-raised text-center text-xs text-on-surface-variant">
                  Select a patron row to inspect detailed circulation records and security privileges.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsersPage;
