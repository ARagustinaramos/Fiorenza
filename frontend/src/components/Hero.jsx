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
    <section className="relative h-[360px] sm:h-[420px] md:h-[600px] lg:h-[700px] flex items-center justify-center overflow-hidden">
 <div
  className="absolute inset-0 bg-cover bg-center transition-transform duration-[4000ms] hover:scale-110"
  style={{
    backgroundImage: `url(${heroImage})`,
  }}
/>

      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
     
        </h1>
        <p className="text-base sm:text-lg md:text-xl">
         
        </p>
      </div>
    </section>
  );
}
