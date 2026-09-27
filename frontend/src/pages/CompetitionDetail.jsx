import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Users2, Trophy, Gavel, ListChecks } from 'lucide-react';
import api from '../api/client';

export default function CompetitionDetail() {
  const { slug, compSlug } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/events/${slug}/competitions/${compSlug}`)
      .then(({ data }) => setCompetition(data.competition))
      .finally(() => setLoading(false));
  }, [slug, compSlug]);

  if (loading) return <div className="page-shell py-20 text-center text-gray-400">Loading...</div>;
  if (!competition) return <div className="page-shell py-20 text-center text-gray-400">Competition event not found.</div>;

  const p = competition.pointsSystem || {};

  return (
    <div className="page-shell animate-fadeInUp py-10">
      <Link to={`/events/${slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-maroon-600 hover:underline dark:text-gold-400">
        <ArrowLeft size={15} /> Back to all events
      </Link>

      <div className="glass-card p-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{competition.name}</h1>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400"><Users2 size={14} /> Format</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {competition.format === 'team' ? `Team of ${competition.teamSize.min}${competition.teamSize.max !== competition.teamSize.min ? `-${competition.teamSize.max}` : ''}` : 'Individual'}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400"><Clock size={14} /> Time Allowed</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{competition.timeAllowed || '—'}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400"><Trophy size={14} /> Points (1st / 2nd / 3rd)</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{p.first} / {p.second} / {p.third}{p.participation ? ` (+${p.participation} participation)` : ''}</p>
          </div>
        </div>

        {competition.hasPreliminaryRound && (
          <p className="mt-4 badge bg-gold-50 text-gold-700 dark:bg-gold-900/20 dark:text-gold-300">Has a preliminary round</p>
        )}

        <div className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-gray-900 dark:text-white"><ListChecks size={18} /> Rules</h2>
          <ul className="mt-3 space-y-2.5">
            {competition.rules?.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-maroon-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {competition.judgingCriteria?.length > 0 && (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-gray-900 dark:text-white"><Gavel size={18} /> Judging Criteria</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {competition.judgingCriteria.map((j, i) => (
                <span key={i} className="badge bg-maroon-50 text-maroon-700 dark:bg-maroon-900/30 dark:text-gold-300">{j}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
