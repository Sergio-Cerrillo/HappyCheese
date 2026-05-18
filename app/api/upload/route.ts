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
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `flavors/${fileName}`

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir a Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('happycheese-images')
      .upload(filePath, buffer, {
        contentType: file.type,
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
          .upload(filePath, buffer, {
            contentType: file.type,
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
