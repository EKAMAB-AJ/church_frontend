import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Plus, Users } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fullName, titleCase } from '../../lib/format'
import type { Unit } from '../../lib/types'
import { MemberMultiPicker, useUnits } from '../../components/pickers'
import { Badge, Button, Checkbox, Empty, ErrorNote, Modal, PageHeader, SelectInput, Spinner, TextArea, TextInput, useToast } from '../../components/ui'

export const UNIT_TYPES = ['department', 'ministry', 'cell', 'committee', 'other']

export function UnitForm({ unit, onClose }: { unit?: Unit; onClose: () => void }) {
  const { can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState({
    name: unit?.name || '', type: unit?.type || 'department', description: unit?.description || '',
    meetingDay: unit?.meetingDay || '', meetingTime: unit?.meetingTime || '', meetingVenue: unit?.meetingVenue || '', active: unit?.active ?? true,
  })
  const [leaders, setLeaders] = useState(unit?.leaders || [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () => {
      const body = { ...f, ...(can('admin') ? { leaders: leaders.map((l) => l._id) } : {}) }
      return unit ? api.patch<Unit>(`/units/${unit._id}`, body) : api.post<Unit>('/units', body)
    },
    onSuccess: (u) => { qc.invalidateQueries({ queryKey: ['units'] }); qc.invalidateQueries({ queryKey: ['unit', u._id] }); toast(unit ? 'Unit updated' : 'Unit created'); onClose(); if (!unit) nav(`/app/units/${u._id}`) },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  return (
    <Modal open onClose={onClose} title={unit ? `Edit ${unit.name}` : 'New unit'} wide
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>{unit ? 'Save' : 'Create unit'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Name" placeholder="Choir, Ushering, Youth Fellowship…" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} autoFocus />
        <SelectInput label="Type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{UNIT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</SelectInput>
        <TextInput label="Meeting day" placeholder="Saturdays" value={f.meetingDay} onChange={(e) => setF({ ...f, meetingDay: e.target.value })} />
        <TextInput label="Meeting time" placeholder="4:00 PM" value={f.meetingTime} onChange={(e) => setF({ ...f, meetingTime: e.target.value })} />
        <TextInput label="Venue" value={f.meetingVenue} onChange={(e) => setF({ ...f, meetingVenue: e.target.value })} className="sm:col-span-2" />
        <TextArea label="Description" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="sm:col-span-2" />
        {can('admin') && <div className="sm:col-span-2"><MemberMultiPicker label="Leaders" value={leaders} onChange={(v) => setLeaders(v as Unit['leaders'])} />
          <p className="mt-1 text-xs text-ink-400">Leaders get the leader role and can manage this unit's members, attendance and messages.</p></div>}
        {unit && <Checkbox label="Active" checked={f.active} onChange={(v) => setF({ ...f, active: v })} />}
      </div>
    </Modal>
  )
}

export default function Units() {
  const { can } = useAuth()
  const q = useUnits()
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState('')
  if (q.isLoading) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} onRetry={() => q.refetch()} />
  const all = q.data!.filter((u) => !type || u.type === type)
  const mine = all.filter((u) => u.iLead || u.iBelong)
  const others = can('admin') ? all : all.filter((u) => !u.iLead && !u.iBelong)
  return (
    <>
      <PageHeader title="Units" description="Departments, ministries, cells and committees."
        actions={<>
          <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="">All types</option>{UNIT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</select>
          {can('admin') && <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />New unit</Button>}
        </>} />
      {q.data!.length === 0 ? <Empty title="No units yet" action={can('admin') ? <Button onClick={() => setAdding(true)}>Create the first unit</Button> : undefined}>Units let leaders manage their own people.</Empty> : (
        <div className="space-y-8">
          {!can('admin') && mine.length > 0 && <Grid title="My units" units={mine} />}
          {others.length > 0 && <Grid title={can('admin') ? undefined : 'Other units'} units={others} />}
        </div>
      )}
      {adding && <UnitForm onClose={() => setAdding(false)} />}
    </>
  )
}

function Grid({ title, units }: { title?: string; units: Unit[] }) {
  return (
    <section>
      {title && <h2 className="mb-3 text-sm font-semibold text-ink-500">{title}</h2>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {units.map((u) => (
          <Link key={u._id} to={`/app/units/${u._id}`} className="card block p-5 transition hover:border-ink-300">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-ink-900">{u.name}</h3>
              <span className="flex gap-1">{u.iLead && <Badge tone="brass">You lead</Badge>}{!u.active && <Badge>Inactive</Badge>}</span>
            </div>
            <p className="mt-0.5 text-sm text-ink-500">{titleCase(u.type)}</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-ink-400" />{u.memberCount ?? 0} members</span>
              {(u.meetingDay || u.meetingTime) && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-ink-400" />{[u.meetingDay, u.meetingTime].filter(Boolean).join(', ')}</span>}
            </div>
            {u.leaders?.length > 0 && <p className="mt-2 truncate text-sm text-ink-400">Led by {u.leaders.map(fullName).join(', ')}</p>}
          </Link>
        ))}
      </div>
    </section>
  )
}
