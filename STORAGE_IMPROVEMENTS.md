# 🔧 Mejoras Opcionales al Sistema de Imágenes

Este archivo contiene mejoras opcionales que puedes implementar una vez que el sistema básico funcione.

---

## 1. Mejor Manejo de Errores en ImageUpload

**Archivo:** `components/ui/image-upload.tsx`

### Cambios:

```tsx
"use client"

import { useState, useCallback, useRef } from 'react'
import { Upload, X, ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from './button'
import { Alert, AlertDescription } from './alert'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
  disabled?: boolean
}

export function ImageUpload({ value, onChange, className, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null) // NUEVO
  const [uploadProgress, setUploadProgress] = useState(0) // NUEVO
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [])

  const uploadToSupabase = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    setUploadProgress(10)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    setUploadProgress(90)

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Error al subir imagen')
    }

    const data = await response.json()
    setUploadProgress(100)
    return data.url
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))

    if (!imageFile) {
      setError('Por favor, arrastra un archivo de imagen')
      return
    }

    await processFile(imageFile)
  }, [disabled, isUploading])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setIsUploading(true)
    setError(null) // IMPORTANTE: Limpiar errores previos
    setUploadProgress(0)

    try {
      // VALIDACIONES PREVIAS
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('La imagen no debe superar los 5MB')
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Solo se permiten archivos JPG, PNG, WebP o GIF')
      }

      // Crear preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Subir a Supabase
      const url = await uploadToSupabase(file)
      onChange(url)
      
    } catch (error) {
      console.error('Error uploading image:', error)
      setPreview(null)
      setError(error instanceof Error ? error.message : 'Error al subir imagen')
      
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* MOSTRAR ERRORES */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview ? (
        <div className="relative group">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-border">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={cn(
            "relative w-full aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer",
            "hover:border-primary hover:bg-accent/50",
            isDragging && "border-primary bg-accent/50 scale-[1.02]",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed",
            error && "border-destructive",
            "flex flex-col items-center justify-center gap-2 text-center p-6"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Subiendo imagen... {uploadProgress}%
              </p>
              {/* Barra de progreso */}
              <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Arrastra una imagen o haz click para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP o GIF (máx. 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 2. Endpoint para Eliminar Imágenes

**Archivo:** `app/api/upload/route.ts`

### Agregar al final del archivo:

```typescript
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path requerido' },
        { status: 400 }
      )
    }

    // Validar que la ruta esté dentro de flavors
    if (!path.startsWith('flavors/')) {
      return NextResponse.json(
        { error: 'Ruta inválida' },
        { status: 400 }
      )
    }

    // Eliminar de Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from('happycheese-images')
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Error al eliminar imagen' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar imagen' },
      { status: 500 }
    )
  }
}
```

---

## 3. Eliminar Imágenes Antiguas al Actualizar Sabor

**Archivo:** `hooks/use-flavors-manager.ts`

### Modificar la función `updateFlavor`:

```typescript
const updateFlavor = useCallback(async (flavor: Flavor): Promise<boolean> => {
  try {
    // Encontrar el sabor actual para comparar imágenes
    const oldFlavor = flavors.find(f => f.id === flavor.id)
    
    // Si cambió la imagen Y la anterior era de Supabase, eliminarla
    if (oldFlavor?.image && 
        oldFlavor.image !== flavor.image && 
        oldFlavor.image.includes('supabase.co/storage')) {
      
      try {
        // Extraer el path de la URL
        const urlParts = oldFlavor.image.split('/')
        const pathIndex = urlParts.findIndex(part => part === 'flavors')
        if (pathIndex !== -1) {
          const path = urlParts.slice(pathIndex).join('/')
          
          // Eliminar la imagen antigua
          await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
            method: 'DELETE'
          })
          
          console.log('Imagen antigua eliminada:', path)
        }
      } catch (deleteError) {
        console.error('Error eliminando imagen antigua:', deleteError)
        // No fallar la actualización si no se puede eliminar la imagen
      }
    }

    // Actualizar el sabor normalmente
    const res = await fetch('/api/flavors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flavor)
    })

    if (res.ok) {
      const updated = await res.json()
      setFlavors(prev => prev.map(f => f.id === updated.id ? updated : f))
      toast.success('Sabor actualizado')
      return true
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error al actualizar sabor')
      return false
    }
  } catch (error) {
    console.error('Error updating flavor:', error)
    toast.error('Error de conexión')
    return false
  }
}, [flavors])
```

### Modificar la función `deleteFlavor`:

```typescript
const deleteFlavor = useCallback(async (id: string): Promise<boolean> => {
  if (!confirm('¿Seguro que deseas eliminar este sabor?')) return false

  try {
    // Encontrar el sabor para eliminar su imagen
    const flavor = flavors.find(f => f.id === id)
    
    // Eliminar de la base de datos
    const res = await fetch(`/api/flavors?id=${id}`, { method: 'DELETE' })

    if (res.ok) {
      // Si tiene imagen de Supabase, eliminarla
      if (flavor?.image && flavor.image.includes('supabase.co/storage')) {
        try {
          const urlParts = flavor.image.split('/')
          const pathIndex = urlParts.findIndex(part => part === 'flavors')
          if (pathIndex !== -1) {
            const path = urlParts.slice(pathIndex).join('/')
            
            await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
              method: 'DELETE'
            })
            
            console.log('Imagen eliminada:', path)
          }
        } catch (deleteError) {
          console.error('Error eliminando imagen:', deleteError)
        }
      }

      setFlavors(prev => prev.filter(f => f.id !== id))
      toast.success('Sabor eliminado')
      return true
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error al eliminar sabor')
      return false
    }
  } catch (error) {
    console.error('Error deleting flavor:', error)
    toast.error('Error de conexión')
    return false
  }
}, [flavors])
```

---

## 4. Optimización de Imágenes con Sharp

### Instalación:

```bash
npm install sharp
```

### Modificar `app/api/upload/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp' // NUEVO

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      )
    }

    // Validar tamaño (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'La imagen no debe superar los 5MB' },
        { status: 400 }
      )
    }

    // Generar nombre único para el archivo
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp` // CAMBIO: siempre WebP
    const filePath = `flavors/${fileName}`

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // NUEVO: Optimizar imagen con Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 }) // Convertir a WebP
      .toBuffer()

    console.log(`Imagen optimizada: ${file.size} bytes → ${optimizedBuffer.length} bytes`)

    // Subir a Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('happycheese-images')
      .upload(filePath, optimizedBuffer, {
        contentType: 'image/webp', // CAMBIO
        upsert: false
      })

    if (error) {
      console.error('Supabase storage error:', error)
      
      // Si el bucket no existe, intentar crearlo
      if (error.message.includes('not found')) {
        const { error: bucketError } = await supabaseAdmin.storage.createBucket('happycheese-images', {
          public: true,
          fileSizeLimit: maxSize,
        })

        if (bucketError) {
          console.error('Error creating bucket:', bucketError)
          return NextResponse.json(
            { error: 'Error configurando almacenamiento' },
            { status: 500 }
          )
        }

        // Reintentar upload
        const { data: retryData, error: retryError } = await supabaseAdmin.storage
          .from('happycheese-images')
          .upload(filePath, optimizedBuffer, {
            contentType: 'image/webp',
            upsert: false
          })

        if (retryError) {
          return NextResponse.json(
            { error: 'Error al subir imagen' },
            { status: 500 }
          )
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage
          .from('happycheese-images')
          .getPublicUrl(retryData.path)

        return NextResponse.json({ url: urlData.publicUrl })
      }

      return NextResponse.json(
        { error: 'Error al subir imagen' },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('happycheese-images')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    )
  }
}

// ... código DELETE aquí
```

