import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MapPin, Mail, Phone, CheckCircle } from "lucide-react";
import { siteConfig } from "../data/config";
import { useTheme } from "../App";
import AnimatedSection from "../components/AnimatedSection";
import { FaFacebookSquare, FaInstagram, FaWhatsapp } from "react-icons/fa";
import emailjs from "@emailjs/browser";
import Seo from "../components/Seo";

export default function Contact() {
  const { dark } = useTheme();
  const { contact } = siteConfig;
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [formData, setFormData]   = useState({
    name: "", email: "", subject: "", message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name:  formData.name,
          from_email: formData.email,
          subject:    formData.subject,
          message:    formData.message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: "", email: "", subject: "", message: "" });
      }, 3000);
    } catch (err) {
      setError("Message পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSending(false);
    }
  };

  const inputClass = `w-full px-5 py-3.5 rounded-xl text-sm outline-none transition-all duration-300 ${
    dark
      ? "bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-gray-500"
      : "bg-gray-50 border border-gray-200 focus:border-violet-400 text-gray-900 placeholder-gray-400"
  }`;

  const contactInfo = [
    { icon: <Mail size={20} />, label: "Email",   value: contact.email   },
    { icon: <Phone size={20} />, label: "Phone",  value: contact.phone   },
    { icon: <MapPin size={20} />, label: "Address", value: contact.address },
  ];

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <Seo path="/Contact" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-6xl font-bold mb-4">
              Get in <span className="gradient-text font-display italic">Touch</span>
            </h1>
            <p className={`max-w-md mx-auto text-lg ${dark ? "text-gray-400" : "text-gray-600"}`}>
              We'd love to hear from you. Send us a message!
            </p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatedSection delay={0.1}>
              {contactInfo.map((info) => (
                <div
                  key={info.label}
                  className={`p-6 rounded-2xl flex items-start gap-4 transition-all duration-500 hover:scale-[1.02] ${
                    dark
                      ? "bg-white/[0.03] border border-white/5 hover:border-violet-500/30"
                      : "bg-white border border-gray-200 hover:shadow-lg"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-violet-400 shrink-0">
                    {info.icon}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm mb-1 ${dark ? "text-white" : "text-gray-900"}`}>
                      {info.label}
                    </h3>
                    <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>{info.value}</p>
                  </div>
                </div>
              ))}
            </AnimatedSection>

            {/* Social Links */}
            <AnimatedSection delay={0.2}>
              <div className={`p-6 rounded-2xl ${dark ? "bg-white/[0.03] border border-white/5" : "bg-white border border-gray-200"}`}>
                <h3 className={`font-semibold text-sm mb-4 ${dark ? "text-white" : "text-gray-900"}`}>
                  Follow Us
                </h3>
                <div className="flex gap-3">
                  <a className="text-3xl" href="https://www.facebook.com/profile.php?id=61576315876473"><FaFacebookSquare /></a>
                  <a className="text-3xl" href="https://wa.me/8801747646956"><FaWhatsapp /></a>
                  <a className="text-3xl" href="https://www.instagram.com/one_shop_offical/"><FaInstagram /></a>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <AnimatedSection delay={0.2}>
              <div className={`p-6 sm:p-8 rounded-3xl ${dark ? "bg-white/[0.03] border border-white/5" : "bg-white border border-gray-200 shadow-lg"}`}>
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    >
                      <CheckCircle size={64} className="text-green-400 mb-4" />
                    </motion.div>
                    <h3 className={`text-2xl font-bold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>
                      Message Sent!
                    </h3>
                    <p className={dark ? "text-gray-400" : "text-gray-600"}>
                      We'll get back to you soon.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${dark ? "text-gray-400" : "text-gray-600"}`}>
                          Your Name
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${dark ? "text-gray-400" : "text-gray-600"}`}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-2 ${dark ? "text-gray-400" : "text-gray-600"}`}>
                        Subject
                      </label>
                      <input
                        type="text"
                        placeholder="What's this about?"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-2 ${dark ? "text-gray-400" : "text-gray-600"}`}>
                        Message
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Tell us more..."
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    {/* Error message */}
                    {error && (
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={sending}
                      whileHover={{ scale: sending ? 1 : 1.02 }}
                      whileTap={{ scale: sending ? 1 : 0.98 }}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}
