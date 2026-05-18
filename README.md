# HappyCheese - Sistema Completo de Pedidos de Tartas

## 📋 Descripción

Sistema completo de gestión de pedidos para HappyCheese, una tienda de tartas de queso artesanales en Palma de Mallorca. Incluye una web pública informativa, sistema de pedidos con validaciones avanzadas, y panel de administración completo.

## ✨ Funcionalidades Implementadas

### Parte Pública
- ✅ Web principal con diseño profesional y responsive
- ✅ Secciones: Hero, Historia, Sabores, Tiendas, CTA
- ✅ Botón de acceso admin en el header
- ✅ Flujo completo de pedido con 4 pasos:
  1. Selección de tienda
  2. Selección de sabores y porciones
  3. Datos del cliente y fecha/hora de recogida
  4. Confirmación del pedido
- ✅ Sistema de porciones: Individual, Doble, Mediana, Grande
- ✅ Validación de fecha de recogida: mínimo 48 horas, máximo 1 año
- ✅ Página de confirmación con detalles del pedido

### Panel de Administración
- ✅ Sistema de autenticación con login/logout
- ✅ Rutas protegidas con middleware
- ✅ Dashboard con estadísticas:
  - Número de tiendas activas
  - Sabores disponibles
  - Total de pedidos
  - Ingresos totales
- ✅ Gestión completa de Tiendas (CRUD):
  - Crear, editar y eliminar tiendas
  - Activar/desactivar tiendas
  - Datos: nombre, dirección, teléfono, horario
- ✅ Gestión completa de Sabores (CRUD):
  - Crear, editar y eliminar sabores
  - Configurar precios por porción
  - Configurar disponibilidad por tienda y porción
  - Activar/desactivar sabores
  - Cada sabor con: título, descripción, imagen, precios
- ✅ Registro de Pedidos:
  - Listado completo de pedidos
  - Filtrado y visualización detallada
  - Cambio de estado: pendiente, confirmado, completado, cancelado
  - Información de cliente, productos y recogida

### Backend & Persistencia
- ✅ API REST implementada con Next.js App Router
- ✅ Endpoints:
  - `/api/auth/login` - Login admin
  - `/api/auth/logout` - Logout admin
  - `/api/auth/session` - Verificar sesión
  - `/api/stores` - CRUD tiendas
  - `/api/flavors` - CRUD sabores
  - `/api/orders` - Crear y listar pedidos
- ✅ Base de datos persistente (file-based JSON)
- ✅ Validaciones en frontend y backend
- ✅ Manejo de errores consistente
- ✅ Estados de carga y respuestas

### Validaciones y Lógica de Negocio
- ✅ Los sabores solo aparecen si están activos
- ✅ Las porciones solo aparecen si están configuradas para esa tienda
- ✅ Los sabores solo aparecen en las tiendas donde están disponibles
- ✅ Fecha de recogida validada servidor y cliente (48h - 1 año)
- ✅ Campos requeridos validados
- ✅ Precios calculados dinámicamente según porción

## 🚀 Instalación y Uso

### Requisitos
- Node.js 18 o superior
- npm o pnpm

### Instalación
```bash
# Instalar dependencias
npm install
# o
pnpm install
```

### Desarrollo
```bash
npm run dev
# o
pnpm dev
```