---

## 5. Script de Limpieza de Imágenes Huérfanas

**Archivo:** `scripts/cleanup-orphaned-images.ts`

```typescript
/**
 * Script para eliminar imágenes en Storage que no están referenciadas en la BD
 * 
 * Uso: npx tsx scripts/cleanup-orphaned-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'happycheese' }
})

async function cleanupOrphanedImages() {
  console.log('🔍 Buscando imágenes huérfanas...\n')

  // 1. Obtener todas las imágenes del Storage
  const { data: files, error: storageError } = await supabase.storage
    .from('happycheese-images')
    .list('flavors')

  if (storageError) {
    console.error('Error al listar archivos:', storageError)
    return
  }

  console.log(`📁 Total de imágenes en Storage: ${files.length}`)

  // 2. Obtener todos los sabores de la BD
  const { data: flavors, error: dbError } = await supabase
    .schema('happycheese')
    .from('flavors')
    .select('image')

  if (dbError) {
    console.error('Error al obtener sabores:', dbError)
    return
  }

  console.log(`📊 Total de sabores en BD: ${flavors.length}\n`)

  // 3. Extraer nombres de archivos de las URLs
  const usedFileNames = new Set(
    flavors
      .map(f => {
        const match = f.image.match(/flavors\/([^?]+)/)
        return match ? match[1] : null
      })
      .filter(Boolean) as string[]
  )

  console.log(`✅ Imágenes en uso: ${usedFileNames.size}`)

  // 4. Encontrar archivos huérfanos
  const orphanedFiles = files.filter(file => !usedFileNames.has(file.name))

  console.log(`🗑️  Imágenes huérfanas: ${orphanedFiles.length}\n`)

  if (orphanedFiles.length === 0) {
    console.log('✨ No hay imágenes para eliminar')
    return
  }

  // 5. Mostrar lista de archivos a eliminar
  console.log('Archivos a eliminar:')
  orphanedFiles.forEach(file => {
    console.log(`  - ${file.name}`)
  })

  // 6. Confirmar eliminación
  console.log('\n⚠️  ¿Deseas eliminar estos archivos? (y/n)')
  
  // En Node.js, usar readline para input
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('', async (answer: string) => {
    if (answer.toLowerCase() === 'y') {
      // Eliminar archivos
      const pathsToDelete = orphanedFiles.map(file => `flavors/${file.name}`)
      
      const { error: deleteError } = await supabase.storage
        .from('happycheese-images')
        .remove(pathsToDelete)

      if (deleteError) {
        console.error('\n❌ Error al eliminar archivos:', deleteError)
      } else {
        console.log(`\n✅ ${orphanedFiles.length} archivos eliminados correctamente`)
      }
    } else {
      console.log('\n🚫 Operación cancelada')
    }

    rl.close()
    process.exit(0)
  })
}

cleanupOrphanedImages()
```

