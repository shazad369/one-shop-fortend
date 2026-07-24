import { useState, useEffect, useRef, useCallback } from "react";
import Seo from "../components/Seo";

const LIMIT = 4;
const CACHE_TTL = 5 * 60 * 1000;

// ── cache helpers ─────────────────────────────────────────────
const cacheKey   = (page: number) => `orders_page_${page}`;

const getCache   = (page: number) => {
  try {
    const raw = sessionStorage.getItem(cacheKey(page));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(cacheKey(page)); return null; }
    return data;
  } catch { return null; }
};

const setCache   = (page: number, data: unknown) => {
  try { sessionStorage.setItem(cacheKey(page), JSON.stringify({ data, ts: Date.now() })); }
  catch { /* quota exceeded */ }
};
// ─────────────────────────────────────────────────────────────

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 6,
      background: copied ? "#14532d" : "#1e1b4b",
      border: `1px solid ${copied ? "#4ade80" : "#6d28d955"}`,
      color: copied ? "#4ade80" : "#a78bfa",
      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
    }}>
      {copied ? "✅" : "📋"}
    </button>
  );
}

function InfoRow({ icon, label, value, small }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: 8, padding: "6px 10px", borderRadius: 8, background: "#ffffff06",
    }}>
      <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, minWidth: 75 }}>
        {icon} {label}
      </span>
      <span style={{
        color: "#cbd5e1", fontSize: small ? 11 : 13, wordBreak: "break-all",
        textAlign: "right", flex: 1, lineHeight: 1.5,
      }}>
        {value}
      </span>
      <CopyBtn text={String(value)} />
    </div>
  );
}

