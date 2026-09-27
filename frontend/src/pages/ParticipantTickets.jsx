import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, CheckCircle2, MessageSquareHeart } from 'lucide-react';
import api from '../api/client';

export default function ParticipantTickets() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/participant').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-gray-400">Loading your tickets...</div>;

  return (
    <div className="animate-fadeInUp space-y-8">
      <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">My Tickets</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5 text-center">
          <p className="font-display text-3xl font-bold text-maroon-600 dark:text-gold-400">{data.stats.totalRegistered}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Registered</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="font-display text-3xl font-bold text-emerald-600">{data.stats.checkedIn}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Checked In</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="font-display text-3xl font-bold text-blue-600">{data.stats.upcoming}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.tickets.map((t) => (
          <div key={t._id} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-gray-900 dark:text-white">{t.event?.title}</h3>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <CalendarDays size={13} /> {t.event?.startDate && new Date(t.event.startDate).toLocaleDateString()}
                </span>
                {t.event?.venue && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><MapPin size={13} /> {t.event.venue}</span>
                )}
              </div>
              {t.status === 'checked_in' && (
                <span className="badge flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <CheckCircle2 size={12} /> Checked in
                </span>
              )}
            </div>
            {t.qrDataUrl && <img src={t.qrDataUrl} alt="Ticket QR code" className="mx-auto mt-4 h-36 w-36 rounded-lg border border-gray-100 dark:border-gray-800" />}
            <p className="mt-3 text-center text-xs text-gray-400">{t.ticketTypeName} · Code ends in {t.code?.slice(-6)}</p>

            {t.feedbackQrDataUrl && (
              <div className="mt-4 border-t border-gray-100 pt-4 text-center dark:border-gray-800">
                <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-maroon-600 dark:text-gold-400">
                  <MessageSquareHeart size={14} /> Scan to give feedback
                </p>
                <img src={t.feedbackQrDataUrl} alt="Feedback QR code" className="mx-auto h-28 w-28 rounded-lg border border-gray-100 dark:border-gray-800" />
                {t.feedbackSubmitted ? (
                  <p className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 size={12} /> Feedback submitted</p>
                ) : (
                  <a href={t.feedbackUrl} className="mt-2 inline-block text-xs font-medium text-maroon-600 hover:underline dark:text-gold-400">or tap here</a>
                )}
              </div>
            )}
          </div>
        ))}
        {data.tickets.length === 0 && <p className="text-gray-500 dark:text-gray-400">You haven't registered for any events yet.</p>}
      </div>
    </div>
  );
}
