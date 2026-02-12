"use client";

import { useEffect, useState } from "react";
import Slider from "react-slick";

export function OffersCarousel() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/banners`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setOffers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando banners:", error);
        setOffers([]);
      }
    };

    fetchBanners();
  }, []);

  if (!offers.length) return null;

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
  };

  return (
    <div className="w-full rounded-xl overflow-hidden relative group">
      <Slider {...settings}>
        {offers.map((offer) => (
          <div key={offer.id} className="relative h-48 w-full outline-none">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-full object-contain bg-white"
            />
          </div>
        ))}
      </Slider>

      <style>{`
        .slick-dots {
          position: absolute;
          bottom: 16px;
          width: 100%;
          text-align: center;
        }
        .slick-dots li button:before {
          color: white;
          opacity: 0.5;
        }
        .slick-dots li.slick-active button:before {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