// ── skeleton card ─────────────────────────────────────────────
function SkeletonOrder() {
  return (
    <div style={{
      border: "1px solid #6d28d944", borderRadius: 16, padding: "18px 20px",
      background: "linear-gradient(135deg, #1e1b4b44, #0f0f2344)",
      animation: "pulse 1.5s ease-in-out infinite",
    }}>
      <Seo path="/Addproductroute" />
      <div style={{ height: 24, background: "#6d28d933", borderRadius: 8, marginBottom: 14 }} />
      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
        <div style={{ width: 72, height: 72, background: "#6d28d933", borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, background: "#6d28d933", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 12, background: "#6d28d922", borderRadius: 6, width: "60%" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 52, background: "#6d28d922", borderRadius: 10 }} />)}
      </div>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} style={{ height: 32, background: "#6d28d911", borderRadius: 8, marginBottom: 6 }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders,      setOrders]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(true);
  const [error,       setError]       = useState(null);
  const [marked,      setMarked]      = useState({});

  const loaderRef    = useRef(null);
  const fetchedPages = useRef(new Set());
  const pageRef      = useRef(1);

  // ── fetch one page ────────────────────────────────────────
  const fetchPage = useCallback(async (p: number) => {
    if (fetchedPages.current.has(p)) return;
    fetchedPages.current.add(p);

    // cache check
    const cached = getCache(p);
    if (cached) {
      setOrders(prev => p === 1 ? cached.orders : [...prev, ...cached.orders]);
      setTotal(cached.total);
      setHasMore(cached.hasMore);
      p === 1 ? setLoading(false) : setLoadingMore(false);
      return;
    }

    p === 1 ? setLoading(true) : setLoadingMore(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API}/orders?page=${p}&limit=${LIMIT}`,
        { headers: { 'x-api-key': import.meta.env.VITE_API_KEY,
                     'ngrok-skip-browser-warning': 'true',
                    'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error("Server থেকে data আসেনি");
      const data = await res.json();

      // cache save
      setCache(p, { orders: data.orders, total: data.total, hasMore: data.hasMore });

      setOrders(prev => p === 1 ? data.orders : [...prev, ...data.orders]);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      p === 1 ? setLoading(false) : setLoadingMore(false);
    }
  }, []);

  // ── first load ────────────────────────────────────────────
  useEffect(() => {
    fetchedPages.current.clear();
    pageRef.current = 1;
    fetchPage(1);
  }, [fetchPage]);

  // ── infinite scroll ───────────────────────────────────────
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = loaderRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          pageRef.current += 1;
          fetchPage(pageRef.current);
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, fetchPage]);
  // ─────────────────────────────────────────────────────────

  const toggleMark = (id) => setMarked(prev => ({ ...prev, [id]: !prev[id] }));
  const markedCount = Object.values(marked).filter(Boolean).length;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", padding: "24px 16px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, borderBottom: "1px solid #6d28d944", paddingBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#e2e8f0" }}>📦 Orders Dashboard</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#94a3b8" }}>Loading...</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {[1,2,3,4].map(i => <SkeletonOrder key={i} />)}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", background: "#0a0a1a" }}>
      <p style={{ color: "#f87171", fontSize: 16 }}>❌ Error: {error}</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", padding: "24px 16px", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, borderBottom: "1px solid #6d28d944", paddingBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#e2e8f0" }}>📦 Orders Dashboard</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#94a3b8" }}>
            Total: <strong>{total}</strong> &nbsp;|&nbsp; Marked:{" "}
            <strong style={{ color: "#4ade80" }}>{markedCount}</strong>
          </p>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {orders.map((order) => {
          const isMarked = marked[order._id];
          return (
            <div key={order._id} style={{
              border: `1px solid ${isMarked ? "#4ade80" : "#6d28d9"}`,
              borderRadius: 16, padding: "18px 20px", transition: "all 0.3s ease",
              background: isMarked
                ? "linear-gradient(135deg, #14532d22, #052e1644)"
                : "linear-gradient(135deg, #1e1b4b44, #0f0f2344)",
              boxShadow: isMarked ? "0 0 18px #4ade8033" : "0 4px 24px #0005",
            }}>
              {/* Toggle row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!isMarked} onChange={() => toggleMark(order._id)} style={{ display: "none" }} />
                  <div style={{
                    width: 44, height: 24, borderRadius: 99, position: "relative",
                    background: isMarked ? "#4ade80" : "#6d28d9",
                    transition: "background 0.3s", cursor: "pointer", flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute", top: 4, left: isMarked ? 22 : 4,
                      width: 16, height: 16, borderRadius: "50%",
                      background: isMarked ? "#052e16" : "#fff", transition: "left 0.3s",
                    }} />
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                    background: isMarked ? "#4ade8022" : "#6d28d922",
                    color: isMarked ? "#4ade80" : "#a78bfa",
                    border: `1px solid ${isMarked ? "#4ade80" : "#6d28d9"}`,
                  }}>
                    {isMarked ? "✅ Done" : "⏳ Pending"}
                  </span>
                </label>
              </div>

              {/* Product image + title */}
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
                <img src={order.image} alt={order.title} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid #6d28d944", flexShrink: 0 }}
                  onError={(e) => (e.target.src = "https://via.placeholder.com/80")} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>{order.title}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#6d28d922", color: "#a78bfa", border: "1px solid #6d28d944" }}>{order.category}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#6d28d922", color: "#a78bfa", border: "1px solid #6d28d944" }}>Size: {order.size}</span>
                  </div>
                </div>
              </div>

              {/* Price boxes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Unit Price", val: `৳${order.price}`, color: null },
                  { label: "Qty", val: order.quantity, color: null },
                  { label: "Total", val: `৳${order.totalPrice}`, color: "#4ade80" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px",
                    background: color ? "#4ade8011" : "#6d28d911",
                    borderRadius: 10, border: `1px solid ${color ? "#4ade8066" : "#6d28d933"}`,
                  }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: color || "#e2e8f0" }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: "#6d28d933", marginBottom: 12 }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <InfoRow icon="✉️" label="Email"      value={order.email} />
                <InfoRow icon="📞" label="Phone"      value={order.phonenumber} />
                <InfoRow icon="📍" label="Address"    value={order.address} />
                <InfoRow icon="🔖" label="Order ID"   value={order._id} small />
                <InfoRow icon="🚚" label="Tracking"   value={order.tracking_code} />
                <InfoRow icon="⏰" label="Ordered At" value={order.orderDateTime} />
              </div>
            </div>
          );
        })}
      </div>

      {/* scroll loader */}
      {hasMore && (
        <div ref={loaderRef} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20, marginTop: 20 }}>
          {loadingMore && [1,2,3,4].map(i => <SkeletonOrder key={i} />)}
        </div>
      )}

      {/* end message */}
      {!hasMore && orders.length > LIMIT && (
        <p style={{ textAlign: "center", color: "#6d28d966", fontSize: 13, marginTop: 24 }}>
          সব orders দেখা হয়েছে ✓
        </p>
      )}
    </div>
  );
}
