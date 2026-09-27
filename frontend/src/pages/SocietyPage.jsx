import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import api from '../api/client';
import { getSocietyCover, getEventCover } from '../lib/coverImages';
import SocialMediaCard from '../components/SocialMediaCard';
import SocietyShowcase from '../components/SocietyShowcase';
import { FESTIVAL_SHOWCASES } from '../lib/societyShowcases';

const KOSHISH_SOCIAL_LINKS = {
  facebookUrl: 'https://www.facebook.com/pctegroup/',
  instagramUrl: 'https://www.instagram.com/pcteofficial/?hl=en',
  youtubeChannelUrl: 'https://youtube.com/@pctegroupofinstitutes?si=86Z_q8rap1tIILjK',
  youtubeVideoId: '36KQrBZlukY',
};

export default function SocietyPage() {
  const { slug } = useParams();
  const [society, setSociety] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/societies/${slug}`), api.get(`/events?society=${slug}`)])
      .then(([s, e]) => {
        setSociety(s.data.society);
        setEvents(e.data.events);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-shell py-20 text-center text-gray-400">Loading...</div>;
  if (!society) return <div className="page-shell py-20 text-center text-gray-400">Society not found.</div>;
  const showcase = FESTIVAL_SHOWCASES[slug];
  const socialLinks = slug === 'koshish' ? KOSHISH_SOCIAL_LINKS : null;

  return (
    <div>
      <div className="relative overflow-hidden py-16 text-center text-white" style={{ background: `linear-gradient(135deg, ${society.colorTheme}, #2b0d13)` }}>
        <img src={getSocietyCover(society)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/60" />
        <div className="page-shell relative animate-fadeInUp">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-200">{showcase?.eyebrow || 'PCTE Society'}</p>
          <h1 className="mt-2 font-display text-4xl font-bold drop-shadow">{society.name}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/90 drop-shadow">{showcase?.description || society.tagline}</p>
        </div>
      </div>

      <div className="page-shell py-12">
        {!showcase && society.description && <p className="max-w-3xl text-gray-600 dark:text-gray-300">{society.description}</p>}

        {showcase && <SocietyShowcase content={showcase} />}

        {socialLinks && <div className="mt-12"><SocialMediaCard socialLinks={socialLinks} eventTitle="Koshish Festaweek" /></div>}

        <h2 className="mt-10 mb-5 font-display text-xl font-bold text-gray-900 dark:text-white">Events by {society.name}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <Link key={ev._id} to={`/events/${ev.slug}`} className="glass-card overflow-hidden p-0">
              <img src={getEventCover(ev)} alt={`${ev.title} event artwork`} className="aspect-video w-full object-cover" />
              <div className="p-5">
                <h3 className="font-display font-bold text-gray-900 dark:text-white">{ev.title}</h3>
                {(ev.slug === 'koshish-2026' ? FESTIVAL_SHOWCASES.koshish.description : ev.description) && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                    {ev.slug === 'koshish-2026' ? FESTIVAL_SHOWCASES.koshish.description : ev.description}
                  </p>
                )}
                <span className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <CalendarDays size={13} /> {new Date(ev.startDate).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {events.length === 0 && <p className="text-gray-500 dark:text-gray-400">No events yet from this society.</p>}
        </div>

        {society.gallery?.length > 0 && (
          <>
            <h2 className="mt-10 mb-5 font-display text-xl font-bold text-gray-900 dark:text-white">Gallery</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {society.gallery.map((g, i) => (
                <img key={i} src={g.url} alt={g.caption || society.name} className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
