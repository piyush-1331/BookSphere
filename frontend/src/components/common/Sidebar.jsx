import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const Sidebar = ({ mode = 'patron' }) => {
  const { user } = useSelector((state) => state.auth);

  const patronLinks = [
    { to: '/dashboard', label: 'Patron Dashboard', icon: 'grid_view' },
    { to: '/books', label: 'Explore Catalog', icon: 'explore' },
    { to: '/recommendations', label: 'AI Recommendations', icon: 'auto_awesome' },
    { to: '/my-books', label: 'My Digital Loans', icon: 'book' },
    { to: '/favorites', label: 'Favorites Shelf', icon: 'bookmark_heart' },
    { to: '/borrow-history', label: 'Borrowing History', icon: 'history' },
    { to: '/profile', label: 'Member Profile', icon: 'account_circle' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Console Overview', icon: 'grid_view', end: true },
    { to: '/admin/books', label: 'Catalog Inventory', icon: 'menu_book' },
    { to: '/admin/borrows', label: 'Circulation Desk', icon: 'sync_alt' },
    { to: '/admin/users', label: 'Patrons Directory', icon: 'group' },
    { to: '/dashboard', label: 'Back to Patron Portal', icon: 'arrow_back' },
  ];

  const links = mode === 'admin' ? adminLinks : patronLinks;

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
      {/* Patron / Admin Identification Card */}
      <div className="p-4 rounded-2xl bg-surface neo-raised flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-surface neo-pressed flex items-center justify-center text-primary font-bold text-base shrink-0">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-on-surface truncate leading-snug">
            {user?.name || 'BookSphere Patron'}
          </span>
          <span className="text-[11px] font-medium text-on-surface-variant truncate">
            {mode === 'admin'
              ? 'Administrator'
              : user?.profile?.cardId || 'General Cardholder'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col gap-1.5 p-2 rounded-2xl bg-surface neo-raised">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-outline">
          {mode === 'admin' ? 'Institutional Console' : 'Navigation Desk'}
        </div>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-surface text-primary neo-pressed-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
              }`
            }
          >
            <span className="material-symbols-outlined text-[19px] leading-none text-current">
              {link.icon}
            </span>
            <span className="truncate">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};


export default Sidebar;
