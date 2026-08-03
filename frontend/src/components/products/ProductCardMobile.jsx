export function ProductCardMobile({
  product,
  activeImage,
  productMarca,
  formatCurrency,
  handleAddToCart,
  isHighlighted,
}) {
  return (
    <div
      className={`w-full rounded-xl border bg-white overflow-hidden shadow-sm transition
      ${isHighlighted ? "ring-2 ring-red-500" : ""}`}
    >
      {/* Imagen */}
      <div className="relative bg-gray-100">
        {activeImage ? (
          <img
            src={activeImage}
            alt={product.descripcion}
            className="w-full h-28 object-contain p-2"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-28 items-center justify-center text-xs text-gray-400">
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
      <div className="p-2 flex flex-col gap-1.5">

        <span className="text-[10px] text-gray-500 uppercase truncate">
          {productMarca}
        </span>

        <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 min-h-[34px]">
          {product.descripcion}
        </h3>

        <div>
          <p className="text-base font-bold text-green-700">
            {formatCurrency(product.precioConIva)}
          </p>

          <p className="text-[10px] text-gray-400">
            IVA incl.
          </p>
        </div>

        <button
          onClick={() => handleAddToCart(product)}
          className="mt-1 w-full rounded-md bg-green-600 py-1.5 text-white text-[12px] font-medium hover:bg-green-700 transition"
        >
          Agregar
        </button>

      </div>
    </div>
  );
}