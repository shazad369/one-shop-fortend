import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef, useMemo, memo, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, ShoppingCart, Shield, Truck, RotateCcw,
  PenLine, Package, ImagePlus, X, Tag,
} from "lucide-react";
import { siteConfig } from "../data/config";
import { useTheme } from "../App";
import { Product } from "../components/ProductCard";
import { useAuth } from "../Contex/AuthContext";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";

// ─── Types ───────────────────────────────────────────────────────
interface Review {
  _id?: string;
  productId: number | string;
  email: string;
  comment: string;
  imageUrl?: string;
}

interface RelatedPayload {
  sameCat:      Product[];
  related:      Product[];
  sameCatTotal: number;
  sameCatPage:  number;
  sameCatPages: number;
  sameCatLimit: number;
}

// ─── Constants ───────────────────────────────────────────────────
const SIZES   = ["M", "L", "XL", "XXL"];
const SIZE_KW = [
  "shirt","t-shirt","tshirt","pant","trouser","jeans","denim","hoodie",
  "jacket","coat","sweater","pullover","dress","frock","top","blouse",
  "skirt","shorts","leggings","kurta","punjabi","salwar","kameez","saree",
  "sari","polo","cardigan","vest","গেঞ্জি","শার্ট","পাঞ্জাবি","প্যান্ট",
  "জিন্স","ড্রেস","জ্যাকেট","সোয়েটার","পোশাক","clothing","apparel","fashion",
];
const IMGBB_KEY      = "af89eaf539328c4502827f5242794b3d";
const CDN            = "dittlxqip";
const API            = `${import.meta.env.VITE_API}`;
const API_KEY        = `${import.meta.env.VITE_API_KEY}`;
const SAME_CAT_LIMIT = 20;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CACHE LAYER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const memCache = {
  reviews: new Map<string, Review[]>(),
  images:  new Map<string, string>(),
  related: new Map<string, RelatedPayload>(),
};

