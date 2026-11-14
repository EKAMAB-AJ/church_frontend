import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Globe, MapPin, Plus } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { date, time, toDateTimeInput } from '../../lib/format'
import type { ChurchEvent } from '../../lib/types'
import { useUnits } from '../../components/pickers'
import ImageUpload from '../../components/ImageUpload'
import { Badge, Button, Checkbox, Empty, ErrorNote, Modal, PageHeader, Pagination, SelectInput, Spinner, Tabs, TextArea, TextInput, useToast } from '../../components/ui'

export function EventForm({ event, onClose }: { event?: ChurchEvent; onClose: () => void }) {
  const { can } = useAuth()
  const units = useUnits()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const isAdmin = can('admin')
  const myUnits = isAdmin ? units.data || [] : (units.data || []).filter((u) => u.iLead)
  const [f, setF] = useState({
    title: event?.title || '', description: event?.description || '', startAt: toDateTimeInput(event?.startAt), endAt: toDateTimeInput(event?.endAt),
    location: event?.location || '', imageUrl: event?.imageUrl || '', unit: event?.unit?._id || (isAdmin ? '' : myUnits[0]?._id || ''),
    isPublic: event?.isPublic ?? isAdmin, registrationOpen: event?.registrationOpen ?? false, capacity: event?.capacity ? String(event.capacity) : '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () => {
      const body = { ...f, startAt: f.startAt ? new Date(f.startAt).toISOString() : '', endAt: f.endAt ? new Date(f.endAt).toISOString() : null, unit: f.unit || null, capacity: f.capacity ? Number(f.capacity) : 0 }
      return event ? api.patch<ChurchEvent>(`/events/${event._id}`, body) : api.post<ChurchEvent>('/events', body)
    },
    onSuccess: (e) => { qc.invalidateQueries({ queryKey: ['events'] }); qc.invalidateQueries({ queryKey: ['event', e._id] }); qc.invalidateQueries({ queryKey: ['public-site'] }); toast(event ? 'Event saved' : 'Event created'); onClose(); if (!event) nav(`/app/events/${e._id}`) },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  return (
    <Modal open onClose={onClose} title={event ? 'Edit event' : 'New event'} wide footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save event</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} className="sm:col-span-2" autoFocus />
        <TextInput label="Starts" type="datetime-local" value={f.startAt} onChange={(e) => setF({ ...f, startAt: e.target.value })} error={errors.startAt} />
        <TextInput label="Ends" type="datetime-local" value={f.endAt} onChange={(e) => setF({ ...f, endAt: e.target.value })} error={errors.endAt} />
        <TextInput label="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        <SelectInput label="Who is it for?" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} error={errors.unit}>
          {isAdmin && <option value="">The whole church</option>}{myUnits.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
        </SelectInput>
        <TextArea label="Description" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="sm:col-span-2" />
        <ImageUpload label="Flyer or photo" kind="event" value={f.imageUrl} onChange={(url) => setF({ ...f, imageUrl: url })} className="sm:col-span-2" hint="Optional. Shown on the event page and the website." />
        <div className="space-y-2 sm:col-span-2">
          {isAdmin && <Checkbox label="Show on the public website" checked={f.isPublic} onChange={(v) => setF({ ...f, isPublic: v })} />}
          <Checkbox label="Take registrations" checked={f.registrationOpen} onChange={(v) => setF({ ...f, registrationOpen: v })} />
        </div>
        {f.registrationOpen && <TextInput label="Capacity" type="number" min={0} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} hint="Leave blank for no limit." />}
      </div>
    </Modal>
  )
}

export default function Events() {
  const { can } = useAuth()
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const q = useQuery({ queryKey: ['events', when, page], queryFn: () => api.page<ChurchEvent>('/events', { when, page }), placeholderData: keepPreviousData })
  return (
    <>
      <PageHeader title="Events" actions={can('admin', 'leader') ? <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />New event</Button> : undefined} />
      <div className="mb-5"><Tabs value={when} onChange={(v) => { setWhen(v); setPage(1) }} tabs={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]} /></div>
      {q.isLoading ? <Spinner /> : q.error ? <ErrorNote error={q.error} /> : q.data!.items.length === 0 ? <Empty title={when === 'upcoming' ? 'Nothing planned yet' : 'No past events'} /> : (
        <>
          <ul className="grid gap-4 md:grid-cols-2">
            {q.data!.items.map((e) => (
              <li key={e._id}>
                <Link to={`/app/events/${e._id}`} className="card flex gap-4 p-5 transition hover:border-ink-300">
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-ink-700 py-2 text-white"><span className="text-[11px] text-brass-300">{date(e.startAt, { month: 'short' })}</span><span className="text-xl font-semibold leading-none">{new Date(e.startAt).getDate()}</span></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink-900">{e.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500"><CalendarDays className="h-3.5 w-3.5" />{date(e.startAt, { weekday: 'short' })} {time(e.startAt)}</p>
                    {e.location && <p className="flex items-center gap-1.5 text-sm text-ink-500"><MapPin className="h-3.5 w-3.5" />{e.location}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.unit ? <Badge tone="blue">{e.unit.name}</Badge> : <Badge>Whole church</Badge>}
                      {e.isPublic && <Badge tone="green"><Globe className="mr-1 inline h-3 w-3" />On website</Badge>}
                      {e.registered && <Badge tone="brass">You're registered</Badge>}
                      {e.registrationOpen && !e.registered && <Badge tone="amber">Registration open</Badge>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={q.data!.meta.page} pages={q.data!.meta.pages} onPage={setPage} />
        </>
      )}
      {adding && <EventForm onClose={() => setAdding(false)} />}
    </>
  )
}
