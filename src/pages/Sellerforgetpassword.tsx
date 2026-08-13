import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Seo from "../components/Seo";

type Step = 'email' | 'otp' | 'newpass';

const SellerForgotPassword = () => {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    };
  }, []);

  const inputCls = `rounded-lg px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
    dark
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
  }`;
  const labelCls = `text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`;

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

  // ── STEP 1: Email → OTP পাঠাও ────────────────────────────────────
  const handleSendOtp = async () => {
    setErrorMsg('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('একটা valid email দাও');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/seller/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('OTP পাঠানো হয়েছে! Email চেক করো।', { position: 'top-right', autoClose: 2500 });
        setStep('otp');
        startResendTimer();
      } else {
        setErrorMsg(data.error || 'OTP পাঠানো যায়নি');
        toast.error(data.error || 'OTP পাঠানো যায়নি');
      }
    } catch {
      setErrorMsg('Server error, একটু পরে চেষ্টা করো');
      toast.error('Server error, একটু পরে চেষ্টা করো');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: OTP verify ────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (otp.length !== 6) {
      setErrorMsg('৬ সংখ্যার OTP দাও');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/seller/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('OTP সঠিক!', { position: 'top-right', autoClose: 1500 });
        setStep('newpass');
      } else {
        setErrorMsg(data.error || 'OTP ভুল হয়েছে');
        toast.error(data.error || 'OTP ভুল হয়েছে');
      }
    } catch {
      setErrorMsg('Server error');
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: নতুন Password সেট ──────────────────────────────────
  const handleResetPassword = async () => {
    setErrorMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('Password কমপক্ষে ৬ character হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Password দুটো মিলছে না');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/seller/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password সফলভাবে পরিবর্তন হয়েছে! এখন login করো।', {
          position: 'top-right',
          autoClose: 3000,
        });
        setTimeout(() => navigate('/seller/login'), 1500);
      } else {
        setErrorMsg(data.error || 'Password reset হয়নি');
        toast.error(data.error || 'Password reset হয়নি');
      }
    } catch {
      setErrorMsg('Server error');
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtp('');
    handleSendOtp();
  };

  return (
    <div className={`min-h-screen w-full pt-[70px] sm:pt-12 p-4 sm:p-8 lg:p-12 flex items-center justify-center transition-colors duration-300 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Seo path="/seller/forgot-password" />

      <div className={`p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md transition-colors duration-300 ${dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {step === 'email' && 'Forgot Password'}
              {step === 'otp' && 'Enter OTP'}
              {step === 'newpass' && 'New Password'}
            </h2>
            <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {step === 'email' && 'তোমার seller account-এর email দাও'}
              {step === 'otp' && `OTP পাঠানো হয়েছে ${email}-এ`}
              {step === 'newpass' && 'নতুন password সেট করো'}
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
          {['email', 'otp', 'newpass'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : ['email', 'otp', 'newpass'].indexOf(step) > i
                  ? 'bg-green-500 text-white'
                  : dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'
              }`}>
                {['email', 'otp', 'newpass'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 transition-colors ${
                  ['email', 'otp', 'newpass'].indexOf(step) > i
                    ? 'bg-green-500'
                    : dark ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step: Email */}
        {step === 'email' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                className={inputCls}
                autoFocus
              />
            </div>
            {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠাও'}
            </button>
          </div>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                className={`${inputCls} tracking-[0.5em] text-center text-lg font-bold`}
                autoFocus
              />
            </div>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {resendTimer} সেকেন্ড পর আবার পাঠাতে পারবে
                </p>
              ) : (
                <button onClick={handleResend} className="text-sm text-blue-400 hover:underline">
                  OTP আসেনি? আবার পাঠাও
                </button>
              )}
            </div>

            {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Verify হচ্ছে...' : 'OTP Verify করো'}
            </button>
          </div>
        )}

        {/* Step: New Password */}
        {step === 'newpass' && (
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

            {confirmPassword.length > 0 && (
              <p className={`text-xs ${newPassword === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                {newPassword === confirmPassword ? '✓ Password মিলেছে' : '✗ Password মিলছে না'}
              </p>
            )}

            {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Save হচ্ছে...' : 'Password Save করো'}
            </button>
          </div>
        )}

        <Link
          to="/seller/login"
          className={`block w-full mt-5 text-sm text-center ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition`}
        >
          ← Login এ ফিরে যাও
        </Link>
      </div>
    </div>
  );
};

export default SellerForgotPassword;