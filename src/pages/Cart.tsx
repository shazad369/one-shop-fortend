import { useAuth } from '@/Contex/AuthContext';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Seo from "../components/Seo";
import { ChevronRight } from "lucide-react";

const API     = import.meta.env.VITE_API;
const API_KEY = import.meta.env.VITE_API_KEY;
const LIMIT   = 4;

const CLOUD_NAME = 'dittlxqip';
const PLACEHOLDER_IMG = '/placeholder-product.png';


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
  paperfly_tracking_number?: string; // Paperfly booking-এর পর সেট হয়
  pickup_store_name?: string;
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

// ================================================================
// =============== REAL Paperfly delivery status =================
// ================================================================
// ⚠️ CHANGED: আগে এখানে Steadfast-এর status endpoint কল হতো, কিন্তু courier
// booking flow এখন Paperfly-তে shift হয়েছে (admin panel থেকে confirm করলে
// Paperfly-তে বুক হয়, Steadfast-এ আর কখনো বুক হয় না)। তাই Steadfast endpoint
// কল করলে backend সবসময় "processing" রিটার্ন করতো (কারণ
// steadfast_consignment_id কখনো সেট হয় না) — এটাই "সবসময় Processing দেখানোর"
// আসল কারণ। এখন Paperfly-এর status endpoint কল হচ্ছে।
type CourierStatus =
  | 'pending_confirmation' | 'processing' | 'in_transit' | 'delivered'
  | 'partial_delivered' | 'returned' | 'cancelled' | 'unknown';

const STATUS_META: Record<CourierStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  pending_confirmation: { label: 'Order Received',   dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-950/40',   border: 'border-amber-500/30' },
  processing:            { label: 'Processing',        dot: 'bg-cyan-400',    text: 'text-cyan-400',    bg: 'bg-cyan-950/40',    border: 'border-cyan-500/30' },
  in_transit:            { label: 'In Transit',         dot: 'bg-blue-400',    text: 'text-blue-400',    bg: 'bg-blue-950/40',    border: 'border-blue-500/30' },
  delivered:             { label: 'Delivered',          dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' },
  partial_delivered:     { label: 'Partial Delivered',  dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-950/40',   border: 'border-amber-500/30' },
  returned:              { label: 'Returned',           dot: 'bg-orange-400',  text: 'text-orange-400',  bg: 'bg-orange-950/40',  border: 'border-orange-500/30' },
  cancelled:             { label: 'Cancelled',          dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-950/40',     border: 'border-red-500/30' },
  unknown:               { label: 'Processing',         dot: 'bg-gray-500',    text: 'text-gray-400',    bg: 'bg-gray-800/40',    border: 'border-gray-700' },
};

// order._id দিয়ে Paperfly-এর আসল delivery status আনে
// (server.js-এর /courier/paperfly/status/:orderId)
const OrderStatusBadge = ({ orderId }: { orderId: string }) => {
  const [status, setStatus] = useState<CourierStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/courier/paperfly/status/${orderId}`, {
      headers: { 'x-api-key': API_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setStatus(data?.success ? (data.status as CourierStatus) : 'unknown');
      })
      .catch(() => {
        if (!cancelled) setStatus('unknown');
      });
    return () => { cancelled = true; };
  }, [orderId]);

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 border border-gray-700 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
        Loading
      </span>
    );
  }

  const meta = STATUS_META[status] ?? STATUS_META.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${meta.bg} border ${meta.border} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

// isOrder=true hole real Paperfly status badge dekhabe, cart hole dekhabe na (kono UI change na, just conditional)
const ItemCard = ({ item, isOrder }: { item: ItemData; isOrder: boolean }) => (


<div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800/80 hover:border-gray-700 transition-all duration-300 overflow-hidden">
  <div className="flex gap-4 p-4">
    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-800 rounded-xl p-2 border border-gray-700/50 flex items-center justify-center">
      <img
        src={item.image || PLACEHOLDER_IMG}
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
      {item.paperfly_tracking_number && (
        <p className="text-xs text-gray-500">
          Tracking: <span className="text-gray-300 font-mono">{item.paperfly_tracking_number}</span>
        </p>
      )}
      <span className="bg-gray-800 px-2.5 py-1 rounded-md text-gray-400 capitalize font-medium text-xs">{item.category}</span>
      {item.address && (
        <p className="text-xs text-gray-500 truncate">📍 {item.address}</p>
      )}
    </div>

    {/* ডান পাশে View Product লিংক — vertically center করা */}
    <Link
      to={`/product/${item.productId ?? item.id}`}
      className="flex-shrink-0 self-center flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-500/10 hover:border-emerald-400 transition-colors whitespace-nowrap"
    >
      View Product
      <ChevronRight size={14} />
    </Link>
  </div>

  <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-800 bg-gray-900/60">
    <div className="flex items-baseline gap-3 flex-wrap">
      <p className="text-xl font-black text-emerald-400">৳{(item.price * item.quantity).toFixed(2)}</p>
      <p className="text-xs text-gray-500">৳{item.price} × {item.quantity}</p>
    </div>
    {isOrder && <OrderStatusBadge orderId={item._id} />}
  </div>
</div>
 
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
      // ⚠️ CHANGED: আগে এখানে "Byeremail" নামে query param পাঠানো হচ্ছিল, কিন্তু
      // backend-এর GET /orders রুট খোঁজে "email" (req.query.email) — নাম না মেলায়
      // filter সবসময় খালি { } হয়ে যেত এবং এই ইউজার প্ল্যাটফর্মের সব ইউজারের সব
      // অর্ডার দেখতে পাচ্ছিল। এখন সঠিক param নাম "email" ব্যবহার হচ্ছে।
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