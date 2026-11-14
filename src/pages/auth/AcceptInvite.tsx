import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import type { Me } from '../../lib/types'
import { Button, TextInput } from '../../components/ui'
import AuthShell from './AuthShell'

export function PasswordFields({ password, confirm, setPassword, setConfirm, error }: { password: string; confirm: string; setPassword: (v: string) => void; setConfirm: (v: string) => void; error?: string }) {
  return (
    <>
      <TextInput label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required
        hint="At least 8 characters, with letters and numbers." error={error} />
      <TextInput label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required
        error={confirm && confirm !== password ? "Passwords don't match" : undefined} />
    </>
  )
}

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { acceptSession } = useAuth()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) return
    setBusy(true); setError(''); setErrors({})
    try {
      const r = await api.post<{ token: string; user: Me }>('/auth/accept-invite', { token, password })
      acceptSession(r.token, r.user)
      nav('/app', { replace: true })
    } catch (err) { setErrors(fieldErrors(err)); setError(errorMessage(err)); setBusy(false) }
  }
  if (!token) return <AuthShell title="Invite link missing" text="Open the link from your invite email again, or ask the church office for a new one."><Link to="/login" className="font-medium underline">Go to sign in</Link></AuthShell>
  return (
    <AuthShell title="Welcome! Set your password" text="Choose a password to finish setting up your account.">
      <form onSubmit={submit} className="space-y-4">
        <PasswordFields {...{ password, confirm, setPassword, setConfirm }} error={errors.password} />
        {error && !errors.password && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <Button type="submit" loading={busy} className="w-full" disabled={!password || password !== confirm}>Set password and continue</Button>
      </form>
    </AuthShell>
  )
}
