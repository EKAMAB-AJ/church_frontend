import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { date, titleCase, toDateTimeInput } from '../../lib/format'
import type { Service } from '../../lib/types'
import { useUnits } from '../../components/pickers'
import { Badge, Button, Card, Empty, ErrorNote, Modal, PageHeader, Pagination, SelectInput, Spinner, Table, TextArea, TextInput, useToast } from '../../components/ui'

const TYPES = ['sunday', 'midweek', 'special', 'unit'] as const

export function ServiceForm({ service, defaultUnit, onClose }: { service?: Service; defaultUnit?: string; onClose: () => void }) {
  const { can } = useAuth()
  const units = useUnits()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const isAdmin = can('admin')
  const now = new Date(); now.setMinutes(0, 0, 0)
  const [f, setF] = useState({
    title: service?.title || '', type: service?.type || (isAdmin && !defaultUnit ? 'sunday' : 'unit'), date: toDateTimeInput(service?.date || now),
    unit: service?.unit?._id || defaultUnit || '', notes: service?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const myUnits = isAdmin ? units.data || [] : (units.data || []).filter((u) => u.iLead)
  const save = useMutation({
    mutationFn: () => {
      const body = { ...f, date: new Date(f.date).toISOString(), unit: f.type === 'unit' ? f.unit : null }
      return service ? api.patch<Service>(`/services/${service._id}`, body) : api.post<Service>('/services', body)
    },
    onSuccess: (s) => { qc.invalidateQueries({ queryKey: ['services'] }); qc.invalidateQueries({ queryKey: ['service', s._id] }); toast(service ? 'Saved' : 'Service created'); onClose(); if (!service) nav(`/app/attendance/${s._id}`) },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  return (
    <Modal open onClose={onClose} title={service ? 'Edit service' : isAdmin ? 'New service or meeting' : 'New unit meeting'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>{service ? 'Save' : 'Create and take attendance'}</Button></>}>
      <div className="space-y-4">
        <TextInput label="Title" placeholder={f.type === 'unit' ? 'Choir rehearsal' : 'Sunday first service'} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} autoFocus />
        <div className="grid gap-4 sm:grid-cols-2">
          {isAdmin && !(service && !isAdmin) && (
            <SelectInput label="Type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Service['type'] })}>
              {TYPES.map((t) => <option key={t} value={t}>{t === 'unit' ? 'Unit meeting' : `${titleCase(t)} service`}</option>)}
            </SelectInput>
          )}
          <TextInput label="Date & time" type="datetime-local" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} error={errors.date} />
        </div>
        {f.type === 'unit' && (
          <SelectInput label="Unit" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} error={errors.unit} disabled={Boolean(service && !isAdmin)}>
            <option value="">Choose a unit</option>{myUnits.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </SelectInput>
        )}
        <TextArea label="Notes" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </div>
    </Modal>
  )
}

export default function Services() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { can } = useAuth()
  const units = useUnits()
  const [type, setType] = useState('')
  const [unit, setUnit] = useState(params.get('unit') || '')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const query = { type, unit, page }
  const q = useQuery({ queryKey: ['services', query], queryFn: () => api.page<Service>('/services', query), placeholderData: keepPreviousData })
  const unitOptions = can('admin') ? units.data || [] : (units.data || []).filter((u) => u.iLead)
  return (
    <>
      <PageHeader title="Attendance" description={can('admin') ? 'Services and unit meetings. Open one to mark who came.' : 'Your unit meetings, plus church services where you can mark your unit members.'}
        actions={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />{can('admin') ? 'New service' : 'New meeting'}</Button>} />
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-ink-100 p-4">
          <select className="input w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} aria-label="Type"><option value="">All types</option>{TYPES.map((t) => <option key={t} value={t}>{t === 'unit' ? 'Unit meetings' : `${titleCase(t)} services`}</option>)}</select>
          <select className="input w-auto" value={unit} onChange={(e) => { setUnit(e.target.value); setPage(1) }} aria-label="Unit"><option value="">All units</option>{unitOptions.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select>
        </div>
        {q.isLoading ? <Spinner /> : q.error ? <div className="p-5"><ErrorNote error={q.error} /></div> : q.data!.items.length === 0 ? <div className="p-6"><Empty title="Nothing recorded yet" action={<Button onClick={() => setAdding(true)}>Create one</Button>} /></div> : (
          <>
            <Table head={['Service', 'Date', 'Headcount', 'Present']} hideOnMobile={[2]}>
              {q.data!.items.map((s) => (
                <tr key={s._id} className="cursor-pointer hover:bg-ink-50" onClick={() => nav(`/app/attendance/${s._id}`)}>
                  <td><Link to={`/app/attendance/${s._id}`} className="font-medium text-ink-900" onClick={(e) => e.stopPropagation()}>{s.title}</Link>
                    <div className="mt-0.5">{s.unit ? <Badge tone="blue">{s.unit.name}</Badge> : <Badge>{titleCase(s.type)}</Badge>}</div></td>
                  <td className="whitespace-nowrap text-ink-600">{date(s.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="text-ink-600">{s.headcountTotal || '—'}</td>
                  <td className="text-ink-600">{s.markedPresent}</td>
                </tr>
              ))}
            </Table>
            <Pagination page={q.data!.meta.page} pages={q.data!.meta.pages} onPage={setPage} />
          </>
        )}
      </Card>
      {adding && <ServiceForm defaultUnit={unit || undefined} onClose={() => setAdding(false)} />}
    </>
  )
}
