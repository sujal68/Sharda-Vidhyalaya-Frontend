'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

function ForgotPasswordModal({ show, setShow }: { show: boolean; setShow: (show: boolean) => void }) {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShow(false)}>
      <div className="card max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Reset Password</h2>
          <button onClick={() => setShow(false)} className="text-2xl">×</button>
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
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input text-center text-2xl tracking-widest"
                maxLength={6}
                placeholder="000000"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">Continue</button>
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
                placeholder="Enter new password"
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
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
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
    <div className="min-h-screen flex">
      {showForgotPassword && <ForgotPasswordModal show={showForgotPassword} setShow={setShowForgotPassword} />}

      {/* Left Side - School Info with Bubbles */}
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
                  A premier institution dedicated to nurturing young minds and shaping future leaders through quality education and holistic development.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-user-star-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Expert Faculty</h3>
                    <p className="text-sm text-sky-100">Experienced and dedicated teachers</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-book-open-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Modern Curriculum</h3>
                    <p className="text-sm text-sky-100">Updated syllabus and teaching methods</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-trophy-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Excellence</h3>
                    <p className="text-sm text-sky-100">Proven track record of success</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-sky-100">Students</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-sky-100">Teachers</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">15+</div>
                <div className="text-sm text-sky-100">Years</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-sky-100 dark:bg-blue-900 rounded-full flex items-center justify-center p-2">
              <Image src="/logo.png" alt="Logo" width={64} height={64} className="rounded-full" priority />
            </div>
            <h1 className="text-3xl font-bold text-sky-600 dark:text-blue-400">Sharda Vidhyalaya</h1>
            <p className="text-muted mt-2">School Management System</p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {step === 'login' ? 'Welcome Back!' : 'Verify OTP'}
            </h2>
            <p className="text-muted mt-2">
              {step === 'login' ? 'Please login to your account' : 'Enter the OTP sent to your email'}
            </p>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
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
              
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending OTP...' : 'Login & Send OTP'}
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
                <label className="block text-sm font-medium mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input text-center text-2xl tracking-widest"
                  maxLength={6}
                  placeholder="000000"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify & Login'}
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
                    setCountdown(60);
                    setCanResend(false);
                  }}
                  className="block w-full text-center text-sm text-sky-600 dark:text-blue-400 hover:underline"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-6 border-t border-gray-200 dark:border-slate-800">
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
