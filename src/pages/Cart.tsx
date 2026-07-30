import { useAuth } from '@/Contex/AuthContext';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Seo from "../components/Seo";

const API     = import.meta.env.VITE_API;
const API_KEY = import.meta.env.VITE_API_KEY;
const LIMIT   = 4;

const CLOUD_NAME = 'dittlxqip';
const PLACEHOLDER_IMG = '/placeholder-product.png';

const getOptimizedImageUrl = (originalUrl?: string) => {
  if (!originalUrl) return PLACEHOLDER_IMG;
  const encoded = encodeURIComponent(originalUrl);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/w_200,h_200,c_fit,f_auto,q_70/${encoded}`;
};

// ===== Shared item shape (used by both Cart and Order data) =====
interface ItemData {
  _id: string;
  title: string;
  image: string;
  category: string;
  price: number;
  quantity: number;
  productId: string | number;
  address?: string;
  tracking_code?: string; // only relevant for ORDER data
}

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
  </div>
);

// isOrder=true hole tracking status badge dekhabe, cart hole dekhabe na (kono UI change na, just conditional)
const ItemCard = ({ item, isOrder }: { item: ItemData; isOrder: boolean }) => (
  <Link to={`/product/${item.productId}`}>
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
                img.src = PLACEHOLDER_IMG;
              }
            }}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <h2 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug">{item.title}</h2>
          <span className="bg-gray-800 px-2.5 py-1 rounded-md text-gray-400 capitalize font-medium text-xs">{item.category}</span>
          {item.address && (
            <p className="text-xs text-gray-500 truncate">📍 {item.address}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-800 bg-gray-900/60">
        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="text-xl font-black text-emerald-400">৳{(item.price * item.quantity).toFixed(2)}</p>
          <p className="text-xs text-gray-500">৳{item.price} × {item.quantity}</p>
        </div>
        {isOrder && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.tracking_code ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
            {item.tracking_code ? 'Shipped' : 'Processing'}
          </span>
        )}
      </div>
    </div>
  </Link>
);

const Orders = () => {
  const { user } = useAuth();
  const email = user?.email;

  // ================================================================
  // ============ CART DATA (state, fetch, pagination) ==============
  // ================================================================
  const [cartItems, setCartItems] = useState<ItemData[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartPage, setCartPage] = useState(1);
  const [cartHasMore, setCartHasMore] = useState(true);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartLoadingMore, setCartLoadingMore] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const cartLoaderRef = useRef<HTMLDivElement>(null);
  const fetchedCartPages = useRef(new Set<number>());

  const fetchCartPage = useCallback(async (p: number) => {
    if (!email || fetchedCartPages.current.has(p)) return;
    fetchedCartPages.current.add(p);

    p === 1 ? setCartLoading(true) : setCartLoadingMore(true);

    try {
      const res = await fetch(`${API}/getcartdata`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, page: p, limit: LIMIT }),
      });
      const result = await res.json();
      if (!result.success) { setCartError(result.error); return; }

      setCartItems(prev => p === 1 ? result.cartItems : [...prev, ...result.cartItems]);
      setCartTotal(result.total);
      setCartHasMore(result.hasMore);
    } catch {
      setCartError('Something went wrong. Please try again.');
    } finally {
      p === 1 ? setCartLoading(false) : setCartLoadingMore(false);
    }
  }, [email]);

  useEffect(() => {
    if (!email) { setCartLoading(false); return; }
    fetchedCartPages.current.clear();
    setCartItems([]);
    setCartPage(1);
    setCartHasMore(true);
    fetchCartPage(1);
  }, [email, fetchCartPage]);

  useEffect(() => {
    if (!cartHasMore || cartLoading) return;
    const el = cartLoaderRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && cartHasMore && !cartLoadingMore) {
          setCartPage(prev => {
            const next = prev + 1;
            fetchCartPage(next);
            return next;
          });
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cartHasMore, cartLoading, cartLoadingMore, fetchCartPage]);


  // ================================================================
  // =========== ORDER DATA (state, fetch, pagination) ==============
  // ================================================================
  const [orderItems, setOrderItems] = useState<ItemData[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderHasMore, setOrderHasMore] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderLoadingMore, setOrderLoadingMore] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const orderLoaderRef = useRef<HTMLDivElement>(null);
  const fetchedOrderPages = useRef(new Set<number>());

  const fetchOrderPage = useCallback(async (p: number) => {
    if (!email || fetchedOrderPages.current.has(p)) return;
    fetchedOrderPages.current.add(p);

    p === 1 ? setOrderLoading(true) : setOrderLoadingMore(true);

    try {
      const res = await fetch(`${API}/orders?email=${encodeURIComponent(email)}&page=${p}&limit=${LIMIT}`, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const result = await res.json();
      if (result.error) { setOrderError(result.error); return; }

      setOrderItems(prev => p === 1 ? result.orders : [...prev, ...result.orders]);
      setOrderTotal(result.total);
      setOrderHasMore(result.hasMore);
    } catch {
      setOrderError('Something went wrong. Please try again.');
    } finally {
      p === 1 ? setOrderLoading(false) : setOrderLoadingMore(false);
    }
  }, [email]);

  useEffect(() => {
    if (!email) { setOrderLoading(false); return; }
    fetchedOrderPages.current.clear();
    setOrderItems([]);
    setOrderPage(1);
    setOrderHasMore(true);
    fetchOrderPage(1);
  }, [email, fetchOrderPage]);

  useEffect(() => {
    if (!orderHasMore || orderLoading) return;
    const el = orderLoaderRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && orderHasMore && !orderLoadingMore) {
          setOrderPage(prev => {
            const next = prev + 1;
            fetchOrderPage(next);
            return next;
          });
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [orderHasMore, orderLoading, orderLoadingMore, fetchOrderPage]);


  // ================================================================
  // ========================= RENDER ================================
  // ================================================================
  if (!email) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <Seo path="/Orders" />
      <div className="text-center bg-gray-900 p-8 rounded-xl border border-gray-800 w-full max-w-md">
        <p className="text-gray-300 text-lg font-semibold mb-4">Please login to view your orders</p>
        <Link to="/login" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200">
          Login
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 bg-gray-950 px-4 sm:px-6 lg:px-8 text-gray-200">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* ===================== CART SECTION ===================== */}
        <section>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 text-white tracking-tight">
            My Cart <span className="text-emerald-400">({cartTotal})</span>
          </h1>

          {cartLoading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : cartError ? (
            <div className="text-center bg-gray-900 p-8 rounded-xl border border-red-500/30">
              <p className="text-red-400 text-lg font-semibold mb-2">Error Occurred</p>
              <p className="text-gray-400 text-sm">{cartError}</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-gray-900 p-10 rounded-2xl shadow-xl text-center border border-gray-800">
              <p className="text-gray-400 text-lg font-medium mb-4">Your cart is empty.</p>
              <Link to="/" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => <ItemCard key={item._id} item={item} isOrder={false} />)}
              {cartHasMore && (
                <div ref={cartLoaderRef} className="space-y-4">
                  {cartLoadingMore && [1,2].map(i => <SkeletonCard key={i} />)}
                </div>
              )}
              {!cartHasMore && cartItems.length > LIMIT && (
                <p className="text-center text-xs text-gray-600 py-2">সব cart items দেখা হয়েছে ✓</p>
              )}
            </div>
          )}
        </section>

        {/* ===================== ORDER SECTION ===================== */}
        <section>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 text-white tracking-tight">
            My Orders <span className="text-emerald-400">({orderTotal})</span>
          </h1>

          {orderLoading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : orderError ? (
            <div className="text-center bg-gray-900 p-8 rounded-xl border border-red-500/30">
              <p className="text-red-400 text-lg font-semibold mb-2">Error Occurred</p>
              <p className="text-gray-400 text-sm">{orderError}</p>
            </div>
          ) : orderItems.length === 0 ? (
            <div className="bg-gray-900 p-10 rounded-2xl shadow-xl text-center border border-gray-800">
              <p className="text-gray-400 text-lg font-medium mb-4">You have no orders yet.</p>
              <Link to="/" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orderItems.map(item => <ItemCard key={item._id} item={item} isOrder={true} />)}
              {orderHasMore && (
                <div ref={orderLoaderRef} className="space-y-4">
                  {orderLoadingMore && [1,2].map(i => <SkeletonCard key={i} />)}
                </div>
              )}
              {!orderHasMore && orderItems.length > LIMIT && (
                <p className="text-center text-xs text-gray-600 py-2">সব orders দেখা হয়েছে ✓</p>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Orders;
