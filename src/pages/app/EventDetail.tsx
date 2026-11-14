import { cld } from '../../lib/cloudinary'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, Pencil } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { date, dateTime, fullName, time } from '../../lib/format'
import type { ChurchEvent } from '../../lib/types'
import { Badge, Button, Card, ConfirmButton, Empty, ErrorNote, PageHeader, Spinner, Table, useToast } from '../../components/ui'
import { EventForm } from './Events'

export default function EventDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const q = useQuery({ queryKey: ['event', id], queryFn: () => api.get<ChurchEvent>(`/events/${id}`) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['event', id] }); qc.invalidateQueries({ queryKey: ['events'] }) }
  const reg = useMutation({ mutationFn: (on: boolean) => (on ? api.post(`/events/${id}/register`) : api.del(`/events/${id}/register`)), onSuccess: (_, on) => { refresh(); toast(on ? "You're registered" : 'Registration cancelled') }, onError: (e) => toast(errorMessage(e), 'error') })
  const del = useMutation({ mutationFn: () => api.del(`/events/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); nav('/app/events') } })
  if (q.isLoading) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} />
  const e = q.data!
  const past = new Date(e.endAt || e.startAt) < new Date()
  const full = e.capacity ? (e.registrationCount ?? e.registrations?.length ?? 0) >= e.capacity : false
  return (
    <>
      <PageHeader title={e.title} back={<Link to="/app/events" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" />Events</Link>}
        description={<span className="flex flex-wrap gap-1.5">{e.unit ? <Badge tone="blue">{e.unit.name}</Badge> : <Badge>Whole church</Badge>}{e.isPublic && <Badge tone="green">On website</Badge>}</span>}
        actions={e.canManage ? <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button> : undefined} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          {e.imageUrl && <img src={cld(e.imageUrl, 'w_1200')} alt="" className="mb-5 aspect-[2/1] w-full rounded-lg object-cover" />}
          <div className="space-y-1.5 text-ink-700">
            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-ink-400" />{date(e.startAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, {time(e.startAt)}{e.endAt && ` – ${time(e.endAt)}`}</p>
            {e.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-ink-400" />{e.location}</p>}
          </div>
          {e.description && <p className="mt-5 whitespace-pre-line text-ink-700">{e.description}</p>}
          {e.registrationOpen && !past && (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-5">
              {e.registered ? <><Badge tone="green">You're registered</Badge><Button variant="ghost" size="sm" loading={reg.isPending} onClick={() => reg.mutate(false)}>Cancel my registration</Button></>
                : full ? <p className="text-sm text-ink-500">This event is fully booked.</p>
                : <Button loading={reg.isPending} onClick={() => reg.mutate(true)}>Register</Button>}
              {e.capacity ? <span className="text-sm text-ink-400">{e.registrationCount ?? e.registrations?.length ?? 0} of {e.capacity} places taken</span> : null}
            </div>
          )}
        </Card>
        {e.canManage && (
          <div className="space-y-6">
            <Card title={`Registrations (${e.registrations?.length ?? 0})`} padded={false}>
              {!e.registrations?.length ? <div className="p-5"><Empty title="No registrations yet" /></div> : (
                <Table head={['Name', 'Contact', 'When']}>
                  {e.registrations.map((r) => (
                    <tr key={r._id}>
                      <td className="font-medium text-ink-900">{r.member ? <Link to={`/app/members/${r.member._id}`} className="hover:underline">{fullName(r.member)}</Link> : r.name}{!r.member && <span className="ml-1.5 text-xs text-ink-400">via website</span>}</td>
                      <td className="text-ink-600">{r.member?.phone || r.phone || r.email || r.member?.email || '—'}</td>
                      <td className="whitespace-nowrap text-ink-500">{dateTime(r.at)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
            <ConfirmButton variant="danger" title="Delete this event?" message="Registrations will be lost." onConfirm={() => del.mutateAsync()}>Delete event</ConfirmButton>
          </div>
        )}
      </div>
      {editing && <EventForm event={e} onClose={() => setEditing(false)} />}
    </>
  )
}
