"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { SearchableSelect } from "../ui/SearchableSelect";
import { addToCart } from "../../../store/slices/cartSlice";
import { Heart, Camera, Search, X } from "lucide-react";

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

export function ProductTableNew() {
  const router = useRouter();
  const dispatch = useDispatch();
  const abortControllerRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [favoritesIds, setFavoritesIds] = useState(new Set());
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [isHoveringPanel, setIsHoveringPanel] = useState(false);
  const hoverCloseTimeoutRef = useRef(null);
  const [cartToast, setCartToast] = useState(null);
  const cartToastTimeoutRef = useRef(null);
  const [isPanelPinned, setIsPanelPinned] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [coeficienteVenta, setCoeficienteVenta] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedMarcas, setSelectedMarcas] = useState(new Set());
  const [selectedMarcaFiltro, setSelectedMarcaFiltro] = useState("");
  const [selectedRubro, setSelectedRubro] = useState("");
  const [showOfertas, setShowOfertas] = useState(false);
  const [showNovedades, setShowNovedades] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [marcas, setMarcas] = useState([]);
  const [rubros, setRubros] = useState([]);
  const skeletonRows = Array.from({ length: 8 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadFavorites();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const profile = await res.json();
        setCoeficienteVenta(profile?.coeficiente || profile?.perfil?.coeficienteVenta || 0);
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  };

  const loadFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiUrl}/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const favoriteProducts = await res.json();
        const ids = new Set(favoriteProducts.map((p) => p.id));
        setFavoritesIds(ids);
        setFavorites(favoriteProducts);
      }
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    }
  };

  const toggleFavorite = async (productId, e) => {
    e?.stopPropagation();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiUrl}/favorites/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const { isFavorite } = await res.json();

        // Actualizar estado local
        setFavoritesIds((prev) => {
          const newSet = new Set(prev);
          if (isFavorite) {
            newSet.add(productId);
          } else {
            newSet.delete(productId);
          }
          return newSet;
        });

        await loadFavorites();
      } else {
        const error = await res.json();
        console.error("Error al cambiar favorito:", error);
        alert("No se pudo actualizar el favorito");
      }
    } catch (error) {
      console.error("Error al cambiar favorito:", error);
      alert("No se pudo actualizar el favorito");
    }
  };

  //  FETCH PRODUCTs
  const fetchProducts = useCallback(async () => {
    // Cancelar petición anterior si existe para evitar condiciones de carrera
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (showFavorites && !token) {
        setProducts([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (debouncedSearchTerm) params.append("q", debouncedSearchTerm);
      if (selectedMarcas.size > 0) {
        params.append("familia", Array.from(selectedMarcas).join(","));
      }
      if (selectedMarcaFiltro) params.append("marca", selectedMarcaFiltro);
      if (selectedRubro) params.append("rubro", selectedRubro);
      if (showOfertas) params.append("oferta", "true");
      if (showNovedades) params.append("novedad", "true");
      if (showFavorites) params.append("favorites", "true");

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

      const res = await fetch(`${apiUrl}/products?${params.toString()}`, {
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error del servidor (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      setProducts(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error cargando productos:", error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [
    page,
    debouncedSearchTerm,
    selectedMarcas,
    selectedMarcaFiltro,
    selectedRubro,
    showOfertas,
    showNovedades,
    showFavorites,
    favorites,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedMarcas(new Set());
    setSelectedMarcaFiltro("");
    setSelectedRubro("");
    setShowOfertas(false);
    setShowNovedades(false);
    setShowFavorites(false);
    setPage(1);
  }

  useEffect(() => {
    const fetchFiltros = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

        const [marcasRes, rubrosRes] = await Promise.all([
          fetch(`${apiUrl}/products/filters/marcas`),
          fetch(`${apiUrl}/products/filters/rubros`),
        ]);

        if (marcasRes.ok) setMarcas(await marcasRes.json());
        if (rubrosRes.ok) setRubros(await rubrosRes.json());
      } catch (error) {
        console.error("Error cargando filtros:", error);
      }
    };

    fetchFiltros();
  }, []);

  return (
    <div className="relative">
      {hoveredProduct && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => {
                setHoveredProduct(null);
                setIsPanelPinned(false);
              }}
            />
          )}
          <div
            onMouseEnter={() => {
              setIsHoveringPanel(true);
              if (hoverCloseTimeoutRef.current) {
                clearTimeout(hoverCloseTimeoutRef.current);
                hoverCloseTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              setIsHoveringPanel(false);
              if (!isPanelPinned) {
                setHoveredProduct(null);
              }
            }}
            className={`
            bg-white border shadow-lg z-50 flex flex-col
            ${isMobile
                ? "fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] overflow-hidden"
                : "fixed right-6 top-1/2 -translate-y-1/2 w-[320px] md:w-[360px] xl:w-[420px] rounded-lg"
              }
          `}
          >
            {(isMobile || isPanelPinned) && (
              <div className="flex items-center justify-between px-4 pt-4">
                {isMobile && (
                  <div className="h-1 w-12 bg-gray-300 rounded-full mx-auto" />
                )}
                <button
                  onClick={() => {
                    setHoveredProduct(null);
                    setIsPanelPinned(false);
                  }}
                  className="absolute top-3 right-3 text-gray-400 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-4 space-y-2 overflow-y-auto">
              <h3 className="font-semibold mb-2">{hoveredProduct.descripcion}</h3>

            {hoveredProduct.images && hoveredProduct.images.length > 0 && (
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 h-52 flex items-center justify-center bg-gray-50">
                <img
                  src={hoveredProduct.images[0].url || hoveredProduct.images[0]}
                  alt={hoveredProduct.descripcion}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

            )}

            <p className="text-sm">
              <strong>Código:</strong> {hoveredProduct.codigoInterno}
            </p>
            <p className="text-sm">
              <strong>Original:</strong> {hoveredProduct.codigoOriginal}
            </p>
            <p className="text-sm">
              <strong>Descripción adicional:</strong> {hoveredProduct.descripcionAdicional}
            </p>
            <p className="text-sm">
              <strong>Familia:</strong> {hoveredProduct.familia}
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Precio mayorista (sin IVA):</strong>{" "}
                <span className="text-gray-800">
                  ${Number(hoveredProduct.precioMayoristaSinIva ?? hoveredProduct.precioConIva ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
              {coeficienteVenta > 0 && (
                <>
                  <p className="text-sm text-gray-600">
                    <strong>Coeficiente de venta:</strong>{" "}
                    <span className="text-gray-800">{coeficienteVenta}%</span>
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    <strong>Precio con coeficiente:</strong>{" "}
                    ${(
                      Number(hoveredProduct.precioMayoristaSinIva ?? hoveredProduct.precioConIva ?? 0) *
                      (1 + coeficienteVenta / 100)
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </>
              )}
              {coeficienteVenta === 0 && (
                <p className="text-lg font-bold text-green-700">
                  ${Number(hoveredProduct.precioMayoristaSinIva ?? hoveredProduct.precioConIva ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
          </div>

            <div className="border-t p-4 bg-gray-50">
              <button
                onClick={() => {
                  dispatch(addToCart(hoveredProduct));
                  setCartToast("Producto agregado al carrito");
                  if (cartToastTimeoutRef.current) {
                    clearTimeout(cartToastTimeoutRef.current);
                  }
                  cartToastTimeoutRef.current = setTimeout(() => {
                    setCartToast(null);
                  }, 2000);
                }}
                className="w-full rounded-md bg-green-600 text-white py-2 text-sm hover:bg-green-700 transition-colors"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </>
      )}

      {cartToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/90 text-white text-sm px-5 py-3 rounded-lg shadow-xl border border-white/10">
            {cartToast}
          </div>
        </div>
      )}

     <div className="w-full px-4 md:px-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center items-stretch">
              <div className="relative w-full flex-1 max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por código, descripción, marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-300 transition-all text-gray-700 placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {(selectedMarcas.size > 0 ||
                selectedMarcaFiltro ||
                selectedRubro ||
                showOfertas ||
                showNovedades ||
                showFavorites ||
                searchTerm) && (
                  <button
                    onClick={clearFilters}
                    className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
            </div>

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
              {/* FILTROS MARCA Y RUBRO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
                {/* MARCA */}
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
                {/* RUBRO */}
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


              </div>

              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ofertas"
                    checked={showOfertas}
                    onChange={(e) => {
                      setShowOfertas(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-400 cursor-pointer"
                  />
                  <label
                    htmlFor="ofertas"
                    className="text-xs font-medium text-gray-700 cursor-pointer"
                  >
                    Solo ofertas
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="novedades"
                    checked={showNovedades}
                    onChange={(e) => {
                      setShowNovedades(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-400 cursor-pointer"
                  />
                  <label
                    htmlFor="novedades"
                    className="text-xs font-medium text-gray-700 cursor-pointer"
                  >
                    Solo novedades
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="favoritos"
                    checked={showFavorites}
                    onChange={(e) => {
                      setShowFavorites(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-400 cursor-pointer"
                  />
                  <label
                    htmlFor="favoritos"
                    className="text-xs font-medium text-gray-700 cursor-pointer"
                  >
                    Solo favoritos
                  </label>
                </div>
              </div>
            </div>
          </div>
          {loading && (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {skeletonRows.map((_, idx) => (
                    <div
                      key={`skeleton-card-${idx}`}
                      className="bg-white rounded-lg border p-4 shadow-sm space-y-3"
                    >
                      <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
                      <div className="h-3 w-1/3 bg-gray-200 animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
                      <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div
                      className="
                      bg-red-700 text-white
                      grid
                      grid-cols-[40px_1fr_1fr_1fr_1fr_3fr_1fr]
                      px-4 sm:px-6 py-3 sm:py-4
                      font-semibold text-xs sm:text-sm
                    "
                    >
                      <div></div>
                      <div>Cód.</div>
                      <div>Original</div>
                      <div>Rubro</div>
                      <div>Marca</div>
                      <div>Descripción</div>
                      <div className="text-right">Precio mayorista</div>
                    </div>
                    <div className="divide-y">
                      {skeletonRows.map((_, idx) => (
                        <div
                          key={`skeleton-${idx}`}
                          className="grid grid-cols-[40px_90px_120px_120px_120px_1fr_160px] px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm"
                        >
                          <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
                          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                          <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded justify-self-end" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && products.length === 0 && (
            <div className="bg-white rounded-lg border p-8 text-center">
              <p className="text-lg font-semibold text-gray-800">
                No encontramos productos con esos filtros
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Probá limpiar los filtros o cambiar el término de búsqueda.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setHoveredProduct(product);
                        setIsPanelPinned(true);
                      }}
                      className="bg-white rounded-lg border p-4 shadow-sm hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {product.images && product.images.length > 0 ? (
                              <Camera className="w-4 h-4 text-red-500 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 flex-shrink-0" />
                            )}
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {product.descripcion}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Cód: {product.codigoInterno || "-"} • Orig: {product.codigoOriginal || "-"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {product.marca || "-"} • {product.rubro || "-"}
                          </p>
                        </div>

                        <button
                          onClick={(e) => toggleFavorite(product.id, e)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <Heart
                            className={`w-5 h-5 ${favoritesIds.has(product.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                              }`}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Precio mayorista</span>
                        <span className="text-base font-semibold text-gray-900">
                          ${Number(product.precioMayoristaSinIva ?? product.precioConIva ?? 0).toLocaleString("es-AR")}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(addToCart(product));
                          setCartToast("Producto agregado al carrito");
                          if (cartToastTimeoutRef.current) {
                            clearTimeout(cartToastTimeoutRef.current);
                          }
                          cartToastTimeoutRef.current = setTimeout(() => {
                            setCartToast(null);
                          }, 2000);
                        }}
                        className="mt-3 w-full rounded-md bg-green-600 text-white py-2 text-sm hover:bg-green-700 transition-colors"
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border overflow-x-auto shadow-sm">
                  <div className="min-w-[900px]">
                    <div
                      className="
          bg-red-700 text-white
          grid
          grid-cols-[40px_1fr_1fr_1fr_1fr_3fr_1fr]
          px-4 sm:px-6 py-3 sm:py-4
          font-semibold text-xs sm:text-sm
        "
                    >
                      <div></div>
                      <div>Cód.</div>
                      <div>Original</div>
                      <div>Rubro</div>
                      <div>Marca</div>
                      <div>Descripción</div>
                      <div className="text-right">Precio mayorista</div>
                    </div>

                    <div className="divide-y">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            setHoveredProduct(product);
                            setIsPanelPinned(true);
                          }}
                          className="grid grid-cols-[40px_90px_120px_120px_120px_1fr_160px] px-4 sm:px-6 py-4 sm:py-5 hover:bg-gray-100 transition cursor-pointer text-xs sm:text-sm"
                        >
                          <button
                            onClick={(e) => toggleFavorite(product.id, e)}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Heart
                              className={`w-5 h-5 ${favoritesIds.has(product.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400"
                                }`}
                            />
                          </button>

                          <div className="truncate">{product.codigoInterno || "-"}</div>
                          <div className="truncate">{product.codigoOriginal || "-"}</div>
                          <div className="truncate">{product.rubro || "-"}</div>
                          <div className="truncate">{product.marca || "-"}</div>

                          <div className="flex items-center gap-2 truncate">
                            {product.images && product.images.length > 0 ? (
                              <Camera className="w-5 h-5 text-red-500 flex-shrink-0" />
                            ) : (
                              <div className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className="truncate">{product.descripcion}</span>
                          </div>

                          <div className="font-semibold text-right text-gray-900">
                            ${Number(product.precioMayoristaSinIva ?? product.precioConIva ?? 0).toLocaleString("es-AR")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* PAGINACIÓN */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Anterior
            </button>

            <span className="px-2 py-2 text-sm">
              Página {page} de {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
