'use client'

import { Provider } from 'react-redux'
import { store } from '../../store/store'
import { AuthProvider } from '../context/AuthContext'

export function Providers({ children }) {
  return (
    <AuthProvider>
      <Provider store={store}>
        {children}
      </Provider>
    </AuthProvider>
  )
}






