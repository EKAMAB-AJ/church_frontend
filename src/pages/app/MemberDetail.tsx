import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, KeyRound, Mail, MessageCircle, Pencil, Phone } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { date, fullName, money, telLink, titleCase, waLink } from '../../lib/format'
import type { Member, Role } from '../../lib/types'
import MemberForm from '../../components/MemberForm'
import { Avatar, Badge, Button, Card, Checkbox, ConfirmButton, ErrorNote, Modal, PageHeader, SelectInput, Spinner, useToast } from '../../components/ui'

type Detail = Member & { stats: { attendance90: number; givingByYear?: { year: number; total: number; count: number }[] }; familyMembers: { _id: string; firstName: string; lastName: string; familyRole?: string; phone?: string }[] }

export default function MemberDetail() {
  const { id } = useParams()
  const { user, can } = useAuth()
  const nav = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [access, setAccess] = useState(false)
  const q = useQuery({ queryKey: ['member', id], queryFn: () => api.get<Detail>(`/members/${id}`) })
  const remove = useMutation({ mutationFn: () => api.del(`/members/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); toast('Member deleted'); nav('/app/members') }, onError: (e) => toast(errorMessage(e), 'error') })
  const revoke = useMutation({ mutationFn: () => api.del(`/members/${id}/access`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['member', id] }); toast('App access removed') }, onError: (e) => toast(errorMessage(e), 'error') })

  if (q.isLoading) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} onRetry={() => q.refetch()} />
  const m = q.data!
  const isMe = m._id === user?._id
  const staff = can('admin', 'leader')
  const row = (label: string, value?: React.ReactNode) => value ? <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 text-sm"><dt className="text-ink-500">{label}</dt><dd className="text-ink-900">{value}</dd></div> : null

  return (
    <>
      <PageHeader title={fullName(m)}
        back={staff ? <Link to="/app/members" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" />Members</Link> : undefined}
        description={<span className="flex flex-wrap items-center gap-2">
          <Badge tone={m.membershipStatus === 'active' ? 'green' : 'gray'}>{titleCase(m.membershipStatus)}</Badge>
          {m.canLogin && <Badge tone={m.role === 'admin' ? 'brass' : 'blue'}>{titleCase(m.role)} · has app access</Badge>}
          {m.joinedAt && <span>Member since {date(m.joinedAt, { month: 'long', year: 'numeric' })}</span>}
        </span>}
        actions={<>
          {staff && <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>}
          {can('admin') && <Button variant="secondary" onClick={() => setAccess(true)}><KeyRound className="h-4 w-4" />{m.canLogin ? 'App access' : 'Give app access'}</Button>}
        </>} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar person={m} size={64} />
              <div className="space-y-1 text-sm">
                {m.phone && <a href={telLink(m.phone)} className="flex items-center gap-2 text-ink-700 hover:underline"><Phone className="h-4 w-4 text-ink-400" />{m.phone}</a>}
                {m.email && <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-ink-700 hover:underline"><Mail className="h-4 w-4 text-ink-400" />{m.email}</a>}
                {m.phone && <a href={waLink(m.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-700 hover:underline"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-ink-50 p-3"><div className="text-xs text-ink-500">Services, last 90 days</div><div className="text-xl font-semibold text-ink-900">{m.stats.attendance90}</div></div>
              {m.stats.givingByYear && <div className="rounded-lg bg-ink-50 p-3"><div className="text-xs text-ink-500">Giving {new Date().getFullYear()}</div><div className="text-xl font-semibold text-ink-900">{money(m.stats.givingByYear.find((g) => g.year === new Date().getFullYear())?.total || 0)}</div></div>}
            </div>
          </Card>
          {(m.family || m.familyMembers.length > 0) && (
            <Card title={m.family?.name || 'Family'} actions={can('admin') && m.family ? <Link to={`/app/families/${m.family._id}`} className="text-sm text-ink-500 hover:text-ink-800">Open family</Link> : undefined} padded={false}>
              <ul className="divide-y divide-ink-100">
                {m.familyMembers.map((f) => (
                  <li key={f._id}><Link to={`/app/members/${f._id}`} className="flex justify-between px-5 py-3 text-sm hover:bg-ink-50"><span className="font-medium text-ink-800">{fullName(f)}</span><span className="text-ink-500">{titleCase(f.familyRole) || ''}</span></Link></li>
                ))}
              </ul>
            </Card>
          )}
          {m.stats.givingByYear && m.stats.givingByYear.length > 0 && (
            <Card title="Giving by year" padded={false}>
              <ul className="divide-y divide-ink-100 text-sm">{m.stats.givingByYear.map((g) => <li key={g.year} className="flex justify-between px-5 py-2.5"><span>{g.year}</span><span className="font-medium">{money(g.total)} <span className="text-ink-400">({g.count})</span></span></li>)}</ul>
            </Card>
          )}
        </div>
        <Card title="Details">
          <dl className="divide-y divide-ink-100">
            {row('Gender', titleCase(m.gender))}
            {row('Date of birth', m.dateOfBirth && date(m.dateOfBirth, { day: 'numeric', month: 'long', year: 'numeric' }))}
            {row('Marital status', titleCase(m.maritalStatus))}
            {row('Anniversary', m.weddingAnniversary && date(m.weddingAnniversary, { day: 'numeric', month: 'long', year: 'numeric' }))}
            {row('Address', m.address)}
            {row('Occupation', m.occupation)}
            {row('Units', (m.units || []).length ? <span className="flex flex-wrap gap-1.5">{m.units!.map((u) => <Link key={u._id} to={`/app/units/${u._id}`}><Badge>{u.name}</Badge></Link>)}</span> : undefined)}
            {row('Baptised', m.baptized ? 'Yes' : undefined)}
            {row('Last sign-in', m.lastLoginAt && date(m.lastLoginAt))}
            {staff && row('Notes', m.notes && <span className="whitespace-pre-line">{m.notes}</span>)}
          </dl>
          {can('admin') && !isMe && (
            <div className="mt-6 border-t border-ink-100 pt-4">
              <ConfirmButton variant="danger" title={`Delete ${m.firstName}?`} message="This removes the member and their attendance records. Giving records are kept for the accounts. To keep their history, set their status to inactive instead." onConfirm={() => remove.mutateAsync()}>Delete member</ConfirmButton>
            </div>
          )}
        </Card>
      </div>
      {editing && <MemberForm open member={m} onClose={() => setEditing(false)} />}
      {access && <AccessModal member={m} onClose={() => setAccess(false)} onRevoke={() => revoke.mutateAsync()} isMe={isMe} />}
    </>
  )
}

function AccessModal({ member, onClose, onRevoke, isMe }: { member: Member; onClose: () => void; onRevoke: () => Promise<unknown>; isMe: boolean }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [role, setRole] = useState<Role>(member.canLogin ? member.role : 'member')
  const [sendInvite, setSendInvite] = useState(!member.canLogin)
  const [link, setLink] = useState('')
  const grant = useMutation({
    mutationFn: () => api.post<{ member: Member; inviteLink?: string }>(`/members/${member._id}/access`, { role, sendInvite }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['member', member._id] }); qc.invalidateQueries({ queryKey: ['members'] })
      if (r.inviteLink) setLink(r.inviteLink); else { toast('Access updated'); onClose() }
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  return (
    <Modal open onClose={onClose} title={`App access for ${member.firstName}`}
      footer={link ? <Button onClick={onClose}>Done</Button> : <>
        {member.canLogin && !isMe && <ConfirmButton variant="danger" size="md" title="Remove app access?" message={`${member.firstName} will be signed out and won't be able to sign in.`} confirmLabel="Remove access" onConfirm={async () => { await onRevoke(); onClose() }}>Remove access</ConfirmButton>}
        <span className="flex-1" />
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={grant.isPending} onClick={() => grant.mutate()}>{member.canLogin ? 'Save' : 'Give access'}</Button>
      </>}>
      {link ? (
        <div className="space-y-3 text-sm">
          <p className="text-ink-700">{member.email ? `We've emailed an invite to ${member.email}.` : `${member.firstName} has no email on file.`} You can also send this link by WhatsApp or SMS — it's valid for 7 days.</p>
          <div className="flex gap-2"><input className="input text-xs" readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Invite link" />
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(link).then(() => toast('Link copied'))}><Copy className="h-4 w-4" />Copy</Button></div>
          {member.phone && <a className="inline-block font-medium text-emerald-700 hover:underline" target="_blank" rel="noreferrer" href={`${waLink(member.phone)}?text=${encodeURIComponent(`Hello ${member.firstName}, here's your link to set up the church app: ${link}`)}`}>Send on WhatsApp</a>}
        </div>
      ) : (
        <div className="space-y-4">
          <SelectInput label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isMe}
            hint={role === 'admin' ? 'Admins can see and change everything, including finances.' : role === 'leader' ? 'Leaders manage the members, attendance and messages of the units they lead.' : 'Members see their own profile, giving, units and events.'}>
            <option value="member">Member</option><option value="leader">Leader</option><option value="admin">Admin</option>
          </SelectInput>
          <Checkbox label={member.canLogin ? 'Send a new set-password link' : 'Create an invite link'} hint={member.email ? `Emailed to ${member.email}` : 'No email on file — you will get a link to share yourself.'} checked={sendInvite} onChange={setSendInvite} />
          {!member.email && !member.phone && <p className="text-sm text-amber-700">Add an email or phone number first so {member.firstName} can sign in.</p>}
        </div>
      )}
    </Modal>
  )
}
