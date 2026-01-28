"use client";

export function AboutUs() {
  return (
    <section className="min-h-[450px] px-8 py-16 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
       
        <div className="w-full h-[350px] overflow-hidden rounded-lg">
          <img
            src="https://images.unsplash.com/photo-1765202665886-f786d88d3a0f?auto=format&fit=crop&w=1200&q=80"
            alt="Fiorenza Automotores"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold">
            Quiénes Somos
          </h2>

          <p className="text-lg text-gray-700 leading-relaxed">
            Somos una empresa familiar con más de 30 años de trayectoria dedicada
            a la venta de repuestos del automotor de la línea Fiat, Peugeot y Renault.
            Nuestra misión es satisfacer al mercado con rapidez y precios competitivos,
            respaldados por un gran stock y acuerdos directos con proveedores.
          </p>

          <button className="px-6 py-3 bg-[#0D6EFD] text-white rounded-lg hover:bg-[#0b5ed7] transition-colors">
            Conocer más
          </button>
        </div>
      </div>
    </section>
  );
}
