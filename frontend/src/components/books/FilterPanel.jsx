const GENRES = [
  'All Genres',
  'Architecture & Design',
  'Speculative Fiction',
  'Computer Science',
  'Literary Fiction',
  'Astrophysics',
  'Historical Epigraphy',
  'Environmental Science',
  'Philosophy & Ethics',
  'Science Fiction',
  'History',
  'Psychology',
];

const CATEGORIES = [
  'All Categories',
  'Architecture',
  'Literary Fiction',
  'Science & Technology',
  'Rare Manuscripts',
  'Arts & Humanities',
  'Philosophy & Ethics',
  'History & Civilization',
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest', sortBy: 'createdAt', order: 'desc' },
  { id: 'title-asc', label: 'Title (A-Z)', sortBy: 'title', order: 'asc' },
  { id: 'title-desc', label: 'Title (Z-A)', sortBy: 'title', order: 'desc' },
  { id: 'popularity', label: 'Popularity', sortBy: 'rating', order: 'desc' },
];

const SUGGESTED_INQUIRIES = [
  'Quantum Cosmology',
  'Architectural Theory',
  'Neurological Habits',
  'Speculative AI Fiction',
  'Helena Vance',
  'Andy Weir',
];

/**
 * FilterPanel component supporting genre, category, author, availability,
 * and sorting (newest, title A-Z, title Z-A, popularity) in Stitch neomorphic style.
 */
export const FilterPanel = ({
  filters = {},
  onFilterChange,
  onResetFilters,
  className = '',
}) => {
  const currentGenre = filters.genre || 'All Genres';
  const currentCategory = filters.category || 'All Categories';
  const currentAuthor = filters.author || '';
  const currentAvailability = filters.availability || 'all';

  const handleSortChange = (e) => {
    const selected = SORT_OPTIONS.find((opt) => opt.id === e.target.value);
    if (selected) {
      onFilterChange({ sortBy: selected.sortBy, order: selected.order });
    }
  };

  const currentSortId =
    SORT_OPTIONS.find(
      (opt) =>
        opt.sortBy === filters.sortBy &&
        (opt.order === filters.order || (!filters.order && opt.order === 'desc'))
    )?.id || 'newest';

  const hasActiveFilters =
    Boolean(filters.genre) ||
    Boolean(filters.category) ||
    Boolean(filters.author) ||
    Boolean(filters.search) ||
    Boolean(filters.title) ||
    (filters.availability && filters.availability !== 'all');

  return (
    <div
      className={`w-full rounded-2xl bg-surface p-6 neo-raised flex flex-col gap-5 ${className}`}
    >
      {/* Top Filter Controls: Category, Genre, Author, Availability, Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* 1. Category Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            Category
          </label>
          <div className="relative flex items-center">
            <select
              value={currentCategory}
              onChange={(e) =>
                onFilterChange({
                  category: e.target.value === 'All Categories' ? '' : e.target.value,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface outline-none cursor-pointer appearance-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-outline text-[16px] absolute right-3 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* 2. Genre Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            Genre
          </label>
          <div className="relative flex items-center">
            <select
              value={currentGenre}
              onChange={(e) =>
                onFilterChange({
                  genre: e.target.value === 'All Genres' ? '' : e.target.value,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface outline-none cursor-pointer appearance-none"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-outline text-[16px] absolute right-3 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* 3. Author Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            Author
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={currentAuthor}
              onChange={(e) => onFilterChange({ author: e.target.value })}
              placeholder="Filter by author..."
              className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface placeholder:text-outline outline-none"
            />
            {currentAuthor ? (
              <button
                type="button"
                onClick={() => onFilterChange({ author: '' })}
                className="absolute right-2.5 text-outline hover:text-on-surface"
                title="Clear author"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            ) : (
              <span className="material-symbols-outlined text-outline text-[16px] absolute right-2.5 pointer-events-none">
                person
              </span>
            )}
          </div>
        </div>

        {/* 4. Availability Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            Availability
          </label>
          <div className="relative flex items-center">
            <select
              value={currentAvailability}
              onChange={(e) => onFilterChange({ availability: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface outline-none cursor-pointer appearance-none"
            >
              <option value="all">All Copies</option>
              <option value="available">Available Now</option>
              <option value="unavailable">Checked Out</option>
            </select>
            <span className="material-symbols-outlined text-outline text-[16px] absolute right-3 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* 5. Sort Dropdown (newest, title A-Z, title Z-A, popularity) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
            Sorting Order
          </label>
          <div className="relative flex items-center">
            <select
              value={currentSortId}
              onChange={handleSortChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface outline-none cursor-pointer appearance-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-outline text-[16px] absolute right-3 pointer-events-none">
              swap_vert
            </span>
          </div>
        </div>
      </div>

      {/* Active Filter Chips & Reset Action */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-surface-container-high/60 text-xs">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">Active Filters:</span>

            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface neo-raised-sm text-xs text-on-surface">
                <span className="text-primary font-semibold">Search:</span> "{filters.search}"
                <button
                  type="button"
                  onClick={() => onFilterChange({ search: '' })}
                  className="hover:text-error transition-colors flex items-center ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}

            {filters.title && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface neo-raised-sm text-xs text-on-surface">
                <span className="text-primary font-semibold">Title:</span> "{filters.title}"
                <button
                  type="button"
                  onClick={() => onFilterChange({ title: '' })}
                  className="hover:text-error transition-colors flex items-center ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}

            {filters.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface neo-raised-sm text-xs text-on-surface">
                <span className="text-primary font-semibold">Category:</span> {filters.category}
                <button
                  type="button"
                  onClick={() => onFilterChange({ category: '' })}
                  className="hover:text-error transition-colors flex items-center ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}

            {filters.genre && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface neo-raised-sm text-xs text-on-surface">
                <span className="text-primary font-semibold">Genre:</span> {filters.genre}
                <button
                  type="button"
                  onClick={() => onFilterChange({ genre: '' })}
                  className="hover:text-error transition-colors flex items-center ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}

            {filters.author && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface neo-raised-sm text-xs text-on-surface">
                <span className="text-primary font-semibold">Author:</span> {filters.author}
                <button
                  type="button"
                  onClick={() => onFilterChange({ author: '' })}
                  className="hover:text-error transition-colors flex items-center ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}

            {filters.availability && filters.availability !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface neo-raised-sm text-xs text-on-surface">
                <span className="text-primary font-semibold">Availability:</span>{' '}
                {filters.availability === 'available' ? 'Available Now' : 'Checked Out'}
                <button
                  type="button"
                  onClick={() => onFilterChange({ availability: 'all' })}
                  className="hover:text-error transition-colors flex items-center ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            className="px-3.5 py-1.5 rounded-xl bg-surface neo-raised-sm hover:neo-pressed-sm text-xs font-semibold text-secondary hover:text-error transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* Suggested Inquiries / Archival Themes */}
      <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-surface-container-high/60 text-xs">
        <span className="text-on-surface-variant font-medium flex items-center gap-1 mr-1">
          <span className="material-symbols-outlined text-[15px] text-primary">local_fire_department</span>
          <span>Popular Inquiries:</span>
        </span>
        {SUGGESTED_INQUIRIES.map((inquiry) => (
          <button
            key={inquiry}
            type="button"
            onClick={() => onFilterChange({ search: inquiry })}
            className="px-3 py-1 rounded-full bg-surface neo-raised-sm hover:neo-pressed-sm text-on-surface-variant hover:text-primary transition-all text-xs font-medium cursor-pointer"
          >
            {inquiry}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterPanel;
