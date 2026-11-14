import { cld } from '../lib/cloudinary'
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react'
import { initials } from '../lib/format'

// ------------------------------------------------------------------ buttons
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const variants: Record<Variant, string> = {
  primary: 'bg-ink-700 text-white hover:bg-ink-800 border-ink-700',
  secondary: 'bg-white text-ink-800 hover:bg-ink-50 border-ink-200',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-50 border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
}
export function Button({ variant = 'primary', loading, size = 'md', className, children, disabled, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; size?: 'sm' | 'md' }) {
  return (
    <button
      className={clsx('inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm', variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

// ------------------------------------------------------------------- fields
export function Field({ label, error, hint, children, className }: { label?: string; error?: string; hint?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      {children(id)}
      {error ? <p className="mt-1 text-[13px] text-red-600">{error}</p> : hint ? <p className="mt-1 text-[13px] text-ink-400">{hint}</p> : null}
    </div>
  )
}
export function TextInput({ label, error, hint, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return <Field label={label} error={error} hint={hint} className={className}>{(id) => <input id={id} className={clsx('input', error && 'border-red-400')} {...rest} />}</Field>
}
export function TextArea({ label, error, hint, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: string }) {
  return <Field label={label} error={error} hint={hint} className={className}>{(id) => <textarea id={id} rows={4} className={clsx('input', error && 'border-red-400')} {...rest} />}</Field>
}
export function SelectInput({ label, error, hint, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; hint?: string }) {
  return <Field label={label} error={error} hint={hint} className={className}>{(id) => <select id={id} className={clsx('input', error && 'border-red-400')} {...rest}>{children}</select>}</Field>
}
export function Checkbox({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-800">
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-ink-300 text-ink-700 focus:ring-ink-300" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}{hint && <span className="block text-[13px] text-ink-400">{hint}</span>}</span>
    </label>
  )
}
export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-hidden />
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} type="search" />
    </div>
  )
}

// -------------------------------------------------------------------- layout
export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
export function Card({ title, actions, children, className, padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={clsx('card', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
          {title && <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}
export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-sm text-ink-500">{label}{icon && <span className="text-ink-300">{icon}</span>}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-ink-900">{value}</div>
      {sub && <div className="mt-0.5 text-[13px] text-ink-400">{sub}</div>}
    </div>
  )
}
export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'brass' }) {
  const tones = {
    gray: 'bg-ink-50 text-ink-600 ring-ink-100', green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100', red: 'bg-red-50 text-red-700 ring-red-100',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100', brass: 'bg-brass-100 text-brass-700 ring-brass-300/40',
  }
  return <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone])}>{children}</span>
}
export function Avatar({ person, size = 36 }: { person?: { firstName?: string; lastName?: string; photoUrl?: string } | null; size?: number }) {
  if (person?.photoUrl) return <img src={cld(person.photoUrl, `w_${size * 2},h_${size * 2},c_fill,g_face`)} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink-100 font-semibold text-ink-600" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials(person)}
    </span>
  )
}
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-medium text-ink-800">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-400"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{label}</div>
}
export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex-1">{error instanceof Error ? error.message : 'Something went wrong'}</div>
      {onRetry && <button className="font-medium underline" onClick={onRetry}>Try again</button>}
    </div>
  )
}
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3 text-sm text-ink-500">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-1">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}
// columns (by index) that collapse below the md breakpoint; literal classes so Tailwind keeps them
const hideCol: Record<number, string> = {
  1: 'max-md:[&_tr>*:nth-child(2)]:hidden', 2: 'max-md:[&_tr>*:nth-child(3)]:hidden', 3: 'max-md:[&_tr>*:nth-child(4)]:hidden',
  4: 'max-md:[&_tr>*:nth-child(5)]:hidden', 5: 'max-md:[&_tr>*:nth-child(6)]:hidden',
}
export function Table({ head, children, hideOnMobile = [] }: { head: ReactNode[]; children: ReactNode; hideOnMobile?: number[] }) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('w-full text-left text-sm [&_td]:px-5 [&_td]:py-3', hideOnMobile.map((i) => hideCol[i]))}>
        <thead><tr className="border-b border-ink-100 text-[13px] text-ink-500">{head.map((h, i) => <th key={i} className="whitespace-nowrap px-5 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-ink-50">{children}</tbody>
      </table>
    </div>
  )
}
export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-ink-100" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={clsx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', value === t.value ? 'border-ink-700 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800')}>
          {t.label}{t.count != null && <span className="ml-1.5 text-ink-400">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

// --------------------------------------------------------------------- modal
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose() }}
      className={clsx('w-[calc(100%-2rem)] rounded-2xl p-0 shadow-xl backdrop:bg-ink-900/40', wide ? 'max-w-3xl' : 'max-w-lg')}>
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3.5">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
export function ConfirmButton({ onConfirm, children, title = 'Are you sure?', message, confirmLabel = 'Delete', variant = 'ghost', size = 'sm' }:
  { onConfirm: () => Promise<unknown> | void; children: ReactNode; title?: string; message: string; confirmLabel?: string; variant?: Variant; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>{children}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={async () => { setBusy(true); try { await onConfirm(); setOpen(false) } finally { setBusy(false) } }}>{confirmLabel}</Button>
        </>}>
        <p className="text-sm text-ink-600">{message}</p>
      </Modal>
    </>
  )
}

// --------------------------------------------------------------------- toast
type Toast = { id: number; text: string; tone: 'ok' | 'error' }
const ToastCtx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {})
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={clsx('pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg', t.tone === 'ok' ? 'bg-ink-800' : 'bg-red-600')}>
            {t.tone === 'ok' ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <AlertCircle className="h-4 w-4" aria-hidden />}{t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)
