"use client";

import { useEffect, useState } from "react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1643142314913-0cf633d9bbb5?auto=format&fit=crop&w=1600&q=80";

export function Hero() {
  const [heroImage, setHeroImage] = useState(DEFAULT_IMAGE);

  useEffect(() => {
    const saved = localStorage.getItem("heroImage");
    if (saved) setHeroImage(saved);
  }, []);

  return (
    <section className="relative h-[500px] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      />

      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-5xl font-bold mb-4">
          Fiorenza Repuestos
        </h1>
        <p className="text-xl">
          Calidad y confianza desde 1980
        </p>
      </div>
    </section>
  );
}
