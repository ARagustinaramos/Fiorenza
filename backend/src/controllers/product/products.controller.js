import prisma from "../../config/prisma.js";
import { Prisma } from "@prisma/client";
import { validateProductInput } from "../../validators/product.validator.js";

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
          precioConIva: parseNumber(req.body.precioConIva),
          precioMayoristaSinIva: req.body.precioMayoristaSinIva !== undefined && req.body.precioMayoristaSinIva !== ""
            ? parseNumber(req.body.precioMayoristaSinIva)
            : null,
          stock: parseNumber(req.body.stock) || 0,
          activo: true,
        },
      });

      return res.status(200).json(product);
    }

    const product = await prisma.product.create({
      data: {
        ...req.body,
        precioConIva: parseNumber(req.body.precioConIva),
        precioMayoristaSinIva: req.body.precioMayoristaSinIva !== undefined && req.body.precioMayoristaSinIva !== ""
          ? parseNumber(req.body.precioMayoristaSinIva)
          : null,
        stock: parseNumber(req.body.stock) || 0,
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
      favorites,
      includeInactive,
      page = 1,
      limit = 20,
    } = req.query;

    const limitNum = Number(limit);
    const offset = (Number(page) - 1) * limitNum;
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
      joins.push(
        Prisma.sql`JOIN "Favorite" fav ON fav."productId" = p.id AND fav."userId" = ${userId}`
      );
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
    const words = q
      .split(" ")
      .map(w => w.trim())
      .filter(Boolean);

    if (q && words.length) {
      const conditions = words.map((word) => {
        const safeWord = escapeLike(word);

        return Prisma.sql`(
          immutable_unaccent(LOWER(p.descripcion)) ILIKE '%' || LOWER(${safeWord}) || '%'
          OR immutable_unaccent(LOWER(p."descripcionAdicional")) ILIKE '%' || LOWER(${safeWord}) || '%'
          OR LOWER(p."codigoInterno") ILIKE '%' || LOWER(${safeWord}) || '%'
          OR CAST(p."codigoOriginal" AS TEXT) ILIKE '%' || ${safeWord} || '%'
        )`;
      });

      const andBlock = joinWith(conditions, "AND");
      filters.push(Prisma.sql`(${andBlock})`);
    }

    const whereSQL = Prisma.sql`WHERE ${joinWith(filters, "AND")}`;

    // Ejecutamos las consultas en paralelo para ganar velocidad
    const [products, totalResult] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          p.*,
          m.nombre AS marca,
          f.nombre AS familia
        FROM "Product" p
        ${joinWith(joins, " ")}
        ${whereSQL}
        ORDER BY
          (p.descripcion IS NULL OR p.descripcion = '') ASC,
          p.descripcion ASC
        LIMIT ${limitNum}
        OFFSET ${offset}
      `,
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT p.id)::int AS count
        FROM "Product" p
        ${joinWith(joins, " ")}
        ${whereSQL}
      `,
    ]);

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
    const total = totalResult[0]?.count || 0;

    const sanitizedProducts = products.map((p) => {
      // Asignamos las imágenes en memoria
      p.images = imagesMap[p.codigoInterno] || [];

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
        total: Number(total),
        pages: Math.ceil(Number(total) / Number(limit)),
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
