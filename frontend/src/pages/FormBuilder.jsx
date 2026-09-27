import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2, Sparkles, Copy, Wand2, ExternalLink } from 'lucide-react';
import api from '../api/client';

const QUESTION_TYPES = ['rating', 'choice', 'open_text', 'nps'];

export default function FormBuilder() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ text: '', type: 'rating', options: [], required: true }]);
  const [aiDescription, setAiDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [createdForm, setCreatedForm] = useState(null);
  const [feedbackLinks, setFeedbackLinks] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  useEffect(() => {
    const loadEventsAndFeedback = async () => {
      try {
        const { data } = await api.get('/events/manage/mine');
        setEvents(data.events || []);
        const { data: feedbackData } = await api.post('/forms/event-feedback/ensure');
        setFeedbackLinks(feedbackData.links || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load event feedback links.');
      } finally {
        setLoadingFeedback(false);
      }
    };
    loadEventsAndFeedback();
  }, []);

  const updateQuestion = (i, field, value) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)));
  };
  const addQuestion = () => setQuestions((qs) => [...qs, { text: '', type: 'rating', options: [], required: true }]);
  const removeQuestion = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!eventId) return toast.error('Select an event first');
    setSaving(true);
    try {
      const { data } = await api.post('/forms', { event: eventId, title, description, questions });
      setCreatedForm(data.form);
      toast.success('Form created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create form');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!eventId) return toast.error('Select an event first');
    setAiLoading(true);
    try {
      const { data } = await api.post('/forms/ai-generate', { event: eventId, eventDescription: aiDescription });
      setCreatedForm(data.form);
      toast.success('AI generated a 10-question form!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const shareUrl = createdForm ? `${window.location.origin}/feedback/${createdForm.shareSlug}` : '';
  const shareFeedbackLink = async (url) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Event feedback form', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Feedback link copied.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('Could not share the feedback link.');
    }
  };

  return (
    <div className="animate-fadeInUp space-y-8">
      <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Feedback Form Builder</h1>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Event feedback links & QR codes</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Each event has a public form with ten event-specific questions. Participants can scan the QR code and respond without an account.
          </p>
        </div>
        {loadingFeedback ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Preparing event feedback forms…</p>
        ) : feedbackLinks.length === 0 ? (
          <div className="glass-card p-5 text-sm text-gray-500 dark:text-gray-400">Create or manage an event to generate its feedback form.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {feedbackLinks.map((item) => (
              <article key={item.event._id} className="glass-card flex flex-col gap-4 p-5 sm:flex-row">
                <img
                  src={item.qrCodeDataUrl}
                  alt={`Feedback form QR code for ${item.event.title}`}
                  className="h-36 w-36 self-center rounded-lg bg-white p-2"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-gray-900 dark:text-white">{item.event.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {item.form.questions.length} questions · {item.responseCount} responses · no participant login
                  </p>
                  <input
                    readOnly
                    aria-label={`${item.event.title} feedback URL`}
                    value={item.shareUrl}
                    className="input-field mt-3 !bg-gray-50 text-xs dark:!bg-gray-800"
                    onFocus={(event) => event.target.select()}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => shareFeedbackLink(item.shareUrl)} className="btn-secondary !px-3 !py-2 text-xs">
                      <Copy size={14} /> Share link
                    </button>
                    <a href={item.shareUrl} target="_blank" rel="noreferrer" className="btn-secondary !px-3 !py-2 text-xs">
                      <ExternalLink size={14} /> Open form
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="input-field max-w-md">
        <option value="">Select an event...</option>
        {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
      </select>

      {createdForm ? (
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">"{createdForm.title}" is ready</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{createdForm.questions.length} questions · shareable, no login required</p>
          <div className="mt-4 flex items-center gap-2">
            <input readOnly value={shareUrl} className="input-field flex-1 !bg-gray-50 dark:!bg-gray-800" />
            <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }} className="btn-secondary !px-4">
              <Copy size={15} />
            </button>
          </div>
          <button onClick={() => setCreatedForm(null)} className="btn-primary mt-4">Build another form</button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-900 dark:text-white"><Wand2 size={17} className="text-gold-500" /> AI-Assisted Builder</h2>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Describe the event, get a ready 10-question form (with academic ID fields included).</p>
            <textarea value={aiDescription} onChange={(e) => setAiDescription(e.target.value)} placeholder="e.g. A 5-day cultural fest with dance, music, debate and esports competitions..." rows={4} className="input-field" />
            <button onClick={handleAiGenerate} disabled={aiLoading} className="btn-gold mt-4 w-full">
              <Sparkles size={15} /> {aiLoading ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>

          <form onSubmit={handleCreate} className="glass-card p-6">
            <h2 className="mb-4 font-display font-bold text-gray-900 dark:text-white">Build Manually</h2>
            <input required placeholder="Form title" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field mb-3" />
            <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field mb-4" rows={2} />

            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input placeholder={`Question ${i + 1}`} value={q.text} onChange={(e) => updateQuestion(i, 'text', e.target.value)} className="input-field flex-1 !py-1.5 text-sm" />
                    <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)} className="input-field !w-28 !py-1.5 text-sm">
                      {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button type="button" onClick={() => removeQuestion(i)} className="text-red-500"><Trash2 size={16} /></button>
                  </div>
                  {q.type === 'choice' && (
                    <input placeholder="Comma-separated options" value={q.options?.join(',') || ''} onChange={(e) => updateQuestion(i, 'options', e.target.value.split(',').map((s) => s.trim()))} className="input-field mt-2 !py-1.5 text-sm" />
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addQuestion} className="btn-secondary mt-3 w-full !py-2 text-xs"><Plus size={14} /> Add question</button>
            <button type="submit" disabled={saving} className="btn-primary mt-4 w-full">{saving ? 'Saving...' : 'Create Form'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
