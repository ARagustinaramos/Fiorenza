import prisma from "../../config/prisma.js";
import { validateProductInput } from "../../validators/product.validator.js";

const escapeLike = (value) => {
  if (!value) return "";
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
};

const normalizeSearch = (text = "") =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

export const createProduct = async (req, res) => {
  try {
    console.log("[createProduct DEBUG] Datos recibidos:", req.body);

    const errors = validateProductInput(req.body);

    if (errors.length) {
      console.log("[createProduct DEBUG] Errores de validación:", errors);
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        details: errors,
      });
    }

    // Verificar si ya existe 
    const existingProduct = await prisma.product.findUnique({
      where: { codigoInterno: req.body.codigoInterno },
    });

    if (existingProduct) {
      if (existingProduct.activo) {
        return res.status(400).json({
          error: "PRODUCT_EXISTS",
          message: "Ya existe un producto activo con este Código Interno",
        });
      }

      const product = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          ...req.body,
          precioConIva: Number(req.body.precioConIva),
          precioMayoristaSinIva: req.body.precioMayoristaSinIva
            ? Number(req.body.precioMayoristaSinIva)
            : null,
          stock: Number(req.body.stock) || 0,
          activo: true,
        },
      });

      return res.status(200).json(product);
    }

    const product = await prisma.product.create({
      data: {
        ...req.body,
        precioConIva: Number(req.body.precioConIva),
        precioMayoristaSinIva: req.body.precioMayoristaSinIva
          ? Number(req.body.precioMayoristaSinIva)
          : null,
        stock: Number(req.body.stock) || 0,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ERROR_CREATING_PRODUCT" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      q = "",
      marca,
      familia,
      rubro,
      oferta,
      novedad,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const filters = [`p.activo = true`];

    const safeMarca = escapeLike(marca);
    const safeFamilia = escapeLike(familia);
    const safeRubro = escapeLike(rubro);


    if (marca) {
      filters.push(`
        immutable_unaccent(UPPER(m.nombre))
        ILIKE '%' || immutable_unaccent(UPPER('${safeMarca}')) || '%'
      `);
    }

    if (familia) {
      const familias = familia
        .split(",")
        .map((f) => escapeLike(f.trim()))
        .filter(Boolean);

      if (familias.length === 1) {
        filters.push(`
      immutable_unaccent(UPPER(f.nombre))
      ILIKE '%' || immutable_unaccent(UPPER('${familias[0]}')) || '%'
    `);
      } else {
        const condiciones = familias
          .map(
            (f) => `
        immutable_unaccent(UPPER(f.nombre))
        ILIKE '%' || immutable_unaccent(UPPER('${f}')) || '%'
      `
          )
          .join(" OR ");

        filters.push(`(${condiciones})`);
      }
    }

    if (rubro) {
      filters.push(`
        immutable_unaccent(UPPER(p.rubro))
        ILIKE '%' || immutable_unaccent(UPPER('${safeRubro}')) || '%'
      `);
    }

    if (oferta === "true") {
      filters.push(`p."esOferta" = true`);
    }

    if (novedad === "true") {
      filters.push(`p."esNovedad" = true`);
    }
    const words = q
      .split(" ")
      .map(w => w.trim())
      .filter(Boolean);

    if (q && words.length) {
      const conditions = words.map(word => {
        const safeWord = escapeLike(word);
        const normalizedWord = normalizeSearch(word);

        return `
      (
        immutable_unaccent(LOWER(p.descripcion)) ILIKE '%' || LOWER('${safeWord}') || '%'
        OR immutable_unaccent(LOWER(p."descripcionAdicional")) ILIKE '%' || LOWER('${safeWord}') || '%'
        OR LOWER(p."codigoInterno") ILIKE '%' || LOWER('${safeWord}') || '%'
        OR CAST(p."codigoOriginal" AS TEXT) ILIKE '%' || '${safeWord}' || '%'
        OR regexp_replace(
            immutable_unaccent(LOWER(p.descripcion)),
            '[^a-z0-9]',
            '',
            'g'
          ) ILIKE '%' || '${normalizedWord}' || '%'
      )
    `;
      });

      filters.push(conditions.join(" AND "));
    }

    const whereSQL = `WHERE ${filters.join(" AND ")}`;

    const products = await prisma.$queryRawUnsafe(`
  SELECT
    p.*,
    m.nombre AS marca,
    f.nombre AS familia,
    json_agg(
      json_build_object(
        'id', pi.id,
        'url', pi.url,
        'publicId', pi."publicId"
      )
    ) FILTER (WHERE pi.id IS NOT NULL) AS images
  FROM "Product" p
  JOIN "Brand" m ON m.id = p."marcaId"
  JOIN "Family" f ON f.id = p."familiaId"
  LEFT JOIN "ProductImage" pi 
    ON pi."codigoInterno" = p."codigoInterno"
  ${whereSQL}
  GROUP BY p.id, m.id, f.id
  ORDER BY p.descripcion
  LIMIT ${Number(limit)}
  OFFSET ${offset}
`);


    const total = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT p.id)::int AS count
      FROM "Product" p
      JOIN "Brand" m ON m.id = p."marcaId"
      JOIN "Family" f ON f.id = p."familiaId"
      ${whereSQL}
    `);

    const rol = req.user?.rol;

    const sanitizedProducts = products.map((p) => {
      if (rol !== "MAYORISTA") {
        delete p.stock;
        delete p.precioMayoristaSinIva;
      }
      return p;
    });

    res.json({
      data: sanitizedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / Number(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};


export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });

    if (!product || !product.activo) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (req.user.rol === "MINORISTA") {
      delete product.stock;
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const errors = validateProductInput(req.body, true);

    if (errors.length) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        details: errors,
      });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        precioConIva: req.body.precioConIva
          ? Number(req.body.precioConIva)
          : undefined,
        precioMayoristaSinIva: req.body.precioMayoristaSinIva
          ? Number(req.body.precioMayoristaSinIva)
          : undefined,
        stock:
          req.body.stock !== undefined
            ? Number(req.body.stock)
            : undefined,
      },
    });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ERROR_UPDATING_PRODUCT" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { activo: false },
    });

    res.json({ message: "Producto desactivado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getOfferProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const products = await prisma.$queryRawUnsafe(`
      SELECT
        p.*,
        m.nombre AS marca,
        f.nombre AS familia
      FROM "Product" p
      JOIN "Brand" m ON m.id = p."marcaId"
      JOIN "Family" f ON f.id = p."familiaId"
      WHERE p."esOferta" = true
        AND p.activo = true
      ORDER BY p."updatedAt" DESC
      LIMIT ${Number(limit)}
      OFFSET ${offset}
    `);

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener ofertas" });
  }
};

export const getNewProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const products = await prisma.$queryRawUnsafe(`
      SELECT
        p.*,
        m.nombre AS marca,
        f.nombre AS familia
      FROM "Product" p
      JOIN "Brand" m ON m.id = p."marcaId"
      JOIN "Family" f ON f.id = p."familiaId"
      WHERE p."esNovedad" = true
        AND p.activo = true
      ORDER BY p."createdAt" DESC
      LIMIT ${Number(limit)}
      OFFSET ${offset}
    `);

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener novedades" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await prisma.$queryRawUnsafe(`
      SELECT
        p.*,
        m.nombre AS marca,
        f.nombre AS familia
      FROM "Product" p
      JOIN "Brand" m ON m.id = p."marcaId"
      JOIN "Family" f ON f.id = p."familiaId"
      WHERE p.activo = true
        AND (p."esOferta" = true OR p."esNovedad" = true)
      ORDER BY p."updatedAt" DESC
      LIMIT 20
    `);

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener destacados" });
  }
};

export const updateProductFlags = async (req, res) => {
  try {
    const { id } = req.params;
    const { esOferta, esNovedad } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        esOferta,
        esNovedad,
      },
    });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar flags" });
  }
};

export const getMarcasFiltro = async (req, res) => {
  try {
    const marcas = await prisma.$queryRaw`
      SELECT DISTINCT UPPER(m.nombre) AS nombre
      FROM "Brand" m
      JOIN "Product" p ON p."marcaId" = m.id
      WHERE p.activo = true
      ORDER BY nombre
    `;

    res.json(marcas.map(m => m.nombre));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener marcas" });
  }
};

export const getRubrosFiltro = async (req, res) => {
  try {
    const rubros = await prisma.$queryRaw`
      SELECT DISTINCT UPPER(p.rubro) AS rubro
      FROM "Product" p
      WHERE p.activo = true
        AND p.rubro IS NOT NULL
      ORDER BY rubro
    `;

    res.json(rubros.map(r => r.rubro));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener rubros" });
  }
};
