import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import clsx from 'clsx'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useSite } from '../../lib/site'
import { Button, TextArea, TextInput } from '../../components/ui'
import { PageHero } from './About'

export default function Contact() {
  const [params] = useSearchParams()
  const { data } = useSite()
  const s = data?.site
  const [type, setType] = useState<'contact' | 'prayer'>(params.get('type') === 'prayer' ? 'prayer' : 'contact')
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', website: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({}); setError('')
    try {
      const r = await api.post<{ message: string }>('/public/contact', { ...form, type })
      setDone(r.message)
    } catch (err) {
      setErrors(fieldErrors(err)); setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHero title="Contact us" text="Questions, prayer requests, or just want to say hello — we'd love to hear from you." />
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4 text-ink-700">
          {s?.address && <p className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brass-600" aria-hidden />{s.address}</p>}
          {s?.phone && <p className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-brass-600" aria-hidden /><a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a></p>}
          {s?.email && <p className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-brass-600" aria-hidden /><a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a></p>}
          {s?.mapUrl && <a href={s.mapUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium underline underline-offset-4">Open in Maps</a>}
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-6 sm:p-8">
          {done ? <p className="rounded-lg bg-emerald-50 p-4 text-emerald-800">{done}</p> : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="inline-flex rounded-lg bg-ink-50 p-1" role="radiogroup" aria-label="Message type">
                {(['contact', 'prayer'] as const).map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)}
                    className={clsx('rounded-md px-4 py-1.5 text-sm font-medium', type === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}>
                    {t === 'contact' ? 'General message' : 'Prayer request'}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoComplete="name" />
                <TextInput label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} autoComplete="tel" />
              </div>
              <TextInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" />
              {type === 'contact' && <TextInput label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />}
              <TextArea label={type === 'prayer' ? 'How can we pray for you?' : 'Message'} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message}
                hint={type === 'prayer' ? 'Only the pastoral team sees prayer requests.' : undefined} />
              <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
              {error && !Object.keys(errors).length && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" loading={busy}>{type === 'prayer' ? 'Send prayer request' : 'Send message'}</Button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
