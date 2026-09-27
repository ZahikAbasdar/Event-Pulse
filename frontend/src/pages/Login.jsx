import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LiquidBackground from '../components/LiquidBackground';
import PcteLogo from '../components/PcteLogo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const finishSignIn = (user) => {
    toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    const dest = location.state?.from?.pathname;
    const organizerRoles = ['super_admin', 'org_admin', 'event_manager', 'volunteer', 'judge', 'sponsor_viewer'];
    navigate(dest || (organizerRoles.includes(user.role) ? '/dashboard' : '/my/tickets'), { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      finishSignIn(await login(form.email, form.password));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-maroon-950 via-maroon-800 to-maroon-600 px-4">
      <LiquidBackground variant="dark" />

      <div className="glass-modal !max-w-md animate-fadeInUp !bg-white/10 !border-white/25 text-white">
        <div className="mb-6 flex flex-col items-center text-center">
          <PcteLogo className="mb-3 h-20 w-20 rounded-2xl shadow-[0_4px_20px_rgba(201,162,39,0.5)]" />
          <h1 className="font-display text-2xl font-bold">Welcome to EventPulse</h1>
          <p className="mt-1 text-sm text-white/70">Sign in with your email and password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={17} />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-2xl border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 outline-none backdrop-blur-xl focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={17} />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-2xl border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 outline-none backdrop-blur-xl focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full !py-3">
            <Sparkles size={16} /> {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-gold-300 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
