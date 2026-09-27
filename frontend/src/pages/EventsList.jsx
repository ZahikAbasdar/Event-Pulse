import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, CalendarDays, MapPin } from 'lucide-react';
import api from '../api/client';
import { getEventCover } from '../lib/coverImages';

export default function EventsList() {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    api
      .get(`/events?${query.toString()}`)
      .then(({ data }) => setEvents(data.events))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (e) => {
    e.preventDefault();
    setParams(q ? { q } : {});
  };

  return (
    <div className="page-shell py-10">
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">All Events</h1>
      <p className="mt-1 text-gray-500 dark:text-gray-400">Search and discover fests and events across PCTE.</p>

      <form onSubmit={handleSearch} className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events..." className="input-field pl-10" />
      </form>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-900" />)
          : events.map((ev) => (
              <Link key={ev._id} to={`/events/${ev.slug}`} className="glass-card p-0">
                <div className="h-40 overflow-hidden bg-gradient-to-br from-maroon-500 to-maroon-800">
                  <img src={getEventCover(ev)} alt={`${ev.title} event artwork`} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <span className="badge bg-maroon-50 text-maroon-700 dark:bg-maroon-900/40 dark:text-gold-300">{ev.society?.name || 'PCTE'}</span>
                  <h3 className="mt-3 font-display text-lg font-bold text-gray-900 dark:text-white">{ev.title}</h3>
                  <div className="mt-3 flex flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {new Date(ev.startDate).toLocaleDateString()}</span>
                    {ev.venue && <span className="flex items-center gap-1.5"><MapPin size={13} /> {ev.venue}</span>}
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {!loading && events.length === 0 && <p className="mt-10 text-center text-gray-500 dark:text-gray-400">No events found.</p>}
    </div>
  );
}
