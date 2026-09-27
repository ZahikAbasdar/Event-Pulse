import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PcteLogo from './PcteLogo';

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const { user, logout, isOrganizer } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/societies', label: 'Societies' },
    { to: '/developer', label: 'Developer' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-gray-950/40">
      <nav className="page-shell flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <PcteLogo />
          <span className="font-display text-lg font-bold text-maroon-600 dark:text-gold-400">EventPulse</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-gray-600 hover:text-maroon-600 dark:text-gray-300 dark:hover:text-gold-400">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button onClick={toggle} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Toggle dark mode">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <button
                onClick={() => navigate(isOrganizer ? '/dashboard' : '/my/tickets')}
                className="btn-secondary !px-4 !py-2 text-xs"
              >
                <LayoutDashboard size={15} /> Dashboard
              </button>
              <button onClick={() => { logout(); navigate('/'); }} className="btn-primary !px-4 !py-2 text-xs">
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary !px-4 !py-2 text-xs">Login</Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-xs">Sign up</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {l.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2">
              {user ? (
                <>
                  <Link to={isOrganizer ? '/dashboard' : '/my/tickets'} className="btn-secondary flex-1 !px-3 !py-2 text-xs">Dashboard</Link>
                  <button onClick={() => { logout(); navigate('/'); }} className="btn-primary flex-1 !px-3 !py-2 text-xs">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary flex-1 !px-3 !py-2 text-xs">Login</Link>
                  <Link to="/register" className="btn-primary flex-1 !px-3 !py-2 text-xs">Sign up</Link>
                </>
              )}
              <button onClick={toggle} className="rounded-lg border border-gray-300 p-2 dark:border-gray-700" aria-label="Toggle dark mode">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
