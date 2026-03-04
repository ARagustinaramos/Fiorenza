-- Speeds up default listing and post-search sorting used by getProducts
-- ORDER BY (p.descripcion IS NULL OR p.descripcion = '') ASC, p.descripcion ASC
CREATE INDEX IF NOT EXISTS product_active_desc_sort_idx
ON "Product" (
  "activo",
  (("descripcion" IS NULL OR "descripcion" = '')),
  "descripcion"
);

