import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api, errorMessage, fieldErrors, tokenStore } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { date, money, titleCase, toDateInput } from '../../lib/format'
import type { Contribution, Service } from '../../lib/types'
import ImageUpload from '../../components/ImageUpload'
import { Avatar, Badge, Button, Card, Empty, PageHeader, SelectInput, Spinner, Table, Tabs, TextInput, useToast } from '../../components/ui'

type Tab = 'details' | 'giving' | 'attendance' | 'security'

export default function Profile() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'details'
  const { user } = useAuth()
  return (
    <>
      <PageHeader title="My profile" description={<span className="flex items-center gap-2"><Avatar person={user} size={22} />{user?.firstName} {user?.lastName} · <Badge tone="blue">{titleCase(user?.role)}</Badge></span>} />
      <div className="mb-5"><Tabs value={tab} onChange={(v) => setParams(v === 'details' ? {} : { tab: v })} tabs={[
        { value: 'details', label: 'My details' }, { value: 'giving', label: 'My giving' }, { value: 'attendance', label: 'My attendance' }, { value: 'security', label: 'Password' },
      ]} /></div>
      {tab === 'details' && <Details />}
      {tab === 'giving' && <MyGiving />}
      {tab === 'attendance' && <MyAttendance />}
      {tab === 'security' && <Security />}
    </>
  )
}

function Details() {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ photoUrl: user?.photoUrl || '', phone: user?.phone || '', address: user?.address || '', occupation: user?.occupation || '', gender: user?.gender || '', maritalStatus: user?.maritalStatus || '', dateOfBirth: toDateInput(user?.dateOfBirth), weddingAnniversary: toDateInput(user?.weddingAnniversary) })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () => api.patch('/auth/me', { ...f, dateOfBirth: f.dateOfBirth || null, weddingAnniversary: f.weddingAnniversary || null }),
    onSuccess: async () => { await refresh(); toast('Your details are saved') },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  const submit = (e: FormEvent) => { e.preventDefault(); setErrors({}); save.mutate() }
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card title="Contact & personal details">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <ImageUpload label="My photo" kind="profile" shape="round" value={f.photoUrl} onChange={(url) => setF({ ...f, photoUrl: url })} className="sm:col-span-2" hint="Helps leaders and the welcome team put a face to your name." />
          <TextInput label="Name" value={`${user?.firstName} ${user?.lastName}`} disabled hint="Ask the church office to correct your name." />
          <TextInput label="Email" value={user?.email || ''} disabled hint="Used to sign in." />
          <TextInput label="Phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={errors.phone} />
          <TextInput label="Occupation" value={f.occupation} onChange={(e) => setF({ ...f, occupation: e.target.value })} />
          <TextInput label="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="sm:col-span-2" />
          <SelectInput label="Gender" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value as typeof f.gender })}><option value="">—</option><option value="male">Male</option><option value="female">Female</option></SelectInput>
          <TextInput label="Date of birth" type="date" value={f.dateOfBirth} onChange={(e) => setF({ ...f, dateOfBirth: e.target.value })} />
          <SelectInput label="Marital status" value={f.maritalStatus} onChange={(e) => setF({ ...f, maritalStatus: e.target.value })}><option value="">—</option><option value="single">Single</option><option value="married">Married</option><option value="widowed">Widowed</option><option value="divorced">Divorced</option></SelectInput>
          {f.maritalStatus === 'married' && <TextInput label="Wedding anniversary" type="date" value={f.weddingAnniversary} onChange={(e) => setF({ ...f, weddingAnniversary: e.target.value })} />}
          <div className="sm:col-span-2"><Button type="submit" loading={save.isPending}>Save my details</Button></div>
        </form>
      </Card>
      <Card title="My units">
        {!user?.unitList.length ? <p className="text-sm text-ink-500">You're not in a unit yet.</p> : (
          <ul className="space-y-2">{user.unitList.map((u) => <li key={u._id}><Link to={`/app/units/${u._id}`} className="flex items-center justify-between text-sm font-medium text-ink-800 hover:underline">{u.name}{user.ledUnits.some((l) => l._id === u._id) && <Badge tone="brass">Leader</Badge>}</Link></li>)}</ul>
        )}
      </Card>
    </div>
  )
}

