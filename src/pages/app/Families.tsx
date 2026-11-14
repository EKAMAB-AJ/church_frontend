import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { Button, Card, Empty, ErrorNote, Modal, PageHeader, Pagination, SearchBox, Spinner, Table, TextInput, useToast } from '../../components/ui'

interface FamilyRow { _id: string; name: string; address?: string; phone?: string; memberCount: number; head?: { firstName: string; lastName: string } }

export function FamilyForm({ family, onClose }: { family?: { _id: string; name: string; address?: string; phone?: string }; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState({ name: family?.name || '', address: family?.address || '', phone: family?.phone || '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () => family ? api.patch<FamilyRow>(`/families/${family._id}`, f) : api.post<FamilyRow>('/families', f),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['families'] }); qc.invalidateQueries({ queryKey: ['family', r._id] }); toast(family ? 'Family updated' : 'Family created'); onClose(); if (!family) nav(`/app/families/${r._id}`) },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  return (
    <Modal open onClose={onClose} title={family ? 'Edit family' : 'New family'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>{family ? 'Save' : 'Create family'}</Button></>}>
      <div className="space-y-4">
        <TextInput label="Family name" placeholder="The Adeyemi family" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} autoFocus />
        <TextInput label="Home address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <TextInput label="Home phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={errors.phone} />
      </div>
    </Modal>
  )
}

export default function Families() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const nav = useNavigate()
  const q = useQuery({ queryKey: ['families', search, page], queryFn: () => api.page<FamilyRow>('/families', { q: search, page, limit: 25 }), placeholderData: keepPreviousData })
  return (
    <>
      <PageHeader title="Families" description="Group members into households." actions={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />New family</Button>} />
      <Card padded={false}>
        <div className="border-b border-ink-100 p-4"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search families" /></div>
        {q.isLoading ? <Spinner /> : q.error ? <div className="p-5"><ErrorNote error={q.error} /></div> : q.data!.items.length === 0 ? <div className="p-6"><Empty title="No families yet" action={<Button onClick={() => setAdding(true)}>New family</Button>} /></div> : (
          <>
            <Table head={['Family', 'Members', 'Address']} hideOnMobile={[2]}>
              {q.data!.items.map((f) => (
                <tr key={f._id} className="cursor-pointer hover:bg-ink-50" onClick={() => nav(`/app/families/${f._id}`)}>
                  <td><Link to={`/app/families/${f._id}`} className="font-medium text-ink-900" onClick={(e) => e.stopPropagation()}>{f.name}</Link></td>
                  <td className="text-ink-600">{f.memberCount}</td>
                  <td className="text-ink-600">{f.address || '—'}</td>
                </tr>
              ))}
            </Table>
            <Pagination page={q.data!.meta.page} pages={q.data!.meta.pages} onPage={setPage} />
          </>
        )}
      </Card>
      {adding && <FamilyForm onClose={() => setAdding(false)} />}
    </>
  )
}
