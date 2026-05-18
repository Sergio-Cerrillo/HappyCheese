"use client"

import { useState, useCallback, useRef } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from './button'
import { toast } from 'sonner'

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

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor' }))
      console.error('Upload error details:', errorData)

      // Lanzar error con mensaje específico
      throw new Error(errorData.error || `Error del servidor: ${response.status}`)
    }

    const data = await response.json()

    if (!data.url) {
      throw new Error('El servidor no devolvió una URL válida')
    }

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
      toast.error('Archivo no válido', {
        description: 'Por favor, arrastra un archivo de imagen (JPG, PNG, WebP o GIF)'
      })
      return
    }

    await processFile(imageFile)
  }, [disabled, isUploading])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Archivo no válido', {
        description: 'Por favor, selecciona un archivo de imagen (JPG, PNG, WebP o GIF)'
      })
      return
    }

    await processFile(file)
  }

  const processFile = async (file: File) => {
    setIsUploading(true)

    try {
      // VALIDACIONES PREVIAS (ANTES DE SUBIR)
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      const maxSizeMB = 5
      const maxSizeBytes = maxSizeMB * 1024 * 1024

      console.log(`📁 Validando: ${file.name} (${sizeMB} MB, tipo: ${file.type})`)

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de archivo no válido', {
          description: `Solo se permiten imágenes JPG, PNG, WebP o GIF.\nArchivo seleccionado: ${file.type}`
        })
        setIsUploading(false)
        return
      }

      // Validar tamaño
      if (file.size > maxSizeBytes) {
        toast.error('Imagen demasiado grande', {
          description: `El archivo pesa ${sizeMB} MB. El máximo permitido es ${maxSizeMB} MB.\n\n💡 Comprime la imagen antes de subirla.`
        })
        setIsUploading(false)
        return
      }

      // Si pasa las validaciones, crear preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Subir a Supabase
      const url = await uploadToSupabase(file)
      onChange(url)

      toast.success('Imagen subida correctamente', {
        description: `${file.name} (${sizeMB} MB)`
      })

    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

      toast.error('Error al subir imagen', {
        description: errorMessage
      })

      setPreview(null)

      // Limpiar el input para permitir reintentos
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
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
            "flex flex-col items-center justify-center gap-2 text-center p-6"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                {isDragging ? (
                  <ImageIcon className="h-8 w-8 text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragging ? "Suelta la imagen aquí" : "Arrastra una imagen o haz clic"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF hasta 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
