"use client";

import { useState, useRef, useEffect } from "react";

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? search : value}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setSearch("");
        }}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400"
      />

      {open && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-white shadow">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Sin resultados
            </div>
          )}

          {filtered.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-red-50"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
