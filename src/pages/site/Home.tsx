import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, HandHeart, HeartHandshake, MapPin, Play, Radio, Sparkles, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { cld } from '../../lib/cloudinary'
import { date, time } from '../../lib/format'
import { countdown, groupByDay, nextService, youtubeThumb } from '../../lib/services'
import { useSite } from '../../lib/site'
import type { ChurchEvent, Sermon, SiteSettings } from '../../lib/types'
import { Spinner } from '../../components/ui'

/** Castle battlements along the bottom of the opening section (the church's name made visible). */
function Battlements({ className = 'text-paper' }: { className?: string }) {
  // raised blocks and gaps, drawn in the colour of the section below; fewer, wider blocks on phones
  const path = (n: number) => `M0 48 ${Array.from({ length: n }, (_, i) => `V${i % 2 ? 48 : 18} H${((i + 1) * 1200 / n).toFixed(1)}`).join(' ')} V48 Z`
  return (
    <>
      <svg viewBox="0 0 1200 48" preserveAspectRatio="none" className={`absolute inset-x-0 -bottom-px h-6 w-full sm:hidden ${className}`} aria-hidden><path fill="currentColor" d={path(13)} /></svg>
      <svg viewBox="0 0 1200 48" preserveAspectRatio="none" className={`absolute inset-x-0 -bottom-px hidden h-12 w-full sm:block ${className}`} aria-hidden><path fill="currentColor" d={path(25)} /></svg>
    </>
  )
}

/** Re-render every minute so the countdown stays honest. */
function useNow(ms = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t) }, [ms])
  return now
}

function SundayPanel({ s }: { s: SiteSettings }) {
  const now = useNow()
  const next = nextService(s.serviceTimes, now)
  const groups = groupByDay(s.serviceTimes)
  const main = groups.find((g) => g.services.length > 1) || groups[0]
  if (!main) return null
  const others = groups.filter((g) => g !== main)
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white/95 p-6 text-ink-900 shadow-2xl shadow-ink-950/40 backdrop-blur">
      {next && (
        <div className={`mb-5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${next.live ? 'bg-emerald-50 text-emerald-800' : 'bg-brass-300/25 text-ink-800'}`} aria-live="polite">
          {next.live ? <Radio className="h-4 w-4 animate-pulse" aria-hidden /> : <CalendarDays className="h-4 w-4" aria-hidden />}
          {next.live ? <span>{next.service.label} is happening now</span> : <span>{next.service.label} starts {countdown(next.start, now)}</span>}
        </div>
      )}
      <div className="font-serif text-2xl font-semibold">Join us {main.day.replace(/s$/, '')}</div>
      <ol className="mt-4 space-y-3">
        {main.services.map((t, i) => (
          <li key={i} className="flex items-center gap-4">
            <span className="flex h-14 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-ink-800 text-white">
              <span className="font-serif text-xl font-semibold leading-none">{t.time.replace(/\s?(AM|PM|am|pm)$/, '')}</span>
              <span className="mt-0.5 text-[11px] text-brass-300">{(t.time.match(/(AM|PM|am|pm)$/)?.[0] || '').toUpperCase()}</span>
            </span>
            <span className="font-semibold">{t.label}</span>
          </li>
        ))}
      </ol>
      {others.length > 0 && (
        <p className="mt-5 border-t border-ink-100 pt-4 text-sm text-ink-500">
          Also: {others.map((g) => g.services.map((t) => `${t.label}, ${g.day} ${t.time}`).join(' · ')).join(' · ')}
        </p>
      )}
      {s.address && (
        <p className="mt-4 flex gap-2 text-sm text-ink-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass-600" aria-hidden />
          <span>{s.address}{s.mapUrl && <> · <a href={s.mapUrl} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">Directions</a></>}</span>
        </p>
      )}
    </div>
  )
}

