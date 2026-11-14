import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button, TextInput } from '../../components/ui'
import AuthShell from './AuthShell'

export default function Login() {
  const { user, signIn } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/app'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={from} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try { await signIn(identifier.trim(), password); nav(from, { replace: true }) } catch (err) { setError(errorMessage(err)); setBusy(false) }
  }
  return (
    <AuthShell title="Sign in" text="Use the email or phone number the church has on file for you."
      foot={<>Don't have access yet? Ask the church office to send you an invite.</>}>
      <form onSubmit={submit} className="space-y-4">
        <TextInput label="Email or phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required autoFocus />
        <div>
          <TextInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <Link to="/forgot-password" className="mt-1.5 inline-block text-sm text-ink-500 hover:text-ink-800">Forgot your password?</Link>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
    </AuthShell>
  )
}
