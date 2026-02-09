"use client";

import { useEffect, useState } from "react";
import { Download, Search, FileText } from "lucide-react";
import { motion } from "framer-motion";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function DownloadsPage() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API}/downloads`);
      if (!res.ok) throw new Error("Error de red");
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      setError(true);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">

      {/* HEADER */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 text-center"
      >
        <h1 className="text-3xl font-bold">
          Descarga de Catálogos
        </h1>
        <p className="text-gray-500">
          Encontrá y descargá nuestros archivos actualizados
        </p>
      </motion.div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100">
          Hubo un problema al cargar los catálogos. Por favor intentá más tarde.
        </div>
      )}

      {/* BUSCADOR */}

      <div className="relative max-w-md mx-auto">

        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

        <input
          placeholder="Buscar catálogo..."
          className="border rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLA DESKTOP */}

      <div className="hidden md:block overflow-hidden border rounded-2xl shadow-sm max-w-4xl mx-auto w-full">

        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
            <tr>

              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 opacity-60" />
                  Archivo
                </div>
              </th>

              <th className="px-4 py-3 text-left">
                Actualizado
              </th>

              <th className="px-4 py-3 text-right">
                Descargar
              </th>

            </tr>
          </thead>

          <tbody>
            {filtered.map((file) => (
              <tr
                key={file.id}
                className="border-t hover:bg-gray-50 transition"
              >

                <td className="px-4 py-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  {file.name}
                </td>

                <td className="px-4 py-3 text-gray-500">
                  {new Date(file.createdAt).toLocaleDateString()}
                </td>

                <td className="px-4 py-3 text-right">
                  <a
                    href={`${API}/downloads/${file.id}/file`}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </a>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* MOBILE */}

      <div className="md:hidden space-y-4 max-w-2xl mx-auto w-full">

        {filtered.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-xl p-4 space-y-2 shadow-sm"
          >

            <div className="flex items-center gap-2 font-medium">
              <FileText className="w-5 h-5 text-red-500" />
              {file.name}
            </div>

            <p className="text-xs text-gray-500">
              Actualizado:{" "}
              {new Date(file.createdAt).toLocaleDateString()}
            </p>

            <a
              href={`${API}/downloads/${file.id}/file`}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              <Download className="w-4 h-4" />
              Descargar
            </a>

          </motion.div>
        ))}
      </div>

    </div>
  );
}
