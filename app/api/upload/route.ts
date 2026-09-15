import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Usar service role key para operaciones de storage
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const BUCKET_NAME = 'happycheese-images'
const CACHE_CONTROL = '31536000'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

async function uploadImage(path: string, buffer: Buffer, contentType: string) {
  return supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType,
      cacheControl: CACHE_CONTROL,
      upsert: false
    })
}

async function createOptimizedVariants(buffer: Buffer) {
  const { default: sharp } = await import('sharp')
  const base = sharp(buffer, { failOn: 'none' }).rotate()

  const fullBuffer = await base
    .clone()
    .resize({
      width: 1600,
      height: 1200,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 82 })
    .toBuffer()

  const thumbBuffer = await base
    .clone()
    .resize({
      width: 640,
      height: 640,
      fit: 'cover',
      withoutEnlargement: true
    })
    .webp({ quality: 76 })
    .toBuffer()

  return { fullBuffer, thumbBuffer }
}

function getUploadExtension(contentType: string) {
  switch (contentType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/gif':
      return 'gif'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}

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
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'La imagen no debe superar los 5MB' },
        { status: 400 }
      )
    }

    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2)}`

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let fullBuffer = buffer
    let thumbBuffer: Buffer | null = null
    let fullContentType = file.type
    let thumbContentType: string | null = null
    let fileName = `${fileId}.${getUploadExtension(file.type)}`
    let thumbName: string | null = null

    try {
      const optimized = await createOptimizedVariants(buffer)
      fullBuffer = optimized.fullBuffer
      thumbBuffer = optimized.thumbBuffer
      fullContentType = 'image/webp'
      thumbContentType = 'image/webp'
      fileName = `${fileId}.webp`
      thumbName = fileName
    } catch (error) {
      console.error('Image optimization error:', error)
    }

    // Generar nombre único para imagen y miniatura optimizada, si existe
    const filePath = `flavors/${fileName}`
    const thumbPath = thumbName ? `flavors/thumbs/${thumbName}` : null

    // Subir a Supabase Storage
    const { data, error } = await uploadImage(filePath, fullBuffer, fullContentType)

    if (error) {
      console.error('Supabase storage error:', error)
      
      // Si el bucket no existe, intentar crearlo
      if (error.message.includes('not found')) {
        const { error: bucketError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_IMAGE_SIZE,
        })

        if (bucketError) {
          console.error('Error creating bucket:', bucketError)
          return NextResponse.json(
            { error: 'Error configurando almacenamiento' },
            { status: 500 }
          )
        }

        // Reintentar upload
        const { data: retryData, error: retryError } = await uploadImage(filePath, fullBuffer, fullContentType)

        if (retryError) {
          return NextResponse.json(
            { error: 'Error al subir imagen' },
            { status: 500 }
          )
        }

        let retryThumbPath: string | null = null
        if (thumbPath && thumbBuffer && thumbContentType) {
          const { data: retryThumbData, error: retryThumbError } = await uploadImage(thumbPath, thumbBuffer, thumbContentType)

          if (retryThumbError) {
            return NextResponse.json(
              { error: 'Error al subir miniatura' },
              { status: 500 }
            )
          }

          retryThumbPath = retryThumbData.path
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(retryData.path)

        if (!retryThumbPath) {
          return NextResponse.json({ url: urlData.publicUrl })
        }

        const { data: thumbUrlData } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(retryThumbPath)

        return NextResponse.json({ url: urlData.publicUrl, thumbUrl: thumbUrlData.publicUrl })
      }

      return NextResponse.json(
        { error: 'Error al subir imagen' },
        { status: 500 }
      )
    }

    if (!thumbPath || !thumbBuffer || !thumbContentType) {
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

      return NextResponse.json({ url: urlData.publicUrl })
    }

    const { data: thumbData, error: thumbError } = await uploadImage(thumbPath, thumbBuffer, thumbContentType)

    if (thumbError) {
      console.error('Supabase thumbnail upload error:', thumbError)
      return NextResponse.json(
        { error: 'Error al subir miniatura' },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)
    const { data: thumbUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(thumbData.path)

    return NextResponse.json({ url: urlData.publicUrl, thumbUrl: thumbUrlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    )
  }
}
