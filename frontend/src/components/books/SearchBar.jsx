import { useState } from 'react';
import { CATEGORIES, GENRES, SEARCH_SCOPES } from './catalogConstants';

// Helper pure functions to determine active scope and term from props
const computeActiveScope = ({ scope, title, author, isbn, category, genre, search }) => {
  if (scope && scope !== 'general') return scope;
  if (title && !search && !author && !isbn) return 'title';
  if (author && !search && !title && !isbn) return 'author';
  if (isbn && !search && !title && !author) return 'isbn';
  if (category && !search && !title && !author && !isbn && !genre) return 'category';
  if (genre && !search && !title && !author && !isbn && !category) return 'genre';
  return 'general';
};

const computeActiveTerm = ({ search, title, author, isbn, category, genre, value }) => {
  if (search) return search;
  if (title && !author && !isbn) return title;
  if (author && !title && !isbn) return author;
  if (isbn && !title && !author) return isbn;
  if (category && !title && !author && !isbn && !genre) return category;
  if (genre && !title && !author && !isbn && !category) return genre;
  return value || '';
};

/**
 * Advanced SearchBar component supporting:
 * 1. Single-input search with selectable search scopes (All Fields, Title, Author, ISBN, Category, Genre)
 * 2. Multi-field Advanced Search drawer (combining Title, Author, ISBN, Category, Genre simultaneously)
 * 3. Neomorphic BookSphere Silk design tokens and responsiveness
 */
