import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

/**
 * Configuración de la fuente Inter desde Google Fonts
 * Se usa en toda la aplicación para una tipografía coherente
 */
const inter = Inter({ subsets: ["latin"] })

/**
 * Metadatos de la aplicación
 * Se muestran en el navegador y en compartición en redes sociales
 */
export const metadata: Metadata = {
  title: "SmartApply - Autocompletar Formularios",
  description:
    "POC: Extensión de navegador inteligente para autocompletar formularios de empleo automáticamente.",
}

/**
 * Layout raíz de la aplicación
 * Todos los componentes se renderizan dentro de este layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}

