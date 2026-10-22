import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/books?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/books');
    }
  };

  return (
    <section className="relative w-full py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center">
      <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface neo-raised-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary font-headline">
            SHELF LOCATION NOT FOUND
          </span>
          <span className="text-outline text-xs">/</span>
          <span className="text-xs font-mono text-on-surface-variant font-medium">INDEX::NULL_REF</span>
        </div>

        {/* 404 Centerpiece with Tactile Book Center */}
        <div className="relative w-full flex items-center justify-center my-2 select-none">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 filter blur-3xl">
            <div className="w-72 h-72 rounded-full bg-primary" />
          </div>

          <div className="relative z-0 flex items-baseline justify-center tracking-tighter text-on-surface font-headline font-bold leading-none">
            <span className="text-[7rem] sm:text-[11rem] md:text-[14rem] lg:text-[16rem] text-on-surface/90 drop-shadow-[6px_6px_14px_rgba(0,0,0,0.06)]">
              4
            </span>
            <div className="relative mx-1 sm:mx-4 -translate-y-4 sm:-translate-y-8 flex flex-col items-center">
              <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-surface flex items-center justify-center neo-pressed p-4 sm:p-6">
                <svg
                  className="w-full h-full text-primary drop-shadow-[2px_2px_4px_rgba(0,0,0,0.08)]"
                  fill="none"
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="fill-surface"
                    d="M100 145 C80 135 45 135 25 142 L25 58 C45 52 80 52 100 62 Z"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                  <path
                    className="fill-surface"
                    d="M100 145 C120 135 155 135 175 142 L175 58 C155 52 120 52 100 62 Z"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                  <path d="M100 62 L100 145" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                  <path d="M40 76 C55 72 75 73 90 77" opacity="0.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <path d="M40 94 C55 90 75 91 90 95" opacity="0.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <path d="M40 112 C55 108 75 109 90 113" opacity="0.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <path d="M110 77 C125 73 145 72 160 76" opacity="0.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <path d="M110 95 C125 91 145 90 160 94" opacity="0.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <path d="M110 113 C125 109 145 108 160 112" opacity="0.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  <g className="animate-bounce" style={{ animationDuration: '3.5s' }}>
                    <path d="M100 50 C95 40 85 36 78 38 C88 42 94 48 100 50 Z" fill="currentColor" opacity="0.75" />
                    <path d="M100 50 C105 40 115 36 122 38 C112 42 106 48 100 50 Z" fill="currentColor" opacity="0.75" />
                  </g>
                </svg>
              </div>
              <span className="mt-2 text-[10px] font-mono tracking-widest text-on-surface-variant uppercase font-medium">
                Missing Folio
              </span>
            </div>
            <span className="text-[7rem] sm:text-[11rem] md:text-[14rem] lg:text-[16rem] text-on-surface/90 drop-shadow-[6px_6px_14px_rgba(0,0,0,0.06)]">
              4
            </span>
          </div>
        </div>

        {/* Headings */}
        <div className="max-w-2xl mx-auto -mt-2 sm:-mt-6 space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-semibold text-on-surface tracking-tight leading-tight m-0">
            This Chapter Appears to be Missing
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant font-medium leading-relaxed max-w-xl mx-auto">
            The volume or archive you are looking for may have been shelved in another section, checked out permanently, or never existed in this sphere.
          </p>
        </div>

        {/* Catalog Search Form */}
        <div className="w-full max-w-xl mt-8 mb-6">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center p-2 rounded-2xl bg-surface neo-pressed transition-all"
          >
            <span className="material-symbols-outlined text-outline ml-3 mr-2 select-none">search</span>
            <input
              aria-label="Search the catalog directly"
              className="flex-1 bg-transparent py-2 text-sm sm:text-base text-on-surface placeholder:text-outline focus:outline-none font-medium"
              placeholder="Search the library catalog directly..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-surface text-primary font-semibold text-sm neo-raised-sm hover:neo-pressed-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Locate</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </form>
        </div>

        {/* Tolkien Quote Box */}
        <div className="relative w-full max-w-2xl px-6 py-4 rounded-2xl bg-surface neo-pressed my-4 flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-surface neo-raised-sm flex items-center justify-center shrink-0 text-tertiary">
            <span className="material-symbols-outlined text-xl">format_quote</span>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm italic text-on-surface font-medium leading-snug">
              “Not all those who wander are lost... but this page certainly is.”
            </p>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider font-headline">
              — J.R.R. Tolkien <span className="font-normal opacity-75">(adapted for patrons)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Wayfinding Indices */}
      <div className="w-full max-w-5xl mt-12 mb-6">
        <div className="flex items-center justify-between mb-6 px-1">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary font-headline">
              Wayfinding Indices
            </span>
            <h2 className="text-xl font-headline font-semibold text-on-surface mt-0.5 m-0">
              Where would you like to steer your compass?
            </h2>
          </div>
          <span className="hidden sm:inline-flex text-xs font-mono text-outline">SEC::404_REDIRECTS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/"
            className="p-6 rounded-2xl bg-surface neo-raised hover:neo-pressed transition-all flex flex-col justify-between min-h-[170px] group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-surface neo-raised-sm group-hover:neo-pressed-sm flex items-center justify-center text-primary transition-all">
                <span className="material-symbols-outlined text-2xl">home</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-lg">
                arrow_outward
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-headline font-semibold text-on-surface group-hover:text-primary transition-colors m-0">
                Return to Home Page
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Begin anew at the main foyer of BookSphere.
              </p>
            </div>
          </Link>

          <Link
            to="/books"
            className="p-6 rounded-2xl bg-surface neo-raised hover:neo-pressed transition-all flex flex-col justify-between min-h-[170px] group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-surface neo-raised-sm group-hover:neo-pressed-sm flex items-center justify-center text-tertiary transition-all">
                <span className="material-symbols-outlined text-2xl">menu_book</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-tertiary transition-colors text-lg">
                arrow_outward
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-headline font-semibold text-on-surface group-hover:text-tertiary transition-colors m-0">
                Explore Book Directory
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Wander thousands of curated titles across all genres.
              </p>
            </div>
          </Link>

          <Link
            to="/recommendations"
            className="p-6 rounded-2xl bg-surface neo-raised hover:neo-pressed transition-all flex flex-col justify-between min-h-[170px] group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-surface neo-raised-sm group-hover:neo-pressed-sm flex items-center justify-center text-primary transition-all">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-lg">
                arrow_outward
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-headline font-semibold text-on-surface group-hover:text-primary transition-colors m-0">
                AI Recommendations
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Explore algorithmic literature recommendations tailored to your taste.
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="p-6 rounded-2xl bg-surface neo-raised hover:neo-pressed transition-all flex flex-col justify-between min-h-[170px] group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-surface neo-raised-sm group-hover:neo-pressed-sm flex items-center justify-center text-secondary transition-all">
                <span className="material-symbols-outlined text-2xl">dashboard</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-on-surface transition-colors text-lg">
                arrow_outward
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-headline font-semibold text-on-surface group-hover:text-primary transition-colors m-0">
                Patron Dashboard
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Manage your active loans, holds, and reading goals.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
