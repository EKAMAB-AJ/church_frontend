import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { date, fullName, toDateInput } from '../../lib/format'
import type { Member, Service, Visitor } from '../../lib/types'
import { MemberSinglePicker } from '../../components/pickers'
import { Badge, Button, Card, Checkbox, Empty, ErrorNote, Modal, PageHeader, Pagination, SearchBox, SelectInput, Spinner, Table, Tabs, TextArea, TextInput, useToast } from '../../components/ui'

export const VISITOR_STATUS: Record<Visitor['status'], { label: string; tone: 'blue' | 'amber' | 'green' | 'brass' | 'gray' }> = {
  new: { label: 'New', tone: 'blue' }, contacted: { label: 'Contacted', tone: 'amber' }, returning: { label: 'Returning', tone: 'green' },
  member: { label: 'Became a member', tone: 'brass' }, not_interested: { label: 'Not interested', tone: 'gray' },
}

export function VisitorForm({ visitor, serviceId, onClose }: { visitor?: Visitor; serviceId?: string; onClose: () => void }) {
  const { can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const services = useQuery({ queryKey: ['services', 'recent'], queryFn: () => api.page<Service>('/services', { limit: 15 }) })
  const [f, setF] = useState({
    firstName: visitor?.firstName || '', lastName: visitor?.lastName || '', phone: visitor?.phone || '', email: visitor?.email || '', address: visitor?.address || '',
    gender: visitor?.gender || '', visitDate: toDateInput(visitor?.visitDate || new Date()), service: visitor?.service?._id || serviceId || '',
    howHeard: visitor?.howHeard || '', invitedBy: visitor?.invitedBy || '', prayerRequest: visitor?.prayerRequest || '', wantsVisit: visitor?.wantsVisit || false,
  })
  const [assignee, setAssignee] = useState<Member | null>(visitor?.assignedTo || null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () => {
      const body = { ...f, ...(can('admin') ? { assignedTo: assignee?._id || null } : {}) }
      return visitor ? api.patch<Visitor>(`/visitors/${visitor._id}`, body) : api.post<Visitor>('/visitors', body)
    },
    onSuccess: (v) => { qc.invalidateQueries({ queryKey: ['visitors'] }); qc.invalidateQueries({ queryKey: ['visitor', v._id] }); toast(visitor ? 'Saved' : `${v.firstName} recorded`); onClose(); if (!visitor) nav(`/app/first-timers/${v._id}`) },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  return (
    <Modal open onClose={onClose} title={visitor ? 'Edit first-timer' : 'Record a first-timer'} wide
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>{visitor ? 'Save' : 'Save first-timer'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="First name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} error={errors.firstName} autoFocus />
        <TextInput label="Last name" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
        <TextInput label="Phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={errors.phone} />
        <TextInput label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
        <TextInput label="Date of visit" type="date" value={f.visitDate} onChange={(e) => setF({ ...f, visitDate: e.target.value })} />
        <SelectInput label="Service attended" value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })}>
          <option value="">—</option>{(services.data?.items || []).map((s) => <option key={s._id} value={s._id}>{s.title} · {date(s.date, { day: 'numeric', month: 'short' })}</option>)}
        </SelectInput>
        <SelectInput label="Gender" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option value="">—</option><option value="male">Male</option><option value="female">Female</option></SelectInput>
        <TextInput label="Address / area" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <TextInput label="How did they hear about us?" value={f.howHeard} onChange={(e) => setF({ ...f, howHeard: e.target.value })} placeholder="Friend, flyer, Instagram…" />
        <TextInput label="Invited by" value={f.invitedBy} onChange={(e) => setF({ ...f, invitedBy: e.target.value })} />
        <TextArea label="Prayer request" rows={2} value={f.prayerRequest} onChange={(e) => setF({ ...f, prayerRequest: e.target.value })} className="sm:col-span-2" />
        <div className="sm:col-span-2"><Checkbox label="Would like a visit" checked={f.wantsVisit} onChange={(v) => setF({ ...f, wantsVisit: v })} /></div>
        {can('admin') && <div className="sm:col-span-2"><MemberSinglePicker label="Assign follow-up to" value={assignee} onChange={(v) => setAssignee(v as Member | null)} /></div>}
      </div>
    </Modal>
  )
}

export default function Visitors() {
  const [params, setParams] = useSearchParams()
  const { can } = useAuth()
  const nav = useNavigate()
  const [status, setStatus] = useState<'open' | 'all' | Visitor['status']>('open')
  const [search, setSearch] = useState('')
  const [mine, setMine] = useState(false)
  const [page, setPage] = useState(1)
  const adding = params.get('new') === '1'
  const query = { status: status === 'all' ? undefined : status, q: search, page, mine: can('admin') && mine ? 'true' : undefined }
  const q = useQuery({ queryKey: ['visitors', query], queryFn: () => api.page<Visitor>('/visitors', query), placeholderData: keepPreviousData })
  return (
    <>
      <PageHeader title="First-timers" description={can('admin') ? 'Everyone who visited, and how follow-up is going.' : 'First-timers assigned to you for follow-up.'}
        actions={<Button onClick={() => setParams({ new: '1' })}><Plus className="h-4 w-4" />Record first-timer</Button>} />
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4">
          <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1) }} tabs={[
            { value: 'open', label: 'Needs follow-up' }, { value: 'returning', label: 'Returning' }, { value: 'member', label: 'Members' }, { value: 'all', label: 'All' },
          ]} />
          <div className="min-w-[180px] flex-1"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search name or phone" /></div>
          {can('admin') && <Checkbox label="Assigned to me" checked={mine} onChange={setMine} />}
        </div>
        {q.isLoading ? <Spinner /> : q.error ? <div className="p-5"><ErrorNote error={q.error} /></div> : q.data!.items.length === 0 ? <div className="p-6"><Empty title="No first-timers here">Record visitors after each service so nobody slips through.</Empty></div> : (
          <>
            <Table head={['Name', 'Visited', 'Phone', 'Follow-up by', 'Status']} hideOnMobile={[1, 2, 3]}>
              {q.data!.items.map((v) => (
                <tr key={v._id} className="cursor-pointer hover:bg-ink-50" onClick={() => nav(`/app/first-timers/${v._id}`)}>
                  <td><Link to={`/app/first-timers/${v._id}`} className="font-medium text-ink-900" onClick={(e) => e.stopPropagation()}>{fullName(v)}</Link>
                    {v.followUps.length > 0 && <div className="text-xs text-ink-400">{v.followUps.length} follow-up{v.followUps.length > 1 ? 's' : ''}</div>}</td>
                  <td className="whitespace-nowrap text-ink-600">{date(v.visitDate)}</td>
                  <td className="whitespace-nowrap text-ink-600">{v.phone || '—'}</td>
                  <td className="text-ink-600">{v.assignedTo ? fullName(v.assignedTo) : <span className="text-amber-700">Unassigned</span>}</td>
                  <td><Badge tone={VISITOR_STATUS[v.status].tone}>{VISITOR_STATUS[v.status].label}</Badge></td>
                </tr>
              ))}
            </Table>
            <Pagination page={q.data!.meta.page} pages={q.data!.meta.pages} onPage={setPage} />
          </>
        )}
      </Card>
      {adding && <VisitorForm serviceId={params.get('service') || undefined} onClose={() => setParams({})} />}
    </>
  )
}
