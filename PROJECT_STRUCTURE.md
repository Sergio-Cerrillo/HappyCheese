# 📁 Estructura del Proyecto - HappyCheese

## Vista General

```
HappyCheese/
├── 📱 app/                          # Next.js App Router
│   ├── page.tsx                     # Página principal (usa FlavorsByStore)
│   ├── layout.tsx                   # Layout principal
│   ├── globals.css                  # Estilos globales + animaciones
│   │
│   ├── admin/                       # Panel de Administración
│   │   ├── page.tsx                 # ✨ REFACTORIZADO (150 líneas)
│   │   ├── page.backup.tsx          # 💾 Backup del original (1064 líneas)
│   │   └── layout.tsx               # Layout del admin
│   │
│   ├── login/                       # Login de admin
│   │   └── page.tsx
│   │
│   ├── pedido/                      # Flujo de pedidos
│   │   ├── page.tsx                 # Formulario de pedido
│   │   └── confirmacion/
│   │       ├── page.tsx             # Confirmación
│   │       └── loading.tsx          # Loading state
│   │
│   └── api/                         # API Routes
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── session/route.ts
│       ├── stores/route.ts
│       ├── flavors/route.ts
│       ├── orders/route.ts
│       ├── upload/route.ts          # Upload de imágenes
│       └── test-supabase/route.ts
│
├── 🎨 components/                   # Componentes React
│   ├── header.tsx
│   ├── footer.tsx
│   ├── theme-provider.tsx
│   │
│   ├── admin/                       # ✨ COMPONENTES ADMIN (NUEVOS)
│   │   ├── AdminStats.tsx           # Estadísticas dashboard
│   │   ├── OrderCard.tsx            # Card de pedido
│   │   ├── FlavorCard.tsx           # Card de sabor
│   │   ├── StoreCard.tsx            # Card de tienda
│   │   ├── OrdersTab.tsx            # Tab completo de pedidos
│   │   ├── FlavorsTab.tsx           # Tab completo de sabores
│   │   ├── StoresTab.tsx            # Tab completo de tiendas
│   │   ├── FlavorDialog.tsx         # Diálogo crear/editar sabor
│   │   ├── StoreDialog.tsx          # Diálogo crear/editar tienda
│   │   └── availability-manager.tsx # Gestor de disponibilidad
│   │
│   ├── order/
│   │   └── order-form.tsx           # Formulario de pedidos
│   │
│   ├── sections/                    # Secciones de la web
│   │   ├── hero.tsx
│   │   ├── about.tsx
│   │   ├── flavors.tsx              # ⚠️ DEPRECADO (usar flavors-by-store)
│   │   ├── flavors-by-store.tsx     # ✨ NUEVO: Sabores por tienda
│   │   ├── flavor-carousel.tsx      # ✨ NUEVO: Carrusel de sabores
│   │   ├── stores.tsx
│   │   └── cta.tsx
│   │
│   └── ui/                          # Componentes UI base (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── image-upload.tsx         # Upload con drag & drop
│       ├── ...                      # 40+ componentes UI
│       └── use-toast.ts
│
├── 🔧 hooks/                        # ✨ CUSTOM HOOKS (NUEVOS)
│   ├── use-admin-data.ts            # Hook para cargar datos admin
│   ├── use-stores-manager.ts        # Hook CRUD tiendas
│   ├── use-flavors-manager.ts       # Hook CRUD sabores
│   ├── use-orders-manager.ts        # Hook gestión pedidos
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── 📚 lib/                          # Utilidades y lógica
│   ├── supabase.ts                  # Cliente Supabase
│   ├── db.ts                        # Funciones de base de datos
│   ├── types.ts                     # TypeScript types
│   ├── utils.ts                     # Utilidades generales
│   ├── date-utils.ts
│   └── store.ts                     # ⚠️ DEPRECADO (datos mock)
│
├── 🗄️ data/                         # ⚠️ DEPRECADO (archivos JSON eliminados)
│   ├── admins.json
│   ├── flavors.json
│   ├── orders.json
│   ├── sessions.json
│   └── stores.json
│
├── 🖼️ public/
│   └── images/                      # Imágenes estáticas
│       ├── clasica.jpg
│       ├── frutos-rojos.jpg
│       └── ...
│
├── 🗃️ SQL Scripts                   # Scripts de Supabase
│   ├── supabase-schema.sql          # Schema de BD
│   ├── supabase-seed.sql            # Datos iniciales
│   ├── supabase-verify-setup.sql    # Permisos
│   └── supabase-disable-rls.sql     # Dev helper
│
├── 📝 Documentación
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── PRODUCTION.md
│   ├── MIGRATION_COMPLETE.md
│   ├── SUPABASE_MIGRATION.md
│   └── REFACTORING_SUMMARY.md       # ✨ Este documento
│
└── ⚙️ Configuración
    ├── next.config.mjs
    ├── tsconfig.json
    ├── components.json
    ├── postcss.config.mjs
    ├── package.json
    ├── pnpm-lock.yaml
    ├── middleware.ts
    ├── next-env.d.ts
    └── .env.local                   # Credenciales Supabase
```

