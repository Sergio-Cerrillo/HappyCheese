# 🎯 Optimizaciones Post-Producción

## ⚡ Configuraciones Recomendadas

### 1. Next.js Config (`next.config.mjs`)

Actualmente tienes:
```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ⚠️ No recomendado para producción
  },
  images: {
    unoptimized: true,  // ⚠️ Desactiva optimización de imágenes
  },
}
```

#### Recomendación para producción:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Mejor: Arregla los errores TypeScript en vez de ignorarlos
  typescript: {
    ignoreBuildErrors: false, // Cambia a false cuando corrijas los tipos
  },
  
  // ✅ Optimización de imágenes con Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // ✅ Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
  
  // ✅ Redirects útiles
  async redirects() {
    return [
      {
        source: '/pedidos',
        destination: '/pedido',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
```

### 2. Metadata para SEO

Añade en `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'HappyCheese - Tartas de Queso Artesanales en Palma',
    template: '%s | HappyCheese'
  },
  description: 'Las mejores tartas de queso artesanales de Palma de Mallorca. Pedidos online con recogida en tienda. Variedad de sabores únicos.',
  keywords: ['tarta de queso', 'cheesecake', 'Palma', 'Mallorca', 'artesanal', 'pedidos online'],
  authors: [{ name: 'HappyCheese' }],
  creator: 'HappyCheese',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'HappyCheese - Tartas de Queso Artesanales',
    description: 'Las mejores tartas de queso artesanales de Palma de Mallorca',
    siteName: 'HappyCheese',
    images: [
      {
        url: '/og-image.jpg', // Crea esta imagen (1200x630px)
        width: 1200,
        height: 630,
        alt: 'HappyCheese'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HappyCheese - Tartas de Queso Artesanales',
    description: 'Las mejores tartas de queso artesanales de Palma de Mallorca',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```

### 3. Sitemap y Robots.txt

Crea `app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/sabores`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pedido`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
}
```

Crea `app/robots.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

---

## 📊 Analytics y Monitoreo

### 1. Vercel Analytics (Ya incluido)

El proyecto ya tiene `@vercel/analytics`. Verifica que esté en `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. Google Analytics (Opcional)

Crea `app/components/analytics.tsx`:

```typescript
'use client'

import Script from 'next/script'

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}
```

Añade en `app/layout.tsx`:

```typescript
import { GoogleAnalytics } from './components/analytics'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
```

Añade variable en Vercel: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`

### 3. Sentry (Error Tracking)

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Sigue el wizard y configura tu DSN.

---

## 🔒 Seguridad Adicional

### 1. Rate Limiting en API Routes

Crea `lib/rate-limit.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60000 // 1 minuto
): boolean {
  const ip = request.ip ?? 'unknown'
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Too many requests' },
    { 
      status: 429,
      headers: { 'Retry-After': '60' }
    }
  )
}
```

Úsalo en tus API routes:

```typescript
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  if (!checkRateLimit(request, 5, 60000)) { // 5 requests por minuto
    return rateLimitResponse()
  }
  
  // Tu lógica...
}
```

### 2. CORS Headers para API

Si necesitas permitir CORS (normalmente no, ya que todo es mismo dominio):

```typescript
// lib/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

---

## 🖼️ Optimización de Imágenes

### 1. Comprimir imágenes existentes

Usa herramientas como:
- https://squoosh.app/ (online)
- https://tinypng.com/ (online)
- `pnpm add -D sharp` (local)

### 2. Servir imágenes en formatos modernos

Las imágenes en Supabase deberían estar:
- En formato WebP o AVIF
- Tamaño máximo 1MB
- Dimensiones apropiadas (no más de 2000px)

### 3. Lazy loading

Next.js ya lo hace por defecto con `<Image>`, pero verifica:

```typescript
import Image from 'next/image'

<Image
  src={flavor.image}
  alt={flavor.name}
  width={400}
  height={400}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..." // opcional
/>
```

---

## 📧 Configuración de Emails

### 1. Dominio personalizado en Resend

Para que los emails no vayan a spam:

1. Ve a https://resend.com/domains
2. Añade tu dominio: `happycheese.com`
3. Configura los registros DNS (SPF, DKIM, DMARC)
4. Verifica el dominio
5. Usa emails como: `pedidos@happycheese.com`

### 2. Templates de Email Profesionales

Considera usar React Email:

```bash
pnpm add @react-email/components
```

Crea templates en `emails/order-confirmation.tsx`:

```typescript
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components'

export function OrderConfirmationEmail({ order }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Section>
            <Text>¡Hola {order.customerName}!</Text>
            <Text>Tu pedido #{order.id} ha sido confirmado.</Text>
            <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/pedido/confirmacion?id=${order.id}`}>
              Ver detalles del pedido
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

---

## 🚀 Performance

### 1. Análisis de bundle

```bash
pnpm add -D @next/bundle-analyzer
```

```javascript
// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
```

Ejecuta: `ANALYZE=true pnpm build`

### 2. Preconnect a dominios externos

En `app/layout.tsx`:

```typescript
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://your-supabase-url.supabase.co" />
  <link rel="dns-prefetch" href="https://js.stripe.com" />
</head>
```

### 3. Loading states y Suspense

Usa loading.tsx en rutas:

```typescript
// app/sabores/loading.tsx
export default function Loading() {
  return <div>Cargando sabores...</div>
}
```

---

## 📱 PWA (Progressive Web App) - Opcional

Para que la app sea instalable en móviles:

```bash
pnpm add next-pwa
```

Configura en `next.config.mjs` y añade `manifest.json`.

---

## 🔍 SEO Local

Para posicionamiento local en Palma:

### 1. Google My Business

- Registra tu negocio
- Añade ubicaciones de tiendas
- Sube fotos
- Responde reseñas

### 2. Schema.org Markup

Añade en tu página:

```typescript
const schemaData = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  "name": "HappyCheese",
  "description": "Tartas de queso artesanales en Palma",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Tu dirección",
    "addressLocality": "Palma",
    "addressRegion": "Baleares",
    "postalCode": "07001",
    "addressCountry": "ES"
  },
  "telephone": "+34-XXX-XXX-XXX",
  "url": process.env.NEXT_PUBLIC_APP_URL
}

// En tu componente:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
/>
```

---

## ✅ Checklist Final

- [ ] `next.config.mjs` optimizado
- [ ] Metadata y SEO configurados
- [ ] Sitemap y robots.txt creados
- [ ] Analytics configurado
- [ ] Error tracking (Sentry) configurado
- [ ] Rate limiting implementado
- [ ] Imágenes optimizadas
- [ ] Emails con dominio propio
- [ ] Performance auditado (Lighthouse)
- [ ] PWA configurado (opcional)
- [ ] Schema.org markup añadido
- [ ] Google My Business creado

---

**Nota**: Implementa estas optimizaciones gradualmente después del deploy inicial. No todas son obligatorias, pero mejorarán significativamente la experiencia.
