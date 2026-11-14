const CURRENCY = 'NGN'

export const money = (n?: number | null, currency = CURRENCY) =>
  n == null || Number.isNaN(n) ? '—' : new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)

export const compactMoney = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: CURRENCY, notation: 'compact', maximumFractionDigits: 1 }).format(n)

export const date = (d?: string | Date | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-NG', opts) : '—'

export const dateTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'

export const time = (d?: string | Date | null) => (d ? new Date(d).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }) : '')

/** "2026-11-14" for <input type="date"> */
export const toDateInput = (d?: string | Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '')
/** local "2026-11-14T18:30" for <input type="datetime-local"> */
export const toDateTimeInput = (d?: string | Date | null) => {
  if (!d) return ''
  const x = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`
}

export const fullName = (m?: { firstName?: string; lastName?: string } | null) => (m ? [m.firstName, m.lastName].filter(Boolean).join(' ') : '')
export const initials = (m?: { firstName?: string; lastName?: string } | null) =>
  ((m?.firstName?.[0] ?? '') + (m?.lastName?.[0] ?? '')).toUpperCase() || '?'

export const titleCase = (s?: string) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '')

export const telLink = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined)
export const waLink = (phone?: string) => {
  if (!phone) return undefined
  let p = phone.replace(/[^\d]/g, '')
  if (p.startsWith('0') && p.length === 11) p = `234${p.slice(1)}`
  return `https://wa.me/${p}`
}