## 🎯 Flujos de Datos

### Admin Panel

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Page (150 líneas)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼────────────┐
                │           │            │
┌───────────────▼────┐ ┌────▼─────┐ ┌───▼──────────┐
│ useAdminData()     │ │ useStores│ │ useFlavors   │
│ - Carga inicial    │ │ Manager  │ │ Manager      │
│ - Stores           │ │ - CRUD   │ │ - CRUD       │
│ - Flavors          │ │          │ │              │
│ - Orders           │ └────┬─────┘ └───┬──────────┘
└────────────────────┘      │           │
                            │           │
                ┌───────────┴───────────┴────────────┐
                │                                    │
        ┌───────▼────────┐                  ┌────────▼─────────┐
        │  StoresTab     │                  │  FlavorsTab      │
        │  - StoreCard   │                  │  - FlavorCard    │
        │  - StoreDialog │                  │  - FlavorDialog  │
        └────────────────┘                  └──────────────────┘
```

### Frontend - Carrusel de Sabores

```
┌─────────────────────────────────────────────────────────────┐
│                      HomePage (page.tsx)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼────────────┐
                │           │            │
        ┌───────▼───────┐   │   ┌────────▼────────┐
        │  HeroSection  │   │   │  AboutSection   │
        └───────────────┘   │   └─────────────────┘
                            │
                ┌───────────▼────────────┐
                │  FlavorsByStore        │
                └───────────┬────────────┘
                            │
                ┌───────────┴────────────┐
                │                        │
    ┌───────────▼────────────┐  ┌───────▼──────────────┐
    │ FlavorCarousel         │  │ FlavorCarousel       │
    │ - Store: Santa Catalina│  │ - Store: Centro Hist.│
    │ - Filters flavors      │  │ - Filters flavors    │
    │ - Background dinámico  │  │ - Background dinámico│
    └────────────────────────┘  └──────────────────────┘
```

### API Flow

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Component   │─────▶│  API Route   │─────▶│  Supabase    │
│              │      │              │      │              │
│  - Frontend  │      │ /api/stores  │      │  Schema:     │
│  - Admin     │      │ /api/flavors │      │  happycheese │
│              │      │ /api/orders  │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             │ uses
                             ▼
                      ┌──────────────┐
                      │  lib/db.ts   │
                      │              │
                      │ - getStores  │
                      │ - getFlavors │
                      │ - createOrder│
                      └──────────────┘
```

## 📦 Componentes por Funcionalidad

### 🏪 Admin - Gestión de Tiendas
```
StoresTab.tsx
  └─ StoreCard.tsx (x N)
  └─ StoreDialog.tsx (create/edit)
       └─ Input, Switch, Label, Button
```

