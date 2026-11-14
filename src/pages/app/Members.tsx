import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fullName, titleCase } from '../../lib/format'
import type { Member } from '../../lib/types'
import { useUnits } from '../../components/pickers'
import MemberForm from '../../components/MemberForm'
import { Avatar, Badge, Button, Card, Empty, ErrorNote, PageHeader, Pagination, SearchBox, Spinner, Table, useToast } from '../../components/ui'

export default function Members() {
  const { can } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const units = useUnits()
  const [filters, setFilters] = useState({ q: '', unit: '', status: 'active', gender: '', sort: 'name' })
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const query = { ...filters, page, limit: 25 }
  const q = useQuery({ queryKey: ['members', query], queryFn: () => api.page<Member>('/members', query), placeholderData: keepPreviousData })
  const setFilter = (k: keyof typeof filters, v: string) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1) }
  const visibleUnits = can('admin') ? units.data || [] : (units.data || []).filter((u) => u.iLead)

  return (
    <>
      <PageHeader title="Members" description={q.data ? `${q.data.meta.total.toLocaleString()} ${filters.status === 'all' ? '' : filters.status} members` : undefined}
        actions={<>
          <Button variant="secondary" onClick={() => api.download('/members/export', 'members.csv', filters).catch((e) => toast(errorMessage(e), 'error'))}><Download className="h-4 w-4" />Export</Button>
          <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add member</Button>
        </>} />
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-ink-100 p-4">
          <div className="min-w-[200px] flex-1"><SearchBox value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Search name, phone or email" /></div>
          <select className="input w-auto" value={filters.unit} onChange={(e) => setFilter('unit', e.target.value)} aria-label="Unit">
            <option value="">{can('admin') ? 'All units' : 'All my units'}</option>{visibleUnits.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          <select className="input w-auto" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
            <option value="active">Active</option><option value="inactive">Inactive</option><option value="transferred">Transferred</option><option value="deceased">Deceased</option><option value="all">Any status</option>
          </select>
          <select className="input w-auto" value={filters.gender} onChange={(e) => setFilter('gender', e.target.value)} aria-label="Gender">
            <option value="">Men & women</option><option value="male">Men</option><option value="female">Women</option>
          </select>
          <select className="input w-auto" value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
            <option value="name">A–Z</option><option value="newest">Newest</option><option value="oldest">Longest serving</option>
          </select>
        </div>
        {q.isLoading ? <Spinner /> : q.error ? <div className="p-5"><ErrorNote error={q.error} onRetry={() => q.refetch()} /></div> : q.data!.items.length === 0 ? (
          <div className="p-6"><Empty title={filters.q ? `No one matches "${filters.q}"` : 'No members yet'} action={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add member</Button>} /></div>
        ) : (
          <>
            <Table head={['Name', 'Phone', 'Units', 'Family', 'Access']} hideOnMobile={[2, 3, 4]}>
              {q.data!.items.map((m) => (
                <tr key={m._id} className="cursor-pointer hover:bg-ink-50" onClick={() => nav(`/app/members/${m._id}`)}>
                  <td><Link to={`/app/members/${m._id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}><Avatar person={m} size={32} /><span className="font-medium text-ink-900">{fullName(m)}</span></Link></td>
                  <td className="whitespace-nowrap text-ink-600">{m.phone || '—'}</td>
                  <td className="text-ink-600">{(m.units || []).map((u) => u.name).join(', ') || '—'}</td>
                  <td className="text-ink-600">{m.family?.name || '—'}</td>
                  <td>{m.canLogin ? <Badge tone={m.role === 'admin' ? 'brass' : m.role === 'leader' ? 'blue' : 'green'}>{titleCase(m.role)}</Badge> : <span className="text-ink-300">—</span>}</td>
                </tr>
              ))}
            </Table>
            <Pagination page={q.data!.meta.page} pages={q.data!.meta.pages} onPage={setPage} />
          </>
        )}
      </Card>
      {adding && <MemberForm open onClose={() => setAdding(false)} onSaved={(m) => nav(`/app/members/${m._id}`)} />}
    </>
  )
}
