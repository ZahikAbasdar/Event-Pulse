import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminAccessRequest() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const justRegistered = useRef(false);
  const isEducationEmail = /\.(edu|edu\.in)$/i.test(user?.email?.split('@')[1] || '');
  const hasAdminRole = ['super_admin', 'org_admin'].includes(user?.role);

  useEffect(() => {
    if (!user) return;
    if (justRegistered.current) {
      justRegistered.current = false;
      return;
    }
    setLoading(true);
    api.get('/admin/access-requests/mine')
      .then(({ data }) => setRequest(data.request))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load your request status.'))
      .finally(() => setLoading(false));
  }, [user]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (!user) {
        if (!isEducationEmailFor(form.email)) {
          toast.error('Use an .edu or .edu.in email address.');
          return;
        }
        justRegistered.current = true;
        await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      }
      const { data } = await api.post('/admin/access-requests');
      setRequest(data.request);
      toast.success(data.message);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not submit the request.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell py-12 sm:py-16">
      <section className="glass-card mx-auto max-w-2xl p-6 sm:p-10">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-maroon-500/10 p-3 text-maroon-700 dark:text-gold-300">
            <ShieldCheck size={25} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-maroon-600 dark:text-gold-400">Admin access</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-gray-950 dark:text-white">Request an admin role</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Requests require an account using an <strong>.edu</strong> or <strong>.edu.in</strong> email and are reviewed by an existing super admin.
              Approval grants organization-admin access, not super-admin access.
            </p>
          </div>
        </div>

        {!user ? (
          <form onSubmit={submitRequest} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200" htmlFor="admin-access-name">Username</label>
            <input
              id="admin-access-name"
              required
              minLength={2}
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Your name"
              className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-400 focus:ring-4 focus:ring-maroon-400/10 dark:border-white/15 dark:bg-gray-950/40 dark:text-white"
            />
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200" htmlFor="admin-access-email">Education email</label>
            <input
              id="admin-access-email"
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@college.edu"
              className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-400 focus:ring-4 focus:ring-maroon-400/10 dark:border-white/15 dark:bg-gray-950/40 dark:text-white"
            />
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200" htmlFor="admin-access-password">Password</label>
            <input
              id="admin-access-password"
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="At least 8 characters"
              className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-400 focus:ring-4 focus:ring-maroon-400/10 dark:border-white/15 dark:bg-gray-950/40 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This creates a regular account and submits an admin request. Admin access remains pending until a super admin approves it.
            </p>
            <button type="submit" disabled={submitting} className="btn-primary !px-5 !py-3">
              {submitting ? 'Creating account and requesting access...' : 'Create account & request admin access'}
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already registered? <Link to="/login" className="font-semibold text-maroon-700 hover:underline dark:text-gold-300">Sign in first</Link> to request admin access.
            </p>
          </form>
        ) : hasAdminRole ? (
          <p className="mt-8 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
            Your account already has an admin role.
          </p>
        ) : !isEducationEmail ? (
          <p className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            Signed in as <strong>{user.email}</strong>. Only .edu and .edu.in account emails can request admin access.
          </p>
        ) : loading ? (
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">Checking request status...</p>
        ) : request?.status === 'pending' ? (
          <div className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="font-semibold">Your request is awaiting super-admin review.</p>
            <p className="mt-2">{request.reason}</p>
            <p className="mt-3 text-xs">Submitted {new Date(request.createdAt).toLocaleString()}.</p>
          </div>
        ) : (
          <form onSubmit={submitRequest} className="mt-8 space-y-4">
            {request?.status === 'rejected' && (
              <p role="status" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-900/20 dark:text-rose-200">
                Your previous request was not approved. You may submit a new request with additional information.
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300">Signed in as <strong>{user.email}</strong>. Your admin request will be reviewed by a super admin.</p>
            <button type="submit" disabled={submitting} className="btn-primary !px-5 !py-3">
              {submitting ? 'Submitting...' : 'Request admin access'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function isEducationEmailFor(email) {
  const domain = email.trim().toLowerCase().split('@')[1] || '';
  return domain.endsWith('.edu') || domain.endsWith('.edu.in');
}
