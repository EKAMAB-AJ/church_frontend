import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Cake, CalendarDays, HandCoins, Heart, Inbox, MessageCircle, UserPlus, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { compactMoney, date, fullName, money, time, waLink } from '../../lib/format'
import { Avatar, Card, Empty, ErrorNote, PageHeader, Spinner, Stat } from '../../components/ui'

interface Celebration { kind: 'birthday' | 'anniversary'; date: string; inDays: number; member: { _id: string; firstName: string; lastName: string; phone?: string; photoUrl?: string } }
interface Ev { _id: string; title: string; startAt: string; location?: string; unit?: { name: string } | null }
interface UnitLite { _id: string; name: string; type: string; meetingDay?: string; meetingTime?: string; meetingVenue?: string; memberCount?: number; leaders?: { _id: string; firstName: string; lastName: string; phone?: string }[] }
type Dash =
  | { role: 'admin'; stats: Record<string, number>; attendance: { _id: string; title: string; date: string; headcount: number; marked: number }[]; givingTrend: { month: string; total: number }[]; celebrations: Celebration[]; events: Ev[] }
  | { role: 'leader'; units: UnitLite[]; stats: { unitMembers: number; openFollowUps: number }; meetings: { _id: string; title: string; date: string; unit?: { name: string }; marked: number }[]; celebrations: Celebration[]; events: Ev[] }
  | { role: 'member'; units: UnitLite[]; stats: { givingThisYear: number; attended90: number }; events: Ev[] }

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-NG', { month: 'short' })

export default function Dashboard() {
  const { user } = useAuth()
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<Dash>('/dashboard') })
  if (q.isLoading) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} onRetry={() => q.refetch()} />
  const d = q.data!
  return (
    <>
      <PageHeader title={`${greeting()}, ${user?.firstName}`} description={new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })} />
      {d.role === 'admin' && <AdminDash d={d} />}
      {d.role === 'leader' && <LeaderDash d={d} />}
      {d.role === 'member' && <MemberDash d={d} />}
    </>
  )
}

function AdminDash({ d }: { d: Extract<Dash, { role: 'admin' }> }) {
  const s = d.stats
  const change = s.givingLastMonth ? Math.round(((s.givingMonth - s.givingLastMonth) / s.givingLastMonth) * 100) : null
  const att = d.attendance.map((a) => ({ name: date(a.date, { day: 'numeric', month: 'short' }), title: a.title, Headcount: a.headcount, Marked: a.marked }))
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/app/members"><Stat label="Active members" value={s.members.toLocaleString()} sub={`${s.newThisMonth} joined this month`} icon={<Users className="h-5 w-5" />} /></Link>
        <Link to="/app/giving"><Stat label="Giving this month" value={money(s.givingMonth)} sub={change == null ? 'No giving last month' : `${change >= 0 ? '+' : ''}${change}% vs last month`} icon={<HandCoins className="h-5 w-5" />} /></Link>
        <Link to="/app/first-timers"><Stat label="First-timers this month" value={s.visitorsMonth} sub={`${s.openFollowUps} need follow-up`} icon={<UserPlus className="h-5 w-5" />} /></Link>
        <Link to="/app/website"><Stat label="Unread inbox" value={s.inbox} sub="Contact & prayer requests" icon={<Inbox className="h-5 w-5" />} /></Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Service attendance" actions={<Link to="/app/attendance" className="text-sm text-ink-500 hover:text-ink-800">All services</Link>}>
          {att.length === 0 ? <Empty title="No services recorded yet">Create a service under Attendance to start tracking.</Empty> : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={att} margin={{ left: -18, right: 4 }}>
                  <CartesianGrid vertical={false} stroke="#e8edf3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#7a8ba0" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#7a8ba0" allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f3f6f9' }} labelFormatter={(_, p) => p?.[0]?.payload?.title} />
                  <Bar dataKey="Headcount" fill="#2e4e72" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Marked" fill="#c9a861" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-2 text-xs text-ink-400">Headcount is the usher count; marked is members ticked on the roster.</p>
        </Card>
        <Card title="Giving, last 6 months">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={d.givingTrend.map((g) => ({ name: monthLabel(g.month), total: g.total }))} margin={{ left: -6, right: 4 }}>
                <CartesianGrid vertical={false} stroke="#e8edf3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#7a8ba0" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#7a8ba0" tickFormatter={compactMoney} />
                <Tooltip cursor={{ fill: '#f3f6f9' }} formatter={(v) => money(Number(v))} />
                <Bar dataKey="total" name="Giving" fill="#2e4e72" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Celebrations items={d.celebrations} />
        <Upcoming events={d.events} />
      </div>
    </div>
  )
}

