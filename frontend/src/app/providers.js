'use client'

import { Provider } from 'react-redux'
import { store } from '../../store/store'
import { AuthProvider } from '../context/AuthContext'
import { CartSync } from '../components/CartSync'

export function Providers({ children }) {
  return (
    <AuthProvider>
      <Provider store={store}>
        <CartSync />
        {children}
      </Provider>
    </AuthProvider>
  )
}






