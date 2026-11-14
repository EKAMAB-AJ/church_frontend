import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Mail, MessageSquare, Send } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { dateTime, fullName, titleCase } from '../../lib/format'
import type { Member } from '../../lib/types'
import { MemberMultiPicker, useUnits } from '../../components/pickers'
import { Badge, Button, Card, Checkbox, Empty, Pagination, PageHeader, SelectInput, Spinner, TextArea, TextInput, useToast } from '../../components/ui'

type AudienceType = 'all' | 'unit' | 'role' | 'members' | 'birthdays_today'
interface Sent { _id: string; subject?: string; body: string; channels: string[]; audience: { type: AudienceType }; recipients: number; status: 'sending' | 'sent' | 'partial' | 'failed'; results: Record<'email' | 'sms', { sent: number; failed: number; skipped: number }>; sentBy?: Member; createdAt: string }

const SMS_LEN = 160

export default function Messages() {
  const { can } = useAuth()
  const [params] = useSearchParams()
  const units = useUnits()
  const qc = useQueryClient()
  const toast = useToast()
  const isAdmin = can('admin')
  const myUnits = isAdmin ? units.data || [] : (units.data || []).filter((u) => u.iLead)
  const [type, setType] = useState<AudienceType>(params.get('unit') || !isAdmin ? 'unit' : 'all')
  const [unit, setUnit] = useState(params.get('unit') || '')
  const [role, setRole] = useState('leader')
  const [people, setPeople] = useState<{ _id: string; firstName?: string; lastName?: string }[]>([])
  const [channels, setChannels] = useState<string[]>(['sms'])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  useEffect(() => { if (!unit && myUnits.length && type === 'unit') setUnit(myUnits[0]._id) }, [myUnits, unit, type])

  const audience = { type, ...(type === 'unit' ? { unit } : {}), ...(type === 'role' ? { role } : {}), ...(type === 'members' ? { members: people.map((p) => p._id) } : {}) }
  const ready = (type !== 'unit' || unit) && (type !== 'members' || people.length)
  const preview = useQuery({
    queryKey: ['msg-preview', audience], enabled: Boolean(ready),
    queryFn: () => api.post<{ recipients: number; withEmail: number; withPhone: number }>('/messages/preview', { audience }),
  })
  const history = useQuery({
    queryKey: ['messages', page], queryFn: () => api.page<Sent>('/messages', { page, limit: 10 }), placeholderData: keepPreviousData,
    refetchInterval: (q) => (q.state.data?.items.some((m) => m.status === 'sending') ? 2500 : false),
  })
  const send = useMutation({
    mutationFn: () => api.post('/messages', { subject, body, channels, audience }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['messages'] }); setBody(''); setSubject(''); setErrors({}); toast('Sending now — progress shows below') },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  const toggle = (c: string, on: boolean) => setChannels((x) => (on ? [...new Set([...x, c])] : x.filter((y) => y !== c)))
  const smsParts = Math.max(1, Math.ceil(body.length / SMS_LEN))
  const p = preview.data

  return (
    <>
      <PageHeader title="Messages" description="Send announcements by SMS or email. Use {firstName} to greet each person by name." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card title="New message">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label="Send to" value={type} onChange={(e) => setType(e.target.value as AudienceType)}>
                {isAdmin && <option value="all">Every active member</option>}
                <option value="unit">A unit</option>
                {isAdmin && <option value="role">Everyone with a role</option>}
                <option value="members">Selected people</option>
                <option value="birthdays_today">Today's birthdays{isAdmin ? '' : ' in my units'}</option>
              </SelectInput>
              {type === 'unit' && <SelectInput label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} error={errors['audience.unit']}><option value="">Choose…</option>{myUnits.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</SelectInput>}
              {type === 'role' && <SelectInput label="Role" value={role} onChange={(e) => setRole(e.target.value)}><option value="leader">Leaders</option><option value="admin">Admins</option><option value="member">Members with app access</option></SelectInput>}
            </div>
            {type === 'members' && <MemberMultiPicker label="People" value={people} onChange={setPeople} />}
            <div className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600" aria-live="polite">
              {!ready ? 'Choose who to send to.' : preview.isLoading ? 'Counting recipients…' : preview.error ? errorMessage(preview.error) : p && (
                <><b className="text-ink-900">{p.recipients}</b> {p.recipients === 1 ? 'person' : 'people'} · {p.withPhone} with a phone number · {p.withEmail} with an email</>
              )}
            </div>
            <fieldset>
              <legend className="label">Send by</legend>
              <div className="flex gap-6"><Checkbox label="SMS" checked={channels.includes('sms')} onChange={(v) => toggle('sms', v)} /><Checkbox label="Email" checked={channels.includes('email')} onChange={(v) => toggle('email', v)} /></div>
              {errors.channels && <p className="mt-1 text-sm text-red-600">{errors.channels}</p>}
            </fieldset>
            {channels.includes('email') && <TextInput label="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} />}
            <TextArea label="Message" rows={6} value={body} onChange={(e) => setBody(e.target.value)} error={errors.body}
              placeholder="Hello {firstName}, a reminder that our thanksgiving service holds this Sunday at 8am. God bless you!"
              hint={channels.includes('sms') ? `${body.length} characters · ${smsParts} SMS page${smsParts > 1 ? 's' : ''} per person` : undefined} />
            <Button onClick={() => send.mutate()} loading={send.isPending} disabled={!ready || !body.trim() || !channels.length || p?.recipients === 0}>
              <Send className="h-4 w-4" />Send to {p?.recipients ?? '…'} {p?.recipients === 1 ? 'person' : 'people'}
            </Button>
          </div>
        </Card>
        <Card title="Sent" padded={false}>
          {history.isLoading ? <Spinner /> : !history.data?.items.length ? <div className="p-5"><Empty title="Nothing sent yet" /></div> : (
            <>
              <ul className="divide-y divide-ink-100">
                {history.data.items.map((m) => (
                  <li key={m._id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm text-ink-800">{m.subject ? <b>{m.subject}: </b> : null}{m.body}</p>
                      <Badge tone={m.status === 'sent' ? 'green' : m.status === 'sending' ? 'blue' : m.status === 'partial' ? 'amber' : 'red'}>{titleCase(m.status)}</Badge>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                      <span>{m.recipients} recipients</span>
                      {m.channels.includes('sms') && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{m.results.sms.sent} sent{m.results.sms.failed ? `, ${m.results.sms.failed} failed` : ''}</span>}
                      {m.channels.includes('email') && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{m.results.email.sent} sent{m.results.email.failed ? `, ${m.results.email.failed} failed` : ''}</span>}
                      <span>{m.sentBy ? fullName(m.sentBy) : ''} · {dateTime(m.createdAt)}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <Pagination page={history.data.meta.page} pages={history.data.meta.pages} onPage={setPage} />
            </>
          )}
        </Card>
      </div>
    </>
  )
}
