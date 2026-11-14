import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, errorMessage, fieldErrors } from '../../lib/api'
import { date, dateTime, telLink, toDateInput } from '../../lib/format'
import type { Sermon, SiteSettings } from '../../lib/types'
import ImageUpload from '../../components/ImageUpload'
import ListEditor from '../../components/ListEditor'
import { Badge, Button, Card, Checkbox, ConfirmButton, Empty, ErrorNote, Modal, PageHeader, Pagination, Spinner, Tabs, TextArea, TextInput, useToast } from '../../components/ui'

type Tab = 'settings' | 'sermons' | 'inbox'
interface Inbox { _id: string; type: 'contact' | 'prayer'; name: string; email?: string; phone?: string; subject?: string; message: string; handled: boolean; createdAt: string }

export default function Website() {
  const [tab, setTab] = useState<Tab>('settings')
  const unread = useQuery({ queryKey: ['inbox', 'count'], queryFn: () => api.page<Inbox>('/website/inbox', { handled: 'false', limit: 1 }) })
  return (
    <>
      <PageHeader title="Website" description="What visitors see on your public site." actions={<a href="/" target="_blank" rel="noreferrer"><Button variant="secondary"><ExternalLink className="h-4 w-4" />View site</Button></a>} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ value: 'settings', label: 'Content' }, { value: 'sermons', label: 'Sermons' }, { value: 'inbox', label: 'Inbox', count: unread.data?.meta.total || undefined }]} /></div>
      {tab === 'settings' && <Settings />}
      {tab === 'sermons' && <Sermons />}
      {tab === 'inbox' && <InboxList />}
    </>
  )
}

