"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const products = [
  {
    id: 1,
    title: "Product One",
    image: "delevery.jpeg",
    name: "Product One",
  },

  {
    id: 3,
    title: "Product Three",
    image: "fastdelevery.png",
    name: "Product Three",
  },
  {
    id: 4,
    title: "FREE cash on delivery",
    image: "https://i.postimg.cc/PfCfqcd9/3959ff19-425f-48fb-89cd-45bc0600bf6e.png",
    name: "Product Four",
  },

];

const stats = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
    value: "248",
    label: "Orders Today",
    glowColor: "rgba(59, 130, 246, 0.15)",
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    value: "4.9★",
    label: "Avg Rating",
    glowColor: "rgba(245, 158, 11, 0.15)",
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    value: "24hr",
    label: "Fast Delivery",
    glowColor: "rgba(34, 197, 94, 0.15)",
  },
];

function getCardStyle(offset) {
  const absOffset = Math.abs(offset);
  const isCenter = offset === 0;

  let xTranslate = offset * 200; 
  if (offset > 0) xTranslate += 60;
  if (offset < 0) xTranslate -= 60;

  return {
    zIndex: isCenter ? 30 : 20 - absOffset,
    scale: isCenter ? 1.2 : 0.75, 
    x: xTranslate, 
    rotateY: offset * -45,
    z: isCenter ? 60 : -160,
    opacity: absOffset > 2 ? 0 : absOffset === 2 ? 0.25 : 1,
    filter: isCenter ? "none" : `brightness(${absOffset === 1 ? 0.6 : 0.355}) blur(1px)`,
  };
}

export default function CoverflowCarousel({ dark = true, floatingProducts }) {
  const items = floatingProducts?.length ? floatingProducts : products;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  const prev = () => setActive((a) => (a - 1 + items.length) % items.length);
  const next = () => setActive((a) => (a + 1) % items.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden lg:flex flex-col gap-6 justify-start select-none w-full max-w-4xl mx-auto p-4"
    >
      {/* Coverflow Main Stage */}
      <div
        className="relative w-full overflow-visible"
        style={{
          height: 380, 
          perspective: "1200px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
          {items.map((product, i) => {
            const offset = i - active;
            const wrapped =
              offset > Math.floor(items.length / 2)
                ? offset - items.length
                : offset < -Math.floor(items.length / 2)
                ? offset + items.length
                : offset;

            const style = getCardStyle(wrapped);
            const isCenter = wrapped === 0;

            return (
              <motion.div
                key={product.id ?? i}
                onClick={() => setActive(i)}
                animate={{
                  x: style.x,
                  scale: style.scale,
                  rotateY: style.rotateY,
                  z: style.z,
                  opacity: style.opacity,
                  filter: style.filter,
                  zIndex: style.zIndex,
                }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                className="absolute cursor-pointer flex items-center justify-center"
                style={{
                  width: 480, 
                  height: 320, 
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Floating Animation & Pure Product Image with Border Grace/Glow */}
                <motion.div 
                  animate={{ y: isCenter ? [0, -12, 0] : 0 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center p-4 rounded-full"
                >
              <span className=" text-white text-lg font-bold"> {product.title} </span>      
        <img
        
  src={product.image}
  alt={product.name}
  // className এর ভেতরে rounded-full দিন যাতে ইমেজ এবং তার ব্যাকগ্রাউন্ড গোল হয়
  className="w-full h-full object-contain rounded-[3px]

 
  
  "
  style={{
    // filter এর ভেতরে শুধুমাত্র drop-shadow থাকবে
    filter: dark
      ? "drop-shadow(0 20px 45px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 30px rgba(59, 130, 246, 0.4))"
      : "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.2)) drop-shadow(0 0 25px rgba(0, 0, 0, 0.06))"
  }}
/>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modern Control Section */}
      <div className="flex items-center justify-center gap-4 -mt-4">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: dark ? "#1a1a22" : "#ffffff",
            border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
            color: dark ? "#ffffff" : "#111115",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Dynamic Pagination Pill */}
        <div 
          className="flex gap-2 px-4 h-7 items-center rounded-full"
          style={{ 
            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            backdropFilter: "blur(10px)"
          }}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="transition-all duration-500 ease-out rounded-full"
              style={{
                width: i === active ? 24 : 6,
                height: 6,
                background: i === active ? "#3b82f6" : dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: dark ? "#1a1a22" : "#ffffff",
            border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
            color: dark ? "#ffffff" : "#111115",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Premium Glassmorphic Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mt-2">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-4 flex flex-col gap-2 relative overflow-hidden transition-all duration-300"
            style={{
              borderRadius: "20px",
              background: dark 
                ? "linear-gradient(135deg, rgba(26,26,34,0.6) 0%, rgba(14,14,18,0.8) 100%)" 
                : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,245,250,0.9) 100%)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
              boxShadow: dark 
                ? `0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)` 
                : `0 10px 30px -10px rgba(0,0,0,0.05)`,
            }}
          >
            <div 
              className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-xl opacity-40 pointer-events-none"
              style={{ background: s.glowColor }}
            />

            <div className="flex items-center justify-between">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md"
                style={{ 
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`
                }}
              >
                {s.icon}
              </span>
            </div>
            
            <div className="mt-1">
              <p
                className="text-xl font-black tracking-tight"
                style={{ color: dark ? "#ffffff" : "#111115" }}
              >
                {s.value}
              </p>
              <p
                className="text-[11px] font-semibold tracking-wider uppercase mt-0.5"
                style={{ color: dark ? "#71717a" : "#9ca3af" }}
              >
                {s.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}