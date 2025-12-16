'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUsers } from '../store/slices/usersSlice'
import { fetchProducts } from '../store/slices/productsSlice'

export default function Home() {
  const dispatch = useDispatch()
  const { users, loading: usersLoading } = useSelector((state) => state.users)
  const { products, loading: productsLoading } = useSelector((state) => state.products)

  useEffect(() => {
    dispatch(fetchUsers())
    dispatch(fetchProducts())
  }, [dispatch])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Bienvenido a Fiorenza App
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sección de Usuarios */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Usuarios</h2>
            {usersLoading ? (
              <p className="text-gray-500">Cargando usuarios...</p>
            ) : (
              <ul className="space-y-2">
                {users.map((user) => (
                  <li key={user.id} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sección de Productos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Productos</h2>
            {productsLoading ? (
              <p className="text-gray-500">Cargando productos...</p>
            ) : (
              <ul className="space-y-2">
                {products.map((product) => (
                  <li key={product.id} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">${product.price}</p>
                    <p className="text-xs text-gray-500">{product.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Estado de conexión */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Estado: {usersLoading || productsLoading ? 'Cargando...' : 'Conectado'}
          </p>
        </div>
      </div>
    </main>
  )
}

