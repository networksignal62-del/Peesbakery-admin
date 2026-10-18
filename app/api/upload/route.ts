import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext, isSameOriginPost } from '@/lib/server/admin-auth'

export const runtime = 'nodejs'

const MAX_FILES = 5
const MAX_FILE_BYTES = 5 * 1024 * 1024
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function matchesImageSignature(bytes: Uint8Array, type: string) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
  if (type === 'image/webp') {
    const header = Buffer.from(bytes)
    return header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP'
  }
  return false
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  }

  const admin = await getAdminContext(['super_admin', 'admin', 'manager'])
  if (!admin) {
    return NextResponse.json({ error: 'You are not authorized to upload product images.' }, { status: 403 })
  }

  const formData = await request.formData().catch(() => null)
  const files = formData?.getAll('images') ?? []
  if (files.length < 1 || files.length > MAX_FILES || files.some(file => !(file instanceof File))) {
    return NextResponse.json({ error: `Choose 1 to ${MAX_FILES} images.` }, { status: 400 })
  }

  const uploadedPaths: string[] = []
  const urls: string[] = []
  try {
    const validated: { bytes: Uint8Array; type: string; extension: string }[] = []
    for (const file of files as File[]) {
      const extension = TYPES[file.type]
      if (!extension || file.size < 1 || file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'Use JPG, PNG, or WebP images under 5 MB each.' }, { status: 400 })
      }

      const bytes = new Uint8Array(await file.arrayBuffer())
      if (!matchesImageSignature(bytes, file.type)) {
        return NextResponse.json({ error: 'One of the files is not a valid image.' }, { status: 400 })
      }
      validated.push({ bytes, type: file.type, extension })
    }
    for (const { bytes, type, extension } of validated) {
      const path = `products/${randomUUID()}.${extension}`
      const { error } = await admin.service.storage.from('images').upload(path, bytes, {
        contentType: type,
        upsert: false,
      })
      if (error) throw error
      uploadedPaths.push(path)
      urls.push(admin.service.storage.from('images').getPublicUrl(path).data.publicUrl)
    }
    return NextResponse.json({ urls }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    if (uploadedPaths.length) await admin.service.storage.from('images').remove(uploadedPaths)
    return NextResponse.json({ error: 'Image upload failed. Please try again.' }, { status: 500 })
  }
}
