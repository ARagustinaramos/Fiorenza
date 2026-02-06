import { configureStore } from '@reduxjs/toolkit'
import usersReducer from './slices/usersSlice'
import productsReducer from './slices/productsSlice'
import cartReducer from './slices/cartSlice'

export const store = configureStore({
  reducer: {
    users: usersReducer,
    products: productsReducer,
    cart: cartReducer,
  },
})







