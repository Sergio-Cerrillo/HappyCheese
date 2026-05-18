# Migración a Supabase - HappyCheese

## Descripción

Se ha migrado el sistema de almacenamiento de archivos JSON a Supabase. El schema `happycheese` contiene todas las tablas necesarias para la aplicación.

## Configuración

### 1. Variables de Entorno

Asegúrate de tener el archivo `.env.local` con las credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 2. Crear el Schema y Tablas

Ve a tu proyecto de Supabase → SQL Editor y ejecuta el contenido del archivo `supabase-schema.sql`.

Esto creará:
- El schema `happycheese`
- Las tablas: `stores`, `flavors`, `orders`, `admins`, `sessions`
- Índices para mejor rendimiento
- Políticas de seguridad (RLS)

### 3. Poblar con Datos Iniciales

Ejecuta el contenido del archivo `supabase-seed.sql` en el SQL Editor de Supabase.

Esto insertará:
- 2 tiendas (Santa Catalina y Centro Histórico)
- 8 sabores de cheesecake
- 1 usuario admin (username: admin, password: admin123)

**IMPORTANTE**: Cambia la contraseña del admin en producción y usa un sistema de hash seguro (bcrypt).

## Estructura de Datos

### Stores
```typescript
{
  id: string
  name: string
  address: string
  phone: string
  hours: string
  coordinates: { lat: number, lng: number }
  active: boolean
  createdAt: string
  updatedAt: string
}
```

### Flavors
```typescript
{
  id: string
  name: string
  description: string
  prices: {
    individual: number
    doble: number
    mediana: number
    grande: number
  }
  image: string
  active: boolean
  availability: Array<{
    storeId: string
    portions: ('individual' | 'doble' | 'mediana' | 'grande')[]
  }>
  createdAt: string
  updatedAt: string
}
```

### Orders
```typescript
{
  id: string
  items: OrderItem[]
  storeId: string
  storeName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes?: string
  total: number
  status: 'pendiente' | 'confirmado' | 'completado' | 'cancelado'
  pickupDate: string
  pickupTime: string
  createdAt: string
  updatedAt: string
}
```

### Admins
```typescript
{
  id: string
  username: string
  passwordHash: string
  createdAt: string
}
```

### Sessions
```typescript
{
  id: string
  adminId: string
  expiresAt: string
}
```

## Archivos Modificados

- `lib/supabase.ts` - Cliente de Supabase configurado con el schema `happycheese`
- `lib/db.ts` - Funciones de base de datos actualizadas para usar Supabase
- `components/sections/flavors.tsx` - Actualizado para usar la API
- `components/sections/stores.tsx` - Actualizado para usar la API

## Archivos Obsoletos

- `lib/store.ts` - Ya no se usa (mantenido para referencia)
- `data/*.json` - Archivos JSON ya no necesarios

## APIs Disponibles

- `GET /api/stores` - Obtener todas las tiendas
- `GET /api/flavors` - Obtener todos los sabores
- `GET /api/orders` - Obtener todas las órdenes
- `POST /api/orders` - Crear una nueva orden
- Rutas de autenticación en `/api/auth/*`

## Acceso al Schema en el Código

```typescript
import { db } from './lib/supabase'

// Ejemplo para obtener todas las tiendas
const { data, error } = await db
  .from('stores')
  .select('*')
```

## Próximos Pasos

1. ✅ Ejecutar `supabase-schema.sql` en Supabase
2. ✅ Ejecutar `supabase-seed.sql` en Supabase
3. ✅ Verificar que las variables de entorno estén configuradas
4. 🔄 Probar la aplicación localmente
5. 🔄 Verificar que las APIs funcionen correctamente
6. 🔄 Desplegar en producción

## Notas Importantes

- El schema `happycheese` debe existir en tu proyecto de Supabase
- Las políticas RLS están habilitadas pero son básicas, ajústalas según tus necesidades de seguridad
- El usuario admin por defecto tiene contraseña sin hash - implementa bcrypt en producción
- Los campos JSON (coordinates, prices, availability, items) se manejan como JSONB para mejor rendimiento
