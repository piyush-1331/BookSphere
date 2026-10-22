import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBooks,
  createBook,
  updateBook,
  deleteBook,
  clearBookError,
} from '../store/slices/booksSlice';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

const INITIAL_FORM = {
  title: '',
  author: '',
  isbn: '',
  genre: 'Fiction',
  category: 'General',
  publishedYear: new Date().getFullYear(),
  publisher: 'BookSphere Academic Editions',
  totalCopies: 5,
  availableCopies: 5,
  coverImage: '',
  description: '',
  status: 'available',
};

export const AdminBooksPage = () => {
  const dispatch = useDispatch();
  const { books, pagination, loading, actionLoading, error } = useSelector(
    (state) => state.books
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');

  const loadBooks = useCallback(() => {
    dispatch(
      fetchBooks({
        page: currentPage,
        limit: 10,
        search: submittedSearch || undefined,
      })
    );
  }, [dispatch, currentPage, submittedSearch]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSubmittedSearch(searchTerm.trim());
  };

  const handleOpenAdd = () => {
    setFormData({
      ...INITIAL_FORM,
      coverImage:
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.ISBN || book.isbn || '',
      genre: book.genre || 'Fiction',
      category: book.category || 'General',
      publishedYear: book.publicationYear || book.publishedYear || new Date().getFullYear(),
      publisher: book.publisher || 'BookSphere Academic Editions',
      totalCopies: book.totalCopies ?? 5,
      availableCopies: book.availableCopies ?? 5,
      coverImage: book.coverImage || '',
      description: book.description || '',
      status: book.status || 'available',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (book) => {
    setSelectedBook(book);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.coverImage) {
      setFormError('Cover Image URL is required.');
      return;
    }

    const payload = {
      ...formData,
      ISBN: formData.isbn || formData.ISBN,
      publicationYear: Number(formData.publishedYear || formData.publicationYear || new Date().getFullYear()),
      publisher: formData.publisher || 'BookSphere Academic Editions',
      category: formData.category || formData.genre || 'General',
      description:
        formData.description && formData.description.trim().length >= 10
          ? formData.description.trim()
          : `${formData.title} by ${formData.author}. Registered in BookSphere catalog.`,
    };

    try {
      await dispatch(createBook(payload)).unwrap();
      setIsAddModalOpen(false);
      loadBooks();
    } catch (err) {
      setFormError(err || 'Failed to add book to catalog.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      ...formData,
      ISBN: formData.isbn || formData.ISBN,
      publicationYear: Number(formData.publishedYear || formData.publicationYear || new Date().getFullYear()),
      publisher: formData.publisher || 'BookSphere Academic Editions',
      category: formData.category || formData.genre || 'General',
      status: formData.status || 'available',
    };
    try {
      await dispatch(
        updateBook({ id: selectedBook._id, data: payload })
      ).unwrap();
      setIsEditModalOpen(false);
      loadBooks();
    } catch (err) {
      setFormError(err || 'Failed to update book.');
    }
  };


  const handleDeleteConfirm = async () => {
    if (!selectedBook) return;
    try {
      await dispatch(deleteBook(selectedBook._id)).unwrap();
      setIsDeleteModalOpen(false);
      loadBooks();
    } catch (err) {
      setFormError(err || 'Failed to delete book.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="admin" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* Top Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              Bibliographic Record Engine
            </div>
            <h1 className="text-2xl lg:text-3xl font-headline font-semibold text-on-surface tracking-tight m-0">
              Book Inventory &amp; Archival Registry
            </h1>
            <p className="text-xs lg:text-sm text-on-surface-variant font-normal leading-relaxed">
              Search, catalog, edit, and audit print volumes, digital EPUB folios, audiobooks, and rare manuscript archives across all depository branches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon="add_circle"
              onClick={handleOpenAdd}
            >
              Register New Volume
            </Button>
          </div>
        </div>

        {/* Summary Metrics Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface neo-raised flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface neo-pressed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]">library_books</span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block truncate">
                Total Cataloged
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-headline font-semibold text-on-surface">
                  {pagination?.total || books.length}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">unique volumes</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface neo-raised flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface neo-pressed flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[22px]">shelves</span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block truncate">
                Physical Stacks
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-headline font-semibold text-on-surface">Available</span>
                <span className="text-[10px] text-emerald-600 font-medium">Ready to Loan</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface neo-raised flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface neo-pressed flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block truncate">
                Multi-Format
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-headline font-semibold text-on-surface">EPUB / Print</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Sync Active</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface neo-raised flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface neo-pressed flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block truncate">
                Catalog Status
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-headline font-semibold text-emerald-700">Online</span>
                <span className="text-[10px] text-on-surface-variant font-medium">All Stacks</span>
              </div>

            </div>
          </div>
        </div>

        {/* Search & Filter Command Console */}
        <div className="p-5 rounded-2xl bg-surface neo-raised flex flex-col md:flex-row items-stretch md:items-center gap-3.5">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl bg-surface neo-pressed-input flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search by title, author, ISBN-13, or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-xs text-on-surface placeholder:text-on-surface-variant/70 font-medium"
              />
              <span className="text-[10px] text-outline font-mono">⏎</span>
            </div>
            <Button type="submit" variant="secondary" size="md">
              Filter Catalog
            </Button>
          </form>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => dispatch(clearBookError())}
              className="text-rose-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Table / List */}
        {loading ? (
          <LoadingSkeleton variant="tableRow" count={6} />
        ) : books.length === 0 ? (
          <EmptyState
            icon="menu_book"
            title="No catalog entries found"
            description="No books found matching your current search query. Try clearing the search or add a new volume."
            actionLabel="Add Book"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl neo-raised overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-on-surface-variant">
                  <thead className="bg-surface neo-pressed text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    <tr>
                      <th className="px-6 py-4">Volume</th>
                      <th className="px-6 py-4">Genre</th>
                      <th className="px-6 py-4">ISBN</th>
                      <th className="px-6 py-4">Total Stock</th>
                      <th className="px-6 py-4">Available</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {books.map((book) => (
                      <tr key={book._id} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                book.coverImage ||
                                'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80'
                              }
                              alt={book.title}
                              className="w-10 h-14 object-cover rounded-md shadow-sm shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-headline font-semibold text-on-surface truncate max-w-xs m-0">
                                {book.title}
                              </p>
                              <p className="text-xs text-on-surface-variant truncate m-0">
                                by {book.author}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-surface neo-pressed-sm text-primary">
                            {book.genre || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-outline">
                          {book.isbn || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-bold text-on-surface">
                          {book.totalCopies ?? 0}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-bold ${
                              (book.availableCopies ?? 0) > 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {book.availableCopies ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(book)}
                              className="p-2 text-on-surface-variant hover:text-primary bg-surface neo-raised-sm hover:neo-pressed-sm rounded-lg transition-all cursor-pointer"
                              title="Edit Book"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenDelete(book)}
                              className="p-2 text-on-surface-variant hover:text-error bg-surface neo-raised-sm hover:neo-pressed-sm rounded-lg transition-all cursor-pointer"
                              title="Delete Book"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            )}
          </div>
        )}
      </main>

      {/* Add Book Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Book"
        subtitle="Catalog a new volume into the library inventory system."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Input
              label="Author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />
            <Input
              label="ISBN"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              required
            />
            <Input
              label="Genre"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              required
            />
            <Input
              label="Published Year"
              type="number"
              value={formData.publishedYear}
              onChange={(e) =>
                setFormData({ ...formData, publishedYear: Number(e.target.value) })
              }
              required
            />
            <Input
              label="Total Stock Copies"
              type="number"
              min="1"
              value={formData.totalCopies}
              onChange={(e) => {
                const total = Number(e.target.value);
                setFormData({
                  ...formData,
                  totalCopies: total,
                  availableCopies: total,
                });
              }}
              required
            />
          </div>

          <Input
            label="Cover Image URL"
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            required
            helperText="Must be a valid web image URL."
          />

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1.5">
              Description / Synopsis
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-surface neo-pressed-input rounded-xl text-xs font-medium text-on-surface outline-none"
              placeholder="Enter synopsis or literary notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-container-high">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading} icon="check">
              Create Book Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Book Details"
        subtitle={`Updating "${selectedBook?.title}"`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Input
              label="Author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />
            <Input
              label="Genre"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              required
            />
            <Input
              label="Published Year"
              type="number"
              value={formData.publishedYear}
              onChange={(e) =>
                setFormData({ ...formData, publishedYear: Number(e.target.value) })
              }
              required
            />
            <Input
              label="Total Stock Copies"
              type="number"
              value={formData.totalCopies}
              onChange={(e) =>
                setFormData({ ...formData, totalCopies: Number(e.target.value) })
              }
              required
            />
            <Input
              label="Available Copies"
              type="number"
              value={formData.availableCopies}
              onChange={(e) =>
                setFormData({ ...formData, availableCopies: Number(e.target.value) })
              }
              required
            />
          </div>

          <Input
            label="Cover Image URL"
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1.5">
              Catalog Standing / Circulation Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2.5 bg-surface neo-pressed-input rounded-xl text-xs font-medium text-on-surface outline-none cursor-pointer"
            >
              <option value="available">Available (Active in circulation)</option>
              <option value="borrowed">Borrowed (All copies out)</option>
              <option value="reserved">Reserved (On institutional hold)</option>
              <option value="maintenance">Maintenance (Restoration / Binding repair)</option>
              <option value="archived">Archived / Deactivated (Retired from search)</option>
            </select>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Select "Archived" to safely deactivate this volume from public circulation without losing historical loan records.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1.5">
              Description / Synopsis
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-surface neo-pressed-input rounded-xl text-xs font-medium text-on-surface outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-container-high">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading} icon="save">
              Save Modifications
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Retire Volume from Catalog"
        subtitle={selectedBook?.title}
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Are you sure you want to delete <strong className="text-on-surface">{selectedBook?.title}</strong>? This will permanently retire this volume from the BookSphere catalog.
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-container-high">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={handleDeleteConfirm}
              icon="delete"
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminBooksPage;
