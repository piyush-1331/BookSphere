import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/axiosClient';

export const fetchMyBorrows = createAsyncThunk(
  'borrow/fetchMyBorrows',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.borrows.getMy(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch borrowing history');
    }
  }
);

export const borrowBook = createAsyncThunk(
  'borrow/borrowBook',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.borrows.borrow(payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to checkout book');
    }
  }
);

export const returnBook = createAsyncThunk(
  'borrow/returnBook',
  async (borrowId, { rejectWithValue }) => {
    try {
      const response = await api.borrows.returnBook(borrowId);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to return book');
    }
  }
);

export const fetchAllBorrows = createAsyncThunk(
  'borrow/fetchAllBorrows',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.borrows.getAll(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch system borrows');
    }
  }
);

export const auditOverdue = createAsyncThunk(
  'borrow/auditOverdue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.borrows.auditOverdue();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to audit overdue loans');
    }
  }
);

export const approveBorrow = createAsyncThunk(
  'borrow/approveBorrow',
  async (borrowId, { rejectWithValue }) => {
    try {
      const response = await api.borrows.approve(borrowId);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve borrow request');
    }
  }
);

export const rejectBorrow = createAsyncThunk(
  'borrow/rejectBorrow',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await api.borrows.reject(id, reason);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reject borrow request');
    }
  }
);

const initialState = {
  myBorrows: [],
  allBorrows: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  adminPagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  loading: false,
  actionLoading: false,
  returningId: null,
  error: null,
  auditMessage: null,
};

const borrowSlice = createSlice({
  name: 'borrow',
  initialState,
  reducers: {
    clearBorrowError: (state) => {
      state.error = null;
    },
    clearAuditMessage: (state) => {
      state.auditMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user's borrows
      .addCase(fetchMyBorrows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBorrows.fulfilled, (state, action) => {
        state.loading = false;
        state.myBorrows = action.payload.data || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchMyBorrows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Borrow book
      .addCase(borrowBook.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(borrowBook.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.myBorrows.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(borrowBook.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Return book
      .addCase(returnBook.pending, (state, action) => {
        state.actionLoading = true;
        state.returningId = action.meta.arg;
        state.error = null;
      })
      .addCase(returnBook.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.returningId = null;
        const index = state.myBorrows.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) {
          state.myBorrows[index] = action.payload;
        }
        const adminIndex = state.allBorrows.findIndex((b) => b._id === action.payload._id);
        if (adminIndex !== -1) {
          state.allBorrows[adminIndex] = action.payload;
        }
      })
      .addCase(returnBook.rejected, (state, action) => {
        state.actionLoading = false;
        state.returningId = null;
        state.error = action.payload;
      })

      // Admin fetch all borrows
      .addCase(fetchAllBorrows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBorrows.fulfilled, (state, action) => {
        state.loading = false;
        state.allBorrows = action.payload.data || [];
        if (action.payload.pagination) {
          state.adminPagination = action.payload.pagination;
        }
      })
      .addCase(fetchAllBorrows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin audit overdue
      .addCase(auditOverdue.fulfilled, (state, action) => {
        state.auditMessage = action.payload.message || 'Overdue audit executed successfully.';
      });
  },
});

export const { clearBorrowError, clearAuditMessage } = borrowSlice.actions;
export default borrowSlice.reducer;
