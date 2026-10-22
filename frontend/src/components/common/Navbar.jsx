import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { myBorrows } = useSelector((state) => state.borrow);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeBorrowsCount = myBorrows?.filter(
    (b) => b.status === 'borrowed' || b.status === 'overdue'
  ).length || 0;

  const handleLogout = async () => {
    await dispatch(logout());
    setUserMenuOpen(false);
    navigate('/login');
  };

  const handleQuickSearch = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/books?search=${encodeURIComponent(query)}`);
      setSearchQuery('');
    } else {
      navigate('/books');
    }
  };

  const navLinkClass = ({ isActive }) =>
    `px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 select-none ${
      isActive
        ? 'bg-surface text-primary neo-pressed-sm font-semibold'
        : 'text-on-surface-variant hover:text-on-surface font-medium'
    }`;

  return (
    <header className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 xl:gap-6 shrink-0">
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center neo-raised text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">auto_stories</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-headline font-semibold tracking-tight text-on-surface leading-tight">
                BookSphere
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">
                Digital Library
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 p-1 rounded-2xl bg-surface neo-pressed-sm">
            <NavLink to="/books" className={navLinkClass}>
              <span className="material-symbols-outlined text-[17px]">explore</span>
              <span>Catalog</span>
            </NavLink>

            <NavLink to="/recommendations" className={navLinkClass}>
              <span className="material-symbols-outlined text-[17px]">auto_awesome</span>
              <span>AI Discovery</span>
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  <span className="material-symbols-outlined text-[17px]">grid_view</span>
                  <span>Dashboard</span>
                </NavLink>

                <NavLink to="/my-books" className={navLinkClass}>
                  <span className="material-symbols-outlined text-[17px]">book</span>
                  <span>My Loans</span>
                </NavLink>

                <NavLink to="/favorites" className={navLinkClass}>
                  <span className="material-symbols-outlined text-[17px]">bookmark_heart</span>
                  <span>Favorites</span>
                </NavLink>

                {user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-primary hover:bg-surface-container-high'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span>
                    <span>Admin</span>
                  </NavLink>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Global Quick Search Bar */}
        <form
          onSubmit={handleQuickSearch}
          className="hidden md:flex items-center w-48 lg:w-56 xl:w-72 focus-within:w-64 xl:focus-within:w-80 transition-all duration-300 mx-2 shrink-0"
        >
          <div className="w-full flex items-center gap-2 px-3 py-1.5 xl:py-2 rounded-xl bg-surface neo-pressed-input text-on-surface focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            <button
              type="submit"
              className="text-outline hover:text-primary transition-colors flex items-center justify-center cursor-pointer p-0.5 focus:outline-none"
              title="Search catalog"
              aria-label="Search catalog"
            >
              <span className="material-symbols-outlined text-[19px]">search</span>
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog or ISBN..."
              className="min-w-0 flex-1 bg-transparent border-0 outline-none text-xs text-on-surface placeholder:text-outline font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-outline hover:text-on-surface p-0.5 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
                title="Clear search"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            <button
              type="submit"
              className="px-1.5 py-0.5 text-[10px] rounded bg-surface neo-raised-sm hover:neo-pressed-sm text-on-surface-variant hover:text-primary font-mono transition-all cursor-pointer flex items-center justify-center focus:outline-none"
              title="Submit search (Enter)"
              aria-label="Submit search"
            >
              ↵
            </button>
          </div>
        </form>

        {/* Right Section: Auth & Profile Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Active Loans pill */}
              <Link
                to="/my-books"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface neo-raised hover:neo-pressed-sm transition-all"
                title="View your active loans"
              >
                <span className="material-symbols-outlined text-primary text-[18px]">book</span>
                <span className="text-xs font-semibold text-on-surface">
                  {activeBorrowsCount} {activeBorrowsCount === 1 ? 'Loan' : 'Loans'}
                </span>
              </Link>

              {/* Patron Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-surface neo-raised hover:neo-pressed-sm transition-all focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-on-surface leading-tight">
                      {user?.name || 'Patron'}
                    </span>
                    <span className="text-[10px] text-on-surface-variant capitalize">
                      {user?.role === 'admin' ? 'Administrator' : 'Patron'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-surface neo-raised-modal border border-surface-container-high p-2 z-50">
                    <div className="px-3 py-2.5 border-b border-surface-container-high/80">
                      <p className="text-xs font-bold text-on-surface">{user?.name}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
                      <p className="text-[10px] font-mono text-primary mt-0.5">
                        {user?.profile?.cardId || 'MEMBER ACTIVE'}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          account_circle
                        </span>
                        <span>Patron Profile</span>
                      </Link>

                      <Link
                        to="/borrow-history"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          history
                        </span>
                        <span>Circulation History</span>
                      </Link>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-container rounded-xl transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            admin_panel_settings
                          </span>
                          <span>Admin Console</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-surface-container-high/80">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-error hover:bg-error-container/50 rounded-xl transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-on-surface hover:text-primary bg-surface neo-raised-sm hover:neo-pressed-sm transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary-container shadow-md transition-all"
              >
                Get Card
              </Link>
            </div>
          )}

          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => navigate('/books')}
            className="md:hidden w-10 h-10 rounded-xl bg-surface neo-raised-sm hover:neo-pressed-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-all focus:outline-none"
            aria-label="Search catalog"
            title="Search catalog"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-surface neo-raised-sm flex items-center justify-center text-on-surface-variant focus:outline-none"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface border-t border-surface-container-high px-6 py-4 space-y-3 neo-raised">
          {/* Quick Search inside Mobile Drawer */}
          <form
            onSubmit={(e) => {
              handleQuickSearch(e);
              setMobileMenuOpen(false);
            }}
            className="w-full"
          >
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface neo-pressed-input text-on-surface">
              <button
                type="submit"
                className="text-primary flex items-center justify-center focus:outline-none cursor-pointer"
                aria-label="Submit search"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog or ISBN..."
                className="min-w-0 flex-1 bg-transparent border-0 outline-none text-xs text-on-surface placeholder:text-outline font-medium"
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary text-white neo-raised-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          <NavLink
            to="/books"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">explore</span>
            <span>Catalog Explorer</span>
          </NavLink>

          <NavLink
            to="/recommendations"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span>AI Discovery</span>
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/my-books"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">book</span>
                <span>My Loans ({activeBorrowsCount})</span>
              </NavLink>

              <NavLink
                to="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">bookmark_heart</span>
                <span>Favorites Shelf</span>
              </NavLink>

              <NavLink
                to="/borrow-history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">history</span>
                <span>Borrowing History</span>
              </NavLink>

              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
                <span>Patron Profile</span>
              </NavLink>

              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-primary bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  <span>Admin Console</span>
                </NavLink>
              )}

              <div className="pt-2 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-error text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-surface neo-raised"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-primary text-white"
              >
                Get Library Card
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
