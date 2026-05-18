# Notas de Producción - HappyCheese

## ⚠️ Seguridad Crítica

### Antes de desplegar a producción, DEBES implementar:

1. **Encriptación de Contraseñas**
   ```typescript
   // Instalar bcrypt
   npm install bcrypt
   npm install -D @types/bcrypt
   
   // En lib/db.ts o similar
   import bcrypt from 'bcrypt'
   
   // Al crear usuario
   const passwordHash = await bcrypt.hash(password, 10)
   
   // Al verificar login
   const match = await bcrypt.compare(password, admin.passwordHash)
   ```

2. **Variables de Entorno**
   - Crear archivo `.env.local` basado en `.env.example`
   - NUNCA commitear archivos .env
   - Usar variables para secretos, claves API, etc.

3. **Session Secrets**
   ```typescript
   // Generar secreto seguro
   openssl rand -base64 32
   
   // Usar en middleware de sesiones
   const SESSION_SECRET = process.env.SESSION_SECRET
   ```

4. **HTTPS Obligatorio**
   - Configurar SSL/TLS en producción
   - Forzar redirección de HTTP a HTTPS
   - Configurar cookies con `secure: true`

5. **Rate Limiting**
   ```typescript
   // Instalar
   npm install express-rate-limit
   
   // Límite en API routes
   import rateLimit from 'express-rate-limit'
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutos
     max: 100 // límite por IP
   })
   ```

6. **CORS y CSP**
   ```typescript
   // next.config.mjs
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/:path*',
           headers: [
             {
               key: 'X-Frame-Options',
               value: 'DENY'
             },
             {
               key: 'X-Content-Type-Options',
               value: 'nosniff'
             },
             {
               key: 'Referrer-Policy',
               value: 'origin-when-cross-origin'
             }
           ]
         }
       ]
     }
   }
   ```

## 🗄️ Migración de Base de Datos

### Opción 1: PostgreSQL con Prisma

1. **Instalación**
   ```bash
   npm install prisma @prisma/client
   npm install -D prisma
   ```

2. **Inicialización**
   ```bash
   npx prisma init
   ```

3. **Schema Prisma** (prisma/schema.prisma)
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   generator client {
     provider = "prisma-client-js"
   }
   
   model Store {
     id          String   @id @default(cuid())
     name        String
     address     String
     phone       String
     hours       String
     active      Boolean  @default(true)
     latitude    Float
     longitude   Float
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     
     flavors     FlavorAvailability[]
     orders      Order[]
   }
   
   model Flavor {
     id            String   @id @default(cuid())
     name          String
     description   String   @db.Text
     image         String
     active        Boolean  @default(true)
     priceIndiv    Float
     priceDoble    Float
     priceMediana  Float
     priceGrande   Float
     createdAt     DateTime @default(now())
     updatedAt     DateTime @updatedAt
     
     availability  FlavorAvailability[]
     orderItems    OrderItem[]
   }
   
   model FlavorAvailability {
     id              String   @id @default(cuid())
     flavorId        String
     storeId         String
     portions        String[] // ['individual', 'doble', etc]
     
     flavor          Flavor   @relation(fields: [flavorId], references: [id])
     store           Store    @relation(fields: [storeId], references: [id])
     
     @@unique([flavorId, storeId])
   }
   
   model Order {
     id              String   @id @default(cuid())
     storeId         String
     storeName       String
     customerName    String
     customerEmail   String
     customerPhone   String
     notes           String?  @db.Text
     total           Float
     status          String   @default("pendiente")
     pickupDate      String
     pickupTime      String
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
     
     store           Store      @relation(fields: [storeId], references: [id])
     items           OrderItem[]
   }
   
   model OrderItem {
     id          String  @id @default(cuid())
     orderId     String
     flavorId    String
     flavorName  String
     portion     String
     quantity    Int
     price       Float
     
     order       Order   @relation(fields: [orderId], references: [id])
     flavor      Flavor  @relation(fields: [flavorId], references: [id])
   }
   
   model Admin {
     id           String   @id @default(cuid())
     username     String   @unique
     passwordHash String
     createdAt    DateTime @default(now())
     
     sessions     Session[]
   }
   
   model Session {
     id        String   @id @default(cuid())
     adminId   String
     expiresAt DateTime
     
     admin     Admin    @relation(fields: [adminId], references: [id])
   }
   ```

4. **Migración**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Uso en código**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   
   const prisma = new PrismaClient()
   
   // Ejemplo: obtener sabores
   const flavors = await prisma.flavor.findMany({
     where: { active: true },
     include: { availability: true }
   })
   ```

