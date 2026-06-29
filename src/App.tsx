import { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";

import Contact from "./pages/Contact";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Location from "./pages/Location";
import Login from "./pages/Login";
import Relogin from "./pages/Relogin";
import Cart from "./pages/Cart";
import { ShoppingBag } from "lucide-react";
import Pathaocurior from "./pages/Pathaocurior";
import Addproductroute from "./pages/Addproductroute";
import { createContext } from "react";
import { AuthProvider, useAuth } from "./Contex/AuthContext";

// Theme Context
export const ThemeContext = createContext<{
  dark: boolean;
  toggle: () => void;
}>({ dark: true, toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

// ── Scroll to top on route change ──────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}
// ───────────────────────────────────────────────────────────

// Protected Route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/relogin" replace />;
  return <>{children}</>;
}

function AppContent() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <Router>
        <ScrollToTop /> {/* ← এটা যোগ করা হয়েছে */}
        <div className={`min-h-screen transition-colors duration-500 ${
          dark ? "bg-[#0a0a0f] text-white" : "bg-gray-50 text-gray-900"
        }`}>
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/login" element={<Login />} />
              <Route path="/relogin" element={<Relogin />} />

              {/* Protected */}
              <Route path="product/:id/" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
              <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
              <Route path="/location" element={<ProtectedRoute><Location /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/pathao" element={<ProtectedRoute><Pathaocurior /></ProtectedRoute>} />
              <Route path="/addproduct" element={<ProtectedRoute><Addproductroute /></ProtectedRoute>} />

              {/* Unknown */}
              <Route path="*" element={<Navigate to="/relogin" replace />} />
            </Routes>
          </AnimatePresence>

          <button className="fixed bottom-5 right-5 z-50 overflow-hidden rounded-full bg-gradient-to-r from-red-600 to-rose-500 px-7 py-3 text-black font-semibold shadow-[0_0_25px_rgba(255,0,80,0.7)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,0,80,1)] active:scale-95">
            <span className="absolute top-0 left-[-75%] h-full w-1/2 rotate-12 bg-white/30 blur-md animate-[shine_2s_linear_infinite]" />
            <Link to="/cart" className="relative z-10 flex items-center gap-2">
              <ShoppingBag /> Go to Cart
            </Link>
          </button>

          <Footer />
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;