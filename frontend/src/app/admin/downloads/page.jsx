"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const API =
  process.env.NEXT_PUBLIC_BACK_URL || "http://localhost:3001";

export default function AdminDownloadsPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API}/downloads`);
      if (!res.ok) throw new Error("Error al cargar archivos");
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);


  const uploadFile = async (file) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/downloads`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error en la subida");

      fetchFiles();
    } catch (error) {
      alert("Hubo un error al subir el archivo. Intenta nuevamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (id) => {
    if (!confirm("¿Eliminar archivo?")) return;

    try {
      const res = await fetch(`${API}/downloads/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      fetchFiles();
    } catch (error) {
      alert("No se pudo eliminar el archivo.");
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Subir catálogo / archivo
        </h2>

        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer hover:bg-gray-50 transition">

          <Upload className="w-10 h-10 text-gray-400" />

          <span className="text-sm text-gray-500 mt-2">
            Click para subir PDF, Excel, DBF, etc
          </span>

          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
        </label>

        {loading && (
          <p className="text-sm text-gray-500 mt-3">
            Subiendo archivo...
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold mb-4">
          Archivos cargados
        </h2>

        {files.length === 0 && (
          <p className="text-gray-500 text-sm">
            Todavía no hay archivos subidos
          </p>
        )}

        <div className="space-y-3">

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between border rounded-xl px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">

                <FileText className="w-6 h-6 text-red-500" />

                <div>
                  <p className="font-medium text-sm">
                    {file.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => deleteFile(file.id)}
                className="text-red-500 hover:text-red-700 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

        </div>
      </motion.div>
    </div>
  );
}