function LeaderDash({ d }: { d: Extract<Dash, { role: 'leader' }> }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Members in my units" value={d.stats.unitMembers} icon={<Users className="h-5 w-5" />} />
        <Link to="/app/first-timers"><Stat label="First-timers to follow up" value={d.stats.openFollowUps} icon={<UserPlus className="h-5 w-5" />} /></Link>
        <Link to="/app/messages"><Stat label="Message my units" value={<span className="text-base font-semibold">Send an announcement</span>} icon={<MessageCircle className="h-5 w-5" />} /></Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Units I lead" padded={false}>
          <ul className="divide-y divide-ink-100">
            {d.units.map((u) => (
              <li key={u._id}><Link to={`/app/units/${u._id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-ink-50">
                <div><div className="font-medium text-ink-900">{u.name}</div><div className="text-sm text-ink-500">{[u.meetingDay, u.meetingTime].filter(Boolean).join(', ') || 'No meeting time set'}</div></div>
                <span className="text-sm text-ink-500">{u.memberCount} members</span>
              </Link></li>
            ))}
          </ul>
        </Card>
        <Card title="Recent unit meetings" actions={<Link to="/app/attendance" className="text-sm text-ink-500 hover:text-ink-800">Take attendance</Link>} padded={false}>
          {d.meetings.length === 0 ? <div className="p-5"><Empty title="No meetings recorded">Record a meeting to take attendance.</Empty></div> : (
            <ul className="divide-y divide-ink-100">
              {d.meetings.map((m) => (
                <li key={m._id}><Link to={`/app/attendance/${m._id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-ink-50">
                  <div><div className="font-medium text-ink-900">{m.title}</div><div className="text-sm text-ink-500">{m.unit?.name} · {date(m.date)}</div></div>
                  <span className="text-sm text-ink-500">{m.marked} present</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
        <Celebrations items={d.celebrations} />
        <Upcoming events={d.events} />
      </div>
    </div>
  )
}

function MemberDash({ d }: { d: Extract<Dash, { role: 'member' }> }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/app/profile?tab=giving"><Stat label="My giving this year" value={money(d.stats.givingThisYear)} icon={<HandCoins className="h-5 w-5" />} /></Link>
        <Link to="/app/profile?tab=attendance"><Stat label="Services attended (90 days)" value={d.stats.attended90} icon={<Heart className="h-5 w-5" />} /></Link>
        <Link to="/give" className="flex flex-col justify-center rounded-xl bg-ink-800 p-5 text-white hover:bg-ink-900">
          <span className="text-sm text-ink-200">Give online</span><span className="mt-1 font-semibold">Tithe, offering or a seed →</span>
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="My units" padded={false}>
          {d.units.length === 0 ? <div className="p-5"><Empty title="You're not in a unit yet">Speak to a leader about joining a department or cell.</Empty></div> : (
            <ul className="divide-y divide-ink-100">
              {d.units.map((u) => (
                <li key={u._id}><Link to={`/app/units/${u._id}`} className="block px-5 py-3.5 hover:bg-ink-50">
                  <div className="font-medium text-ink-900">{u.name}</div>
                  <div className="text-sm text-ink-500">{[u.meetingDay, u.meetingTime, u.meetingVenue].filter(Boolean).join(' · ') || 'Meeting time to be announced'}</div>
                  {u.leaders?.length ? <div className="mt-1 text-sm text-ink-400">Led by {u.leaders.map(fullName).join(', ')}</div> : null}
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
        <Upcoming events={d.events} />
      </div>
    </div>
  )
}

function Celebrations({ items }: { items: Celebration[] }) {
  return (
    <Card title="Birthdays & anniversaries this week" padded={false}>
      {items.length === 0 ? <div className="p-5"><Empty title="Nothing this week" /></div> : (
        <ul className="divide-y divide-ink-100">
          {items.map((c) => (
            <li key={`${c.kind}-${c.member._id}`} className="flex items-center gap-3 px-5 py-3">
              <Avatar person={c.member} size={34} />
              <div className="min-w-0 flex-1">
                <Link to={`/app/members/${c.member._id}`} className="font-medium text-ink-900 hover:underline">{fullName(c.member)}</Link>
                <div className="flex items-center gap-1.5 text-sm text-ink-500">{c.kind === 'birthday' ? <Cake className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
                  {c.kind === 'birthday' ? 'Birthday' : 'Wedding anniversary'} · {c.inDays === 0 ? <b className="text-brass-700">Today</b> : c.inDays === 1 ? 'Tomorrow' : date(c.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              </div>
              {c.member.phone && <a href={waLink(c.member.phone)} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 hover:underline">WhatsApp</a>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Upcoming({ events }: { events: Ev[] }) {
  return (
    <Card title="Upcoming events" actions={<Link to="/app/events" className="text-sm text-ink-500 hover:text-ink-800">All events</Link>} padded={false}>
      {events.length === 0 ? <div className="p-5"><Empty title="No upcoming events" /></div> : (
        <ul className="divide-y divide-ink-100">
          {events.map((e) => (
            <li key={e._id}><Link to={`/app/events/${e._id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-ink-50">
              <div className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-ink-50 py-1.5"><span className="text-[11px] text-ink-500">{date(e.startAt, { month: 'short' })}</span><span className="text-lg font-semibold leading-none text-ink-800">{new Date(e.startAt).getDate()}</span></div>
              <div className="min-w-0"><div className="truncate font-medium text-ink-900">{e.title}</div>
                <div className="flex items-center gap-1.5 text-sm text-ink-500"><CalendarDays className="h-3.5 w-3.5" />{time(e.startAt)}{e.location && ` · ${e.location}`}{e.unit && ` · ${e.unit.name}`}</div></div>
            </Link></li>
          ))}
        </ul>
      )}
    </Card>
  )
}
