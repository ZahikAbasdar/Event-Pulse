import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VolunteerAssignments() {
  const { user } = useAuth();
  const isStaff = ['super_admin', 'org_admin', 'event_manager'].includes(user?.role);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/volunteers/mine').then(({ data }) => setAssignments(data.assignments)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/volunteers/${id}/status`, { status });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-400">Loading assignments...</div>;

  return (
    <div className="animate-fadeInUp space-y-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-gray-900 dark:text-white">
        <ClipboardList /> My Volunteer Tasks
      </h1>
      <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a._id} className="glass-card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{a.task}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{a.event?.title} · {new Date(a.shiftStart).toLocaleString()} – {new Date(a.shiftEnd).toLocaleTimeString()}</p>
              {a.notes && <p className="mt-1 text-xs text-gray-400">{a.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${a.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>{a.status}</span>
              {a.status !== 'completed' && (
                <button onClick={() => updateStatus(a._id, a.status === 'assigned' ? 'confirmed' : 'completed')} className="btn-secondary !px-3 !py-1.5 text-xs">
                  <CheckCircle2 size={13} /> {a.status === 'assigned' ? 'Confirm' : 'Mark done'}
                </button>
              )}
            </div>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No volunteer tasks assigned yet.</p>}
      </div>
    </div>
  );
}
