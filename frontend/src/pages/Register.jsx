import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LiquidBackground from '../components/LiquidBackground';
import { useTheme } from '../context/ThemeContext';
import PhoneOtpForm from '../components/PhoneOtpForm';

export default function Register() {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const finishRegistration = (user) => {
    toast.success(`Account ready — welcome, ${user.name.split(' ')[0]}!`);
    navigate('/my/tickets');
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
          Verify your phone number by SMS to create an account. Accounts cannot be created without a verified phone.
        </p>
        <PhoneOtpForm intent="register" onComplete={finishRegistration} />

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-maroon-600 hover:underline dark:text-gold-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
