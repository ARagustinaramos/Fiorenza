"use client";

import { useEffect, useState } from "react";
import { Upload, Edit } from "lucide-react";
import { useRef } from "react";

function Spinner({ size = 24 }) {
  return (
    <div
      className="animate-spin rounded-full border-4 border-gray-300 border-t-red-500"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}


export default function AdminProductos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados separados para cada modo
  const [csvFileUpdate, setCsvFileUpdate] = useState(null);
  const [csvFileCreate, setCsvFileCreate] = useState(null);
  const [csvFileReplace, setCsvFileReplace] = useState(null);
  const [csvFileDelete, setCsvFileDelete] = useState(null);

  const [imageFiles, setImageFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const friendlyErrors = {
    "MISSING_CODE": "Falta el código interno del producto",
    "descripcion vacía": "Falta la descripción del producto",
    "precio inválido": "El precio está vacío o es incorrecto",
    "Archivo requerido": "No se seleccionó ningún archivo",
    "Columnas faltantes": "El archivo no tiene todas las columnas necesarias",
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleExcelUpload = async (csvFile, mode) => {
    if (!csvFile) {
      setError("Por favor selecciona un archivo");
      return;
    }

    setUploadingExcel(true);
    setError(null);
    setUploadResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("mode", mode);

      const res = await fetch(`${apiUrl}/products/bulk-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al subir el archivo");
      }

      const data = await res.json();

      let message = "";
      if (mode === "delete") {
        message = `Archivo procesado: ${data.inserted} productos borrados, ${data.skipped} omitidos`;
      } else if (mode === "create") {
        message = `Archivo procesado: ${data.inserted} productos creados, ${data.skipped} omitidos`;
      } else if (mode === "update") {
        message = `Archivo procesado: ${data.inserted} productos actualizados, ${data.skipped} omitidos`;
      } else {
        message = `Archivo procesado: ${data.inserted} productos insertados/actualizados, ${data.skipped} omitidos`;
      }

      if (data.errorsCount > 0) {
        message += ` (⚠️ ${data.errorsCount} errores encontrados)`;
      }

      setUploadResult({
        type: "success",
        message: message,
        details: data,
      });

      // Limpiar solo el archivo del modo correspondiente
      if (mode === "update") setCsvFileUpdate(null);
      if (mode === "create") setCsvFileCreate(null);
      if (mode === "replace") setCsvFileReplace(null);
      if (mode === "delete") setCsvFileDelete(null);

      document.getElementById(`csv-${mode}`).value = "";
    } catch (err) {
      console.error("Error subiendo archivo:", err);
      setError("Ocurrió un problema al procesar el archivo. Revisá que esté bien armado.");
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleImagesUpload = async () => {
    if (imageFiles.length === 0) {
      setError("Por favor selecciona al menos una imagen");
      return;
    }

    setUploadingImages(true);
    setError(null);
    setUploadResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(`${apiUrl}/products/bulk-images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = "Error al subir las imágenes";

        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {

        }

        throw new Error(errorMessage);
      }


      const data = await res.json();
      setUploadResult({
        type: "success",
        message: `${data.uploaded || imageFiles.length} imágenes subidas exitosamente`,
        details: data,
      });

      setImageFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error subiendo imágenes:", err);
      setError(err.message);
    } finally {
      setUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Actualizar productos</h1>
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        </main>
      </div>
    );
  }
  {
    (uploadingExcel || uploadingImages) && (
      <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center gap-3">
          <Spinner size={40} />
          <p className="text-gray-700 font-medium">
            Procesando archivos...
          </p>
        </div>
      </div>
    )
  }

  const formatErrorMessage = (rawError) => {
    if (!rawError) return "Error desconocido";

    if (Array.isArray(rawError)) {
      return rawError
        .map(e => friendlyErrors[e] || e)
        .join(" y ");
    }

    if (typeof rawError === "string") {
      return rawError
        .split("|")
        .map(e => {
          const clean = e.trim();
          return friendlyErrors[clean] || clean;
        })
        .join(" y ");
    }

    return "Error desconocido";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Actualizar productos</h1>

        {/* Mensajes de éxito/error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {uploadResult && (
          <div
            className={`border rounded-lg p-4 mb-6 ${uploadResult.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
              }`}
          >
            <p
              className={
                uploadResult.type === "success" ? "text-green-800" : "text-red-800"
              }
            >
              {uploadResult.message}
            </p>
            {uploadResult.details?.errorsCount > 0 && (
              <div className="text-sm text-gray-600 mt-3 max-h-40 overflow-y-auto">
                <p className="font-medium mb-2">Se encontraron {uploadResult.details.errorsCount} errores:</p>
                <ul className="list-disc list-inside space-y-1">
                  {uploadResult.details.errors?.slice(0, 10).map((err, idx) => (
                    <li key={idx} className="text-xs">
                      <span className="font-medium">Fila {err.row}:</span>{" "}
                      {formatErrorMessage(err.error)}
                    </li>
                  ))}
                  {uploadResult.details.errorsCount > 10 && (
                    <li className="text-xs font-medium">... y {uploadResult.details.errorsCount - 10} errores más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Importar Excel/CSV */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Actualizar productos existentes
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Formatos aceptados: .xlsx, .xls, .csv
          </p>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo CSV de productos
              </label>

              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                id="csv-update"
                className="hidden"
                onChange={(e) => {
                  setCsvFileUpdate(e.target.files?.[0] || null);
                }}
              />

              <input
                type="text"
                value={csvFileUpdate?.name || ""}
                placeholder="Seleccionar archivo..."
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div className="flex gap-2">
              <label
                htmlFor="csv-update"
                className="px-6 py-3 bg-[#0D6EFD] text-white rounded-lg hover:bg-[#0b5ed7] transition flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Seleccionar
              </label>
              {csvFileUpdate && (
                <button
                  onClick={() => handleExcelUpload(csvFileUpdate, "update")}
                  disabled={uploadingExcel}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingExcel ? (
                    <div className="flex items-center gap-2">
                      <Spinner size={18} />
                      Subiendo...
                    </div>
                  ) : (
                    "Subir archivo"
                  )}

                </button>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Subir productos nuevos</h2>
          <p className="text-sm text-gray-600 mb-4">
            Crea productos que no existen aún. Si el código ya existe, se ignora.
          </p>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="csv-create"
                onChange={(e) => {
                  setCsvFileCreate(e.target.files?.[0] || null);
                }}
              />
              <input
                type="text"
                value={csvFileCreate?.name || ""}
                readOnly
                className="w-full px-4 py-3 border rounded-lg bg-gray-50"
              />
            </div>

            <label
              htmlFor="csv-create"
              className="px-6 py-3 bg-[#0D6EFD] text-white rounded-lg cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Seleccionar
            </label>

            {csvFileCreate && (
              <button
                onClick={() => handleExcelUpload(csvFileCreate, "create")}
                disabled={uploadingExcel}
                className="px-6 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingExcel ? (
                  <div className="flex items-center gap-2">
                    <Spinner size={18} />
                    Subiendo...
                  </div>
                ) : (
                  "Subir nuevos"
                )}
              </button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-300 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-yellow-700">
            Reemplazar TODO el catálogo (recomendado)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Desactiva todo el catálogo actual y carga el Excel completo nuevamente.
          </p>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="csv-replace"
                onChange={(e) => {
                  setCsvFileReplace(e.target.files?.[0] || null);
                }}
              />
              <input
                type="text"
                value={csvFileReplace?.name || ""}
                readOnly
                className="w-full px-4 py-3 border rounded-lg bg-gray-50"
              />
            </div>

            <label
              htmlFor="csv-replace"
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Seleccionar
            </label>

            {csvFileReplace && (
              <button
                onClick={() => {
                  if (!confirm("Esto va a desactivar todo el catálogo actual. ¿Seguro?")) return;
                  handleExcelUpload(csvFileReplace, "replace");
                }}
                disabled={uploadingExcel}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg disabled:opacity-50"
              >
                {uploadingExcel ? "Procesando..." : "Reemplazar todo"}
              </button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-red-700">
            Borrar productos
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Borrar productos existentes
          </p>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="csv-delete"
                onChange={(e) => {
                  setCsvFileDelete(e.target.files?.[0] || null);
                }}
              />
              <input
                type="text"
                value={csvFileDelete?.name || ""}
                readOnly
                className="w-full px-4 py-3 border rounded-lg bg-gray-50"
              />
            </div>

            <label
              htmlFor="csv-delete"
              className="px-6 py-3 bg-red-600 text-white rounded-lg cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Seleccionar
            </label>

            {csvFileDelete && (
              <button
                onClick={() => handleExcelUpload(csvFileDelete, "delete")}
                disabled={uploadingExcel}
                className="px-6 py-3 bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingExcel ? (
                  <div className="flex items-center gap-2">
                    <Spinner size={18} />
                    Procesando...
                  </div>
                ) : (
                  "Ejecutar baja"
                )}

              </button>
            )}
          </div>
        </div>


        {/* Subir imágenes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Subir imágenes de productos
          </h2>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes (múltiples archivos permitidos)
              </label>
              <input
                type="file"
                multiple
                webkitdirectory=""
                directory=""
                accept="image/*"
                id="images-upload"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              />

              <input
                type="text"
                value={
                  imageFiles.length > 0
                    ? `${imageFiles.length} archivo(s) seleccionado(s)`
                    : ""
                }
                placeholder="Seleccionar imágenes..."
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div className="flex gap-2">
              <label
                htmlFor="images-upload"
                className="px-6 py-3 bg-[#0D6EFD] text-white rounded-lg hover:bg-[#0b5ed7] transition flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Seleccionar
              </label>
              {imageFiles.length > 0 && (
                <button
                  onClick={handleImagesUpload}
                  disabled={uploadingImages}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImages ? (
                    <div className="flex items-center gap-2">
                      <Spinner size={18} />
                      Subiendo...
                    </div>
                  ) : (
                    `Subir ${imageFiles.length} imagen(es)`
                  )}

                </button>
              )}
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}  
