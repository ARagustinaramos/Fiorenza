import { Trash2 } from "lucide-react";

const getProductBrand = (product) => {
  if (!product) return null;
  if (typeof product.marca === "string") return product.marca;
  return product.marca?.nombre || product.marca?.label || null;
};

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
      {cartItems.map((item) => {
  const imageUrl = item.producto?.images?.[0]?.url || null;
  const brand = item.marca || getProductBrand(item.producto) || "Sin marca";

  return (
    <div
      key={item.id}
      className="bg-white rounded-lg border p-3 flex flex-col sm:flex-row gap-3"
    >
      <div className="w-full sm:w-20 h-20 rounded-md overflow-hidden border bg-white flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.nombre}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs text-gray-400">Sin imagen</span>
        )}
      </div>


          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-gray-500">{item.codigo}</p>
              <p className="text-[11px] text-gray-500 font-medium">{brand}</p>
              <p className="mt-1 text-sm text-gray-900 leading-5 line-clamp-2">{item.nombre}</p>
            </div>

            <p className="text-xs text-gray-500">
              Cantidad: {item.cantidad}
            </p>

            <p className="font-semibold text-gray-900">
              Subtotal: {formatPrice(item.precioUnitario * item.cantidad)}
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

                <span className="w-8 text-center font-medium">
                  {item.cantidad}
                </span>

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
                className="flex items-center gap-1 rounded-md px-2 py-1 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      );
      })}
    </div>  
  );
}