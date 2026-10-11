import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ImageIcon, Instagram } from 'lucide-react';
import api from '../api/client';

export default function Gallery() {
  const { slug } = useParams();
  const instagramCarouselItems = Array.from({ length: 20 }, (_, index) => index + 1);
  const [media, setMedia] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get(`/events/${slug}`)
      .then(async ({ data }) => {
        if (active) setEvent(data.event);
        const mediaResponse = await api.get(`/media/events/${data.event._id}`);
        if (active) setMedia(mediaResponse.data.media);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load this event gallery. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <div className="page-shell py-20 text-center text-gray-400">Loading gallery...</div>;

  return (
    <div className="page-shell animate-fadeInUp py-10">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-gray-900 dark:text-white">
        <ImageIcon className="text-maroon-500" /> {event?.title} — Gallery
      </h1>
      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {error} If the issue persists, the gallery storage service may need to be checked by the site administrator.
          <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">Retry</button>
        </div>
      )}
      {event?.slug === 'jasmine-sandlas-koshish-2026' && (
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">Jasmine Sandlas — Instagram carousel</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Browse the photos and videos here using the carousel controls. The media is embedded from Instagram.
            </p>
          </div>
          <div className="max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 dark:border-gray-800 dark:text-gray-200">
              <Instagram size={18} className="text-pink-500" /> PCTE official Instagram post
            </div>
            <iframe
              title="Jasmine Sandlas performance carousel from PCTE official Instagram"
              src="https://www.instagram.com/p/DeTwGLXk4VR/embed/"
              className="h-[760px] w-full border-0"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {media.map((m) => (
          <div key={m._id} className="overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900">
            {m.type === 'photo' ? (
              <img
                src={m.url}
                alt={m.caption || event?.title || 'Event gallery photo'}
                loading="lazy"
                className="aspect-square w-full object-cover"
                onError={(e) => {
                  e.currentTarget.alt = 'This photo is currently unavailable.';
                  e.currentTarget.classList.add('hidden');
                }}
              />
            ) : (
              <video
                src={m.url}
                controls
                preload="metadata"
                className="aspect-square w-full object-cover"
                onError={(e) => {
                  e.currentTarget.replaceWith(Object.assign(document.createElement('p'), {
                    className: 'p-4 text-sm text-gray-500',
                    textContent: 'This video is currently unavailable.',
                  }));
                }}
              />
            )}
          </div>
        ))}
        {media.length === 0 && !error && event?.slug !== 'jasmine-sandlas-koshish-2026' && (
          <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">No media uploaded yet for this event.</p>
        )}
      </div>
    </div>
  );
}
