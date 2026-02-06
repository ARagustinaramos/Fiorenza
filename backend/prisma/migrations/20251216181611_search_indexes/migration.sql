-- Extensiones
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- Función IMMUTABLE wrapper
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.unaccent($1);
$$;

-- Índice fuzzy descripción principal
CREATE INDEX product_desc_trgm
ON "Product"
USING gin (public.immutable_unaccent("descripcion") gin_trgm_ops);

-- Índice fuzzy descripción adicional (solo NO NULL)
CREATE INDEX product_desc_add_trgm
ON "Product"
USING gin (public.immutable_unaccent("descripcionAdicional") gin_trgm_ops)
WHERE "descripcionAdicional" IS NOT NULL;

-- Índices filtros
CREATE INDEX product_marca_idx ON "Product"("marcaId");
CREATE INDEX product_familia_idx ON "Product"("familiaId");
