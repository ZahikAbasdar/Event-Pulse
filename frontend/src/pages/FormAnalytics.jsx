import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Copy, BarChart3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';

function NpsGauge({ score }) {
  if (score === null) return <p className="text-sm text-gray-400">Not enough NPS data yet.</p>;
  const pct = ((score + 100) / 200) * 100;
  const color = score >= 50 ? '#10b981' : score >= 0 ? '#C9A227' : '#ef4444';
  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="mt-2 font-display text-3xl font-bold" style={{ color }}>{score}</p>
      <p className="text-xs text-gray-400">NPS score (-100 to +100)</p>
    </div>
  );
}

export default function FormAnalytics() {
  const { socket } = useSocket();
  const [forms, setForms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [responses, setResponses] = useState([]);
  const [voiceUrls, setVoiceUrls] = useState({});
  const voiceUrlsRef = useRef(new Map());
  const selectedForm = forms.find((f) => f._id === selectedId);

  useEffect(() => {
    api.get('/forms').then(({ data }) => {
      setForms(data.forms);
      if (data.forms.length) setSelectedId(data.forms[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setAnalytics(null);
    setResponses([]);
    setVoiceUrls({});
    Promise.all([
      api.get(`/forms/${selectedId}/analytics`),
      api.get(`/forms/${selectedId}/responses`),
    ]).then(([analyticsResult, responsesResult]) => {
      if (!active) return;
      setAnalytics(analyticsResult.data);
      setResponses(responsesResult.data.responses);
    }).catch((err) => {
      if (active) toast.error(err.response?.data?.message || 'Could not load feedback responses.');
    });
    setAiSummary('');
    return () => {
      active = false;
      voiceUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      voiceUrlsRef.current.clear();
    };
  }, [selectedId]);

  useEffect(() => () => {
    voiceUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    voiceUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    const eventId = selectedForm?.event?._id;
    if (!socket || !eventId) return undefined;

    const refreshSelectedForm = async (payload) => {
      if (payload.eventId?.toString() !== eventId.toString()) return;
      try {
        const [analyticsResult, responsesResult] = await Promise.all([
          api.get(`/forms/${selectedId}/analytics`),
          api.get(`/forms/${selectedId}/responses`),
        ]);
        setAnalytics(analyticsResult.data);
        setResponses(responsesResult.data.responses);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not refresh live feedback analytics.');
      }
    };

    socket.emit('join:event', eventId);
    socket.on('feedback:new', refreshSelectedForm);
    return () => {
      socket.emit('leave:event', eventId);
      socket.off('feedback:new', refreshSelectedForm);
    };
  }, [socket, selectedForm?.event?._id, selectedId]);

  const maxWord = analytics?.wordCloud?.[0]?.value || 1;

  const loadVoiceRecording = async (responseId) => {
    try {
      const { data: audioBlob } = await api.get(`/forms/${selectedId}/responses/${responseId}/voice`, { responseType: 'blob' });
      const url = URL.createObjectURL(audioBlob);
      voiceUrlsRef.current.set(responseId, url);
      setVoiceUrls((current) => ({ ...current, [responseId]: url }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load the stored voice recording.');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/feedback/${selectedForm.shareSlug}`);
    toast.success('Link copied!');
  };

  const exportResponses = async (format) => {
    try {
      const { data, headers } = await api.get(`/forms/${selectedId}/responses/export`, {
        params: { format },
        responseType: 'blob',
      });
      const filename = headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1]
        || `event-feedback-responses.${format}`;
      const downloadUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not export responses as ${format.toUpperCase()}.`);
    }
  };

  const askAI = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/organizer-chat', {
        message: `Summarize the feedback for "${selectedForm.event?.title}" in 2-3 sentences — highlight strengths and the biggest area to improve.`,
        eventIds: [selectedForm.event?._id],
      });
      setAiSummary(data.reply);
    } catch (err) {
      toast.error('AI summary failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>;

  return (
    <div className="animate-fadeInUp space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-gray-900 dark:text-white"><BarChart3 /> Feedback Analytics</h1>
        <Link to="/dashboard/forms" className="btn-secondary !py-2 text-xs">+ Build another form</Link>
      </div>

      {forms.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No feedback forms yet. <Link to="/dashboard/forms" className="font-semibold text-maroon-600 hover:underline dark:text-gold-400">Build one</Link> to see analytics here.
        </div>
      ) : (
        <>
          <select value={selectedId || ''} onChange={(e) => setSelectedId(e.target.value)} className="input-field max-w-md">
            {forms.map((f) => <option key={f._id} value={f._id}>{f.title} ({f.responseCount} responses)</option>)}
          </select>

          {analytics && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="glass-card p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">NPS Score</h2>
                <NpsGauge score={analytics.nps.score} />
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="font-bold text-emerald-600">{analytics.nps.promoters}</p><p className="text-gray-400">Promoters</p></div>
                  <div><p className="font-bold text-gold-600">{analytics.nps.passives}</p><p className="text-gray-400">Passives</p></div>
                  <div><p className="font-bold text-red-500">{analytics.nps.detractors}</p><p className="text-gray-400">Detractors</p></div>
                </div>
              </div>

              <div className="glass-card p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Sentiment ({analytics.totalResponses} responses)</h2>
                {['positive', 'neutral', 'negative'].map((s) => {
                  const count = analytics.sentiment[s];
                  const total = analytics.totalResponses || 1;
                  const color = s === 'positive' ? '#10b981' : s === 'negative' ? '#ef4444' : '#9ca3af';
                  return (
                    <div key={s} className="mb-2">
                      <div className="flex justify-between text-xs capitalize text-gray-500 dark:text-gray-400"><span>{s}</span><span>{count}</span></div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-card p-5">
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400"><Sparkles size={14} /> EventPulse AI Summary</h2>
                {aiSummary ? <p className="text-sm text-gray-700 dark:text-gray-300">{aiSummary}</p> : (
                  <button onClick={askAI} disabled={aiLoading} className="btn-gold w-full !py-2 text-xs">{aiLoading ? 'Analyzing...' : 'Generate AI summary'}</button>
                )}
              </div>

              <div className="glass-card p-5 lg:col-span-2">
                <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Word Cloud</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {analytics.wordCloud.map((w) => (
                    <span key={w.text} style={{ fontSize: `${10 + (w.value / maxWord) * 22}px` }} className="font-semibold text-maroon-600 dark:text-gold-400">{w.text}</span>
                  ))}
                  {analytics.wordCloud.length === 0 && <p className="text-sm text-gray-400">Not enough open-text responses yet.</p>}
                </div>
              </div>

              <div className="glass-card flex flex-col justify-center gap-3 p-5">
                <button onClick={copyLink} className="btn-secondary w-full !py-2 text-xs"><Copy size={13} /> Copy share link</button>
                <p className="pt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Export responses</p>
                <div className="flex flex-wrap gap-2">
                  {['xlsx', 'csv', 'json'].map((format) => (
                    <button
                      key={format}
                      onClick={() => exportResponses(format)}
                      className="btn-primary flex-1 !px-3 !py-2 text-xs"
                      aria-label={`Export responses as ${format.toUpperCase()}`}
                    >
                      <Download size={13} /> {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedForm?.eventFeedback && (
            <section className="glass-card space-y-4 p-5">
              <div>
                <h2 className="font-display font-bold text-gray-900 dark:text-white">Voice feedback recordings</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Recordings are retained in private storage. Only authorized organizers can stream them here.
                </p>
              </div>
              {responses.filter((response) => response.voiceFeedback?.fileName).length === 0 ? (
                <p className="text-sm text-gray-400">No voice recordings have been submitted for this event yet.</p>
              ) : (
                <div className="space-y-3">
                  {responses.filter((response) => response.voiceFeedback?.fileName).map((response) => (
                    <div key={response._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{response.academicInfo?.name || 'Participant'} · {response.academicInfo?.rollNumber || 'No roll number'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(response.submittedAt).toLocaleString()}</p>
                      </div>
                      {voiceUrls[response._id] ? (
                        <audio controls src={voiceUrls[response._id]} className="max-w-full" aria-label={`Voice feedback by ${response.academicInfo?.name || 'participant'}`} />
                      ) : (
                        <button type="button" onClick={() => loadVoiceRecording(response._id)} className="btn-secondary !py-2 text-xs">
                          Load voice recording
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
