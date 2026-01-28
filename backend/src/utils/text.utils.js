export const sanitizeText = (value) =>
  value ? value.toString().replace(/\s+/g, " ").trim() : "";

export const normalizeSearch = (text = "") =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

export const escapeLike = (value = "") =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");