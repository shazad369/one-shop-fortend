// ============================================
// 🎨 SITE CONFIGURATION — Edit Everything Here!
// ============================================
  import { Zap, Shirt, Gem, ShoppingBag } from 'lucide-react'
  const user = JSON.parse(localStorage.getItem('user') || '{}')

export const siteConfig = {
  // --- Brand ---
  brandName: "ONE-SHOP",
  tagline: "Discover Premium Products",
  description: "Curated collection of premium products for the modern lifestyle.",

  // --- API Configuration ---
  // Change this API URL to fetch your own products
  productApiUrl: `${import.meta.env.VITE_API}/shopdata?page=1&limit=20`,
// --- API Configuration ---
apiBase: import.meta.env.VITE_API,  // ← এটা add করো
productApiUrl: `${import.meta.env.VITE_API}/shopdata?page=1&limit=20`,
  // --- Hero Section ---
  hero: {
    title: "Elevate Your",
    titleHighlight: "Lifestyle",
    subtitle: "Discover handpicked premium products that define modern elegance. From fashion to electronics, we curate the finest for you.",
    ctaText: "Shop Now",
    ctaLink: "/shop",
    secondaryCta: "Explore Collection",
    secondaryCtaLink: "/work",
  },

  // --- Navigation Links ---
navLinks: [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/shop" },
  { label: "About", path: "/about" },

  { label: "Contact", path: "/contact" },
  { label: "Location", path: "/location" },
  user.email =="shazadahamed571@gmail.com"
    ? { label: "orderdata", path: "/addproduct" } 
    :[] ,
],

  // --- Featured Categories ---
  categories: [
    { name: "Electronics", icon: Zap , color: "from-blue-500 to-cyan-400" },
    { name: "Fashion", icon: Shirt, color: "from-pink-500 to-rose-400" },
    { name: "Jewelry", icon: Gem, color: "from-amber-500 to-yellow-400" },
    { name: "Accessories", icon: ShoppingBag, color: "from-purple-500 to-violet-400" },
  ],

  // --- About Page ---
  about: {
    title: "Our Story",
    subtitle: "Crafting experiences since 2020",
    description: "We believe in the power of quality. Every product in our collection is carefully selected to meet the highest standards of design, functionality, and sustainability.",
    mission: "To bring premium, accessible products to everyone who values quality and style.",
    vision: "A world where everyone has access to beautifully designed, sustainable products.",
    stats: [
      { label: "Happy Customers", value: "10K+" },
      { label: "Products", value: "500+" },
      { label: "Countries", value: "50+" },
      { label: "Awards", value: "25+" },
    ],
    team: [
      { name: "Alex Johnson", role: "CEO & Founder", avatar: "👨‍💼" },
      { name: "Sarah Chen", role: "Creative Director", avatar: "👩‍🎨" },
      { name: "Mike Rivera", role: "Head of Product", avatar: "👨‍💻" },
      { name: "Emma Wilson", role: "Marketing Lead", avatar: "👩‍💼" },
    ],
  },

  // --- Blog Posts ---
  blogPosts: [
    {
      id: 1,
      title: "The Future of E-Commerce in 2026",
      excerpt: "Explore the latest trends shaping the future of online shopping, from AI-powered recommendations to immersive AR experiences.",
      date: "Jan 15, 2026",
      category: "Trends",
      readTime: "5 min read",
      image: "📱",
    },
    {
      id: 2,
      title: "Sustainable Fashion: A Complete Guide",
      excerpt: "Learn how sustainable fashion is revolutionizing the industry and how you can make eco-conscious choices without sacrificing style.",
      date: "Jan 10, 2026",
      category: "Fashion",
      readTime: "8 min read",
      image: "🌿",
    },
    {
      id: 3,
      title: "Top 10 Tech Gadgets You Need",
      excerpt: "Our curated list of must-have tech gadgets that will transform your daily routine and boost your productivity.",
      date: "Jan 5, 2026",
      category: "Tech",
      readTime: "6 min read",
      image: "⚡",
    },
    {
      id: 4,
      title: "Minimalist Living: Less is More",
      excerpt: "Discover the art of minimalist living and how choosing quality over quantity can lead to a more fulfilling lifestyle.",
      date: "Dec 28, 2025",
      category: "Lifestyle",
      readTime: "4 min read",
      image: "✨",
    },
    {
      id: 5,
      title: "The Art of Accessorizing",
      excerpt: "Master the art of accessorizing with our expert tips. Learn how the right accessories can elevate any outfit.",
      date: "Dec 20, 2025",
      category: "Style",
      readTime: "7 min read",
      image: "💫",
    },
    {
      id: 6,
      title: "Smart Home Essentials for 2026",
      excerpt: "Transform your living space with these smart home essentials that combine technology with elegant design.",
      date: "Dec 15, 2025",
      category: "Tech",
      readTime: "9 min read",
      image: "🏠",
    },
  ],

  // --- Work / Portfolio ---
  workProjects: [
    {
      id: 1,
      title: "Brand Identity Redesign",
      description: "Complete brand overhaul for a luxury fashion house, including logo, packaging, and digital presence.",
      category: "Branding",
      image: "🎨",
    },
    {
      id: 2,
      title: "E-Commerce Platform",
      description: "Built a scalable e-commerce platform handling 1M+ daily transactions with seamless UX.",
      category: "Development",
      image: "🛒",
    },
    {
      id: 3,
      title: "Product Photography",
      description: "Professional product photography campaign for premium jewelry collection launch.",
      category: "Photography",
      image: "📸",
    },
    {
      id: 4,
      title: "Mobile App Design",
      description: "Designed an intuitive mobile shopping app with AR try-on features for fashion products.",
      category: "UI/UX",
      image: "📱",
    },
    {
      id: 5,
      title: "Marketing Campaign",
      description: "Multi-channel marketing campaign that increased brand awareness by 300% in 3 months.",
      category: "Marketing",
      image: "📊",
    },
    {
      id: 6,
      title: "Sustainable Packaging",
      description: "Eco-friendly packaging design that reduced waste by 60% while maintaining premium feel.",
      category: "Design",
      image: "🌱",
    },
  ],

  // --- Contact Info ---
  contact: {
    email: "Shazadahamed571@gmail.com",
    phone: "01747646956",
    address: "Rajshahi, Natore,Lalpur_0_point",
    socialLinks: [
      { name: "Twitter", url: "#" },
      { name: "LinkedIn", url: "#" },
      { name: "Facebook", url: "https://www.facebook.com/profile.php?id=61576315876473" },
     
    ],
  },

  // --- Footer ---
  footer: {
    description: "Premium products for the modern lifestyle. Quality meets design in every piece we curate.",
    quickLinks: [
      { label: "Home", path: "/" },
      { label: "Shop", path: "/shop" },
      { label: "About", path: "/about" },

    ],
    supportLinks: [
      { label: "FAQ", path: "#" },
      { label: "Shipping", path: "#" },
      { label: "Returns", path: "#" },
      { label: "Privacy", path: "#" },
    ],
  },
};

export type SiteConfig = typeof siteConfig;
