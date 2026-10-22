import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/axiosClient';

export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams = {};
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val;
        }
      });
      const response = await api.books.getAll(cleanParams);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch books');
    }
  }
);

export const fetchBookById = createAsyncThunk(
  'books/fetchBookById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.books.getById(id);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch book details');
    }
  }
);

export const createBook = createAsyncThunk(
  'books/createBook',
  async (bookData, { rejectWithValue }) => {
    try {
      const response = await api.books.create(bookData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create book record');
    }
  }
);

export const updateBook = createAsyncThunk(
  'books/updateBook',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.books.update(id, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update book record');
    }
  }
);

export const deleteBook = createAsyncThunk(
  'books/deleteBook',
  async (id, { rejectWithValue }) => {
    try {
      await api.books.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete book record');
    }
  }
);

const initialFilters = {
  search: '',
  genre: '',
  category: '',
  available: '',
  sortBy: 'createdAt',
  order: 'desc',
};

const initialState = {
  books: [],
  selectedBook: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: initialFilters,
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialFilters;
    },
    clearSelectedBook: (state) => {
      state.selectedBook = null;
    },
    clearBookError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch books
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload.data || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch book details
      .addCase(fetchBookById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchBookById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedBook = action.payload;
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // Create book
      .addCase(createBook.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createBook.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.books.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createBook.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update book
      .addCase(updateBook.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateBook.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.books.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) {
          state.books[index] = action.payload;
        }
        if (state.selectedBook?._id === action.payload._id) {
          state.selectedBook = action.payload;
        }
      })
      .addCase(updateBook.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete book
      .addCase(deleteBook.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.books = state.books.filter((b) => b._id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteBook.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Sync available copies when a book is returned
      .addCase('borrow/returnBook/fulfilled', (state, action) => {
        const bookId =
          action.payload?.book?._id ||
          (typeof action.payload?.book === 'string' ? action.payload?.book : null);
        if (bookId) {
          const bookInList = state.books.find((b) => b._id === bookId);
          if (bookInList) {
            bookInList.availableCopies = (bookInList.availableCopies || 0) + 1;
            if (bookInList.status === 'borrowed') {
              bookInList.status = 'available';
            }
          }
          if (state.selectedBook && state.selectedBook._id === bookId) {
            state.selectedBook.availableCopies = (state.selectedBook.availableCopies || 0) + 1;
            if (state.selectedBook.status === 'borrowed') {
              state.selectedBook.status = 'available';
            }
          }
        }
      })

      // Sync available copies when a book is borrowed
      .addCase('borrow/borrowBook/fulfilled', (state, action) => {
        const bookId =
          action.payload?.book?._id ||
          (typeof action.payload?.book === 'string' ? action.payload?.book : null);
        if (bookId) {
          const bookInList = state.books.find((b) => b._id === bookId);
          if (bookInList && bookInList.availableCopies > 0) {
            bookInList.availableCopies -= 1;
            if (bookInList.availableCopies === 0) {
              bookInList.status = 'borrowed';
            }
          }
          if (state.selectedBook && state.selectedBook._id === bookId && state.selectedBook.availableCopies > 0) {
            state.selectedBook.availableCopies -= 1;
            if (state.selectedBook.availableCopies === 0) {
              state.selectedBook.status = 'borrowed';
            }
          }
        }
      });
  },
});

export const { setFilters, resetFilters, clearSelectedBook, clearBookError } =
  booksSlice.actions;
export default booksSlice.reducer;
