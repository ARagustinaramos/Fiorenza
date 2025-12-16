import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Fiorenza App',
  description: 'Aplicación Fiorenza',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

