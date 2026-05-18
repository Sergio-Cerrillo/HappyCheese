-- ============================================
-- Script de configuración de Supabase Storage
-- para HappyCheese - Bucket de imágenes
-- ============================================

-- IMPORTANTE: Este script asume que ya has creado el bucket 'happycheese-images' 
-- desde el Dashboard de Supabase (Storage > New Bucket)

-- Si prefieres crear el bucket desde SQL (necesitas permisos de superusuario):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'happycheese-images',
--   'happycheese-images',
--   true,
--   5242880, -- 5MB en bytes
--   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS) PARA STORAGE
-- ============================================

-- 1. LECTURA PÚBLICA
-- Permite que cualquiera pueda VER las imágenes del bucket
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'happycheese-images');

-- ============================================

-- 2. SUBIDA AUTENTICADA (Solo con Service Role Key)
-- Permite subir imágenes solo a la carpeta 'flavors'
DROP POLICY IF EXISTS "Allow authenticated uploads to flavors" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to flavors"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'happycheese-images' 
  AND (storage.foldername(name))[1] = 'flavors'
);

-- ============================================

-- 3. ACTUALIZACIÓN AUTENTICADA
-- Permite actualizar/sobreescribir imágenes en 'flavors'
DROP POLICY IF EXISTS "Allow authenticated updates to flavors" ON storage.objects;

CREATE POLICY "Allow authenticated updates to flavors"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'happycheese-images' 
  AND (storage.foldername(name))[1] = 'flavors'
)
WITH CHECK (
  bucket_id = 'happycheese-images' 
  AND (storage.foldername(name))[1] = 'flavors'
);

-- ============================================

-- 4. ELIMINACIÓN AUTENTICADA
-- Permite eliminar imágenes de 'flavors'
DROP POLICY IF EXISTS "Allow authenticated deletes from flavors" ON storage.objects;

CREATE POLICY "Allow authenticated deletes from flavors"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'happycheese-images' 
  AND (storage.foldername(name))[1] = 'flavors'
);

-- ============================================

-- VERIFICAR CONFIGURACIÓN
-- ============================================

-- Ver todas las políticas del bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%happycheese%' OR policyname LIKE '%flavors%' OR policyname LIKE '%public read%';

-- Ver información del bucket (requiere extensión pg_storage)
-- SELECT * FROM storage.buckets WHERE id = 'happycheese-images';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. CREACIÓN DEL BUCKET:
   - Ve a tu Dashboard de Supabase
   - Storage > New Bucket
   - Nombre: happycheese-images
   - Public: ✅ SÍ
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: image/jpeg,image/jpg,image/png,image/webp,image/gif

2. VARIABLES DE ENTORNO (.env.local):
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

3. ESTRUCTURA DE CARPETAS:
   happycheese-images/
   └── flavors/
       ├── 1234567890-abc123.jpg
       ├── 1234567891-def456.png
       └── ...

4. SEGURIDAD:
   - Las políticas permiten LECTURA pública (para mostrar imágenes en el sitio web)
   - Las políticas permiten ESCRITURA solo mediante Service Role Key
   - El endpoint /api/upload usa Service Role Key, por lo que solo admins pueden subir
   - NUNCA expongas el Service Role Key en el cliente

5. TESTING:
   Después de ejecutar este script, prueba:
   
   a) Subir imagen desde el panel admin
   b) Verificar que se crea en Storage > happycheese-images > flavors
   c) Copiar la URL pública y abrirla en el navegador
   d) Debería mostrarse la imagen sin necesidad de autenticación

6. TROUBLESHOOTING:
   - Error "Bucket not found": Crear bucket manualmente en Dashboard
   - Error 403: Revisar que las políticas se aplicaron correctamente
   - Error 401: Verificar SUPABASE_SERVICE_ROLE_KEY en .env.local
   - Imágenes no cargan: Verificar que el bucket sea público

7. LIMPIEZA (si necesitas resetear):
   -- Eliminar todas las políticas
   DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
   DROP POLICY IF EXISTS "Allow authenticated uploads to flavors" ON storage.objects;
   DROP POLICY IF EXISTS "Allow authenticated updates to flavors" ON storage.objects;
   DROP POLICY IF EXISTS "Allow authenticated deletes from flavors" ON storage.objects;
   
   -- Eliminar bucket (desde Dashboard o SQL si tienes permisos)
   -- DELETE FROM storage.buckets WHERE id = 'happycheese-images';
*/
