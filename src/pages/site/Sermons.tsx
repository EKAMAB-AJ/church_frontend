import { useQuery } from '@tanstack/react-query'
import { Headphones, PlayCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { date } from '../../lib/format'
import type { Sermon } from '../../lib/types'
import { ErrorNote, Spinner } from '../../components/ui'
import { PageHero } from './About'

export default function Sermons() {
  const q = useQuery({ queryKey: ['public-sermons'], queryFn: () => api.page<Sermon>('/public/sermons', { limit: 50 }) })
  return (
    <>
      <PageHero title="Sermons" text="Catch up on recent messages or share them with a friend." />
      <div className="mx-auto max-w-4xl px-5 py-12">
        {q.isLoading ? <Spinner /> : q.error ? <ErrorNote error={q.error} /> : q.data!.items.length === 0 ? <p className="text-ink-500">Sermons will appear here soon.</p> : (
          <ul className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
            {q.data!.items.map((m) => (
              <li key={m._id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-serif text-xl font-semibold text-ink-900">{m.title}</h2>
                    <p className="mt-1 text-sm text-ink-500">{[m.preacher, m.scripture, date(m.date)].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex gap-3">
                    {m.videoUrl && <a href={m.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-ink-700 px-3 py-2 text-sm font-medium text-white hover:bg-ink-800"><PlayCircle className="h-4 w-4" />Watch</a>}
                    {m.audioUrl && <a href={m.audioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"><Headphones className="h-4 w-4" />Listen</a>}
                  </div>
                </div>
                {m.summary && <p className="mt-3 max-w-[70ch] text-ink-600">{m.summary}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
