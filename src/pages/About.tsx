import { motion } from "framer-motion";
import Seo from "../components/Seo";
import { siteConfig } from "../data/config";
import { useTheme } from "../App";
import AnimatedSection from "../components/AnimatedSection";
import { Target, Eye, Users, Award } from "lucide-react";

export default function About() {
  const { dark } = useTheme();
  const { about } = siteConfig;

  const icons = [<Target size={28} />, <Eye size={28} />, <Users size={28} />, <Award size={28} />];

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <Seo path="/About" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <AnimatedSection>
          <div className="text-center mb-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="text-6xl mb-6"
            >
              🌟
            </motion.div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-4">
              {about.title.split(" ")[0]}{" "}
              <span className="gradient-text font-display italic">{about.title.split(" ").slice(1).join(" ")}</span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${dark ? "text-gray-400" : "text-gray-600"}`}>
              {about.subtitle}
            </p>
          </div>
        </AnimatedSection>

        {/* Story */}
        <AnimatedSection delay={0.1}>
          <div
            className={`rounded-3xl p-8 sm:p-12 mb-20 ${
              dark
                ? "bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-white/5"
                : "bg-gradient-to-br from-violet-50 to-cyan-50 border border-gray-200"
            }`}
          >
            <div className="max-w-3xl mx-auto text-center">
              <h2 className={`text-2xl font-bold mb-6 ${dark ? "text-white" : "text-gray-900"}`}>
                Who We Are
              </h2>
              <p className={`text-lg leading-relaxed ${dark ? "text-gray-300" : "text-gray-700"}`}>
                {about.description}
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <AnimatedSection delay={0.1}>
            <div
              className={`p-8 rounded-2xl h-full transition-all duration-500 hover:scale-[1.02] ${
                dark
                  ? "bg-white/[0.03] border border-white/5 hover:border-violet-500/30"
                  : "bg-white border border-gray-200 hover:shadow-xl"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center text-violet-400 mb-6">
                <Target size={28} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>
                Our Mission
              </h3>
              <p className={`leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>
                {about.mission}
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div
              className={`p-8 rounded-2xl h-full transition-all duration-500 hover:scale-[1.02] ${
                dark
                  ? "bg-white/[0.03] border border-white/5 hover:border-cyan-500/30"
                  : "bg-white border border-gray-200 hover:shadow-xl"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center text-cyan-400 mb-6">
                <Eye size={28} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>
                Our Vision
              </h3>
              <p className={`leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>
                {about.vision}
              </p>
            </div>
          </AnimatedSection>
        </div>

        {/* Stats */}
        <AnimatedSection delay={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {about.stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl text-center transition-all duration-500 hover:scale-105 ${
                  dark
                    ? "bg-white/[0.03] border border-white/5 hover:border-violet-500/30"
                    : "bg-white border border-gray-200 hover:shadow-lg"
                }`}
              >
                <div className="text-violet-400 flex justify-center mb-3">{icons[i]}</div>
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <p className={`text-sm ${dark ? "text-gray-500" : "text-gray-500"}`}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Team */}
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Meet Our <span className="gradient-text font-display italic">Team</span>
            </h2>
            <p className={`max-w-md mx-auto ${dark ? "text-gray-400" : "text-gray-600"}`}>
              The creative minds behind {siteConfig.brandName}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {about.team.map((member, i) => (
            <AnimatedSection key={member.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                className={`p-6 rounded-2xl text-center transition-all duration-500 ${
                  dark
                    ? "bg-white/[0.03] border border-white/5 hover:border-violet-500/30"
                    : "bg-white border border-gray-200 hover:shadow-lg"
                }`}
              >
                <div className="text-5xl mb-4">{member.avatar}</div>
                <h3 className={`font-semibold mb-1 ${dark ? "text-white" : "text-gray-900"}`}>
                  {member.name}
                </h3>
                <p className={`text-sm ${dark ? "text-gray-500" : "text-gray-500"}`}>{member.role}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </div>
  );
}
