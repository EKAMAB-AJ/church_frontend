import { cld } from '../lib/cloudinary'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import { BRAND, useSite } from '../lib/site'
import ServiceTimes from '../components/ServiceTimes'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/events', label: 'Events' },
  { to: '/sermons', label: 'Sermons' },
  { to: '/give', label: 'Give' },
  { to: '/contact', label: 'Contact' },
]

/** The church's logo and name. The logo is shown whole (never cropped), on a white tile. */
export function ChurchMark({ name, shortName, logoUrl, light }: { name: string; shortName?: string; logoUrl?: string; light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      {logoUrl ? <img src={cld(logoUrl, 'h_120')} alt="" className="h-10 w-auto min-w-10 max-w-[9rem] shrink-0 rounded-lg bg-white object-contain p-0.5" /> : (
        <span className={clsx('flex h-9 w-9 items-center justify-center rounded-full', light ? 'bg-white/10' : 'bg-ink-700')} aria-hidden>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#e2cd96" strokeWidth="2.4" strokeLinecap="round"><path d="M12 3v18M7 8h10" /></svg>
        </span>
      )}
      <span className="leading-tight">
        <span className={clsx('block font-serif text-lg font-semibold', light ? 'text-white' : 'text-ink-900')}>{name}</span>
        {shortName && <span className={clsx('block text-xs', light ? 'text-brass-300' : 'text-brass-700')}>{shortName}</span>}
      </span>
    </span>
  )
}

export default function SiteLayout() {
  const { data } = useSite()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const s = data?.site
  const name = s?.churchName || BRAND.name
  const shortName = s ? s.shortName : BRAND.shortName
  const logoUrl = s ? s.logoUrl : BRAND.logoUrl
  useEffect(() => { document.title = shortName ? `${name} · ${shortName}` : name }, [name, shortName])
  // pages that open on a dark band get the see-through header
  const isHome = location.pathname === '/' || location.pathname === '/about'

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className={clsx('z-30', isHome ? 'absolute inset-x-0 top-0' : 'border-b border-ink-100 bg-white')}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" onClick={() => setOpen(false)}><ChurchMark name={name} shortName={shortName} logoUrl={logoUrl} light={isHome} /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => clsx('rounded-md px-3 py-2 text-sm font-medium transition',
                  isHome ? (isActive ? 'text-white' : 'text-white/75 hover:text-white') : (isActive ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'))}>
                {n.label}
              </NavLink>
            ))}
            <Link to={user ? '/app' : '/login'} className={clsx('ml-3 rounded-lg px-4 py-2 text-sm font-semibold', isHome ? 'bg-white text-ink-800 hover:bg-ink-50' : 'bg-ink-700 text-white hover:bg-ink-800')}>
              {user ? 'Open app' : 'Member login'}
            </Link>
          </nav>
          <button className={clsx('rounded-md p-2 md:hidden', isHome ? 'text-white' : 'text-ink-700')} onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <nav className="mx-4 mb-3 rounded-xl bg-white p-2 shadow-lg md:hidden" aria-label="Mobile">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
                className={({ isActive }) => clsx('block rounded-lg px-3 py-2.5 text-[15px] font-medium', isActive ? 'bg-ink-50 text-ink-900' : 'text-ink-600')}>{n.label}</NavLink>
            ))}
            <Link to={user ? '/app' : '/login'} onClick={() => setOpen(false)} className="mt-1 block rounded-lg bg-ink-700 px-3 py-2.5 text-center text-[15px] font-semibold text-white">{user ? 'Open app' : 'Member login'}</Link>
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-ink-900 text-ink-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
          <div>
            <ChurchMark name={name} shortName={shortName} logoUrl={logoUrl} light />
            {s?.tagline && <p className="mt-3 max-w-xs text-sm text-ink-300">{s.tagline}</p>}
            <div className="mt-5 flex gap-3">
              {([['facebook', 'Facebook'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['x', 'X'], ['whatsapp', 'WhatsApp']] as const).map(([k, label]) => s?.socials[k] ? (
                <a key={k} href={s.socials[k]} target="_blank" rel="noreferrer" className="text-sm text-ink-300 underline-offset-4 hover:text-white hover:underline">{label}</a>
              ) : null)}
            </div>
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-white">Gather with us</h2>
            <ServiceTimes times={s?.serviceTimes || []} tone="light" size="sm" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-white">Find us</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-300">
              {s?.address && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{s.address}</li>}
              {s?.phone && <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><a href={`tel:${s.phone}`} className="hover:text-white">{s.phone}</a></li>}
              {s?.email && <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><a href={`mailto:${s.email}`} className="hover:text-white">{s.email}</a></li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-ink-400">© {new Date().getFullYear()} {name}{shortName ? ` (${shortName})` : ''}</div>
      </footer>
    </div>
  )
}
