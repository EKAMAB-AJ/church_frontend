import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BRAND, useSite } from '../../lib/site'
import { ChurchMark } from '../../layouts/SiteLayout'

export default function AuthShell({ title, text, children, foot }: { title: string; text?: ReactNode; children: ReactNode; foot?: ReactNode }) {
  const { data } = useSite()
  const name = data?.site.churchName || BRAND.name
  const shortName = data ? data.site.shortName : BRAND.shortName
  const logoUrl = data ? data.site.logoUrl : BRAND.logoUrl
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,149,74,.22),transparent_55%)]" aria-hidden />
        <Link to="/" className="relative"><ChurchMark name={name} shortName={shortName} logoUrl={logoUrl} light /></Link>
        <blockquote className="relative max-w-md">
          <p className="font-serif text-3xl leading-snug">"Let all things be done decently and in order."</p>
          <footer className="mt-3 text-sm text-brass-300">1 Corinthians 14:40</footer>
        </blockquote>
      </div>
      <div className="flex flex-col justify-center px-5 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 inline-block lg:hidden"><ChurchMark name={name} shortName={shortName} logoUrl={logoUrl} /></Link>
          <h1 className="font-serif text-3xl font-semibold text-ink-900">{title}</h1>
          {text && <p className="mt-2 text-ink-500">{text}</p>}
          <div className="mt-8">{children}</div>
          {foot && <div className="mt-8 text-sm text-ink-500">{foot}</div>}
        </div>
      </div>
    </div>
  )
}