function Settings() {
  const qc = useQueryClient()
  const toast = useToast()
  const q = useQuery({ queryKey: ['site-settings'], queryFn: () => api.get<SiteSettings>('/website/settings') })
  const [s, setS] = useState<SiteSettings | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => { if (q.data) setS(q.data) }, [q.data])
  const save = useMutation({
    mutationFn: () => {
      const { churchName, shortName, tagline, logoUrl, heroImageUrl, welcomeTitle, welcomeText, about, mission, vision, pastorName, pastorTitle, pastorPhotoUrl, pastorBio, address, phone, email, mapUrl, serviceTimes, socials, bank, onlineGivingEnabled,
        foundedYear, aboutImageUrl, milestones, values, beliefs, leaders, visitInfo, gallery, showMinistries, pastorMessage, homeVerse, homeVerseRef } = s!
      const filled = <T extends Record<string, unknown>>(list: T[], key: keyof T) => list.filter((x) => String(x[key] ?? '').trim())
      return api.put('/website/settings', {
        churchName, shortName, tagline, logoUrl, heroImageUrl, welcomeTitle, welcomeText, about, mission, vision, pastorName, pastorTitle, pastorPhotoUrl, pastorBio, address, phone, email, mapUrl,
        serviceTimes: serviceTimes.filter((t) => t.label || t.time), socials, bank, onlineGivingEnabled,
        foundedYear, aboutImageUrl, milestones: filled(milestones, 'title'), values: filled(values, 'title'), beliefs: filled(beliefs, 'title'),
        leaders: filled(leaders, 'name'), visitInfo: filled(visitInfo, 'title'), gallery: gallery.filter(Boolean), showMinistries, pastorMessage, homeVerse, homeVerseRef,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['site-settings'] }); qc.invalidateQueries({ queryKey: ['public-site'] }); toast('Website updated') },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  if (q.isLoading || !s) return <Spinner />
  if (q.error) return <ErrorNote error={q.error} />
  const t = (k: keyof SiteSettings, label: string, extra: Record<string, unknown> = {}) => (
    <TextInput label={label} value={String(s[k] ?? '')} onChange={(e) => setS({ ...s, [k]: e.target.value })} error={errors[k]} {...extra} />
  )
  const ta = (k: keyof SiteSettings, label: string, rows = 3, hint?: string) => (
    <TextArea label={label} rows={rows} hint={hint} value={String(s[k] ?? '')} onChange={(e) => setS({ ...s, [k]: e.target.value })} error={errors[k]} />
  )
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6 pb-20">
      <Card title="Church">
        <div className="grid gap-4 sm:grid-cols-2">
          {t('churchName', 'Church name')}{t('shortName', 'Also known as', { placeholder: 'Castlelite', hint: 'Shown under the name in the header.' })}
          {t('tagline', 'Tagline')}
          <ImageUpload label="Logo" kind="site" shape="square" value={s.logoUrl} onChange={(url) => setS({ ...s, logoUrl: url })} hint="Shown whole on a white tile, so any shape works." />
          <ImageUpload label="Home page photo" kind="site" value={s.heroImageUrl} onChange={(url) => setS({ ...s, heroImageUrl: url })} hint="A wide photo of the church or a service. Shown behind the welcome text." />
        </div>
      </Card>
      <Card title="Home page">
        <div className="space-y-4">
          {t('welcomeTitle', 'Headline')}{ta('welcomeText', 'Welcome message', 3)}
          {ta('pastorMessage', 'A word from our pastor', 4, 'A short, warm welcome in the pastor’s own words. Shown with the senior pastor’s photo (set under About page: leadership).')}
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">{ta('homeVerse', 'Scripture on the home page', 2)}{t('homeVerseRef', 'Reference', { placeholder: 'Psalm 18:2' })}</div>
        </div>
      </Card>
      <Card title="About page: our story">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            {t('foundedYear', 'Year founded', { placeholder: '2008', inputMode: 'numeric', hint: 'Shows as “Since 2008”.' })}
            <div />
          </div>
          {ta('about', 'How the church began', 8, 'Tell the story: who started it, where, and why. Leave a blank line between paragraphs. The first paragraph is shown larger.')}
          <ImageUpload label="Story photo" kind="site" value={s.aboutImageUrl} onChange={(url) => setS({ ...s, aboutImageUrl: url })} hint="An early photo, the first building, or the congregation today." />
        </div>
      </Card>
      <Card title="About page: history timeline">
        <p className="mb-4 text-sm text-ink-500">Key moments, oldest first: the first service, a new building, a church plant, an anniversary.</p>
        <ListEditor items={s.milestones} onChange={(milestones) => setS({ ...s, milestones })} blank={{ year: '', title: '', text: '', imageUrl: '' }}
          addLabel="Add a milestone" empty="No milestones yet." itemLabel={(m, i) => m.year || m.title ? `${m.year} ${m.title}`.trim() : `Milestone ${i + 1}`}
          fields={[{ key: 'year', label: 'Year', placeholder: '2008' }, { key: 'title', label: 'What happened', placeholder: 'First Sunday service' }, { key: 'text', label: 'A few words about it', type: 'textarea' }, { key: 'imageUrl', label: 'Photo (optional)', type: 'image' }]} />
      </Card>
      <Card title="About page: mission, vision and values">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">{ta('mission', 'Mission', 3)}{ta('vision', 'Vision', 3)}</div>
          <div>
            <span className="label">Core values</span>
            <ListEditor items={s.values} onChange={(values) => setS({ ...s, values })} blank={{ title: '', text: '' }} max={12}
              addLabel="Add a value" empty="No values yet." itemLabel={(v, i) => v.title || `Value ${i + 1}`}
              fields={[{ key: 'title', label: 'Value', placeholder: 'Prayer', span: 'full' }, { key: 'text', label: 'What it means for us', type: 'textarea', rows: 2 }]} />
          </div>
        </div>
      </Card>
      <Card title="About page: what we believe">
        <ListEditor items={s.beliefs} onChange={(beliefs) => setS({ ...s, beliefs })} blank={{ title: '', text: '' }} max={24}
          addLabel="Add a belief" empty="Nothing added yet." itemLabel={(v, i) => v.title || `Belief ${i + 1}`}
          fields={[{ key: 'title', label: 'Belief', placeholder: 'The Bible', span: 'full' }, { key: 'text', label: 'Explanation', type: 'textarea' }]} />
      </Card>
      <Card title="About page: leadership">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">{t('pastorName', 'Senior pastor’s name')}{t('pastorTitle', 'Title')}<ImageUpload label="Senior pastor’s photo" kind="site" shape="square" value={s.pastorPhotoUrl} onChange={(url) => setS({ ...s, pastorPhotoUrl: url })} className="sm:col-span-2" /></div>
          {ta('pastorBio', 'Senior pastor’s bio', 3)}
          <div>
            <span className="label">Leadership team</span>
            <ListEditor items={s.leaders} onChange={(leaders) => setS({ ...s, leaders })} blank={{ name: '', role: '', photoUrl: '', bio: '' }} max={30}
              addLabel="Add a leader" empty="Add pastors, deacons and ministry heads." itemLabel={(l, i) => l.name || `Leader ${i + 1}`}
              fields={[{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role', placeholder: 'Youth pastor' }, { key: 'photoUrl', label: 'Photo', type: 'image' }, { key: 'bio', label: 'Short bio', type: 'textarea', rows: 2 }]} />
          </div>
        </div>
      </Card>
      <Card title="About page: get involved, gallery and visiting">
        <div className="space-y-6">
          <Checkbox label="List our departments and ministries" hint="Taken from Units (departments and ministries only; home cells and meeting venues are never shown)." checked={s.showMinistries} onChange={(v) => setS({ ...s, showMinistries: v })} />
          <div>
            <span className="label">Photo gallery</span>
            <div className="grid gap-4 sm:grid-cols-2">
              {s.gallery.map((url, i) => (
                <ImageUpload key={i} label={`Photo ${i + 1}`} kind="site" value={url} onChange={(next) => setS({ ...s, gallery: next ? s.gallery.map((g, j) => (j === i ? next : g)) : s.gallery.filter((_, j) => j !== i) })} />
              ))}
            </div>
            {s.gallery.length < 30 && <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => setS({ ...s, gallery: [...s.gallery, ''] })}><Plus className="h-4 w-4" />Add a photo</Button>}
          </div>
          <div>
            <span className="label">What to expect on your first visit</span>
            <ListEditor items={s.visitInfo} onChange={(visitInfo) => setS({ ...s, visitInfo })} blank={{ title: '', text: '' }} max={8}
              addLabel="Add a point" empty="For example: parking, children’s church, how long a service lasts, what to wear." itemLabel={(v, i) => v.title || `Point ${i + 1}`}
              fields={[{ key: 'title', label: 'Heading', placeholder: 'Children are welcome', span: 'full' }, { key: 'text', label: 'Details', type: 'textarea', rows: 2 }]} />
          </div>
        </div>
      </Card>
      <Card title="Service times" actions={<Button size="sm" variant="secondary" type="button" onClick={() => setS({ ...s, serviceTimes: [...s.serviceTimes, { label: '', day: 'Sunday', time: '' }] })}><Plus className="h-4 w-4" />Add</Button>}>
        <p className="mb-4 text-sm text-ink-500">One row per service. For two Sunday services, add two rows with the day “Sunday” (for example First service 7:30 AM and Second service 10:00 AM); the site shows them together.</p>
        <div className="space-y-3">
          {s.serviceTimes.length === 0 && <p className="text-sm text-ink-400">No service times yet.</p>}
          {s.serviceTimes.map((st, i) => {
            const upd = (k: 'label' | 'day' | 'time', v: string) => setS({ ...s, serviceTimes: s.serviceTimes.map((x, j) => (j === i ? { ...x, [k]: v } : x)) })
            return (
              <div key={i} className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-end gap-3">
                <TextInput label={i === 0 ? 'Name' : undefined} aria-label="Service name" placeholder="First service" value={st.label} onChange={(e) => upd('label', e.target.value)} />
                <TextInput label={i === 0 ? 'Day' : undefined} aria-label="Day" value={st.day} onChange={(e) => upd('day', e.target.value)} />
                <TextInput label={i === 0 ? 'Time' : undefined} aria-label="Time" placeholder="8:00 AM" value={st.time} onChange={(e) => upd('time', e.target.value)} />
                <button type="button" onClick={() => setS({ ...s, serviceTimes: s.serviceTimes.filter((_, j) => j !== i) })} className="mb-1 rounded p-2 text-ink-400 hover:bg-ink-50 hover:text-red-600" aria-label="Remove service time"><Trash2 className="h-4 w-4" /></button>
              </div>
            )
          })}
        </div>
      </Card>
      <Card title="Contact & location">
        <div className="grid gap-4 sm:grid-cols-2">{t('address', 'Address')}{t('mapUrl', 'Google Maps link', { placeholder: 'https://maps.app.goo.gl/…' })}{t('phone', 'Phone')}{t('email', 'Email')}</div>
      </Card>
      <Card title="Social media">
        <div className="grid gap-4 sm:grid-cols-2">
          {(['facebook', 'instagram', 'youtube', 'x', 'whatsapp'] as const).map((k) => (
            <TextInput key={k} label={k === 'x' ? 'X (Twitter)' : k === 'youtube' ? 'YouTube' : k === 'whatsapp' ? 'WhatsApp link' : k[0].toUpperCase() + k.slice(1)} placeholder="https://…" value={s.socials[k] || ''} onChange={(e) => setS({ ...s, socials: { ...s.socials, [k]: e.target.value } })} />
          ))}
        </div>
      </Card>
      <Card title="Giving">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput label="Bank" value={s.bank.bankName} onChange={(e) => setS({ ...s, bank: { ...s.bank, bankName: e.target.value } })} />
            <TextInput label="Account name" value={s.bank.accountName} onChange={(e) => setS({ ...s, bank: { ...s.bank, accountName: e.target.value } })} />
            <TextInput label="Account number" inputMode="numeric" value={s.bank.accountNumber} onChange={(e) => setS({ ...s, bank: { ...s.bank, accountNumber: e.target.value } })} />
          </div>
          <Checkbox label="Accept card and transfer payments online (Paystack)" hint="Needs PAYSTACK_SECRET_KEY set on the server." checked={s.onlineGivingEnabled} onChange={(v) => setS({ ...s, onlineGivingEnabled: v })} />
        </div>
      </Card>
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-ink-100 bg-white/95 px-5 py-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-6xl justify-end"><Button type="submit" loading={save.isPending}>Publish changes</Button></div>
      </div>
    </form>
  )
}

function SermonForm({ item, onClose }: { item?: Sermon; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [f, setF] = useState({ title: item?.title || '', preacher: item?.preacher || '', date: toDateInput(item?.date || new Date()), scripture: item?.scripture || '', summary: item?.summary || '', videoUrl: item?.videoUrl || '', audioUrl: item?.audioUrl || '', published: item?.published ?? true })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () => (item ? api.patch(`/website/sermons/${item._id}`, f) : api.post('/website/sermons', f)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sermons'] }); qc.invalidateQueries({ queryKey: ['public-site'] }); toast('Sermon saved'); onClose() },
    onError: (e) => { setErrors(fieldErrors(e)); toast(errorMessage(e), 'error') },
  })
  return (
    <Modal open onClose={onClose} title={item ? 'Edit sermon' : 'Add a sermon'} wide footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} className="sm:col-span-2" autoFocus />
        <TextInput label="Preacher" value={f.preacher} onChange={(e) => setF({ ...f, preacher: e.target.value })} />
        <TextInput label="Date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <TextInput label="Scripture" placeholder="John 15:1–8" value={f.scripture} onChange={(e) => setF({ ...f, scripture: e.target.value })} className="sm:col-span-2" />
        <TextArea label="Summary" rows={3} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} className="sm:col-span-2" />
        <TextInput label="Video link" placeholder="YouTube or Facebook link" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
        <TextInput label="Audio link" value={f.audioUrl} onChange={(e) => setF({ ...f, audioUrl: e.target.value })} />
        <Checkbox label="Show on the website" checked={f.published} onChange={(v) => setF({ ...f, published: v })} />
      </div>
    </Modal>
  )
}

