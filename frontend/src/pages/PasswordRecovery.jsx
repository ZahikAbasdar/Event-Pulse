import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Mail, Lock } from 'lucide-react';
import api from '../api/client';
import LiquidBackground from '../components/LiquidBackground';
import PcteLogo from '../components/PcteLogo';

export default function PasswordRecovery() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [reset, setReset] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (token && newPassword !== confirmPassword) {
      toast.error('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (token) {
        const { data } = await api.post('/auth/reset-password', { token, newPassword });
        toast.success(data.message);
        setReset(true);
      } else {
        const { data } = await api.post('/auth/forgot-password', { email });
        toast.success(data.message);
        setSent(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password recovery failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-maroon-950 via-maroon-800 to-maroon-600 px-4">
      <LiquidBackground variant="dark" />
      <div className="glass-modal relative !max-w-md animate-fadeInUp !border-white/25 !bg-white/10 text-white">
        <div className="mb-6 flex flex-col items-center text-center">
          <PcteLogo className="mb-3 h-20 w-20 rounded-2xl shadow-[0_4px_20px_rgba(201,162,39,0.5)]" />
          <h1 className="font-display text-2xl font-bold">
            {reset ? 'Password updated' : token ? 'Choose a new password' : 'Reset your password'}
          </h1>
          {!token && !reset && (
            <p className="mt-2 text-sm text-white/75">
              We’ll email a one-time reset link. It expires after 30 minutes.
            </p>
          )}
          {sent && !token && (
            <p role="status" className="mt-2 text-sm text-white/75">
              If an active account exists for that email, a reset link has been sent. If it doesn’t arrive, contact the service administrator.
            </p>
          )}
        </div>

        {!sent && !reset && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!token ? (
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={17} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Account email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20"
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={17} />
                  <input
                    type="password"
                    required
                    minLength={12}
                    autoComplete="new-password"
                    placeholder="New password (12+ characters)"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20"
                  />
                </div>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={17} />
                  <input
                    type="password"
                    required
                    minLength={12}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-400/20"
                  />
                </div>
              </>
            )}
            <button type="submit" disabled={loading} className="btn-gold w-full !py-3">
              {loading ? 'Please wait...' : token ? 'Update password' : 'Email reset link'}
            </button>
          </form>
        )}

        {(reset || (sent && !token)) && (
          <Link to="/login" className="btn-gold mt-2 w-full !py-3">
            Return to sign in
          </Link>
        )}
        {!sent && !reset && (
          <p className="mt-6 text-center text-sm text-white/75">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-gold-300 hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
