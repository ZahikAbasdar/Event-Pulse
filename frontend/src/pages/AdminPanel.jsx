import { useEffect, useState } from 'react';
import { Building2, ScrollText, AlertTriangle, BarChart3, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'orgs', label: 'Organizations', icon: Building2 },
  { id: 'benchmark', label: 'Benchmarking', icon: BarChart3 },
  { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('orgs');
  const [orgs, setOrgs] = useState([]);
  const [benchmark, setBenchmark] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const tabs = user?.role === 'super_admin'
    ? [...TABS, { id: 'accessRequests', label: 'Access Requests', icon: ShieldCheck }]
    : TABS.filter(({ id }) => id !== 'benchmark');

  useEffect(() => {
    setLoading(true);
    const load = {
      orgs: () => api.get('/admin/organizations').then(({ data }) => setOrgs(data.organizations)),
      benchmark: () => api.get('/admin/benchmarking').then(({ data }) => setBenchmark(data.benchmark)),
      escalations: () => api.get('/admin/escalations').then(({ data }) => setEscalations(data.escalations)),
      audit: () => api.get('/admin/audit-logs').then(({ data }) => setAuditLogs(data.logs)),
      accessRequests: () => api.get('/admin/access-requests').then(({ data }) => setAccessRequests(data.requests)),
    };
    (load[tab] || (() => Promise.resolve()))()
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load this admin section.'))
      .finally(() => setLoading(false));
  }, [tab]);

  const reviewRequest = async (requestId, decision) => {
    if (
      decision === 'approve'
      && !window.confirm('Only approve after independently verifying the applicant and their organization. Approval grants organization-admin access. Continue?')
    ) return;

    setReviewingId(requestId);
    try {
      const { data } = await api.patch(`/admin/access-requests/${requestId}`, { decision });
      setAccessRequests((current) => current.filter((request) => request._id !== requestId));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not review this request.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="animate-fadeInUp space-y-6">
      <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Admin Console</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium ${tab === id ? 'bg-maroon-500 text-white' : 'bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="glass-card p-5">
          {tab === 'orgs' && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-gray-400"><th className="pb-2">Name</th><th>Plan</th><th>Status</th></tr></thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 font-medium text-gray-900 dark:text-white">{o.name}</td>
                    <td className="capitalize">{o.plan}</td>
                    <td className="capitalize">{o.billingStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'benchmark' && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-gray-400"><th className="pb-2">Organization</th><th>Events</th><th>Registrations</th><th>Check-in Rate</th></tr></thead>
              <tbody>
                {benchmark.map((b, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 font-medium text-gray-900 dark:text-white">{b.organization}</td>
                    <td>{b.eventCount}</td>
                    <td>{b.totalRegistrations}</td>
                    <td>{b.checkInRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'escalations' && (
            <div className="space-y-3">
              {escalations.map((e) => (
                <div key={e._id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-white">{e.title}</p>
                    <span className={`badge ${e.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}>{e.severity}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{e.description}</p>
                  <span className="badge mt-2 bg-maroon-50 text-maroon-700 dark:bg-maroon-900/30 dark:text-gold-300">{e.status}</span>
                </div>
              ))}
              {escalations.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No escalations raised.</p>}
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-2">
              {auditLogs.map((l) => (
                <div key={l._id} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                  <span className="text-gray-700 dark:text-gray-300"><b>{l.actor?.name || 'System'}</b> · {l.action}</span>
                  <span className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No audit log entries.</p>}
            </div>
          )}

          {tab === 'accessRequests' && (
            <div className="space-y-4">
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                An .edu address alone does not verify a person’s identity or authority. Verify each applicant through a trusted institutional channel before approving.
              </p>
              {accessRequests.map((request) => (
                <article key={request._id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">{request.user?.name || 'Unknown applicant'}</h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{request.user?.email}</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{request.reason}</p>
                      <p className="mt-2 text-xs text-gray-400">Requested {new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={reviewingId === request._id}
                        onClick={() => reviewRequest(request._id, 'reject')}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId === request._id}
                        onClick={() => reviewRequest(request._id, 'approve')}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Approve as org admin
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {accessRequests.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No pending admin access requests.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
