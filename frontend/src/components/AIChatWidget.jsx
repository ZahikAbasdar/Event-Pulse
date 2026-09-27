import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import api from '../api/client';

/**
 * EventPulse AI chat widget.
 * - mode="organizer": answers natural-language Qs, can compare any number of events (dashboard)
 * - mode="public": scoped to a single event's live feedback data (public event page)
 */
export default function AIChatWidget({ mode = 'public', eventSlug = null, eventIds = [] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: mode === 'public' ? "Hi! Ask me anything about this event." : 'Hi! Ask me about your events — I can compare any number of them.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const url = mode === 'public' ? `/ai/public-chat/${eventSlug}` : '/ai/organizer-chat';
      const { data } = await api.post(url, { message: userMsg, eventIds });
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="glass-card mb-3 flex h-96 w-80 flex-col !bg-white dark:!bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 p-3 dark:border-gray-800">
            <span className="flex items-center gap-1.5 text-sm font-bold text-maroon-600 dark:text-gold-400"><Sparkles size={15} /> EventPulse AI</span>
            <button onClick={() => setOpen(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${m.role === 'user' ? 'ml-auto bg-maroon-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="w-fit rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-400 dark:bg-gray-800">Thinking...</div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-gray-100 p-2 dark:border-gray-800">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something..." className="input-field !py-1.5 text-xs" />
            <button type="submit" className="btn-primary !px-3 !py-1.5"><Send size={14} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon-500 text-white shadow-lg hover:bg-maroon-600">
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
