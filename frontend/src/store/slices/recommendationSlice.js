import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/axiosClient';
import { borrowBook, returnBook } from './borrowSlice';

export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetchRecommendations',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const response = await api.recommendations.get(payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch recommendations');
    }
  }
);

const initialState = {
  items: [],
  strategy: null,
  isPersonalized: false,
  isFallback: false,
  disclaimer: '',
  total: 0,
  loading: false,
  error: null,
};

const recommendationSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    clearRecommendationError: (state) => {
      state.error = null;
    },
    updateRecommendationAvailability: (state, action) => {
      const { bookId, availableCopies } = action.payload;
      state.items = state.items.map((item) => {
        const b = item.book || item;
        const bId = b._id || b.id;
        if (bId === bookId) {
          return {
            ...item,
            book: {
              ...b,
              availableCopies,
              status: availableCopies > 0 ? 'available' : 'borrowed',
            },
          };
        }
        return item;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.strategy = action.payload.strategy || 'content_based';
        state.isPersonalized = Boolean(action.payload.is_personalized);
        state.isFallback = Boolean(action.payload.is_fallback);
        state.disclaimer = action.payload.disclaimer || '';
        state.total = action.payload.total || 0;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Synchronize availability immediately when a book is checked out
      .addCase(borrowBook.fulfilled, (state, action) => {
        const bookId =
          action.payload?.book?._id ||
          action.payload?.book ||
          action.meta?.arg?.bookId;
        if (bookId) {
          state.items = state.items.map((item) => {
            const b = item.book || item;
            const bId = b._id || b.id;
            if (bId === bookId) {
              const currentCopies = typeof b.availableCopies === 'number' ? b.availableCopies : 1;
              const newCopies = Math.max(0, currentCopies - 1);
              return {
                ...item,
                book: {
                  ...b,
                  availableCopies: newCopies,
                  status: newCopies === 0 ? 'borrowed' : b.status,
                },
              };
            }
            return item;
          });
        }
      })

      // Synchronize availability immediately when a book is returned
      .addCase(returnBook.fulfilled, (state, action) => {
        const bookId =
          action.payload?.book?._id ||
          action.payload?.book ||
          action.payload?.bookId;
        if (bookId) {
          state.items = state.items.map((item) => {
            const b = item.book || item;
            const bId = b._id || b.id;
            if (bId === bookId) {
              const currentCopies = typeof b.availableCopies === 'number' ? b.availableCopies : 0;
              const newCopies = currentCopies + 1;
              return {
                ...item,
                book: {
                  ...b,
                  availableCopies: newCopies,
                  status: 'available',
                },
              };
            }
            return item;
          });
        }
      });
  },
});

export const { clearRecommendationError, updateRecommendationAvailability } = recommendationSlice.actions;
export default recommendationSlice.reducer;
