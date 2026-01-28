const isEmpty = (value) =>
  value === undefined || value === null || value === "";

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

  // Descripción
  if (!isEmpty(data.descripcion) && data.descripcion.length > 100) {
    errors.push("descripcion supera los 100 caracteres");
  }

  // Precio con IVA
  if (!isEmpty(data.precioConIva)) {
    if (isNaN(Number(data.precioConIva)) || Number(data.precioConIva) <= 0) {
      errors.push("precioConIva debe ser un número mayor a 0");
    }
  }

  //  Precio mayorista
  if (!isEmpty(data.precioMayoristaSinIva)) {
    if (
      isNaN(Number(data.precioMayoristaSinIva)) ||
      Number(data.precioMayoristaSinIva) < 0
    ) {
      errors.push("precioMayoristaSinIva inválido");
    }
  }

  // Stock
  if (!isEmpty(data.stock)) {
    if (!Number.isInteger(Number(data.stock)) || Number(data.stock) < 0) {
      errors.push("stock debe ser un entero >= 0");
    }
  }

  // Imágenes
  if (!isEmpty(data.imagenes) && !Array.isArray(data.imagenes)) {
    errors.push("imagenes debe ser un array");
  }

  return errors;
};