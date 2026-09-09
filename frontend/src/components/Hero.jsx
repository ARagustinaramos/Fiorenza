"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "../lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages]);

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === heroImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? heroImages.length - 1 : prev - 1
    );
  };

  if (heroImages.length === 0) {
    return (
      <section className="h-[clamp(280px,35vh,450px)] bg-gray-900" />
    );
  }

  return (
    <section className="relative w-full h-[clamp(280px,35vh,450px)] bg-gray-900 overflow-hidden">
      
      {/* IMÁGENES CON FADE */}
      {heroImages.map((img, idx) => (
        <img
          key={img.id}
          src={img.imageUrl}
          alt="Hero"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
            currentImageIndex === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

     
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {heroImages.length > 1 && (
        <>
          {/* BOTONES MEJORADOS */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 backdrop-blur-md bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 backdrop-blur-md bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition"
          >
            <ChevronRight size={22} />
          </button>

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
        </>
      )}
      
    </section>
  );
}