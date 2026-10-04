import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react';
import api from '../api/client';
import { getEventCover, getSocietyCover } from '../lib/coverImages';
import { FESTIVAL_SHOWCASES } from '../lib/societyShowcases';
import SocialMediaCard from '../components/SocialMediaCard';

const PCTE_SOCIAL_LINKS = {
  facebookUrl: 'https://www.facebook.com/pctegroup/',
  instagramUrl: 'https://www.instagram.com/pcteofficial/?hl=en',
  youtubeChannelUrl: 'https://youtube.com/@pctegroupofinstitutes?si=86Z_q8rap1tIILjK',
};

export default function Home() {
  const [events, setEvents] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/events?limit=3'), api.get('/societies')])
      .then(([e, s]) => {
        setEvents(e.data.events);
        setSocieties(s.data.societies);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-900 via-maroon-700 to-maroon-600 py-24 text-white">
        <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="page-shell relative animate-fadeInUp text-center">
          <span className="badge mb-4 bg-gold-500/20 text-gold-200">PCTE Group of Institutes</span>
          <h1 className="font-display text-4xl font-bold sm:text-5xl md:text-6xl">
            Every event. <span className="text-gold-400">One pulse.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
            Discover, register, and track every PCTE fest, society and competition — with live updates, QR tickets and instant certificates.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/events" className="btn-gold !px-6 !py-3">
              Explore Events <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn-secondary !border-white/40 !bg-white/10 !px-6 !py-3 !text-white hover:!bg-white/20">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      <section className="page-shell py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Upcoming & Live Fests</h2>
          <Link to="/events" className="text-sm font-semibold text-maroon-600 hover:underline dark:text-gold-400">View all →</Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-900" />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No events published yet — check back soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => (
              <Link
                key={ev._id}
                to={`/events/${ev.slug}`}
                style={{ animationDelay: `${i * 80}ms` }}
                className="glass-card group animate-fadeInUp p-0"
              >
                <div className="h-44 overflow-hidden bg-gradient-to-br from-maroon-500 to-maroon-800">
                  <img src={getEventCover(ev)} alt={`${ev.title} event artwork`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <span className="badge bg-maroon-50 text-maroon-700 dark:bg-maroon-900/40 dark:text-gold-300">
                    {ev.society?.name || 'PCTE'}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-gray-900 group-hover:text-maroon-600 dark:text-white dark:group-hover:text-gold-400">
                    {ev.title}
                  </h3>
                  {(ev.slug === 'koshish-2026' ? FESTIVAL_SHOWCASES.koshish.description : ev.description) && (
                    <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                      {ev.slug === 'koshish-2026' ? FESTIVAL_SHOWCASES.koshish.description : ev.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {new Date(ev.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {ev.venue && <span className="flex items-center gap-1.5"><MapPin size={13} /> {ev.venue}</span>}
                    {ev.slug === 'jasmine-sandlas-koshish-2026' ? (
                      <span className="flex items-center gap-1.5"><Users size={13} /> Festaweek live performance</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Users size={13} /> {ev.stats?.registrations || 0} registered</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="page-shell pb-8">
        <SocialMediaCard socialLinks={PCTE_SOCIAL_LINKS} eventTitle="PCTE" />
      </section>

      <section className="page-shell pb-20">
        <h2 className="mb-8 font-display text-2xl font-bold text-gray-900 dark:text-white">PCTE Societies</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {societies.map((s, i) => (
            <Link key={s._id} to={`/societies/${s.slug}`} style={{ animationDelay: `${i * 60}ms` }} className="glass-card animate-fadeInUp p-5 text-center hover:-translate-y-1">
              <img src={getSocietyCover(s)} alt={`${s.name} artwork`} className="mb-4 aspect-video w-full rounded-xl object-cover" />
              <p className="font-display text-sm font-bold text-gray-900 dark:text-white">{s.name}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.tagline}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
