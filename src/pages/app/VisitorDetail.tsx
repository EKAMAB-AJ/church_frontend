import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Pencil, Phone, UserCheck } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { date, dateTime, fullName, telLink, titleCase, waLink } from '../../lib/format'
import type { Member, Visitor } from '../../lib/types'
import { Badge, Button, Card, ConfirmButton, Empty, ErrorNote, PageHeader, SelectInput, Spinner, TextArea, useToast } from '../../components/ui'
import { VISITOR_STATUS, VisitorForm } from './Visitors'

const METHODS = ['call', 'whatsapp', 'sms', 'visit', 'email', 'other']

export default function VisitorDetail() {
  const { id } = useParams()
  const { can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState({ note: '', method: 'call', status: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const q = useQuery({ queryKey: ['visitor', id], queryFn: () => api.get<Visitor>(`/visitors/${id}`) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['visitor', id] }); qc.invalidateQueries({ queryKey: ['visitors'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) }
  const follow = useMutation({
    mutationFn: () => api.post(`/visitors/${id}/follow-ups`, { note: note.note, method: note.method, ...(note.status ? { status: note.status } : {}) }),
    onSuccess: () => { refresh(); setNote({ note: '', method: note.method, status: '' }); toast('Follow-up logged') },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  const setStatus = useMutation({ mutationFn: (status: string) => api.patch(`/visitors/${id}`, { status }), onSuccess: refresh })
  const convert = useMutation({
    mutationFn: () => api.post<{ member: Member }>(`/visitors/${id}/convert`),
    onSuccess: (r) => { refresh(); qc.invalidateQueries({ queryKey: ['members'] }); toast('Added to the members directory'); nav(`/app/members/${r.member._id}`) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const del = useMutation({ mutationFn: () => api.del(`/visitors/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }); nav('/app/first-timers') } })

  if (q.isLoading) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} />
  const v = q.data!
  const submit = (e: FormEvent) => { e.preventDefault(); setErrors({}); follow.mutate() }
  const row = (label: string, value?: React.ReactNode) => value ? <div className="grid grid-cols-[130px_1fr] gap-3 py-2.5 text-sm"><dt className="text-ink-500">{label}</dt><dd className="text-ink-900">{value}</dd></div> : null

  return (
    <>
      <PageHeader title={fullName(v)} description={<span className="flex flex-wrap items-center gap-2"><Badge tone={VISITOR_STATUS[v.status].tone}>{VISITOR_STATUS[v.status].label}</Badge>First visit {date(v.visitDate, { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
        back={<Link to="/app/first-timers" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" />First-timers</Link>}
        actions={<>
          {v.phone && <a href={telLink(v.phone)}><Button variant="secondary"><Phone className="h-4 w-4" />Call</Button></a>}
          {v.phone && <a href={`${waLink(v.phone)}?text=${encodeURIComponent(`Hello ${v.firstName}, thank you for worshipping with us!`)}`} target="_blank" rel="noreferrer"><Button variant="secondary"><MessageCircle className="h-4 w-4" />WhatsApp</Button></a>}
          <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
        </>} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Log a follow-up">
            <form onSubmit={submit} className="space-y-4">
              <TextArea label="What happened?" rows={3} placeholder="Called her — she enjoyed the service and will come back Sunday." value={note.note} onChange={(e) => setNote({ ...note, note: e.target.value })} error={errors.note} />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectInput label="How" value={note.method} onChange={(e) => setNote({ ...note, method: e.target.value })}>{METHODS.map((m) => <option key={m} value={m}>{m === 'sms' ? 'SMS' : titleCase(m)}</option>)}</SelectInput>
                <SelectInput label="Update status" value={note.status} onChange={(e) => setNote({ ...note, status: e.target.value })}>
                  <option value="">Keep as {VISITOR_STATUS[v.status].label.toLowerCase()}</option>
                  {(['contacted', 'returning', 'not_interested'] as const).map((s) => <option key={s} value={s}>{VISITOR_STATUS[s].label}</option>)}
                </SelectInput>
              </div>
              <Button type="submit" loading={follow.isPending}>Log follow-up</Button>
            </form>
          </Card>
          <Card title="History" padded={false}>
            {v.followUps.length === 0 ? <div className="p-5"><Empty title="No follow-ups yet">Reach out within 48 hours of their visit.</Empty></div> : (
              <ol className="divide-y divide-ink-100">
                {[...v.followUps].reverse().map((f) => (
                  <li key={f._id} className="px-5 py-3.5">
                    <p className="whitespace-pre-line text-sm text-ink-800">{f.note}</p>
                    <p className="mt-1 text-xs text-ink-400">{f.method === 'sms' ? 'SMS' : titleCase(f.method)} · {f.by ? fullName(f.by) : 'Someone'} · {dateTime(f.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Details">
            <dl className="divide-y divide-ink-100">
              {row('Phone', v.phone)}{row('Email', v.email)}{row('Address', v.address)}{row('Gender', titleCase(v.gender))}
              {row('Service', v.service && `${v.service.title}, ${date(v.service.date)}`)}{row('Heard via', v.howHeard)}{row('Invited by', v.invitedBy)}
              {row('Wants a visit', v.wantsVisit ? 'Yes' : undefined)}{row('Follow-up by', v.assignedTo ? fullName(v.assignedTo) : 'Unassigned')}
              {row('Prayer request', v.prayerRequest && <span className="whitespace-pre-line">{v.prayerRequest}</span>)}
            </dl>
          </Card>
          {v.member ? (
            <Card><p className="text-sm text-ink-700">Now a member: <Link to={`/app/members/${v.member._id}`} className="font-medium underline">{fullName(v.member)}</Link></p></Card>
          ) : can('admin') && (
            <Card title="Joining the church?">
              <p className="mb-3 text-sm text-ink-600">Create a member record with these details and mark this first-timer as a member.</p>
              <Button onClick={() => convert.mutate()} loading={convert.isPending}><UserCheck className="h-4 w-4" />Make a member</Button>
            </Card>
          )}
          {v.status !== 'not_interested' && !v.member && <Button variant="ghost" onClick={() => setStatus.mutate('not_interested')}>Mark not interested</Button>}
          {can('admin') && <ConfirmButton variant="danger" title="Delete this first-timer?" message="Their follow-up history will be deleted too." onConfirm={() => del.mutateAsync()}>Delete</ConfirmButton>}
        </div>
      </div>
      {editing && <VisitorForm visitor={v} onClose={() => setEditing(false)} />}
    </>
  )
}
