# ✅ Checklist de Configuración de Storage

Marca cada paso a medida que lo completes.

---

## 📦 CONFIGURACIÓN EN SUPABASE

### Paso 1: Storage Bucket
- [ ] Ir a https://app.supabase.com
- [ ] Panel izquierdo → **Storage**
- [ ] Click en **"New bucket"**
- [ ] Nombre: `happycheese-images`
- [ ] Marcar **"Public bucket"**: ✅
- [ ] File size limit: `5242880` (5MB)
- [ ] Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, image/gif`
- [ ] Click **"Create bucket"**

### Paso 2: Políticas de Seguridad (RLS)
- [ ] Panel izquierdo → **SQL Editor**
- [ ] Click **"New query"**
- [ ] Copiar contenido de `supabase-storage-policies.sql`
- [ ] Click **"Run"** (Cmd/Ctrl + Enter)
- [ ] Verificar: ✅ Success. No rows returned

### Paso 3: Obtener Claves de API
- [ ] Panel izquierdo → **Settings** → **API**
- [ ] Copiar **Project URL**: `https://____________.supabase.co`
- [ ] Copiar **anon public key**: `eyJhbG...`
- [ ] Copiar **service_role key**: `eyJhbG...` ⚠️ SECRETA

---

## 💻 CONFIGURACIÓN EN TU PROYECTO

### Paso 4: Variables de Entorno
- [ ] Crear/editar archivo `.env.local` en la raíz del proyecto
- [ ] Pegar las 3 variables:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://____________.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
  ```
- [ ] Guardar el archivo
- [ ] Verificar que `.env.local` está en `.gitignore`

### Paso 5: Reiniciar Servidor
- [ ] Detener servidor de desarrollo (Ctrl + C)
- [ ] Ejecutar: `npm run dev`
- [ ] Servidor corriendo en http://localhost:3000

---

## 🧪 TESTING

### Paso 6: Probar Subida de Imágenes
- [ ] Abrir http://localhost:3000/login
- [ ] Iniciar sesión (user: `admin`, pass: `admin123`)
- [ ] Ir a pestaña **"Sabores"**
- [ ] Click en **"Añadir sabor"**
- [ ] Rellenar formulario básico (nombre, descripción)
- [ ] En "Imagen del sabor", arrastrar o seleccionar una imagen JPG/PNG
- [ ] Verificar que aparece el loader: "Subiendo imagen..."
- [ ] Verificar que aparece el preview de la imagen
- [ ] Click en **"Guardar"**
- [ ] Toast de confirmación: ✅ "Sabor añadido correctamente"

### Paso 7: Verificar en Supabase
- [ ] Ir a Supabase Dashboard
- [ ] **Storage** → `happycheese-images` → carpeta `flavors`
- [ ] Ver la imagen subida con nombre tipo: `1710777600000-abc123.jpg`
- [ ] Click en la imagen → **"Get URL"**
- [ ] Copiar la URL pública
- [ ] Pegar en navegador y verificar que se muestra SIN necesidad de login

### Paso 8: Verificar en Frontend
- [ ] Ir a http://localhost:3000 (página principal)
- [ ] Scroll hasta la sección de sabores
- [ ] Verificar que el nuevo sabor aparece con su imagen correctamente

---

## 🐛 TROUBLESHOOTING

Si algo falla, revisa:

### Error "Bucket Not Found"
- [ ] Verificar que el bucket se llama exactamente `happycheese-images`
- [ ] Ir a Storage y confirmar que existe

### Error "403 Forbidden"
- [ ] Ejecutar `supabase-storage-policies.sql` de nuevo
- [ ] Verificar en Storage → Policies que existen las reglas

### Error "401 Unauthorized"
- [ ] Verificar que `.env.local` existe
- [ ] Verificar que `SUPABASE_SERVICE_ROLE_KEY` está correcta
- [ ] Reiniciar servidor: detener y `npm run dev`

### Imágenes No Cargan en Frontend
- [ ] Verificar que el bucket es **público** (no privado)
- [ ] Copiar URL de imagen de Supabase y abrirla en navegador
- [ ] Si pide autenticación, el bucket NO es público → recrearlo

### "Request Entity Too Large"
- [ ] La imagen pesa más de 5MB
- [ ] Comprimir la imagen o reducir calidad
- [ ] Prueba con una imagen más pequeña

---

## 📊 ESTADO FINAL ESPERADO

```
SUPABASE:
✅ Bucket 'happycheese-images' creado (público)
✅ Carpeta 'flavors/' con imágenes
✅ 4 políticas RLS configuradas (SELECT, INSERT, UPDATE, DELETE)
✅ URLs públicas accesibles sin autenticación

PROYECTO:
✅ .env.local con 3 variables configuradas
✅ Servidor corriendo sin errores
✅ Panel admin permite subir imágenes
✅ Preview funciona
✅ Loader se muestra durante subida
✅ Frontend muestra imágenes correctamente

URLS GENERADAS:
✅ Formato: https://xxx.supabase.co/storage/v1/object/public/happycheese-images/flavors/123456789-abc.jpg
✅ Accesibles públicamente
✅ Guardadas en campo 'flavors.image' de la BD
```

---

## ⏱️ TIEMPO ESTIMADO TOTAL

- ✅ Configuración básica: **10-15 minutos**
- ✅ Testing completo: **5 minutos**
- ✅ Troubleshooting (si aplica): **5-10 minutos**

**Total: 20-30 minutos máximo**

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

Si necesitas más detalles:

- **QUICK_START_STORAGE.md** → Guía paso a paso detallada
- **SUPABASE_STORAGE_SETUP.md** → Análisis técnico completo
- **STORAGE_IMPROVEMENTS.md** → Mejoras opcionales avanzadas
- **supabase-storage-policies.sql** → Script SQL de políticas

---

## ✨ ¡LISTO!

Una vez que todos los checkboxes estén marcados, tu sistema de subida de imágenes estará 100% funcional. 🎉

Si tienes dudas, revisa los archivos de documentación o los logs de la consola del servidor y del navegador.
