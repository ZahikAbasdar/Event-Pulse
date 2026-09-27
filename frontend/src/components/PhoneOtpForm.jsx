import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const BLOCKS = ['ET', 'MT', 'T Pharmacy', 'HM'];

export default function PhoneOtpForm({ intent, onComplete }) {
  const { startPhoneOtp, verifyPhoneOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [profile, setProfile] = useState({
    name: '', email: '', password: '', rollNumber: '', className: '', batch: '', block: '',
  });
  const updateProfile = (field) => (event) => setProfile((current) => ({ ...current, [field]: event.target.value }));

  const sendCode = async () => {
    setSending(true);
    try {
      await startPhoneOtp(phone, intent);
      setSent(true);
      toast.success('Verification code sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send verification code.');
    } finally {
      setSending(false);
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();
    setVerifying(true);
    try {
      const user = await verifyPhoneOtp({ phone, code, intent, profile });
      onComplete(user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Phone verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <form onSubmit={submitCode} className="space-y-4">
      {intent === 'register' && (
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Full name" value={profile.name} onChange={updateProfile('name')} className="input-field col-span-2" />
          <input required type="email" placeholder="Email address" value={profile.email} onChange={updateProfile('email')} className="input-field col-span-2" />
          <input placeholder="Roll number" value={profile.rollNumber} onChange={updateProfile('rollNumber')} className="input-field" />
          <input placeholder="Class" value={profile.className} onChange={updateProfile('className')} className="input-field" />
          <input placeholder="Batch" value={profile.batch} onChange={updateProfile('batch')} className="input-field" />
          <select value={profile.block} onChange={updateProfile('block')} className="input-field">
            <option value="">Block</option>
            {BLOCKS.map((block) => <option key={block} value={block}>{block}</option>)}
          </select>
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Phone number
        <span className="mt-1 block text-xs font-normal text-gray-500">Include country code, e.g. +919876543210</span>
      </label>
      <div className="flex gap-2">
        <input
          required
          type="tel"
          autoComplete="tel"
          pattern="\+[1-9][0-9]{7,14}"
          placeholder="+919876543210"
          value={phone}
          onChange={(event) => { setPhone(event.target.value); setSent(false); }}
          className="input-field min-w-0 flex-1"
        />
        <button type="button" disabled={sending || !phone} onClick={sendCode} className="btn-secondary shrink-0 !px-3 text-xs">
          {sending ? 'Sending...' : sent ? 'Resend code' : 'Send OTP'}
        </button>
      </div>

      {sent && (
        <>
          <input
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{4,10}"
            placeholder="SMS verification code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="input-field"
          />
          <button type="submit" disabled={verifying} className="btn-primary w-full !py-3">
            {verifying ? 'Verifying...' : intent === 'register' ? 'Verify & create account' : 'Verify & sign in'}
          </button>
        </>
      )}
    </form>
  );
}
