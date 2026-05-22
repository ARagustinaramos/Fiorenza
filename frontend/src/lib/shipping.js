export const SHIPPING_METHODS = {
  CORREO_ARGENTINO: "CORREO_ARGENTINO",
  VIA_CARGO: "VIA_CARGO",
  RETIRO_EN_LOCAL: "RETIRO_EN_LOCAL",
};

export const SHIPPING_ZONES = {
  PROVINCIA: "PROVINCIA",
  INTERIOR: "INTERIOR",
};

export const SHIPPING_BOX_SIZES = {
  CAJA_1: "CAJA_1",
  CAJA_2: "CAJA_2",
  CAJA_3: "CAJA_3",
  CAJA_4: "CAJA_4",
};

export const SHIPPING_PRICES = {
  [SHIPPING_ZONES.PROVINCIA]: {
    [SHIPPING_METHODS.CORREO_ARGENTINO]: {
      [SHIPPING_BOX_SIZES.CAJA_1]: 11000,
      [SHIPPING_BOX_SIZES.CAJA_2]: 16000,
      [SHIPPING_BOX_SIZES.CAJA_3]: 33000,
      [SHIPPING_BOX_SIZES.CAJA_4]: 45000,
    },
    [SHIPPING_METHODS.VIA_CARGO]: {
      [SHIPPING_BOX_SIZES.CAJA_1]: 23000,
      [SHIPPING_BOX_SIZES.CAJA_2]: 23000,
      [SHIPPING_BOX_SIZES.CAJA_3]: 27000,
      [SHIPPING_BOX_SIZES.CAJA_4]: 63000,
    },
  },
  [SHIPPING_ZONES.INTERIOR]: {
    [SHIPPING_METHODS.CORREO_ARGENTINO]: {
      [SHIPPING_BOX_SIZES.CAJA_1]: 11000,
      [SHIPPING_BOX_SIZES.CAJA_2]: 16000,
      [SHIPPING_BOX_SIZES.CAJA_3]: 33000,
      [SHIPPING_BOX_SIZES.CAJA_4]: 45000,
    },
    [SHIPPING_METHODS.VIA_CARGO]: {
      [SHIPPING_BOX_SIZES.CAJA_1]: 20000,
      [SHIPPING_BOX_SIZES.CAJA_2]: 20000,
      [SHIPPING_BOX_SIZES.CAJA_3]: 22000,
      [SHIPPING_BOX_SIZES.CAJA_4]: 46000,
    },
  },
};

export const SHIPPING_NOTICE =
  "El costo de envio mostrado es estimativo. El valor final sera confirmado por nuestro equipo luego de la compra segun dimensiones reales, destino final y transporte seleccionado.";

export const SHIPPING_PROFILE_REQUIRED_MESSAGE =
  "Para finalizar tu compra necesitás completar tus datos de envío.";

export const SHIPPING_PROFILE_REQUIRED_FIELDS = [
  "nombreCompleto",
  "telefono",
  "direccion",
  "ciudad",
  "provincia",
  "codigoPostal",
];

export const SHIPPING_METHOD_OPTIONS = [
  {
    value: SHIPPING_METHODS.CORREO_ARGENTINO,
    label: "Correo Argentino",
  },
  {
    value: SHIPPING_METHODS.VIA_CARGO,
    label: "Via Cargo",
  },
  {
    value: SHIPPING_METHODS.RETIRO_EN_LOCAL,
    label: "Retiro en local",
  },
];

export const SHIPPING_ZONE_OPTIONS = [
  {
    value: SHIPPING_ZONES.PROVINCIA,
    label: "Provincia",
    description: "Envios dentro de provincia",
  },
  {
    value: SHIPPING_ZONES.INTERIOR,
    label: "Interior",
    description: "Todo el resto del pais",
  },
];

export const SHIPPING_BOX_OPTIONS = [
  {
    value: SHIPPING_BOX_SIZES.CAJA_1,
    label: "Caja 1",
    description: "20x20x20 (hasta aprox. 2kg)",
  },
  {
    value: SHIPPING_BOX_SIZES.CAJA_2,
    label: "Caja 2",
    description: "30x30x30 (hasta aprox. 4.5kg)",
  },
  {
    value: SHIPPING_BOX_SIZES.CAJA_3,
    label: "Caja 3",
    description: "40x40x40 (hasta aprox. 10kg)",
  },
   {
    value: SHIPPING_BOX_SIZES.CAJA_4,
    label: "Caja 4",
    description: "50x50x50 (hasta aprox. 20kg)",
  },
];

const SHIPPING_LABELS = {
  [SHIPPING_METHODS.CORREO_ARGENTINO]: "Correo Argentino",
  [SHIPPING_METHODS.VIA_CARGO]: "Via Cargo",
  [SHIPPING_METHODS.RETIRO_EN_LOCAL]: "Retiro en local",
  [SHIPPING_ZONES.PROVINCIA]: "Provincia",
  [SHIPPING_ZONES.INTERIOR]: "Interior del pais",
  [SHIPPING_BOX_SIZES.CAJA_1]: "Caja 1",
  [SHIPPING_BOX_SIZES.CAJA_2]: "Caja 2",
  [SHIPPING_BOX_SIZES.CAJA_3]: "Caja 3", 
  [SHIPPING_BOX_SIZES.CAJA_4]: "Caja 4",
};

const normalizeText = (value) => String(value || "").trim();

export const getShippingProfileMissingFields = (profile = {}) =>
  SHIPPING_PROFILE_REQUIRED_FIELDS.filter((field) => !normalizeText(profile[field]));

export const isShippingProfileComplete = (profile = {}) =>
  getShippingProfileMissingFields(profile).length === 0;

export const getEstimatedShippingCost = ({ shippingMethod, shippingZone, shippingBoxSize }) => {
  if (shippingMethod === SHIPPING_METHODS.RETIRO_EN_LOCAL) {
    return 0;
  }

  if (!shippingZone || !shippingBoxSize) {
    return null;
  }

  return SHIPPING_PRICES[shippingZone]?.[shippingMethod]?.[shippingBoxSize] ?? null;
};

export const getShippingLabel = (value) => SHIPPING_LABELS[value] || value || "-";
