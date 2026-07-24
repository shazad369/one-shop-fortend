import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Contex/AuthContext';
import { toast } from 'react-toastify';
import Seo from "../components/Seo";

type ForgotStep = 'idle' | 'email' | 'otp' | 'newpass';

const ReLogin = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [dark, setDark] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const googleInitialized = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement>(null); // নতুন ref যোগ করলাম

  // ── Forgot Password State ──────────────────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Slider State ───────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/delevery.jpeg', '/fastdelevery.png', '/product.jpeg'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // ── Google Login Initialization ────────────────────────
  useEffect(() => {
    // শুধুমাত্র তখনই রান করবে যখন forgotStep 'idle' এবং login ফর্ম দেখাচ্ছে
    if (forgotStep !== 'idle') return;
    if (!window.google) return;
    
    // যদি ইতিমধ্যে initialized হয়ে থাকে এবং button রেন্ডার হয়ে থাকে, তাহলে আবার করবো না
    if (googleInitialized.current) {
      // কিন্তু যদি button element DOM এ থাকে কিন্তু রেন্ডার না হয়, তাহলে রি-রেন্ডার করবো
      const buttonElement = document.getElementById('googleBtn');
      if (buttonElement && !buttonElement.hasChildNodes()) {
        renderGoogleButton(buttonElement);
      }
      return;
    }

    googleInitialized.current = true;
    
    google.accounts.id.initialize({
      client_id: '290854137622-lg63ap7s05fe7qhb9lg5nuskkbna8js2.apps.googleusercontent.com',
      callback: handleCredentialResponse,
    });

    const buttonElement = document.getElementById('googleBtn');
    if (buttonElement) {
      renderGoogleButton(buttonElement);
    }
  }, [forgotStep]); // forgotStep change হলে আবার রান করবে

  // Google Button রেন্ডার করার আলাদা ফাংশন
  const renderGoogleButton = (element: HTMLElement) => {
    // আগের content clear করে নতুন করে রেন্ডার করি
    element.innerHTML = '';
    google.accounts.id.renderButton(element, {
      theme: 'filled_black',
      size: 'large',
      width: '360',
    });
  };

  // Resend timer cleanup
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    };
  }, []);

  // ── Google Login ───────────────────────────────────────
  const handleCredentialResponse = (response: any) => {
    const credential = response.credential;
    const payload = JSON.parse(atob(credential.split('.')[1]));

    fetch(`${import.meta.env.VITE_API}/relogin`, {
      method: 'POST',
      headers: {
        'x-api-key': import.meta.env.VITE_API_KEY,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ email: payload.email, password: null }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
          toast.success(`Welcome back, ${data.user.name || 'User'}!`, {
            position: 'top-right',
            autoClose: 2000,
          });
          setTimeout(() => navigate(-1), 1000);
        } else {
          toast.error('User not found, please register first');
          setErrorMsg('User not found, please register first');
        }
      })
      .catch(() => toast.error('Something went wrong! Please try again.'));
  };

  // ── Normal Login ───────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    fetch(`${import.meta.env.VITE_API}/relogin`, {
      method: 'POST',
      headers: {
        'x-api-key': import.meta.env.VITE_API_KEY,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
          toast.success(`Welcome back, ${data.user.name || 'User'}!`, {
            position: 'top-right',
            autoClose: 2000,
          });
          navigate(-1);
        } else {
          setErrorMsg('Invalid email or password');
          toast.error('Invalid email or password');
        }
      })
      .catch(() => toast.error('Login failed, try again'));
  };

  // ── Forgot Password Helpers ────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    resendIntervalRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(resendIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setForgotError('');
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError('একটা valid email দাও');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/forgot-password`, {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_API_KEY,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('OTP পাঠানো হয়েছে! Email চেক করো।');
        setForgotStep('otp');
        startResendTimer();
      } else {
        setForgotError(data.error || 'OTP পাঠানো যায়নি');
      }
    } catch {
      setForgotError('Server error, একটু পরে চেষ্টা করো');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setForgotError('');
    if (forgotOtp.length !== 6) {
      setForgotError('৬ সংখ্যার OTP দাও');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/verify-otp`, {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_API_KEY,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('OTP সঠিক!');
        setForgotStep('newpass');
      } else {
        setForgotError(data.error || 'OTP ভুল হয়েছে');
      }
    } catch {
      setForgotError('Server error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError('');
    if (newPassword.length < 6) {
      setForgotError('Password কমপক্ষে ৬ character হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Password দুটো মিলছে না');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/reset-password`, {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_API_KEY,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email: forgotEmail, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password সফলভাবে পরিবর্তন হয়েছে! এখন login করো।');
        // Reset forgot state
        setForgotStep('idle');
        setForgotEmail('');
        setForgotOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotError('');
        // Google Button পুনরায় রেন্ডার করার জন্য force রি-রেন্ডার
        setTimeout(() => {
          const buttonElement = document.getElementById('googleBtn');
          if (buttonElement && window.google) {
            buttonElement.innerHTML = '';
            google.accounts.id.renderButton(buttonElement, {
              theme: 'filled_black',
              size: 'large',
              width: '360',
            });
          }
        }, 100);
      } else {
        setForgotError(data.error || 'Password reset হয়নি');
      }
    } catch {
      setForgotError('Server error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setForgotStep('idle');
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    
    // ফিরে আসার পর Google Button রি-রেন্ডার করি
    setTimeout(() => {
      const buttonElement = document.getElementById('googleBtn');
      if (buttonElement && window.google) {
        buttonElement.innerHTML = '';
        google.accounts.id.renderButton(buttonElement, {
          theme: 'filled_black',
          size: 'large',
          width: '360',
        });
      }
    }, 50);
  };

  // ── Input styles ───────────────────────────────────────
  const inputCls = `rounded-lg px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
    dark
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
  }`;

  const labelCls = `text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`;

  // ── Forgot Password Panel ──────────────────────────────
  const renderForgotPanel = () => (
    <div className={`p-6 sm:p-8 rounded-2xl pt-[10px] shadow-lg w-full max-w-md transition-colors duration-300 ${dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      {/* Header */}
      <Seo path="/Relogin" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            {forgotStep === 'email' && 'Forgot Password'}
            {forgotStep === 'otp' && 'Enter OTP'}
            {forgotStep === 'newpass' && 'New Password'}
          </h2>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            {forgotStep === 'email' && 'তোমার registered email দাও'}
            {forgotStep === 'otp' && `OTP পাঠানো হয়েছে ${forgotEmail} তে`}
            {forgotStep === 'newpass' && 'নতুন password সেট করো'}
          </p>
        </div>
        <button
          onClick={() => setDark(!dark)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition ${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['email', 'otp', 'newpass'].map((step, i) => (
          <React.Fragment key={step}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              forgotStep === step
                ? 'bg-blue-600 text-white'
                : ['email', 'otp', 'newpass'].indexOf(forgotStep) > i
                ? 'bg-green-500 text-white'
                : dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'
            }`}>
              {['email', 'otp', 'newpass'].indexOf(forgotStep) > i ? '✓' : i + 1}
            </div>
            {i < 2 && (
              <div className={`flex-1 h-0.5 transition-colors ${
                ['email', 'otp', 'newpass'].indexOf(forgotStep) > i
                  ? 'bg-green-500'
                  : dark ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step: Email */}
      {forgotStep === 'email' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              className={inputCls}
              autoFocus
            />
          </div>
          {forgotError && <p className="text-red-500 text-sm text-center">{forgotError}</p>}
          <button
            onClick={handleSendOtp}
            disabled={forgotLoading}
            className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {forgotLoading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠাও'}
          </button>
        </div>
      )}

      {/* Step: OTP */}
      {forgotStep === 'otp' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>6-digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="_ _ _ _ _ _"
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              className={`${inputCls} tracking-[0.5em] text-center text-lg font-bold`}
              autoFocus
            />
          </div>

          {/* Resend */}
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                {resendTimer} সেকেন্ড পর আবার পাঠাতে পারবে
              </p>
            ) : (
              <button
                onClick={() => { setForgotOtp(''); handleSendOtp(); }}
                className="text-sm text-blue-400 hover:underline"
              >
                OTP আসেনি? আবার পাঠাও
              </button>
            )}
          </div>

          {forgotError && <p className="text-red-500 text-sm text-center">{forgotError}</p>}
          <button
            onClick={handleVerifyOtp}
            disabled={forgotLoading || forgotOtp.length !== 6}
            className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {forgotLoading ? 'Verify হচ্ছে...' : 'OTP Verify করো'}
          </button>
        </div>
      )}

      {/* Step: New Password */}
      {forgotStep === 'newpass' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>নতুন Password</label>
            <input
              type="password"
              placeholder="কমপক্ষে ৬ character"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Password নিশ্চিত করো</label>
            <input
              type="password"
              placeholder="আবার লেখো"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              className={inputCls}
            />
          </div>

          {/* Password match indicator */}
          {confirmPassword.length > 0 && (
            <p className={`text-xs ${newPassword === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
              {newPassword === confirmPassword ? '✓ Password মিলেছে' : '✗ Password মিলছে না'}
            </p>
          )}

          {forgotError && <p className="text-red-500 text-sm text-center">{forgotError}</p>}
          <button
            onClick={handleResetPassword}
            disabled={forgotLoading}
            className="bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {forgotLoading ? 'Save হচ্ছে...' : 'Password Save করো'}
          </button>
        </div>
      )}

      {/* Back to login */}
      <button
        onClick={handleBackToLogin}
        className={`w-full mt-5 text-sm text-center ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition`}
      >
        ← Login এ ফিরে যাও
      </button>
    </div>
  );

  // ── Main Render ────────────────────────────────────────
  return (
    <div className={`min-h-screen w-full pt-[70px] sm:pt-12 p-4 sm:p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 transition-colors duration-300 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>

      {/* Slider */}
      <div className="relative w-full max-w-md lg:max-w-2xl overflow-hidden rounded-2xl shadow-md">
        <div className="w-full overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((src, index) => (
              <div key={index} className="w-full flex-shrink-0 aspect-[16/9] md:aspect-video">
                <img
                  className="w-full h-full object-cover select-none"
                  src={src}
                  alt={`Slide ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-5 bg-white' : 'w-2 bg-white/50'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Forgot Password Panel */}
      {forgotStep !== 'idle' ? renderForgotPanel() : (

        /* Login Form */
        <div className={`p-6 sm:p-8 rounded-2xl pt-[10px] shadow-lg w-full max-w-md transition-colors duration-300 ${dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Please Login</h2>
              <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Welcome back!</p>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition ${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            {/* Forgot password link — এখানে real flow শুরু হয় */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setForgotStep('email'); setForgotError(''); }}
                className="text-sm text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-sm font-medium text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition"
            >
              Login
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <hr className={`flex-1 ${dark ? 'border-gray-700' : 'border-gray-200'}`} />
            <span className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>or</span>
            <hr className={`flex-1 ${dark ? 'border-gray-700' : 'border-gray-200'}`} />
          </div>

          {/* Google Button - key যোগ করলাম force re-render এর জন্য */}
          <div className="flex justify-center w-full overflow-hidden">
            <div 
              id="googleBtn" 
              key={`google-btn-${forgotStep}`} // এই key change হলে div re-render হবে
              className="w-full max-w-[360px]"
              ref={googleButtonRef}
            ></div>
          </div>

          {/* Forgot password — Google button এর নিচেও */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => { setForgotStep('email'); setForgotError(''); }}
              className={`text-sm ${dark ? 'text-gray-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'} transition`}
            >
              Password ভুলে গেছো?
            </button>
          </div>

          <p className={`text-center text-sm mt-4 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Don't have an account?{' '}
            <Link to="/login" className="text-blue-400 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default ReLogin;
