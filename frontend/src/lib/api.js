"use client";

const DEFAULT_API_URL = "http://localhost:3001/api";

export const getApiBaseUrl = () => {
  const rawValue = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).trim();
  const normalizedValue = rawValue.replace(/\/+$/, "");

  if (!normalizedValue) {
    return DEFAULT_API_URL;
  }

  return normalizedValue.endsWith("/api")
    ? normalizedValue
    : `${normalizedValue}/api`;
};

export const buildApiUrl = (path = "") => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
};
