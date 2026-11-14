import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { date, money, titleCase, toDateInput } from '../../lib/format'
import type { Expense } from '../../lib/types'
import { Button, Card, ConfirmButton, Empty, ErrorNote, Modal, PageHeader, Pagination, SelectInput, Spinner, Table, TextInput, useToast } from '../../components/ui'

function ExpenseForm({ item, categories, onClose }: { item?: Expense; categories: string[]; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [f, setF] = useState({ title: item?.title || '', category: item?.category || '', amount: item ? String(item.amount) : '', date: toDateInput(item?.date || new Date()), paidTo: item?.paidTo || '', method: item?.method || 'transfer', reference: item?.reference || '', note: item?.note || '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () => { const body = { ...f, amount: Number(f.amount) }; return item ? api.patch(`/giving/expenses/${item._id}`, body) : api.post('/giving/expenses', body) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast('Expense saved'); onClose() },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  return (
    <Modal open onClose={onClose} title={item ? 'Edit expense' : 'Record an expense'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="What was it for?" placeholder="Diesel for generator" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} className="sm:col-span-2" autoFocus />
        <div>
          <TextInput label="Category" list="expense-cats" placeholder="Utilities, Welfare…" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <datalist id="expense-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <TextInput label="Amount (₦)" type="number" min={0} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} error={errors.amount} />
        <TextInput label="Date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <SelectInput label="Paid by" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{['cash', 'transfer', 'pos', 'cheque'].map((m) => <option key={m} value={m}>{m === 'pos' ? 'POS' : titleCase(m)}</option>)}</SelectInput>
        <TextInput label="Paid to" value={f.paidTo} onChange={(e) => setF({ ...f, paidTo: e.target.value })} />
        <TextInput label="Reference" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
        <TextInput label="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className="sm:col-span-2" />
      </div>
    </Modal>
  )
}

export default function Expenses() {
  const qc = useQueryClient()
  const toast = useToast()
  const monthStart = new Date(); monthStart.setDate(1)
  const [filters, setFilters] = useState({ from: toDateInput(monthStart), to: toDateInput(new Date()), category: '' })
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Expense | 'new' | null>(null)
  const query = { ...filters, page, limit: 30 }
  const q = useQuery({ queryKey: ['expenses', query], queryFn: () => api.page<Expense>('/giving/expenses', query), placeholderData: keepPreviousData })
  const del = useMutation({ mutationFn: (id: string) => api.del(`/giving/expenses/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast('Deleted') } })
  const categories = (q.data?.meta.categories as string[] | undefined) || []
  const set = (k: keyof typeof filters, v: string) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1) }
  return (
    <>
      <PageHeader title="Expenses" description="What the church has spent, so the reports show the full picture." actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Record expense</Button>} />
      <Card padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-ink-100 p-4">
          <TextInput label="From" type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className="w-40" />
          <TextInput label="To" type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className="w-40" />
          <SelectInput label="Category" value={filters.category} onChange={(e) => set('category', e.target.value)} className="w-44"><option value="">All</option>{categories.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}</SelectInput>
        </div>
        {q.data && <div className="flex items-baseline gap-2 border-b border-ink-100 px-5 py-3 text-sm text-ink-500"><span className="text-xl font-semibold text-ink-900">{money(q.data.meta.sum || 0)}</span>spent across {q.data.meta.total} expense{q.data.meta.total === 1 ? '' : 's'}</div>}
        {q.isLoading ? <Spinner /> : q.error ? <div className="p-5"><ErrorNote error={q.error} /></div> : q.data!.items.length === 0 ? <div className="p-6"><Empty title="No expenses in this period" /></div> : (
          <>
            <Table head={['Date', 'Expense', 'Category', 'Paid to', 'Amount', '']} hideOnMobile={[2, 3]}>
              {q.data!.items.map((x) => (
                <tr key={x._id}>
                  <td className="whitespace-nowrap text-ink-600">{date(x.date)}</td>
                  <td className="font-medium text-ink-900">{x.title}</td>
                  <td className="text-ink-600">{x.category || 'General'}</td>
                  <td className="text-ink-600">{x.paidTo || '—'}</td>
                  <td className="whitespace-nowrap text-right font-medium tabular-nums">{money(x.amount)}</td>
                  <td className="whitespace-nowrap text-right">
                    <button onClick={() => setEditing(x)} className="rounded p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <ConfirmButton title="Delete this expense?" message={`${x.title} · ${money(x.amount)}`} onConfirm={() => del.mutateAsync(x._id)}><Trash2 className="h-4 w-4" /></ConfirmButton>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={q.data!.meta.page} pages={q.data!.meta.pages} onPage={setPage} />
          </>
        )}
      </Card>
      {editing && <ExpenseForm item={editing === 'new' ? undefined : editing} categories={categories} onClose={() => setEditing(null)} />}
    </>
  )
}
