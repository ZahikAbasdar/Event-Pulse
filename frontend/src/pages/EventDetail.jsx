import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, MapPin, Users, QrCode, Trophy, ImageIcon } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AIChatWidget from '../components/AIChatWidget';
import SocialMediaCard from '../components/SocialMediaCard';
import SocietyShowcase from '../components/SocietyShowcase';
import { getEventCover } from '../lib/coverImages';
import { FESTIVAL_SHOWCASES } from '../lib/societyShowcases';

const KOSHISH_SOCIAL_LINKS = {
  facebookUrl: 'https://www.facebook.com/pctegroup/',
  instagramUrl: 'https://www.instagram.com/pcteofficial/?hl=en',
  youtubeChannelUrl: 'https://youtube.com/@pctegroupofinstitutes?si=86Z_q8rap1tIILjK',
  youtubeVideoId: '36KQrBZlukY',
};

const CATEGORY_LABEL = {
  group: 'Group', solo: 'Solo', dramatics: 'Dramatics', literary: 'Literary',
  creative_fine_art: 'Creative & Fine Art', sports: 'Sports', esports: 'Esports', other: 'Other',
};

export default function EventDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/events/${slug}`),
      api.get(`/events/${slug}/competitions${category ? `?category=${category}` : ''}`),
    ])
      .then(([evRes, compRes]) => {
        setEvent(evRes.data.event);
        setCompetitions(compRes.data.competitions);
      })
      .catch(() => toast.error('Could not load this event'))
      .finally(() => setLoading(false));
  }, [slug, category]);

  const handleRegister = async () => {
    if (!user) return toast.error('Please log in to register');
    setRegistering(true);
    try {
      await api.post(`/events/${event._id}/register`, { ticketTypeName: 'General' });
      toast.success('Registered! Your QR ticket is ready in My Tickets.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="page-shell py-20 text-center text-gray-400">Loading event...</div>;
  if (!event) return <div className="page-shell py-20 text-center text-gray-400">Event not found.</div>;

  const categories = [...new Set(competitions.map((c) => c.category))];
  const showcase = slug === 'koshish-2026' ? FESTIVAL_SHOWCASES.koshish : null;
  const socialLinks = slug === 'koshish-2026'
    ? Object.fromEntries(Object.entries(KOSHISH_SOCIAL_LINKS).map(([key, fallback]) => [key, event.socialLinks?.[key] || fallback]))
    : event.socialLinks;

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-maroon-900 via-maroon-700 to-maroon-600 py-16 text-white">
        <img src={getEventCover(event)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon-950/80 via-maroon-900/55 to-maroon-900/20" />
        <div className="page-shell relative animate-fadeInUp">
          {event.society && (
            <Link to={`/societies/${event.society.slug}`} className="badge mb-3 bg-gold-500/20 text-gold-200 hover:bg-gold-500/30">
              {event.society.name}
            </Link>
          )}
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{event.title}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{showcase?.description || event.description}</p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm text-white/80">
            <span className="flex items-center gap-2"><CalendarDays size={16} /> {new Date(event.startDate).toLocaleDateString()} – {new Date(event.endDate).toLocaleDateString()}</span>
            {event.venue && <span className="flex items-center gap-2"><MapPin size={16} /> {event.venue}</span>}
            {slug !== 'jasmine-sandlas-koshish-2026' && (
              <span className="flex items-center gap-2"><Users size={16} /> {event.stats?.registrations || 0} registered</span>
            )}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            {slug === 'jasmine-sandlas-koshish-2026' ? (
              <a href="https://pcte.edu.in/enquire" target="_blank" rel="noopener noreferrer" className="btn-gold !px-6 !py-3">
                Enquire with PCTE
              </a>
            ) : (
              <button onClick={handleRegister} disabled={registering} className="btn-gold !px-6 !py-3">
                <QrCode size={16} /> {registering ? 'Registering...' : 'Register for this event'}
              </button>
            )}
            <Link to={`/events/${slug}/gallery`} className="btn-secondary !border-white/40 !bg-white/10 !px-6 !py-3 !text-white hover:!bg-white/20">
              <ImageIcon size={16} /> Gallery
            </Link>
          </div>
        </div>
      </div>

      {showcase && (
        <div className="page-shell space-y-10 py-12">
          <SocietyShowcase content={showcase} />
        </div>
      )}

      {slug === 'jasmine-sandlas-koshish-2026' && (
        <section className="page-shell py-10">
          <div className="glass-card grid overflow-hidden p-0 md:grid-cols-[1.1fr_1fr]">
            <img
              src="/covers/jasmine-sandlas-poster.png"
              alt="Festaweek 2026 poster for Jasmine Sandlas, Ludhiana, October 9 at 7:00 PM"
              className="h-full min-h-64 w-full object-cover"
            />
            <div className="flex flex-col justify-center p-7">
              <span className="badge w-fit bg-gold-50 text-gold-800 dark:bg-gold-900/30 dark:text-gold-200">Festaweek 2026</span>
              <h2 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">Jasmine Sandlas — Live</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                The supplied event poster lists the performance in Ludhiana on October 9, 2026 at 7:00 PM.
              </p>
              <a
                href="https://youtube.com/@pctegroupofinstitutes?si=86Z_q8rap1tIILjK"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-5 w-fit !py-2 text-sm"
              >
                Visit the official PCTE YouTube channel
              </a>
            </div>
          </div>
        </section>
      )}

      <div className="page-shell py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-gray-900 dark:text-white">
            <Trophy size={22} className="text-gold-500" /> Competition Events
          </h2>
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCategory('')} className={`badge cursor-pointer ${!category ? 'bg-maroon-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>All</button>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`badge cursor-pointer ${category === c ? 'bg-maroon-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {CATEGORY_LABEL[c] || c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {competitions.map((c, i) => (
            <div
              key={c._id}
              onClick={() => navigate(`/events/${slug}/competitions/${c.slug}`)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="glass-card group animate-fadeInUp cursor-pointer overflow-hidden p-0 hover:-translate-y-1"
            >
              <img src={c.coverImageUrl || getEventCover(event)} alt="" className="aspect-video w-full object-cover" />
              <div className="p-5">
                <span className="badge bg-maroon-50 text-maroon-700 dark:bg-maroon-900/40 dark:text-gold-300">{CATEGORY_LABEL[c.category] || c.category}</span>
                <h3 className="mt-3 font-display text-base font-bold text-gray-900 group-hover:text-maroon-600 dark:text-white dark:group-hover:text-gold-400">{c.name}</h3>
                {c.description && <p className="mt-2 line-clamp-3 text-xs text-gray-500 dark:text-gray-400">{c.description}</p>}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {c.format === 'team' ? `Team of ${c.teamSize.min}${c.teamSize.max !== c.teamSize.min ? `-${c.teamSize.max}` : ''}` : 'Individual'}
                </p>
                {c.timeAllowed && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">⏱ {c.timeAllowed}</p>}
                <div className="mt-3 flex gap-1.5 text-[11px] font-semibold">
                  <span className="rounded bg-gold-50 px-1.5 py-0.5 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300">🥇 {c.pointsSystem?.first}</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-300">🥈 {c.pointsSystem?.second}</span>
                  <span className="rounded bg-orange-50 px-1.5 py-0.5 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">🥉 {c.pointsSystem?.third}</span>
                </div>
                <Link to={`/events/${slug}/competitions/${c.slug}/leaderboard`} onClick={(e) => e.stopPropagation()} className="mt-3 inline-block text-[11px] font-semibold text-maroon-600 hover:underline dark:text-gold-400">
                  View leaderboard →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {competitions.length === 0 && <p className="text-gray-500 dark:text-gray-400">No competition events listed yet.</p>}
      </div>

      <div className="page-shell pb-12">
        <SocialMediaCard
          socialLinks={socialLinks}
          eventTitle={event.title}
          autoPlayHighlight={slug === 'jasmine-sandlas-koshish-2026'}
        />
      </div>

      <AIChatWidget mode="public" eventSlug={slug} />
    </div>
  );
}
