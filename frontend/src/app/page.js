import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { BrandLogos } from "../components/BrandLogos";
import { AboutUs } from "../components/AboutUs";
import { Footer } from "../components/Footer";
import ContactForm from "../components/ContactForm";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <BrandLogos />
        <AboutUs />

        <ContactForm />
      </main>

      <Footer />
    </div>
  );
}





