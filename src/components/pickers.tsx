import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '../lib/api'
import { fullName } from '../lib/format'
import type { Member, Unit } from '../lib/types'
import { Avatar } from './ui'

type Pick = { _id: string; firstName?: string; lastName?: string; photoUrl?: string }

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

/** Type-ahead search over members the current user can see. */
export function MemberSearch({ label = 'Find a member', onPick, exclude = [], placeholder = 'Type a name or phone…' }:
  { label?: string; onPick: (m: Member) => void; exclude?: string[]; placeholder?: string }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const dq = useDebounced(q)
  const box = useRef<HTMLDivElement>(null)
  const res = useQuery({ queryKey: ['member-search', dq], enabled: dq.length > 1, queryFn: () => api.page<Member>('/members', { q: dq, limit: 8 }) })
  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const items = (res.data?.items || []).filter((m) => !exclude.includes(m._id))
  return (
    <div className="relative" ref={box}>
      <label className="label" htmlFor="member-search">{label}</label>
      <input id="member-search" className="input" value={q} placeholder={placeholder} autoComplete="off"
        onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} />
      {open && dq.length > 1 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-ink-100 bg-white py-1 shadow-lg" role="listbox">
          {res.isLoading ? <li className="px-3 py-2 text-sm text-ink-400">Searching…</li> : items.length === 0 ? <li className="px-3 py-2 text-sm text-ink-400">No matches</li> :
            items.map((m) => (
              <li key={m._id}>
                <button type="button" className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-ink-50" onClick={() => { onPick(m); setQ(''); setOpen(false) }}>
                  <Avatar person={m} size={28} /><span className="font-medium text-ink-800">{fullName(m)}</span><span className="ml-auto text-xs text-ink-400">{m.phone}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

/** Picks several members, shown as removable chips. */
export function MemberMultiPicker({ value, onChange, label }: { value: Pick[]; onChange: (v: Pick[]) => void; label?: string }) {
  return (
    <div>
      <MemberSearch label={label} exclude={value.map((v) => v._id)} onPick={(m) => onChange([...value, m])} />
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((m) => (
            <span key={m._id} className="inline-flex items-center gap-1 rounded-full bg-ink-50 py-1 pl-2.5 pr-1 text-sm text-ink-700">
              {fullName(m)}
              <button type="button" onClick={() => onChange(value.filter((x) => x._id !== m._id))} className="rounded-full p-0.5 hover:bg-ink-100" aria-label={`Remove ${fullName(m)}`}><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Picks one member (or none). */
export function MemberSinglePicker({ value, onChange, label }: { value: Pick | null; onChange: (v: Pick | null) => void; label?: string }) {
  if (value) {
    return (
      <div>
        <span className="label">{label}</span>
        <div className="flex h-10 items-center gap-2 rounded-lg border border-ink-200 px-3 text-sm">
          <Avatar person={value} size={24} /><span className="font-medium">{fullName(value)}</span>
          <button type="button" className="ml-auto text-ink-400 hover:text-ink-700" onClick={() => onChange(null)} aria-label="Clear"><X className="h-4 w-4" /></button>
        </div>
      </div>
    )
  }
  return <MemberSearch label={label} onPick={onChange} />
}

export const useUnits = () => useQuery({ queryKey: ['units'], queryFn: () => api.get<Unit[]>('/units'), staleTime: 60_000 })
