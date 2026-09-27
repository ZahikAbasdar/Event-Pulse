import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Medal } from 'lucide-react';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';

export default function Leaderboard() {
  const { slug, compSlug } = useParams();
  const [competition, setCompetition] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, joinEvent } = useSocket();

  useEffect(() => {
    setLoading(true);
    api.get(`/events/${slug}/competitions/${compSlug}`).then(async ({ data }) => {
      setCompetition(data.competition);
      const [lb, fx] = await Promise.all([
        api.get(`/competitions/${data.competition._id}/leaderboard`),
        api.get(`/competitions/${data.competition._id}/fixtures`),
      ]);
      setLeaderboard(lb.data.leaderboard);
      setFixtures(fx.data.fixtures);
    }).finally(() => setLoading(false));
  }, [slug, compSlug]);

  useEffect(() => {
    if (!socket || !competition) return;
    joinEvent(competition.event);
    const refresh = () => {
      api.get(`/competitions/${competition._id}/leaderboard`).then(({ data }) => setLeaderboard(data.leaderboard));
      api.get(`/competitions/${competition._id}/fixtures`).then(({ data }) => setFixtures(data.fixtures));
    };
    socket.on('score:updated', refresh);
    socket.on('fixture:update', refresh);
    return () => { socket.off('score:updated', refresh); socket.off('fixture:update', refresh); };
  }, [socket, competition, joinEvent]);

  if (loading) return <div className="page-shell py-20 text-center text-gray-400">Loading leaderboard...</div>;

  const medalColor = (rank) => rank === 1 ? 'text-gold-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-600' : 'text-gray-300';

  return (
    <div className="page-shell animate-fadeInUp py-10">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-gray-900 dark:text-white">
        <Trophy className="text-gold-500" /> {competition?.name} — Leaderboard
      </h1>

      <div className="glass-card mt-6 divide-y divide-gray-100 dark:divide-gray-800">
        {leaderboard.map((entry) => (
          <div key={entry.rank} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Medal size={20} className={medalColor(entry.rank)} />
              <span className="font-display text-lg font-bold text-gray-400">#{entry.rank}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{entry.name}</span>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-maroon-600 dark:text-gold-400">{entry.averageScore.toFixed(1)}</p>
              <p className="text-xs text-gray-400">{entry.judgeCount} judge{entry.judgeCount !== 1 && 's'}</p>
            </div>
          </div>
        ))}
        {leaderboard.length === 0 && <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No scores submitted yet.</p>}
      </div>

      {fixtures.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 font-display text-xl font-bold text-gray-900 dark:text-white">Bracket / Fixtures</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {fixtures.map((f) => (
              <div key={f._id} className="glass-card flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400">{f.round}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{f.teamA?.name || 'TBD'} vs {f.teamB?.name || 'TBD'}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-gray-900 dark:text-white">{f.scoreA} - {f.scoreB}</p>
                  <span className={`badge ${f.status === 'live' ? 'bg-red-50 text-red-600' : f.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
