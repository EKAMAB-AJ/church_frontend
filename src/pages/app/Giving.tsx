import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { date, fullName, money, titleCase, toDateInput } from '../../lib/format'
import type { Category, Contribution, Member } from '../../lib/types'
import { MemberSinglePicker } from '../../components/pickers'
import { Badge, Button, Card, Checkbox, ConfirmButton, Empty, ErrorNote, Modal, PageHeader, Pagination, SelectInput, Spinner, Table, Tabs, TextInput, useToast } from '../../components/ui'

export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/giving/categories', { all: 'true' }) })
const METHODS = ['cash', 'transfer', 'pos', 'cheque'] as const
const methodLabel = (m: string) => (m === 'pos' ? 'POS' : titleCase(m))

function ContributionForm({ item, onClose }: { item?: Contribution; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const cats = useCategories()
  const [member, setMember] = useState<Member | null>(item?.member || null)
  const [f, setF] = useState({ donorName: item?.donorName || '', category: item?.category?._id || '', amount: item ? String(item.amount) : '', method: item?.method || 'cash', date: toDateInput(item?.date || new Date()), reference: item?.reference || '', note: item?.note || '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [another, setAnother] = useState(false)
  const save = useMutation({
    mutationFn: () => {
      const body = { ...f, category: f.category || fallback?._id, amount: Number(f.amount), member: member?._id || null, donorName: member ? '' : f.donorName }
      return item ? api.patch(`/giving/contributions/${item._id}`, body) : api.post('/giving/contributions', body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contributions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(item ? 'Saved' : `${money(Number(f.amount))} recorded`)
      if (another && !item) { setF({ ...f, amount: '', donorName: '', reference: '', note: '' }); setMember(null) } else onClose()
    },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  const active = (cats.data || []).filter((c) => c.active || c._id === f.category)
  const fallback = active.find((c) => c.name === 'Tithe') || active.find((c) => c.name === 'Offering') || active[0]
  return (
    <Modal open onClose={onClose} title={item ? 'Edit record' : 'Record giving'}
      footer={<>{!item && <span className="mr-auto"><Checkbox label="Add another after saving" checked={another} onChange={setAnother} /></span>}<Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><MemberSinglePicker label="Member" value={member} onChange={(v) => setMember(v as Member | null)} /></div>
        {!member && <TextInput label="Or giver's name" placeholder="Leave blank for anonymous" value={f.donorName} onChange={(e) => setF({ ...f, donorName: e.target.value })} className="sm:col-span-2" />}
        <SelectInput label="Category" value={f.category || fallback?._id || ''} onChange={(e) => setF({ ...f, category: e.target.value })} error={errors.category}>{active.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</SelectInput>
        <TextInput label="Amount (₦)" type="number" inputMode="decimal" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} error={errors.amount} />
        <SelectInput label="Method" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} disabled={item?.method === 'online'}>{METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}{item?.method === 'online' && <option value="online">Online</option>}</SelectInput>
        <TextInput label="Date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <TextInput label="Reference" placeholder="Teller or transfer ref" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} error={errors.reference} />
        <TextInput label="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </div>
    </Modal>
  )
}

function CategoryForm({ item, onClose }: { item?: Category; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [f, setF] = useState({ name: item?.name || '', description: item?.description || '', active: item?.active ?? true, online: item?.online ?? true })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () => item ? api.patch(`/giving/categories/${item._id}`, f) : api.post('/giving/categories', f),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast('Category saved'); onClose() },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  return (
    <Modal open onClose={onClose} title={item ? 'Edit category' : 'New category'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="space-y-4">
        <TextInput label="Name" placeholder="Building fund" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} autoFocus />
        <TextInput label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <Checkbox label="Active" checked={f.active} onChange={(v) => setF({ ...f, active: v })} />
        <Checkbox label="Show on the website's Give page" checked={f.online} onChange={(v) => setF({ ...f, online: v })} />
      </div>
    </Modal>
  )
}

export default function Giving() {
  const [tab, setTab] = useState<'records' | 'categories'>('records')
  return (
    <>
      <PageHeader title="Giving" description="Tithes, offerings and other contributions." />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ value: 'records', label: 'Records' }, { value: 'categories', label: 'Categories' }]} /></div>
      {tab === 'records' ? <Records /> : <Categories />}
    </>
  )
}

function Records() {
  const cats = useCategories()
  const qc = useQueryClient()
  const toast = useToast()
  const monthStart = new Date(); monthStart.setDate(1)
  const [filters, setFilters] = useState({ from: toDateInput(monthStart), to: toDateInput(new Date()), category: '', method: '', status: 'success' })
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Contribution | 'new' | null>(null)
  const query = { ...filters, page, limit: 30 }
  const q = useQuery({ queryKey: ['contributions', query], queryFn: () => api.page<Contribution>('/giving/contributions', query), placeholderData: keepPreviousData })
  const del = useMutation({ mutationFn: (id: string) => api.del(`/giving/contributions/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['contributions'] }); toast('Deleted') }, onError: (e) => toast(errorMessage(e), 'error') })
  const set = (k: keyof typeof filters, v: string) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1) }
  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-end gap-3 border-b border-ink-100 p-4">
        <TextInput label="From" type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className="w-40" />
        <TextInput label="To" type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className="w-40" />
        <SelectInput label="Category" value={filters.category} onChange={(e) => set('category', e.target.value)} className="w-44"><option value="">All</option>{(cats.data || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</SelectInput>
        <SelectInput label="Method" value={filters.method} onChange={(e) => set('method', e.target.value)} className="w-36"><option value="">All</option>{[...METHODS, 'online'].map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}</SelectInput>
        <SelectInput label="Status" value={filters.status} onChange={(e) => set('status', e.target.value)} className="w-36"><option value="success">Received</option><option value="pending">Pending online</option><option value="failed">Failed</option><option value="all">All</option></SelectInput>
        <Button className="ml-auto" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Record giving</Button>
      </div>
      {q.data && <div className="flex items-baseline gap-2 border-b border-ink-100 px-5 py-3 text-sm text-ink-500"><span className="text-xl font-semibold text-ink-900">{money(q.data.meta.sum || 0)}</span>from {q.data.meta.total} record{q.data.meta.total === 1 ? '' : 's'}</div>}
      {q.isLoading ? <Spinner /> : q.error ? <div className="p-5"><ErrorNote error={q.error} /></div> : q.data!.items.length === 0 ? <div className="p-6"><Empty title="No giving in this period" action={<Button onClick={() => setEditing('new')}>Record giving</Button>} /></div> : (
        <>
          <Table head={['Date', 'Giver', 'Category', 'Method', 'Amount', '']} hideOnMobile={[2, 3]}>
            {q.data!.items.map((c) => (
              <tr key={c._id}>
                <td className="whitespace-nowrap text-ink-600">{date(c.date)}</td>
                <td>{c.member ? <Link to={`/app/members/${c.member._id}`} className="font-medium text-ink-900 hover:underline">{fullName(c.member)}</Link> : <span className="text-ink-700">{c.donorName || 'Anonymous'}</span>}</td>
                <td className="text-ink-600">{c.category?.name}</td>
                <td><span className="text-ink-600">{methodLabel(c.method)}</span>{c.status !== 'success' && <Badge tone={c.status === 'pending' ? 'amber' : 'red'}>{titleCase(c.status)}</Badge>}</td>
                <td className="whitespace-nowrap text-right font-medium tabular-nums text-ink-900">{money(c.amount)}</td>
                <td className="whitespace-nowrap text-right">
                  {c.method !== 'online' && <button onClick={() => setEditing(c)} className="rounded p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>}
                  {c.method !== 'online' && <ConfirmButton title="Delete this record?" message={`${money(c.amount)} from ${c.member ? fullName(c.member) : c.donorName || 'Anonymous'} will be removed from the accounts.`} onConfirm={() => del.mutateAsync(c._id)}><Trash2 className="h-4 w-4" /></ConfirmButton>}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={q.data!.meta.page} pages={q.data!.meta.pages} onPage={setPage} />
        </>
      )}
      {editing && <ContributionForm item={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </Card>
  )
}

function Categories() {
  const q = useCategories()
  const qc = useQueryClient()
  const toast = useToast()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const del = useMutation({ mutationFn: (id: string) => api.del(`/giving/categories/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast('Category deleted') }, onError: (e) => toast(errorMessage(e), 'error') })
  return (
    <Card padded={false} title="Giving categories" actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />New category</Button>}>
      {q.isLoading ? <Spinner /> : (
        <ul className="divide-y divide-ink-100">
          {(q.data || []).map((c) => (
            <li key={c._id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1"><div className="font-medium text-ink-900">{c.name}</div>{c.description && <div className="text-sm text-ink-500">{c.description}</div>}</div>
              {!c.active && <Badge>Inactive</Badge>}{c.online && c.active && <Badge tone="green">On website</Badge>}
              <button onClick={() => setEditing(c)} className="rounded p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700" aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></button>
              <ConfirmButton title={`Delete ${c.name}?`} message="Categories with giving records can't be deleted — make them inactive instead." onConfirm={() => del.mutateAsync(c._id)}><Trash2 className="h-4 w-4" /></ConfirmButton>
            </li>
          ))}
        </ul>
      )}
      {editing && <CategoryForm item={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </Card>
  )
}
