"use client";

import { useEffect, useState } from "react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1643142314913-0cf633d9bbb5?auto=format&fit=crop&w=1600&q=80";

export function Hero() {
  const [heroImage, setHeroImage] = useState(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await fetch(`${apiUrl}/banners`, {
          cache: "no-store",
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const hero = list.find((b) => b.title === "hero");

        if (hero?.imageUrl) {
          setHeroImage(hero.imageUrl);
        } else {
          setHeroImage(DEFAULT_IMAGE);
        }
      } catch (error) {
        console.error("Error cargando hero:", error);
        setHeroImage(DEFAULT_IMAGE);
      }
    };

    fetchHero();
  }, [apiUrl]);

  if (!heroImage) {
  return (
    <section className="relative h-[360px] sm:h-[420px] md:h-[600px] lg:h-[700px] bg-gray-900" />
  );
}

  return (
    <section className="relative h-[360px] sm:h-[420px] md:h-[600px] lg:h-[700px] flex items-center justify-center overflow-hidden bg-white">
      <img
        src={heroImage}
        alt="Hero"
        className="w-full h-full object-contain"
      />
    </section>
  );
}
