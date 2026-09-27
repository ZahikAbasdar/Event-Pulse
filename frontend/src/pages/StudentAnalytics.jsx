import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, UploadCloud, Table2 } from 'lucide-react';
import api from '../api/client';

export default function StudentAnalytics() {
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/students/breakdown').then(({ data }) => setBreakdown(data.breakdown)).finally(() => setLoading(false));
  }, []);

  const exportCsv = () => window.open('/api/students/breakdown?format=csv', '_blank');
  const exportXlsx = () => window.open('/api/students/breakdown?format=xlsx', '_blank');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/students/analytics/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadResult(data);
      toast.success(`Analyzed ${data.rowCount} rows`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fadeInUp space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Student Records & Analytics</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary !py-2 text-xs"><Download size={14} /> CSV</button>
          <button onClick={exportXlsx} className="btn-primary !py-2 text-xs"><Download size={14} /> Excel (.xlsx)</button>
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-900 dark:text-white"><Table2 size={17} /> Block / Branch / Section Breakdown</h2>
        {loading ? <p className="text-sm text-gray-400">Loading...</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400"><th className="pb-2">Block</th><th>Branch</th><th>Section</th><th>Students</th><th>Registrations</th><th>Check-ins</th></tr></thead>
            <tbody>
              {breakdown.map((b, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2">{b.block || '—'}</td><td>{b.branch || '—'}</td><td>{b.section || '—'}</td>
                  <td>{b.studentCount}</td><td>{b.registrations}</td><td>{b.checkIns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-900 dark:text-white"><UploadCloud size={17} /> Spreadsheet Analyzer</h2>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Upload any CSV or Excel file to get an automatic column-by-column statistical summary.</p>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} disabled={uploading} className="text-sm" />

        {uploadResult && (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">{uploadResult.rowCount} rows · {uploadResult.columns.length} columns</p>
            {Object.entries(uploadResult.summary).map(([col, s]) => (
              <div key={col} className="rounded-xl border border-gray-100 p-3 text-sm dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{col} <span className="text-xs font-normal text-gray-400">({s.type})</span></p>
                {s.type === 'numeric' ? (
                  <p className="text-gray-500 dark:text-gray-400">min {s.min} · max {s.max} · avg {s.avg} · sum {s.sum}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">{s.uniqueCount} unique values · top: {s.topValues.map((v) => `${v.value} (${v.count})`).join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
