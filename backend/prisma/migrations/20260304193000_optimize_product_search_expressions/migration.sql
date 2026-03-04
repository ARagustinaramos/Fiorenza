-- Ensure required extensions/functions exist for expression indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.unaccent($1);
$$;

-- Product search expressions used in getProducts
CREATE INDEX IF NOT EXISTS product_desc_unaccent_lower_trgm
ON "Product"
USING gin (public.immutable_unaccent(LOWER("descripcion")) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS product_desc_add_unaccent_lower_trgm
ON "Product"
USING gin (public.immutable_unaccent(LOWER("descripcionAdicional")) gin_trgm_ops)
WHERE "descripcionAdicional" IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_codigo_interno_lower_trgm
ON "Product"
USING gin (LOWER("codigoInterno") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS product_codigo_original_trgm
ON "Product"
USING gin ("codigoOriginal" gin_trgm_ops)
WHERE "codigoOriginal" IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_rubro_unaccent_lower_trgm
ON "Product"
USING gin (public.immutable_unaccent(LOWER("rubro")) gin_trgm_ops)
WHERE "rubro" IS NOT NULL;

-- Related table expressions used by marca/familia filters
CREATE INDEX IF NOT EXISTS brand_nombre_unaccent_upper_trgm
ON "Brand"
USING gin (public.immutable_unaccent(UPPER("nombre")) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS family_nombre_unaccent_upper_trgm
ON "Family"
USING gin (public.immutable_unaccent(UPPER("nombre")) gin_trgm_ops);

