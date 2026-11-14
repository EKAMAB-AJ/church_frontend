export type Role = 'admin' | 'leader' | 'member'
export interface Ref { _id: string; name?: string; firstName?: string; lastName?: string }
export interface UnitRef { _id: string; name: string; type?: string }

export interface Member {
  _id: string
  firstName: string
  lastName: string
  otherNames?: string
  fullName?: string
  email?: string
  phone?: string
  gender?: 'male' | 'female' | ''
  dateOfBirth?: string
  maritalStatus?: string
  weddingAnniversary?: string
  address?: string
  occupation?: string
  photoUrl?: string
  membershipStatus: 'active' | 'inactive' | 'transferred' | 'deceased'
  joinedAt?: string
  baptized?: boolean
  family?: { _id: string; name: string; address?: string } | null
  familyRole?: string
  units?: UnitRef[]
  notes?: string
  role: Role
  canLogin: boolean
  lastLoginAt?: string
  createdAt?: string
}

export interface Me extends Member { ledUnits: UnitRef[]; unitList: UnitRef[] }

export interface Unit {
  _id: string
  name: string
  type: string
  description?: string
  leaders: Member[]
  meetingDay?: string
  meetingTime?: string
  meetingVenue?: string
  active: boolean
  memberCount?: number
  iLead?: boolean
  iBelong?: boolean
}

export interface Service {
  _id: string
  title: string
  type: 'sunday' | 'midweek' | 'special' | 'unit'
  date: string
  unit?: UnitRef | null
  headcount: { men: number; women: number; children: number }
  headcountTotal?: number
  markedPresent?: number
  notes?: string
}

export interface Visitor {
  _id: string
  firstName: string
  lastName?: string
  phone?: string
  email?: string
  address?: string
  gender?: string
  visitDate: string
  service?: { _id: string; title: string; date: string } | null
  howHeard?: string
  invitedBy?: string
  prayerRequest?: string
  wantsVisit?: boolean
  status: 'new' | 'contacted' | 'returning' | 'member' | 'not_interested'
  assignedTo?: Member | null
  followUps: { _id: string; note: string; method: string; by?: Member; at: string }[]
  member?: Member | null
}

export interface Category { _id: string; name: string; description?: string; active: boolean; online: boolean }
export interface Contribution {
  _id: string
  member?: Member | null
  donorName?: string
  category: Category
  amount: number
  method: string
  date: string
  status: string
  reference?: string
  note?: string
  recordedBy?: Member
}
export interface Expense { _id: string; title: string; category: string; amount: number; date: string; paidTo?: string; method: string; reference?: string; note?: string }

export interface ChurchEvent {
  _id: string
  title: string
  description?: string
  startAt: string
  endAt?: string
  location?: string
  imageUrl?: string
  unit?: UnitRef | null
  isPublic: boolean
  registrationOpen: boolean
  capacity?: number
  registrationCount?: number
  registered?: boolean
  spotsLeft?: number | null
  canManage?: boolean
  registrations?: { _id: string; member?: Member; name?: string; email?: string; phone?: string; at: string }[]
}

export interface Sermon { _id: string; title: string; preacher?: string; date: string; scripture?: string; summary?: string; videoUrl?: string; audioUrl?: string; published: boolean }

export interface SiteSettings {
  churchName: string
  shortName: string
  tagline: string
  logoUrl: string
  heroImageUrl: string
  welcomeTitle: string
  welcomeText: string
  about: string
  mission: string
  vision: string
  foundedYear: string
  aboutImageUrl: string
  milestones: { year: string; title: string; text?: string; imageUrl?: string }[]
  values: { title: string; text?: string }[]
  beliefs: { title: string; text?: string }[]
  leaders: { name: string; role?: string; photoUrl?: string; bio?: string }[]
  visitInfo: { title: string; text?: string }[]
  gallery: string[]
  showMinistries: boolean
  pastorMessage: string
  homeVerse: string
  homeVerseRef: string
  pastorName: string
  pastorTitle: string
  pastorPhotoUrl: string
  pastorBio: string
  address: string
  phone: string
  email: string
  mapUrl: string
  serviceTimes: { label: string; day: string; time: string }[]
  socials: { facebook: string; instagram: string; youtube: string; x: string; whatsapp: string }
  bank: { bankName: string; accountName: string; accountNumber: string }
  onlineGivingEnabled: boolean
}

export interface Ministry { _id: string; name: string; type: string; description?: string; meetingDay?: string; meetingTime?: string }
