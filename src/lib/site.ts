import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { ChurchEvent, Sermon, SiteSettings } from './types'

export interface SiteFeed { site: SiteSettings; events: ChurchEvent[]; sermons: Sermon[]; onlineGiving: boolean }
export const useSite = () => useQuery({ queryKey: ['public-site'], queryFn: () => api.get<SiteFeed>('/public/site'), staleTime: 5 * 60_000 })

/** Shown while the site settings load, and if they can't be fetched. */
export const BRAND = {
  name: 'Castle of Life',
  shortName: 'Castlelite',
  logoUrl: 'https://res.cloudinary.com/ayukjohn/image/upload/v1794691324/castlelogo_g9tjyw.jpg',
}
