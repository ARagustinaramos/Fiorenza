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
    <section className="h-[180px] px-8 bg-white flex items-center">

      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="
              w-[120px] h-[80px]
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