### Configurar en `package.json`:

```json
{
  "scripts": {
    "cleanup:images": "tsx scripts/cleanup-orphaned-images.ts"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "dotenv": "^16.4.0"
  }
}
```

### Uso:

```bash
npm run cleanup:images
```

---

## 📋 Checklist de Implementación

### Básico (Hacer Ahora):
- [ ] Mejorar manejo de errores en ImageUpload
- [ ] Agregar endpoint DELETE para imágenes
- [ ] Implementar eliminación de imágenes antiguas

### Avanzado (Hacer Después):
- [ ] Instalar y configurar Sharp para optimización
- [ ] Crear script de limpieza de imágenes huérfanas
- [ ] Configurar CDN (opcional, para producción)

---

## 🎯 Beneficios de Estas Mejoras

1. **Mejor UX:** Usuarios ven errores claros y barra de progreso
2. **Ahorro de espacio:** Imágenes antiguas se eliminan automáticamente
3. **Mejor rendimiento:** Imágenes optimizadas con Sharp (WebP, compresión)
4. **Mantenimiento:** Script de limpieza previene acumulación de archivos
5. **Validaciones:** Evita archivos corruptos o demasiado grandes

---

**Nota:** Implementa estas mejoras **después** de que el sistema básico funcione correctamente.