### 🍰 Admin - Gestión de Sabores
```
FlavorsTab.tsx
  └─ FlavorCard.tsx (x N)
       └─ AvailabilityDisplay.tsx
  └─ FlavorDialog.tsx (create/edit)
       └─ ImageUpload.tsx
       └─ AvailabilityEditor.tsx
       └─ Input, Textarea, Switch
```

### 📦 Admin - Gestión de Pedidos
```
OrdersTab.tsx
  └─ OrderCard.tsx (x N)
       └─ Select (status)
       └─ Badge (status indicators)
```

### 🎨 Frontend - Sabores por Tienda
```
FlavorsByStore.tsx
  ├─ FlavorCarousel (Santa Catalina)
  │    └─ Card (featured image)
  │    └─ Navigation buttons
  │    └─ Dots indicator
  │
  └─ FlavorCarousel (Centro Histórico)
       └─ Card (featured image)
       └─ Navigation buttons
       └─ Dots indicator
```

## 🔄 Estado y Gestión de Datos

### Hooks de Estado
```typescript
// Global data loading
useAdminData()
  ├─ stores: Store[]
  ├─ flavors: Flavor[]
  ├─ orders: Order[]
  └─ refetch()

// CRUD operations
useStoresManager(stores)
  ├─ addStore()
  ├─ updateStore()
  └─ deleteStore()

useFlavorsManager(flavors)
  ├─ addFlavor()
  ├─ updateFlavor()
  └─ deleteFlavor()

useOrdersManager(orders)
  └─ updateOrderStatus()
```

### Flujo de Actualización
```
1. Usuario interactúa (click botón)
2. Hook manager hace API call
3. API route procesa request
4. Supabase actualiza BD
5. Response vuelve a hook
6. Hook actualiza estado local
7. React re-renderiza UI
```

## 🎯 Arquitectura de Componentes

### Patrón Container/Presentational

**Container Components** (con lógica)
- `FlavorsTab.tsx`
- `StoresTab.tsx`
- `OrdersTab.tsx`
- `FlavorsByStore.tsx`

**Presentational Components** (solo UI)
- `FlavorCard.tsx`
- `StoreCard.tsx`
- `OrderCard.tsx`
- `FlavorCarousel.tsx`
- `AdminStats.tsx`

**Dialog Components** (forms)
- `FlavorDialog.tsx`
- `StoreDialog.tsx`

## 📊 Métricas de Calidad

### Complejidad Ciclomática
- **AdminPage**: Reducida de ~50 a ~5
- **Componentes**: Todos < 10

### Acoplamiento
- **Antes**: Alto (todo en un archivo)
- **Después**: Bajo (componentes independientes)

### Cohesión
- **Antes**: Baja (responsabilidades mezcladas)
- **Después**: Alta (cada componente una responsabilidad)

### Testabilidad
- **Antes**: Difícil (componente gigante)
- **Después**: Fácil (componentes aislados)

## 🚀 Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm tsc --noEmit

# Ver estructura de archivos
tree -I 'node_modules|.next'
```

## 📚 Referencias de Código

### Importar Hook de Admin Data
```typescript
import { useAdminData } from '@/hooks/use-admin-data'
```

### Usar Manager Hook
```typescript
import { useFlavorsManager } from '@/hooks/use-flavors-manager'

function MyComponent() {
  const { flavors, addFlavor, updateFlavor } = useFlavorsManager()
  // ...
}
```

### Usar Componente de Carrusel
```typescript
import { FlavorCarousel } from '@/components/sections/flavor-carousel'

<FlavorCarousel
  flavors={flavors}
  storeName="Santa Catalina"
  storeId="santa-catalina"
/>
```

---

**Esta estructura está diseñada para ser:**
- ✅ Mantenible a largo plazo
- ✅ Escalable con nuevas features
- ✅ Testeable de forma aislada
- ✅ Siguiendo best practices de React/Next.js
- ✅ Aplicando principios SOLID
