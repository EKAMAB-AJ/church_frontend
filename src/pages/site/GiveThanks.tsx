import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { money } from '../../lib/format'
import { Spinner } from '../../components/ui'

interface Result { status: string; amount: number; currency: string; category?: string; donorName?: string; reference: string }

export default function GiveThanks() {
  const [params] = useSearchParams()
  const reference = params.get('reference') || params.get('trxref') || ''
  const q = useQuery({
    queryKey: ['give-verify', reference], enabled: Boolean(reference),
    queryFn: () => api.get<Result>(`/giving/online/verify/${encodeURIComponent(reference)}`),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
  })
  const r = q.data
  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      {!reference ? <p className="text-ink-600">No payment reference found.</p> : q.isLoading ? <Spinner label="Confirming your payment…" /> : !r ? <p className="text-ink-600">We couldn't find that payment. If you were charged, please contact the church office.</p> : r.status === 'success' ? (
        <>
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden />
          <h1 className="mt-4 font-serif text-3xl font-semibold text-ink-900">Thank you{r.donorName ? `, ${r.donorName.split(' ')[0]}` : ''}!</h1>
          <p className="mt-3 text-ink-600">Your {r.category?.toLowerCase() || 'gift'} of <b>{money(r.amount, r.currency)}</b> was received. A receipt is on its way to your email.</p>
          <p className="mt-2 text-sm text-ink-400">Reference {r.reference}</p>
        </>
      ) : r.status === 'pending' ? (
        <><Clock className="mx-auto h-14 w-14 text-amber-500" aria-hidden /><h1 className="mt-4 font-serif text-3xl font-semibold">Confirming your payment…</h1><p className="mt-3 text-ink-600">This page updates automatically.</p></>
      ) : (
        <><XCircle className="mx-auto h-14 w-14 text-red-500" aria-hidden /><h1 className="mt-4 font-serif text-3xl font-semibold">Payment not completed</h1><p className="mt-3 text-ink-600">No money was taken. You can try again.</p></>
      )}
      <Link to="/" className="mt-8 inline-block text-sm font-medium text-ink-700 underline underline-offset-4">Back to home</Link>
    </div>
  )
}
