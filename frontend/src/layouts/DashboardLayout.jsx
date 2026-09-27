import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Ticket, LogOut, Moon, Sun, Users2, ClipboardList, FileEdit, BarChart3, ShieldCheck, Award, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from '../components/NotificationBell';
import AIChatWidget from '../components/AIChatWidget';
import LiquidBackground from '../components/LiquidBackground';
import PcteLogo from '../components/PcteLogo';

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  org_admin: 'Org Admin',
  event_manager: 'Event Manager',
  volunteer: 'Volunteer',
  judge: 'Judge',
  sponsor_viewer: 'Sponsor Viewer',
  participant: 'Participant',
};

export default function DashboardLayout() {
  const { user, logout, isOrganizer } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const organizerLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/forms', label: 'Feedback Forms', icon: FileEdit },
    { to: '/dashboard/analytics/feedback', label: 'Feedback Analytics', icon: Sparkles },
    { to: '/dashboard/volunteers', label: 'Volunteer Tasks', icon: ClipboardList },
    { to: '/dashboard/analytics', label: 'Student Analytics', icon: BarChart3 },
    ...(['super_admin', 'org_admin'].includes(user?.role) ? [{ to: '/dashboard/admin', label: 'Admin Console', icon: ShieldCheck }] : []),
  ];
  const participantLinks = [
    { to: '/my/tickets', label: 'My Tickets', icon: Ticket, end: true },
    { to: '/my/certificates', label: 'My Certificates', icon: Award },
    { to: '/my/profile', label: 'My Profile', icon: Users2 },
  ];
  const links = isOrganizer ? organizerLinks : participantLinks;

  return (
    <div className="flex min-h-screen">
      <LiquidBackground variant={dark ? 'dark' : 'light'} />
      <aside className="hidden w-64 flex-col border-r border-white/30 bg-white/40 p-5 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-gray-950/40 md:flex">
        <div className="mb-8 flex items-center gap-2 px-1">
          <PcteLogo />
          <span className="font-display text-lg font-bold text-maroon-600 dark:text-gold-400">EventPulse</span>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-maroon-50 text-maroon-700 dark:bg-maroon-900/40 dark:text-gold-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon-100 text-sm font-semibold text-maroon-700 dark:bg-maroon-900 dark:text-gold-300">
              {user?.name?.[0] || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{ROLE_LABEL[user?.role] || user?.role}</p>
            </div>
            <NotificationBell />
          </div>
          <div className="flex gap-2">
            <button onClick={toggle} className="flex-1 rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              {dark ? <Sun size={16} className="mx-auto" /> : <Moon size={16} className="mx-auto" />}
            </button>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-maroon-500 p-2 text-xs font-semibold text-white hover:bg-maroon-600"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <main className="page-shell py-6">
          <Outlet />
        </main>
      </div>

      {isOrganizer && <AIChatWidget mode="organizer" />}
    </div>
  );
}
