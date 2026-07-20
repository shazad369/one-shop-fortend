import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { siteConfig } from "../data/config";
import { useTheme } from "../App";
import AnimatedSection from "../components/AnimatedSection";
import ProductCard, { Product } from "../components/ProductCard";
import CoverflowCarousel from "../components/CoverflowCarousel";
import Shop from "./Shop";

// ─── RAM CACHE ───────────────────────────────────────────────────
const memCache = {
  products: null as Product[] | null,
};

function useIntersectionObserver(ref, options) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isIntersecting;
}

const FEATURES = [
  { icon: <Truck size={18} />, label: "Free Shipping" },
  { icon: <Shield size={18} />, label: "Secure Payment" },
  { icon: <RotateCcw size={18} />, label: "Fast Delivery" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
});

// 👉 mobile category banner slideshow images — change/add links here easily
const MOBILE_CATEGORY_BANNER_IMAGES = [
  "/file_0000000064b8820baf2d148b43b757e0.png",
  "/file_0000000064b8820baf2d148b43b757e0.png",
  "/file_0000000064b8820baf2d148b43b757e0.png",
];


export default function Home() {
  const { dark } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [allProductsCache, setAllProductsCache] = useState<Product[]>([]);
  const [floatingProducts, setFloatingProducts] = useState<{ image: string }[]>([]);

  const loadMoreRef = useRef(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef, { threshold: 0.1 });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API}/floatingdata`, {
      headers: {
        "x-api-key": import.meta.env.VITE_API_KEY,
        "Content-Type": "application/json",
        'ngrok-skip-browser-warning': 'true'
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setFloatingProducts(data))
      .catch((err) => console.error("Floating data fetch error:", err));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      let allProducts: Product[] = [];

      if (memCache.products) {
        allProducts = memCache.products;
        setAllProductsCache(allProducts);
        setTotalProducts(allProducts.length);
        setProducts(allProducts.slice(0, 12));
        setHasMore(allProducts.length > 12);
        setLoading(false);
        return;
      }

      const cached = sessionStorage.getItem("all_products_cache");
      if (cached) {
        allProducts = JSON.parse(cached);
        memCache.products = allProducts;
        setAllProductsCache(allProducts);
        setTotalProducts(allProducts.length);
        setProducts(allProducts.slice(0, 12));
        setHasMore(allProducts.length > 12);
        setLoading(false);
        return;
      }

      const response = await fetch(siteConfig.productApiUrl, {
        method: "GET",
        headers: {
           "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_API_KEY,
  'ngrok-skip-browser-warning': 'true'

        },
      });

      const data = await response.json();
      allProducts = data?.data || data?.products || data || [];

      memCache.products = allProducts;
      sessionStorage.setItem("all_products_cache", JSON.stringify(allProducts));
      setAllProductsCache(allProducts);
      setTotalProducts(allProducts.length);
      setProducts(allProducts.slice(0, 12));
      setHasMore(allProducts.length > 12);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const itemsPerPage = 12;
    const nextPage = currentPage + 1;
    const end = nextPage * itemsPerPage;

    const nextProducts = allProductsCache.slice(0, end);

    setTimeout(() => {
      setProducts(nextProducts);
      setCurrentPage(nextPage);
      setHasMore(end < totalProducts);
      setLoadingMore(false);
    }, 500);
  }, [currentPage, hasMore, loadingMore, allProductsCache, totalProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (isIntersecting && hasMore && !loadingMore && !loading && products.length > 0) {
      loadMoreProducts();
    }
  }, [isIntersecting, hasMore, loadingMore, loading, products.length, loadMoreProducts]);

  const handleManualLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadMoreProducts();
    }
  };

  const surface = dark
    ? "bg-white/[0.04] border border-white/10"
    : "bg-white border border-gray-200";
  const mutedText = dark ? "text-gray-400" : "text-gray-500";

  return (
    <>
      <Helmet>
        <title>ONE-SHOP — Premium E-Commerce | Best Products in Bangladesh</title>
        <meta
          name="description"
          content="ONE-SHOP এ কিনুন ১০০০+ প্রিমিয়াম প্রোডাক্ট। Free Shipping, Cash on Delivery, Secure Payment। সেরা দামে অনলাইন শপিং করুন বাংলাদেশে।"
        />
        <meta
          name="keywords"
          content="online shop bangladesh, buy online, free shipping bangladesh, cash on delivery, premium products, one-shop, অনলাইন শপিং"
        />
        <meta name="author" content="ONE-SHOP" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      {/* Mobile-only slideshow keyframes: hold each image ~3s, then slide slowly to the next */}
      <style>{`
        @keyframes mobileCategorySlide {
          0%   { transform: translateX(0); }
          22%  { transform: translateX(0); }
          33%  { transform: translateX(-100vw); }
          55%  { transform: translateX(-100vw); }
          66%  { transform: translateX(-200vw); }
          88%  { transform: translateX(-200vw); }
          100% { transform: translateX(-300vw); }
        }
        .mobile-category-slide-track {
          animation: mobileCategorySlide 13.5s ease-in-out infinite;
        }
      `}</style>

      <div className="overflow-hidden">
        {/* HERO */}
        <section className="relative min-h-[60vh] sm:min-h-screen flex items-center pt-14 sm:pt-20">

          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className={`absolute -top-16 -left-24 w-72 sm:w-[480px] h-72 sm:h-[480px] rounded-full blur-[140px] opacity-25 ${
                dark ? "bg-violet-600" : "bg-violet-300"
              }`}
            />
            <div
              className={`absolute bottom-0 -right-24 w-64 sm:w-[400px] h-64 sm:h-[400px] rounded-full blur-[140px] opacity-20 ${
                dark ? "bg-cyan-600" : "bg-cyan-300"
              }`}
            />
            {dark && (
              <div

                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
            )}

          </div>


          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div>
                <motion.div
                  {...fadeUp(0)}
                  className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5 sm:mb-7 ${
                    dark
                      ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      : "bg-violet-100 text-violet-700 border border-violet-200"
                  }`}
                >
                  <Sparkles size={12} />
                  New Collection 2026
                </motion.div>

                <motion.h1
                  {...fadeUp(0.08)}
                  className="text-4xl sm:text-5xl lg:text-[4.25rem] font-bold leading-[1.08] tracking-tight mb-5 sm:mb-6"
                >
                  {siteConfig.hero.title}{" "}
                  <span className="gradient-text font-display italic">
                    {siteConfig.hero.titleHighlight}
                  </span>

                </motion.h1>

                <motion.p
                  {...fadeUp(0.16)}
                  className={`text-base sm:text-lg leading-relaxed mb-5 sm:mb-9 max-w-[460px] ${mutedText}`}
                >
                  {siteConfig.hero.subtitle}
                </motion.p>

                {/* Mobile-only category banner slideshow — margin added so it
                    doesn't sit flush against the paragraph above / buttons below */}
                <div className="sm:hidden overflow-hidden rounded-2xl mt-5 mb-7">
                  <div className="flex w-max mobile-category-slide-track">
                    {MOBILE_CATEGORY_BANNER_IMAGES.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={i === 0 ? "Shop by Category" : ""}
                        aria-hidden={i === 0 ? undefined : "true"}
                        className="h-auto w-screen max-w-none object-cover flex-shrink-0"
                      />
                    ))}
                    {/* duplicate of the first image so the loop snaps back seamlessly */}
                    <img
                      src={MOBILE_CATEGORY_BANNER_IMAGES[0]}
                      alt=""
                      aria-hidden="true"
                      className="h-auto w-screen max-w-none object-cover flex-shrink-0"
                    />
                  </div>
                </div>

                <motion.div {...fadeUp(0.24)} className="flex flex-wrap gap-3 sm:gap-4">
                  <Link to={siteConfig.hero.ctaLink}>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 transition-shadow hover:shadow-violet-500/50"
                    >
                      {siteConfig.hero.ctaText}
                      <ArrowRight size={15} />
                    </motion.button>
                  </Link>

                  <Link to={siteConfig.hero.secondaryCtaLink}>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className={`inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm font-semibold border transition-all duration-200 ${
                        dark
                          ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                          : "bg-white hover:bg-gray-50 text-gray-800 border-gray-200 shadow-sm"
                      }`}
                    >
                      {siteConfig.hero.secondaryCta}
                    </motion.button>
                  </Link>
                </motion.div>

                <motion.div
                  {...fadeUp(0.32)}
                  className={`flex flex-wrap gap-3 mt-6 sm:mt-10 pt-6 sm:pt-10 border-t ${
                    dark ? "border-white/8" : "border-gray-100"
                  }`}
                >
                  {FEATURES.map((f) => (
                    <span
                      key={f.label}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                        dark
                          ? "bg-white/5 text-gray-300 border border-white/8"
                          : "bg-gray-50 text-gray-600 border border-gray-200"
                      }`}
                    >
                      <span className="text-violet-400">{f.icon}</span>
                      {f.label}
                    </span>
                  ))}
                </motion.div>

              </div>

              {/* ✅ Coverflow Carousel — properly imported component */}
              <CoverflowCarousel dark={dark} floatingProducts={floatingProducts} />
            </div>
          </div>
        </section>



        {/* CATEGORIES */}
        <section className="py-9 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="hidden sm:block text-center mb-10 sm:mb-14">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight">
                  Shop by{" "}
                  <span className="gradient-text font-display italic">Category</span>
                </h2>
                <p className={`text-sm sm:text-base max-w-md mx-auto ${mutedText}`}>
                  Explore our curated collections across different categories
                </p>
              </div>
            </AnimatedSection>

            {/* Desktop/tablet: original category cards grid (unchanged) */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {siteConfig.categories.map((cat, i) => (
                <AnimatedSection key={cat.name} delay={i * 0.07}>
                  <Link to="/shop">
                    <motion.div
                      whileHover={{ scale: 1.04, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative p-5 sm:p-6 lg:p-8 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                        dark
                          ? "bg-white/[0.03] border border-white/8 hover:border-white/20 hover:bg-white/[0.06]"
                          : "bg-white border border-gray-100 hover:shadow-xl hover:shadow-gray-200/70"
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      />
                      <div className="text-center relative z-10">
                        <div className="mb-3 flex justify-center">
                          <div
                            className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                              dark
                                ? "bg-white/5 text-white/70 group-hover:text-white group-hover:bg-white/10"
                                : "bg-gray-50 text-gray-600 group-hover:text-gray-900 group-hover:bg-gray-100"
                            }`}
                          >
                            <cat.icon size={22} />
                          </div>
                        </div>
                        <h3
                          className={`text-xs sm:text-sm font-semibold tracking-wide ${
                            dark ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {cat.name}
                        </h3>
                      </div>
                    </motion.div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}

             <Shop></Shop>
        {/* CTA BANNER */}
        <section className="py-11 sm:py-16 lg:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div
                className={`relative rounded-3xl overflow-hidden p-6 sm:p-12 lg:p-16 text-center ${
                  dark
                    ? "bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 border border-white/8"
                    : "bg-gradient-to-br from-violet-50 via-white to-cyan-50 border border-violet-100"
                }`}
              >
                <div
                  aria-hidden
                  className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[120px] pointer-events-none ${
                    dark ? "bg-violet-600 opacity-20" : "bg-violet-300 opacity-30"
                  }`}
                />

                <div className="relative z-10">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5 ${
                      dark
                        ? "bg-white/5 text-violet-300 border border-white/10"
                        : "bg-violet-100 text-violet-700 border border-violet-200"
                    }`}
                  >
                    <Sparkles size={11} />
                    Limited Time Offer
                  </span>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                    Ready to{" "}
                    <span className="gradient-text font-display italic">Upgrade</span>?
                  </h2>

                  <p className={`text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed ${mutedText}`}>
                    Join thousands of happy customers and discover premium products that
                    elevate your everyday life.
                  </p>

                  <Link to="/shop">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm sm:text-base font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
                    >
                      Start Shopping
                      <ArrowRight size={16} />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </div>
    </>
  );
}
