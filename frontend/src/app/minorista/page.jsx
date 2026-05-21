"use client";

import { Navbar } from "../../components/Navbar";
import { Sidebar } from "../../components/Sidebar";
import { Footer } from "../../components/Footer";
import { ProductCardsMinorista } from "../../components/products/ProductCardsMinorista";
import { useState } from "react";

export default function MinoristaPage() {
  const [sidebarContent, setSidebarContent] = useState(null);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar>{sidebarContent}</Sidebar>

        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Productos minoristas</h1>
              <p className="text-sm text-gray-600 mt-2">
                Explorá el catálogo y agregá productos al carrito.
              </p>
            </div>
            <ProductCardsMinorista onSidebarContent={setSidebarContent} />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
