import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, errorMessage, fieldErrors } from '../lib/api'
import { useAuth } from '../lib/auth'
import { toDateInput } from '../lib/format'
import type { Member } from '../lib/types'
import { useUnits } from './pickers'
import ImageUpload from './ImageUpload'
import { Button, Checkbox, Modal, SelectInput, TextArea, TextInput, useToast } from './ui'

const blank = { photoUrl: '', firstName: '', lastName: '', otherNames: '', email: '', phone: '', gender: '', dateOfBirth: '', maritalStatus: '', weddingAnniversary: '', address: '', occupation: '', joinedAt: '', baptized: false, membershipStatus: 'active', units: [] as string[], family: '', familyRole: '', notes: '' }

export default function MemberForm({ open, onClose, member, onSaved }: { open: boolean; onClose: () => void; member?: Member; onSaved?: (m: Member) => void }) {
  const { user, can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const units = useUnits()
  const families = useQuery({ queryKey: ['families-all'], enabled: can('admin') && open, queryFn: () => api.page<{ _id: string; name: string }>('/families', { limit: 100 }) })
  const [f, setF] = useState(() => member ? {
    ...blank, ...Object.fromEntries(Object.entries(member).filter(([, v]) => v != null && typeof v !== 'object')),
    dateOfBirth: toDateInput(member.dateOfBirth), weddingAnniversary: toDateInput(member.weddingAnniversary), joinedAt: toDateInput(member.joinedAt),
    units: (member.units || []).map((u) => u._id), family: member.family?._id || '',
  } as typeof blank : { ...blank, units: can('leader') && user?.ledUnits.length === 1 ? [user.ledUnits[0]._id] : [] })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((x) => ({ ...x, [k]: v }))

  const selectable = can('admin') ? units.data || [] : (units.data || []).filter((u) => u.iLead)
  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = { ...f }
      for (const k of ['dateOfBirth', 'weddingAnniversary', 'joinedAt']) if (!body[k]) body[k] = null
      if (!can('admin')) { delete body.family; delete body.familyRole }
      return member ? api.patch<Member>(`/members/${member._id}`, body) : api.post<Member>('/members', body)
    },
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['member', m._id] })
      toast(member ? 'Member updated' : `${m.firstName} added`)
      onSaved?.(m); onClose()
    },
    onError: (e) => { setErrors(fieldErrors(e)); if (!Object.keys(fieldErrors(e)).length) toast(errorMessage(e), 'error') },
  })
  const submit = (e: FormEvent) => { e.preventDefault(); setErrors({}); save.mutate() }

  return (
    <Modal open={open} onClose={onClose} title={member ? `Edit ${member.firstName}` : 'Add a member'} wide
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="member-form" type="submit" loading={save.isPending}>{member ? 'Save changes' : 'Add member'}</Button></>}>
      <form id="member-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <ImageUpload label="Photo" kind="member" shape="round" value={f.photoUrl} onChange={(url) => set('photoUrl', url)} className="sm:col-span-2" hint="Optional. A clear, front-facing photo." />
        <TextInput label="First name" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} required />
        <TextInput label="Last name" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} required />
        <TextInput label="Phone" type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="0803 000 0000" />
        <TextInput label="Email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        <SelectInput label="Gender" value={f.gender} onChange={(e) => set('gender', e.target.value)}><option value="">—</option><option value="male">Male</option><option value="female">Female</option></SelectInput>
        <TextInput label="Date of birth" type="date" value={f.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} error={errors.dateOfBirth} />
        <SelectInput label="Marital status" value={f.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}>
          <option value="">—</option><option value="single">Single</option><option value="married">Married</option><option value="widowed">Widowed</option><option value="divorced">Divorced</option>
        </SelectInput>
        {f.maritalStatus === 'married' ? <TextInput label="Wedding anniversary" type="date" value={f.weddingAnniversary} onChange={(e) => set('weddingAnniversary', e.target.value)} /> : <TextInput label="Occupation" value={f.occupation} onChange={(e) => set('occupation', e.target.value)} />}
        <TextInput label="Address" value={f.address} onChange={(e) => set('address', e.target.value)} className="sm:col-span-2" />
        {f.maritalStatus === 'married' && <TextInput label="Occupation" value={f.occupation} onChange={(e) => set('occupation', e.target.value)} />}
        <TextInput label="Joined the church" type="date" value={f.joinedAt} onChange={(e) => set('joinedAt', e.target.value)} />
        <SelectInput label="Status" value={f.membershipStatus} onChange={(e) => set('membershipStatus', e.target.value)}>
          <option value="active">Active</option><option value="inactive">Inactive</option><option value="transferred">Transferred</option><option value="deceased">Deceased</option>
        </SelectInput>
        {can('admin') && (
          <>
            <SelectInput label="Family" value={f.family} onChange={(e) => set('family', e.target.value)}>
              <option value="">No family</option>{(families.data?.items || []).map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}
            </SelectInput>
            <SelectInput label="Role in family" value={f.familyRole} onChange={(e) => set('familyRole', e.target.value)} disabled={!f.family}>
              <option value="">—</option><option value="head">Head</option><option value="spouse">Spouse</option><option value="child">Child</option><option value="relative">Relative</option>
            </SelectInput>
          </>
        )}
        <fieldset className="sm:col-span-2">
          <legend className="label">Units</legend>
          {selectable.length === 0 ? <p className="text-sm text-ink-400">No units yet.</p> : (
            <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
              {selectable.map((u) => <Checkbox key={u._id} label={u.name} checked={f.units.includes(u._id)} onChange={(v) => set('units', v ? [...f.units, u._id] : f.units.filter((x) => x !== u._id))} />)}
            </div>
          )}
        </fieldset>
        <div className="sm:col-span-2"><Checkbox label="Baptised" checked={Boolean(f.baptized)} onChange={(v) => set('baptized', v)} /></div>
        <TextArea label="Notes" rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} className="sm:col-span-2" hint="Only leaders and admins see these." />
      </form>
    </Modal>
  )
}
