import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, Megaphone, Pencil, X } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fullName, telLink, titleCase } from '../../lib/format'
import type { Member, Unit } from '../../lib/types'
import { MemberSearch } from '../../components/pickers'
import { Avatar, Button, Card, ConfirmButton, Empty, ErrorNote, PageHeader, SearchBox, Spinner, useToast } from '../../components/ui'
import { UnitForm } from './Units'

type Detail = Unit & { members: Member[]; canManage: boolean }

export default function UnitDetail() {
  const { id } = useParams()
  const { can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [filter, setFilter] = useState('')
  const q = useQuery({ queryKey: ['unit', id], queryFn: () => api.get<Detail>(`/units/${id}`) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['unit', id] }); qc.invalidateQueries({ queryKey: ['units'] }) }
  const add = useMutation({ mutationFn: (memberId: string) => api.post(`/units/${id}/members`, { memberIds: [memberId] }), onSuccess: () => { refresh(); toast('Added to unit') }, onError: (e) => toast(errorMessage(e), 'error') })
  const remove = useMutation({ mutationFn: (memberId: string) => api.del(`/units/${id}/members/${memberId}`), onSuccess: () => { refresh(); toast('Removed from unit') }, onError: (e) => toast(errorMessage(e), 'error') })
  const del = useMutation({ mutationFn: () => api.del(`/units/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['units'] }); nav('/app/units') } })

  if (q.isLoading) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} />
  const u = q.data!
  const shown = u.members.filter((m) => !filter || fullName(m).toLowerCase().includes(filter.toLowerCase()) || m.phone?.includes(filter))
  return (
    <>
      <PageHeader title={u.name} description={[titleCase(u.type), [u.meetingDay, u.meetingTime].filter(Boolean).join(', '), u.meetingVenue].filter(Boolean).join(' · ')}
        back={<Link to="/app/units" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" />Units</Link>}
        actions={u.canManage ? <>
          <Link to={`/app/attendance?unit=${u._id}`}><Button variant="secondary"><ClipboardCheck className="h-4 w-4" />Attendance</Button></Link>
          <Link to={`/app/messages?unit=${u._id}`}><Button variant="secondary"><Megaphone className="h-4 w-4" />Message unit</Button></Link>
          <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
        </> : undefined} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card title={`Members (${u.members.length})`} padded={false}>
          {u.members.length > 8 && <div className="border-b border-ink-100 p-3"><SearchBox value={filter} onChange={setFilter} placeholder="Filter this unit" /></div>}
          {u.members.length === 0 ? <div className="p-5"><Empty title="No members yet">{u.canManage ? 'Add people using the panel on the right.' : undefined}</Empty></div> : (
            <ul className="divide-y divide-ink-100">
              {shown.map((m) => (
                <li key={m._id} className="flex items-center gap-3 px-5 py-2.5">
                  <Avatar person={m} size={32} />
                  <div className="min-w-0 flex-1">
                    {u.canManage ? <Link to={`/app/members/${m._id}`} className="font-medium text-ink-900 hover:underline">{fullName(m)}</Link> : <span className="font-medium text-ink-900">{fullName(m)}</span>}
                    {m.phone && <a href={telLink(m.phone)} className="block text-sm text-ink-500 hover:underline">{m.phone}</a>}
                  </div>
                  {u.leaders.some((l) => l._id === m._id) && <span className="text-xs font-medium text-brass-700">Leader</span>}
                  {u.canManage && <button onClick={() => remove.mutate(m._id)} className="rounded p-1.5 text-ink-400 hover:bg-ink-50 hover:text-red-600" aria-label={`Remove ${fullName(m)}`}><X className="h-4 w-4" /></button>}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Leaders" padded={false}>
            {u.leaders.length === 0 ? <p className="p-5 text-sm text-ink-500">No leader assigned.</p> : (
              <ul className="divide-y divide-ink-100">{u.leaders.map((l) => (
                <li key={l._id} className="flex items-center gap-3 px-5 py-3"><Avatar person={l} size={32} /><div><div className="font-medium text-ink-900">{fullName(l)}</div>{l.phone && <a href={telLink(l.phone)} className="text-sm text-ink-500 hover:underline">{l.phone}</a>}</div></li>
              ))}</ul>
            )}
          </Card>
          {u.description && <Card title="About"><p className="whitespace-pre-line text-sm text-ink-600">{u.description}</p></Card>}
          {u.canManage && (
            <Card title="Add a member">
              <MemberSearch label="Search the church directory" exclude={u.members.map((m) => m._id)} onPick={(m) => add.mutate(m._id)} />
              {!can('admin') && <p className="mt-2 text-xs text-ink-400">To register someone new, use Members → Add member.</p>}
            </Card>
          )}
          {can('admin') && <ConfirmButton variant="danger" title={`Delete ${u.name}?`} message="Members stay in the directory. This unit's meetings, attendance records and unit-only events are deleted with it — to keep them, edit the unit and untick Active instead." onConfirm={() => del.mutateAsync()}>Delete unit</ConfirmButton>}
        </div>
      </div>
      {editing && <UnitForm unit={u} onClose={() => setEditing(false)} />}
    </>
  )
}
