import { useAuth } from '@/Contex/AuthContext';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const API     = import.meta.env.VITE_API;
const API_KEY = import.meta.env.VITE_API_KEY;
const LIMIT   = 4;
const CACHE_TTL = 5 * 60 * 1000; // 5 মিনিট

// ── image URL helper (Cloudinary fetch + fallback) ─────────────
const CLOUD_NAME = 'dittlxqip'; // তোমার cloudinary cloud name
const PLACEHOLDER_IMG = '/placeholder-product.png'; // public folder এ এই নামে একটা fallback image রাখো

const getOptimizedImageUrl = (originalUrl?: string) => {
  if (!originalUrl) return PLACEHOLDER_IMG;
  const encoded = encodeURIComponent(originalUrl);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/w_200,h_200,c_fit,f_auto,q_70/${encoded}`;
};
// ────────────────────────────────────────────────────────────

// ── cache helpers ─────────────────────────────────────────────
const cacheKey  = (email: string, page: number) => `cart_${email}_page_${page}`;

const getCache  = (email: string, page: number) => {
  try {
    const raw = sessionStorage.getItem(cacheKey(email, page));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(cacheKey(email, page));
      return null;
    }
    return data;
  } catch { return null; }
};

const setCache  = (email: string, page: number, data: unknown) => {
  try {
    sessionStorage.setItem(cacheKey(email, page), JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded হলে silently skip */ }
};

const clearCache = (email: string) => {
  Object.keys(sessionStorage)
    .filter(k => k.startsWith(`cart_${email}_`))
    .forEach(k => sessionStorage.removeItem(k));
};
// ─────────────────────────────────────────────────────────────

interface CartItem {
  _id: string;
  title: string;
  image: string;
  category: string;
  price: number;
  quantity: number;
  productId: string | number;
  tracking_code?: string;
  rating?: { rate: number; count: number };
}

// ── skeleton & card components ──────────────────
const SkeletonCard = () => (
  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden animate-pulse">
    <div className="flex gap-4 p-4">
      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-800 rounded-xl" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
        <div className="h-3 bg-gray-800 rounded w-1/3" />
      </div>
    </div>
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
      <div className="h-6 bg-gray-800 rounded w-24" />
      <div className="h-8 bg-gray-800 rounded-xl w-20" />
    </div>
  </div>
);


const CartItemCard = ({ item }: { item: CartItem }) => (

  <Link  to={`/product/${item.productId}`} >


  <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800/80 hover:border-gray-700 transition-all duration-300 overflow-hidden">
    <div className="flex gap-4 p-4">
      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-800 rounded-xl p-2 border border-gray-700/50 flex items-center justify-center">
        <img
          src={getOptimizedImageUrl(item.image)}
          alt={item.title}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== window.location.origin + PLACEHOLDER_IMG) {
              img.src = PLACEHOLDER_IMG; // Cloudinary-ও fail করলে local fallback
            }
          }}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <h2 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug">{item.title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-gray-800 px-2.5 py-1 rounded-md text-gray-400 capitalize font-medium">{item.category}</span>
          <span className="text-yellow-500 font-semibold flex items-center gap-1">
            ⭐ {item.rating?.rate || '0'}
            <span className="text-gray-500 font-normal">({item.rating?.count || '0'})</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Status</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 w-fit max-w-full">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.tracking_code ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
            <span className="truncate">{item.tracking_code ? 'Purchase successful' : 'Added to cart'}</span>
          </span>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-800 bg-gray-900/60">
      <div className="flex items-baseline gap-3 flex-wrap">
        <p className="text-xl font-black text-emerald-400">৳{((item.price ) * item.quantity).toFixed(2)}</p>
        <p className="text-xs text-gray-500">৳{item.price} × {item.quantity}</p>
      </div>
      <div
       
        className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/20 whitespace-nowrap"
      >
        {item.tracking_code ? 'See Product' : 'Buy Now'}
   </div>
    </div>
  </div>

  </Link>
);

const Cart = () => {
  const { user } = useAuth();
  const email    = user?.email;

  const [items,       setItems]       = useState<CartItem[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const loaderRef    = useRef<HTMLDivElement>(null);
  const fetchedPages = useRef(new Set<number>());

  const fetchPage = useCallback(async (p: number) => {
    if (!email || fetchedPages.current.has(p)) return;
    fetchedPages.current.add(p);

    // ── cache check ──────────────────────────────────
    const cached = getCache(email, p);
    if (cached) {
      setItems(prev => p === 1 ? cached.cartItems : [...prev, ...cached.cartItems]);
      setTotal(cached.total);
      setHasMore(cached.hasMore);
      p === 1 ? setLoading(false) : setLoadingMore(false);
      return;
    }
    // ─────────────────────────────────────────────────

    p === 1 ? setLoading(true) : setLoadingMore(true);

    try {
      const res    = await fetch(`${API}/getcartdata`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY,
                   'ngrok-skip-browser-warning': 'true',
                  'Content-Type': 'application/json' },
        body: JSON.stringify({ email, page: p, limit: LIMIT }),
      });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }

      // ── cache save ───────────────────────────────
      setCache(email, p, {
        cartItems: result.cartItems,
        total:     result.total,
        hasMore:   result.hasMore,
      });
      // ─────────────────────────────────────────────

      setItems(prev => p === 1 ? result.cartItems : [...prev, ...result.cartItems]);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      p === 1 ? setLoading(false) : setLoadingMore(false);
    }
  }, [email]);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    // ── email change হলে পুরনো cache clear ──────────
    clearCache(email);
    // ─────────────────────────────────────────────────
    fetchedPages.current.clear();
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1);
  }, [email, fetchPage]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = loaderRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchPage(next);
            return next;
          });
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, fetchPage]);

  

  if (!email) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="text-center bg-gray-900 p-8 rounded-xl border border-gray-800 w-full max-w-md">
        <p className="text-gray-300 text-lg font-semibold mb-4">Please login to view your cart</p>
        <Link to="/login" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200">
          Login
        </Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen pt-20 bg-gray-950 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-9 bg-gray-800 rounded w-48 animate-pulse mb-6" />
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="text-center bg-gray-900 p-8 rounded-xl border border-red-500/30 w-full max-w-md">
        <p className="text-red-400 text-lg font-semibold mb-2">Error Occurred</p>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 bg-gray-950 px-4 sm:px-6 lg:px-8 text-gray-200">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 text-white tracking-tight">
          Shopping Cart{' '}
          <span className="text-emerald-400">({total} items)</span>
        </h1>

        {items.length === 0 ? (
          <div className="bg-gray-900 p-10 rounded-2xl shadow-xl text-center border border-gray-800">
            <p className="text-gray-400 text-lg font-medium mb-4">Your cart is empty.</p>
            <Link to="/" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => <CartItemCard key={item._id} item={item} />)}
            {hasMore && (
              <div ref={loaderRef} className="space-y-4">
                {loadingMore && [1,2].map(i => <SkeletonCard key={i} />)}
              </div>
            )}
            {!hasMore && items.length > LIMIT && (
              <p className="text-center text-xs text-gray-600 py-2">সব items দেখা হয়েছে ✓</p>
            )}
            <div className="bg-gray-900 rounded-xl shadow-xl p-5 sm:p-6 border border-gray-800">
           
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