function MyGiving() {
  const q = useQuery({ queryKey: ['my-giving'], queryFn: () => api.get<{ items: Contribution[]; totals: { thisYear: number; allTime: number } }>('/giving/mine') })
  if (q.isLoading) return <Spinner />
  const d = q.data
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-sm text-ink-500">This year</div><div className="mt-1 text-2xl font-semibold text-ink-900">{money(d?.totals.thisYear)}</div></div>
        <div className="card p-5"><div className="text-sm text-ink-500">All recorded giving</div><div className="mt-1 text-2xl font-semibold text-ink-900">{money(d?.totals.allTime)}</div></div>
        <Link to="/give" className="flex flex-col justify-center rounded-xl bg-ink-800 p-5 text-white hover:bg-ink-900"><span className="text-sm text-ink-200">Give online</span><span className="mt-1 font-semibold">Make a gift now →</span></Link>
      </div>
      <Card padded={false} title="History">
        {!d?.items.length ? <div className="p-5"><Empty title="No giving recorded yet">Gifts made online while signed in, and those the office records for you, show up here.</Empty></div> : (
          <Table head={['Date', 'Category', 'Method', 'Amount']}>
            {d.items.map((c) => <tr key={c._id}><td className="whitespace-nowrap text-ink-600">{date(c.date)}</td><td>{c.category?.name}</td><td className="text-ink-600">{c.method === 'pos' ? 'POS' : titleCase(c.method)}</td><td className="text-right font-medium tabular-nums">{money(c.amount)}</td></tr>)}
          </Table>
        )}
      </Card>
    </div>
  )
}

function MyAttendance() {
  const q = useQuery({ queryKey: ['my-attendance'], queryFn: () => api.get<{ _id: string; service: Service; markedAt: string }[]>('/services/attendance/me') })
  if (q.isLoading) return <Spinner />
  return (
    <Card padded={false} title="Services and meetings you were marked present at">
      {!q.data?.length ? <div className="p-5"><Empty title="No attendance yet">Leaders mark attendance after each service or meeting.</Empty></div> : (
        <Table head={['Date', 'Service']}>
          {q.data.map((r) => <tr key={r._id}><td className="whitespace-nowrap text-ink-600">{date(r.service.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td><td className="font-medium text-ink-900">{r.service.title}{r.service.unit && <span className="ml-2 text-sm font-normal text-ink-500">{r.service.unit.name}</span>}</td></tr>)}
        </Table>
      )}
    </Card>
  )
}

function Security() {
  const { signOut } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const change = useMutation({
    mutationFn: () => api.post<{ token: string; message: string }>('/auth/change-password', { currentPassword: f.currentPassword, newPassword: f.newPassword }),
    onSuccess: (r) => { tokenStore.set(r.token); setF({ currentPassword: '', newPassword: '', confirm: '' }); toast(r.message) },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  const all = useMutation({ mutationFn: () => api.post('/auth/logout-all'), onSuccess: () => signOut() })
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Change password">
        <form onSubmit={(e) => { e.preventDefault(); setErrors({}); change.mutate() }} className="space-y-4">
          <TextInput label="Current password" type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} />
          <TextInput label="New password" type="password" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} error={errors.newPassword} hint="At least 8 characters, with letters and numbers." />
          <TextInput label="Confirm new password" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} error={f.confirm && f.confirm !== f.newPassword ? "Passwords don't match" : undefined} />
          <Button type="submit" loading={change.isPending} disabled={!f.currentPassword || !f.newPassword || f.newPassword !== f.confirm}>Change password</Button>
        </form>
      </Card>
      <Card title="Signed in somewhere else?">
        <p className="mb-4 text-sm text-ink-600">Sign out of the app on every phone and computer, including this one.</p>
        <Button variant="secondary" loading={all.isPending} onClick={() => all.mutate()}>Sign out everywhere</Button>
      </Card>
    </div>
  )
}
