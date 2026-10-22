import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks } from '../store/slices/booksSlice';
import BookGrid from '../components/books/BookGrid';
import Button from '../components/common/Button';

export const LandingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { books, loading } = useSelector((state) => state.books);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  useEffect(() => {
    dispatch(fetchBooks({ limit: 4, sortBy: 'rating', order: 'desc' }));
  }, [dispatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedGenre && selectedGenre !== 'all') params.set('genre', selectedGenre);
    navigate(`/books?${params.toString()}`);
  };

  const handleTrendingClick = (term) => {
    navigate(`/books?search=${encodeURIComponent(term)}`);
  };

  const trendingTopics = [
    'Dune',
    'Marcus Aurelius',
    'Haruki Murakami',
    'Artificial Intelligence',
    'Quiet Leadership',
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Hero Section with Neomorphic Extruded Elements */}
      <section className="relative px-4 sm:px-6 lg:px-12 pt-8 pb-16 sm:pb-20 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Ambient Neomorphic Clay Soft Glow Backgrounds */}
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-tertiary/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Subtitle Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface neo-raised-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-xs font-semibold tracking-wider uppercase text-primary font-headline">
                ✦ The Next-Generation Digital Library
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-semibold text-on-surface leading-[1.12] tracking-tight m-0">
              Discover, Borrow, and Immerse Yourself in Over{' '}
              <span className="text-primary inline-block">250,000 Titles</span>
            </h1>

            {/* Supporting Body */}
            <p className="text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed max-w-2xl">
              An intelligent catalog system bridging classical literature, contemporary bestsellers, and academic archives. Experience seamless instant holds, synchronized annotations, and transparent AI recommendations.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                size="lg"
                variant="primary"
                icon="arrow_forward"
                onClick={() => navigate('/books')}
              >
                Explore Full Catalog
              </Button>

              {isAuthenticated ? (
                <Button
                  size="lg"
                  variant="secondary"
                  icon="dashboard"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  icon="badge"
                  onClick={() => navigate('/register')}
                >
                  Register as Patron
                </Button>
              )}
            </div>

            {/* Metrics Strip (Neomorphic Inset Tray) */}
            <div className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface neo-pressed">
                <div className="px-3 py-1.5">
                  <div className="text-xl sm:text-2xl font-bold font-headline text-on-surface">250K+</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">Volumes Available</div>
                </div>
                <div className="px-3 py-1.5">
                  <div className="text-xl sm:text-2xl font-bold font-headline text-on-surface">98,000+</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">Active Readers</div>
                </div>
                <div className="px-3 py-1.5">
                  <div className="text-xl sm:text-2xl font-bold font-headline text-on-surface">1,200+</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">Partner Libraries</div>
                </div>
                <div className="px-3 py-1.5">
                  <div className="text-xl sm:text-2xl font-bold font-headline text-primary flex items-center gap-1">
                    <span>4.9</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">Community Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Books Extrusion Showcase */}
          <div className="lg:col-span-5 relative flex justify-center items-center py-6">
            <div className="relative w-full max-w-md aspect-[4/5] flex items-center justify-center">
              {/* Background Neomorphic Pedestal */}
              <div className="absolute inset-4 rounded-3xl bg-surface neo-raised-lg -rotate-3 scale-95 transition-transform hover:rotate-0 duration-500" />

              {/* Featured Primary Book Showcase with tactile depth */}
              <div className="relative z-20 w-56 sm:w-64 rounded-2xl overflow-hidden bg-surface neo-raised-modal transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="relative aspect-[3/4.2] overflow-hidden bg-slate-200">
                  <img
                    className="w-full h-full object-cover"
                    alt="The Midnight Library book cover"
                    src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-surface/90 backdrop-blur-md text-[10px] font-semibold text-primary shadow-sm uppercase tracking-wider">
                    Staff Pick
                  </div>
                </div>
                <div className="p-3.5 bg-surface flex flex-col gap-1">
                  <div className="text-xs font-semibold text-on-surface truncate">The Midnight Library</div>
                  <div className="text-[11px] text-on-surface-variant flex justify-between items-center">
                    <span>Matt Haig</span>
                    <span className="text-primary font-medium text-[10px]">99% Match</span>
                  </div>
                </div>
              </div>

              {/* Secondary Tilted Book Behind */}
              <div className="absolute -right-2 top-8 z-10 w-44 sm:w-48 rounded-xl overflow-hidden bg-surface neo-raised transform rotate-8 hidden sm:block">
                <div className="aspect-[3/4] overflow-hidden bg-slate-200">
                  <img
                    className="w-full h-full object-cover"
                    alt="Project Hail Mary"
                    src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80"
                  />
                </div>
              </div>

              {/* Floating Patron Live Review Card */}
              <div className="absolute -bottom-4 -left-4 sm:-left-6 z-30 p-4 rounded-2xl bg-surface neo-raised max-w-[240px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex text-amber-500 text-xs">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-on-surface">5.0</span>
                </div>
                <p className="text-[11px] text-on-surface-variant italic leading-tight">
                  “BookSphere completely replaced three different reading apps. Flawless borrowing.”
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                    ER
                  </div>
                  <span className="text-[10px] text-on-surface font-medium">Elena R. — Cambridge Club</span>
                </div>
              </div>

              {/* Live Reading Indicator Floating Pill */}
              <div className="absolute -top-3 -right-2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface neo-raised-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-medium text-on-surface">3,412 readers active now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Search & Discovery Bar */}
      <section className="px-4 sm:px-6 lg:px-12 -mt-4 sm:-mt-8 mb-16 max-w-5xl mx-auto w-full relative z-20">
        <div className="p-4 sm:p-5 rounded-3xl bg-surface neo-raised">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            {/* Inset Search Input */}
            <div className="flex-1 w-full flex items-center px-4 py-3 rounded-2xl bg-surface neo-pressed-input">
              <span className="material-symbols-outlined text-outline mr-3">search</span>
              <input
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
                placeholder="Search by title, author, ISBN, or topic..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Inset Genre Dropdown */}
            <div className="w-full md:w-52 flex items-center px-4 py-3 rounded-2xl bg-surface neo-pressed-input">
              <span className="material-symbols-outlined text-outline text-base mr-2">category</span>
              <select
                className="w-full bg-transparent text-xs sm:text-sm text-on-surface focus:outline-none cursor-pointer"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="all">All Genres</option>
                <option value="Fiction">Literary Fiction</option>
                <option value="Science Fiction">Science Fiction</option>
                <option value="Non-Fiction">Non-Fiction &amp; Memoir</option>
                <option value="Technology">Tech &amp; Engineering</option>
                <option value="Philosophy">Philosophy &amp; Ethics</option>
              </select>
            </div>

            {/* Action Raised Button */}
            <Button type="submit" variant="primary" icon="tune" className="w-full md:w-auto shrink-0">
              Quick Search
            </Button>
          </form>

          {/* Trending Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t-0 text-xs">
            <span className="text-on-surface-variant font-medium text-[11px] mr-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-primary">trending_up</span> Trending:
            </span>
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleTrendingClick(topic)}
                className="px-3 py-1 rounded-full bg-surface text-on-surface-variant text-[11px] neo-raised-sm hover:text-primary transition-all cursor-pointer"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-surface neo-raised space-y-3">
            <div className="w-12 h-12 rounded-xl bg-surface neo-pressed flex items-center justify-center text-primary font-bold">
              <span className="material-symbols-outlined text-[26px]">auto_awesome</span>
            </div>
            <h3 className="text-base font-bold font-headline text-on-surface">AI-Powered Taste Matching</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Personalized literary recommendations generated by our FastAPI machine-learning engine using transparent, content-based algorithms.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface neo-raised space-y-3">
            <div className="w-12 h-12 rounded-xl bg-surface neo-pressed flex items-center justify-center text-emerald-600 font-bold">
              <span className="material-symbols-outlined text-[26px]">book</span>
            </div>
            <h3 className="text-base font-bold font-headline text-on-surface">Seamless Digital Circulation</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Instant volume checkout, automated due date calculations, overdue audits, and atomic inventory stock tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface neo-raised space-y-3">
            <div className="w-12 h-12 rounded-xl bg-surface neo-pressed flex items-center justify-center text-tertiary font-bold">
              <span className="material-symbols-outlined text-[26px]">tune</span>
            </div>
            <h3 className="text-base font-bold font-headline text-on-surface">Custom Reading Taste Profile</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Fine-tune preferred genres, favorite authors, and topics to guide the recommendation engine toward your specific academic or recreational interests.
            </p>
          </div>
        </div>
      </section>

      {/* Featured & Highly Rated Spotlight */}
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-6 mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary font-headline">
              Curated Selection
            </div>
            <h2 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface m-0">
              Featured &amp; Highly Rated Volumes
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Top curated books available across our central flagship and digital archives.
            </p>
          </div>
          <Link
            to="/books"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Volumes</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <BookGrid books={books.slice(0, 4)} loading={loading} skeletonCount={4} />
      </section>

      {/* Patron Invitation Banner */}
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-surface neo-raised p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">local_library</span>
              Universal Card Access
            </div>
            <h3 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
              Ready to explore your next favorite read?
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Sign up for your BookSphere library card in seconds. Check out digital volumes, curate your personal favorites shelf, and unlock tailored recommendations.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="lg"
              icon="arrow_forward"
              onClick={() => navigate(isAuthenticated ? '/recommendations' : '/register')}
            >
              {isAuthenticated ? 'Open AI Recommendations' : 'Get Library Card Now'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
