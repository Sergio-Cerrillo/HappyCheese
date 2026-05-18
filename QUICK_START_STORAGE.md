# ⚡ Guía Rápida: Configurar Subida de Imágenes en Supabase

## 🎯 Resumen
Tu código de subida de imágenes está **100% funcional**, pero **faltan configuraciones en Supabase**. 
Solo tienes las tablas de base de datos creadas, pero no el sistema de Storage para archivos.

---

## ✅ Checklist de Configuración (15 minutos)

### Paso 1: Crear el Bucket de Storage

1. Abre tu proyecto en [Supabase](https://app.supabase.com)
2. Panel izquierdo → **Storage**
3. Click en botón **"New bucket"**
4. Configuración:
   ```
   ┌─────────────────────────────────────────┐
   │ Bucket name: happycheese-images         │
   │ Public bucket: ✅ ON                    │
   │ File size limit: 5242880 (5MB)          │
   │ Allowed MIME types:                     │
   │   image/jpeg, image/jpg,                │
   │   image/png, image/webp, image/gif      │
   └─────────────────────────────────────────┘
   ```
5. Click **"Create bucket"**

---

### Paso 2: Configurar Políticas de Seguridad

1. En Supabase, ve a **Storage** → click en `happycheese-images` → pestaña **"Policies"**
2. Ve a **SQL Editor** (panel izquierdo)
3. Click **"New query"**
4. Copia y pega el contenido del archivo `supabase-storage-policies.sql`
5. Click **"Run"** (o `Cmd/Ctrl + Enter`)
6. Deberías ver: ✅ Success. No rows returned

---

### Paso 3: Obtener tus Claves de API

1. En Supabase, ve a **Settings** → **API**
2. Copia las siguientes claves:

```
Project URL:     https://xxxxxxxxxx.supabase.co
anon public:     eyJhbG...  (clave larga)
service_role:    eyJhbG...  (clave larga) ⚠️ SECRETA
```

---

### Paso 4: Configurar Variables de Entorno

1. En tu proyecto, crea/edita el archivo `.env.local`
2. Pega lo siguiente (con TUS claves):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...TU_SERVICE_ROLE_KEY
```

3. ⚠️ **IMPORTANTE:** 
   - El archivo `.env.local` **NO debe subirse a GitHub**
   - Ya está en `.gitignore` por defecto en Next.js
   - NUNCA compartas tu `SUPABASE_SERVICE_ROLE_KEY`

---

### Paso 5: Reiniciar el Servidor de Desarrollo

```bash
# Detener el servidor actual (Ctrl + C)
# Reiniciar para cargar las nuevas variables de entorno
npm run dev
```

---

### Paso 6: Probar la Subida de Imágenes

1. Ve a `http://localhost:3000/login`
2. Inicia sesión como admin (usuario: `admin`, password: `admin123`)
3. Ve a la pestaña **"Sabores"**
4. Click en **"Añadir sabor"** o edita uno existente
5. En **"Imagen del sabor"**, arrastra o selecciona una imagen
6. Deberías ver:
   - ⏳ "Subiendo imagen..."
   - ✅ Preview de la imagen
   - URL generada: `https://xxx.supabase.co/storage/v1/object/public/happycheese-images/flavors/...`

7. Guarda el sabor
8. Ve a la página principal y verifica que la imagen se muestre correctamente

---

## 🔍 Verificar que Todo Funciona

### En Supabase Dashboard:

1. **Storage** → `happycheese-images` → carpeta `flavors`
2. Deberías ver tu imagen subida
3. Click en la imagen → botón **"Get URL"**
4. Copia y pega la URL en una nueva pestaña del navegador
5. La imagen debería mostrarse sin necesidad de autenticación

### En tu Aplicación:

1. Página principal: las imágenes de sabores se muestran
2. Panel admin: puedes subir nuevas imágenes
3. Preview funciona antes de subir
4. Loader se muestra durante la subida

---

## 🐛 Solución de Problemas

### Error: "Bucket not found"
**Causa:** No creaste el bucket o lo nombraste diferente  
**Solución:** Verifica que existe un bucket llamado exactamente `happycheese-images`

### Error: "403 Forbidden" al subir
**Causa:** Políticas de RLS no configuradas correctamente  
**Solución:** Ejecuta `supabase-storage-policies.sql` en SQL Editor

### Error: "401 Unauthorized"
**Causa:** Variable `SUPABASE_SERVICE_ROLE_KEY` incorrecta o faltante  
**Solución:** 
- Verifica que está en `.env.local`
- Copia la clave correcta desde Settings > API
- Reinicia `npm run dev`

### Las imágenes no cargan en el frontend
**Causa:** El bucket no es público  
**Solución:** 
- Ve a Storage → `happycheese-images`
- Verifica que diga "Public" (no "Private")
- Si es privado, elimínalo y créalo de nuevo marcando "Public bucket: ON"

### "Request Entity Too Large"
**Causa:** La imagen pesa más de 5MB  
**Solución:** Comprime la imagen antes de subirla

---

## 📂 Estructura Final

```
Supabase Storage:
happycheese-images/          ← Bucket público
└── flavors/                 ← Carpeta para imágenes de sabores
    ├── 1710777600000-abc123.jpg
    ├── 1710777601000-def456.png
    └── ...

Base de Datos (schema happycheese):
├── stores          ✅ Ya creada
├── flavors         ✅ Ya creada (campo 'image' guarda la URL)
├── orders          ✅ Ya creada
├── admins          ✅ Ya creada
└── sessions        ✅ Ya creada
```

---

## 🎨 URLs que se Generan

Cuando subes una imagen, el sistema genera una URL como:

```
https://xxxxx.supabase.co/storage/v1/object/public/happycheese-images/flavors/1710777600000-abc123.jpg
```

**Desglose:**
- `xxxxx.supabase.co` → Tu proyecto
- `/storage/v1/object/public` → Endpoint público de Storage
- `/happycheese-images` → Tu bucket
- `/flavors/` → Carpeta dentro del bucket
- `1710777600000-abc123.jpg` → Nombre único generado

Esta URL se guarda en el campo `flavors.image` de tu base de datos.

---

## ⏱️ Tiempo Estimado por Paso

- ✅ Paso 1 (Crear bucket): 2 minutos
- ✅ Paso 2 (Configurar políticas): 3 minutos
- ✅ Paso 3 (Obtener claves): 1 minuto
- ✅ Paso 4 (Variables de entorno): 2 minutos
- ✅ Paso 5 (Reiniciar servidor): 30 segundos
- ✅ Paso 6 (Probar): 5 minutos

**Total: ~15 minutos**

---

## 📋 ¿Qué hace el Código Actual?

Tu implementación actual es **muy buena** y ya incluye:

✅ Validación de tipo de archivo (solo imágenes)  
✅ Validación de tamaño (máx 5MB)  
✅ Generación de nombres únicos (evita colisiones)  
✅ Creación automática del bucket si no existe  
✅ Preview local antes de subir  
✅ Loading state durante subida  
✅ Drag & drop de archivos  
✅ Botón para eliminar imagen  
✅ Uso correcto de Service Role Key (seguro)

---

## 🚀 Mejoras Futuras (Opcional)

Una vez que funcione todo, puedes considerar:

1. **Comprimir imágenes automáticamente** (librería `sharp`)
2. **Eliminar imágenes antiguas** al actualizar un sabor
3. **Barra de progreso** durante la subida
4. **Validaciones adicionales** (dimensiones mínimas/máximas)
5. **Convertir todo a WebP** para mejor rendimiento

---

## 💡 TL;DR

**Problema:** Solo tienes tablas en Supabase, falta configurar Storage  
**Solución:** 6 pasos en 15 minutos  

1. Crear bucket `happycheese-images` (público, 5MB max)
2. Ejecutar `supabase-storage-policies.sql` 
3. Copiar claves de API desde Settings
4. Pegarlas en `.env.local`
5. Reiniciar servidor
6. Probar subida desde panel admin

**Resultado:** Sistema de imágenes 100% funcional ✨

---

**¿Dudas?** Revisa `SUPABASE_STORAGE_SETUP.md` para análisis técnico detallado.
