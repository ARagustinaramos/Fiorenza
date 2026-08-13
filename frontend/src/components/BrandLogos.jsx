"use client";

export function BrandLogos() {
  const brands = [
    { name: "Fiat", logo: "/brands/fiat.png" },
    { name: "Peugeot", logo: "/brands/peugeot.png" },
    { name: "Citroën", logo: "/brands/citroen.png" },
    { name: "Renault", logo: "/brands/renault.png" },
  ];

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
  <div className="w-full max-w-[900px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 lg:gap-14 items-center justify-items-center">
    {brands.map((brand) => (
      <div
        key={brand.name}
        className="
          w-full max-w-[170px] h-[78px] sm:h-[86px] md:h-[96px]
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
