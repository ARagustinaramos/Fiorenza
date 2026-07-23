export function CartMobile({
  cartItems,
  handleUpdateQuantity,
  handleRemoveItem,
  formatPrice,
}) {
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
        Tu carrito está vacío
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cartItems.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg border p-3 flex flex-col sm:flex-row gap-3"
        >
          {/* Imagen (placeholder si no tenés) */}
          <div className="w-full sm:w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
            <span className="text-xs text-gray-400">Img</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <p className="text-xs text-gray-500">{item.codigo}</p>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                {item.nombre}
              </p>
            </div>

            <p className="text-base font-bold text-green-700">
              {formatPrice(item.precioUnitario)}
            </p>

            {/* Controles */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.id, item.cantidad - 1)
                  }
                  className="px-2 py-1 border rounded"
                >
                  -
                </button>

                <span className="text-sm">{item.cantidad}</span>

                <button
                  onClick={() =>
                    handleUpdateQuantity(item.id, item.cantidad + 1)
                  }
                  className="px-2 py-1 border rounded"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-red-500 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}