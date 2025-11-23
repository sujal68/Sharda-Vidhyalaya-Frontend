'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

function OTPInput({ value, onChange, length = 6 }: { value: string; onChange: (value: string) => void; length?: number }) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, length);
      while (otpArray.length < length) otpArray.push('');
      setOtp(otpArray);
    }
  }, [value, length]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto focus next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newOtp = Array(length).fill('');
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    onChange(newOtp.join(''));
    
    const nextEmptyIndex = newOtp.findIndex(val => !val);
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
          maxLength={1}
        />
      ))}
    </div>
  );
}

function ForgotPasswordModal({ show, setShow }: { show: boolean; setShow: (show: boolean) => void }) {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(180); // 3 minutes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter email');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep('otp');
      startCountdown();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }
    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successful!');
      setShow(false);
      setStep('email');
      setEmail('');
      setOtp('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShow(false)}>
      <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Reset Password</h2>
          <button onClick={() => setShow(false)} className="text-2xl hover:text-red-500">×</button>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Enter your email"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4 text-center">Enter 6-digit OTP</label>
              <OTPInput value={otp} onChange={setOtp} />
              <p className="text-xs text-center text-gray-500 mt-2">
                OTP expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <button type="submit" disabled={otp.length !== 6} className="btn-primary w-full">
              Continue
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<any>({});
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const validateLogin = () => {
    const newErrors: any = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startCountdown = () => {
    setCountdown(180); // 3 minutes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      toast.success('OTP sent to your email');
      setStep('otp');
      startCountdown();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      toast.success('OTP resent to your email');
      startCountdown();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setAuth(data.user, data.token);
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {showForgotPassword && <ForgotPasswordModal show={showForgotPassword} setShow={setShowForgotPassword} />}

      {/* Left Side - School Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 dark:from-blue-900 dark:via-blue-800 dark:to-slate-950 relative overflow-hidden">
        {/* Animated Bubbles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 backdrop-blur-sm animate-float"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="max-w-md space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2 shadow-2xl">
                <Image src="/logo.png" alt="Logo" width={64} height={64} className="rounded-full" priority />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Sharda Vidhyalaya</h1>
                <p className="text-sky-100 text-lg">Excellence in Education</p>
              </div>
            </div>

            {/* School Info */}
            <div className="space-y-6 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div>
                <h2 className="text-2xl font-bold mb-4">Welcome to Our School</h2>
                <p className="text-sky-50 leading-relaxed">
                  A premier institution dedicated to nurturing young minds and shaping future leaders through quality education.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-user-star-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Expert Faculty</h3>
                    <p className="text-sm text-sky-100">Experienced teachers</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-book-open-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Modern Curriculum</h3>
                    <p className="text-sm text-sky-100">Updated syllabus</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-trophy-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Excellence</h3>
                    <p className="text-sm text-sky-100">Proven success</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-white dark:bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-sky-100 dark:bg-blue-900 rounded-full flex items-center justify-center p-2">
              <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-full" priority />
            </div>
            <h1 className="text-xl font-bold text-sky-600 dark:text-blue-400">Sharda Vidhyalaya</h1>
            <p className="text-muted text-sm mt-1">School Management System</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 'login' ? 'Welcome Back!' : 'Verify OTP'}
            </h2>
            <p className="text-muted text-sm mt-1">
              {step === 'login' ? 'Please login to your account' : 'Enter the OTP sent to your email'}
            </p>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={`input ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending OTP...
                  </div>
                ) : (
                  'Login & Send OTP'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-sky-600 dark:text-blue-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted">
                  OTP sent to <span className="font-semibold text-sky-600 dark:text-blue-400">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-4 text-center">Enter 6-digit OTP</label>
                <OTPInput value={otp} onChange={setOtp} />
                <p className="text-xs text-center text-gray-500 mt-3">
                  {countdown > 0 ? (
                    <>OTP expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</>
                  ) : (
                    <span className="text-red-500">OTP expired</span>
                  )}
                </p>
              </div>

              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Login'
                )}
              </button>

              <div className="text-center space-y-2">
                {countdown > 0 ? (
                  <p className="text-sm text-muted">
                    Resend OTP in <span className="font-bold text-sky-600 dark:text-blue-400">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-sky-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Resend OTP
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setOtp('');
                    setCountdown(0);
                  }}
                  className="block w-full text-center text-sm text-sky-600 dark:text-blue-400 hover:underline"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-800">
            <a href="/register" className="text-sm text-sky-600 dark:text-blue-400 hover:underline">
              Don't have an account? <span className="font-semibold">Register here</span>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}