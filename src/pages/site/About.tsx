import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronDown, Clock, MapPin } from 'lucide-react'
import { api } from '../../lib/api'
import { cld } from '../../lib/cloudinary'
import { useSite } from '../../lib/site'
import type { Ministry, SiteSettings } from '../../lib/types'
import { Spinner } from '../../components/ui'
import ServiceTimes from '../../components/ServiceTimes'

export function PageHero({ title, text }: { title: string; text?: string }) {
  return (
    <section className="border-b border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h1 className="font-serif text-4xl font-semibold text-ink-900">{title}</h1>
        {text && <p className="mt-3 max-w-2xl text-lg text-ink-600">{text}</p>}
      </div>
    </section>
  )
}

const paragraphs = (text?: string) => (text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

function SectionTitle({ title, text, light }: { title: string; text?: string; light?: boolean }) {
  return (
    <div className="mb-10 max-w-2xl">
      <h2 className={`font-serif text-3xl font-semibold sm:text-4xl ${light ? 'text-white' : 'text-ink-900'}`}>{title}</h2>
      {text && <p className={`mt-3 text-lg ${light ? 'text-ink-200' : 'text-ink-600'}`}>{text}</p>}
    </div>
  )
}

export default function About() {
  const { data, isLoading } = useSite()
  const ministries = useQuery({ queryKey: ['public-ministries'], queryFn: () => api.get<Ministry[]>('/public/ministries'), enabled: Boolean(data?.site.showMinistries) })
  if (isLoading || !data) return <div className="pt-32"><Spinner /></div>
  const s = data.site
  const story = paragraphs(s.about)
  const known = s.shortName ? `${s.churchName}, or ${s.shortName} as many of us call it` : s.churchName

  return (
    <>
      {/* ---------------------------------------------------------- opening */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,149,74,.22),transparent_55%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-end gap-10 px-5 pb-16 pt-32 sm:pt-40 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-sm text-brass-300">About us</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.1] sm:text-6xl">{s.churchName}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-100">{s.tagline}</p>
          </div>
          {s.foundedYear && (
            <div className="lg:justify-self-end lg:text-right">
              <div className="text-sm text-ink-300">Serving our community since</div>
              <div className="font-serif text-7xl font-semibold leading-none text-brass-300 sm:text-8xl">{s.foundedYear}</div>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- story */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className={`grid gap-12 ${s.aboutImageUrl ? 'lg:grid-cols-[1.25fr_1fr]' : ''}`}>
          <div className="max-w-[68ch]">
            <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">Our story</h2>
            {story.length ? (
              <div className="mt-6">
                <p className="font-serif text-xl leading-relaxed text-ink-800 sm:text-2xl">{story[0]}</p>
                {story.slice(1).map((p, i) => <p key={i} className="mt-5 text-lg leading-relaxed text-ink-700">{p}</p>)}
              </div>
            ) : (
              <p className="mt-6 font-serif text-xl leading-relaxed text-ink-800">Welcome to {known}. {s.welcomeText}</p>
            )}
          </div>
          {s.aboutImageUrl && (
            <figure className="lg:pt-16">
              <img src={cld(s.aboutImageUrl, 'w_1000')} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover shadow-sm" />
            </figure>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- timeline */}
      {s.milestones.length > 0 && <Timeline items={s.milestones} />}

      {/* --------------------------------------------------- mission & vision */}
      {(s.mission || s.vision) && (
        <section className="bg-ink-800 text-white">
          <div className={`mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:py-20 ${s.mission && s.vision ? 'md:grid-cols-2' : ''}`}>
            {s.mission && <div><h2 className="text-sm font-medium text-brass-300">Our mission</h2><p className="mt-3 font-serif text-2xl leading-snug sm:text-3xl">{s.mission}</p></div>}
            {s.vision && <div><h2 className="text-sm font-medium text-brass-300">Our vision</h2><p className="mt-3 font-serif text-2xl leading-snug sm:text-3xl">{s.vision}</p></div>}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ values */}
      {s.values.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <SectionTitle title="What we value" />
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {s.values.map((v, i) => (
              <div key={i} className="border-t-2 border-brass-500 pt-4">
                <h3 className="font-serif text-xl font-semibold text-ink-900">{v.title}</h3>
                {v.text && <p className="mt-2 leading-relaxed text-ink-600">{v.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- beliefs */}
      {s.beliefs.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1fr_1.6fr]">
            <SectionTitle title="What we believe" text="The convictions at the centre of our life together." />
            <div className="divide-y divide-ink-100 border-y border-ink-100">
              {s.beliefs.map((b, i) => (
                <details key={i} className="group py-1" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-serif text-lg font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                    {b.title}
                    <ChevronDown className="h-5 w-5 shrink-0 text-ink-400 transition group-open:rotate-180" aria-hidden />
                  </summary>
                  {b.text && <div className="pb-5 pr-8 leading-relaxed text-ink-700">{paragraphs(b.text).map((p, j) => <p key={j} className="mt-2 first:mt-0">{p}</p>)}</div>}
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- leadership */}
      {(s.pastorName || s.leaders.length > 0) && <Leadership s={s} />}

      {/* ---------------------------------------------------- get involved */}
      {(ministries.data?.length ?? 0) > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
            <SectionTitle title="Find your place" text="There’s room for everyone to serve. These are some of the teams you can join." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.data!.map((m) => (
                <div key={m._id} className="rounded-2xl border border-ink-100 p-5">
                  <h3 className="font-semibold text-ink-900">{m.name}</h3>
                  {m.description && <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{m.description}</p>}
                  {(m.meetingDay || m.meetingTime) && <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-500"><Clock className="h-3.5 w-3.5" aria-hidden />{[m.meetingDay, m.meetingTime].filter(Boolean).join(', ')}</p>}
                </div>
              ))}
            </div>
            <Link to="/contact" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-700 hover:text-ink-900">Tell us you’d like to join a team <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- gallery */}
      {s.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <SectionTitle title="Moments from our church family" />
          <div className="columns-2 gap-3 sm:columns-3 [&>a]:mb-3">
            {s.gallery.map((url, i) => (
              <a key={i} href={cld(url, 'w_1800')} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl break-inside-avoid">
                <img src={cld(url, 'w_700')} alt="" loading="lazy" className="w-full transition duration-300 hover:scale-[1.02]" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- visit */}
      <Visit s={s} />
    </>
  )
}

function Timeline({ items }: { items: SiteSettings['milestones'] }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <SectionTitle title="Our journey" text="The moments that shaped us, from the beginning until now." />
        <ol className="relative">
          {/* the line */}
          <span className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-brass-300/70 lg:left-1/2 lg:-ml-px" aria-hidden />
          {items.map((m, i) => {
            const right = i % 2 === 1
            return (
              <li key={i} className="relative pb-12 pl-10 last:pb-0 lg:grid lg:grid-cols-2 lg:gap-16 lg:pl-0">
                <span className="absolute left-0 top-2 h-4 w-4 rounded-full border-4 border-white bg-brass-500 ring-1 ring-brass-300 lg:left-1/2 lg:-ml-2" aria-hidden />
                <div className={right ? 'lg:col-start-2' : 'lg:text-right'}>
                  <div className="font-serif text-4xl font-semibold leading-none text-brass-600 sm:text-5xl">{m.year}</div>
                  <h3 className="mt-3 font-serif text-xl font-semibold text-ink-900">{m.title}</h3>
                  {m.text && <p className={`mt-2 max-w-md leading-relaxed text-ink-600 ${right ? '' : 'lg:ml-auto'}`}>{m.text}</p>}
                  {m.imageUrl && <img src={cld(m.imageUrl, 'w_900')} alt="" loading="lazy" className={`mt-4 aspect-[3/2] w-full max-w-md rounded-xl object-cover ${right ? '' : 'lg:ml-auto'}`} />}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function Leadership({ s }: { s: SiteSettings }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <SectionTitle title="Our leaders" />
      {s.pastorName && (
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,20rem)_1fr]">
          {s.pastorPhotoUrl ? <img src={cld(s.pastorPhotoUrl, 'w_700,h_875,c_fill,g_face')} alt={s.pastorName} className="aspect-[4/5] w-full rounded-2xl object-cover" />
            : <div className="flex aspect-[4/5] w-full items-end rounded-2xl bg-ink-100 p-6 font-serif text-2xl text-ink-400">{s.pastorName}</div>}
          <div>
            <h3 className="font-serif text-3xl font-semibold text-ink-900">{s.pastorName}</h3>
            {s.pastorTitle && <p className="mt-1 text-brass-700">{s.pastorTitle}</p>}
            {paragraphs(s.pastorBio).map((p, i) => <p key={i} className="mt-4 max-w-[62ch] text-lg leading-relaxed text-ink-700">{p}</p>)}
          </div>
        </div>
      )}
      {s.leaders.length > 0 && (
        <div className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-4 ${s.pastorName ? 'mt-14' : ''}`}>
          {s.leaders.map((l, i) => (
            <div key={i}>
              {l.photoUrl ? <img src={cld(l.photoUrl, 'w_500,h_500,c_fill,g_face')} alt={l.name} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
                : <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-ink-100 font-serif text-4xl text-ink-300" aria-hidden>{l.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>}
              <h3 className="mt-3 font-semibold text-ink-900">{l.name}</h3>
              {l.role && <p className="text-sm text-brass-700">{l.role}</p>}
              {l.bio && <p className="mt-2 text-sm leading-relaxed text-ink-600">{l.bio}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Visit({ s }: { s: SiteSettings }) {
  return (
    <section className="bg-ink-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionTitle title="Plan your visit" text="We’d love to meet you. Here’s what to expect when you come." light />
          {s.visitInfo.length > 0 && (
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {s.visitInfo.map((v, i) => (
                <div key={i}>
                  <h3 className="font-semibold text-white">{v.title}</h3>
                  {v.text && <p className="mt-1 leading-relaxed text-ink-200">{v.text}</p>}
                </div>
              ))}
            </div>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg bg-brass-500 px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-brass-300">Ask us a question</Link>
            <Link to="/events" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><CalendarDays className="h-4 w-4" />See what’s on</Link>
          </div>
        </div>
        <div className="h-fit rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <h3 className="font-serif text-xl font-semibold">Service times</h3>
          <div className="mt-4"><ServiceTimes times={s.serviceTimes} tone="light" /></div>
          {s.address && (
            <p className="mt-6 flex gap-2 border-t border-white/10 pt-5 text-sm text-ink-200">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass-300" aria-hidden />
              <span>{s.address}{s.mapUrl && <> · <a href={s.mapUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-white">Get directions</a></>}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
