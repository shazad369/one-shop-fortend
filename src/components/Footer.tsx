import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowUp } from "lucide-react";
import { siteConfig } from "../data/config";
import { useTheme } from "../App";
import { FaFacebookSquare, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  const { dark } = useTheme();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      className={`relative ${
        dark
          ? "bg-[#050508] border-t border-white/5"
          : "bg-white border-t border-gray-200"
      }`}
    >
      {/* Gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                {siteConfig.brandName[0]}
              </div>
              <span className="text-xl font-bold gradient-text">{siteConfig.brandName}</span>
            </Link>
            <p className={`text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>
              {siteConfig.footer.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${dark ? "text-white" : "text-gray-900"}`}>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {siteConfig.footer.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className={`text-sm transition-colors duration-300 ${
                      dark ? "text-gray-400 hover:text-violet-400" : "text-gray-600 hover:text-violet-600"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${dark ? "text-white" : "text-gray-900"}`}>
              Support
            </h3>
            <ul className="space-y-3">
              {siteConfig.footer.supportLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    className={`text-sm transition-colors duration-300 ${
                      dark ? "text-gray-400 hover:text-violet-400" : "text-gray-600 hover:text-violet-600"
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${dark ? "text-white" : "text-gray-900"}`}>
              Get in Touch
            </h3>
            <div className="space-y-3">
              <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
                {siteConfig.contact.email}
              </p>
              <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
                {siteConfig.contact.phone}
              </p>
              <div className="flex gap-3 mt-4">
               <div className="flex gap-3">
                     <a className="text-3xl" href="https://www.facebook.com/profile.php?id=61576315876473"> <FaFacebookSquare /></a>
                           <a className=" text-3xl" href="https://wa.me/8801747646956"> <FaWhatsapp /> </a>
                     <a className="text-3xl" href="https://www.instagram.com/one_shop_offical/"> <FaInstagram /></a>
           
           
           
                           </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className={`mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          dark ? "border-white/5" : "border-gray-200"
        }`}>
          <p className={`text-sm flex items-center gap-1 ${dark ? "text-gray-500" : "text-gray-500"}`}>
            © 2026 {siteConfig.brandName}. Made with <Heart size={14} className="text-red-500" /> All rights reserved.
          </p>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              dark
                ? "bg-white/5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-400"
                : "bg-gray-100 hover:bg-violet-100 text-gray-600 hover:text-violet-600"
            }`}
          >
            <ArrowUp size={18} />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
