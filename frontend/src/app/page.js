"use client";

import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { BrandLogos } from "../components/BrandLogos";
import { AboutUs } from "../components/AboutUs";
import { Footer } from "../components/Footer";
import ContactForm from "../components/ContactForm";
import { Sidebar } from "../components/Sidebar";
import { ProductCardsMinorista } from "../components/products/ProductCardsMinorista";


export default function HomePage({ initialCode = "" }) {
  const [sidebarContent, setSidebarContent] = useState(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />

        <div className="bg-gray-50 py-10 border-t">
          <BrandLogos />
        </div>
        <section id="catalogo" className="bg-gray-50 border-y border-gray-100">
          <div className="flex flex-col lg:flex-row">
            <Sidebar>{sidebarContent}</Sidebar>

            <div className="flex-1 min-w-0 p-4 sm:p-6">
              <div className="max-w-[1400px] mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Catalogo de productos</h1>
                  <p className="text-sm text-gray-600 mt-2">
                    Explora el catalogo y agrega productos al carrito.
                  </p>
                </div>
                <ProductCardsMinorista
                  initialCode={initialCode}
                  onSidebarContent={setSidebarContent}
                />
              </div>
            </div>
          </div>
        </section>
        <AboutUs />

        <ContactForm />
      </main>

      <Footer />
    </div>
  );
}


