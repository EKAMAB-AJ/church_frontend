import { cld } from '../../lib/cloudinary'
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { date, time } from '../../lib/format'
import type { ChurchEvent } from '../../lib/types'
import { Button, ErrorNote, Spinner, TextInput } from '../../components/ui'

export default function EventDetail() {
  const { id } = useParams()
  const q = useQuery({ queryKey: ['public-event', id], queryFn: () => api.get<ChurchEvent>(`/public/events/${id}`) })
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({}); setError('')
    try {
      const r = await api.post<{ message: string }>(`/public/events/${id}/register`, form)
      setDone(r.message)
    } catch (err) {
      setErrors(fieldErrors(err)); setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  if (q.isLoading) return <Spinner />
  if (q.error) return <div className="mx-auto max-w-3xl px-5 py-12"><ErrorNote error={q.error} /></div>
  const e = q.data!
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" />All events</Link>
      {e.imageUrl && <img src={cld(e.imageUrl, 'w_1400')} alt="" className="mt-6 aspect-[2/1] w-full rounded-2xl object-cover" />}
      <h1 className="mt-6 font-serif text-4xl font-semibold text-ink-900">{e.title}</h1>
      <div className="mt-4 space-y-1.5 text-ink-600">
        <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brass-600" aria-hidden />{date(e.startAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, {time(e.startAt)}{e.endAt && ` – ${time(e.endAt)}`}</p>
        {e.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brass-600" aria-hidden />{e.location}</p>}
      </div>
      {e.description && <div className="prose-church mt-8 max-w-[68ch]">{e.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}

      {e.registrationOpen && (
        <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="font-serif text-2xl font-semibold text-ink-900">Register</h2>
          {done ? <p className="mt-3 rounded-lg bg-emerald-50 p-4 text-emerald-800">{done}</p> : e.spotsLeft === 0 ? <p className="mt-3 text-ink-600">This event is fully booked.</p> : (
            <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
              <TextInput label="Full name" value={form.name} onChange={(ev) => setForm({ ...form, name: ev.target.value })} error={errors.name} className="sm:col-span-2" required autoComplete="name" />
              <TextInput label="Email" type="email" value={form.email} onChange={(ev) => setForm({ ...form, email: ev.target.value })} error={errors.email} autoComplete="email" />
              <TextInput label="Phone" type="tel" value={form.phone} onChange={(ev) => setForm({ ...form, phone: ev.target.value })} error={errors.phone} autoComplete="tel" />
              {error && !Object.keys(errors).length && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2"><Button loading={busy} type="submit">Register for this event</Button></div>
            </form>
          )}
          {e.spotsLeft != null && e.spotsLeft > 0 && !done && <p className="mt-3 text-sm text-ink-400">{e.spotsLeft} places left</p>}
        </div>
      )}
    </div>
  )
}
