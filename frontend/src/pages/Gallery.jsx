import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import api from '../api/client';

export default function Gallery() {
  const { slug } = useParams();
  const [media, setMedia] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${slug}`).then(async ({ data }) => {
      setEvent(data.event);
      const m = await api.get(`/media/events/${data.event._id}`);
      setMedia(m.data.media);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-shell py-20 text-center text-gray-400">Loading gallery...</div>;

  return (
    <div className="page-shell animate-fadeInUp py-10">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-gray-900 dark:text-white">
        <ImageIcon className="text-maroon-500" /> {event?.title} — Gallery
      </h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {media.map((m) => (
          <div key={m._id} className="overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900">
            {m.type === 'photo' ? (
              <img src={m.url} alt={m.caption || event.title} className="aspect-square w-full object-cover" />
            ) : (
              <video src={m.url} controls className="aspect-square w-full object-cover" />
            )}
          </div>
        ))}
        {media.length === 0 && <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">No media uploaded yet for this event.</p>}
      </div>
    </div>
  );
}
