import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ImagePlus,
  X,
  Percent,
  Tag,
  CheckCircle2,
  Hash,
  User,
  Store as StoreIcon,
  Phone,
  Package,
  Pencil,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Mail,
  Trash2,
  PackageCheck,
  PackageX,
  Truck,
  Clock,
  Eye,
  Wallet,
} from "lucide-react";

// ════════════════════════════════════════════════════════════
// ⚙️ Config — backend already exists, this file only talks to it
// ════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API;
const API_KEY = import.meta.env.VITE_API_KEY;
const MAX_PRODUCT_IMAGES = 6;
const CATEGORY_OPTIONS = [
  "Customize & Gift",
  "Foods",
  "Gadgets & Electronics",
  "Home & Lifestyle",
  "Kids Zone",
  "Men's Fashion",
  "Offer",
  "Other's",
  "Watch",
  "Winter",
  "Women's Fashion",
];

function authFetch(path, { method = "GET", body, isForm = false } = {}) {
  const token = localStorage.getItem("sellerToken");
  const headers = { Authorization: `Bearer ${token}` };
  if (!isForm) headers["Content-Type"] = "application/json";
  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    cache: "no-store", // browser যেন কখনো 304/cached response না দেয় — সবসময় fresh data
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  }).then(async (res) => {
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* non-json response */
    }
    if (!res.ok) {
      const err = new Error(data?.error || "কিছু একটা সমস্যা হয়েছে");
      err.status = res.status;
      throw err;
    }
    return data;
  });
}

