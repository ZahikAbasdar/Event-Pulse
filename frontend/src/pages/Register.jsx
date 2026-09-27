import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LiquidBackground from '../components/LiquidBackground';
import { useTheme } from '../context/ThemeContext';

const BLOCKS = ['ET', 'MT', 'T Pharmacy', 'HM'];

export default function Register() {
  const { dark } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', rollNumber: '', className: '', batch: '', block: '',
  });

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Account ready — welcome, ${user.name.split(' ')[0]}!`);
      navigate('/my/tickets');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <LiquidBackground variant={dark ? 'dark' : 'light'} />
      <div className="glass-modal w-full max-w-lg !max-w-lg animate-fadeInUp">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-maroon-700 dark:text-gold-400">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Register to discover and join PCTE events</p>
        </div>

        <p className="mb-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Create an account with your email and password. Phone number is optional.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required autoComplete="name" placeholder="Full name" value={form.name} onChange={updateField('name')} className="input-field" />
          <input required type="email" autoComplete="email" placeholder="Email address" value={form.email} onChange={updateField('email')} className="input-field" />
          <input required type="password" autoComplete="new-password" minLength={8} placeholder="Password (at least 8 characters)" value={form.password} onChange={updateField('password')} className="input-field" />
          <input type="tel" autoComplete="tel" placeholder="Phone number (optional)" value={form.phone} onChange={updateField('phone')} className="input-field" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Roll number (optional)" value={form.rollNumber} onChange={updateField('rollNumber')} className="input-field" />
            <input placeholder="Class (optional)" value={form.className} onChange={updateField('className')} className="input-field" />
            <input placeholder="Batch (optional)" value={form.batch} onChange={updateField('batch')} className="input-field" />
            <select value={form.block} onChange={updateField('block')} className="input-field">
              <option value="">Block (optional)</option>
              {BLOCKS.map((block) => <option key={block} value={block}>{block}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-maroon-600 hover:underline dark:text-gold-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
