const isEmpty = (value) =>
  value === undefined || value === null || value === "";

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

export const validateProductInput = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate) {

    if (isEmpty(data.codigoInterno)) {
      errors.push("codigoInterno es obligatorio");
    }
  }

  if (!isEmpty(data.codigoOriginal)) {
    if (typeof data.codigoOriginal !== "string") {
      errors.push("codigoOriginal debe ser texto");
    }

    if (data.codigoOriginal.length > 50) {
      errors.push("codigoOriginal supera los 50 caracteres");
    }
  }

  if (!isEmpty(data.descripcion) && data.descripcion.length > 100) {
    errors.push("descripcion supera los 100 caracteres");
  }

  if (!isEmpty(data.precioConIva)) {
    const parsed = parseNumber(data.precioConIva);
    if (parsed === null || parsed <= 0) {
      errors.push("precioConIva debe ser un nÃºmero mayor a 0");
    }
  }

  //  Precio mayorista
  if (!isEmpty(data.precioMayoristaSinIva)) {
    const parsed = parseNumber(data.precioMayoristaSinIva);
    if (parsed === null || parsed < 0) {
      errors.push("precioMayoristaSinIva inválido");
    }
  }

  // Stock
  if (!isEmpty(data.stock)) {
    const parsed = parseNumber(data.stock);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.push("stock debe ser un entero >= 0");
    }
  }

  // Imágenes
  if (!isEmpty(data.imagenes) && !Array.isArray(data.imagenes)) {
    errors.push("imágenes debe ser un array");
  }

  return errors;
};
