"use client";

import { useEffect, useState } from "react";
import Slider from "react-slick";

export function OffersCarousel() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    const fetchBanners = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiUrl}/banners`);
      const data = await res.json();
      setOffers(data);
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
    <div className="w-full rounded-xl overflow-hidden shadow-lg relative group">
      <Slider {...settings}>
        {offers.map((offer) => (
          <div key={offer.id} className="relative h-48 w-full outline-none">
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A]/90 via-[#1E3A8A]/50 to-transparent flex flex-col justify-center px-4">
              <h2 className="text-lg font-bold text-white mb-1 drop-shadow-md">
                {offer.title}
              </h2>

              <p className="text-sm text-blue-100 font-medium mb-3">
                {offer.subtitle}
              </p>

              {offer.link && (
                <a
                  href={offer.link}
                  className="px-3 py-1 bg-[#0D6EFD] hover:bg-blue-600 text-white text-xs font-semibold rounded shadow-md w-fit"
                >
                  Ver Ofertas
                </a>
              )}
            </div>
          </div>
        ))}
      </Slider>

      {/* slick styles */}
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
