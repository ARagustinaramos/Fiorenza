"use client";

export function AboutUs() {
  return (
    <section className="min-h-[450px] px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
       
        <div className="w-full h-56 sm:h-72 md:h-[350px] overflow-hidden rounded-lg">
          <img
            src="/quienes-somos.png"
            alt="Fiorenza Automotores"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Quiénes Somos
          </h2>

          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
           Somos una empresa familiar con más de 35 años de experiencia en la venta de repuestos del automotor, especializada en las líneas Fiat, Renault, Peugeot y Citroen.
Nos destacamos por ofrecer resolución, precios competitivos y el mayor surtido del mercado, respaldados por un stock permanente de más de 100.000 artículos entre repuestos originales, alternativos e importados. Esta disponibilidad inmediata nos permite brindar soluciones eficientes y reducir al mínimo los tiempos de entrega.
Trabajamos de forma directa con nuestros proveedores, lo que nos permite trasladar beneficios reales en precio a nuestros clientes, manteniendo siempre altos estándares de calidad.
Nuestro equipo innova constantemente en productos, información, servicios y logística, con un solo objetivo: garantizar la satisfacción total de quienes confían en nosotros.


          </p>
        </div>
      </div>
    </section>
  );
}

