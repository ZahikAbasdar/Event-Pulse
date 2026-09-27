import { useEffect, useState } from 'react';
import { Award, Download } from 'lucide-react';
import api from '../api/client';

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates/mine').then(({ data }) => setCerts(data.certificates)).finally(() => setLoading(false));
  }, []);

  const download = async (cert) => {
    const res = await api.get(`/certificates/${cert._id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.certificateNumber}.pdf`;
    a.click();
  };

  if (loading) return <div className="py-20 text-center text-gray-400">Loading certificates...</div>;

  return (
    <div className="animate-fadeInUp space-y-6">
      <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">My Certificates</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certs.map((c) => (
          <div key={c._id} className="glass-card p-5 text-center">
            <Award size={32} className="mx-auto text-gold-500" />
            <h3 className="mt-3 font-display font-bold text-gray-900 dark:text-white">{c.event?.title}</h3>
            <p className="mt-1 text-xs text-gray-400">{c.certificateNumber}</p>
            <button onClick={() => download(c)} className="btn-secondary mt-4 w-full !py-2 text-xs"><Download size={14} /> Download PDF</button>
          </div>
        ))}
        {certs.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No certificates issued yet — they appear here once an organizer issues them after check-in.</p>}
      </div>
    </div>
  );
}
