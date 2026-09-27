import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', rollNumber: user?.rollNumber || '',
    branch: user?.branch || '', section: user?.section || '', block: user?.block || '',
  });
  const [saving, setSaving] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/me', form);
      await refreshMe();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeInUp max-w-lg">
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
      <form onSubmit={save} className="glass-card space-y-4 p-6">
        <input className="input-field" placeholder="Full name" value={form.name} onChange={update('name')} />
        <input className="input-field" placeholder="Phone" value={form.phone} onChange={update('phone')} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input-field" placeholder="Roll Number" value={form.rollNumber} onChange={update('rollNumber')} />
          <input className="input-field" placeholder="Branch" value={form.branch} onChange={update('branch')} />
          <input className="input-field" placeholder="Section" value={form.section} onChange={update('section')} />
          <select className="input-field" value={form.block} onChange={update('block')}>
            <option value="">Block</option>
            {['ET', 'MT', 'T Pharmacy', 'HM'].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </div>
  );
}
