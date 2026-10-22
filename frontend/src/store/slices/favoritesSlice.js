import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/axiosClient';

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.favorites.getAll();
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch favorites');
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async ({ bookId, notes }, { rejectWithValue }) => {
    try {
      const response = await api.favorites.add(bookId, notes);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to add to favorites');
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (bookId, { rejectWithValue }) => {
    try {
      await api.favorites.remove(bookId);
      return bookId;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to remove from favorites');
    }
  }
);

const initialState = {
  favorites: [],
  loading: false,
  actionLoadingId: null,
  error: null,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearFavoriteError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload || [];
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add favorite
      .addCase(addFavorite.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg.bookId;
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        const newBookId =
          action.payload?.book?._id || action.payload?.book || action.payload?._id;
        const alreadyExists = state.favorites.some((f) => {
          const fId = f.book?._id || f.book || f._id;
          return fId === newBookId;
        });
        if (!alreadyExists && action.payload) {
          state.favorites.unshift(action.payload);
        }
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload;
      })

      // Remove favorite
      .addCase(removeFavorite.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        state.favorites = state.favorites.filter((f) => {
          const bId = f.book?._id || f.book || f._id;
          return bId !== action.payload;
        });
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload;
      });
  },
});

export const { clearFavoriteError } = favoritesSlice.actions;
export default favoritesSlice.reducer;
