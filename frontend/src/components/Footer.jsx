import { Instagram, Mail, Phone, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="min-h-[220px] bg-[#111111] text-white px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">

        {/* Columna 1 - Empresa */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Fiorenza Automotores</h3>
          <p className="text-sm sm:text-base text-gray-400">
            © 2025 – Todos los derechos reservados
          </p>
        </div>

        {/* Columna 2 - Contacto rápido */}
        <div className="space-y-4 text-sm sm:text-base">
          <h4 className="font-semibold mb-4">Contacto</h4>

          <a
            href="mailto:info@fiorenzarepuestos.com.ar"
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
          >
            <Mail className="w-5 h-5" />
            <span>info@fiorenzarepuestos.com.ar</span>
          </a>

          <div className="flex items-center gap-3 text-gray-400">
            <Phone className="w-5 h-5" />
            <span>4451-2577 / 4667-1222</span>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <MessageCircle className="w-5 h-5" />
            <span>1153444546 Ventas Mayoristas (solo mensajes)</span>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <MessageCircle className="w-5 h-5" />
            <span>1169758185 Ventas Minorista (solo mensajes)</span>
          </div>

          <a
            href="https://www.instagram.com/fiorenzarepuestos"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
          >
            <Instagram className="w-5 h-5" />
            <span>@fiorenzarepuestos</span>
          </a>
        </div>

        {/* Columna 3 - Dirección */}
        <div className="space-y-2 text-sm sm:text-base">
          <h4 className="font-semibold mb-4">Dirección</h4>

          <p className="text-gray-400">
            Av. Ricardo Balbín (ex Mitre) 303
          </p>
          <p className="text-gray-400">
            San Miguel (1663) – Prov. de Bs. As.
          </p>
        </div>

      </div>
    </footer>
  );
}
