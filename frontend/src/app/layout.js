import "./globals.css";
import { Providers } from "./providers";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import WhatsappFloating from "../components/WhatsappFloating";
import ScrollToTop from "../components/ScrollToTop";

import { Montserrat } from "next/font/google"; 

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata = {
  title: "Mayorista Fiorenza",
  description: "Aplicación Fiorenza",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-sans`}>
        <Providers>
          {children}
          <WhatsappFloating />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}

