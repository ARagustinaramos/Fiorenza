"use client";

import { Navbar } from "../../components/Navbar";
import { Sidebar } from "../../components/Sidebar";
import { ProductTableNew } from "../../components/products/ProductTableNew";
import { OffersCarousel } from "../../components/OffersCarouse";
import { Footer } from "../../components/Footer";

export default function MayoristaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-6">
        <Sidebar>
          <OffersCarousel />
        </Sidebar>

        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <h1 className="text-4xl font-bold">Nuestros productos</h1>
            <ProductTableNew />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
