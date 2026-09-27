import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LiquidBackground from '../components/LiquidBackground';
import { useTheme } from '../context/ThemeContext';

export default function PublicLayout() {
  const { dark } = useTheme();
  return (
    <div className="min-h-screen">
      <LiquidBackground variant={dark ? 'dark' : 'light'} />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="mt-24 border-t border-white/30 py-8 text-center text-xs text-gray-500 dark:border-white/10 dark:text-gray-500">
        <p>© {new Date().getFullYear()} EventPulse — built for PCTE Group of Institutes.</p>
        <p className="mt-2">
          Made by <a href="/developer" className="font-semibold text-maroon-600 hover:underline dark:text-gold-400">Zahik Abas</a>
        </p>
      </footer>
    </div>
  );
}
