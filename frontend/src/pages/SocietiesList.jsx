import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { getSocietyCover } from '../lib/coverImages';

export default function SocietiesList() {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/societies').then(({ data }) => setSocieties(data.societies)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell py-10">
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">PCTE Societies</h1>
      <p className="mt-1 text-gray-500 dark:text-gray-400">Explore each society's branded page, gallery and events.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-900" />)
          : societies.map((s) => (
              <Link key={s._id} to={`/societies/${s.slug}`} className="glass-card overflow-hidden p-0 hover:-translate-y-1">
                <img src={getSocietyCover(s)} alt={`${s.name} artwork`} className="aspect-video w-full object-cover" />
                <div className="p-6">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">{s.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.tagline}</p>
                {s.description && <p className="mt-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{s.description}</p>}
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
