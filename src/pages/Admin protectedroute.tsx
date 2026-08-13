import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  PackageCheck,
  Send,
  ChevronLeft,
  ChevronRight,
  Clock,
  PackageX,
  Truck,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  Store as StoreIcon,
  Pencil,
  X,
  Loader2,
  Ban,
  Wallet,
} from "lucide-react";

// ════════════════════════════════════════════════════════════
// ⚙️ Config
// ════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API;
const API_KEY = import.meta.env.VITE_API_KEY;
const TOKEN_KEY = "userToken"; // admin token localStorage key (existing app-এর সাথে মেলানো)

function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      Authorization: `Bearer ${getAdminToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

// ════════════════════════════════════════════════════════════
// 🏷️ Status metadata
// ════════════════════════════════════════════════════════════

const STATUS_META = {
  pending_confirmation: { label: "কনফার্ম বাকি", icon: AlertTriangle, text: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-500/30" },
  processing: { label: "প্রসেসিং", icon: Clock, text: "text-cyan-400", bg: "bg-cyan-950/30", border: "border-cyan-500/30" },
  in_transit: { label: "পথে আছে", icon: Truck, text: "text-blue-400", bg: "bg-blue-950/30", border: "border-blue-500/30" },
  delivered: { label: "ডেলিভারি হয়েছে", icon: PackageCheck, text: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-500/30" },
  partial_delivered: { label: "আংশিক ডেলিভারি", icon: AlertTriangle, text: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-500/30" },
  returned: { label: "রিটার্ন হয়েছে", icon: RotateCcw, text: "text-orange-400", bg: "bg-orange-950/30", border: "border-orange-500/30" },
  cancelled: { label: "বাতিল হয়েছে", icon: PackageX, text: "text-red-400", bg: "bg-red-950/30", border: "border-red-500/30" },
};
const STATUS_ORDER = ["pending_confirmation", "processing", "in_transit", "delivered", "partial_delivered", "returned", "cancelled"];

const TABS = [
  { key: "orders", label: "অর্ডার", icon: Truck },
  { key: "stores", label: "সেলার স্টোর", icon: StoreIcon },
];

// ════════════════════════════════════════════════════════════
// 🏠 Root
// ════════════════════════════════════════════════════════════

export default function AdminOrdersPanel() {
  const [tab, setTab] = useState("orders");
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0B0A] text-[#EDEFEC]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between border-b border-[#262A27] pb-4">
          <div>
            <p className="text-xs font-mono tracking-widest text-[#2DD4BF] uppercase mb-1">Admin</p>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Truck size={20} className="text-[#2DD4BF]" />
              Orders & Courier
            </h1>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {TABS.map((t) => {
            const TIcon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors " +
                  (active ? "bg-[#2DD4BF] text-[#0A0B0A]" : "bg-[#141614] text-[#9AA39C] border border-[#262A27] hover:border-[#3A403C]")
                }
              >
                <TIcon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {toast && (
          <div
            className={
              "mb-4 rounded-lg px-3.5 py-2.5 text-xs font-medium border " +
              (toast.type === "error" ? "bg-red-950/40 border-red-500/30 text-red-400" : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400")
            }
          >
            {toast.message}
          </div>
        )}

        {tab === "orders" && <OrdersPanel onToast={showToast} />}
        {tab === "stores" && <StoresPanel onToast={showToast} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 📊 Status summary bar (filter হিসেবেও কাজ করে)
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// 💰 Revenue summary — delivered order-এর মোট বিক্রি + ৫% কমিশন + সেলার payout
// ════════════════════════════════════════════════════════════

function formatTaka(n) {
  return `৳${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

function RevenueSummaryCard({ refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/admin/delivered-summary");
        if (!cancelled && res.success) setData(res);
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return <div className="h-20 rounded-xl bg-[#141614] border border-[#262A27] animate-pulse mb-1" />;
  }
  if (!data) return null;

  const commissionPct = Math.round((data.commissionRate || 0.05) * 100);

  return (
    <div className="bg-[#141614] border border-[#262A27] rounded-xl p-4 mb-1">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#2DD4BF] uppercase tracking-wider mb-3">
        <Wallet size={14} />
        <span>ডেলিভারি হওয়া অর্ডারের হিসাব ({data.totalOrders} টা)</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-[#6E756F] mb-1">মোট বিক্রি (Original)</p>
          <p className="text-sm font-semibold text-[#EDEFEC] font-mono">{formatTaka(data.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#6E756F] mb-1">আমাদের কমিশন ({commissionPct}%)</p>
          <p className="text-sm font-semibold text-[#2DD4BF] font-mono">{formatTaka(data.platformProfit)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#6E756F] mb-1">সেলারদের প্রাপ্য ({100 - commissionPct}%)</p>
          <p className="text-sm font-semibold text-[#EDEFEC] font-mono">{formatTaka(data.sellerPayoutTotal)}</p>
        </div>
      </div>
    </div>
  );
}

function StatusSummaryBar({ activeStatus, onSelect, refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/admin/order-status-summary");
        if (!cancelled && data.success) {
          setSummary(data.summary);
          setTotal(data.total);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[#141614] border border-[#262A27] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={
          "rounded-xl border p-2.5 text-left transition-colors " +
          (activeStatus === null ? "bg-[#2DD4BF]/10 border-[#2DD4BF]" : "bg-[#141614] border-[#262A27] hover:border-[#3A403C]")
        }
      >
        <p className="text-[10px] text-[#6E756F] mb-1">সব অর্ডার</p>
        <p className="text-base font-semibold text-[#EDEFEC] font-mono">{total}</p>
      </button>

      {STATUS_ORDER.map((key) => {
        const meta = STATUS_META[key];
        const Icon = meta.icon;
        const active = activeStatus === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={
              "rounded-xl border p-2.5 text-left transition-colors " +
              (active ? `${meta.bg} ${meta.border}` : "bg-[#141614] border-[#262A27] hover:border-[#3A403C]")
            }
          >
            <div className={`flex items-center gap-1 mb-1 ${active ? meta.text : "text-[#6E756F]"}`}>
              <Icon size={11} />
              <p className="text-[10px] truncate">{meta.label}</p>
            </div>
            <p className={`text-base font-semibold font-mono ${active ? meta.text : "text-[#EDEFEC]"}`}>
              {summary[key] ?? 0}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 📦 Orders panel — pending order দেখা, select করে confirm, sync, cancel
// ════════════════════════════════════════════════════════════

function OrdersPanel({ onToast }) {
  const [activeStatus, setActiveStatus] = useState("pending_confirmation"); // ডিফল্টে confirm-বাকি গুলো দেখায়
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "50" });
      if (activeStatus) qs.set("status", activeStatus);
      const data = await apiFetch(`/admin/orders?${qs.toString()}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setSelected(new Set());
    } catch (err) {
      onToast("error", err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [activeStatus]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function bump() {
    setRefreshKey((k) => k + 1);
    load();
  }

  async function confirmOne(orderId) {
    setBusyId(orderId);
    try {
      const data = await apiFetch(`/admin/orders/${orderId}/confirm`, { method: "POST" });
      onToast("success", `Confirm হয়েছে — Tracking: ${data.paperfly?.tracking_number || "—"}`);
      bump();
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmSelected() {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      const data = await apiFetch("/admin/orders/bulk-confirm", {
        method: "POST",
        body: JSON.stringify({ orderIds: Array.from(selected) }),
      });
      onToast("success", `${data.booked}/${data.requested} টা order বুক হয়েছে`);
      bump();
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function syncOne(orderId) {
    setBusyId(orderId);
    try {
      const data = await apiFetch(`/admin/orders/${orderId}/sync-status`, { method: "POST" });
      onToast("success", `Status: ${STATUS_META[data.status]?.label || data.status}`);
      bump();
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function syncAll() {
    setSyncBusy(true);
    try {
      const data = await apiFetch("/admin/orders/sync-all", { method: "POST" });
      onToast("success", `${data.checked} টা চেক হলো, ${data.updated} টা আপডেট হয়েছে`);
      bump();
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setSyncBusy(false);
    }
  }

  async function cancelOne(orderId) {
    if (!confirm("এই অর্ডার বাতিল করতে চান?")) return;
    setBusyId(orderId);
    try {
      await apiFetch(`/admin/orders/${orderId}/cancel-paperfly`, { method: "POST" });
      onToast("success", "অর্ডার বাতিল হয়েছে");
      bump();
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <RevenueSummaryCard refreshKey={refreshKey} />

      <StatusSummaryBar activeStatus={activeStatus} onSelect={setActiveStatus} refreshKey={refreshKey} />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-[#6E756F]">
          {activeStatus ? STATUS_META[activeStatus]?.label : "সব অর্ডার"} ({total || orders.length})
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={syncAll}
            disabled={syncBusy}
            className="flex items-center gap-1.5 text-xs font-medium text-[#9AA39C] border border-[#262A27] px-3 py-1.5 rounded-lg hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors disabled:opacity-40"
            title="চলমান সব order-এর status Paperfly থেকে refresh করো"
          >
            <RefreshCw size={12} className={syncBusy ? "animate-spin" : ""} />
            সব Status Sync
          </button>

          {activeStatus === "pending_confirmation" && (
            <button
              onClick={confirmSelected}
              disabled={selected.size === 0 || bulkBusy}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#2DD4BF] text-[#0A0B0A] px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#5EEAD4] transition-colors"
            >
              <Send size={12} />
              Bulk Confirm ({selected.size})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#6E756F]">লোড হচ্ছে…</p>
      ) : orders.length === 0 ? (
        <div className="bg-[#141614] border border-[#262A27] rounded-xl p-8 text-center">
          <PackageCheck size={28} className="text-[#2DD4BF] mx-auto mb-2" />
          <p className="text-sm text-[#9AA39C]">
            {activeStatus ? "এই স্ট্যাটাসে কোনো অর্ডার নেই" : "কোনো order পাওয়া যায়নি 🎉"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              selectable={activeStatus === "pending_confirmation"}
              selected={selected.has(order._id)}
              onToggle={() => toggle(order._id)}
              busy={busyId === order._id}
              onConfirm={() => confirmOne(order._id)}
              onSync={() => syncOne(order._id)}
              onCancel={() => cancelOne(order._id)}
            />
          ))}
        </div>
      )}

      <PageControls page={page} setPage={setPage} disableNext={orders.length < 50} />
    </div>
  );
}

function OrderRow({ order, selectable, selected, onToggle, busy, onConfirm, onSync, onCancel }) {
  const statusMeta = STATUS_META[order.courier_status] || STATUS_META.pending_confirmation;
  const StatusIcon = statusMeta.icon;
  const booked = !!order.paperfly_order_ref;
  const canCancel = booked && !["delivered", "cancelled", "returned"].includes(order.courier_status);

  return (
    <div className="flex items-center gap-3 bg-[#141614] border border-[#262A27] rounded-xl p-3">
      {selectable && (
        <button onClick={onToggle} className="text-[#2DD4BF] shrink-0">
          {selected ? <CheckSquare size={18} /> : <Square size={18} className="text-[#3A403C]" />}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#EDEFEC] truncate">{order.title || order.name || "Product"}</p>
        <p className="text-[11px] text-[#6E756F] truncate">
          {order.name || order.email} • {order.phone || order.contact_number || order.phonenumber || "no phone"} •{" "}
          {order.address ? order.address.slice(0, 40) : "no address"}
        </p>
        {order.seller_email && (
          <p className="text-[10px] text-[#4A504B] truncate">seller: {order.seller_email}</p>
        )}
        {booked && (
          <p className="text-[10px] text-[#2DD4BF] font-mono mt-0.5">
            Tracking: {order.paperfly_tracking_number || "—"} {order.pickup_store_name ? `• pickup: ${order.pickup_store_name}` : ""}
          </p>
        )}
      </div>

      <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg shrink-0 ${statusMeta.text} ${statusMeta.bg} border ${statusMeta.border}`}>
        <StatusIcon size={11} />
        {statusMeta.label}
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        {!booked && (
          <button
            onClick={onConfirm}
            disabled={busy}
            className="text-xs font-medium text-[#2DD4BF] border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-2.5 py-1 rounded-lg hover:bg-[#2DD4BF]/20 transition-colors disabled:opacity-40"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
          </button>
        )}
        {booked && (
          <button
            onClick={onSync}
            disabled={busy}
            title="Paperfly থেকে status refresh করো"
            className="text-[#6E756F] hover:text-[#2DD4BF] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
          </button>
        )}
        {canCancel && (
          <button
            onClick={onCancel}
            disabled={busy}
            title="অর্ডার বাতিল করো"
            className="text-[#6E756F] hover:text-[#E4645A] transition-colors disabled:opacity-40"
          >
            <Ban size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🏪 Stores panel — সেলারদের Paperfly store name সেট করা
// ════════════════════════════════════════════════════════════

function StoresPanel({ onToast }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // store doc

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/stores");
      setStores(data.stores || []);
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      {editing && (
        <PaperflyNameModal
          store={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setStores((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
            setEditing(null);
            onToast("success", "Paperfly store name সেট হয়েছে");
          }}
          onToast={onToast}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6E756F]">{stores.length} টা সেলার স্টোর</p>
        <button onClick={load} disabled={loading} className="text-[#6E756F] hover:text-[#2DD4BF] transition-colors disabled:opacity-40">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#6E756F]">লোড হচ্ছে…</p>
      ) : stores.length === 0 ? (
        <div className="bg-[#141614] border border-[#262A27] rounded-xl p-8 text-center">
          <StoreIcon size={24} className="text-[#3A403C] mx-auto mb-2" />
          <p className="text-sm text-[#6E756F]">কোনো স্টোর পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stores.map((store) => (
            <div key={store._id} className="bg-[#141614] border border-[#262A27] rounded-xl p-3">
              <div className="flex items-center gap-3">
                <img
                  src={store.profile_image}
                  alt={store.store_name}
                  className="w-10 h-10 rounded-full object-cover border border-[#262A27] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#EDEFEC] truncate">{store.store_name}</p>
                  <p className="text-[11px] text-[#6E756F] truncate">{store.email} • {store.phone}</p>
                                    <p> Address: {store.address}</p>

                  {store.paperfly_store_name ? (
                    <div className="mt-0.5">
                      <p className="text-[10px] text-[#2DD4BF] font-mono">Paperfly: {store.paperfly_store_name}</p>
                      {store.paperfly_address && (
                        <p className="text-[10px] text-[#6E756F] truncate">📍 {store.paperfly_address}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-400 mt-0.5">⚠️ Paperfly store name সেট করা হয়নি</p>
                  )}
                </div>
                <button
                  onClick={() => setEditing(store)}
                  className="flex items-center gap-1 text-xs font-medium text-[#C9CDC7] border border-[#262A27] px-2.5 py-1.5 rounded-lg hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors shrink-0"
                >
                  <Pencil size={11} />
                  {store.paperfly_store_name ? "এডিট" : "সেট করো"}
                </button>
              </div>

              {/* এই সেলারের delivered order থেকে বিক্রির হিসাব — original + ৫% কমিশন কাটার পর payout
                  এখন সব সেলারের জন্যই দেখানো হয়, কোনো delivered order না থাকলেও (তখন ৳0 দেখাবে) */}
              <div className="mt-3 pt-3 border-t border-[#262A27] grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] text-[#6E756F]">বিক্রি ({store.delivered_order_count || 0} অর্ডার)</p>
                  <p className="text-xs font-semibold text-[#EDEFEC] font-mono">{formatTaka(store.delivered_total_amount)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#6E756F]">আমাদের কমিশন (৫%)</p>
                  <p className="text-xs font-semibold text-[#2DD4BF] font-mono">{formatTaka(store.platform_profit)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#6E756F]">সেলারের প্রাপ্য</p>
                  <p className="text-xs font-semibold text-[#EDEFEC] font-mono">{formatTaka(store.seller_payout)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaperflyNameModal({ store, onClose, onSaved, onToast }) {
  const [name, setName] = useState(store.paperfly_store_name || "");
  const [address, setAddress] = useState(store.paperfly_address || "");
  const [phone, setPhone] = useState(store.paperfly_phone || store.phone || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      onToast("error", "Paperfly store name দাও");
      return;
    }
    setSaving(true);
    try {
      const data = await apiFetch(`/admin/store/${store._id}/paperfly-name`, {
        method: "PUT",
        body: JSON.stringify({
          paperfly_store_name: name.trim(),
          paperfly_address: address.trim(),
          paperfly_phone: phone.trim(),
        }),
      });
      onSaved(data.store);
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#141614] border border-[#262A27] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <StoreIcon size={15} className="text-[#2DD4BF]" /> Paperfly Store তথ্য
          </h3>
          <button onClick={onClose} className="text-[#6E756F] hover:text-[#EDEFEC]">
            <X size={16} />
          </button>
        </div>

        <p className="text-[11px] text-[#6E756F] mb-3 leading-relaxed">
          Paperfly merchant panel-এ (b.ecourier-এর মতো নয়, paperfly.com.bd-এর নিজস্ব panel) এই সেলার "{store.store_name}"-এর
          ঠিকানা দিয়ে একটা Store আগে থেকে বানানো থাকতে হবে। সেই Store-এর ঠিক নামটা এখানে বসান — এই নামটাই প্রতিটা অর্ডারে
          Paperfly-কে পাঠানো হবে pickup ঠিকানা হিসেবে।
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-[#C9CDC7] mb-1 block">Paperfly Store name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: Seller_101_Rajshahi"
              className="w-full rounded-md border border-[#262A27] bg-[#181A18] px-2.5 py-1.5 text-xs text-[#EDEFEC] outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#C9CDC7] mb-1 block">
              পিকআপ ঠিকানা (ঐচ্ছিক — শুধু রেফারেন্সের জন্য)
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="যেমন: রাজশাহী, নাটোর, লালপুর"
              className="w-full rounded-md border border-[#262A27] bg-[#181A18] px-2.5 py-1.5 text-xs text-[#EDEFEC] outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] resize-none"
            />
            <p className="mt-1 text-[10px] text-[#4A504B]">
              এই ঠিকানা Paperfly-কে পাঠানো হয় না (Paperfly শুধু নাম দিয়ে চেনে) — এটা শুধু admin panel-এ মনে রাখার জন্য
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[#C9CDC7] mb-1 block">যোগাযোগ নম্বর (ঐচ্ছিক)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full rounded-md border border-[#262A27] bg-[#181A18] px-2.5 py-1.5 text-xs text-[#EDEFEC] outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#262A27] text-[#C9CDC7] py-2 text-xs hover:bg-[#181A18] transition-colors"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#2DD4BF] text-[#0A0B0A] font-semibold py-2 text-xs hover:bg-[#5EEAD4] transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            সেভ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🔢 Pagination
// ════════════════════════════════════════════════════════════

function PageControls({ page, setPage, disableNext }) {
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-[#6E756F] hover:text-[#2DD4BF] disabled:opacity-30 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <span className="text-xs text-[#9AA39C] font-mono">Page {page}</span>
      <button onClick={() => setPage((p) => p + 1)} disabled={disableNext} className="text-[#6E756F] hover:text-[#2DD4BF] disabled:opacity-30 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}