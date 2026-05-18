/**
 * Script de diagnóstico para verificar conexión con Supabase Storage
 * 
 * Ejecutar: npx tsx scripts/test-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔍 Diagnóstico de Supabase Storage\n')
console.log('Configuration:')
console.log(`URL: ${supabaseUrl}`)
console.log(`Service Key: ${supabaseServiceKey.substring(0, 20)}...\n`)

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testStorage() {
  try {
    // Test 1: Listar buckets
    console.log('📦 Test 1: Verificando buckets...')
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error al listar buckets:', bucketsError)
      return
    }
    
    console.log(`✅ Buckets encontrados: ${buckets.length}`)
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id} (${bucket.public ? 'PÚBLICO' : 'PRIVADO'})`)
    })
    
    // Test 2: Verificar bucket happycheese-images
    console.log('\n📁 Test 2: Verificando bucket "happycheese-images"...')
    const targetBucket = buckets.find(b => b.id === 'happycheese-images')
    
    if (!targetBucket) {
      console.error('❌ Bucket "happycheese-images" NO EXISTE')
      console.log('\n💡 Solución: Crear el bucket desde Supabase Dashboard:')
      console.log('   1. Ve a Storage > New Bucket')
      console.log('   2. Name: happycheese-images')
      console.log('   3. Public: ON')
      console.log('   4. File size limit: 5242880')
      return
    }
    
    console.log('✅ Bucket encontrado')
    console.log(`   - ID: ${targetBucket.id}`)
    console.log(`   - Público: ${targetBucket.public ? 'SÍ ✅' : 'NO ❌'}`)
    console.log(`   - Tamaño máx: ${targetBucket.file_size_limit ? `${targetBucket.file_size_limit} bytes` : 'Sin límite'}`)
    
    if (!targetBucket.public) {
      console.log('\n⚠️  PROBLEMA: El bucket NO es público')
      console.log('💡 Solución: Elimina el bucket y créalo de nuevo marcando "Public: ON"')
      return
    }
    
    // Test 3: Listar archivos en flavors
    console.log('\n📸 Test 3: Listando archivos en carpeta "flavors"...')
    const { data: files, error: filesError } = await supabaseAdmin.storage
      .from('happycheese-images')
      .list('flavors')
    
    if (filesError) {
      console.error('❌ Error al listar archivos:', filesError)
    } else {
      console.log(`✅ Archivos encontrados: ${files.length}`)
      if (files.length > 0) {
        files.forEach(file => {
          console.log(`   - ${file.name}`)
        })
      }
    }
    
    // Test 4: Intentar subir un archivo de prueba
    console.log('\n📤 Test 4: Intentando subir archivo de prueba...')
    const testBuffer = Buffer.from('HELLO WORLD - TEST IMAGE')
    const testFileName = `test-${Date.now()}.txt`
    const testPath = `flavors/${testFileName}`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('happycheese-images')
      .upload(testPath, testBuffer, {
        contentType: 'text/plain',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Error al subir archivo de prueba:', uploadError)
      console.log('\nDetalle del error:')
      console.log(JSON.stringify(uploadError, null, 2))
      return
    }
    
    console.log('✅ Archivo subido correctamente')
    console.log(`   Path: ${uploadData.path}`)
    
    // Test 5: Obtener URL pública
    console.log('\n🔗 Test 5: Obteniendo URL pública...')
    const { data: urlData } = supabaseAdmin.storage
      .from('happycheese-images')
      .getPublicUrl(uploadData.path)
    
    console.log('✅ URL generada:')
    console.log(`   ${urlData.publicUrl}`)
    
    // Test 6: Intentar acceder a la URL
    console.log('\n🌐 Test 6: Verificando acceso público...')
    const response = await fetch(urlData.publicUrl)
    if (response.ok) {
      const text = await response.text()
      console.log('✅ URL accesible públicamente')
      console.log(`   Contenido: ${text}`)
    } else {
      console.error(`❌ URL no accesible: ${response.status} ${response.statusText}`)
      console.log('💡 Esto indica que el bucket NO es público o las políticas RLS están mal')
    }
    
    // Test 7: Eliminar archivo de prueba
    console.log('\n🗑️  Test 7: Limpiando archivo de prueba...')
    const { error: deleteError } = await supabaseAdmin.storage
      .from('happycheese-images')
      .remove([testPath])
    
    if (deleteError) {
      console.error('❌ Error al eliminar:', deleteError)
    } else {
      console.log('✅ Archivo de prueba eliminado')
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✨ DIAGNÓSTICO COMPLETADO')
    console.log('='.repeat(50))
    console.log('\nSi todos los tests pasaron, tu Storage está configurado correctamente.')
    console.log('Si algún test falló, sigue las soluciones indicadas arriba.\n')
    
  } catch (error) {
    console.error('\n💥 Error inesperado:', error)
  }
}

testStorage()
