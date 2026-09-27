import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, CheckCircle2, Eye, Radio, ImagePlus, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'];
const VOICE_COLORS = { recorded: '#7A1F2B', not_recorded: '#C9A227' };

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <Icon size={18} className={accent} />
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function OrganizerDashboard() {
  const { socket, joinEvent, leaveEvent, connected } = useSocket();
  const [data, setData] = useState(null);
  const [charts, setCharts] = useState(null);
  const [chartsUpdatedAt, setChartsUpdatedAt] = useState(null);
  const [chartsError, setChartsError] = useState('');
  const [refreshingCharts, setRefreshingCharts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveFeed, setLiveFeed] = useState([]);
  const [uploadingCoverFor, setUploadingCoverFor] = useState(null);

  const load = useCallback(() => {
    api.get('/dashboard/organizer').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  const loadCharts = useCallback(async () => {
    setRefreshingCharts(true);
    try {
      const { data: chartData } = await api.get('/dashboard/organizer/charts');
      setCharts(chartData);
      setChartsUpdatedAt(new Date());
      setChartsError('');
    } catch (err) {
      setChartsError(err.response?.data?.message || 'Could not refresh dashboard charts.');
    } finally {
      setRefreshingCharts(false);
    }
  }, []);

  const uploadCoverImage = async (event, file) => {
    if (!file) return;
    setUploadingCoverFor(event._id);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('caption', `${event.title} cover image`);
      const { data: uploadData } = await api.post(`/media/events/${event._id}`, form);
      await api.patch(`/events/${event._id}`, { coverImageUrl: uploadData.media.url });
      setData((current) => current && ({
        ...current,
        events: current.events.map((item) =>
          item._id === event._id ? { ...item, coverImageUrl: uploadData.media.url } : item
        ),
      }));
      toast.success('Event cover image updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload the cover image');
    } finally {
      setUploadingCoverFor(null);
    }
  };

  useEffect(() => {
    load();
    api.post('/forms/event-feedback/ensure')
      .then(() => loadCharts())
      .catch((err) => {
        setChartsError(err.response?.data?.message || 'Could not prepare event feedback forms.');
        loadCharts();
      });
  }, [load, loadCharts]);

  // Power-BI-style auto-refresh: re-pull chart data every 20s as a safety
  // net, on top of the instant socket-driven updates below.
  useEffect(() => {
    const interval = setInterval(loadCharts, 20000);
    return () => clearInterval(interval);
  }, [loadCharts]);

  // Join a socket room per event so registrations/check-ins/feedback update
  // every chart live, no refresh
  useEffect(() => {
    if (!data?.events?.length || !socket) return;
    data.events.forEach((e) => joinEvent(e._id));

    const bumpToday = (deltaKey) => {
      setCharts((c) => {
        if (!c) return c;
        const days = [...c.registrationsByDay];
        days[days.length - 1] = { ...days[days.length - 1], count: days[days.length - 1].count + (deltaKey === 'count' ? 1 : 0) };
        return { ...c, registrationsByDay: days };
      });
    };

    const onReg = (payload) => {
      setLiveFeed((f) => [{ type: 'registration', ...payload }, ...f].slice(0, 15));
      setData((d) => d && { ...d, stats: { ...d.stats, registrations: d.stats.registrations + 1 } });
      bumpToday('count');
      setCharts((c) => c && {
        ...c,
        statusBreakdown: { ...c.statusBreakdown, valid: c.statusBreakdown.valid + 1 },
        registrationsByEvent: c.registrationsByEvent.map((e) => e.eventId === payload.eventId ? { ...e, registrations: e.registrations + 1 } : e),
      });
    };
    const onCheckin = (payload) => {
      setLiveFeed((f) => [{ type: 'checkin', ...payload }, ...f].slice(0, 15));
      setData((d) => d && { ...d, stats: { ...d.stats, checkIns: d.stats.checkIns + 1 } });
      setCharts((c) => c && {
        ...c,
        statusBreakdown: { ...c.statusBreakdown, valid: Math.max(0, c.statusBreakdown.valid - 1), checked_in: c.statusBreakdown.checked_in + 1 },
        registrationsByEvent: c.registrationsByEvent.map((e) => e.eventId === payload.eventId ? { ...e, checkIns: e.checkIns + 1 } : e),
      });
    };
    const onFeedback = (payload) => {
      setLiveFeed((feed) => [{
        type: 'feedback',
        eventTitle: data.events.find((event) => event._id === payload.eventId)?.title || 'an event',
        at: payload.submittedAt,
      }, ...feed].slice(0, 15));
      loadCharts();
    };

    socket.on('registration:new', onReg);
    socket.on('checkin:new', onCheckin);
    socket.on('feedback:new', onFeedback);

    return () => {
      data.events.forEach((e) => leaveEvent(e._id));
      socket.off('registration:new', onReg);
      socket.off('checkin:new', onCheckin);
      socket.off('feedback:new', onFeedback);
    };
  }, [data?.events, socket, joinEvent, leaveEvent, loadCharts]);

  if (loading) return <div className="py-20 text-center text-gray-400">Loading dashboard...</div>;

  const voicePieData = charts ? Object.entries(charts.voiceBreakdown).map(([key, value]) => ({
    name: key === 'recorded' ? 'Voice provided' : 'No voice recording',
    value,
    key,
  })) : [];

  return (
    <div className="animate-fadeInUp space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Organizer Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            <Radio size={13} className={connected ? 'animate-pulse' : ''} /> {connected ? 'Live' : 'Reconnecting'}
          </span>
          <button
            onClick={loadCharts}
            disabled={refreshingCharts}
            className="btn-secondary !px-3 !py-2 text-xs"
          >
            <RefreshCw size={14} className={refreshingCharts ? 'animate-spin' : ''} />
            {refreshingCharts ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Events" value={data.stats.totalEvents} icon={CalendarDays} accent="text-maroon-500" />
        <StatCard label="Registrations" value={data.stats.registrations} icon={Users} accent="text-gold-500" />
        <StatCard label="Check-ins" value={data.stats.checkIns} icon={CheckCircle2} accent="text-emerald-500" />
        <StatCard label="Page Views" value={data.stats.views} icon={Eye} accent="text-blue-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display font-bold text-gray-900 dark:text-white">My Events</h2>
          <div className="space-y-3">
            {data.events.map((ev) => (
              <div key={ev._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <div className="flex min-w-0 items-center gap-3">
                  {ev.coverImageUrl && (
                    <img src={ev.coverImageUrl} alt="" className="h-12 w-16 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">{ev.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ev.society?.name} · {ev.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right text-sm">
                  <label className={`btn-secondary cursor-pointer !px-3 !py-2 text-xs ${uploadingCoverFor === ev._id ? 'pointer-events-none opacity-60' : ''}`}>
                    <ImagePlus size={14} /> {uploadingCoverFor === ev._id ? 'Uploading...' : 'Cover image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={uploadingCoverFor === ev._id}
                      onChange={(e) => {
                        uploadCoverImage(ev, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <p className="font-semibold text-maroon-600 dark:text-gold-400">{ev.stats?.registrations || 0} regs</p>
                  <Link to={`/events/${ev.slug}`} className="text-xs text-gray-400 hover:underline">View public page</Link>
                </div>
              </div>
            ))}
            {data.events.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No events yet.</p>}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 font-display font-bold text-gray-900 dark:text-white">Live Activity</h2>
          <div className="space-y-3">
            {liveFeed.length === 0 && data.recentActivity.slice(0, 8).map((t) => (
              <div key={t._id} className="text-sm">
                <p className="text-gray-800 dark:text-gray-200"><b>{t.user?.name}</b> registered for {t.event?.title}</p>
                <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleTimeString()}</p>
              </div>
            ))}
            {liveFeed.map((item, i) => (
              <div key={i} className="animate-fadeInUp text-sm">
                <p className="text-gray-800 dark:text-gray-200">
                  {item.type === 'registration'
                    ? <><b>{item.userName}</b> just registered</>
                    : item.type === 'checkin'
                      ? <><b>{item.userName}</b> just checked in</>
                      : <>New anonymous feedback submitted for <b>{item.eventTitle}</b></>}
                </p>
                <p className="text-xs text-gray-400">{new Date(item.at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {charts && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Live feedback analytics</h2>
            {chartsUpdatedAt && <p className="text-xs text-gray-500 dark:text-gray-400">Data refreshed {chartsUpdatedAt.toLocaleTimeString()}</p>}
          </div>
          {chartsError && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">{chartsError} Showing the last loaded data.</p>}
          <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-5">
            <h2 className="mb-4 font-display font-bold text-gray-900 dark:text-white">Feedback responses — last 14 days</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={charts.responsesByDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Responses" stroke="#7A1F2B" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h2 className="mb-4 font-display font-bold text-gray-900 dark:text-white">Feedback responses by event</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.feedbackByEvent} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Feedback responses" fill="#C9A227" radius={[6, 6, 0, 0]} animationDuration={500} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h2 className="mb-4 font-display font-bold text-gray-900 dark:text-white">Overall experience ratings</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.ratingBreakdown} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Ratings" radius={[6, 6, 0, 0]} animationDuration={500}>
                  {charts.ratingBreakdown.map((entry, index) => <Cell key={entry.rating} fill={RATING_COLORS[index]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h2 className="mb-4 font-display font-bold text-gray-900 dark:text-white">Voice feedback coverage</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={voicePieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} animationDuration={500}>
                  {voicePieData.map((entry) => <Cell key={entry.key} fill={VOICE_COLORS[entry.key]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        </section>
      )}
      {!charts && chartsError && (
        <div role="status" className="glass-card p-5">
          <p className="text-sm text-amber-700 dark:text-amber-300">{chartsError}</p>
          <button onClick={loadCharts} disabled={refreshingCharts} className="btn-secondary mt-3 !py-2 text-xs">
            <RefreshCw size={14} className={refreshingCharts ? 'animate-spin' : ''} />
            Retry charts
          </button>
        </div>
      )}
    </div>
  );
}
