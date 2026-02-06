export const normalizeCode = (value) => {
  if (!value) return null;

  return value
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
};