import clsx from 'clsx'
import { groupByDay } from '../lib/services'
import type { SiteSettings } from '../lib/types'

/** Service times grouped by day: "Sunday — First service 7:30 AM · Second service 10:00 AM". */
export default function ServiceTimes({ times, tone = 'dark', size = 'md' }: { times: SiteSettings['serviceTimes']; tone?: 'dark' | 'light'; size?: 'sm' | 'md' }) {
  const groups = groupByDay(times)
  if (!groups.length) return null
  const light = tone === 'light'
  return (
    <dl className={clsx('space-y-4', size === 'sm' && 'space-y-3')}>
      {groups.map((g) => (
        <div key={g.day}>
          <dt className={clsx('font-serif font-semibold', size === 'sm' ? 'text-sm' : 'text-lg', light ? 'text-white' : 'text-ink-900')}>{g.day}</dt>
          <dd className="mt-1 space-y-1">
            {g.services.map((t, i) => (
              <div key={i} className={clsx('flex items-baseline justify-between gap-4', size === 'sm' ? 'text-sm' : '')}>
                <span className={light ? 'text-ink-200' : 'text-ink-600'}>{t.label}</span>
                <span className={clsx('font-semibold tabular-nums', light ? 'text-brass-300' : 'text-ink-900')}>{t.time}</span>
              </div>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  )
}
