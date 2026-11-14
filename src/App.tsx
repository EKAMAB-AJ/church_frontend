import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import type { Role } from './lib/types'
import { Spinner } from './components/ui'
import SiteLayout from './layouts/SiteLayout'
import AppLayout from './layouts/AppLayout'

const Home = lazy(() => import('./pages/site/Home'))
const About = lazy(() => import('./pages/site/About'))
const SiteEvents = lazy(() => import('./pages/site/Events'))
const SiteEvent = lazy(() => import('./pages/site/EventDetail'))
const Sermons = lazy(() => import('./pages/site/Sermons'))
const Give = lazy(() => import('./pages/site/Give'))
const GiveThanks = lazy(() => import('./pages/site/GiveThanks'))
const Contact = lazy(() => import('./pages/site/Contact'))

const Login = lazy(() => import('./pages/auth/Login'))
const AcceptInvite = lazy(() => import('./pages/auth/AcceptInvite'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))

const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const Members = lazy(() => import('./pages/app/Members'))
const MemberDetail = lazy(() => import('./pages/app/MemberDetail'))
const Families = lazy(() => import('./pages/app/Families'))
const FamilyDetail = lazy(() => import('./pages/app/FamilyDetail'))
const Units = lazy(() => import('./pages/app/Units'))
const UnitDetail = lazy(() => import('./pages/app/UnitDetail'))
const Services = lazy(() => import('./pages/app/Services'))
const ServiceDetail = lazy(() => import('./pages/app/ServiceDetail'))
const Visitors = lazy(() => import('./pages/app/Visitors'))
const VisitorDetail = lazy(() => import('./pages/app/VisitorDetail'))
const Giving = lazy(() => import('./pages/app/Giving'))
const Expenses = lazy(() => import('./pages/app/Expenses'))
const Reports = lazy(() => import('./pages/app/Reports'))
const AppEvents = lazy(() => import('./pages/app/Events'))
const AppEventDetail = lazy(() => import('./pages/app/EventDetail'))
const Messages = lazy(() => import('./pages/app/Messages'))
const Website = lazy(() => import('./pages/app/Website'))
const Profile = lazy(() => import('./pages/app/Profile'))

function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />
  return <>{children}</>
}

export default function App() {
  const staff: Role[] = ['admin', 'leader']
  const admin: Role[] = ['admin']
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="events" element={<SiteEvents />} />
          <Route path="events/:id" element={<SiteEvent />} />
          <Route path="sermons" element={<Sermons />} />
          <Route path="give" element={<Give />} />
          <Route path="give/thank-you" element={<GiveThanks />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="accept-invite" element={<AcceptInvite />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        <Route path="app" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<RequireAuth roles={staff}><Members /></RequireAuth>} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="families" element={<RequireAuth roles={admin}><Families /></RequireAuth>} />
          <Route path="families/:id" element={<RequireAuth roles={admin}><FamilyDetail /></RequireAuth>} />
          <Route path="units" element={<Units />} />
          <Route path="units/:id" element={<UnitDetail />} />
          <Route path="attendance" element={<RequireAuth roles={staff}><Services /></RequireAuth>} />
          <Route path="attendance/:id" element={<RequireAuth roles={staff}><ServiceDetail /></RequireAuth>} />
          <Route path="first-timers" element={<RequireAuth roles={staff}><Visitors /></RequireAuth>} />
          <Route path="first-timers/:id" element={<RequireAuth roles={staff}><VisitorDetail /></RequireAuth>} />
          <Route path="giving" element={<RequireAuth roles={admin}><Giving /></RequireAuth>} />
          <Route path="expenses" element={<RequireAuth roles={admin}><Expenses /></RequireAuth>} />
          <Route path="reports" element={<RequireAuth roles={admin}><Reports /></RequireAuth>} />
          <Route path="events" element={<AppEvents />} />
          <Route path="events/:id" element={<AppEventDetail />} />
          <Route path="messages" element={<RequireAuth roles={staff}><Messages /></RequireAuth>} />
          <Route path="website" element={<RequireAuth roles={admin}><Website /></RequireAuth>} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