function ssGet<T>(key: string): T | null {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function ssSet(key: string, val: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLE INJECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const _stylesInjected = { done: false };
function injectStylesOnce() {
  if (_stylesInjected.done) return;
  _stylesInjected.done = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes pc-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
    .cb-cart{position:absolute;z-index:2;top:50%;left:-10%;font-size:1.4em;transform:translate(-50%,-50%);transition:none}
    .cb-box{position:absolute;z-index:3;top:-20%;left:52%;font-size:1em;transform:translate(-50%,-50%);transition:none}
    .cb-txt-add{position:absolute;z-index:3;left:50%;top:50%;transform:translate(-50%,-50%);opacity:1;font-size:1em;font-weight:600;color:#fff;white-space:nowrap;pointer-events:none}
    .cb-txt-done{position:absolute;z-index:3;left:50%;top:50%;transform:translate(-50%,-50%);opacity:0;font-size:1em;font-weight:600;color:#fff;white-space:nowrap;pointer-events:none}
    .cb-clicked .cb-cart{animation:cb-cart-anim 1.5s ease-in-out forwards}
    .cb-clicked .cb-box{animation:cb-box-anim 1.5s ease-in-out forwards}
    .cb-clicked .cb-txt-add{animation:cb-txt1 1.5s ease-in-out forwards}
    .cb-clicked .cb-txt-done{animation:cb-txt2 1.5s ease-in-out forwards}
    @keyframes cb-cart-anim{0%{left:-10%}40%,60%{left:50%}100%{left:110%}}
    @keyframes cb-box-anim{0%,40%{top:-20%}60%{top:40%;left:52%}100%{top:40%;left:112%}}
    @keyframes cb-txt1{0%{opacity:1}20%,100%{opacity:0}}
    @keyframes cb-txt2{0%,80%{opacity:0}100%{opacity:1}}
    .tr-btn{transition:transform .3s ease}
    .tr-btn:active{transform:scale(.96)}
    .tr-lines{opacity:0;position:absolute;height:3px;background:#fff;border-radius:2px;width:6px;top:30px;left:100%;
      box-shadow:15px 0 0 #fff,30px 0 0 #fff,45px 0 0 #fff,60px 0 0 #fff,75px 0 0 #fff,90px 0 0 #fff,
      105px 0 0 #fff,120px 0 0 #fff,135px 0 0 #fff,150px 0 0 #fff,165px 0 0 #fff,180px 0 0 #fff,
      195px 0 0 #fff,210px 0 0 #fff,225px 0 0 #fff,240px 0 0 #fff}
    .tr-animate .tr-truck{animation:tr-truck 10s ease forwards}
    .tr-animate .tr-lines{animation:tr-lines 10s ease forwards}
    .tr-animate .tr-box{animation:tr-box 10s ease forwards}
    .tr-animate .tr-txt-default{animation:tr-txt1 10s ease forwards}
    .tr-animate .tr-txt-success{animation:tr-txt2 10s ease forwards}
    .tr-animate .tr-light-beam{animation:tr-light 10s ease forwards}
    @keyframes tr-truck{10%,30%{transform:translateX(-164px)}40%{transform:translateX(-104px)}60%{transform:translateX(-224px)}75%,100%{transform:translateX(24px)}}
    @keyframes tr-lines{0%,30%{opacity:0;transform:scaleY(.7) translateX(0)}35%,65%{opacity:1}70%{opacity:0}100%{transform:scaleY(.7) translateX(-400px)}}
    @keyframes tr-light{0%,30%{opacity:0}40%,100%{opacity:1}}
    @keyframes tr-box{8%,10%{transform:translateX(40px);opacity:1}25%{transform:translateX(112px);opacity:1}26%{transform:translateX(112px);opacity:0}27%,100%{transform:translateX(0);opacity:0}}
    @keyframes tr-txt1{0%{opacity:1}7%,100%{opacity:0}}
    @keyframes tr-txt2{0%,70%{opacity:0}80%,100%{opacity:1}}
    button,a{-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  `;
  document.head.appendChild(s);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CART BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CartButton = memo(function CartButton({ onClick }: { onClick: () => void }) {
  const [clicked, setClicked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleClick = useCallback(() => {
    if (clicked) return;
    onClick();
    setClicked(true);
    timerRef.current = setTimeout(() => setClicked(false), 1600);
  }, [clicked, onClick]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return (
    <button onClick={handleClick}
      className={`relative overflow-hidden flex-1 sm:flex-none h-12 sm:h-[50px] px-5 sm:px-7 rounded-xl font-semibold transition-colors duration-200 cursor-pointer ${clicked ? "cb-clicked bg-emerald-600" : "bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700"}`}
      style={{ minWidth: 160, touchAction: "manipulation" }}>
      <span className="cb-cart" aria-hidden>🛒</span>
      <span className="cb-box"  aria-hidden>📦</span>
      <span className="cb-txt-add">Add to Cart</span>
      <span className="cb-txt-done">Added ✓</span>
    </button>
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRUCK ORDER BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TruckOrderButton = memo(function TruckOrderButton({
  onConfirm, disabled, price,
}: { onConfirm: () => void; disabled: boolean; price: string }) {
  const [animating, setAnimating] = useState(false);
  const handleClick = useCallback(async () => {
    if (disabled || animating) return;
    setAnimating(true);
    setTimeout(() => onConfirm(), 3500);
  }, [disabled, animating, onConfirm]);
  return (
    <button onClick={handleClick} disabled={disabled}
      className={`tr-btn relative w-full h-[63px] rounded-full overflow-hidden border-0 outline-none cursor-pointer transition-opacity ${animating ? "tr-animate" : ""} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      style={{ background: "#1C212E", WebkitMaskImage: "-webkit-radial-gradient(white,black)" }}>
      <span className={`relative w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] cursor-pointer"}`}>
        <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 flex items-center gap-2">
          {disabled ? <>⚠️ Select Accept to Continue</> : <>✓ Confirm Order — ৳{price}</>}
        </span>
      </span>
      <span className="tr-txt-success absolute left-0 right-0 text-center text-white font-medium text-base" style={{ top: 19, lineHeight: "24px", opacity: 0 }}>Order Placed ✓</span>
      <div className="tr-lines" />
      <div className="tr-truck" style={{ width: 60, height: 41, position: "absolute", left: "100%", zIndex: 1, top: 11, transform: "translateX(24px)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 60, height: 41, borderRadius: 2, background: "linear-gradient(#fff,#CDD9ED)", zIndex: 1 }} />
        <div style={{ overflow: "hidden", position: "absolute", borderRadius: "2px 9px 9px 2px", width: 26, height: 41, left: 60 }}>
          <div style={{ borderRadius: "2px 9px 9px 2px", background: "#275EFE", width: 24, height: 41, position: "absolute", right: 0 }} />
          <div style={{ overflow: "hidden", borderRadius: "2px 8px 8px 2px", background: "#7699FF", width: 22, height: 41, position: "absolute", left: 2, top: 0, zIndex: 1, transform: "perspective(4px) rotateY(3deg)" }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 14, background: "#1C212E" }} />
          </div>
        </div>
        {[4, "bottom"].map((pos, i) => (
          <div key={i} style={{ width: 3, height: 8, left: 83, position: "absolute", borderRadius: 2, background: "rgba(240,220,95,1)", [typeof pos === "number" ? "top" : "bottom"]: typeof pos === "number" ? pos : 4 }}>
            <div className="tr-light-beam" style={{ height: 4, width: 7, opacity: 0, transform: "perspective(2px) rotateY(-15deg) scaleX(.94)", position: "absolute", left: 3, top: "50%", marginTop: -2, background: "linear-gradient(90deg,rgba(240,220,95,1),rgba(240,220,95,.7),rgba(240,220,95,0))" }} />
          </div>
        ))}
      </div>
      <div className="tr-box" style={{ width: 21, height: 21, position: "absolute", right: "100%", top: 21, borderRadius: 2, background: "linear-gradient(#EDD9A9,#DCB773)", opacity: 0 }} />
    </button>
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMAGE OPTIMISATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const loadedUrls = new Set<string>();
function optimizeImg(url: string, w = 300, h = 300): string {
  if (!url) return url;
  const key = `${url}|${w}|${h}`;
  let v = memCache.images.get(key);
  if (!v) {
    v = `https://res.cloudinary.com/${CDN}/image/fetch/w_${w},h_${h},c_fit,f_auto,q_70/${encodeURIComponent(url)}`;
    memCache.images.set(key, v);
  }
  return v;
}

const OptImg = memo(function OptImg({
  src, alt, className, w = 300, h = 300, onClick, lazy = true,
}: { src: string; alt: string; className?: string; w?: number; h?: number; onClick?: () => void; lazy?: boolean }) {
  injectStylesOnce();
  const optimized     = src ? optimizeImg(src, w, h) : src;
  const alreadyLoaded = loadedUrls.has(optimized);
  const [loaded, setLoaded] = useState(alreadyLoaded);
  const [err,    setErr]    = useState(false);
  const finalSrc = err ? src : optimized;
  const handleLoad = useCallback(() => { loadedUrls.add(optimized); setLoaded(true); }, [optimized]);
  const handleErr  = useCallback(() => { setErr(true); setLoaded(true); }, []);
  return (
    <div className="relative overflow-hidden" style={{ display: "contents" }}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-800 rounded overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: "pc-shimmer 1.4s infinite" }} />
        </div>
      )}
      <img src={finalSrc} alt={alt} className={className}
        onLoad={handleLoad} onError={handleErr} onClick={onClick}
        loading={lazy ? "lazy" : "eager"} decoding="async"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.25s", willChange: loaded ? "auto" : "opacity" }} />
    </div>
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAZY VISIBLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LazyVisible = memo(function LazyVisible({ children, rootMargin = "200px" }: { children: React.ReactNode; rootMargin?: string }) {
  const ref           = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { rootMargin },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [rootMargin]);
return (
    <div ref={ref}>
      {vis ? children : <div className="w-full h-48 bg-zinc-800/40 rounded-2xl animate-pulse" />}
    </div>
  );
});

// ─── Helpers ─────────────────────────────────────────────────────
const needsSize = (p: Product): boolean =>
  SIZE_KW.some(kw => [p.title, p.name, p.category, (p as any).description].join(" ").toLowerCase().includes(kw));

const getInflatedPrice = (price: number) => {
  const disp = Math.round((price + 120) / 0.90);
  return { displayPrice: disp, discountPct: Math.round(((disp - price - 120) / disp) * 100) };
};

const cleanText = (r: string) =>
  r.replace(/&nbsp;/g, "\n").replace(/&amp;/g, "&").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();

const specsCache = new Map<string, { label: string; value: string }[]>();
const parseSpecs = (raw: string) => {
  if (!raw) return [];
  const hit = specsCache.get(raw); if (hit) return hit;
  const seen = new Set<string>();
  const result = cleanText(raw).split("\n").map(l => l.trim()).filter(Boolean)
    .reduce<{ label: string; value: string }[]>((acc, line) => {
      const m = line.match(/^([^:]{2,50}):\s*(.+)$/);
      if (!m) return acc;
      const [, label, value] = m;
      if (value.length > 120 || seen.has(label.toLowerCase())) return acc;
      seen.add(label.toLowerCase());
      acc.push({ label: label.trim(), value: value.trim() });
      return acc;
    }, []);
  specsCache.set(raw, result);
  return result;
};

const featuresCache = new Map<string, string[]>();
const parseFeatures = (raw: string): string[] => {
  if (!raw) return [];
  const hit = featuresCache.get(raw); if (hit) return hit;
  const text = cleanText(raw);
  const num  = text.split("\n").map(l => l.trim()).filter(l => /^\d+\./.test(l))
    .map(l => l.replace(/^\d+\.\s*/, "").trim()).filter(l => l.length > 5 && l.length < 120).slice(0, 5);
  const result = num.length ? num : parseSpecs(raw).filter(s => /feature/i.test(s.label)).map(s => s.value).slice(0, 5);
  featuresCache.set(raw, result);
  return result;
};

const fmtDesc = (text: string): string[] =>
  text ? text.split(/\n|&nbsp;|<br\s*\/?>/i).map(l => l.trim()).filter(Boolean) : [];

async function fetchJSON<T>(url: string, signal?: AbortSignal, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { 
    signal, 
    ...options,
    headers: { 
      ...options?.headers, 
      'ngrok-skip-browser-warning': 'true' 
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
// ─── Skeleton / NotFound ─────────────────────────────────────────
const Skeleton = () => (
  <div className="pt-24 pb-20 min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">
    <div className="max-w-6xl w-full mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
      <div className="w-full aspect-square bg-zinc-800 rounded-xl" />
      <div className="flex flex-col justify-center space-y-6">
        {[["3/4","1/2"],["1/4"],["1/3","1/6","1/6"],["full","full","5/6","4/5"],["1/3","1/2"],["1/2","1/3"]].map((row,i) => (
          <div key={i} className={i===2||i===4 ? "flex items-center space-x-4" : "space-y-3"}>
            {row.map((w,j) => <div key={j} className={`h-${i===2?(j===0?"10":"6"):i===4?"12":"4"} bg-zinc-800 rounded-lg w-${w}`}/>)}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const NotFound = ({ dark }: { dark: boolean }) => (
  <div className="pt-24 pb-20 min-h-screen flex flex-col items-center justify-center">
    <div className="text-6xl mb-4">😕</div>
    <h2 className={`text-2xl font-bold mb-4 ${dark ? "text-white" : "text-gray-900"}`}>Product not found</h2>
    <Link to="/shop" className="text-violet-400 hover:underline">Back to Shop</Link>
  </div>
);

// ─── Modal ───────────────────────────────────────────────────────
const Modal = memo(function Modal({ onClose, children, maxW = "max-w-md", dark }: { onClose: () => void; children: React.ReactNode; maxW?: string; dark: boolean }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
        className={`rounded-2xl shadow-2xl w-full ${maxW} ${dark ? "bg-gray-900 border border-white/10" : "bg-white"}`}
        onClick={e => e.stopPropagation()}>
        {children}
      </motion.div>
    </div>
  );
});

// ─── ReviewCard ──────────────────────────────────────────────────
const ReviewCard = memo(function ReviewCard({ review, dark, onLightbox }: { review: Review; dark: boolean; onLightbox: (url: string) => void }) {
  return (
    <div className={`p-4 border rounded-xl shadow-sm ${dark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">{review.email?.charAt(0).toUpperCase()}</div>
        <p className="text-violet-500 font-semibold text-sm">{review.email}</p>
      </div>
      <p className={`text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>{review.comment}</p>
      {review.imageUrl && (
        <img src={review.imageUrl} alt="Review" onClick={() => onLightbox(review.imageUrl!)}
          className="mt-3 rounded-lg w-16 h-16 object-cover border border-white/10 cursor-zoom-in hover:opacity-80 transition-opacity" loading="lazy" />
      )}
    </div>
  );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REVIEW SECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ReviewSection = memo(function ReviewSection({ firstReview, dark, productId, userEmail, onReviewAdded }: {
  firstReview: Review | null; dark: boolean; productId: string; userEmail: string; onReviewAdded: (r: Review) => void;
}) {
  const [showAll,    setShowAll]    = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selImg,     setSelImg]     = useState<File|null>(null);
  const [preview,    setPreview]    = useState<string|null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [lightbox,   setLightbox]   = useState<string|null>(null);
  const [allReviews,   setAllReviews]   = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [loadingAll,   setLoadingAll]   = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openAll = useCallback(async () => {
    setShowAll(true); setVisibleCount(4);
    const ck = `reviews_${productId}`;
    if (memCache.reviews.has(ck)) {
      const c = memCache.reviews.get(ck)!; setAllReviews(c); setTotalReviews(c.length); return;
    }
    setLoadingAll(true);
    try {
      const data = await fetchJSON<any>(`${API}/reviewdata/${productId}`, undefined, { headers: { "x-api-key": API_KEY } });
      const list: Review[] = Array.isArray(data) ? data : data?.data || [];
      memCache.reviews.set(ck, list); setAllReviews(list); setTotalReviews(list.length);
    } catch { setAllReviews([]); } finally { setLoadingAll(false); }
  }, [productId]);

  useEffect(() => {
    if (!showAll) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisibleCount(prev => Math.min(prev + 4, allReviews.length)); },
      { root: scrollRef.current, threshold: 0.1 },
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [showAll, allReviews.length]);

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB!"); return; }
    setSelImg(f);
    const r = new FileReader(); r.onloadend = () => setPreview(r.result as string); r.readAsDataURL(f);
  };

  const uploadImg = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
      });
      const fd = new FormData(); fd.append("key", IMGBB_KEY); fd.append("image", b64);
      const d = await (await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: fd })).json();
      if (d.success) return d.data.url;
      toast.error(`Upload failed: ${d?.error?.message || "Unknown"}`); return null;
    } catch { toast.error("Image upload failed!"); return null; } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!comment.trim()) { toast.error("Please write a comment!"); return; }
    if (!userEmail)       { toast.error("Please login first!");     return; }
    setSubmitting(true);
    let imageUrl: string | undefined;
    if (selImg) { const u = await uploadImg(selImg); if (!u) { setSubmitting(false); return; } imageUrl = u; }
    const rev: Review = { productId, email: userEmail, comment: comment.trim(), imageUrl };
    try {
      const res = await fetch(`${API}/reviews`, { method: "POST", headers: { "x-api-key": API_KEY,       'ngrok-skip-browser-warning': 'true' ,
 "Content-Type": "application/json" }, body: JSON.stringify(rev) });
      if (!res.ok) { toast.error("Server error!"); return; }
      toast.success("Review added!");
      onReviewAdded(rev);
      const ck = `reviews_${productId}`;
      memCache.reviews.set(ck, [rev, ...(memCache.reviews.get(ck) ?? [])]);
      setAllReviews(prev => [rev, ...prev]); setTotalReviews(prev => prev + 1);
      setComment(""); setSelImg(null); setPreview(null); setShowAdd(false);
    } catch { toast.error("Failed to add review."); } finally { setSubmitting(false); }
  };

  const handleLightbox = useCallback((url: string) => setLightbox(url), []);

  return (
    <div className="mt-4">
      {firstReview ? (
        <>
          <ReviewCard review={firstReview} dark={dark} onLightbox={handleLightbox} />
          <div className="flex items-center gap-4 mt-2">
            <button onClick={openAll} className="text-sm text-violet-400 hover:text-violet-300 font-medium underline underline-offset-2">See all reviews →</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"><PenLine size={13} /> Add Review</button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-4">
          <p className={`text-sm italic ${dark ? "text-gray-500" : "text-gray-400"}`}>No reviews yet</p>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"><PenLine size={13} /> Add Review</button>
        </div>
      )}

      {showAll && (
        <Modal onClose={() => setShowAll(false)} maxW="max-w-md" dark={dark}>
          <div className={`flex items-center justify-between p-4 border-b sticky top-0 rounded-t-2xl ${dark ? "bg-gray-900 border-white/10" : "bg-white border-gray-200"}`}>
            <h3 className={`font-bold text-lg ${dark ? "text-white" : "text-gray-800"}`}>All Reviews {totalReviews > 0 && `(${totalReviews})`}</h3>
            <button onClick={() => setShowAll(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">✕</button>
          </div>
          <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto" ref={scrollRef}>
            {loadingAll ? [1,2,3,4].map(i => <div key={i} className="h-20 bg-zinc-800/40 rounded-xl animate-pulse" />) : <>
              {allReviews.slice(0, visibleCount).map((r, i) => <ReviewCard key={r._id || i} review={r} dark={dark} onLightbox={handleLightbox} />)}
              {visibleCount < allReviews.length && <div ref={loaderRef} className="flex justify-center py-3"><div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>}
              {visibleCount >= allReviews.length && allReviews.length > 0 && <p className={`text-center text-xs py-2 ${dark ? "text-gray-600" : "text-gray-400"}`}>সব reviews দেখা হয়েছে ✓</p>}
              {allReviews.length === 0 && !loadingAll && <p className={`text-center text-sm py-6 ${dark ? "text-gray-500" : "text-gray-400"}`}>এখনো কোনো review নেই</p>}
            </>}
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} dark={dark}>
          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ duration: 0.25 }}>
            <div className={`flex items-center justify-between p-4 border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
              <h3 className={`font-bold text-lg flex items-center gap-2 ${dark ? "text-white" : "text-gray-800"}`}><PenLine size={18} className="text-emerald-400" /> Add Review</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>Your Email</label>
                <div className={`px-3 py-2.5 rounded-xl text-sm border ${dark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"}`}>{userEmail || "Please login first"}</div>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>Your Review</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="Write your review here..."
                  className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none transition-colors ${dark ? "bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-violet-400"}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>Add Photo (optional)</label>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="w-full max-h-40 object-cover rounded-xl border border-white/10" />
                    <button onClick={() => { setSelImg(null); setPreview(null); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"><X size={12} /></button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 w-full py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${dark ? "border-white/10 hover:border-violet-500/50 bg-white/5 hover:bg-violet-500/5" : "border-gray-200 hover:border-violet-400 bg-gray-50 hover:bg-violet-50"}`}>
                    <ImagePlus size={22} className="text-violet-400" />
                    <span className={`text-xs font-medium ${dark ? "text-gray-500" : "text-gray-400"}`}>Click to upload image (max 5MB)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImg} />
                  </label>
                )}
              </div>
              <button onClick={submit} disabled={submitting || uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-emerald-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {uploading ? "Uploading image..." : submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </motion.div>
        </Modal>
      )}

      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }}
              className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <button onClick={() => setLightbox(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"><X size={16} /></button>
              <img src={lightbox} alt="Review" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" loading="lazy" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── Specs ───────────────────────────────────────────────────────
const Specs = memo(function Specs({ details, dark }: { details: string; dark: boolean }) {
  const specs = parseSpecs(details);
  if (!specs.length) return null;
  return (
    <div className="mt-8">
      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${dark ? "text-white" : "text-gray-800"}`}><Package size={18} className="text-violet-500" /> Product Specifications</h3>
      <div className={`rounded-xl border overflow-hidden ${dark ? "border-white/10" : "border-gray-200"}`}>
        <table className="w-full text-sm"><tbody>
          {specs.map((s, i) => (
            <tr key={i} className={`border-b last:border-b-0 ${dark ? "border-white/10" : "border-gray-100"} ${i % 2 === 0 ? dark ? "bg-white/5" : "bg-gray-50" : ""}`}>
              <td className={`px-4 py-3 font-medium w-2/5 ${dark ? "text-gray-300" : "text-gray-700"}`}>{s.label}</td>
              <td className={`px-4 py-3 ${dark ? "text-gray-400" : "text-gray-600"}`}>{s.value}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
});

// ─── Gallery ─────────────────────────────────────────────────────
const Gallery = memo(function Gallery({ images, mainImage, dark, title }: { images?: any[]; mainImage: string; dark: boolean; title: string }) {
  const toUrl = (img: any) => typeof img === "string" ? img : img?.product_image || img?.image || "";
  const all = useMemo(() => { const extras = (images || []).map(toUrl).filter(u => u && u !== mainImage); return [mainImage, ...extras]; }, [images, mainImage]);
  const [sel, setSel] = useState(mainImage);
  useEffect(() => { setSel(mainImage); }, [mainImage]);
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
      className={`rounded-3xl overflow-hidden p-4 sm:p-6 lg:p-8 ${dark ? "bg-white/[0.03] border border-white/5" : "bg-white border border-gray-200"}`}>
      <div className="overflow-hidden rounded-lg flex items-center justify-center">
        <OptImg src={sel} alt={title} className="w-full h-auto object-contain" w={800} h={800} lazy={false} />
      </div>
      {all.length > 1 && (
        <div className="flex gap-2 justify-center mt-4 overflow-x-auto pb-2">
          {all.map((img, i) => (
            <button key={i} onClick={() => setSel(img)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${sel === img ? "border-violet-500 ring-2 ring-violet-500/20" : dark ? "border-white/20 hover:border-white/40" : "border-gray-200 hover:border-gray-400"}`}>
              <OptImg src={img} alt={`${title}-${i + 1}`} className="w-full h-full object-cover" w={64} h={64} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
});

// ─── CategoryCard ────────────────────────────────────────────────
const CategoryCard = memo(function CategoryCard({ p, isCur, dark, onNavigate }: { p: Product; isCur: boolean; dark: boolean; onNavigate: (pid: string|number) => void }) {
  const pid   = p.id;
  const pname = p.name || p.title || "Product";
  const pimg  = p.image || p.thumbnail_img || "";
  const pcat  = p.category || "General";
  const { displayPrice: pDisplay, discountPct: pDisc } = getInflatedPrice(p.price!);
  const pFinal = p.price! + 120;

  const inner = (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300
      ${isCur ? dark ? "bg-emerald-500/20 border-2 border-emerald-500/50" : "bg-emerald-50 border-2 border-emerald-400"
               : dark ? "bg-white/[0.03] border border-white/5 hover:border-violet-500/30 hover:shadow-violet-500/10"
                      : "bg-white border border-gray-200 hover:border-violet-300 hover:shadow-violet-200/50"}
      ${!isCur && "group hover:scale-[1.02] hover:shadow-2xl"}`} style={{ contain: "layout style" }}>
      <div className={`relative h-36 sm:h-44 lg:h-56 overflow-hidden ${dark ? "bg-white/[0.02]" : "bg-gray-50"}`}>
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 lg:p-6">
          <OptImg src={pimg} alt={pname} className={`max-h-full max-w-full object-contain ${!isCur && "transition-transform duration-700 group-hover:scale-110"}`} w={200} h={200} />
        </div>
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${dark ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-violet-100 text-violet-700"}`}>{pcat}</span>
        </div>
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-red-500 text-white">-{pDisc}%</span>
        </div>
        {isCur && <div className="absolute top-2 right-2 sm:top-3 sm:right-3 mt-6"><span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500 text-white shadow-lg">CURRENT</span></div>}
        {!isCur && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium"><ShoppingCart size={12} /> View Details</div>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 lg:p-5">
        <h3 className={`font-semibold text-xs sm:text-sm leading-tight mb-1.5 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] ${dark ? "text-white" : "text-gray-900"}`}>{pname}</h3>
        {p.stock_status && (
          <span className={`inline-flex items-center gap-1 text-[10px] mb-2 ${p.stock_status === "in_stock" ? "text-green-400" : "text-red-400"}`}>
            <Tag size={10} /> {p.stock_status === "in_stock" ? "In Stock" : "Out of Stock"}
          </span>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base lg:text-lg font-bold text-emerald-500">৳{pFinal.toFixed(2)}</span>
            <span className={`text-[10px] line-through ${dark ? "text-gray-500" : "text-gray-400"}`}>৳{pDisplay.toFixed(2)}</span>
          </div>
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); }}
            className={`p-1.5 sm:p-2 lg:p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${dark ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400" : "bg-emerald-100 hover:bg-emerald-200 text-emerald-600"}`}>
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return isCur
    ? <div key={String(pid)} onClick={() => onNavigate(pid!)} className="cursor-pointer">{inner}</div>
    : <Link to={`/product/${pid}`} key={String(pid)}>{inner}</Link>;
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface PageState {
  loading:      boolean;
  product:      Product | null;
  firstReview:  Review | null;
  qty:          number;
  size:         string | null;
  fullDesc:     boolean;
  sameCat:      Product[];
  related:      Product[];
  sameCatTotal: number;
  sameCatPage:  number;
  sameCatPages: number;
  catLoading:   boolean;
  hasMoreCat:   boolean;
}
type PageAction =
  | { type: "RESET" }
  | { type: "LOADED"; product: Product | null; rel: RelatedPayload | null }
  | { type: "FIRST_REVIEW"; review: Review | null }
  | { type: "SET_QTY";  qty:  number }
  | { type: "SET_SIZE"; size: string | null }
  | { type: "TOGGLE_DESC" }
  | { type: "CAT_LOADING" }
  | { type: "CAT_LOADED"; rel: RelatedPayload };

const initState: PageState = {
  loading: true, product: null, firstReview: null,
  qty: 1, size: null, fullDesc: false,
  sameCat: [], related: [], sameCatTotal: 0, sameCatPage: 1, sameCatPages: 1,
  catLoading: false, hasMoreCat: true,
};

function pageReducer(s: PageState, a: PageAction): PageState {
  switch (a.type) {
    case "RESET":       return { ...initState };
    case "LOADED":      return {
      ...s, loading: false, product: a.product,
      firstReview: null, qty: 1, size: null, fullDesc: false,
      sameCat:      a.rel?.sameCat      ?? [],
      related:      a.rel?.related      ?? [],
      sameCatTotal: a.rel?.sameCatTotal ?? 0,
      sameCatPage:  a.rel?.sameCatPage  ?? 1,
      sameCatPages: a.rel?.sameCatPages ?? 1,
      catLoading:  false,
      hasMoreCat:  (a.rel?.sameCatPage ?? 1) < (a.rel?.sameCatPages ?? 1),
    };
    case "FIRST_REVIEW": return { ...s, firstReview: a.review };
    case "SET_QTY":      return { ...s, qty: a.qty };
    case "SET_SIZE":     return { ...s, size: a.size };
    case "TOGGLE_DESC":  return { ...s, fullDesc: !s.fullDesc };
    case "CAT_LOADING":  return { ...s, catLoading: true };
    case "CAT_LOADED":   return {
      ...s, catLoading: false,
      sameCat:      [...s.sameCat, ...a.rel.sameCat],
      related:      a.rel.related,
      sameCatTotal: a.rel.sameCatTotal,
      sameCatPage:  a.rel.sameCatPage,
      sameCatPages: a.rel.sameCatPages,
      hasMoreCat:   a.rel.sameCatPage < a.rel.sameCatPages,
    };
    default: return s;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ProductDetail() {
  const { user, locationData } = useAuth();
  const { id }   = useParams();
  const { dark } = useTheme();
  const navigate = useNavigate();

  const [st, dispatch] = useReducer(pageReducer, initState);
  const { loading, product, firstReview, qty, size, fullDesc,
          sameCat, related, sameCatTotal, sameCatPage, sameCatPages, catLoading, hasMoreCat } = st;

  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted,    setAccepted]    = useState(false);

  useEffect(() => { injectStylesOnce(); }, []);
  const productRef = useRef<Product|null>(null);
  productRef.current = product;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const catLoadingRef = useRef(false);
  const lastPageRef = useRef(1);

  const headers = useMemo(() => ({ "x-api-key": API_KEY }), []);

  const relUrl = useCallback((page: number) =>
    `${API}/product/${id}/related?sameCatPage=${page}&sameCatLimit=${SAME_CAT_LIMIT}`, [id]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INITIAL LOAD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const ac = new AbortController();
    dispatch({ type: "RESET" });
    lastPageRef.current = 1;
    catLoadingRef.current = false;
    window.scrollTo({ top: 0, behavior: "instant" });

    (async () => {
      try {
        const prodKey    = `product_${id}`;
        const relKey     = `related_${id}_p1`;
        const cachedProd = ssGet<Product>(prodKey);
        const cachedRel  = memCache.related.get(relKey) ?? null;

        const [product, rel] = await Promise.all([
          cachedProd
            ? Promise.resolve(cachedProd)
            : fetchJSON<Product>(`${API}/product/${id}`, ac.signal, { headers }),
          cachedRel
            ? Promise.resolve(cachedRel)
            : fetchJSON<RelatedPayload>(relUrl(1), ac.signal, { headers }),
        ]);

        if (!cachedProd) ssSet(prodKey, product);
        if (!cachedRel)  memCache.related.set(relKey, rel);

        if (!ac.signal.aborted) dispatch({ type: "LOADED", product, rel });

        const pid = String(product.id);
        const revKey = `reviews_${pid}`;
        if (memCache.reviews.has(revKey)) {
          dispatch({ type: "FIRST_REVIEW", review: memCache.reviews.get(revKey)![0] ?? null });
        } else {
          fetchJSON<any>(`${API}/reviewdata/${pid}`, ac.signal, { headers })
            .then(data => {
              const list: Review[] = Array.isArray(data) ? data : data?.data || [];
              memCache.reviews.set(revKey, list);
              if (!ac.signal.aborted) dispatch({ type: "FIRST_REVIEW", review: list[0] ?? null });
            }).catch(() => {});
        }
      } catch (err: any) {
        if (err.name !== "AbortError") dispatch({ type: "LOADED", product: null, rel: null });
      }
    })();

    return () => ac.abort();
  }, [id]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FETCH NEXT PAGE
  const handlePage = useCallback(async () => {
    const nextPage = lastPageRef.current + 1;
    if (catLoadingRef.current || !hasMoreCat) return;

    const ck  = `related_${id}_p${nextPage}`;
    const hit = memCache.related.get(ck);
    if (hit) {
      lastPageRef.current = nextPage;
      dispatch({ type: "CAT_LOADED", rel: hit });
      return;
    }

    catLoadingRef.current = true;
    lastPageRef.current = nextPage;
    dispatch({ type: "CAT_LOADING" });
    try {
      const rel = await fetchJSON<RelatedPayload>(relUrl(nextPage), undefined, { headers });
      memCache.related.set(ck, rel);
      dispatch({ type: "CAT_LOADED", rel });
    } catch (error) {
      console.error("Failed to load more products:", error);
      dispatch({ type: "CAT_LOADED", rel: { sameCat: [], related: [], sameCatTotal: sameCatTotal, sameCatPage: nextPage, sameCatPages: sameCatPages, sameCatLimit: SAME_CAT_LIMIT } });
    } finally {
      catLoadingRef.current = false;
    }
  }, [id, relUrl, headers, hasMoreCat, sameCatTotal, sameCatPages]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INFINITE SCROLL OBSERVER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!sentinelRef.current || !hasMoreCat) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && !catLoadingRef.current && hasMoreCat) {
          handlePage();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    
    const currentSentinel = sentinelRef.current;
    observer.observe(currentSentinel);
    
    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMoreCat, handlePage]);

  // ─── Memoized derivations ──────────────────────────────────────
  const descLines = useMemo(() => fmtDesc(product?.description || product?.details || ""), [product]);
  const features  = useMemo(() => parseFeatures(product?.description || product?.details || ""), [product]);
  const showSize  = useMemo(() => product ? needsSize(product) : false, [product]);
  const priceData = useMemo(() => product ? getInflatedPrice(product.price!) : null, [product]);
  const pid       = product ? String(product.id) : "";

  // ─── Callbacks ─────────────────────────────────────────────────
  const addToCart = useCallback(() => {
    const p = productRef.current;
    if (!user) { toast.error("Please login to add items to cart!"); return; }
    if (!p)    return;
    if (needsSize(p) && !size) { toast.error("Please select a size!"); return; }
    fetch(`${API}/cartdata`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json"  ,      'ngrok-skip-browser-warning': 'true' 
},
      body: JSON.stringify({ productId:  p.id, title: p.title || p.name, price: p.price, quantity: qty, size: size || null, image: p.image || p.thumbnail_img, email: user.email, category: p.category }),
    }).then(() => toast.success("Product added to cart!", { autoClose: 2000 }))
      .catch(() => toast.error("Failed to add product to cart."));
  }, [user, size, qty, headers]);

  const handleBuyNow = useCallback(async () => {
    const p = productRef.current;
    if (!user || !p) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const bd  = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const orderDateTime = `${bd.getFullYear()}-${pad(bd.getMonth()+1)}-${pad(bd.getDate())} ${pad(bd.getHours())}:${pad(bd.getMinutes())}:${pad(bd.getSeconds())}`;
    const orderData = {
      productId:  p.id, title: p.title || p.name, price: p.price,
      quantity: qty, totalPrice: p.price! * qty, size: size || null,
      image: p.image || p.thumbnail_img, email: user.email, name: user.name,
      address: locationData?.address, phonenumber: locationData?.phone,
      category: p.category, tracking_code: "to get tracking code please contact us", orderDateTime,
    };
    try {
      const res = await fetch(`${API}/orders`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" ,      'ngrok-skip-browser-warning': 'true' }, body: JSON.stringify(orderData) });
      if (!res.ok) { toast.error("Failed to place order."); return; }
    } catch { toast.error("Failed to place order."); return; }
    try {
      await fetch(`${API}/cartdata`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" ,      'ngrok-skip-browser-warning': 'true'  }, body: JSON.stringify(orderData) });
      toast.success("✅ Order সফলভাবে হয়েছে!", { autoClose: 3000 });
    } catch { toast.error("Order দেওয়া যায়নি।"); }
  }, [user, qty, size, locationData, headers]);

  const handleTruckConfirm = useCallback(async () => {
    await handleBuyNow();
    setTimeout(() => setShowConfirm(false), 1200);
  }, [handleBuyNow]);

  const handleReviewAdded  = useCallback((r: Review) => dispatch({ type: "FIRST_REVIEW", review: r }), []);
  const decQty             = useCallback(() => dispatch({ type: "SET_QTY", qty: Math.max(1, qty - 1) }), [qty]);
  const incQty             = useCallback(() => dispatch({ type: "SET_QTY", qty: qty + 1 }), [qty]);
  const handleCardNavigate = useCallback((p: string | number) => navigate(`/product/${p}`), [navigate]);

  // ─── Early returns ─────────────────────────────────────────────
  if (loading)  return <Skeleton />;
  if (!product) return <NotFound dark={dark} />;

  const title       = product.title || product.name || "";
  const image       = product.image || product.thumbnail_img || "";
  const description = product.description || product.details || "";
  const activePrice = product.price!;
  const images      = product.product_images || [];
  const { displayPrice, discountPct } = priceData!;

  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 min-h-screen">
      <Helmet>
        <title>{title} | ONE-SHOP Bangladesh — Cash on Delivery</title>
        <meta name="description" content={`${title} কিনুন ONE-SHOP এ। মাত্র ৳${activePrice} টাকায়। Cash on Delivery ও Free Shipping সারাদেশে।`} />
        <meta name="keywords" content={`${title}, ${title} বাংলাদেশ, ${product.category} online bangladesh, cash on delivery, free shipping bd`} />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:type" content="product" /><meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`${title} — ONE-SHOP`} />
        <meta property="og:description" content={`মাত্র ৳${activePrice} টাকায় পাচ্ছেন ${title}। Cash on Delivery ও Free Shipping।`} />
        <meta property="og:image" content={image} />
        <meta property="product:price:amount" content={String(activePrice)} /><meta property="product:price:currency" content="BDT" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${title} — ONE-SHOP`} />
        <meta name="twitter:description" content={`মাত্র ৳${activePrice} টাকায়। Cash on Delivery।`} />
        <meta name="twitter:image" content={image} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "Product",
          name: title, image, description: description.slice(0, 200),
          brand: { "@type": "Brand", name: "ONE-SHOP" },
          offers: { "@type": "Offer", priceCurrency: "BDT", price: activePrice,
            availability: "https://schema.org/InStock", seller: { "@type": "Organization", name: "ONE-SHOP" } },
        })}</script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <Link to="/shop">
          <motion.button whileHover={{ x: -5 }}
            className={`flex items-center gap-2 mb-6 sm:mb-8 text-sm font-medium transition-colors ${dark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
            <ArrowLeft size={16} /> Back to Shop
          </motion.button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12">
          <Gallery images={images} mainImage={image} dark={dark} title={title} />

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3 sm:mb-4 ${dark ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-violet-100 text-violet-700"}`}>{product.category || "General"}</span>
            <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>{title}</h1>
            {product.product_code && <p className={`text-xs mb-3 ${dark ? "text-gray-500" : "text-gray-400"}`}>Product Code: {product.product_code}</p>}

            <div className="mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-500">৳{(activePrice + 120).toFixed(2)}</span>
                <span className={`text-lg line-through ${dark ? "text-gray-500" : "text-gray-400"}`}>৳{displayPrice.toFixed(2)}</span>
                <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold">-{discountPct}% OFF</span>
              </div>
            </div>

            {features.length > 0 && (
              <div className={`mb-5 p-4 rounded-xl ${dark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
                <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${dark ? "text-gray-300" : "text-gray-700"}`}><Star size={14} className="text-amber-400 fill-amber-400" /> Key Features:</h3>
                <ul className="space-y-1 text-sm">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span className={dark ? "text-gray-400" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showSize && (
              <div className={`mb-5 p-4 rounded-xl ${dark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
                <h3 className={`text-sm font-semibold mb-3 ${dark ? "text-gray-300" : "text-gray-700"}`}>
                  Select Size {!size && <span className="text-red-400 text-xs font-normal ml-1">(Required)</span>}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(s => (
                    <button key={s} onClick={() => dispatch({ type: "SET_SIZE", size: s === size ? null : s })}
                      className={`w-12 h-12 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${size === s ? "bg-gradient-to-br from-violet-600 to-cyan-500 border-transparent text-white shadow-lg shadow-violet-500/30 scale-110" : dark ? "bg-white/5 border-white/10 text-gray-300 hover:border-violet-500/50 hover:text-white" : "bg-white border-gray-200 text-gray-700 hover:border-violet-400 hover:text-violet-600"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                {size && <p className="mt-2 text-xs text-emerald-400 font-medium">✓ Selected: {size}</p>}
              </div>
            )}

            <div className={`mb-5 p-4 rounded-xl ${dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>📝 Product Details</h3>
                <button onClick={() => dispatch({ type: "TOGGLE_DESC" })} className="text-xs text-violet-400 hover:text-violet-300">{fullDesc ? "Show Less" : "Read More"}</button>
              </div>
              <div className={`text-sm leading-relaxed space-y-2 ${dark ? "text-gray-400" : "text-gray-600"} ${!fullDesc ? "max-h-32 overflow-hidden relative" : ""}`}>
                {descLines.slice(0, fullDesc ? undefined : 3).map((l, i) => <p key={i} dangerouslySetInnerHTML={{ __html: l }} />)}
                {!fullDesc && descLines.length > 3 && <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${dark ? "from-gray-900" : "from-white"} to-transparent`} />}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
              <span className={`text-sm font-medium ${dark ? "text-gray-400" : "text-gray-600"}`}>Quantity:</span>
              <div className={`flex items-center rounded-xl overflow-hidden ${dark ? "bg-white/5 border border-white/10" : "bg-gray-100 border border-gray-200"}`}>
                <button onClick={decQty} className={`px-3 sm:px-4 py-2 sm:py-2.5 text-lg font-medium transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}>-</button>
                <span className={`px-4 sm:px-6 py-2 sm:py-2.5 font-semibold text-sm sm:text-base ${dark ? "text-white" : "text-gray-900"}`}>{qty}</span>
                <button onClick={incQty} className={`px-3 sm:px-4 py-2 sm:py-2.5 text-lg font-medium transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}>+</button>
              </div>
              <CartButton onClick={addToCart} />
            </div>

            <div className="mb-6 p-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
              <p className="flex items-center gap-2 text-sm sm:text-base font-bold text-emerald-400">🟢 Always Buy Cash on Delivery</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">✔ Safe, Secure &amp; Trusted Service Guaranteed</p>
            </div>

            {locationData?.address ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { if (!user) { toast.error("Please login first!"); return; } if (showSize && !size) { toast.error("Please select a size first!"); return; } setAccepted(false); setShowConfirm(true); }}
                className="relative w-full py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow duration-300 mb-6 overflow-hidden text-sm sm:text-base cursor-pointer">
                <ShoppingCart size={18} /> Buy Now ৳{(activePrice + 120).toFixed(2)}
              </motion.button>
            ) : (
              <Link to="/location" className="relative w-full py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg mb-6 text-sm sm:text-base">
                <ShoppingCart size={16} /> BUY NOW
              </Link>
            )}

            <Specs details={description} dark={dark} />
            <ReviewSection firstReview={firstReview} dark={dark} productId={pid} userEmail={user?.email || ""} onReviewAdded={handleReviewAdded} />

            <div className="grid mt-8 grid-cols-3 gap-2 sm:gap-4">
              {[{ icon: <Truck size={16} />, label: "Free Shipping" }, { icon: <Shield size={16} />, label: "Secure Payment" }, { icon: <RotateCcw size={16} />, label: "Easy Returns" }].map(f => (
                <div key={f.label} className={`p-2 sm:p-3 rounded-xl text-center ${dark ? "bg-white/[0.03] border border-white/5" : "bg-gray-50 border border-gray-200"}`}>
                  <div className="text-violet-400 flex justify-center mb-1">{f.icon}</div>
                  <p className={`text-[9px] sm:text-[10px] font-medium ${dark ? "text-gray-400" : "text-gray-600"}`}>{f.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ━━ Same Category — Infinite Scroll ━━ */}
        <div id="same-cat" className="mt-10 scroll-mt-24">
          <div className={`w-full p-4 rounded-xl mb-4 flex items-center justify-between flex-wrap gap-2 ${dark ? "bg-violet-500/10 border border-violet-500/20" : "bg-violet-50 border border-violet-200"}`}>
            <span className={`font-semibold ${dark ? "text-violet-300" : "text-violet-700"}`}>
              📦 এই ক্যাটাগরিতে মোট {sameCatTotal} টি প্রোডাক্ট আছে
            </span>
            <span className={`text-xs font-medium ${dark ? "text-violet-400" : "text-violet-600"}`}>
              দেখাচ্ছে {sameCat.length} / {sameCatTotal}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sameCat.map(p => {
              const isCur = String(p._id) === String(product._id) || String(p.id) === String(product.id);
              return (
                <LazyVisible key={String(p._id || p.id)}>
                  <CategoryCard p={p} isCur={isCur} dark={dark} onNavigate={handleCardNavigate} />
                </LazyVisible>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          <div className="mt-6 flex flex-col items-center gap-3 py-6">
            <div ref={sentinelRef} style={{ height: "20px" }} />
            {catLoading && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>Loading more products...</p>
              </div>
            )}
            {!hasMoreCat && sameCat.length > 0 && (
              <p className={`text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>
                সব {sameCatTotal} টি প্রোডাক্ট দেখা হয়েছে ✓
              </p>
            )}
            {sameCat.length === 0 && !catLoading && (
              <p className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
                এই ক্যাটাগরিতে আর কোনো প্রোডাক্ট নেই
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ━━ Confirm Modal ━━ */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ duration: 0.25 }}
              className={`rounded-2xl shadow-2xl w-full max-w-sm ${dark ? "bg-gray-900 border border-white/10" : "bg-white"}`}
              onClick={e => e.stopPropagation()}>
              <div className={`flex items-center justify-between p-4 border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
                <h3 className={`font-bold text-base ${dark ? "text-white" : "text-gray-800"}`}>🛒 Confirm Your Order</h3>
                <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <p className={`text-sm font-medium text-center ${dark ? "text-gray-300" : "text-gray-700"}`}>Are you sure you want to buy this product?</p>
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${dark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
                  <img src={image} alt={title} className="w-14 h-14 object-contain rounded-lg bg-white p-1 flex-shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${dark ? "text-white" : "text-gray-800"}`}>{title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-violet-400">Qty: {qty}</span>
                      {size && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${dark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-700"}`}>Size: {size}</span>}
                    </div>
                    <p className="text-sm font-bold mt-1 text-cyan-400">৳{(activePrice * qty).toFixed(2)}</p>
                  </div>
                </div>
                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${accepted ? dark ? "border-emerald-500/50 bg-emerald-500/10" : "border-emerald-400 bg-emerald-50" : dark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
                  <input type="radio" name="confirm" checked={accepted} onChange={() => setAccepted(true)} className="accent-emerald-500 w-4 h-4" />
                  <span className={`text-sm font-medium ${accepted ? "text-emerald-500" : dark ? "text-gray-400" : "text-gray-600"}`}>✔ I accept &amp; confirm this order</span>
                </label>
                <TruckOrderButton onConfirm={handleTruckConfirm} disabled={!accepted} price={(activePrice * qty).toFixed(2)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
