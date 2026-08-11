export function ProductCardMobile({
  product,
  activeImage,
  productMarca,
  formatCurrency,
  handleAddToCart,
  isHighlighted,
}) {
  const marca =
    productMarca ||
    (typeof product?.marca === "string"
      ? product.marca
      : product?.marca?.nombre) ||
    "Sin marca";

  return (
    <div
      className={`w-full rounded-xl border bg-white overflow-hidden shadow-sm transition flex flex-col min-h-[300px]
      ${isHighlighted ? "ring-2 ring-red-500" : ""}`}
    >
      {/* Imagen */}
      <div className="relative bg-gray-100 flex-none">
        {activeImage ? (
          <img
            src={activeImage}
            alt={product.descripcion}
            className="w-full h-24 object-contain p-2"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-24 items-center justify-center text-xs text-gray-400">
            Sin imagen
          </div>
        )}

        {isHighlighted && (
          <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full">
            Destacado
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 flex flex-col flex-1">

        <span className="inline-block w-fit rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-[9px] font-semibold uppercase">
          {marca}
        </span>

        <h3 className="mt-2 text-[11px] font-medium text-gray-800 leading-4 line-clamp-4">
          {product.descripcion}
        </h3>

        <div className="mt-auto">
          <p className="text-base font-bold text-red-700">
            {formatCurrency(product.precioConIva)}
          </p>

          <p className="text-[10px] text-gray-400">
            IVA incl.
          </p>

          <button
            onClick={() => handleAddToCart(product)}
            className="mt-2 w-full rounded-lg border border-green-200 bg-green-50 py-2 text-green-700 text-[12px] font-semibold hover:bg-green-100 transition"
          >
            Agregar
          </button>
        </div>

      </div>
    </div>
  );
}