export const SearchBar = ({
  search = '',
  scope = 'general',
  title = '',
  author = '',
  isbn = '',
  category = '',
  genre = '',
  value = '',
  onSearch,
  onAdvancedSearch,
  onReset,
  placeholder = '',
  className = '',
}) => {
  const [searchType, setSearchType] = useState(() =>
    computeActiveScope({ scope, title, author, isbn, category, genre, search })
  );
  const [term, setTerm] = useState(() =>
    computeActiveTerm({ search, title, author, isbn, category, genre, value })
  );

  // Advanced search form state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advTitle, setAdvTitle] = useState(title || '');
  const [advAuthor, setAdvAuthor] = useState(author || '');
  const [advIsbn, setAdvIsbn] = useState(isbn || '');
  const [advCategory, setAdvCategory] = useState(category || '');
  const [advGenre, setAdvGenre] = useState(genre || '');

  // Track previous props to adjust state during render when external query changes
  const [prevProps, setPrevProps] = useState({
    search,
    scope,
    title,
    author,
    isbn,
    category,
    genre,
    value,
  });

  if (
    search !== prevProps.search ||
    scope !== prevProps.scope ||
    title !== prevProps.title ||
    author !== prevProps.author ||
    isbn !== prevProps.isbn ||
    category !== prevProps.category ||
    genre !== prevProps.genre ||
    value !== prevProps.value
  ) {
    setPrevProps({
      search,
      scope,
      title,
      author,
      isbn,
      category,
      genre,
      value,
    });
    setSearchType(computeActiveScope({ scope, title, author, isbn, category, genre, search }));
    setTerm(computeActiveTerm({ search, title, author, isbn, category, genre, value }));
    setAdvTitle(title || '');
    setAdvAuthor(author || '');
    setAdvIsbn(isbn || '');
    setAdvCategory(category || '');
    setAdvGenre(genre || '');
  }

  // Check if multiple advanced fields are actively populated
  const activeAdvancedCount = [
    Boolean(title),
    Boolean(author),
    Boolean(isbn),
    Boolean(category && category !== 'All Categories'),
    Boolean(genre && genre !== 'All Genres'),
  ].filter(Boolean).length;

  const triggerSearch = (queryTerm, queryType) => {
    if (typeof onSearch === 'function') {
      onSearch({ term: queryTerm, type: queryType });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    triggerSearch(term.trim(), searchType);
  };

  const handleClear = () => {
    setTerm('');
    triggerSearch('', searchType);
  };

  const handleScopeChange = (scopeId) => {
    setSearchType(scopeId);
    if (term.trim()) {
      triggerSearch(term.trim(), scopeId);
    }
  };

  const handleAdvancedSubmit = (e) => {
    e.preventDefault();
    if (typeof onAdvancedSearch === 'function') {
      onAdvancedSearch({
        title: advTitle.trim(),
        author: advAuthor.trim(),
        isbn: advIsbn.trim(),
        category: advCategory.trim(),
        genre: advGenre.trim(),
      });
    }
  };

  const handleAdvancedReset = () => {
    setAdvTitle('');
    setAdvAuthor('');
    setAdvIsbn('');
    setAdvCategory('');
    setAdvGenre('');
    setTerm('');
    if (typeof onReset === 'function') {
      onReset();
    } else if (typeof onSearch === 'function') {
      onSearch({ term: '', type: 'general' });
    }
  };

  const activeScopeObj =
    SEARCH_SCOPES.find((s) => s.id === searchType) || SEARCH_SCOPES[0];

  const dynamicPlaceholder =
    placeholder || activeScopeObj.placeholder;

  return (
    <div className={`w-full flex flex-col gap-4 ${className}`}>
      {/* Search Scope Mode Selector */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface neo-pressed-sm overflow-x-auto no-scrollbar scroll-smooth">
        <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider px-2 shrink-0 hidden sm:inline-block">
          Search By:
        </span>
        {SEARCH_SCOPES.map((scopeItem) => (
          <button
            key={scopeItem.id}
            type="button"
            onClick={() => handleScopeChange(scopeItem.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              searchType === scopeItem.id
                ? 'bg-surface text-primary neo-raised-sm font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">{scopeItem.icon}</span>
            <span>{scopeItem.label}</span>
          </button>
        ))}
      </div>

      {/* Main Search Input & Actions */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full"
      >
        <div className="relative flex-1 flex items-center rounded-2xl bg-surface neo-pressed-input transition-all focus-within:ring-2 focus-within:ring-primary/40">
          <span className="absolute left-4 text-outline material-symbols-outlined text-[20px] pointer-events-none select-none">
            {activeScopeObj.icon}
          </span>

          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={dynamicPlaceholder}
            className="w-full bg-transparent py-3.5 pl-12 pr-28 text-sm font-medium text-on-surface placeholder:text-outline outline-none"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {term && (
              <button
                type="button"
                onClick={handleClear}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-surface neo-raised-sm hover:neo-pressed-sm text-primary text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Search</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Advanced Search Toggle Button */}
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            advancedOpen || activeAdvancedCount > 1
              ? 'bg-surface text-primary neo-pressed-sm border border-primary/20'
              : 'bg-surface text-on-surface-variant neo-raised hover:text-on-surface'
          }`}
          title="Toggle Multi-Field Advanced Search"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Advanced Search</span>
          {activeAdvancedCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {activeAdvancedCount}
            </span>
          )}
          <span className="material-symbols-outlined text-[16px] transition-transform duration-200">
            {advancedOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </form>

      {/* Advanced Multi-Field Search Panel */}
      {advancedOpen && (
        <form
          onSubmit={handleAdvancedSubmit}
          className="w-full rounded-2xl bg-surface p-6 neo-raised flex flex-col gap-5 border border-surface-container-high/40 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-surface-container-high/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">manage_search</span>
              <h3 className="text-sm font-headline font-semibold text-on-surface m-0">
                Advanced Multi-Field Book Search
              </h3>
            </div>
            <span className="text-xs text-on-surface-variant">
              Match volumes across specific fields simultaneously
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Title Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                Book Title
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={advTitle}
                  onChange={(e) => setAdvTitle(e.target.value)}
                  placeholder="e.g. Chronology of Stars..."
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface placeholder:text-outline outline-none"
                />
                <span className="material-symbols-outlined text-outline text-[16px] absolute left-2.5 pointer-events-none">
                  menu_book
                </span>
                {advTitle && (
                  <button
                    type="button"
                    onClick={() => setAdvTitle('')}
                    className="absolute right-2.5 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Author Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                Author
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={advAuthor}
                  onChange={(e) => setAdvAuthor(e.target.value)}
                  placeholder="e.g. Finch, Alistair..."
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface placeholder:text-outline outline-none"
                />
                <span className="material-symbols-outlined text-outline text-[16px] absolute left-2.5 pointer-events-none">
                  person
                </span>
                {advAuthor && (
                  <button
                    type="button"
                    onClick={() => setAdvAuthor('')}
                    className="absolute right-2.5 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* ISBN Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                ISBN Identifier
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={advIsbn}
                  onChange={(e) => setAdvIsbn(e.target.value)}
                  placeholder="e.g. 978-0-1234-5678-9..."
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface placeholder:text-outline outline-none"
                />
                <span className="material-symbols-outlined text-outline text-[16px] absolute left-2.5 pointer-events-none">
                  pin
                </span>
                {advIsbn && (
                  <button
                    type="button"
                    onClick={() => setAdvIsbn('')}
                    className="absolute right-2.5 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                Category
              </label>
              <div className="relative flex items-center">
                <select
                  value={advCategory || 'All Categories'}
                  onChange={(e) => setAdvCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface outline-none cursor-pointer appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-outline text-[16px] absolute left-2.5 pointer-events-none">
                  category
                </span>
                <span className="material-symbols-outlined text-outline text-[16px] absolute right-3 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Genre Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                Genre
              </label>
              <div className="relative flex items-center">
                <select
                  value={advGenre || 'All Genres'}
                  onChange={(e) => setAdvGenre(e.target.value === 'All Genres' ? '' : e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-surface neo-pressed-sm text-xs font-semibold text-on-surface outline-none cursor-pointer appearance-none"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-outline text-[16px] absolute left-2.5 pointer-events-none">
                  auto_stories
                </span>
                <span className="material-symbols-outlined text-outline text-[16px] absolute right-3 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Actions Buttons inside grid for alignment */}
            <div className="flex items-end gap-2 pt-1 sm:pt-0">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-surface neo-raised hover:neo-pressed text-primary text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Apply Search</span>
              </button>
              <button
                type="button"
                onClick={handleAdvancedReset}
                className="py-2.5 px-3.5 rounded-xl bg-surface neo-raised-sm hover:neo-pressed-sm text-on-surface-variant hover:text-error text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Reset all advanced search fields"
              >
                <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SearchBar;
