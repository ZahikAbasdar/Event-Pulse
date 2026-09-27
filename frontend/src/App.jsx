import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import CompetitionDetail from './pages/CompetitionDetail';
import SocietiesList from './pages/SocietiesList';
import SocietyPage from './pages/SocietyPage';
import DeveloperProfile from './pages/DeveloperProfile';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ParticipantTickets from './pages/ParticipantTickets';
import Profile from './pages/Profile';
import FormBuilder from './pages/FormBuilder';
import FormAnalytics from './pages/FormAnalytics';
import PublicFeedbackForm from './pages/PublicFeedbackForm';
import Leaderboard from './pages/Leaderboard';
import Certificates from './pages/Certificates';
import Gallery from './pages/Gallery';
import VolunteerAssignments from './pages/VolunteerAssignments';
import AdminPanel from './pages/AdminPanel';
import StudentAnalytics from './pages/StudentAnalytics';
import { NotFound, Unauthorized } from './pages/StatusPages';

const ORGANIZER_ROLES = ['super_admin', 'org_admin', 'event_manager', 'volunteer', 'judge', 'sponsor_viewer'];

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/:slug" element={<EventDetail />} />
        <Route path="/events/:slug/competitions/:compSlug" element={<CompetitionDetail />} />
        <Route path="/events/:slug/competitions/:compSlug/leaderboard" element={<Leaderboard />} />
        <Route path="/events/:slug/gallery" element={<Gallery />} />
        <Route path="/feedback/:shareSlug" element={<PublicFeedbackForm />} />
        <Route path="/societies" element={<SocietiesList />} />
        <Route path="/societies/:slug" element={<SocietyPage />} />
        <Route path="/developer" element={<DeveloperProfile />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={ORGANIZER_ROLES}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<OrganizerDashboard />} />
        <Route path="/dashboard/forms" element={<FormBuilder />} />
        <Route path="/dashboard/analytics/feedback" element={<FormAnalytics />} />
        <Route path="/dashboard/volunteers" element={<VolunteerAssignments />} />
        <Route path="/dashboard/analytics" element={<StudentAnalytics />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={['super_admin', 'org_admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard/admin" element={<AdminPanel />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/my/tickets" element={<ParticipantTickets />} />
        <Route path="/my/profile" element={<Profile />} />
        <Route path="/my/certificates" element={<Certificates />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
