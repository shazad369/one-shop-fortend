import { memo, useState, useEffect, useRef } from "react";
import { ShoppingCart, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../App";

export interface Product {
  id: number;
  _id: string;
  name: string;
  title: string;
  price: number;
  sale_price: number;
  details: string;
  description: string;
  category: string;
  thumbnail_img: string;
  image: string;
  product_images: { image: string }[];
  product_variants: any[];
  product_code: number;
  slug: string;
  status: string;
  stock_status: string;
  rating?: { rate: number; count: number };
  reviews?: { email: string; comment: string }[];
}

interface Props {
  product: Product;
  index?: number;
}

// ─── GLOBAL IMAGE CACHE (session-wide, সব card শেয়ার করে) ────────────────────
// key: original url → value: "loaded" | "error" | objectURL
const imgCache = new Map<string, "loaded" | "error">();

function optimizeImage(url: string): string {
  if (!url) return url;
  const CLOUD = "dittlxqip";
  // above-fold এর জন্য আলাদা params নেই — সব same URL যাতে browser cache hit করে
  const params = "w_300,h_300,c_fit,f_auto,q_70";
  return `https://res.cloudinary.com/${CLOUD}/image/fetch/${params}/${encodeURIComponent(url)}`;
}

const shimmerStyle = `
  @keyframes pc-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

export default memo(function ProductCard({ product, index = 99 }: Props) {
  const { dark } = useTheme();
  const isAboveFold = index < 8; // একটু বেশি রাখলাম

  const rawSrc = product.thumbnail_img || product.image;
  const imgSrc = optimizeImage(rawSrc);

  // cache থেকে initial state নাও — already loaded হলে shimmer skip
  const cached = imgCache.get(imgSrc);
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">(
    cached === "loaded" ? "loaded" : cached === "error" ? "error" : "loading"
  );

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (cached) return; // cache hit — কিছু করার নেই

    // above-fold: preload via JS Image (browser cache তে রাখে)
    if (isAboveFold) {
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        imgCache.set(imgSrc, "loaded");
        setImgState("loaded");
      };
      img.onerror = () => {
        imgCache.set(imgSrc, "error");
        setImgState("error");
      };
    }
  }, [imgSrc, isAboveFold, cached]);

  // ─── Inflated Price System ────────────────────────────────────────────────
  const realPrice   = product.price;
  const realTotal   = realPrice;
  const displayPrice = Math.round(realTotal / 0.90);
  const discountPct  = Math.round(((displayPrice - realTotal) / displayPrice) * 100);

  return (
    <Link to={`/product/${product.id}`}>
      <div className={`group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        dark
          ? "bg-white/[0.03] border border-white/5 hover:border-violet-500/30 hover:shadow-violet-500/10"
          : "bg-white border border-gray-200 hover:border-violet-300 hover:shadow-violet-200/50"
      }`}>
        <div className={`relative h-36 sm:h-44 lg:h-56 overflow-hidden ${dark ? "bg-white/[0.02]" : "bg-gray-50"}`}>

          {/* Shimmer — শুধু loading state এ */}
          {imgState === "loading" && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#e5e7eb", overflow: "hidden" }}
            >
              <style>{shimmerStyle}</style>
              <div style={{
                position: "absolute", inset: 0,
                background: dark
                  ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                animation: "pc-shimmer 1.4s infinite",
              }} />
            </div>
          )}

          {/* Error fallback */}
          {imgState === "error" && (
            <div className={`absolute inset-0 flex items-center justify-center ${dark ? "text-gray-600" : "text-gray-300"}`}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}

          {/* Actual image */}
          <div className={`absolute inset-0 flex items-center justify-center p-3 sm:p-4 lg:p-6 transition-opacity duration-300 ${
            imgState === "loaded" ? "opacity-100" : "opacity-0"
          }`}>
            <img
              ref={imgRef}
              src={imgSrc}
              alt={product.name || product.title}
              className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-110"
              loading={isAboveFold ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={isAboveFold ? "high" : "auto"}
              width={300}
              height={300}
              onLoad={() => {
                imgCache.set(imgSrc, "loaded");
                setImgState("loaded");
              }}
              onError={(e) => {
                const t = e.currentTarget;
                // একবার original URL দিয়ে retry
                if (t.src !== rawSrc) {
                  t.src = rawSrc;
                } else {
                  imgCache.set(imgSrc, "error");
                  setImgState("error");
                }
              }}
            />
          </div>

          {/* Category badge */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${
              dark ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-violet-100 text-violet-700"
            }`}>
              {product.category}
            </span>
          </div>

          {/* Discount badge */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-red-500 text-white">
              -{discountPct}%
            </span>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium">
              <ShoppingCart size={12} />
              View Details
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-5">
          <h3 className={`font-semibold text-xs sm:text-sm leading-tight mb-1.5 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] ${
            dark ? "text-white" : "text-gray-900"
          }`}>
            {product.name || product.title}
          </h3>

          {product.stock_status && (
            <span className={`inline-flex items-center gap-1 text-[10px] mb-2 ${
              product.stock_status === "in_stock" ? "text-green-400" : "text-red-400"
            }`}>
              <Tag size={10} />
              {product.stock_status}
            </span>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm sm:text-base lg:text-lg font-bold text-emerald-500">
                ৳{realTotal.toFixed(2)}
              </span>
              <span className={`text-[10px] line-through ${dark ? "text-gray-500" : "text-gray-400"}`}>
                ৳{displayPrice.toFixed(2)}
              </span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className={`p-1.5 sm:p-2 lg:p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${
                dark ? "bg-violet-500/10 hover:bg-violet-500/20 text-violet-400" : "bg-violet-100 hover:bg-violet-200 text-violet-600"
              }`}>
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
});
