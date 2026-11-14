import type { SiteSettings } from './types'

type ServiceTime = SiteSettings['serviceTimes'][number]
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/** "Sunday" / "Sundays" / "sun" → 0 … ; unknown → -1 */
export function dayIndex(day: string): number {
  const d = day.trim().toLowerCase().replace(/s$/, '')
  return DAYS.findIndex((x) => x === d || x.startsWith(d.slice(0, 3)))
}

/** "7:30 AM", "10am", "18:00", "6 pm" → minutes after midnight; null if unreadable */
export function parseTime(t: string): number | null {
  const m = t.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2] || 0)
  const ap = m[3]?.[0]
  if (ap === 'p' && h < 12) h += 12
  if (ap === 'a' && h === 12) h = 0
  return h > 23 || min > 59 ? null : h * 60 + min
}

/** Rows that share a day, together and in week order: Sunday → [first, second], Wednesday → [...] */
export function groupByDay(times: ServiceTime[]): { day: string; services: ServiceTime[] }[] {
  const groups: { day: string; key: number; services: ServiceTime[] }[] = []
  for (const t of times.filter((x) => x.label || x.time)) {
    const key = dayIndex(t.day)
    const g = groups.find((x) => (key >= 0 ? x.key === key : x.day.toLowerCase() === t.day.toLowerCase()))
    if (g) g.services.push(t)
    else groups.push({ day: t.day, key, services: [t] })
  }
  for (const g of groups) g.services.sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0))
  return groups.sort((a, b) => (a.key < 0 ? 9 : a.key) - (b.key < 0 ? 9 : b.key))
}

const LIVE_MINUTES = 120 // a service counts as "happening now" for two hours after it starts

/** The next (or current) service, from the visitor's clock. */
export function nextService(times: ServiceTime[], now = new Date()): { service: ServiceTime; start: Date; live: boolean } | null {
  let best: { service: ServiceTime; start: Date; live: boolean } | null = null
  for (const t of times) {
    const d = dayIndex(t.day)
    const mins = parseTime(t.time)
    if (d < 0 || mins === null) continue
    for (const weekOffset of [0, 7]) {
      const start = new Date(now)
      start.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
      start.setDate(start.getDate() + ((d - now.getDay() + 7) % 7) + weekOffset)
      const end = new Date(start.getTime() + LIVE_MINUTES * 60000)
      if (end <= now) continue
      const live = start <= now
      if (!best || (live && !best.live) || (!best.live && start < best.start)) best = { service: t, start, live }
      break
    }
  }
  return best
}

/** "in 2 days, 14 hours" / "in 3 hours, 20 minutes" / "in 12 minutes" */
export function countdown(to: Date, now = new Date()): string {
  const mins = Math.max(0, Math.round((to.getTime() - now.getTime()) / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  const part = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
  if (d) return `in ${part(d, 'day')}${h ? `, ${part(h, 'hour')}` : ''}`
  if (h) return `in ${part(h, 'hour')}${m ? `, ${part(m, 'minute')}` : ''}`
  return `in ${part(Math.max(m, 1), 'minute')}`
}

/** A thumbnail for YouTube links (watch, youtu.be, live, shorts); undefined otherwise. */
export function youtubeThumb(url?: string): string | undefined {
  if (!url) return undefined
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/|embed\/))([\w-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : undefined
}
