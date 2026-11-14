import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Pencil, UserPlus } from 'lucide-react'
import clsx from 'clsx'
import { api, errorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { date, fullName, time } from '../../lib/format'
import type { Member, Service } from '../../lib/types'
import { Avatar, Button, Card, ConfirmButton, Empty, ErrorNote, PageHeader, SearchBox, Spinner, TextInput, useToast } from '../../components/ui'
import { ServiceForm } from './Services'

type Detail = Service & { totalMarked: number; firstTimers: number; canEdit: boolean; roster: (Member & { present: boolean })[] }

export default function ServiceDetail() {
  const { id } = useParams()
  const { can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const q = useQuery({ queryKey: ['service', id], queryFn: () => api.get<Detail>(`/services/${id}`) })
  const [present, setPresent] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [head, setHead] = useState({ men: '', women: '', children: '' })
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!q.data) return
    setPresent(new Set(q.data.roster.filter((m) => m.present).map((m) => m._id)))
    const h = q.data.headcount || { men: 0, women: 0, children: 0 }
    setHead({ men: String(h.men || ''), women: String(h.women || ''), children: String(h.children || '') })
  }, [q.data])

  const original = useMemo(() => new Set(q.data?.roster.filter((m) => m.present).map((m) => m._id)), [q.data])
  const dirty = q.data ? present.size !== original.size || [...present].some((x) => !original.has(x)) : false

  const saveAttendance = useMutation({
    mutationFn: () => api.put<{ totalMarked: number }>(`/services/${id}/attendance`, { memberIds: [...present] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['service', id] }); qc.invalidateQueries({ queryKey: ['services'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast(`Attendance saved — ${present.size} present`) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const saveHead = useMutation({
    mutationFn: () => api.patch(`/services/${id}`, { headcount: { men: Number(head.men) || 0, women: Number(head.women) || 0, children: Number(head.children) || 0 } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['service', id] }); qc.invalidateQueries({ queryKey: ['services'] }); toast('Headcount saved') },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const del = useMutation({ mutationFn: () => api.del(`/services/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); nav('/app/attendance') } })

  if (q.isLoading) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} />
  const s = q.data!
  const shown = s.roster.filter((m) => !filter || fullName(m).toLowerCase().includes(filter.toLowerCase()) || m.phone?.includes(filter))
  const toggle = (mid: string) => setPresent((p) => { const n = new Set(p); if (n.has(mid)) n.delete(mid); else n.add(mid); return n })
  const headTotal = (Number(head.men) || 0) + (Number(head.women) || 0) + (Number(head.children) || 0)

  return (
    <>
      <PageHeader title={s.title} description={`${date(s.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${time(s.date)}${s.unit ? ` · ${s.unit.name}` : ''}`}
        back={<Link to="/app/attendance" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" />Attendance</Link>}
        actions={s.canEdit ? <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button> : undefined} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card padded={false} title={<span>Roster <span className="font-normal text-ink-400">· {present.size} of {s.roster.length} present</span></span>}
          actions={s.roster.length > 0 ? <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setPresent(new Set(s.roster.map((m) => m._id)))}>All</Button><Button size="sm" variant="ghost" onClick={() => setPresent(new Set())}>None</Button></div> : undefined}>
          <div className="border-b border-ink-100 p-3"><SearchBox value={filter} onChange={setFilter} placeholder="Find someone" /></div>
          {s.roster.length === 0 ? <div className="p-5"><Empty title="No one to mark">{s.unit ? 'Add members to this unit first.' : 'Members appear here once they are registered.'}</Empty></div> : (
            <ul className="max-h-[60vh] divide-y divide-ink-100 overflow-y-auto">
              {shown.map((m) => {
                const on = present.has(m._id)
                return (
                  <li key={m._id}>
                    <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(m._id)}
                      className={clsx('flex w-full items-center gap-3 px-5 py-2.5 text-left transition', on ? 'bg-emerald-50/60' : 'hover:bg-ink-50')}>
                      <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded border', on ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-ink-300 bg-white')}>{on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
                      <Avatar person={m} size={30} />
                      <span className="min-w-0 flex-1"><span className="block font-medium text-ink-900">{fullName(m)}</span>{!s.unit && m.units?.length ? <span className="block truncate text-xs text-ink-400">{m.units.map((u) => u.name).join(', ')}</span> : null}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-ink-100 bg-white p-4">
            <span className="text-sm text-ink-500">{dirty ? 'Unsaved changes' : 'Up to date'}</span>
            <Button onClick={() => saveAttendance.mutate()} loading={saveAttendance.isPending} disabled={!dirty}>Save attendance</Button>
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="Usher headcount">
            {s.canEdit ? (
              <form onSubmit={(e) => { e.preventDefault(); saveHead.mutate() }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {(['men', 'women', 'children'] as const).map((k) => <TextInput key={k} label={k[0].toUpperCase() + k.slice(1)} type="number" min={0} inputMode="numeric" value={head[k]} onChange={(e) => setHead({ ...head, [k]: e.target.value })} />)}
                </div>
                <div className="flex items-center justify-between"><span className="text-sm text-ink-500">Total <b className="text-ink-900">{headTotal}</b></span><Button type="submit" variant="secondary" loading={saveHead.isPending}>Save headcount</Button></div>
              </form>
            ) : <p className="text-sm text-ink-600">{s.headcountTotal ? `${s.headcountTotal} in total` : 'Not recorded yet.'}</p>}
          </Card>
          <Card title="First-timers">
            <p className="text-sm text-ink-600">{s.firstTimers ? `${s.firstTimers} first-timer${s.firstTimers > 1 ? 's' : ''} recorded for this service.` : 'None recorded yet.'}</p>
            <Link to={`/app/first-timers?new=1&service=${s._id}`} className="mt-3 inline-block"><Button variant="secondary" size="sm"><UserPlus className="h-4 w-4" />Record a first-timer</Button></Link>
          </Card>
          {can('admin') && <ConfirmButton variant="danger" title="Delete this service?" message="Its attendance records will be removed too." onConfirm={() => del.mutateAsync()}>Delete service</ConfirmButton>}
        </div>
      </div>
      {editing && <ServiceForm service={s} onClose={() => setEditing(false)} />}
    </>
  )
}
