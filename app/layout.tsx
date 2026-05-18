import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display, Bebas_Neue } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: '--font-dm-sans',
  display: 'swap'
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap'
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'HappyCheese',
  description: 'Descubre las mejores tartas de queso artesanales de Palma de Mallorca. Hechas con pasion, ingredientes premium y recetas unicas. Haz tu pedido online y recoge en tienda.',
  keywords: ['tartas de queso', 'cheesecake', 'Palma de Mallorca', 'reposteria artesanal', 'postres'],
  authors: [{ name: 'HappyCheese' }],
  openGraph: {
    title: 'HappyCheese | Tartas de Queso Artesanales',
    description: 'Las mejores tartas de queso artesanales de Palma de Mallorca',
    type: 'website',
    locale: 'es_ES',
  },
  generator: 'scwebsstudio',
}

export const viewport: Viewport = {
  themeColor: '#b8860b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfair.variable} ${bebasNeue.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