export default function Home() {
  const { data, isLoading } = useSite()
  const sermonsQ = useQuery({ queryKey: ['public-sermons', 'home'], queryFn: () => api.page<Sermon>('/public/sermons', { limit: 4 }), enabled: Boolean(data) })
  if (isLoading || !data) return <div className="pt-40"><Spinner /></div>
  const { site: s, events } = data
  const sermons = sermonsQ.data?.items || data.sermons
  const latest = sermons[0]
  const thumb = latest && (youtubeThumb(latest.videoUrl))

  return (
    <>
      {/* ------------------------------------------------------------ opening */}
      <section className="relative isolate overflow-hidden bg-ink-900 text-white">
        {s.heroImageUrl
          ? <><img src={cld(s.heroImageUrl, 'w_2000')} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" /><div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/90 via-ink-900/75 to-ink-900/30" aria-hidden /></>
          : <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(184,149,74,.28),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(62,98,135,.55),transparent_60%)]" aria-hidden />}
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-32 sm:pb-32 sm:pt-40 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="text-sm font-medium text-brass-300">Welcome to {s.churchName}{s.shortName ? ` · ${s.shortName}` : ''}</p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] sm:text-7xl">{s.welcomeTitle}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-100 sm:text-xl">{s.welcomeText}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/about" className="inline-flex items-center gap-2 rounded-lg bg-brass-500 px-6 py-3.5 text-sm font-semibold text-ink-950 hover:bg-brass-300">Plan your visit <ArrowRight className="h-4 w-4" /></Link>
              {latest?.videoUrl
                ? <a href={latest.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/35 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10"><Play className="h-4 w-4" />Watch the latest message</a>
                : <Link to="/events" className="inline-flex items-center gap-2 rounded-lg border border-white/35 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10">What’s on</Link>}
            </div>
          </div>
          <div className="lg:justify-self-end"><SundayPanel s={s} /></div>
        </div>
        <Battlements />
      </section>

      {/* ----------------------------------------------------- latest message */}
      {latest && (
        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr]">
            <a href={latest.videoUrl || '/sermons'} target={latest.videoUrl ? '_blank' : undefined} rel="noreferrer"
              className="group relative block aspect-video overflow-hidden rounded-2xl bg-ink-800 shadow-xl shadow-ink-900/10">
              {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                : <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_left,rgba(184,149,74,.35),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(62,98,135,.6),transparent_60%)]" aria-hidden />}
              {!thumb && <span className="absolute bottom-5 left-6 right-6 truncate font-serif text-lg text-white/85">{latest.preacher || 'Latest message'}</span>}
              <span className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent" aria-hidden />
              <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-900 shadow-lg transition group-hover:scale-110" aria-hidden>
                <Play className="ml-1 h-7 w-7" fill="currentColor" />
              </span>
            </a>
            <div>
              <p className="text-sm font-medium text-brass-700">Latest message{latest.date ? ` · ${date(latest.date, { day: 'numeric', month: 'long' })}` : ''}</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">{latest.title}</h2>
              <p className="mt-3 text-ink-600">{[latest.preacher, latest.scripture].filter(Boolean).join(' · ')}</p>
              {latest.summary && <p className="mt-4 text-lg leading-relaxed text-ink-700">{latest.summary}</p>}
              <div className="mt-6 flex flex-wrap gap-4">
                {latest.videoUrl && <a href={latest.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-ink-800 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-900"><Play className="h-4 w-4" />Watch now</a>}
                <Link to="/sermons" className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-ink-700 hover:text-ink-900">All sermons <ArrowRight className="h-4 w-4" /></Link>
              </div>
              {sermons.length > 1 && (
                <ul className="mt-8 divide-y divide-ink-100 border-t border-ink-100">
                  {sermons.slice(1, 4).map((m) => (
                    <li key={m._id}>
                      <a href={m.videoUrl || '/sermons'} target={m.videoUrl ? '_blank' : undefined} rel="noreferrer" className="flex items-center justify-between gap-4 py-3 text-sm hover:text-ink-900">
                        <span className="font-medium text-ink-800">{m.title}</span><span className="shrink-0 text-ink-400">{date(m.date, { day: 'numeric', month: 'short' })}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- verse */}
      {s.homeVerse && (
        <section className="relative bg-ink-800 text-white">
          <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:py-24">
            <blockquote>
              <p className="font-serif text-3xl leading-snug sm:text-4xl">“{s.homeVerse}”</p>
              {s.homeVerseRef && <footer className="mt-5 text-sm font-medium text-brass-300">{s.homeVerseRef}</footer>}
            </blockquote>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ events */}
      <Events events={events} />

      {/* ---------------------------------------------------- pastor's word */}
      {s.pastorName && s.pastorMessage && (
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:py-24 md:grid-cols-[minmax(0,22rem)_1fr]">
            {s.pastorPhotoUrl ? <img src={cld(s.pastorPhotoUrl, 'w_800,h_1000,c_fill,g_face')} alt={s.pastorName} className="aspect-[4/5] w-full rounded-2xl object-cover" />
              : <div className="aspect-[4/5] w-full rounded-2xl bg-ink-100" aria-hidden />}
            <div>
              <p className="text-sm font-medium text-brass-700">A word from our pastor</p>
              <blockquote className="mt-4 font-serif text-2xl leading-snug text-ink-900 sm:text-3xl">{s.pastorMessage.split(/\n{2,}/).map((p, i) => <p key={i} className="mt-4 first:mt-0">{p}</p>)}</blockquote>
              <p className="mt-6 font-semibold text-ink-900">{s.pastorName}<span className="font-normal text-ink-500"> · {s.pastorTitle}</span></p>
              <Link to="/about" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-ink-900">Our story and leaders <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- next steps */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <h2 className="max-w-2xl font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">Your next step</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-ink-100 bg-ink-100 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/about', icon: Sparkles, title: 'New here?', text: 'See what a Sunday looks like and what to expect when you visit.' },
            { to: '/about', icon: Users, title: 'Find your place', text: 'Join a department or ministry and serve alongside others.' },
            { to: '/contact?type=prayer', icon: HeartHandshake, title: 'Need prayer?', text: 'Send a request. Our prayer team will stand with you.' },
            { to: '/give', icon: HandHeart, title: 'Give', text: 'Support the work of the church, online or by transfer.' },
          ].map(({ to, icon: Icon, title, text }) => (
            <Link key={title} to={to} className="group bg-white p-6 transition hover:bg-paper">
              <Icon className="h-6 w-6 text-brass-600" aria-hidden />
              <h3 className="mt-4 font-serif text-xl font-semibold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-700 group-hover:gap-2 group-hover:text-ink-900">Go <ArrowRight className="h-4 w-4 transition-all" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- photo strip */}
      {s.gallery.length > 0 && (
        <section className="pb-20 sm:pb-24">
          <div className="flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:justify-center">
            {s.gallery.slice(0, 8).map((url, i) => (
              <Link key={i} to="/about" className="block shrink-0 snap-start overflow-hidden rounded-xl">
                <img src={cld(url, 'h_520')} alt="" loading="lazy" className="h-48 w-auto transition duration-500 hover:scale-[1.04] sm:h-64" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- closing */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(184,149,74,.22),transparent_60%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:py-20 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">There’s a seat saved for you this Sunday.</h2>
            <p className="mt-3 max-w-xl text-lg text-ink-200">Come as you are. We can’t wait to meet you.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link to="/about" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-ink-50">Plan your visit</Link>
            <Link to="/contact?type=prayer" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Send a prayer request</Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Events({ events }: { events: ChurchEvent[] }) {
  if (!events.length) return null
  const [first, ...rest] = events
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">Coming up</h2>
        <Link to="/events" className="text-sm font-semibold text-ink-600 hover:text-ink-900">All events</Link>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Link to={`/events/${first._id}`} className="group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl bg-ink-800 p-7 text-white">
          {first.imageUrl && <img src={cld(first.imageUrl, 'w_1200')} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />}
          <span className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-900/40 to-transparent" aria-hidden />
          <div className="relative">
            <div className="inline-flex items-baseline gap-2 rounded-lg bg-brass-500 px-3 py-1.5 text-ink-950">
              <span className="font-serif text-2xl font-semibold leading-none">{new Date(first.startAt).getDate()}</span>
              <span className="text-sm font-semibold">{date(first.startAt, { month: 'long' })}</span>
            </div>
            <h3 className="mt-4 font-serif text-3xl font-semibold leading-tight group-hover:underline">{first.title}</h3>
            <p className="mt-2 text-ink-100">{date(first.startAt, { weekday: 'long' })} · {time(first.startAt)}{first.location && ` · ${first.location}`}</p>
            {first.registrationOpen && <p className="mt-3 text-sm font-semibold text-brass-300">{first.spotsLeft === 0 ? 'Fully booked' : 'Register now →'}</p>}
          </div>
        </Link>
        <ul className="flex flex-col gap-3">
          {rest.slice(0, 4).map((e) => (
            <li key={e._id}>
              <Link to={`/events/${e._id}`} className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 transition hover:border-ink-300">
                <span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-paper py-2">
                  <span className="text-xs text-ink-500">{date(e.startAt, { month: 'short' })}</span>
                  <span className="font-serif text-2xl font-semibold leading-none text-ink-900">{new Date(e.startAt).getDate()}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink-900">{e.title}</span>
                  <span className="block truncate text-sm text-ink-500">{date(e.startAt, { weekday: 'short' })} · {time(e.startAt)}{e.location && ` · ${e.location}`}</span>
                </span>
              </Link>
            </li>
          ))}
          {rest.length === 0 && <li className="rounded-2xl border border-dashed border-ink-200 p-6 text-sm text-ink-500">More events will be announced soon.</li>}
        </ul>
      </div>
    </section>
  )
}
