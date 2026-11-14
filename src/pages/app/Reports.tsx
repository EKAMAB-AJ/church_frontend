import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Printer } from 'lucide-react'
import { api } from '../../lib/api'
import { compactMoney, date, money, titleCase, toDateInput } from '../../lib/format'
import { Button, Card, ErrorNote, PageHeader, Spinner, Stat, TextInput } from '../../components/ui'

interface Summary {
  totals: { income: number; expenses: number; net: number }
  byCategory: { category: string; total: number; count: number }[]
  byMethod: { method: string; total: number; count: number }[]
  monthly: { month: string; income: number; expenses: number; net: number }[]
  expensesByCategory: { category: string; total: number; count: number }[]
  topGivers: { member: { _id: string; name: string } | null; total: number; count: number }[]
}

const presets = (() => {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  const d = (a: Date) => toDateInput(new Date(a.getTime() - a.getTimezoneOffset() * 60000))
  const qStart = new Date(y, Math.floor(m / 3) * 3, 1)
  return [
    { label: 'This month', from: d(new Date(y, m, 1)), to: d(now) },
    { label: 'Last month', from: d(new Date(y, m - 1, 1)), to: d(new Date(y, m, 0)) },
    { label: 'This quarter', from: d(qStart), to: d(now) },
    { label: 'This year', from: d(new Date(y, 0, 1)), to: d(now) },
    { label: 'Last year', from: d(new Date(y - 1, 0, 1)), to: d(new Date(y - 1, 11, 31)) },
  ]
})()

function Breakdown({ title, rows, total }: { title: string; rows: { label: string; total: number; count: number }[]; total: number }) {
  return (
    <Card title={title} padded={false}>
      {rows.length === 0 ? <p className="p-5 text-sm text-ink-400">Nothing in this period.</p> : (
        <ul className="divide-y divide-ink-100">
          {rows.map((r) => (
            <li key={r.label} className="px-5 py-3">
              <div className="flex justify-between gap-3 text-sm"><span className="text-ink-800">{r.label} <span className="text-ink-400">({r.count})</span></span><span className="font-medium tabular-nums">{money(r.total)}</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-50"><div className="h-full rounded-full bg-ink-600" style={{ width: `${total ? (r.total / total) * 100 : 0}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function Reports() {
  const [range, setRange] = useState({ from: presets[3].from, to: presets[3].to })
  const q = useQuery({ queryKey: ['report', range], queryFn: () => api.get<Summary>('/giving/reports/summary', range), placeholderData: keepPreviousData })
  const r = q.data
  return (
    <>
      <PageHeader title="Finance reports" description={`${date(range.from)} – ${date(range.to)}`} actions={<Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>} />
      <div className="mb-6 flex flex-wrap items-end gap-3 print:hidden">
        {presets.map((p) => <Button key={p.label} size="sm" variant={range.from === p.from && range.to === p.to ? 'primary' : 'secondary'} onClick={() => setRange({ from: p.from, to: p.to })}>{p.label}</Button>)}
        <TextInput aria-label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="w-40" />
        <TextInput aria-label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="w-40" />
      </div>
      {q.isLoading ? <Spinner /> : q.error ? <ErrorNote error={q.error} onRetry={() => q.refetch()} /> : r && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Income" value={money(r.totals.income)} />
            <Stat label="Expenses" value={money(r.totals.expenses)} />
            <Stat label="Net" value={<span className={r.totals.net < 0 ? 'text-red-600' : ''}>{money(r.totals.net)}</span>} />
          </div>
          {r.monthly.length > 0 && (
            <Card title="Month by month">
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={r.monthly.map((m) => ({ ...m, name: new Date(`${m.month}-01T00:00:00`).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' }) }))} margin={{ left: -4, right: 4 }}>
                    <CartesianGrid vertical={false} stroke="#e8edf3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#7a8ba0" />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#7a8ba0" tickFormatter={compactMoney} />
                    <Tooltip cursor={{ fill: '#f3f6f9' }} formatter={(v) => money(Number(v))} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="income" name="Income" fill="#2e4e72" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses" name="Expenses" fill="#c9a861" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <Breakdown title="Income by category" rows={r.byCategory.map((x) => ({ label: x.category, total: x.total, count: x.count }))} total={r.totals.income} />
            <Breakdown title="Expenses by category" rows={r.expensesByCategory.map((x) => ({ label: x.category, total: x.total, count: x.count }))} total={r.totals.expenses} />
            <Breakdown title="Income by method" rows={r.byMethod.map((x) => ({ label: x.method === 'pos' ? 'POS' : titleCase(x.method), total: x.total, count: x.count }))} total={r.totals.income} />
            <Card title="Top givers" padded={false}>
              {r.topGivers.length === 0 ? <p className="p-5 text-sm text-ink-400">No member giving recorded.</p> : (
                <ol className="divide-y divide-ink-100">
                  {r.topGivers.map((g, i) => (
                    <li key={g.member?._id || i} className="flex justify-between gap-3 px-5 py-2.5 text-sm">
                      <span><span className="mr-2 text-ink-400 tabular-nums">{i + 1}.</span>{g.member ? <Link to={`/app/members/${g.member._id}`} className="text-ink-800 hover:underline">{g.member.name}</Link> : 'Unknown'}</span>
                      <span className="font-medium tabular-nums">{money(g.total)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
