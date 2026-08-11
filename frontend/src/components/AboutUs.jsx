"use client";

export function AboutUs() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Encabezado */}
        <div className="mb-12 max-w-3xl">
          <span className="text-red-600 text-sm font-semibold tracking-[0.2em] uppercase">
            Sobre Nosotros
          </span>

          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Más de 40 años brindando soluciones para el automotor
          </h2>
        </div>

        {/* Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Imagen */}
          <div className="overflow-hidden rounded-2xl shadow-lg">
            <img
              src="/quienes-somos.jpg.png"
              alt="Fiorenza Automotores"
              className="w-full h-80 sm:h-96 lg:h-[520px] object-cover object-center"
            />
          </div>

          {/* Texto */}
          <div className="max-w-lg">

            <div className="space-y-6 text-gray-700 leading-8">

              <p>
                Somos una empresa con <strong>más de 40 años de experiencia</strong> en la venta
                de repuestos del automotor, especializada en las líneas Fiat,
                Renault, Peugeot y Citroen.
              </p>

              <p>
                Nos destacamos por ofrecer resolución,
                <strong> precios competitivos </strong>
                y el mayor surtido del mercado, respaldados por un
                <strong> stock permanente de más de 100.000 artículos</strong>
                entre repuestos originales, alternativos e importados.
                Esta disponibilidad inmediata nos permite brindar soluciones
                eficientes y reducir al mínimo los tiempos de entrega.
              </p>

              <p>
                Trabajamos de forma directa con nuestros proveedores,
                lo que nos permite trasladar beneficios reales en precio
                a nuestros clientes, manteniendo siempre altos estándares
                de calidad.
              </p>

              <p>
                Nuestro equipo innova constantemente en productos,
                información, servicios y logística, con un solo objetivo:
                garantizar la satisfacción total de quienes confían
                en nosotros.
              </p>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}