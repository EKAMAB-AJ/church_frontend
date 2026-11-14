import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { api } from '../../lib/api'
import { date, time } from '../../lib/format'
import type { ChurchEvent } from '../../lib/types'
import { ErrorNote, Spinner } from '../../components/ui'
import { PageHero } from './About'

export default function Events() {
  const q = useQuery({ queryKey: ['public-events'], queryFn: () => api.page<ChurchEvent>('/public/events', { limit: 30 }) })
  return (
    <>
      <PageHero title="Events" text="Gatherings, programmes and special services. Everyone is welcome." />
      <div className="mx-auto max-w-4xl px-5 py-12">
        {q.isLoading ? <Spinner /> : q.error ? <ErrorNote error={q.error} onRetry={() => q.refetch()} /> : q.data!.items.length === 0 ? (
          <p className="text-ink-500">No upcoming events at the moment.</p>
        ) : (
          <ul className="space-y-4">
            {q.data!.items.map((e) => (
              <li key={e._id}>
                <Link to={`/events/${e._id}`} className="flex gap-5 rounded-2xl border border-ink-100 bg-white p-5 transition hover:shadow-md">
                  <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-ink-700 py-3 text-white">
                    <span className="text-xs uppercase text-brass-300">{date(e.startAt, { month: 'short' })}</span>
                    <span className="font-serif text-2xl font-semibold leading-none">{new Date(e.startAt).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-ink-900">{e.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500"><CalendarDays className="h-4 w-4" aria-hidden />{date(e.startAt, { weekday: 'long', day: 'numeric', month: 'long' })} · {time(e.startAt)}</p>
                    {e.location && <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500"><MapPin className="h-4 w-4" aria-hidden />{e.location}</p>}
                    {e.registrationOpen && <p className="mt-2 text-sm font-medium text-brass-700">{e.spotsLeft === 0 ? 'Fully booked' : 'Registration open'}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
