import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag } from "lucide-react";
import { siteConfig } from "../data/config";
import { useTheme } from "../App";
import { useAuth } from '../Contex/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logOut();
    setDropdownOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? dark
            ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-violet-500/5"
            : "bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 70 Q50 50 70 50 H130 Q150 50 150 70 V150 Q150 165 135 165 H65 Q50 165 50 150 Z" fill="url(#grad1)" />
              <path d="M75 55 Q100 20 125 55" stroke="url(#grad2)" strokeWidth="8" strokeLinecap="round"/>
              <path d="M75 95 H125 L118 125 H85 Z" fill="white" opacity="0.9"/>
              <circle cx="88" cy="135" r="5" fill="white"/>
              <circle cx="112" cy="135" r="5" fill="white"/>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9"/>
                  <stop offset="100%" stopColor="#F97316"/>
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0EA5E9"/>
                  <stop offset="100%" stopColor="#F97316"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              <span className="gradient-text">{siteConfig.brandName}</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {siteConfig.navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group ${
                  location.pathname === link.path
                    ? dark ? "text-white" : "text-gray-900"
                    : dark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Profile Picture with Dropdown */}
            <div className="relative" ref={dropdownRef}>
           <div>
            {user ? (
                 <img
                src={user?.picture || "https://i.postimg.cc/4NTczqzN/download.jpg"}
                alt="User Avatar"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-violet-500/30 cursor-pointer hover:ring-violet-500/60 transition-all duration-200"
              />
            ) : (
              <h2 className="text-sm font-medium cursor-pointer text-gray-400 hover:text-white transition-all duration-200">{user?.displayName || <Link to="/relogin">Login</Link>  }</h2>
            )
            }
           </div>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-11 z-50 min-w-[160px] rounded-xl border shadow-xl overflow-hidden ${
                      dark
                        ? "bg-[#0a0a0f] border-white/10"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {/* User Info */}
                    {user && (
                      <div className={`px-4 py-3 border-b ${
                        dark ? "border-white/10" : "border-gray-100"
                      }`}>
                        <p className={`text-xs font-medium truncate max-w-[130px] ${
                          dark ? "text-gray-200" : "text-gray-800"
                        }`}>
                          {user.displayName || user.name || "User"}
                        </p>
                        <p className={`text-xs truncate max-w-[130px] mt-0.5 ${
                          dark ? "text-gray-500" : "text-gray-400"
                        }`}>
                          {user.email || ""}
                        </p>
                      </div>
                    )}

                    {/* Logout / Register Button */}
                    {user ? (
                      <button
                        onClick={handleLogout}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-2 transition-colors duration-150 text-red-500 ${
                          dark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Logout
                      </button>
                    ) : (
                      <button
                        onClick={() => { navigate("/login"); setDropdownOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-2 transition-colors duration-150 text-blue-500 ${
                          dark ? "hover:bg-blue-500/10" : "hover:bg-blue-50"
                        }`}
                      >
                        Register
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* All / Shop */}
            <Link to="/shop">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-1 sm:p-2.5 flex items-center gap-2 rounded-xl transition-all duration-300 relative ${
                  dark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                <h2>All</h2>
                <ShoppingBag size={18} />
              </motion.div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
                dark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden overflow-hidden ${
              dark ? "bg-[#0a0a0f]/95 backdrop-blur-xl" : "bg-white/95 backdrop-blur-xl"
            }`}
          >
            <div className="px-4 py-4 space-y-1">
              {siteConfig.navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      location.pathname === link.path
                        ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-violet-400"
                        : dark
                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Logout / Register */}
              <div className="pt-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-red-500/10 text-red-500 text-sm font-semibold rounded-xl border border-red-500/20"
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl"
                  >
                    Register
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}