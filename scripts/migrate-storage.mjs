import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.migrate.local' })

const requiredEnv = [
  'OLD_SUPABASE_URL',
  'OLD_SUPABASE_SERVICE_ROLE_KEY',
  'NEW_SUPABASE_URL',
  'NEW_SUPABASE_SERVICE_ROLE_KEY',
]

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`)
    process.exit(1)
  }
}

const bucket = process.env.SUPABASE_BUCKET || 'happycheese-images'
const prefix = (process.env.SUPABASE_BUCKET_PREFIX || '').replace(/^\/+|\/+$/g, '')

const oldClient = createClient(
  process.env.OLD_SUPABASE_URL,
  process.env.OLD_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const newClient = createClient(
  process.env.NEW_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function listAllFiles(client, currentPrefix) {
  const files = []
  const pageSize = 100
  let offset = 0

  while (true) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(currentPrefix, {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (error) {
      throw new Error(`Could not list "${currentPrefix || '/'}": ${error.message}`)
    }

    const rows = data || []

    for (const row of rows) {
      const path = currentPrefix ? `${currentPrefix}/${row.name}` : row.name

      if (!row.id && !row.metadata) {
        const nested = await listAllFiles(client, path)
        files.push(...nested)
      } else {
        files.push({
          path,
          name: row.name,
          size: row.metadata?.size ?? row.metadata?.contentLength ?? null,
          mimetype: row.metadata?.mimetype ?? 'application/octet-stream',
        })
      }
    }

    if (rows.length < pageSize) break
    offset += pageSize
  }

  return files
}

async function targetExistsWithSameSize(path, size) {
  const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
  const name = path.includes('/') ? path.slice(path.lastIndexOf('/') + 1) : path

  const { data, error } = await newClient.storage
    .from(bucket)
    .list(folder, { search: name, limit: 100 })

  if (error) return false

  const match = (data || []).find((file) => file.name === name)
  if (!match) return false
  if (size == null) return true

  const targetSize = match.metadata?.size ?? match.metadata?.contentLength ?? null
  return Number(targetSize) === Number(size)
}

async function copyFile(file) {
  const { data: blob, error: downloadError } = await oldClient.storage
    .from(bucket)
    .download(file.path)

  if (downloadError) {
    throw new Error(`download failed: ${downloadError.message}`)
  }

  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await newClient.storage
    .from(bucket)
    .upload(file.path, buffer, {
      contentType: file.mimetype || blob.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`upload failed: ${uploadError.message}`)
  }
}

async function main() {
  console.log(`Bucket: ${bucket}`)
  console.log(`Prefix: ${prefix || '(root)'}`)

  const { data: newBuckets, error: bucketsError } = await newClient.storage.listBuckets()
  if (bucketsError) {
    throw new Error(`Could not list destination buckets: ${bucketsError.message}`)
  }

  if (!newBuckets?.some((item) => item.id === bucket)) {
    throw new Error(`Destination bucket "${bucket}" does not exist`)
  }

  const files = await listAllFiles(oldClient, prefix)
  console.log(`Found ${files.length} source files`)

  let copied = 0
  let skipped = 0
  let failed = 0

  for (const [index, file] of files.entries()) {
    const label = `[${index + 1}/${files.length}] ${file.path}`

    try {
      if (await targetExistsWithSameSize(file.path, file.size)) {
        skipped += 1
        console.log(`${label} - skipped`)
        continue
      }

      await copyFile(file)
      copied += 1
      console.log(`${label} - copied`)
    } catch (error) {
      failed += 1
      console.error(`${label} - error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log('')
  console.log('Migration summary')
  console.log(`Copied: ${copied}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Failed: ${failed}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
