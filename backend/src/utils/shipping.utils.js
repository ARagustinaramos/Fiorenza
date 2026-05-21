export const SHIPPING_METHODS = {
  CORREO_ARGENTINO: "CORREO_ARGENTINO",
  VIA_CARGO: "VIA_CARGO",
  RETIRO_EN_LOCAL: "RETIRO_EN_LOCAL",
};

export const SHIPPING_ZONES = {
  BUENOS_AIRES: "BUENOS_AIRES",
  INTERIOR: "INTERIOR",
};

export const SHIPPING_BOX_SIZES = {
  CAJA_1: "CAJA_1",
  CAJA_2: "CAJA_2",
  CAJA_3: "CAJA_3",
  CAJA_4: "CAJA_4",
};

export const SHIPPING_PRICES = {
  [SHIPPING_ZONES.BUENOS_AIRES]: {
    [SHIPPING_BOX_SIZES.CAJA_1]: 8000,
    [SHIPPING_BOX_SIZES.CAJA_2]: 14000,
    [SHIPPING_BOX_SIZES.CAJA_3]: 22000,
    [SHIPPING_BOX_SIZES.CAJA_4]: 30000,
  },
  [SHIPPING_ZONES.INTERIOR]: {
    [SHIPPING_BOX_SIZES.CAJA_1]: 14000,
    [SHIPPING_BOX_SIZES.CAJA_2]: 24000,
    [SHIPPING_BOX_SIZES.CAJA_3]: 38000,
    [SHIPPING_BOX_SIZES.CAJA_4]: 50000,

  },
};

export const SHIPPING_PROFILE_REQUIRED_FIELDS = [
  "nombreCompleto",
  "telefono",
  "direccion",
  "ciudad",
  "provincia",
  "codigoPostal",
];

export const SHIPPING_FIELD_LABELS = {
  [SHIPPING_METHODS.CORREO_ARGENTINO]: "Correo Argentino",
  [SHIPPING_METHODS.VIA_CARGO]: "Via Cargo",
  [SHIPPING_METHODS.RETIRO_EN_LOCAL]: "Retiro en local",
  [SHIPPING_ZONES.BUENOS_AIRES]: "Buenos Aires",
  [SHIPPING_ZONES.INTERIOR]: "Interior del pais",
  [SHIPPING_BOX_SIZES.CAJA_1]: "Caja 1 - 20x20x20 (hasta aprox. 2kg)",
  [SHIPPING_BOX_SIZES.CAJA_2]: "Caja 2 - 30x30x30 (hasta aprox. 4.5kg)",
  [SHIPPING_BOX_SIZES.CAJA_3]: "Caja 3 - 40x40x40 (hasta aprox. 10kg)",
  [SHIPPING_BOX_SIZES.CAJA_4]: "Caja 4 - 50x50x50 (hasta aprox. 20kg)",
  nombreCompleto: "Nombre completo",
  telefono: "Telefono",
  direccion: "Direccion",
  ciudad: "Ciudad",
  provincia: "Provincia",
  codigoPostal: "Codigo Postal",
  referencia: "Referencia adicional",
};

const RETAIL_SHIPPING_METHODS = new Set([
  SHIPPING_METHODS.CORREO_ARGENTINO,
  SHIPPING_METHODS.VIA_CARGO,
  SHIPPING_METHODS.RETIRO_EN_LOCAL,
]);

const RETAIL_SHIPPING_ZONES = new Set(Object.values(SHIPPING_ZONES));
const RETAIL_SHIPPING_BOXES = new Set(Object.values(SHIPPING_BOX_SIZES));

export const normalizeText = (value) => {
  if (value == null) return "";
  return String(value).trim();
};

export const nullableText = (value) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

export const getRetailShippingProfile = (profile = {}) => ({
  nombreCompleto: normalizeText(profile.nombreCompleto),
  telefono: normalizeText(profile.telefono),
  direccion: normalizeText(profile.direccion),
  ciudad: normalizeText(profile.ciudad),
  provincia: normalizeText(profile.provincia),
  codigoPostal: normalizeText(profile.codigoPostal),
  referencia: normalizeText(profile.referencia),
});

export const getMissingRetailShippingProfileFields = (profile = {}) => {
  const normalizedProfile = getRetailShippingProfile(profile);
  return SHIPPING_PROFILE_REQUIRED_FIELDS.filter(
    (field) => !normalizedProfile[field]
  );
};

export const isRetailShippingProfileComplete = (profile = {}) =>
  getMissingRetailShippingProfileFields(profile).length === 0;

export const validateRetailShippingSelection = (shipping = {}) => {
  const normalizedMethod = normalizeText(shipping.shippingMethod).toUpperCase();
  const normalizedZone = normalizeText(shipping.shippingZone).toUpperCase();
  const normalizedBox = normalizeText(shipping.shippingBoxSize).toUpperCase();

  if (!RETAIL_SHIPPING_METHODS.has(normalizedMethod)) {
    throw new Error("INVALID_SHIPPING_METHOD");
  }

  if (normalizedMethod === SHIPPING_METHODS.RETIRO_EN_LOCAL) {
    return {
      shippingMethod: normalizedMethod,
      shippingZone: null,
      shippingBoxSize: null,
      shippingEstimatedCost: 0,
    };
  }

  if (!RETAIL_SHIPPING_ZONES.has(normalizedZone)) {
    throw new Error("INVALID_SHIPPING_ZONE");
  }

  if (!RETAIL_SHIPPING_BOXES.has(normalizedBox)) {
    throw new Error("INVALID_SHIPPING_BOX_SIZE");
  }

  const shippingEstimatedCost = SHIPPING_PRICES[normalizedZone]?.[normalizedBox];
  if (typeof shippingEstimatedCost !== "number") {
    throw new Error("INVALID_SHIPPING_CONFIGURATION");
  }

  return {
    shippingMethod: normalizedMethod,
    shippingZone: normalizedZone,
    shippingBoxSize: normalizedBox,
    shippingEstimatedCost,
  };
};

export const buildRetailOrderShippingSnapshot = ({
  profile = {},
  shipping = {},
}) => {
  const normalizedProfile = getRetailShippingProfile(profile);
  const missingFields = getMissingRetailShippingProfileFields(normalizedProfile);

  if (missingFields.length > 0) {
    throw new Error("PROFILE_SHIPPING_REQUIRED");
  }

  const selection = validateRetailShippingSelection(shipping);

  return {
    ...selection,
    shippingFullName: normalizedProfile.nombreCompleto,
    shippingPhone: normalizedProfile.telefono,
    shippingAddress: normalizedProfile.direccion,
    shippingCity: normalizedProfile.ciudad,
    shippingProvince: normalizedProfile.provincia,
    shippingPostalCode: normalizedProfile.codigoPostal,
    shippingReference: nullableText(normalizedProfile.referencia),
  };
};

export const getShippingLabel = (value) => {
  if (!value) return "-";
  return SHIPPING_FIELD_LABELS[value] || value;
};