El servidor se iniciará en [http://localhost:3000](http://localhost:3000)

### Producción
```bash
npm run build
npm start
```

## 🔐 Acceso Administrativo

Para acceder al panel de administración:

1. Haz clic en "Admin" en el header
2. Usa estas credenciales de prueba:
   - **Usuario**: `admin`
   - **Contraseña**: `admin123`

**⚠️ IMPORTANTE**: En producción, cambiar estas credenciales y usar encriptación bcrypt para las contraseñas.

## 📂 Estructura del Proyecto

```
/app
  /api
    /auth          # Endpoints de autenticación
    /stores        # Endpoints de tiendas
    /flavors       # Endpoints de sabores
    /orders        # Endpoints de pedidos
  /admin           # Panel de administración
  /login           # Página de login
  /pedido          # Flujo de pedido cliente
/components
  /order           # Componentes de pedido
  /sections        # Secciones de la web principal
  /ui              # Componentes UI reutilizables
/lib
  db.ts            # Lógica de base de datos
  types.ts         # Tipos TypeScript
  date-utils.ts    # Utilidades de fecha
  utils.ts         # Utilidades generales
/data              # Base de datos (JSON files)
  stores.json      # Datos de tiendas
  flavors.json     # Datos de sabores
  orders.json      # Datos de pedidos
  admins.json      # Datos de admins
  sessions.json    # Sesiones activas
```

## 🎨 Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes UI**: Radix UI + shadcn/ui
- **Validación**: Zod + React Hook Form
- **Notificaciones**: Sonner
- **Iconos**: Lucide React
- **Fechas**: date-fns

## 🔧 Configuración de Sabores

Los sabores se configuran con:

1. **Información básica**: nombre, descripción, imagen
2. **Precios por porción**: individual, doble, mediana, grande
3. **Disponibilidad por tienda**: seleccionar en qué tiendas está disponible
4. **Porciones por tienda**: seleccionar qué porciones están disponibles en cada tienda
5. **Estado**: activo/inactivo

Ejemplo: El sabor "Matcha" puede estar disponible en "Centro Histórico" solo en porciones Individual y Mediana, pero no en "Santa Catalina".

## 📅 Validación de Fechas

El sistema implementa validación estricta de fechas de recogida:

- **Mínimo**: 48 horas desde el momento actual
- **Máximo**: 1 año desde el momento actual
- Validación en frontend (DatePicker) y backend (API)
- Cálculos en servidor para evitar inconsistencias de zona horaria

## 🗄️ Base de Datos

El sistema usa una base de datos file-based con JSON para simplicidad. En producción se recomienda migrar a:

- PostgreSQL con Prisma
- MongoDB con Mongoose
- Supabase
- Firebase

Los archivos JSON se guardan en el directorio `/data` (excluido de Git).

## 🔒 Seguridad

Implementado:
- ✅ Middleware de autenticación
- ✅ Rutas protegidas
- ✅ Validación de sesiones
- ✅ Validaciones frontend y backend

Pendiente para producción:
- ⚠️ Encriptación de contraseñas con bcrypt
- ⚠️ Variables de entorno para secretos
- ⚠️ Rate limiting en APIs
- ⚠️ CSRF protection
- ⚠️ Sanitización de inputs

## 📝 Datos Iniciales

El sistema viene con datos de ejemplo:
- 2 tiendas (Santa Catalina, Centro Histórico)
- 8 sabores diferentes con precios y disponibilidad
- 1 usuario admin (admin/admin123)

## 🎯 Criterios de Aceptación Completados

- ✅ Existe botón de login en la web principal
- ✅ El login correcto redirige a `/admin`
- ✅ `/admin` está protegido con middleware
- ✅ En admin se pueden gestionar tiendas (CRUD completo)
- ✅ En admin se pueden gestionar sabores (CRUD completo)
- ✅ En admin se puede configurar disponibilidad por tienda y porción
- ✅ El cliente solo ve sabores/porciones configurados por el admin
- ✅ Cada sabor muestra título, descripción e imagen
- ✅ El cliente puede hacer un pedido seleccionando tienda, sabor, porción y fecha/hora
- ✅ No se permite recogida antes de 48h ni después de 1 año
- ✅ Los pedidos se guardan en base de datos
- ✅ En admin se ve el registro de pedidos con toda la información
- ✅ Toda la implementación está integrada y es consistente

## 🚀 Próximos Pasos (Opcional)

Para llevar el proyecto a producción:

1. Implementar base de datos real (PostgreSQL/MongoDB)
2. Añadir encriptación de contraseñas
3. Implementar envío de emails de confirmación
4. Añadir sistema de roles (super admin, manager tienda, etc.)
5. Implementar filtros avanzados en pedidos
6. Añadir estadísticas y gráficos en dashboard
7. Implementar sistema de notificaciones push
8. Añadir generación de PDF de pedidos
9. Implementar sistema de inventario
10. Añadir pasarela de pago real (Stripe/PayPal)

## 📞 Soporte

Para cualquier duda o problema, contactar con el equipo de desarrollo.

---

Desarrollado con ❤️ para HappyCheese
