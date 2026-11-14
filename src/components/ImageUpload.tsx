import { useId, useRef, useState, type DragEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImagePlus, Link2, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { api, errorMessage } from '../lib/api'
import { cld } from '../lib/cloudinary'

type Kind = 'site' | 'event' | 'member' | 'profile'
interface Signature { uploadUrl: string; apiKey: string; params: Record<string, string | number>; signature: string; maxBytes: number }

/** Sends one file straight to Cloudinary with a server-made signature; reports progress. */
async function uploadToCloudinary(file: File, kind: Kind, onProgress: (pct: number) => void): Promise<string> {
  const sig = await api.post<Signature>('/uploads/signature', { kind })
  if (file.size > sig.maxBytes) throw new Error(`That image is too large. The limit is ${Math.round(sig.maxBytes / 1048576)} MB.`)
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', sig.apiKey)
  form.append('signature', sig.signature)
  for (const [k, v] of Object.entries(sig.params)) form.append(k, String(v))
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', sig.uploadUrl)
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      let body: { secure_url?: string; error?: { message?: string } } = {}
      try { body = JSON.parse(xhr.responseText) } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) resolve(body.secure_url)
      else reject(new Error(body.error?.message ? `Upload failed: ${body.error.message}` : 'Upload failed. Please try again.'))
    }
    xhr.onerror = () => reject(new Error('Upload failed. Check your internet connection and try again.'))
    xhr.send(form)
  })
}

/**
 * An image field: upload to Cloudinary (button or drag-and-drop), see a preview, replace or remove.
 * If uploads aren't set up on the server, it falls back to pasting a link.
 */
export default function ImageUpload({ label, value, onChange, kind, shape = 'wide', hint, className }: {
  label: string; value: string; onChange: (url: string) => void; kind: Kind
  shape?: 'wide' | 'square' | 'round'; hint?: string; className?: string
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const status = useQuery({ queryKey: ['upload-status'], queryFn: () => api.get<{ enabled: boolean; maxMb: number }>('/uploads/status'), staleTime: 5 * 60_000 })
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [pasting, setPasting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const enabled = status.data?.enabled
  const showLink = pasting || status.data?.enabled === false

  async function handle(file?: File | null) {
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Choose an image file (JPG, PNG, WebP or GIF).'); return }
    setBusy(true); setProgress(0)
    try { onChange(await uploadToCloudinary(file, kind, setProgress)) } catch (e) { setError(e instanceof Error ? e.message : errorMessage(e)) } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); if (enabled && !busy) handle(e.dataTransfer.files?.[0]) }

  const box = shape === 'wide' ? 'aspect-[16/9] w-full max-w-sm' : shape === 'round' ? 'h-24 w-24 rounded-full' : 'h-28 w-28'
  return (
    <div className={className}>
      <span className="label" id={`${id}-label`}>{label}</span>
      <div className={clsx('flex gap-3', shape === 'wide' ? 'flex-col' : 'flex-wrap items-start gap-4')}>
        <div
          onDragOver={(e) => { e.preventDefault(); if (enabled) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={clsx('relative flex shrink-0 items-center justify-center overflow-hidden border bg-ink-50', shape === 'round' ? '' : 'rounded-lg', box,
            dragging ? 'border-ink-600 ring-2 ring-ink-200' : value ? 'border-ink-100' : 'border-dashed border-ink-200')}>
          {value ? <img src={cld(value, shape === 'wide' ? 'w_800' : 'w_300') || value} alt="" className={clsx('h-full w-full', shape === 'wide' ? 'object-cover' : 'object-contain bg-white')} />
            : <ImagePlus className="h-7 w-7 text-ink-300" aria-hidden />}
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 text-sm font-medium text-ink-700" role="status">
              <Loader2 className="mb-1 h-5 w-5 animate-spin" aria-hidden />{progress < 100 ? `${progress}%` : 'Finishing…'}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input ref={input} type="file" accept="image/*" className="sr-only" id={id} aria-labelledby={`${id}-label`} onChange={(e) => handle(e.target.files?.[0])} disabled={!enabled || busy} />
          {enabled && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => input.current?.click()} disabled={busy}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50">
                {value ? <RefreshCw className="h-4 w-4" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}{value ? 'Replace' : 'Upload image'}
              </button>
              {value && (
                <button type="button" onClick={() => onChange('')} disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" aria-hidden />Remove
                </button>
              )}
              {!pasting && (
                <button type="button" onClick={() => setPasting(true)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm text-ink-500 hover:text-ink-800">
                  <Link2 className="h-4 w-4" aria-hidden />Use a link instead
                </button>
              )}
            </div>
          )}
          {showLink && (
            <input className="input" type="url" placeholder="https://…" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} link`} />
          )}
          {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : (
            <p className="text-xs text-ink-400">
              {status.data?.enabled === false ? 'Uploads aren’t set up on the server yet, so paste a link to an image.' : hint || `JPG, PNG, WebP or GIF, up to ${status.data?.maxMb ?? 10} MB. You can also drag a photo onto the box.`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
