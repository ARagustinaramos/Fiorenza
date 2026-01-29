import "./globals.css";
import { Providers } from "./providers";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import WhatsappFloating from "../components/WhatsappFloating";
import ScrollToTop from "../components/ScrollToTop";

export const metadata = {
  title: "Fiorenza App",
  description: "Aplicación Fiorenza",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
          <WhatsappFloating />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}







