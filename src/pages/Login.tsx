import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Contex/AuthContext';
import { toast } from 'react-toastify';
import Seo from "../components/Seo";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [dark, setDark] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const googleInitialized = useRef(false);

  const handleCredentialResponse = (response: any) => {
    const credential = response.credential;
    const payload = JSON.parse(atob(credential.split('.')[1]));

    const userData = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      googleId: payload.sub,
    };

    fetch(`${import.meta.env.VITE_API}/logindata`, {
      method: "POST",
      headers: { 
        'x-api-key': import.meta.env.VITE_API_KEY,
        'Content-Type': 'application/json' ,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(userData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isNew) {
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData); 
          toast.success(`Welcome, ${userData.name}! Your account has been created.`, {
            position: "top-right",
            autoClose: 2000,
          });
          navigate(-1);
        } else {
          setErrorMsg("User already exist please login");
          toast.error("User already exist please login", {
            position: "top-right",
            autoClose: 2000,
          });
        }
      })
      .catch((err) => {
        console.log("❌ POST Error:", err);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const regesterformdata = {
      email: formData.email,
      password: formData.password,
    };

    fetch(`${import.meta.env.VITE_API}/loginnewdata`, {
      method: "POST",
      headers: { 
        'x-api-key': import.meta.env.VITE_API_KEY,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(regesterformdata),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isNew) {
          localStorage.setItem("user", JSON.stringify(regesterformdata));
          setUser(regesterformdata); 
          navigate(-1);
          toast.success(`Welcome, ${regesterformdata.email}! Your account has been created.`, {
            position: "top-right",
            autoClose: 2000,
          });
        } else {
          setErrorMsg("User already exist please login");
          toast.error("User already exist please login", {
            position: "top-right",
          });
        }
      })
      .catch((err) => {
        console.log("❌ POST Error:", err);
      });
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    "/delevery.jpeg",
    "/fastdelevery.png",
    "/product.jpeg"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (!window.google) return;
    if (googleInitialized.current) return;
    googleInitialized.current = true;

    google.accounts.id.initialize({
      client_id: "290854137622-lg63ap7s05fe7qhb9lg5nuskkbna8js2.apps.googleusercontent.com",
      callback: handleCredentialResponse,
    });

    const buttonElement = document.getElementById("googleBtn");
    if (buttonElement) {
      google.accounts.id.renderButton(buttonElement, {
        theme: "filled_black",
        size: "large",
        width: "360",
      });
    }
  }, []);

  return (
    // মোবাইলে ওপর থেকে ১০ পিক্সেল অতিরিক্ত স্পেস দেওয়ার জন্য pt-[70px] সেট করা হয়েছে, এবং ডেক্সটপে sm:pt-12 দিয়ে ব্যালেন্স করা হয়েছে
    <div className={`min-h-screen w-full pt-[50px]  sm:pt-12 p-4 sm:p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 transition-colors duration-300 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Seo path="/Login" />
      {/* স্লাইডার পার্ট: মোবাইলে ফুল-উইডথ, বড় স্ক্রিনে max-w-2xl */}
      <div className="relative w-full max-w-md lg:max-w-2xl overflow-hidden rounded-2xl shadow-md">
        {/* স্লাইডার উইন্ডো */}
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

        {/* মডার্ন ডট ইন্ডিকেটর */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === index ? "w-5 bg-white" : "w-2 bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ফর্ম পার্ট: মোবাইল স্ক্রিনের উইডথ অনুযায়ী অটো-অ্যাডজাস্ট হবে */}
      <div className={`p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md transition-colors duration-300 ${dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Please Register</h2>
            <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>in your account</p>
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
            <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`rounded-lg px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`rounded-lg px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
              required
            />
          </div>

          <div className="text-right">
            <a href="#" className="text-sm text-blue-400 hover:underline">Forgot password?</a>
          </div>

          {errorMsg && (
            <p className="text-red-500 text-sm font-medium text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition"
          >
            Register
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <hr className={`flex-1 ${dark ? 'border-gray-700' : 'border-gray-200'}`} />
          <span className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>or</span>
          <hr className={`flex-1 ${dark ? 'border-gray-700' : 'border-gray-200'}`} />
        </div>

        {/* গুগল বাটন কন্টেইনারকে মোবাইলে সেন্টারে এবং উইডথ ঠিক রাখার ব্যবস্থা */}
        <div className="flex justify-center w-full overflow-hidden">
          <div id="googleBtn" className="w-full max-w-[360px]"></div>
        </div>

        <p className={`text-center text-sm mt-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          have an account please login{' '}
          <Link to="/relogin" className="text-blue-400 font-medium hover:underline">
            login
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
