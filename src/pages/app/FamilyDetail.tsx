import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, X } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { fullName, titleCase } from '../../lib/format'
import type { Member } from '../../lib/types'
import { MemberSearch } from '../../components/pickers'
import { Avatar, Button, Card, ConfirmButton, Empty, ErrorNote, PageHeader, SelectInput, Spinner, useToast } from '../../components/ui'
import { FamilyForm } from './Families'

interface Family { _id: string; name: string; address?: string; phone?: string; members: Member[] }

export default function FamilyDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [role, setRole] = useState('child')
  const q = useQuery({ queryKey: ['family', id], queryFn: () => api.get<Family>(`/families/${id}`) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['family', id] }); qc.invalidateQueries({ queryKey: ['families'] }) }
  const add = useMutation({ mutationFn: (memberId: string) => api.post(`/families/${id}/members`, { memberId, familyRole: role }), onSuccess: () => { refresh(); toast('Added to family') }, onError: (e) => toast(errorMessage(e), 'error') })
  const removeMember = useMutation({ mutationFn: (memberId: string) => api.del(`/families/${id}/members/${memberId}`), onSuccess: refresh, onError: (e) => toast(errorMessage(e), 'error') })
  const del = useMutation({ mutationFn: () => api.del(`/families/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['families'] }); nav('/app/families') } })

  if (q.isLoading) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} />
  const f = q.data!
  return (
    <>
      <PageHeader title={f.name} description={[f.address, f.phone].filter(Boolean).join(' · ')}
        back={<Link to="/app/families" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" />Families</Link>}
        actions={<Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title={`Household (${f.members.length})`} padded={false}>
          {f.members.length === 0 ? <div className="p-5"><Empty title="No one in this family yet">Add members from the panel on the right.</Empty></div> : (
            <ul className="divide-y divide-ink-100">
              {f.members.map((m) => (
                <li key={m._id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar person={m} size={34} />
                  <div className="min-w-0 flex-1"><Link to={`/app/members/${m._id}`} className="font-medium text-ink-900 hover:underline">{fullName(m)}</Link><div className="text-sm text-ink-500">{titleCase(m.familyRole) || 'Member'}{m.phone && ` · ${m.phone}`}</div></div>
                  <button onClick={() => removeMember.mutate(m._id)} className="rounded p-1.5 text-ink-400 hover:bg-ink-50 hover:text-red-600" aria-label={`Remove ${fullName(m)} from family`}><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Add to this family">
          <div className="space-y-4">
            <SelectInput label="As" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="head">Head</option><option value="spouse">Spouse</option><option value="child">Child</option><option value="relative">Relative</option>
            </SelectInput>
            <MemberSearch exclude={f.members.map((m) => m._id)} onPick={(m) => add.mutate(m._id)} />
            <p className="text-xs text-ink-400">Someone already in another family will be moved here.</p>
          </div>
          <div className="mt-6 border-t border-ink-100 pt-4">
            <ConfirmButton variant="danger" title="Delete this family?" message="The members are kept; they just won't belong to a family." onConfirm={() => del.mutateAsync()}>Delete family</ConfirmButton>
          </div>
        </Card>
      </div>
      {editing && <FamilyForm family={f} onClose={() => setEditing(false)} />}
    </>
  )
}
