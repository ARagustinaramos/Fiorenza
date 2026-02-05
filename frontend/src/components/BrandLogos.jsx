"use client";

export function BrandLogos() {
  const brands = [
    { name: "Fiat", logo: "/brands/fiat.png" },
    { name: "Peugeot", logo: "/brands/peugeot.png" },
    { name: "Citroën", logo: "/brands/citroen.png" },
    { name: "Renault", logo: "/brands/renault.png" },
    { name: "Volkswagen", logo: "/brands/wv.png" },
    { name: "Chevrolet", logo: "/brands/chevrolet.png" },
    { name: "Ford", logo: "/brands/ford.png" },
  ];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">

      <div className="max-w-7xl mx-auto w-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4 items-center justify-items-center">
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="
              w-[90px] h-[60px] sm:w-[110px] sm:h-[70px] md:w-[120px] md:h-[80px]
              flex items-center justify-center
              transition-opacity
            "
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
