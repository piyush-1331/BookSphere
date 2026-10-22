import { useState } from 'react';

/**
 * Reusable SearchBar component with Stitch Silk neomorphic styling.
 * Supports:
 * - General keyword search (title, author, genre, description, ISBN)
 * - Specific Title search
 * - Specific Author search
 */
export const SearchBar = ({
  search = '',
  title = '',
  author = '',
  value = '',
  onSearch,
  placeholder = '',
  className = '',
}) => {
  // Determine current active search mode and term from incoming props
  const targetScope = title ? 'title' : author && !search ? 'author' : 'general';
  const targetTerm = title || (author && !search ? author : search || value || '');

  const [searchType, setSearchType] = useState(targetScope);
  const [term, setTerm] = useState(targetTerm);
  const [prevTargetScope, setPrevTargetScope] = useState(targetScope);
  const [prevTargetTerm, setPrevTargetTerm] = useState(targetTerm);

  // Synchronize when query parameters change externally (e.g., bookmark, reset, back navigation)
  if (targetScope !== prevTargetScope || targetTerm !== prevTargetTerm) {
    setPrevTargetScope(targetScope);
    setPrevTargetTerm(targetTerm);
    setSearchType(targetScope);
    setTerm(targetTerm);
  }

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

  const dynamicPlaceholder =
    placeholder ||
    (searchType === 'title'
      ? 'Search volumes specifically by title...'
      : searchType === 'author'
      ? 'Search volumes specifically by author name...'
      : 'Search by title, author, genre, description, or ISBN...');

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full ${className}`}
    >
      {/* Search Scope Mode Selector */}
      <div className="flex items-center p-1 rounded-2xl bg-surface neo-pressed-sm self-start sm:self-auto shrink-0">
        {[
          { id: 'general', label: 'All Fields', icon: 'manage_search' },
          { id: 'title', label: 'Title', icon: 'menu_book' },
          { id: 'author', label: 'Author', icon: 'person' },
        ].map((scope) => (
          <button
            key={scope.id}
            type="button"
            onClick={() => handleScopeChange(scope.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              searchType === scope.id
                ? 'bg-surface text-primary neo-raised-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">{scope.icon}</span>
            <span>{scope.label}</span>
          </button>
        ))}
      </div>

      {/* Main Search Input & Actions */}
      <div className="relative flex-1 flex items-center rounded-2xl bg-surface neo-pressed-input transition-all focus-within:ring-2 focus-within:ring-primary/40">
        <span className="absolute left-4 text-outline material-symbols-outlined text-[20px] pointer-events-none select-none">
          {searchType === 'title' ? 'menu_book' : searchType === 'author' ? 'person_search' : 'search'}
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
    </form>
  );
};

export default SearchBar;
