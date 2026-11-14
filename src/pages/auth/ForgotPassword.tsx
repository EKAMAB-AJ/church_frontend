import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../../lib/api'
import { Button, TextInput } from '../../components/ui'
import AuthShell from './AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try { setDone((await api.post<{ message: string }>('/auth/forgot-password', { email })).message) } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <AuthShell title="Reset your password" text="We'll email you a link to choose a new one." foot={<Link to="/login" className="font-medium text-ink-700 hover:text-ink-900">Back to sign in</Link>}>
      {done ? <p className="rounded-lg bg-emerald-50 p-4 text-emerald-800">{done}</p> : (
        <form onSubmit={submit} className="space-y-4">
          <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <Button type="submit" loading={busy} className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  )
}
