import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

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

async function uploadImage(path: string, buffer: Buffer) {
  return supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: 'image/webp',
      cacheControl: CACHE_CONTROL,
      upsert: false
    })
}

async function createOptimizedVariants(buffer: Buffer) {
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

    // Generar nombre único para versiones optimizadas
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`
    const filePath = `flavors/${fileName}`
    const thumbPath = `flavors/thumbs/${fileName}`

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let fullBuffer: Buffer
    let thumbBuffer: Buffer

    try {
      const optimized = await createOptimizedVariants(buffer)
      fullBuffer = optimized.fullBuffer
      thumbBuffer = optimized.thumbBuffer
    } catch (error) {
      console.error('Image optimization error:', error)
      return NextResponse.json(
        { error: 'No se pudo optimizar la imagen' },
        { status: 400 }
      )
    }

    // Subir a Supabase Storage
    const { data, error } = await uploadImage(filePath, fullBuffer)

    if (error) {
      console.error('Supabase storage error:', error)
      
      // Si el bucket no existe, intentar crearlo
      if (error.message.includes('not found')) {
        const { error: bucketError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
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
        const { data: retryData, error: retryError } = await uploadImage(filePath, fullBuffer)

        if (retryError) {
          return NextResponse.json(
            { error: 'Error al subir imagen' },
            { status: 500 }
          )
        }

        const { data: retryThumbData, error: retryThumbError } = await uploadImage(thumbPath, thumbBuffer)

        if (retryThumbError) {
          return NextResponse.json(
            { error: 'Error al subir miniatura' },
            { status: 500 }
          )
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(retryData.path)
        const { data: thumbUrlData } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(retryThumbData.path)

        return NextResponse.json({ url: urlData.publicUrl, thumbUrl: thumbUrlData.publicUrl })
      }

      return NextResponse.json(
        { error: 'Error al subir imagen' },
        { status: 500 }
      )
    }

    const { data: thumbData, error: thumbError } = await uploadImage(thumbPath, thumbBuffer)

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
