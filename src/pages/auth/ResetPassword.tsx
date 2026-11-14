import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { Button } from '../../components/ui'
import AuthShell from './AuthShell'
import { PasswordFields } from './AcceptInvite'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) return
    setBusy(true); setError(''); setErrors({})
    try { setDone((await api.post<{ message: string }>('/auth/reset-password', { token, password })).message) } catch (err) { setErrors(fieldErrors(err)); setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <AuthShell title="Choose a new password">
      {done ? (
        <div className="space-y-4"><p className="rounded-lg bg-emerald-50 p-4 text-emerald-800">{done}</p><Link to="/login" className="font-medium underline">Sign in</Link></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <PasswordFields {...{ password, confirm, setPassword, setConfirm }} error={errors.password} />
          {error && !errors.password && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <Button type="submit" loading={busy} className="w-full" disabled={!token || !password || password !== confirm}>Update password</Button>
        </form>
      )}
    </AuthShell>
  )
}
