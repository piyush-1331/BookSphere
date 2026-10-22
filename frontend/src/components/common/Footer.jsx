import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="w-full bg-surface border-t border-surface-container-high/80 mt-auto py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center neo-raised text-primary">
                <span className="material-symbols-outlined text-[22px]">auto_stories</span>
              </div>
              <span className="text-lg font-headline font-semibold tracking-tight text-on-surface">
                BookSphere
              </span>
            </Link>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              An intelligent archival and circulation ecosystem uniting classic literature, digital
              manuscripts, and machine-learning recommendation pipelines.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface neo-pressed-sm text-[10px] font-semibold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Network Status: Optimal</span>
            </div>
          </div>

          {/* Catalog & Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
              <li>
                <Link to="/books?category=Science+%26+Technology" className="hover:text-primary transition-colors">
                  Science &amp; Technology
                </Link>
              </li>
              <li>
                <Link to="/books?genre=Literature" className="hover:text-primary transition-colors">
                  Literary Classics
                </Link>
              </li>
              <li>
                <Link to="/books?genre=Philosophy" className="hover:text-primary transition-colors">
                  Philosophy &amp; Ethics
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-primary transition-colors">
                  AI Reading Discovery
                </Link>
              </li>
            </ul>
          </div>

          {/* Patron Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Patron Services
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">
                  Member Portal
                </Link>
              </li>
              <li>
                <Link to="/my-books" className="hover:text-primary transition-colors">
                  Borrowing Desk
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-primary transition-colors">
                  Favorites Shelf
                </Link>
              </li>
              <li>
                <Link to="/borrow-history" className="hover:text-primary transition-colors">
                  Circulation History
                </Link>
              </li>
            </ul>
          </div>

          {/* Library & Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Library &amp; Hours
            </h4>
            <div className="p-4 rounded-2xl bg-surface neo-pressed-sm space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-on-surface-variant">Mon – Fri:</span>
                <span className="font-medium text-on-surface">8:00 AM – 9:00 PM</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-on-surface-variant">Sat – Sun:</span>
                <span className="font-medium text-on-surface">10:00 AM – 6:00 PM</span>
              </div>
              <p className="text-[10px] text-on-surface-variant pt-1 leading-snug">
                Metropolitan Central Branch • 24/7 Digital Patron Access
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-surface-container-high/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <p>© {new Date().getFullYear()} BookSphere Online Library Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/books" className="hover:text-primary transition-colors">Catalog Index</Link>
            <Link to="/recommendations" className="hover:text-primary transition-colors">Neural Recs</Link>
            <Link to="/dashboard" className="hover:text-primary transition-colors">Patron Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
