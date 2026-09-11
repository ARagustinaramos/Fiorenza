"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "../lib/api";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1643142314913-0cf633d9bbb5?auto=format&fit=crop&w=1600&q=80";

export function Hero() {
  const [heroImages, setHeroImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await fetch(buildApiUrl("/banners?title=hero"), {
          cache: "no-store",
        });

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        if (list.length > 0) {
          setHeroImages(
            list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          );
        } else {
          setHeroImages([{ imageUrl: DEFAULT_IMAGE, id: "default" }]);
        }
      } catch (error) {
        console.error("Error cargando hero:", error);
        setHeroImages([{ imageUrl: DEFAULT_IMAGE, id: "default" }]);
      }
    };

    fetchHero();
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === heroImages.length - 1 ? 0 : prev + 1
      );
    }, 6000); // ⬅️ velocidad más suave

    return () => clearInterval(interval);
  }, [heroImages]);

  if (heroImages.length === 0) {
    return (
      <section className="h-[280px] sm:h-[380px] lg:h-[450px] bg-gray-900" />
    );
  }

  return (
    <section className="relative w-full h-[280px] sm:h-[380px] lg:h-[450px] bg-gray-900 overflow-hidden">

      {heroImages.map((img, idx) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentImageIndex === idx ? "opacity-100" : "opacity-0"
          }`}
        >

          {/* 🔹 FONDO BLUR (full cover) */}
          <img
            src={img.imageUrl}
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
          />

          {/* 🔹 GRADIENTE LATERAL (clave del efecto premium) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

          {/* 🔹 IMAGEN PRINCIPAL (sin deformar) */}
          <img
            src={img.imageUrl}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
      ))}

      {/* 🔹 GRADIENTE GENERAL ARRIBA/ABAJO */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* 🔹 INDICADORES (dots) */}
      {heroImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentImageIndex === idx
                  ? "w-6 bg-white"
                  : "w-3 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

    </section>
  );
}