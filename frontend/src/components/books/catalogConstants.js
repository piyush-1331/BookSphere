export const GENRES = [
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

export const CATEGORIES = [
  'All Categories',
  'Architecture',
  'Literary Fiction',
  'Science & Technology',
  'Rare Manuscripts',
  'Arts & Humanities',
  'Philosophy & Ethics',
  'History & Civilization',
];

export const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest', sortBy: 'createdAt', order: 'desc' },
  { id: 'title-asc', label: 'Title (A-Z)', sortBy: 'title', order: 'asc' },
  { id: 'title-desc', label: 'Title (Z-A)', sortBy: 'title', order: 'desc' },
  { id: 'popularity', label: 'Popularity', sortBy: 'rating', order: 'desc' },
];

export const SUGGESTED_INQUIRIES = [
  'Quantum Cosmology',
  'Architectural Theory',
  'Neurological Habits',
  'Speculative AI Fiction',
  'Helena Vance',
  'Andy Weir',
];

export const SEARCH_SCOPES = [
  {
    id: 'general',
    label: 'All Fields',
    icon: 'manage_search',
    placeholder: 'Search by title, author, ISBN, category, or genre...',
  },
  {
    id: 'title',
    label: 'Title',
    icon: 'menu_book',
    placeholder: 'Search specifically by book title...',
  },
  {
    id: 'author',
    label: 'Author',
    icon: 'person',
    placeholder: 'Search specifically by author name...',
  },
  {
    id: 'isbn',
    label: 'ISBN',
    icon: 'pin',
    placeholder: 'Search by ISBN-10 or ISBN-13 (e.g. 978-0-...)...',
  },
  {
    id: 'category',
    label: 'Category',
    icon: 'category',
    placeholder: 'Search specifically by book category...',
  },
  {
    id: 'genre',
    label: 'Genre',
    icon: 'auto_stories',
    placeholder: 'Search specifically by book genre...',
  },
];
