"use client";

import { useRef, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

export default function ContactForm() {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    
    if (!publicKey) {
      console.error(
        "❌ EMAILJS_PUBLIC_KEY no configurado en variables de entorno"
      );
      return;
    }

    emailjs.init(publicKey);
    console.log("✓ EmailJS inicializado correctamente");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      setError("Configuración de EmailJS incompleta");
      console.error("❌ Faltan credenciales de EmailJS:", {
        serviceId: !!serviceId,
        templateId: !!templateId,
      });
      return;
    }

    if (honeypot) {
      setError("No se pudo enviar el formulario.");
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await emailjs.sendForm(
        serviceId,
        templateId,
        formRef.current
      );

      console.log("✓ Email enviado:", response.status);
      setSuccess(true);
      formRef.current.reset();

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("❌ Error enviando email:", err);
      setError(
        err.text || "Ocurrió un error al enviar el formulario. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <h2 className="text-xl sm:text-2xl font-medium text-gray-900">
        ¿Querés comprar por la web?
      </h2>

      <p className="mt-2 max-w-xl text-gray-600">
        Dejanos tus datos y te contactamos a la brevedad para ayudarte con tu
        compra.
      </p>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2"
      >
        <div className="sm:col-span-1">
          <label className="text-sm text-gray-500">Nombre</label>
          <input
            type="text"
            name="from_name"
            required
            disabled={loading}
            className="mt-1 w-full border-b border-gray-300 bg-transparent py-2 text-sm
                       focus:border-red-600 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="text-sm text-gray-500">Email</label>
          <input
            type="email"
            name="from_email"
            required
            disabled={loading}
            className="mt-1 w-full border-b border-gray-300 bg-transparent py-2 text-sm
                       focus:border-red-600 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="text-sm text-gray-500">
            Teléfono <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            type="text"
            name="phone"
            disabled={loading}
            className="mt-1 w-full border-b border-gray-300 bg-transparent py-2 text-sm
                       focus:border-red-600 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="text-sm text-gray-500">Empresa</label>
          <input
            type="text"
            name="company"
            disabled={loading}
            className="mt-1 w-full border-b border-gray-300 bg-transparent py-2 text-sm
                       focus:border-red-600 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm text-gray-500">Mensaje</label>
          <textarea
            name="message"
            rows="3"
            required
            disabled={loading}
            className="mt-1 w-full border-b border-gray-300 bg-transparent py-2 text-sm
                       focus:border-red-600 focus:outline-none disabled:opacity-50 resize-none"
          />
        </div>

        <div className="sr-only">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {success && (
          <div className="sm:col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <span className="text-lg">✓</span>
              <strong>¡Consulta enviada correctamente!</strong>
            </p>
            <p className="text-xs text-green-600 mt-1">
              Nos pondremos en contacto pronto.
            </p>
          </div>
        )}

        {error && (
          <div className="sm:col-span-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <span className="text-lg">✕</span>
              <strong>Error al enviar</strong>
            </p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        <div className="sm:col-span-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white
                       bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                Enviando...
              </>
            ) : (
              <>
                Enviar consulta
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
