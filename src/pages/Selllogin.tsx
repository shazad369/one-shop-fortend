import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Seo from "../components/Seo";

const SellerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [dark, setDark] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/delevery.jpeg', '/fastdelevery.png', '/product.jpeg'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const inputCls = `rounded-lg px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
    dark
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
  }`;

  const labelCls = `text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API}/seller_login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${import.meta.env.VITE_API_KEY}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
         localStorage.setItem('sellerToken', data.token);           // 👈 শুধু token
  localStorage.setItem('seller', JSON.stringify(data.seller)); // 👈 password ছাড়া, শুধু profile info
  toast.success(`স্বাগতম, ${data.seller.name}!`, { position: 'top-right', autoClose: 2000 });
  navigate('/sellerpanal');
      } else {
        setErrorMsg(data.error || 'Login করা যায়নি');
        toast.error(data.error || 'Login করা যায়নি');
      }
    } catch (err) {
      setErrorMsg('কিছু একটা ভুল হয়েছে, আবার চেষ্টা করো।');
      toast.error('Server error, একটু পরে চেষ্টা করো');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full pt-[50px] sm:pt-12 p-4 sm:p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 transition-colors duration-300 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Seo path="/seller/login" />

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

      {/* Seller Login Form */}
      <div className={`p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md transition-colors duration-300 ${dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Seller Login</h2>
            <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>তোমার seller account এ ফিরে এসো</p>
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

          {errorMsg && (
            <p className="text-red-500 text-sm font-medium text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Login হচ্ছে...' : 'Login'}
          </button>
        </form>

      <div className={`text-sm mt-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
  <p className="text-center">
    এখনো seller account তৈরি করোনি?{' '}
    <Link to="/sellregister" className="text-blue-400 font-medium hover:underline">
      Register
    </Link>
  </p>

  <p className="text-center mt-2">
    <p>or</p>
    <Link to="/sellerforgetpassword" className="text-blue-400 hover:underline">
      Forgot password?
    </Link>
  </p>
</div>
      </div>
      
    </div>
  );
};

export default SellerLogin;