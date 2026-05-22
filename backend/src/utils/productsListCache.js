const PRODUCTS_LIST_CACHE_TTL_MS = 15_000;
const PRODUCTS_LIST_CACHE_MAX_ITEMS = 20;
const productsListCache = new Map();

export const getProductsListCache = (key) => {
  const entry = productsListCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    productsListCache.delete(key);
    return null;
  }
  return entry.value;
};

export const setProductsListCache = (key, value) => {
  if (productsListCache.size >= PRODUCTS_LIST_CACHE_MAX_ITEMS) {
    const firstKey = productsListCache.keys().next().value;
    if (firstKey) productsListCache.delete(firstKey);
  }

  productsListCache.set(key, {
    value,
    expiresAt: Date.now() + PRODUCTS_LIST_CACHE_TTL_MS,
  });
};

export const clearProductsListCache = () => {
  productsListCache.clear();
};
