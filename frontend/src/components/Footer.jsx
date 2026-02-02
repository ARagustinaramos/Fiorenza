export function Footer() {
    return (
      <footer className="min-h-[220px] bg-[#111111] text-white px-8 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Columna 1 - Información de la empresa */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold mb-4">Fiorenza Automotores</h3>
            <p className="text-gray-400">
              © 2025 – Todos los derechos reservados
            </p>
          </div>
  
          {/* Columna 2 - Enlaces */}
          <div className="space-y-2">
            <h4 className="font-semibold mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#contacto" className="text-gray-400 hover:text-white transition-colors">
                  Contacto
                </a>
              </li>
              <li>
                <a href="#quienes-somos" className="text-gray-400 hover:text-white transition-colors">
                  Quiénes somos
                </a>
              </li>
            </ul>
          </div>
  
          {/* Columna 3 - Contacto */}
          <div className="space-y-2">
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <span className="block">Dirección:</span>
                <span>Av. Rocardo Balbin (ex Mitre) 303
                </span>
              </li>
              <li>
                <span className="block"></span>
                <span>San Miguel (1663) – Prov de Bs. As.</span>
              </li>
              <li>
                <span className="block">WhatsApp:</span>
                <span>11 5344-4546 (solo mensajes)</span>
              </li>
              <li>
                <span className="block">Telefonos:</span>
                <span>4451-2577 // 4667-1222</span>
              </li>
              <li>
                <span className="block">Email:</span>
                <span>info@fiorenzarepuestos.com.ar</span>
              </li>
            </ul>
          </div>
  
        </div>
      </footer>
    );
  }