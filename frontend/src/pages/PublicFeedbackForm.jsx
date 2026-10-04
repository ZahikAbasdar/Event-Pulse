import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Send, CheckCircle2, Mic, Square } from 'lucide-react';
import api from '../api/client';

const BLOCKS = ['ET', 'MT', 'T Pharmacy', 'HM'];

export default function PublicFeedbackForm() {
  const { shareSlug } = useParams();
  const [searchParams] = useSearchParams();
  const ticketCode = searchParams.get('ticket');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [academicInfo, setAcademicInfo] = useState({
    name: '', rollNumber: '', className: '', batch: '', branch: '', section: '', block: '', phone: '', email: '',
  });
  const [recording, setRecording] = useState(false);
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const setField = (field) => (event) => setAcademicInfo((current) => ({ ...current, [field]: event.target.value }));

  const clearLocalRecording = useCallback(() => {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoiceUrl('');
    setVoiceBlob(null);
  }, [voiceUrl]);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
  }, [voiceUrl]);

  useEffect(() => {
    api.get(`/forms/share/${shareSlug}`).then(({ data }) => setForm(data.form)).catch(() => toast.error('This form is not available')).finally(() => setLoading(false));
  }, [shareSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const answerList = form.questions
        .filter((q) => q.type !== 'academic_identifier')
        .map((q) => ({ question: q._id, questionText: q.text, value: answers[q._id] ?? '' }));
      const payload = new FormData();
      payload.append('answers', JSON.stringify(answerList));
      payload.append('academicInfo', JSON.stringify(academicInfo));
      if (ticketCode) payload.append('ticketCode', ticketCode);
      if (voiceBlob) payload.append('voiceFeedback', voiceBlob, `voice-feedback.${voiceBlob.type.includes('mp4') ? 'm4a' : voiceBlob.type.includes('ogg') ? 'ogg' : 'webm'}`);

      await api.post(`/forms/share/${shareSlug}/responses`, payload);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const startRecording = async () => {
    if (!voiceConsent) {
      toast.error('Confirm the voice feedback retention notice before recording.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Voice recording is not supported by this browser.');
      return;
    }
    try {
      clearLocalRecording();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        if (blob.size > 25 * 1024 * 1024) {
          toast.error('Recording exceeds the 25 MB upload limit. Record a shorter message.');
          return;
        }
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      toast.error(err.name === 'NotAllowedError' ? 'Allow microphone access to record voice feedback.' : 'Could not start voice recording.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  if (loading) return <div className="page-shell py-20 text-center text-gray-400">Loading form...</div>;
  if (!form) return <div className="page-shell py-20 text-center text-gray-400">This feedback form isn't available.</div>;

  if (submitted) {
    return (
      <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center text-center">
        <CheckCircle2 size={56} className="text-emerald-500" />
        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">Thank you!</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Your feedback for {form.event?.title} has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-2xl py-12">
      <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{form.title}</h1>
      {form.description && <p className="mt-1 text-gray-500 dark:text-gray-400">{form.description}</p>}

      <form onSubmit={handleSubmit} className="glass-card mt-6 space-y-6 p-6">
        {(form.eventFeedback || form.requiresAcademicId) && (
          <fieldset className="grid grid-cols-2 gap-3 border-b border-gray-100 pb-6 dark:border-gray-800">
            <legend className="col-span-2 mb-3 text-sm font-semibold text-gray-900 dark:text-white">Your details</legend>
            <input required placeholder="Name" autoComplete="name" className="input-field col-span-2" value={academicInfo.name} onChange={setField('name')} />
            <input required placeholder="Roll Number" className="input-field" value={academicInfo.rollNumber} onChange={setField('rollNumber')} />
            {form.eventFeedback ? (
              <>
                <input required placeholder="Class" className="input-field" value={academicInfo.className} onChange={setField('className')} />
                <input required placeholder="Batch" className="input-field" value={academicInfo.batch} onChange={setField('batch')} />
              </>
            ) : (
              <>
                <input required placeholder="Branch" className="input-field" value={academicInfo.branch} onChange={setField('branch')} />
                <input required placeholder="Section" className="input-field" value={academicInfo.section} onChange={setField('section')} />
              </>
            )}
            <select required className="input-field" value={academicInfo.block} onChange={setField('block')}>
              <option value="">Block</option>
              {BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            {form.eventFeedback && (
              <>
                <input required type="tel" autoComplete="tel" pattern="\+[1-9][0-9]{7,14}" placeholder="Phone (+country code)" className="input-field" value={academicInfo.phone} onChange={setField('phone')} />
                <input required type="email" autoComplete="email" placeholder="Email address" className="input-field col-span-2" value={academicInfo.email} onChange={setField('email')} />
              </>
            )}
          </fieldset>
        )}

        {form.questions.filter((q) => q.type !== 'academic_identifier').map((q) => (
          <div key={q._id}>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">{q.text}{q.required && ' *'}</label>
            {q.type === 'rating' && (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setAnswers({ ...answers, [q._id]: n })}>
                    <Star size={26} className={n <= (answers[q._id] || 0) ? 'fill-gold-400 text-gold-400' : 'text-gray-300 dark:text-gray-700'} />
                  </button>
                ))}
              </div>
            )}
            {q.type === 'nps' && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 11 }, (_, n) => (
                  <button key={n} type="button" onClick={() => setAnswers({ ...answers, [q._id]: n })} className={`h-9 w-9 rounded-lg text-sm font-semibold ${answers[q._id] === n ? 'bg-maroon-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>{n}</button>
                ))}
              </div>
            )}
            {q.type === 'choice' && (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="radio" name={q._id} checked={answers[q._id] === opt} onChange={() => setAnswers({ ...answers, [q._id]: opt })} /> {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'open_text' && (
              <textarea required={q.required} maxLength={4000} rows={3} className="input-field" value={answers[q._id] || ''} onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })} />
            )}
          </div>
        ))}

        <fieldset className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <legend className="text-sm font-semibold text-gray-900 dark:text-white">Voice feedback (optional)</legend>
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            If you submit a recording, it is stored privately with your response and retained permanently for event analysis. Only authorized event administrators can access it.
          </p>
          <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={voiceConsent} onChange={(event) => setVoiceConsent(event.target.checked)} />
            I agree to have my voice recording stored permanently for feedback analysis.
          </label>
          <div className="flex flex-wrap gap-2">
            {!recording ? (
              <button type="button" onClick={startRecording} disabled={!voiceConsent || submitting} className="btn-secondary !py-2 text-xs">
                <Mic size={15} /> {voiceBlob ? 'Record again' : 'Record voice feedback'}
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="btn-primary !py-2 text-xs">
                <Square size={14} /> Stop recording
              </button>
            )}
            {recording && <span role="status" className="self-center text-xs font-semibold text-red-600">Recording…</span>}
          </div>
          {voiceUrl && <audio controls src={voiceUrl} className="w-full" aria-label="Preview voice feedback recording" />}
        </fieldset>

        <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
          <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