### Opción 2: Supabase (más simple)

1. **Crear proyecto en Supabase.com**

2. **Configurar tablas**
   - Usar el editor SQL de Supabase
   - Crear tablas basadas en el schema de Prisma

3. **Instalar cliente**
   ```bash
   npm install @supabase/supabase-js
   ```

4. **Configurar**
   ```typescript
   // lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   
   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```

## 📧 Sistema de Emails

### Con Resend (Recomendado para Next.js)

1. **Instalación**
   ```bash
   npm install resend
   ```

2. **Configuración**
   ```typescript
   // lib/email.ts
   import { Resend } from 'resend'
   
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   export async function sendOrderConfirmation(order: Order) {
     await resend.emails.send({
       from: 'HappyCheese <pedidos@happycheese.com>',
       to: order.customerEmail,
       subject: `Pedido confirmado - ${order.id}`,
       html: `
         <h1>¡Gracias por tu pedido!</h1>
         <p>Tu pedido ${order.id} ha sido confirmado.</p>
         <p>Detalles del pedido...</p>
       `
     })
   }
   ```

## 💳 Pasarela de Pago

### Con Stripe

1. **Instalación**
   ```bash
   npm install stripe @stripe/stripe-js
   ```

2. **API Route**
   ```typescript
   // app/api/checkout/route.ts
   import Stripe from 'stripe'
   
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
     apiVersion: '2023-10-16'
   })
   
   export async function POST(request: Request) {
     const { items, amount } = await request.json()
     
     const paymentIntent = await stripe.paymentIntents.create({
       amount: amount * 100, // en centavos
       currency: 'eur',
       automatic_payment_methods: {
         enabled: true
       }
     })
     
     return Response.json({ clientSecret: paymentIntent.client_secret })
   }
   ```

## 📊 Monitoreo y Logging

### Con Sentry

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0
})
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Push a GitHub
2. Conectar con Vercel
3. Configurar variables de entorno
4. Deploy automático

### Alternativas
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 📝 Checklist de Producción

- [ ] Cambiar credenciales de admin por defecto
- [ ] Implementar bcrypt para contraseñas
- [ ] Configurar variables de entorno
- [ ] Migrar a base de datos real
- [ ] Implementar envío de emails
- [ ] Añadir rate limiting
- [ ] Configurar HTTPS
- [ ] Implementar monitoring/logging
- [ ] Configurar backups de base de datos
- [ ] Implementar pasarela de pago (si aplica)
- [ ] Añadir analytics (Google Analytics, Plausible, etc.)
- [ ] Configurar dominio personalizado
- [ ] Optimizar imágenes (Next Image, Cloudinary)
- [ ] Implementar CDN
- [ ] Configurar error pages personalizadas
- [ ] Testing E2E con Playwright/Cypress
- [ ] Documentar API con Swagger/OpenAPI
- [ ] Implementar sistema de roles más granular

## 🔄 Mantenimiento

### Backups
- Base de datos: diario
- Archivos subidos: semanal
- Código: GitHub

### Actualizaciones
- Dependencies: mensual
- Next.js: cada major release
- Security patches: inmediato

### Monitoreo
- Uptime monitoring
- Error tracking
- Performance metrics
- User analytics

---

**Nota**: Este archivo contiene guías esenciales para llevar HappyCheese a producción de forma segura y profesional.
