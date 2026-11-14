import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, CreditCard, Lock } from 'lucide-react'
import clsx from 'clsx'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useSite } from '../../lib/site'
import { useAuth } from '../../lib/auth'
import type { Category } from '../../lib/types'
import { Button, SelectInput, Spinner, TextInput } from '../../components/ui'
import { PageHero } from './About'

const presets = [1000, 5000, 10000, 20000, 50000]

export default function Give() {
  const site = useSite()
  const { user } = useAuth()
  const cats = useQuery({ queryKey: ['give-cats'], queryFn: () => api.get<Category[]>('/public/giving-categories') })
  const [form, setForm] = useState({ category: '', amount: '', name: user ? `${user.firstName} ${user.lastName}` : '', email: user?.email || '', phone: user?.phone || '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({}); setError('')
    try {
      const r = await api.post<{ authorizationUrl: string }>('/giving/online/initialize', { ...form, category: form.category || cats.data?.[0]?._id, amount: Number(form.amount) })
      window.location.href = r.authorizationUrl
    } catch (err) {
      setErrors(fieldErrors(err)); setError(errorMessage(err)); setBusy(false)
    }
  }

  if (site.isLoading || cats.isLoading) return <Spinner />
  const s = site.data!.site
  const online = site.data!.onlineGiving

  return (
    <>
      <PageHero title="Give" text="Thank you for supporting the work of the church. Every gift makes a difference." />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-ink-900"><CreditCard className="h-5 w-5 text-brass-600" aria-hidden />Give online</h2>
          {!online ? <p className="mt-3 text-ink-600">Online giving isn't available yet. You can give by bank transfer.</p> : (
            <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
              <SelectInput label="What is this for?" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} error={errors.category}>
                {(cats.data || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </SelectInput>
              <div>
                <span className="label">Amount (₦)</span>
                <div className="mb-2 flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button type="button" key={p} onClick={() => setForm({ ...form, amount: String(p) })}
                      className={clsx('rounded-lg border px-3 py-1.5 text-sm font-medium', Number(form.amount) === p ? 'border-ink-700 bg-ink-700 text-white' : 'border-ink-200 text-ink-700 hover:bg-ink-50')}>
                      ₦{p.toLocaleString()}
                    </button>
                  ))}
                </div>
                <TextInput aria-label="Amount" type="number" inputMode="decimal" min={100} placeholder="Other amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} error={errors.amount} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                <TextInput label="Email (for your receipt)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" required />
              </div>
              {error && !Object.keys(errors).length && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" loading={busy} className="w-full sm:w-auto">Continue to secure payment</Button>
              <p className="flex items-center gap-1.5 text-[13px] text-ink-400"><Lock className="h-3.5 w-3.5" aria-hidden />Payments are processed securely by Paystack. Card details never touch our servers.</p>
            </form>
          )}
        </div>
        {(s.bank.accountNumber || s.bank.bankName) && (
          <div className="h-fit rounded-2xl bg-ink-800 p-6 text-white sm:p-8">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold"><Building2 className="h-5 w-5 text-brass-300" aria-hidden />Bank transfer</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-ink-300">Bank</dt><dd className="text-lg font-semibold">{s.bank.bankName}</dd></div>
              <div><dt className="text-ink-300">Account name</dt><dd className="text-lg font-semibold">{s.bank.accountName}</dd></div>
              <div><dt className="text-ink-300">Account number</dt><dd className="font-serif text-3xl font-semibold tracking-wider">{s.bank.accountNumber}</dd></div>
            </dl>
            <p className="mt-5 text-sm text-ink-300">Add your name and what the gift is for in the transfer narration.</p>
          </div>
        )}
      </div>
    </>
  )
}
