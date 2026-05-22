import prisma from "../../config/prisma.js";
import { Prisma } from "@prisma/client";
import { validateProductInput } from "../../validators/product.validator.js";
import {
  clearProductsListCache,
  getProductsListCache,
  setProductsListCache,
} from "../../utils/productsListCache.js";

const parseNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let text = value.toString().trim();
  if (!text) return null;

  // Remove currency symbols and spaces
  text = text.replace(/\s+/g, "");
  text = text.replace(/[^0-9,.-]/g, "");

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // 1.234,56 -> 1234.56
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,234.56 -> 1234.56
      text = text.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // 1234,56 -> 1234.56
    text = text.replace(",", ".");
  }

  const parsed = parseFloat(text);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const shouldFilterWebOnly = (req) => {
  if (req?.query?.web === "true") return true;
  return req?.user?.rol === "MINORISTA";
};

const shouldHideOutOfStock = (req) => req?.user?.rol === "MINORISTA";

const buildWebStockFilter = (req) =>
  shouldFilterWebOnly(req) && shouldHideOutOfStock(req)
    ? Prisma.sql`AND p.web = true AND p.stock > 0`
    : shouldFilterWebOnly(req)
      ? Prisma.sql`AND p.web = true`
      : shouldHideOutOfStock(req)
        ? Prisma.sql`AND p.stock > 0`
        : Prisma.sql``;

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
    const webValue =
      req.body.web === true ||
      req.body.web === "true" ||
      req.body.web === "1";

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
          web: webValue,
          precioConIva: parseNumber(req.body.precioConIva),
          precioMayoristaSinIva: req.body.precioMayoristaSinIva !== undefined && req.body.precioMayoristaSinIva !== ""
            ? parseNumber(req.body.precioMayoristaSinIva)
            : null,
          stock: parseNumber(req.body.stock) || 0,
          activo: true,
        },
      });

      clearProductsListCache();
      return res.status(200).json(product);
    }

    const product = await prisma.product.create({
      data: {
        ...req.body,
        web: webValue,
        precioConIva: parseNumber(req.body.precioConIva),
        precioMayoristaSinIva: req.body.precioMayoristaSinIva !== undefined && req.body.precioMayoristaSinIva !== ""
          ? parseNumber(req.body.precioMayoristaSinIva)
          : null,
        stock: parseNumber(req.body.stock) || 0,
      },
    });

    clearProductsListCache();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ERROR_CREATING_PRODUCT" });
  }
};

