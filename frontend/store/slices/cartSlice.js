import { createSlice } from '@reduxjs/toolkit'


const loadCartFromStorage = () => {
  if (typeof window !== 'undefined') {
    const savedCart = localStorage.getItem('cart')
    return savedCart ? JSON.parse(savedCart) : []
  }
  return []
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCartFromStorage(),
  },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload
      const existingItem = state.items.find(
        (item) => item.id === product.id
      )

      if (existingItem) {
     
        existingItem.cantidad += 1
      } else {
   
        state.items.push({
          id: product.id,
          nombre: product.descripcion,
          codigo: product.codigoInterno || product.codigoOriginal || '-',
          precioUnitario: product.precioConIva || 0,
          cantidad: 1,
          producto: product, 
        })
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items))
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items))
      }
    },
    updateQuantity: (state, action) => {
      const { id, cantidad } = action.payload
      const item = state.items.find((item) => item.id === id)
      
      if (item) {
        if (cantidad < 1) {
          // Si la cantidad es menor a 1, eliminar el item
          state.items = state.items.filter((item) => item.id !== id)
        } else {
          item.cantidad = cantidad
        }
      }

      // Actualizar localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items))
      }
    },
    clearCart: (state) => {
      state.items = []
      
      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart')
      }
    },
    setCartFromServer: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : []

      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items))
      }
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart, setCartFromServer } = cartSlice.actions
export default cartSlice.reducer
