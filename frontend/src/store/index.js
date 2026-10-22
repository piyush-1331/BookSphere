import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import booksReducer from './slices/booksSlice';
import favoritesReducer from './slices/favoritesSlice';
import borrowReducer from './slices/borrowSlice';
import recommendationReducer from './slices/recommendationSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    favorites: favoritesReducer,
    borrow: borrowReducer,
    recommendations: recommendationReducer,
    user: userReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