export const getProducts = async (req, res) => {
  const startedAt = Date.now();
  try {
  const {
    q = "",
    marca,
    familia,
    rubro,
    oferta,
    novedad,
    favorites,
      includeInactive,
      page = 1,
      limit = 20,
    } = req.query;

    const queryText = String(q || "").trim();
    const limitNum = Number(limit);
    const pageNum = Number(page);
    const offset = (pageNum - 1) * limitNum;
    const filters = [];
    const joins = [
      Prisma.sql`LEFT JOIN "Brand" m ON m.id = p."marcaId"`,
      Prisma.sql`LEFT JOIN "Family" f ON f.id = p."familiaId"`,
    ];

    const includeFavorites = favorites === "true";
    if (includeFavorites) {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "UNAUTHORIZED" });
      }
      const favoriteJoin = Prisma.sql`JOIN "Favorite" fav ON fav."productId" = p.id AND fav."userId" = ${userId}`;
      joins.push(favoriteJoin);
    }

    const joinWith = (items, operator) => {
      if (!items.length) return Prisma.sql``;
      return items.slice(1).reduce(
        (acc, item) => Prisma.sql`${acc} ${Prisma.raw(operator)} ${item}`,
        items[0]
      );
    };

    const safeMarca = escapeLike(marca);
    const safeFamilia = escapeLike(familia);
    const safeRubro = escapeLike(rubro);

    const isAdmin = req.user?.rol === "ADMIN";
    const allowInactive = includeInactive === "true" && isAdmin;
    if (!allowInactive) {
      filters.push(Prisma.sql`p.activo = true`);
    }

    const webOnly = shouldFilterWebOnly(req);
    if (webOnly) {
      filters.push(Prisma.sql`p.web = true`);
    }

    if (shouldHideOutOfStock(req)) {
      filters.push(Prisma.sql`p.stock > 0`);
    }


    if (marca) {
      filters.push(
        Prisma.sql`immutable_unaccent(UPPER(m.nombre)) ILIKE '%' || immutable_unaccent(UPPER(${safeMarca})) || '%'`
      );
    }

    if (familia) {
      const familias = familia
        .split(",")
        .map((f) => escapeLike(f.trim()))
        .filter(Boolean);

      if (familias.length === 1) {
        filters.push(
          Prisma.sql`immutable_unaccent(UPPER(f.nombre)) ILIKE '%' || immutable_unaccent(UPPER(${familias[0]})) || '%'`
        );
      } else if (familias.length > 1) {
        const condiciones = familias.map(
          (f) =>
            Prisma.sql`immutable_unaccent(UPPER(f.nombre)) ILIKE '%' || immutable_unaccent(UPPER(${f})) || '%'`
        );

        const orBlock = joinWith(condiciones, "OR");
        filters.push(Prisma.sql`(${orBlock})`);
      }
    }

    if (rubro) {
      filters.push(
        Prisma.sql`immutable_unaccent(UPPER(p.rubro)) ILIKE '%' || immutable_unaccent(UPPER(${safeRubro})) || '%'`
      );
    }

    if (oferta === "true" && novedad === "true") {
      filters.push(Prisma.sql`(p."esOferta" = true OR p."esNovedad" = true)`);
    } else if (oferta === "true") {
      filters.push(Prisma.sql`p."esOferta" = true`);
    } else if (novedad === "true") {
      filters.push(Prisma.sql`p."esNovedad" = true`);
    }
    const words = queryText
      .split(" ")
      .map(w => w.trim())
      .filter(Boolean);

    if (queryText && words.length) {
      const conditions = words.map((word) => {
        const safeWord = escapeLike(word);

        return Prisma.sql`(
          immutable_unaccent(LOWER(p.descripcion)) ILIKE '%' || LOWER(${safeWord}) || '%'
          OR immutable_unaccent(LOWER(p."descripcionAdicional")) ILIKE '%' || LOWER(${safeWord}) || '%'
          OR LOWER(p."codigoInterno") ILIKE '%' || LOWER(${safeWord}) || '%'
          OR CAST(p."codigoOriginal" AS TEXT) ILIKE '%' || ${safeWord} || '%'
          OR CAST(p."codigoProveedor" AS TEXT) ILIKE '%' || ${safeWord} || '%'
          OR immutable_unaccent(LOWER(p.proveedor)) ILIKE '%' || LOWER(${safeWord}) || '%'
        )`;
      });

      const andBlock = joinWith(conditions, "AND");
      filters.push(Prisma.sql`(${andBlock})`);
    }

    const canUseWarmCache =
      !queryText &&
      !marca &&
      !familia &&
      !rubro &&
      oferta !== "true" &&
      novedad !== "true" &&
      favorites !== "true" &&
      !allowInactive &&
      pageNum === 1;

    const roleKey = req.user?.rol || "ANON";
    const cacheKey = canUseWarmCache
      ? `${roleKey}|w:${webOnly ? "1" : "0"}|p:${pageNum}|l:${limitNum}`
      : null;
    if (cacheKey) {
      const cachedPayload = getProductsListCache(cacheKey);
      if (cachedPayload) {
        return res.json(cachedPayload);
      }
    }

    const whereSQL = Prisma.sql`WHERE ${joinWith(filters, "AND")}`;

    const products = await prisma.$queryRaw`
      SELECT
        p.*,
        m.nombre AS marca,
        f.nombre AS familia,
        COUNT(*) OVER()::int AS total_count
      FROM "Product" p
      ${joinWith(joins, " ")}
      ${whereSQL}
      ORDER BY
        (p.descripcion IS NULL OR p.descripcion = '') ASC,
        p.descripcion ASC
      LIMIT ${limitNum}
      OFFSET ${offset}
    `;

    // Obtenemos las imágenes solo para los productos de esta página (mucho más rápido que JOIN masivo)
    const codigosInternos = products.map((p) => p.codigoInterno).filter(Boolean);
    let imagesMap = {};

    if (codigosInternos.length > 0) {
      const images = await prisma.productImage.findMany({
        where: { codigoInterno: { in: codigosInternos } },
        select: { codigoInterno: true, id: true, url: true, publicId: true },
      });

      images.forEach((img) => {
        if (!imagesMap[img.codigoInterno]) imagesMap[img.codigoInterno] = [];
        imagesMap[img.codigoInterno].push(img);
      });
    }

    const rol = req.user?.rol;
    const total = products[0]?.total_count || 0;

    const sanitizedProducts = products.map((p) => {
      // Asignamos las imágenes en memoria
      p.images = imagesMap[p.codigoInterno] || [];
      delete p.total_count;

      if (rol !== "MAYORISTA") {
        delete p.stock;
        delete p.precioMayoristaSinIva;
      }
      return p;
    });

    const payload = {
      data: sanitizedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(total),
        pages: Math.ceil(Number(total) / limitNum),
      },
    };

    if (cacheKey) {
      setProductsListCache(cacheKey, payload);
    }

    res.json(payload);

    const durationMs = Date.now() - startedAt;
    if (durationMs > 2000) {
      console.warn("[getProducts] slow query", {
        durationMs,
        page: pageNum,
        limit: limitNum,
        hasQ: Boolean(queryText),
        words: words.length,
        marca: Boolean(marca),
        familia: Boolean(familia),
        rubro: Boolean(rubro),
        oferta: oferta === "true",
        novedad: novedad === "true",
        favorites: favorites === "true",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};


export const getProductById = async (req, res) => {
  try {
    const webOnly = shouldFilterWebOnly(req);

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });

    if (!product || !product.activo) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (webOnly && !product.web) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (shouldHideOutOfStock(req) && Number(product.stock || 0) <= 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (req.user?.rol === "MINORISTA") {
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

    const webValue =
      req.body.web === undefined
        ? undefined
        : req.body.web === true ||
          req.body.web === "true" ||
          req.body.web === "1";

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        ...(webValue !== undefined ? { web: webValue } : {}),
        precioConIva: req.body.precioConIva !== undefined
          ? parseNumber(req.body.precioConIva)
          : undefined,
        precioMayoristaSinIva: req.body.precioMayoristaSinIva !== undefined
          ? (req.body.precioMayoristaSinIva === "" ? null : parseNumber(req.body.precioMayoristaSinIva))
          : undefined,
        stock:
          req.body.stock !== undefined
            ? parseNumber(req.body.stock)
            : undefined,
      },
    });

    clearProductsListCache();
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

    clearProductsListCache();
    res.json({ message: "Producto desactivado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getOfferProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const webFilter = buildWebStockFilter(req);

    const products = await prisma.$queryRaw`
      SELECT
        p.*,
        m.nombre AS marca,
        f.nombre AS familia
      FROM "Product" p
      JOIN "Brand" m ON m.id = p."marcaId"
      JOIN "Family" f ON f.id = p."familiaId"
      WHERE p."esOferta" = true
        AND p.activo = true
        ${webFilter}
      ORDER BY p."updatedAt" DESC
      LIMIT ${Number(limit)}
      OFFSET ${offset}
    `;

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

    const webFilter = buildWebStockFilter(req);

    const products = await prisma.$queryRaw`
      SELECT
        p.*,
        m.nombre AS marca,
        f.nombre AS familia
      FROM "Product" p
      JOIN "Brand" m ON m.id = p."marcaId"
      JOIN "Family" f ON f.id = p."familiaId"
      WHERE p."esNovedad" = true
        AND p.activo = true
        ${webFilter}
      ORDER BY p."createdAt" DESC
      LIMIT ${Number(limit)}
      OFFSET ${offset}
    `;

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener novedades" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const webFilter = buildWebStockFilter(req);

    const products = await prisma.$queryRaw`
      SELECT
        p.*,
        m.nombre AS marca,
        f.nombre AS familia
      FROM "Product" p
      JOIN "Brand" m ON m.id = p."marcaId"
      JOIN "Family" f ON f.id = p."familiaId"
      WHERE p.activo = true
        AND (p."esOferta" = true OR p."esNovedad" = true)
        ${webFilter}
      ORDER BY p."updatedAt" DESC
      LIMIT 20
    `;

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

    clearProductsListCache();
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar flags" });
  }
};

export const getMarcasFiltro = async (req, res) => {
  try {
    const webFilter = buildWebStockFilter(req);

    const marcas = await prisma.$queryRaw`
      SELECT DISTINCT UPPER(m.nombre) AS nombre
      FROM "Brand" m
      JOIN "Product" p ON p."marcaId" = m.id
      WHERE p.activo = true
        ${webFilter}
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
    const webFilter = buildWebStockFilter(req);

    const rubros = await prisma.$queryRaw`
      SELECT DISTINCT UPPER(p.rubro) AS rubro
      FROM "Product" p
      WHERE p.activo = true
        AND p.rubro IS NOT NULL
        ${webFilter}
      ORDER BY rubro
    `;

    res.json(rubros.map(r => r.rubro));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener rubros" });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold ?? 0);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);

    const normalizedThreshold = Number.isFinite(threshold) ? threshold : 0;
    const normalizedLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;

    const [count, items] = await Promise.all([
      prisma.product.count({
        where: {
          activo: true,
          web: true,
          stock: {
            lte: normalizedThreshold,
          },
        },
      }),
      prisma.product.findMany({
        where: {
          activo: true,
          web: true,
          stock: {
            lte: normalizedThreshold,
          },
        },
        select: {
          id: true,
          codigoInterno: true,
          descripcion: true,
          stock: true,
          updatedAt: true,
        },
        orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
        take: normalizedLimit,
      }),
    ]);

    res.json({
      count,
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener stock bajo" });
  }
};