function Sermons() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin-sermons'], queryFn: () => api.get<Sermon[]>('/website/sermons') })
  const [editing, setEditing] = useState<Sermon | 'new' | null>(null)
  const del = useMutation({ mutationFn: (id: string) => api.del(`/website/sermons/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sermons'] }); qc.invalidateQueries({ queryKey: ['public-site'] }) } })
  return (
    <Card padded={false} title="Sermons" actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add sermon</Button>}>
      {q.isLoading ? <Spinner /> : !q.data?.length ? <div className="p-5"><Empty title="No sermons yet">Add last Sunday's message with a YouTube link.</Empty></div> : (
        <ul className="divide-y divide-ink-100">
          {q.data.map((m) => (
            <li key={m._id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1"><div className="font-medium text-ink-900">{m.title}</div><div className="text-sm text-ink-500">{[m.preacher, m.scripture, date(m.date)].filter(Boolean).join(' · ')}</div></div>
              {!m.published && <Badge>Hidden</Badge>}
              <button onClick={() => setEditing(m)} className="rounded p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700" aria-label={`Edit ${m.title}`}><Pencil className="h-4 w-4" /></button>
              <ConfirmButton title="Delete this sermon?" message={m.title} onConfirm={() => del.mutateAsync(m._id)}><Trash2 className="h-4 w-4" /></ConfirmButton>
            </li>
          ))}
        </ul>
      )}
      {editing && <SermonForm item={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </Card>
  )
}

function InboxList() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'open' | 'prayer' | 'contact' | 'all'>('open')
  const [page, setPage] = useState(1)
  const query = { page, ...(filter === 'open' ? { handled: 'false' } : filter === 'all' ? {} : { type: filter }) }
  const q = useQuery({ queryKey: ['inbox', query], queryFn: () => api.page<Inbox>('/website/inbox', query), placeholderData: keepPreviousData })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['inbox'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) }
  const mark = useMutation({ mutationFn: ({ id, handled }: { id: string; handled: boolean }) => api.patch(`/website/inbox/${id}`, { handled }), onSuccess: refresh })
  const del = useMutation({ mutationFn: (id: string) => api.del(`/website/inbox/${id}`), onSuccess: refresh })
  return (
    <Card padded={false}>
      <div className="border-b border-ink-100 p-4"><Tabs value={filter} onChange={(v) => { setFilter(v); setPage(1) }} tabs={[{ value: 'open', label: 'Unread' }, { value: 'prayer', label: 'Prayer requests' }, { value: 'contact', label: 'Messages' }, { value: 'all', label: 'All' }]} /></div>
      {q.isLoading ? <Spinner /> : !q.data?.items.length ? <div className="p-6"><Empty title={filter === 'open' ? "You're all caught up" : 'Nothing here'}>Messages and prayer requests from the website's Contact page arrive here.</Empty></div> : (
        <>
          <ul className="divide-y divide-ink-100">
            {q.data.items.map((m) => (
              <li key={m._id} className={m.handled ? 'px-5 py-4 opacity-70' : 'px-5 py-4'}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-ink-900">{m.name}</span>{' '}
                    <Badge tone={m.type === 'prayer' ? 'brass' : 'blue'}>{m.type === 'prayer' ? 'Prayer' : 'Message'}</Badge>
                    <div className="text-sm text-ink-500">{[m.phone && <a key="p" href={telLink(m.phone)} className="hover:underline">{m.phone}</a>, m.email && <a key="e" href={`mailto:${m.email}`} className="hover:underline">{m.email}</a>].filter(Boolean).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, ' · ', x] : [x]), [])}</div>
                  </div>
                  <span className="text-xs text-ink-400">{dateTime(m.createdAt)}</span>
                </div>
                {m.subject && <p className="mt-2 text-sm font-medium text-ink-800">{m.subject}</p>}
                <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{m.message}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => mark.mutate({ id: m._id, handled: !m.handled })}>{m.handled ? 'Mark unread' : m.type === 'prayer' ? 'Prayed for' : 'Mark handled'}</Button>
                  <ConfirmButton title="Delete this message?" message={`From ${m.name}`} onConfirm={() => del.mutateAsync(m._id)}><Trash2 className="h-4 w-4" /></ConfirmButton>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={q.data.meta.page} pages={q.data.meta.pages} onPage={setPage} />
        </>
      )}
    </Card>
  )
}