// ছবি আপলোডের আগে হালকা resize করে দেয় — slow connection-এও দ্রুত আপলোড হয়
// (চূড়ান্ত ~30KB compression backend-এ sharp দিয়ে হয়, এটা শুধু আপলোড দ্রুত করার জন্য)
function fileToResizedBase64(file, maxWidth = 1000, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ছবি পড়া যায়নি"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("ছবি লোড করা যায়নি"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ════════════════════════════════════════════════════════════
// 🧩 Shared bits
// ════════════════════════════════════════════════════════════

function Field({ label, error, icon: Icon, required, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-[#C9CDC7] mb-1 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-[#6E756F]" />}
        {label}
        {required && <span className="text-[#E4645A]">*</span>}
      </label>
      {children}
      {error && <p className="mt-0.5 text-[11px] text-[#E4645A]">{error}</p>}
    </div>
  );
}

function inputClass(hasError, disabled) {
  return (
    "w-full rounded-md border bg-[#181A18] px-2.5 py-1.5 text-xs text-[#EDEFEC] outline-none transition-colors placeholder:text-[#4A504B] " +
    "focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] " +
    (disabled ? "opacity-60 cursor-not-allowed " : "") +
    (hasError ? "border-[#8A3E37]" : "border-[#262A27]")
  );
}

function pillClass(active) {
  return (
    "flex items-center gap-1 rounded px-2 py-1 transition-colors " +
    (active ? "bg-[#2DD4BF] text-[#0A0B0A] font-semibold" : "text-[#6E756F]")
  );
}

function Banner({ tone = "error", children, onClose }) {
  const styles =
    tone === "error"
      ? "bg-[#2A1614] border-[#8A3E37] text-[#F3B3AC]"
      : "bg-[#122019] border-[#1F5C42] text-[#7CE5AE]";
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${styles}`}>
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span className="flex-1">{children}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function FullScreenState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="min-h-screen w-full bg-[#0A0B0A] text-[#EDEFEC] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#141614] border border-[#262A27] flex items-center justify-center">
          <Icon size={22} className="text-[#2DD4BF]" />
        </div>
        <h2 className="text-sm font-semibold mb-1">{title}</h2>
        {subtitle && <p className="text-xs text-[#6E756F] mb-4">{subtitle}</p>}
        {action}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🏪 STEP 1 — Store onboarding (first login gate)
// ════════════════════════════════════════════════════════════

function StoreOnboarding({ seller, onCreated }) {
  const [storeName, setStoreName] = useState("");
  const [address, setStoreAddress] = useState("");
  const [phone, setPhone] = useState(seller.phone || "");
  const [profilePic, setProfilePic] = useState(null); // { preview, uploading }
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const fileRef = useRef(null);

  async function handlePicChange(file) {
    if (!file) return;
    setProfilePic({ preview: null, uploading: true });
    try {
      const b64 = await fileToResizedBase64(file, 500, 0.8);
      setProfilePic({ preview: b64, uploading: false });
    } catch {
      setProfilePic(null);
      setErrors((e) => ({ ...e, profilePic: "ছবি প্রসেস করা যায়নি" }));
    }
  }

  function validate() {
    const errs = {};
    if (!storeName.trim()) errs.storeName = "স্টোরের নাম দিন";
    if (!phone.trim()) errs.phone = "ফোন নম্বর দিন";
    if (!address.trim()) errs.address = "ঠিকানা দিন";
    if (!profilePic?.preview) errs.profilePic = "প্রোফাইল ছবি আবশ্যক";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setApiError("");
    try {
      const res = await authFetch("/seller/store", {
        method: "POST",
        body: {
          store_name: storeName.trim(),
          phone: phone.trim(),
          profile_image: profilePic.preview,
          address: address.trim(),
        },
      });
      onCreated(res.store);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0B0A] text-[#EDEFEC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#141614] border border-[#262A27] flex items-center justify-center">
            <StoreIcon size={20} className="text-[#2DD4BF]" />
          </div>
          <p className="text-xs font-mono tracking-widest text-[#2DD4BF] uppercase mb-1">
            Welcome, Seller
          </p>
          <h1 className="text-lg font-semibold">আপনার স্টোর তৈরি করুন</h1>
          <p className="text-xs text-[#6E756F] mt-1">
            প্রোডাক্ট যোগ করার আগে একবার স্টোর সেটআপ করতে হবে
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#141614] border border-[#262A27] rounded-xl p-5 space-y-4"
        >
          {apiError && <Banner onClose={() => setApiError("")}>{apiError}</Banner>}

          <div className="flex items-center gap-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePicChange(e.target.files?.[0])}
            />
            {profilePic?.uploading ? (
              <div className="w-14 h-14 rounded-full border border-[#262A27] flex items-center justify-center shrink-0">
                <Loader2 size={16} className="animate-spin text-[#2DD4BF]" />
              </div>
            ) : profilePic?.preview ? (
              <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#262A27] group shrink-0">
                <img src={profilePic.preview} alt="profile" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setProfilePic(null)}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={
                  "w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center shrink-0 transition-colors " +
                  (errors.profilePic
                    ? "border-[#E4645A] text-[#E4645A]"
                    : "border-[#3A403C] text-[#6E756F] hover:border-[#2DD4BF] hover:text-[#2DD4BF]")
                }
              >
                <User size={18} />
              </button>
            )}
            <div className="flex-1">
              <p className="text-xs font-medium text-[#C9CDC7]">
                প্রোফাইল ছবি <span className="text-[#E4645A]">*</span>
              </p>
              <p className="text-[11px] text-[#6E756F]">স্টোরের লোগো বা প্রোফাইল ইমেজ</p>
              {errors.profilePic && (
                <p className="mt-0.5 text-[11px] text-[#E4645A]">{errors.profilePic}</p>
              )}
            </div>
          </div>

          <Field label="স্টোরের নাম" error={errors.storeName} icon={StoreIcon} required>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="যেমন: ONE-SHOP Electronics"
              className={inputClass(errors.storeName)}
            />
          </Field>
             <Field label="address" error={errors.address} icon={StoreIcon} required>
            <input
              value={address}
              onChange={(e) => setStoreAddress(e.target.value)}
              className={inputClass(errors.address)}
            />
          </Field>


          <Field label="ফোন নম্বর" error={errors.phone} icon={Phone} required>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className={inputClass(errors.phone)}
            />
          </Field>

          <Field label="ইমেইল" icon={Mail}>
            <input
              value={seller.email}
              disabled
              className={inputClass(false, true)}
            />
            <p className="mt-1 text-[10px] text-[#4A504B]">
              লগইন ইমেইল — এটা পরিবর্তন করা যাবে না
            </p>
          </Field>

          <button
            type="submit"
            disabled={submitting || profilePic?.uploading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2DD4BF] text-[#0A0B0A] font-semibold py-2.5 hover:bg-[#5EEAD4] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            স্টোর তৈরি করুন
          </button>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ✏️ Edit-store modal (name / phone / profile image — all editable)
// ════════════════════════════════════════════════════════════

function EditStoreModal({ store, onClose, onSaved }) {
  const [storeName, setStoreName] = useState(store.store_name);
  const [phone, setPhone] = useState(store.phone);
  const [address, setAddress] = useState(store.address || "");   // ← নতুন যোগ হলো
  const [profilePic, setProfilePic] = useState({ preview: store.profile_image, uploading: false });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const fileRef = useRef(null);

  async function handlePicChange(file) {
    if (!file) return;
    setProfilePic({ preview: profilePic.preview, uploading: true });
    try {
      const b64 = await fileToResizedBase64(file, 500, 0.8);
      setProfilePic({ preview: b64, uploading: false });
    } catch {
      setProfilePic({ preview: store.profile_image, uploading: false });
      setApiError("ছবি প্রসেস করা যায়নি");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSubmitting(true);
    setApiError("");
    try {
      const res = await authFetch("/seller/store", {
        method: "PUT",
        body: {
          store_name: storeName.trim(),
          phone: phone.trim(),
          address: address.trim(),                              // ← নতুন যোগ হলো
          profile_image:
            profilePic.preview !== store.profile_image ? profilePic.preview : undefined,
        },
      });
      onSaved(res.store);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#141614] border border-[#262A27] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <StoreIcon size={15} className="text-[#2DD4BF]" /> স্টোর এডিট করুন
          </h3>
          <button onClick={onClose} className="text-[#6E756F] hover:text-[#EDEFEC]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {apiError && <Banner onClose={() => setApiError("")}>{apiError}</Banner>}

          <div className="flex items-center gap-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePicChange(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-14 h-14 rounded-full overflow-hidden border border-[#262A27] group shrink-0"
            >
              {profilePic.uploading ? (
                <div className="w-full h-full flex items-center justify-center bg-[#181A18]">
                  <Loader2 size={16} className="animate-spin text-[#2DD4BF]" />
                </div>
              ) : (
                <>
                  <img src={profilePic.preview} alt="profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil size={13} className="text-white" />
                  </div>
                </>
              )}
            </button>
            <p className="text-[11px] text-[#6E756F]">ছবিতে ক্লিক করে বদলান</p>
          </div>

          <Field label="স্টোরের নাম" icon={StoreIcon}>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className={inputClass(false)}
            />
          </Field>

          <Field label="ফোন নম্বর" icon={Phone}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass(false)}
            />
          </Field>

          <Field label="address" icon={StoreIcon}>            {/* ← নতুন যোগ হলো */}
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass(false)}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#262A27] text-[#C9CDC7] py-2 text-xs hover:bg-[#181A18] transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting || profilePic.uploading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#2DD4BF] text-[#0A0B0A] font-semibold py-2 text-xs hover:bg-[#5EEAD4] transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════════════════
// 📦 STEP 2 — Dashboard: add product + product list
// ════════════════════════════════════════════════════════════

function ProductCard({ product, onEdit, onDelete, deleting }) {
  const img = product.thumbnail_img;
  const outOfStock = product.stock_status && product.stock_status !== "available";
  return (
    <div className="bg-[#141614] border border-[#262A27] rounded-lg overflow-hidden group">
      <div className="relative aspect-square bg-[#181A18]">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#3A403C]">
            <ImagePlus size={20} />
          </div>
        )}
        {outOfStock && (
          <span className="absolute top-1.5 left-1.5 text-[9px] bg-[#8A3E37] text-[#F3B3AC] px-1.5 py-0.5 rounded">
            স্টক নেই
          </span>
        )}
        {!!product.discount_percent && (
          <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-[#2DD4BF] text-[#0A0B0A] font-semibold px-1.5 py-0.5 rounded">
            {product.discount_percent}% ছাড়
          </span>
        )}
        <span className="absolute top-1.5 right-1.5 text-[9px] bg-black/60 text-[#9AA39C] px-1.5 py-0.5 rounded font-mono">
          #{product.id}
        </span>

        {/* Hover action overlay — view / edit / delete, প্রতিটা আলাদা বাটন (কোনো bubble/navigation conflict নেই) */}
        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link
            to={`/product/${product.id}`}
            className="w-8 h-8 rounded-full bg-[#141614] border border-[#262A27] flex items-center justify-center text-[#C9CDC7] hover:text-[#2DD4BF] hover:border-[#2DD4BF] transition-colors"
            title="প্রোডাক্ট দেখুন"
          >
            <Eye size={13} />
          </Link>
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="w-8 h-8 rounded-full bg-[#141614] border border-[#262A27] flex items-center justify-center text-[#C9CDC7] hover:text-[#2DD4BF] hover:border-[#2DD4BF] transition-colors"
            title="এডিট করুন"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            disabled={deleting}
            className="w-8 h-8 rounded-full bg-[#141614] border border-[#262A27] flex items-center justify-center text-[#C9CDC7] hover:text-[#E4645A] hover:border-[#8A3E37] transition-colors disabled:opacity-50"
            title="ডিলিট করুন"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
      <div className="p-2.5 space-y-1">
        <p className="text-xs font-medium text-[#EDEFEC] truncate">{product.name}</p>
        <p className="text-[10px] text-[#6E756F] truncate">{product.category}</p>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-xs font-semibold text-[#2DD4BF]">৳{product.sale_price}</span>
          {product.price > product.sale_price && (
            <span className="text-[10px] text-[#6E756F] line-through">৳{product.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ product, onCancel, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="w-full max-w-xs bg-[#141614] border border-[#262A27] rounded-xl p-5 text-center">
        <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-[#2A1614] border border-[#8A3E37] flex items-center justify-center">
          <Trash2 size={16} className="text-[#E4645A]" />
        </div>
        <h3 className="text-sm font-semibold mb-1">প্রোডাক্ট ডিলিট করবে?</h3>
        <p className="text-xs text-[#6E756F] mb-4">
          "{product.name}" স্থায়ীভাবে মুছে যাবে, এটা আর ফিরিয়ে আনা যাবে না।
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-lg border border-[#262A27] text-[#C9CDC7] py-2 text-xs hover:bg-[#181A18] transition-colors disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#8A3E37] text-[#F3B3AC] font-semibold py-2 text-xs hover:bg-[#A34A41] transition-colors disabled:opacity-60"
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            ডিলিট করুন
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProductModal({ product, onClose, onSaved }) {
  const [name, setName] = useState(product.name || "");
  const [category, setCategory] = useState(product.category || "");
  const [details, setDetails] = useState(product.details || "");
  const [stockStatus, setStockStatus] = useState(product.stock_status || "available");
  const [priceMode, setPriceMode] = useState(product.discount_percent ? "percent" : "direct");
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [discountPercent, setDiscountPercent] = useState(
    product.discount_percent ? String(product.discount_percent) : ""
  );
  const [directSalePrice, setDirectSalePrice] = useState(String(product.sale_price ?? ""));
  const [images, setImages] = useState(
    (product.product_images?.length
      ? product.product_images.map((pi) => ({ preview: pi.product_image, uploading: false }))
      : [{ preview: product.thumbnail_img, uploading: false }])
  );
  const [imagesDirty, setImagesDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const fileRefs = useRef([]);

  const numericPrice = parseFloat(price) || 0;
  const numericDiscount = parseFloat(discountPercent) || 0;
  const computedSalePrice =
    priceMode === "percent"
      ? Math.round(numericPrice - (numericPrice * numericDiscount) / 100)
      : parseFloat(directSalePrice) || 0;

  async function handleImagePick(index, file) {
    if (!file) return;
    setImages((prev) => {
      const next = [...prev];
      next[index] = { preview: null, uploading: true };
      return next;
    });
    try {
      const b64 = await fileToResizedBase64(file, 1000, 0.78);
      setImages((prev) => {
        const next = [...prev];
        next[index] = { preview: b64, uploading: false };
        return next;
      });
      setImagesDirty(true);
    } catch {
      setImages((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      setErrors((e) => ({ ...e, images: "একটা ছবি প্রসেস করা যায়নি" }));
    }
  }

  function removeImage(index) {
    setImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setImagesDirty(true);
    if (fileRefs.current[index]) fileRefs.current[index].value = "";
  }

  function addImageSlot() {
    setImages((prev) => (prev.length >= MAX_PRODUCT_IMAGES ? prev : [...prev, null]));
  }

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = "প্রোডাক্টের নাম দিন";
    if (!category.trim()) errs.category = "ক্যাটাগরি দিন";
    if (!numericPrice) errs.price = "মূল্য দিন";
    if (priceMode === "direct" && !directSalePrice) errs.directSalePrice = "সেল প্রাইস দিন";
    if (priceMode === "percent" && discountPercent === "") errs.discountPercent = "ডিসকাউন্ট % দিন";
    if (!details.trim()) errs.details = "বিস্তারিত লিখুন";
    const readyImages = images.filter((i) => i?.preview);
    if (readyImages.length === 0) errs.images = "কমপক্ষে একটা ছবি দিন";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setApiError("");
    try {
      const body = {
        name: name.trim(),
        category: category.trim(),
        price: numericPrice,
        sale_price: computedSalePrice,
        discount_percent: priceMode === "percent" ? numericDiscount : null,
        details: details.trim(),
        stock_status: stockStatus,
      };
      if (imagesDirty) {
        body.images = images.filter((i) => i?.preview).map((i) => i.preview);
      }
      const res = await authFetch(`/seller/product/${product.id}`, { method: "PUT", body });
      onSaved(res.product);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-md bg-[#141614] border border-[#262A27] rounded-xl p-5 my-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Pencil size={15} className="text-[#2DD4BF]" /> প্রোডাক্ট এডিট করুন
          </h3>
          <button onClick={onClose} className="text-[#6E756F] hover:text-[#EDEFEC]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && <Banner onClose={() => setApiError("")}>{apiError}</Banner>}

          <Field label="প্রোডাক্টের নাম" error={errors.name}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass(errors.name)} />
          </Field>

          <Field label="ক্যাটাগরি" error={errors.category}>
            <input
              list="category-options"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="লিস্ট থেকে বেছে নিন অথবা নতুন লিখুন"
              className={inputClass(errors.category)}
            />
            <datalist id="category-options">
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <div className="bg-[#181A18] p-3.5 rounded-lg border border-[#262A27]/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#C9CDC7]">মূল্য নির্ধারণ</label>
              <div className="flex rounded-md bg-[#101211] p-0.5 text-[11px]">
                <button type="button" onClick={() => setPriceMode("percent")} className={pillClass(priceMode === "percent")}>
                  <Percent size={11} /> % ডিসকাউন্ট
                </button>
                <button type="button" onClick={() => setPriceMode("direct")} className={pillClass(priceMode === "direct")}>
                  <Tag size={11} /> সরাসরি প্রাইস
                </button>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-[#6E756F]">মূল্য হলো আপনার চাওয়া দাম, সেল প্রাইস হলো আপনি যেই দামে সেল দেবেন</p>
              <p className="text-[9px] text-[#6E756F]">যেমন মূল্য ২০০, সেল প্রাইস ১৫০</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="মূল্য (৳)" error={errors.price}>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass(errors.price)} />
              </Field>
              {priceMode === "percent" ? (
                <Field label="ডিসকাউন্ট (%)" error={errors.discountPercent}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className={inputClass(errors.discountPercent)}
                  />
                </Field>
              ) : (
                <Field label="সেল প্রাইস (৳)" error={errors.directSalePrice}>
                  <input
                    type="number"
                    min="0"
                    value={directSalePrice}
                    onChange={(e) => setDirectSalePrice(e.target.value)}
                    className={inputClass(errors.directSalePrice)}
                  />
                </Field>
              )}
            </div>
            <p className="text-[11px] font-mono text-[#6E756F]">
              বিক্রয় মূল্য: <span className="text-[#2DD4BF] font-semibold">৳{Number.isFinite(computedSalePrice) ? computedSalePrice : 0}</span>
            </p>
          </div>

          <Field label="বিস্তারিত" error={errors.details}>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className={inputClass(errors.details) + " resize-none"}
            />
          </Field>

          <div>
            <label className="text-xs font-medium text-[#C9CDC7] mb-1.5 block">স্টক স্ট্যাটাস</label>
            <div className="flex rounded-md bg-[#101211] p-0.5 text-[11px] w-fit">
              <button
                type="button"
                onClick={() => setStockStatus("available")}
                className={pillClass(stockStatus === "available")}
              >
                <PackageCheck size={12} /> আছে
              </button>
              <button
                type="button"
                onClick={() => setStockStatus("out_of_stock")}
                className={pillClass(stockStatus === "out_of_stock")}
              >
                <PackageX size={12} /> নেই
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#C9CDC7]">প্রোডাক্ট ছবি</label>
              <span className="text-[10px] text-[#6E756F] font-mono">
                {images.filter((i) => i?.preview).length}/{MAX_PRODUCT_IMAGES}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i}>
                  <input
                    ref={(el) => (fileRefs.current[i] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImagePick(i, e.target.files?.[0])}
                  />
                  {img?.uploading ? (
                    <div className="h-16 rounded-lg border border-[#262A27] bg-[#181A18] flex items-center justify-center">
                      <Loader2 size={13} className="animate-spin text-[#2DD4BF]" />
                    </div>
                  ) : img?.preview ? (
                    <div className="relative h-16 rounded-lg overflow-hidden border border-[#262A27] group">
                      <img src={img.preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 hover:bg-black"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRefs.current[i]?.click()}
                      className="w-full h-16 rounded-lg border border-dashed border-[#3A403C] flex items-center justify-center text-[#6E756F] hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors"
                    >
                      <ImagePlus size={14} />
                    </button>
                  )}
                </div>
              ))}
              {images.length < MAX_PRODUCT_IMAGES && (
                <button
                  type="button"
                  onClick={addImageSlot}
                  className="h-16 rounded-lg border border-dashed border-[#262A27] flex items-center justify-center text-[#4A504B] hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            {errors.images && <p className="mt-1 text-[11px] text-[#E4645A]">{errors.images}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-[#262A27] text-[#C9CDC7] py-2 text-xs hover:bg-[#181A18] transition-colors disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#2DD4BF] text-[#0A0B0A] font-semibold py-2 text-xs hover:bg-[#5EEAD4] transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-[#141614] border border-[#262A27] rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-[#181A18]" />
      <div className="p-2.5 space-y-2">
        <div className="h-2.5 bg-[#181A18] rounded w-3/4" />
        <div className="h-2 bg-[#181A18] rounded w-1/2" />
        <div className="h-2.5 bg-[#181A18] rounded w-1/3" />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🚚 Order Status — সেলারের নিজের প্রোডাক্টের অর্ডার + real Paperfly status
// ════════════════════════════════════════════════════════════
//
// ⚠️ CHANGED: আগে এখানে "pending" ছিল না — এখন order create হলে প্রথমে
// "pending_confirmation" status-এ থাকে (admin এখনো Paperfly-তে বুক করেনি),
// admin confirm করলে "processing" হয়ে যায়, তারপর Paperfly-এর আসল ডেলিভারি
// progress অনুযায়ী in_transit → delivered/returned/cancelled ইত্যাদি হয়।

const ORDER_STATUS_META = {
  pending_confirmation: { label: "কনফার্ম বাকি", dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-500/30", icon: Clock },
  processing: { label: "প্রসেসিং", dot: "bg-cyan-400", text: "text-cyan-400", bg: "bg-cyan-950/30", border: "border-cyan-500/30", icon: Clock },
  in_transit: { label: "পথে আছে", dot: "bg-blue-400", text: "text-blue-400", bg: "bg-blue-950/30", border: "border-blue-500/30", icon: Truck },
  delivered: { label: "ডেলিভারি হয়েছে", dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-500/30", icon: PackageCheck },
  partial_delivered: { label: "আংশিক ডেলিভারি", dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-500/30", icon: AlertCircle },
  returned: { label: "রিটার্ন হয়েছে", dot: "bg-orange-400", text: "text-orange-400", bg: "bg-orange-950/30", border: "border-orange-500/30", icon: PackageX },
  cancelled: { label: "বাতিল হয়েছে", dot: "bg-red-400", text: "text-red-400", bg: "bg-red-950/30", border: "border-red-500/30", icon: X },
  unknown: { label: "প্রসেসিং", dot: "bg-gray-500", text: "text-gray-400", bg: "bg-gray-800/40", border: "border-gray-700", icon: Clock },
};

// ════════════════════════════════════════════════════════════
// 📊 Order Status Summary — কয়টা delivered / return / in_transit ইত্যাদি
// (seller-এর নিজের product-এর অর্ডার, backend-এই email verify হয়)
// ════════════════════════════════════════════════════════════

const SUMMARY_ORDER = ["pending_confirmation", "processing", "in_transit", "delivered", "partial_delivered", "returned", "cancelled"];

function OrderStatusSummary({ activeStatus, onSelectStatus }) {
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/seller/order-status-summary");
      setSummary(res.summary);
      setTotal(res.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[#141614] border border-[#262A27] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4">
        <Banner onClose={() => setError("")}>{error}</Banner>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="mb-4">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {/* "সব" কার্ড — filter clear করে */}
        <button
          type="button"
          onClick={() => onSelectStatus(null)}
          className={
            "rounded-xl border p-2.5 text-left transition-colors " +
            (activeStatus === null
              ? "bg-[#2DD4BF]/10 border-[#2DD4BF]"
              : "bg-[#141614] border-[#262A27] hover:border-[#3A403C]")
          }
        >
          <p className="text-[10px] text-[#6E756F] mb-1">সব অর্ডার</p>
          <p className="text-base font-semibold text-[#EDEFEC] font-mono">{total}</p>
        </button>

        {SUMMARY_ORDER.map((key) => {
          const meta = ORDER_STATUS_META[key];
          const Icon = meta.icon;
          const active = activeStatus === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectStatus(key)}
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
    </div>
  );
}

// order._id দিয়ে Paperfly-এর আসল delivery status আনে
// ⚠️ CHANGED: আগে /courier/steadfast/status/${orderId} কল হতো,
// এখন Paperfly-এর status endpoint কল হয় — response shape একই
// ({ success, status }) তাই বাকি কম্পোনেন্টে কোনো change লাগেনি।
function OrderStatusBadge({ orderId }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/courier/paperfly/status/${orderId}`, {
      headers: { "x-api-key": API_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setStatus(data?.success ? data.status : "unknown");
      })
      .catch(() => {
        if (!cancelled) setStatus("unknown");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-800/40 border border-gray-700 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
        লোড হচ্ছে
      </span>
    );
  }

  const meta = ORDER_STATUS_META[status] || ORDER_STATUS_META.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${meta.bg} border ${meta.border} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// mongo ObjectId থেকে created time বের করে — order doc-এ আলাদা timestamp ফিল্ড না থাকলেও কাজ করে
function orderDateFromId(id) {
  try {
    const ts = parseInt(String(id).slice(0, 8), 16) * 1000;
    return new Date(ts).toLocaleString("bn-BD", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false);
  const buyerPhone = order.phone || order.contact_number || order.phonenumber || null;
  const orderDate = orderDateFromId(order._id);

  return (
    <div className="bg-[#141614] border border-[#262A27] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div className="w-12 h-12 shrink-0 rounded-lg bg-[#181A18] border border-[#262A27] overflow-hidden flex items-center justify-center">
          {order.image ? (
            <img src={order.image} alt={order.title || order.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={16} className="text-[#3A403C]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#EDEFEC] truncate">{order.title || order.name || "Product"}</p>
          <p className="text-[10px] text-[#6E756F] truncate">
            {order.email || "buyer"} • ৳{order.price} × {order.quantity || 1}
            {orderDate && <span className="text-[#4A504B]"> • {orderDate}</span>}
          </p>
        </div>
        <OrderStatusBadge orderId={order._id} />
      </button>

      {expanded && (
        <div className="border-t border-[#262A27] px-3 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <DetailLine label="Order ID" value={order._id} mono />
          <DetailLine label="ক্রেতার নাম" value={order.name} />
          <DetailLine label="ইমেইল" value={order.email} />
          <DetailLine label="ফোন" value={buyerPhone} mono />
          <DetailLine label="ঠিকানা" value={order.address} span2 />
          <DetailLine label="ক্যাটাগরি" value={order.category} />
          <DetailLine label="সাইজ" value={order.size} />
          <DetailLine label="মোট মূল্য" value={order.price != null ? `৳${(order.price * (order.quantity || 1)).toFixed(2)}` : null} />
          {order.note && <DetailLine label="নোট" value={order.note} span2 />}
          {order.paperfly_tracking_number && (
            <DetailLine label="Paperfly Tracking" value={order.paperfly_tracking_number} mono />
          )}
          {order.pickup_store_name && (
            <DetailLine label="Pickup স্টোর" value={order.pickup_store_name} />
          )}
        </div>
      )}
    </div>
  );
}

function DetailLine({ label, value, mono, span2 }) {
  if (!value) return null;
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <span className="text-[#6E756F]">{label}: </span>
      <span className={"text-[#C9CDC7] " + (mono ? "font-mono" : "")}>{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 💰 Seller Earnings — নিজের delivered order থেকে মোট বিক্রি + ৫% কমিশন
// কাটার পর নিট প্রাপ্য — শুধু "delivered" ফিল্টার সিলেক্ট করা থাকলে দেখায়
// ════════════════════════════════════════════════════════════

function formatTaka(n) {
  return `৳${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

function SellerEarningsSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await authFetch("/seller/delivered-summary");
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="h-20 rounded-xl bg-[#141614] border border-[#262A27] animate-pulse mb-3" />;
  }
  if (error) {
    return (
      <div className="mb-3">
        <Banner onClose={() => setError("")}>{error}</Banner>
      </div>
    );
  }
  if (!data) return null;

  const commissionPct = Math.round((data.commissionRate || 0.05) * 100);

  return (
    <div className="bg-[#141614] border border-[#262A27] rounded-xl p-4 mb-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#2DD4BF] uppercase tracking-wider mb-3">
        <Wallet size={14} />
        <span>আপনার আয়ের হিসাব ({data.totalOrders} টা ডেলিভারি হওয়া অর্ডার)</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-[#6E756F] mb-1">মোট বিক্রি (Original)</p>
          <p className="text-sm font-semibold text-[#EDEFEC] font-mono">{formatTaka(data.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#6E756F] mb-1">প্ল্যাটফর্ম কমিশন ({commissionPct}%)</p>
          <p className="text-sm font-semibold text-[#E4645A] font-mono">- {formatTaka(data.platformProfit)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#6E756F] mb-1">আপনার প্রাপ্য</p>
          <p className="text-sm font-semibold text-[#2DD4BF] font-mono">{formatTaka(data.sellerPayout)}</p>
        </div>
      </div>
    </div>
  );
}

function OrderStatusPanel() {
  const [activeStatus, setActiveStatus] = useState(null); // null = সব
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (pageNum, append, status) => {
    setLoading(true);
    setError("");
    try {
      const path = status
        ? `/seller/orders-by-status?status=${encodeURIComponent(status)}&page=${pageNum}&limit=10`
        : `/seller/my-orders?page=${pageNum}&limit=10`;
      const res = await authFetch(path);
      setOrders((prev) => (append ? [...prev, ...res.orders] : res.orders));
      setTotal(res.total);
      setHasMore(res.hasMore);
      setPage(res.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, false, activeStatus);
  }, [load, activeStatus]);

  function handleSelectStatus(status) {
    setActiveStatus(status);
  }

  return (
    <div>
      {/* শুধু "delivered" ফিল্টার সিলেক্ট করা থাকলেই আয়ের হিসাব দেখানো হয় —
          কারণ শুধু delivered order-এই আসলে টাকা এসেছে (pending/processing না) */}
      {activeStatus === "delivered" && <SellerEarningsSummary />}

      <OrderStatusSummary activeStatus={activeStatus} onSelectStatus={handleSelectStatus} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2DD4BF] uppercase tracking-wider">
          <Truck size={15} />
          <span>
            {activeStatus ? ORDER_STATUS_META[activeStatus]?.label : "অর্ডার স্ট্যাটাস"}
            {total > 0 && ` (${total})`}
          </span>
        </div>
        <button
          onClick={() => load(1, false, activeStatus)}
          disabled={loading}
          className="text-[#6E756F] hover:text-[#2DD4BF] transition-colors disabled:opacity-50"
          title="রিফ্রেশ"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <Banner onClose={() => setError("")}>{error}</Banner>}

      {orders.length === 0 && !loading && !error ? (
        <div className="bg-[#141614] border border-dashed border-[#262A27] rounded-xl p-10 text-center">
          <Truck size={22} className="mx-auto mb-2 text-[#3A403C]" />
          <p className="text-xs text-[#6E756F]">
            {activeStatus ? "এই স্ট্যাটাসে কোনো অর্ডার নেই" : "এখনো কোনো অর্ডার আসেনি"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {orders.map((o) => (
              <OrderRow key={o._id} order={o} />
            ))}
            {loading &&
              Array.from({ length: orders.length === 0 ? 4 : 2 }).map((_, i) => (
                <div key={`sk-${i}`} className="h-[60px] rounded-xl bg-[#141614] border border-[#262A27] animate-pulse" />
              ))}
          </div>

          {hasMore && !loading && (
            <button
              onClick={() => load(page + 1, true, activeStatus)}
              className="w-full mt-3 rounded-lg border border-[#262A27] py-2 text-xs text-[#C9CDC7] hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors"
            >
              আরও দেখুন
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Dashboard({ seller, store, onStoreUpdated }) {
  // ── top-level tab: প্রোডাক্ট ম্যানেজমেন্ট vs অর্ডার স্ট্যাটাস ──────────
  const [tab, setTab] = useState("products"); // "products" | "orders"

  // ── product list ──────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const loadProducts = useCallback(async (pageNum, append) => {
    setListLoading(true);
    setListError("");
    try {
      const res = await authFetch(`/seller/my-products?page=${pageNum}&limit=12`);
      setProducts((prev) => (append ? [...prev, ...res.products] : res.products));
      setTotal(res.total);
      setHasMore(res.hasMore);
      setPage(res.page);
    } catch (err) {
      setListError(err.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(1, false);
  }, [loadProducts]);

  // ── edit store modal ──────────────────────────────────────
  const [editing, setEditing] = useState(false);

  // ── edit / delete product ─────────────────────────────────
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function handleProductEdited(updated) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditProduct(null);
  }

  async function confirmDeleteProduct() {
    if (!deleteProduct) return;
    setDeletingId(deleteProduct.id);
    setDeleteError("");
    try {
      await authFetch(`/seller/product/${deleteProduct.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteProduct(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // ── add product form ──────────────────────────────────────
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [priceMode, setPriceMode] = useState("percent");
  const [price, setPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [directSalePrice, setDirectSalePrice] = useState("");
  const [images, setImages] = useState([null]); // [{preview, uploading} | null]
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [justAdded, setJustAdded] = useState(null);
  const fileRefs = useRef([]);

  const numericPrice = parseFloat(price) || 0;
  const numericDiscount = parseFloat(discountPercent) || 0;
  const computedSalePrice =
    priceMode === "percent"
      ? Math.round(numericPrice - (numericPrice * numericDiscount) / 100)
      : parseFloat(directSalePrice) || 0;

  async function handleImagePick(index, file) {
    if (!file) return;
    setImages((prev) => {
      const next = [...prev];
      next[index] = { preview: null, uploading: true };
      return next;
    });
    try {
      const b64 = await fileToResizedBase64(file, 1000, 0.78);
      setImages((prev) => {
        const next = [...prev];
        next[index] = { preview: b64, uploading: false };
        return next;
      });
    } catch {
      setImages((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      setErrors((e) => ({ ...e, images: "একটা ছবি প্রসেস করা যায়নি" }));
    }
  }

  function removeImage(index) {
    setImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    if (fileRefs.current[index]) fileRefs.current[index].value = "";
  }

  function addImageSlot() {
    setImages((prev) => (prev.length >= MAX_PRODUCT_IMAGES ? prev : [...prev, null]));
  }

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = "প্রোডাক্টের নাম দিন";
    if (!category.trim()) errs.category = "ক্যাটাগরি দিন";
    if (!numericPrice) errs.price = "মূল্য দিন";
    if (priceMode === "direct" && !directSalePrice) errs.directSalePrice = "সেল প্রাইস দিন";
    if (priceMode === "percent" && discountPercent === "") errs.discountPercent = "ডিসকাউন্ট % দিন";
    if (!details.trim()) errs.details = "বিস্তারিত লিখুন";
    const readyImages = images.filter((i) => i?.preview);
    if (readyImages.length === 0) errs.images = "কমপক্ষে একটা ছবি দিন";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setApiError("");
    try {
      const res = await authFetch("/seller/add-product", {
        method: "POST",
        body: {
          name: name.trim(),
          category: category.trim(),
          price: numericPrice,
          sale_price: computedSalePrice,
          discount_percent: priceMode === "percent" ? numericDiscount : null,
          details: details.trim(),
          images: images.filter((i) => i?.preview).map((i) => i.preview),
        },
      });
      setJustAdded(res.product);
      setProducts((prev) => [res.product, ...prev]);
      setTotal((t) => t + 1);
      resetForm();
      setTimeout(() => setJustAdded(null), 3500);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName("");
    setCategory("");
    setDetails("");
    setPrice("");
    setDiscountPercent("");
    setDirectSalePrice("");
    setImages([null]);
    setErrors({});
    fileRefs.current.forEach((r) => r && (r.value = ""));
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0B0A] text-[#EDEFEC]">
      {editing && (
        <EditStoreModal
          store={store}
          onClose={() => setEditing(false)}
          onSaved={(s) => {
            onStoreUpdated(s);
            setEditing(false);
          }}
        />
      )}

      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={handleProductEdited}
        />
      )}

      {deleteProduct && (
        <ConfirmDeleteModal
          product={deleteProduct}
          deleting={deletingId === deleteProduct.id}
          onCancel={() => setDeleteProduct(null)}
          onConfirm={confirmDeleteProduct}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Store header bar */}
        <div className="mb-6 flex items-center justify-between border-b border-[#262A27] pb-4">
          <div className="flex items-center gap-3">
            <img
              src={store.profile_image}
              alt={store.store_name}
              className="w-11 h-11 rounded-full object-cover border border-[#262A27]"
            />
            <div>
              <p className="text-xs font-mono tracking-widest text-[#2DD4BF] uppercase mb-0.5">
                Seller Dashboard
              </p>
              <h1 className="text-base font-semibold leading-tight">{store.store_name}</h1>
              <p className="text-[11px] text-[#6E756F] font-mono">{store.phone}</p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#262A27] px-3 py-1.5 text-xs text-[#C9CDC7] hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors"
          >
            <Pencil size={12} /> স্টোর এডিট
          </button>
        </div>

        {/* Tabs: প্রোডাক্ট / অর্ডার স্ট্যাটাস */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("products")}
            className={
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors " +
              (tab === "products"
                ? "bg-[#2DD4BF] text-[#0A0B0A]"
                : "bg-[#141614] text-[#9AA39C] border border-[#262A27] hover:border-[#3A403C]")
            }
          >
            <Package size={13} /> প্রোডাক্ট
          </button>
          <button
            onClick={() => setTab("orders")}
            className={
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors " +
              (tab === "orders"
                ? "bg-[#2DD4BF] text-[#0A0B0A]"
                : "bg-[#141614] text-[#9AA39C] border border-[#262A27] hover:border-[#3A403C]")
            }
          >
            <Truck size={13} /> অর্ডার স্ট্যাটাস
          </button>
        </div>

        {tab === "orders" ? (
          <OrderStatusPanel />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Add product form */}
            <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-5">
              <div className="bg-[#141614] border border-[#262A27] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2DD4BF] uppercase tracking-wider border-b border-[#262A27] pb-2.5">
                  <Package size={15} />
                  <span>নতুন প্রোডাক্ট যোগ করুন</span>
                </div>

                {apiError && <Banner onClose={() => setApiError("")}>{apiError}</Banner>}
                {justAdded && (
                  <Banner tone="success" onClose={() => setJustAdded(null)}>
                    "{justAdded.name}" যুক্ত হয়েছে — ID #{justAdded.id}
                  </Banner>
                )}

                <Field label="প্রোডাক্টের নাম" error={errors.name} required>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: X-01 Separator"
                    className={inputClass(errors.name)}
                  />
                </Field>

                <Field label="ক্যাটাগরি" error={errors.category} required>
                  <input
                    list="category-options"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="যেমন: Gadgets — লিস্ট থেকে বেছে নিন অথবা নতুন লিখুন"
                    className={inputClass(errors.category)}
                  />
                  <datalist id="category-options">
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>

                <div className="bg-[#181A18] p-3.5 rounded-lg border border-[#262A27]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#C9CDC7]">মূল্য নির্ধারণ</label>
                    <div className="flex rounded-md bg-[#101211] p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPriceMode("percent")}
                        className={pillClass(priceMode === "percent")}
                      >
                        <Percent size={11} /> % ডিসকাউন্ট
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceMode("direct")}
                        className={pillClass(priceMode === "direct")}
                      >
                        <Tag size={11} /> সরাসরি প্রাইস
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#6E756F]">মূল্য হলো আপনার চাওয়া দাম, সেল প্রাইস হলো আপনি যেই দামে সেল দেবেন</p>
                    <p className="text-[9px] text-[#6E756F]">যেমন মূল্য ২০০, সেল প্রাইস ১৫০</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="মূল্য (৳)" error={errors.price}>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="300"
                        className={inputClass(errors.price)}
                      />
                    </Field>

                    {priceMode === "percent" ? (
                      <Field label="ডিসকাউন্ট (%)" error={errors.discountPercent}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          placeholder="10"
                          className={inputClass(errors.discountPercent)}
                        />
                      </Field>
                    ) : (
                      <Field label="সেল প্রাইস (৳)" error={errors.directSalePrice}>
                        <input
                          type="number"
                          min="0"
                          value={directSalePrice}
                          onChange={(e) => setDirectSalePrice(e.target.value)}
                          placeholder="270"
                          className={inputClass(errors.directSalePrice)}
                        />
                      </Field>
                    )}
                  </div>

                  <p className="text-[11px] font-mono text-[#6E756F]">
                    বিক্রয় মূল্য (sale_price):{" "}
                    <span className="text-[#2DD4BF] font-semibold">
                      ৳{Number.isFinite(computedSalePrice) ? computedSalePrice : 0}
                    </span>
                  </p>
                </div>

                <Field label="বিস্তারিত" error={errors.details} required>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    placeholder="প্রোডাক্টের বিস্তারিত বিবরণ লিখুন..."
                    className={inputClass(errors.details) + " resize-none"}
                  />
                </Field>

                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-[#C9CDC7]">
                      প্রোডাক্ট ছবি <span className="text-[#E4645A]">*</span>
                    </label>
                    <span className="text-[10px] text-[#6E756F] font-mono">
                      {images.filter((i) => i?.preview).length}/{MAX_PRODUCT_IMAGES}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <div key={i}>
                        <input
                          ref={(el) => (fileRefs.current[i] = el)}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImagePick(i, e.target.files?.[0])}
                        />
                        {img?.uploading ? (
                          <div className="h-20 rounded-lg border border-[#262A27] bg-[#181A18] flex items-center justify-center">
                            <Loader2 size={15} className="animate-spin text-[#2DD4BF]" />
                          </div>
                        ) : img?.preview ? (
                          <div className="relative h-20 rounded-lg overflow-hidden border border-[#262A27] group">
                            <img src={img.preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileRefs.current[i]?.click()}
                            className="w-full h-20 rounded-lg border border-dashed border-[#3A403C] flex flex-col items-center justify-center gap-1 text-[#6E756F] hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors"
                          >
                            <ImagePlus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {images.length < MAX_PRODUCT_IMAGES && (
                      <button
                        type="button"
                        onClick={addImageSlot}
                        className="h-20 rounded-lg border border-dashed border-[#262A27] flex flex-col items-center justify-center gap-1 text-[#4A504B] hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors"
                      >
                        <Plus size={16} />
                        <span className="text-[9px]">যোগ করুন</span>
                      </button>
                    )}
                  </div>
                  {errors.images && <p className="mt-1 text-[11px] text-[#E4645A]">{errors.images}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2DD4BF] text-[#0A0B0A] font-semibold py-2.5 hover:bg-[#5EEAD4] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                প্রোডাক্ট সাবমিট করুন
              </button>
            </form>

            {/* RIGHT: product list */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2DD4BF] uppercase tracking-wider">
                  <ShoppingBag size={15} />
                  <span>আপনার প্রোডাক্ট {total > 0 && `(${total})`}</span>
                </div>
                <button
                  onClick={() => loadProducts(1, false)}
                  disabled={listLoading}
                  className="text-[#6E756F] hover:text-[#2DD4BF] transition-colors disabled:opacity-50"
                  title="রিফ্রেশ"
                >
                  <RefreshCw size={13} className={listLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {listError && <Banner onClose={() => setListError("")}>{listError}</Banner>}
              {deleteError && <Banner onClose={() => setDeleteError("")}>{deleteError}</Banner>}

              {products.length === 0 && !listLoading && !listError ? (
                <div className="bg-[#141614] border border-dashed border-[#262A27] rounded-xl p-10 text-center">
                  <Package size={22} className="mx-auto mb-2 text-[#3A403C]" />
                  <p className="text-xs text-[#6E756F]">এখনো কোনো প্রোডাক্ট যোগ করা হয়নি</p>
                  <p className="text-[11px] text-[#4A504B] mt-1">বাম পাশের ফর্ম দিয়ে প্রথম প্রোডাক্টটি যোগ করুন</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.map((p) => (
                      <ProductCard
                        key={p._id || p.id}
                        product={p}
                        onEdit={setEditProduct}
                        onDelete={setDeleteProduct}
                        deleting={deletingId === p.id}
                      />
                    ))}
                    {listLoading &&
                      Array.from({ length: products.length === 0 ? 6 : 3 }).map((_, i) => (
                        <ProductCardSkeleton key={`sk-${i}`} />
                      ))}
                  </div>

                  {hasMore && !listLoading && (
                    <button
                      onClick={() => loadProducts(page + 1, true)}
                      className="w-full mt-4 rounded-lg border border-[#262A27] py-2 text-xs text-[#C9CDC7] hover:border-[#2DD4BF] hover:text-[#2DD4BF] transition-colors"
                    >
                      আরও দেখুন
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🚪 Root — decides which phase to show
// ════════════════════════════════════════════════════════════

export default function SellerPanel() {
  const [phase, setPhase] = useState("loading"); // loading | no-token | error | need-store | dashboard
  const [seller, setSeller] = useState(null);
  const [store, setStore] = useState(null);
  const [loadError, setLoadError] = useState("");

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem("sellerToken");
    if (!token) {
      setPhase("no-token");
      return;
    }
    setPhase("loading");
    try {
      const [verifyRes, storeRes] = await Promise.all([
        authFetch("/seller/verify-token"),
        authFetch("/seller/store"),
      ]);
      setSeller(verifyRes.seller);
      if (storeRes.exists) {
        setStore(storeRes.store);
        setPhase("dashboard");
      } else {
        setPhase("need-store");
      }
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem("sellerToken");
        setPhase("no-token");
      } else {
        setLoadError(err.message);
        setPhase("error");
      }
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (phase === "loading") {
    return (
      <FullScreenState
        icon={Loader2}
        title="লোড হচ্ছে..."
        subtitle="আপনার সেলার তথ্য নিয়ে আসা হচ্ছে"
      />
    );
  }

  if (phase === "no-token") {
    return (
      <FullScreenState
        icon={StoreIcon}
        title="লগইন প্রয়োজন"
        subtitle="সেলার প্যানেল দেখতে আগে লগইন করুন"
      />
    );
  }

  if (phase === "error") {
    return (
      <FullScreenState
        icon={AlertCircle}
        title="লোড করা যায়নি"
        subtitle={loadError}
        action={
          <button
            onClick={bootstrap}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2DD4BF] text-[#0A0B0A] font-semibold px-4 py-2 text-xs hover:bg-[#5EEAD4] transition-colors"
          >
            <RefreshCw size={13} /> আবার চেষ্টা করুন
          </button>
        }
      />
    );
  }

  if (phase === "need-store") {
    return (
      <StoreOnboarding
        seller={seller}
        onCreated={(s) => {
          setStore(s);
          setPhase("dashboard");
        }}
      />
    );
  }

  return <Dashboard seller={seller} store={store} onStoreUpdated={setStore} />;
}