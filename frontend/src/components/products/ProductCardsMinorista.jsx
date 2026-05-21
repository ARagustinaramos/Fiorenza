"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Search, X } from "lucide-react";
import { SearchableSelect } from "../ui/SearchableSelect";
import { addToCart } from "../../../store/slices/cartSlice";

const PAGE_SIZE = 20;
const BRANDS = [
  { key: "chevrolet", label: "Chevrolet", searchName: "Chevrolet", logo: "/brands/chevrolet.png" },
  { key: "fiat", label: "Fiat", searchName: "Fiat", logo: "/brands/fiat.png" },
  { key: "citroen", label: "Citroën", searchName: "Citroën", logo: "/brands/citroen.png" },
  { key: "peugeot", label: "Peugeot", searchName: "Peugeot", logo: "/brands/peugeot.png" },
  { key: "renault", label: "Renault", searchName: "Renault", logo: "/brands/renault.png" },
  { key: "wv", label: "Volkswagen", searchName: "VW", logo: "/brands/wv.png" },
  { key: "ford", label: "Ford", searchName: "Ford", logo: "/brands/ford.png" },
  { key: "universal", label: "Universal", searchName: "Universal", logo: "/brands/universal.png" },
];

export function ProductCardsMinorista({ onSidebarContent }) {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedMarcas, setSelectedMarcas] = useState(new Set());
  const [selectedMarcaFiltro, setSelectedMarcaFiltro] = useState("");
  const [selectedRubro, setSelectedRubro] = useState("");
  const [showOfertas, setShowOfertas] = useState(false);
  const [showNovedades, setShowNovedades] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flippedId, setFlippedId] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState({});
  const [cartToast, setCartToast] = useState(null);
  const cartToastTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No hay token de autenticación");
          return;
        }

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          web: "true",
        });
        if (debouncedSearchTerm) params.append("q", debouncedSearchTerm);
        if (selectedMarcas.size > 0) {
          params.append("familia", Array.from(selectedMarcas).join(","));
        }
        if (selectedMarcaFiltro) params.append("marca", selectedMarcaFiltro);
        if (selectedRubro) params.append("rubro", selectedRubro);
        if (showOfertas) params.append("oferta", "true");
        if (showNovedades) params.append("novedad", "true");

        const res = await fetch(`${apiUrl}/products?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("No se pudieron cargar los productos");
        }

        const data = await res.json();
        setProducts(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } catch (err) {
        console.error("Error cargando productos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    page,
    debouncedSearchTerm,
    selectedMarcas,
    selectedMarcaFiltro,
    selectedRubro,
    showOfertas,
    showNovedades,
  ]);

  useEffect(() => {
    const fetchFiltros = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const [marcasRes, rubrosRes] = await Promise.all([
          fetch(`${apiUrl}/products/filters/marcas?web=true`),
          fetch(`${apiUrl}/products/filters/rubros?web=true`),
        ]);

        if (marcasRes.ok) setMarcas(await marcasRes.json());
        if (rubrosRes.ok) setRubros(await rubrosRes.json());
      } catch (error) {
        console.error("Error cargando filtros:", error);
      }
    };

    fetchFiltros();
  }, []);

  useEffect(() => {
    return () => {
      if (cartToastTimeoutRef.current) {
        clearTimeout(cartToastTimeoutRef.current);
      }
    };
  }, []);

  const formatCurrency = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  const applySearch = () => {
    setPage(1);
    setDebouncedSearchTerm(searchTerm.trim());
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedMarcas(new Set());
    setSelectedMarcaFiltro("");
    setSelectedRubro("");
    setShowOfertas(false);
    setShowNovedades(false);
    setPage(1);
  };

  const handleSearch = () => {
    setIsRefreshing(true);
    applySearch();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    setCartToast("Producto agregado al carrito");
    if (cartToastTimeoutRef.current) {
      clearTimeout(cartToastTimeoutRef.current);
    }
    cartToastTimeoutRef.current = setTimeout(() => {
      setCartToast(null);
    }, 2000);
  };

  const handleFlip = (productId) => {
    setFlippedId((prev) => (prev === productId ? null : productId));
  };

  const getActiveIndex = (productId) => activeImageIndex[productId] || 0;

  useEffect(() => {
    if (!products.length) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => {
        const nextState = { ...prev };
        products.forEach((product) => {
          const images = Array.isArray(product.images) ? product.images : [];
          if (images.length > 1) {
            const current = prev[product.id] || 0;
            nextState[product.id] = (current + 1) % images.length;
          }
        });
        return nextState;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [products]);

  const filtersBlock = useMemo(() => (
    <div className="relative z-20 bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-md space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Filtrar por familia
        </p>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map((brand) => {
            const active = selectedMarcas.has(brand.searchName);
            return (
              <button
                key={brand.key}
                onClick={() => {
                  setPage(1);
                  setSelectedMarcas((prev) => {
                    const newSet = new Set(prev);
                    if (newSet.has(brand.searchName)) {
                      newSet.delete(brand.searchName);
                    } else {
                      newSet.add(brand.searchName);
                    }
                    return newSet;
                  });
                }}
                title={brand.label}
                className={`flex items-center justify-center
                  w-14 h-14 rounded-2xl border-2 transition
                  ${active
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 bg-white hover:border-red-300 hover:bg-gray-50"
                  }
                `}
              >
                <img
                  src={brand.logo}
                  alt={brand.label}
                  className="max-h-8 max-w-10 object-contain"
                  onError={(e) => {
                    const parent = e.target.parentElement;
                    if (!parent.querySelector(".fallback-text")) {
                      e.target.style.display = "none";
                      const fallback = document.createElement("span");
                      fallback.className =
                        "fallback-text text-xs text-gray-600 font-medium";
                      fallback.textContent = brand.label
                        .substring(0, 3)
                        .toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {selectedMarcas.size > 0 && (
        <div className="text-xs text-gray-600 px-2">
          Familias seleccionadas:{" "}
          <span className="font-semibold text-gray-700">
            {Array.from(selectedMarcas)
              .map((marca) => BRANDS.find((b) => b.searchName === marca)?.label || marca)
              .join(", ")}
          </span>
        </div>
      )}
    </div>
  ), [selectedMarcas]);

  const sidebarFiltersBlock = useMemo(
    () => (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-md space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Filtros</h3>
          <p className="text-xs text-gray-500 mt-1">Marca, rubro y estado</p>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <p className="text-xs font-medium text-gray-700 mb-1">Marca</p>
            <SearchableSelect
              options={marcas}
              value={selectedMarcaFiltro}
              placeholder="Todas"
              onChange={(value) => {
                setSelectedMarcaFiltro(value);
                setPage(1);
              }}
            />
            {selectedMarcaFiltro && (
              <button
                onClick={() => {
                  setSelectedMarcaFiltro("");
                  setPage(1);
                }}
                className="absolute right-3 top-[60%] translate-y-[-40%] text-gray-400 hover:text-red-600 transition"
              >
                ✕
              </button>
            )}
          </div>
          <div className="relative">
            <p className="text-xs font-medium text-gray-700 mb-1">Rubro</p>
            <SearchableSelect
              options={rubros}
              value={selectedRubro}
              placeholder="Todos"
              onChange={(value) => {
                setSelectedRubro(value);
                setPage(1);
              }}
            />
            {selectedRubro && (
              <button
                onClick={() => {
                  setSelectedRubro("");
                  setPage(1);
                }}
                className="absolute right-3 top-[60%] translate-y-[-40%] text-gray-400 hover:text-red-600 transition"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={showOfertas}
                onChange={(e) => {
                  setShowOfertas(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-400 cursor-pointer"
              />
              Solo ofertas
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={showNovedades}
                onChange={(e) => {
                  setShowNovedades(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-400 cursor-pointer"
              />
              Solo novedades
            </label>
          </div>
        </div>
      </div>
    ),
    [
      marcas,
      rubros,
      selectedMarcaFiltro,
      selectedRubro,
      showOfertas,
      showNovedades,
    ]
  );

  useEffect(() => {
    if (!onSidebarContent) return;
    onSidebarContent(sidebarFiltersBlock);
    return () => onSidebarContent(null);
  }, [onSidebarContent, sidebarFiltersBlock]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center items-stretch">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por código, descripción, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-300 transition-all text-gray-700 placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
          >
            Buscar
          </button>
          {(selectedMarcas.size > 0 ||
            selectedMarcaFiltro ||
            selectedRubro ||
            searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Limpiar
            </button>
          )}
        </div>
        {isRefreshing && (
          <p className="text-xs text-gray-500">Actualizando resultados...</p>
        )}
      </div>
      {filtersBlock}

      {loading && (
        <div className="py-12 text-center text-gray-600">Cargando productos...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No hay productos para mostrar.
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const isFlipped = flippedId === product.id;
            const images = Array.isArray(product.images) ? product.images : [];
            const activeIndex = getActiveIndex(product.id);
            const activeImage =
              images[activeIndex]?.url || images[activeIndex] || null;

            return (
            <div key={product.id} className="group [perspective:1000px]">
              <div
                className="relative h-[30rem] w-full rounded-2xl shadow-md transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer"
                style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                onClick={() => handleFlip(product.id)}
              >
                <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-red-200 via-red-100 to-white shadow-[0_10px_30px_-18px_rgba(220,38,38,0.6)] group-hover:shadow-[0_16px_40px_-18px_rgba(220,38,38,0.75)] transition-shadow [backface-visibility:hidden]">
                  <div className="rounded-2xl border border-red-100 bg-white p-5 h-full">
                  <div className="h-full flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative h-48 w-full rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                        {activeImage ? (
                          <img
                            src={activeImage}
                            alt={product.descripcion || "Producto"}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">Sin imagen</span>
                        )}
                      </div>
                      {images.length > 1 && (
                        <div className="flex items-center justify-center gap-2">
                          {images.map((_, idx) => (
                            <span
                              key={idx}
                              className={`h-2 w-2 rounded-full transition ${
                                idx === activeIndex ? "bg-red-500" : "bg-gray-300"
                              }`}
                              aria-label={`Imagen ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      <h3 className="text-sm font-semibold leading-5 text-gray-900 line-clamp-3 min-h-[3.75rem]">
                        {product.descripcion || "Sin descripcion"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Marca:</span>{" "}
                        {product.marca?.nombre || "Sin marca"}
                      </p>
                    </div>
                    <div className="pt-3">
                      <p className="text-sm text-gray-500">Precio final</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(product.precioConIva)}
                      </p>
                      <p className="text-xs text-gray-400">IVA incluido</p>
                      <p className="text-xs text-gray-400 mt-2">Click para ver más</p>
                    </div>
                  </div>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-red-200 via-red-100 to-white shadow-[0_10px_30px_-18px_rgba(220,38,38,0.6)] group-hover:shadow-[0_16px_40px_-18px_rgba(220,38,38,0.75)] transition-shadow [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="rounded-2xl border border-red-100 bg-white p-5 h-full">
                  <div className="h-full flex flex-col justify-center">
                    <div className="space-y-3 text-sm text-gray-600 pr-1">
                      <p>
                        <span className="font-semibold text-gray-800">Interno:</span>{" "}
                        {product.codigoInterno || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-800">Original:</span>{" "}
                        {product.codigoOriginal || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-800">Descripcion adicional:</span>{" "}
                        {product.descripcionAdicional || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-800">Familia:</span>{" "}
                        {product.familia?.nombre || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-800">Rubro:</span>{" "}
                        {product.rubro || "-"}
                      </p>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="w-full rounded-md bg-green-600 text-white py-2 text-sm hover:bg-green-700 transition-colors"
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Siguiente
          </button>
        </div>
      )}

      {cartToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/90 text-white text-sm px-5 py-3 rounded-lg shadow-xl border border-white/10">
            {cartToast}
          </div>
        </div>
      )}
    </div>
  );
}


