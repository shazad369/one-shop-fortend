import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Seo from "../components/Seo";

type Step = 'form' | 'otp';

const SellerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', address: '' ,role:'seller'});
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [dark, setDark] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/delevery.jpeg', '/fastdelevery.png', '/product.jpeg'];
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

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

  // ── STEP 1: ফর্ম সাবমিট → email-এ OTP পাঠায় ────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!/^01[3-9]\d{8}$/.test(formData.phone)) {
      setErrorMsg('সঠিক ফোন নম্বর দাও (01XXXXXXXXX)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/seller/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ email: formData.email }),
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
    } catch (err) {
      setErrorMsg('কিছু একটা ভুল হয়েছে, আবার চেষ্টা করো।');
      toast.error('Server error, একটু পরে চেষ্টা করো');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: OTP সহ /seller_register কল হয় ────────────────────────
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otp.length !== 6) {
      setErrorMsg('৬ সংখ্যার OTP দাও');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/seller_register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ ...formData, otp }),
      });
      const data = await res.json();
      console.log('Seller Register Response:', data);
      

      if (data.success) {
        localStorage.setItem('sellerToken', data.token);
  localStorage.setItem('seller', JSON.stringify({
    id: data.sellerId,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
  }));
  toast.success('🎉 তুমি এখন ONE-SHOP এ একজন Seller!', { position: 'top-right', autoClose: 3000 });
  navigate('/sellerpanal');
        setTimeout(() => navigate('/selllogin'), 1500);
      } else {
        setErrorMsg(data.error || 'Registration করা যায়নি');
        toast.error(data.error || 'Registration করা যায়নি');
      }
    } catch (err) {
      setErrorMsg('কিছু একটা ভুল হয়েছে, আবার চেষ্টা করো।');
      toast.error('Server error, একটু পরে চেষ্টা করো');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}/seller/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('নতুন OTP পাঠানো হয়েছে');
        startResendTimer();
      } else {
        toast.error(data.error || 'OTP পাঠানো যায়নি');
      }
    } catch {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full pt-[50px] sm:pt-12 p-4 sm:p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 transition-colors duration-300 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Seo path="/seller/register" />

      {/* Slider */}
      <div className="relative w-full max-w-md lg:max-w-2xl overflow-hidden rounded-2xl shadow-md">
        <div className="w-full overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((src, index) => (
              <div key={index} className="w-full flex-shrink-0 aspect-[16/9] md:aspect-video">
                <img className="w-full h-full object-cover select-none" src={src} alt={`Slide ${index + 1}`} />
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

      {/* Seller Register Form */}
      <div className={`p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md transition-colors duration-300 ${dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {step === 'form' ? 'Become a Seller' : 'Verify OTP'}
            </h2>
            <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {step === 'form'
                ? 'ONE-SHOP-এ প্রোডাক্ট বিক্রি শুরু করো'
                : `OTP পাঠানো হয়েছে ${formData.email}-এ`}
            </p>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition ${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>নাম</label>
              <input
                type="text"
                placeholder="তোমার পূর্ণ নাম"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Address</label>
              <input
                type="text"
                placeholder="তোমার পূর্ণ Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>ফোন নম্বর</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                className={inputCls}
                required
              />
            </div>

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
                placeholder="কমপক্ষে ৬ character"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputCls}
                required
                minLength={6}
              />
            </div>

            {errorMsg && (
              <p className="text-red-500 text-sm font-medium text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'OTP পাঠানো হচ্ছে...' : 'OTP পাঠাও'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-blue-400 hover:underline"
                >
                  OTP আসেনি? আবার পাঠাও
                </button>
              )}
            </div>

            {errorMsg && (
              <p className="text-red-500 text-sm font-medium text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'তৈরি হচ্ছে...' : 'Verify করে Account তৈরি করো'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('form'); setOtp(''); setErrorMsg(''); }}
              className={`text-sm text-center ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition`}
            >
              ← ফর্মে ফিরে যাও
            </button>
          </form>
        )}

        {step === 'form' && (
          <p className={`text-center text-sm mt-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            আগে থেকেই seller account আছে?{' '}
            <Link to="/selllogin" className="text-blue-400 font-medium hover:underline">
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default SellerRegister;