import { cld } from '../lib/cloudinary'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { BarChart3, CalendarDays, ClipboardCheck, Globe, HandCoins, Home, LogOut, Megaphone, Menu, Receipt, UserPlus, Users, UsersRound, Network, X, CircleUser } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { BRAND, useSite } from '../lib/site'
import { Avatar } from '../components/ui'
import { titleCase } from '../lib/format'
import type { Role } from '../lib/types'

type Item = { to: string; label: string; icon: typeof Home; roles: Role[]; end?: boolean }
const items: Item[] = [
  { to: '/app', label: 'Dashboard', icon: Home, roles: ['admin', 'leader', 'member'], end: true },
  { to: '/app/members', label: 'Members', icon: Users, roles: ['admin', 'leader'] },
  { to: '/app/families', label: 'Families', icon: UsersRound, roles: ['admin'] },
  { to: '/app/units', label: 'Units', icon: Network, roles: ['admin', 'leader', 'member'] },
  { to: '/app/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin', 'leader'] },
  { to: '/app/first-timers', label: 'First-timers', icon: UserPlus, roles: ['admin', 'leader'] },
  { to: '/app/giving', label: 'Giving', icon: HandCoins, roles: ['admin'] },
  { to: '/app/expenses', label: 'Expenses', icon: Receipt, roles: ['admin'] },
  { to: '/app/reports', label: 'Finance reports', icon: BarChart3, roles: ['admin'] },
  { to: '/app/events', label: 'Events', icon: CalendarDays, roles: ['admin', 'leader', 'member'] },
  { to: '/app/messages', label: 'Messages', icon: Megaphone, roles: ['admin', 'leader'] },
  { to: '/app/website', label: 'Website', icon: Globe, roles: ['admin'] },
  { to: '/app/profile', label: 'My profile', icon: CircleUser, roles: ['admin', 'leader', 'member'] },
]

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const { data } = useSite()
  const [open, setOpen] = useState(false)
  if (!user) return null
  const nav = items.filter((i) => i.roles.includes(user.role))
  const name = data?.site.churchName || BRAND.name
  const logoUrl = data ? data.site.logoUrl : BRAND.logoUrl

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-800 text-ink-100">
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5" title="View the website">
        {logoUrl ? <img src={cld(logoUrl, 'h_120')} alt="" className="h-9 w-auto min-w-9 max-w-[7rem] shrink-0 rounded-lg bg-white object-contain p-0.5" /> : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#e2cd96" strokeWidth="2.6" strokeLinecap="round"><path d="M12 3v18M7 8h10" /></svg>
          </span>
        )}
        <span className="truncate font-serif text-[15px] font-semibold text-white">{name}</span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="App">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => clsx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-white/10 text-white' : 'text-ink-200 hover:bg-white/5 hover:text-white')}>
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />{label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar person={user} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-ink-300">{user.role === 'leader' && user.ledUnits.length ? `Leader · ${user.ledUnits.map((u) => u.name).join(', ')}` : titleCase(user.role)}</div>
          </div>
          <button onClick={signOut} className="rounded-md p-1.5 text-ink-300 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-50/60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-md p-1.5 text-ink-700" aria-label="Open menu"><Menu className="h-6 w-6" /></button>
          <span className="font-serif font-semibold text-ink-900">{name}</span>
          {open && <X className="hidden" />}
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8"><Outlet /></main>
      </div>
    </div>
  )
}
