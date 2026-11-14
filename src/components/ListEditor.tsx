import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import ImageUpload from './ImageUpload'
import { Button, TextArea, TextInput } from './ui'

export interface ListField<T> {
  key: keyof T & string
  label: string
  type?: 'text' | 'textarea' | 'image'
  placeholder?: string
  /** grid width: 'full' spans both columns */
  span?: 'full'
  rows?: number
}

/**
 * Edit a list of small records (timeline entries, values, leaders…):
 * add, remove and move up/down. Each record is a little card of fields.
 */
export default function ListEditor<T extends Record<string, unknown>>({ items, onChange, fields, blank, addLabel, itemLabel, empty, max = 40 }: {
  items: T[]; onChange: (items: T[]) => void; fields: ListField<T>[]; blank: T
  addLabel: string; itemLabel: (item: T, index: number) => ReactNode; empty: ReactNode; max?: number
}) {
  const update = (i: number, patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const move = (i: number, d: -1 | 1) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="rounded-lg border border-dashed border-ink-200 px-4 py-5 text-center text-sm text-ink-500">{empty}</p>}
      {items.map((item, i) => (
        <fieldset key={i} className="rounded-xl border border-ink-100 bg-ink-50/40 p-4">
          <legend className="sr-only">{itemLabel(item, i)}</legend>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink-700" aria-hidden>{itemLabel(item, i)}</span>
            <span className="flex shrink-0 gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-ink-400 hover:bg-white hover:text-ink-700 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded p-1.5 text-ink-400 hover:bg-white hover:text-ink-700 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded p-1.5 text-ink-400 hover:bg-white hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => {
              const value = String(item[f.key] ?? '')
              const cls = f.span === 'full' || f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : undefined
              if (f.type === 'image') return <ImageUpload key={f.key} label={f.label} kind="site" shape="square" value={value} onChange={(url) => update(i, { [f.key]: url } as Partial<T>)} className={cls} />
              if (f.type === 'textarea') return <TextArea key={f.key} label={f.label} rows={f.rows || 3} placeholder={f.placeholder} value={value} onChange={(e) => update(i, { [f.key]: e.target.value } as Partial<T>)} className={cls} />
              return <TextInput key={f.key} label={f.label} placeholder={f.placeholder} value={value} onChange={(e) => update(i, { [f.key]: e.target.value } as Partial<T>)} className={cls} />
            })}
          </div>
        </fieldset>
      ))}
      {items.length < max && <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...items, { ...blank }])}><Plus className="h-4 w-4" />{addLabel}</Button>}
    </div>
  )
}
