"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  Plane,
  Shield,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  Globe,
  Lock,
  TrendingUp,
  ChevronRight,
  Check,
  Star,
  Users,
  BadgeCheck,
  Play,
  ExternalLink,
  Github,
  Twitter,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 hero-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-40" />
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-gray-950/80 backdrop-blur-2xl border-b border-gray-800/50 py-3" 
          : "bg-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center shadow-lg shadow-aeroshield-primary/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AeroShield</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="hidden md:flex items-center space-x-1"
            >
              {["Features", "How it Works", "Pricing"].map((item) => (
                <Link 
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  {item}
                </Link>
              ))}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-ghost text-sm">Sign In</button>
                </SignInButton>
                <Link href="/dashboard" className="btn-primary text-sm py-2.5 px-5">
                  Get Started
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="btn-primary text-sm py-2.5 px-5">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center">
            {/* Product Hunt Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-aeroshield-primary/10 to-aeroshield-secondary/10 border border-aeroshield-primary/20 mb-8"
            >
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-300">
                Built on <span className="text-aeroshield-primary">Flare Network</span> × <span className="text-aeroshield-secondary">Gemini AI</span>
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-balance"
            >
              <span className="text-white">Flight delayed?</span>
              <br />
              <span className="gradient-text">Get paid instantly.</span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 text-balance leading-relaxed"
            >
              AI-powered parametric insurance that automatically pays you 
              when your flight is delayed. No claims. No paperwork. Just protection.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
            >
              <Link href="/dashboard/buy" className="btn-primary group flex items-center justify-center text-base py-4 px-8">
                Protect Your Flight
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="btn-secondary flex items-center justify-center text-base py-4 px-8 group">
                <Play className="w-4 h-4 mr-2 text-aeroshield-primary" />
                Watch Demo
              </button>
            </motion.div>
            
            {/* Social Proof Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-8 md:gap-16"
            >
              {[
                { value: "$2.4M+", label: "Total Value Locked", icon: TrendingUp },
                { value: "<3 min", label: "Average Payout", icon: Clock },
                { value: "98.5%", label: "AI Accuracy", icon: Sparkles },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-aeroshield-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="stat-value gradient-text-static">{stat.value}</span>
                  </div>
                  <span className="text-sm text-gray-500">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Hero Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 relative max-w-4xl mx-auto"
          >
            {/* Glow effect behind card */}
            <div className="absolute -inset-4 bg-gradient-to-r from-aeroshield-primary/20 via-aeroshield-secondary/20 to-aeroshield-accent/20 rounded-3xl blur-3xl opacity-50" />
            
            <div className="card-glass p-8 relative">
              {/* Card header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aeroshield-primary/20 to-aeroshield-secondary/20 flex items-center justify-center border border-aeroshield-primary/20">
                    <Plane className="w-6 h-6 text-aeroshield-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-0.5">Flight Protection Active</div>
                    <div className="text-xl font-semibold text-white">6E-542 DEL → BOM</div>
                  </div>
                </div>
                <div className="badge-warning flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  AI Risk: High (72%)
                </div>
              </div>
              
              {/* Card stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Coverage", value: "₹5,000", highlight: false },
                  { label: "Premium", value: "₹65", highlight: true },
                  { label: "Threshold", value: "2 hours", highlight: false },
                  { label: "Status", value: "Active", status: true },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                    <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                    {item.status ? (
                      <div className="flex items-center gap-2">
                        <span className="pulse-dot" />
                        <span className="text-lg font-semibold text-green-400">{item.value}</span>
                      </div>
                    ) : (
                      <div className={`text-lg font-semibold ${item.highlight ? 'gradient-text-static' : 'text-white'}`}>
                        {item.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* AI Insight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-amber-400 mb-0.5">AI Insight</div>
                    <p className="text-sm text-gray-400">
                      Heavy rain forecast at DEL → +18% delay probability. Consider higher coverage for optimal protection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trusted By / Tech Stack */}
      <section className="py-16 px-4 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-gray-500 mb-8"
          >
            POWERED BY CUTTING-EDGE TECHNOLOGY
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
          >
            {[
              { name: "Flare Network", desc: "FDC & FTSO" },
              { name: "Google Gemini", desc: "AI Predictions" },
              { name: "OpenZeppelin", desc: "Security" },
              { name: "ERC-721", desc: "NFT Policies" },
            ].map((tech) => (
              <div key={tech.name} className="text-center group cursor-default">
                <div className="text-lg font-semibold text-gray-400 group-hover:text-white transition-colors">
                  {tech.name}
                </div>
                <div className="text-xs text-gray-600">{tech.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-primary mb-4">Features</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 text-balance">
              Insurance, reimagined for<br />
              <span className="gradient-text-static">the modern traveler</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Combining AI intelligence with blockchain transparency to deliver the fastest, most reliable flight protection.
            </p>
          </motion.div>
          
          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Zap,
                title: "Instant Payouts",
                description: "Get paid automatically within minutes of delay confirmation. No claims to file, no waiting periods.",
                gradient: "from-yellow-500 to-orange-500",
              },
              {
                icon: Sparkles,
                title: "AI-Powered Pricing",
                description: "Gemini AI analyzes 50+ risk factors to calculate the fairest premium for your specific flight.",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Shield,
                title: "Blockchain Verified",
                description: "Flare Data Connector ensures trustless verification. Every payout is transparent and verifiable on-chain.",
                gradient: "from-cyan-500 to-blue-500",
              },
              {
                icon: Globe,
                title: "Gasless Experience",
                description: "Flare Smart Accounts enable seamless transactions. No need to hold crypto to get protected.",
                gradient: "from-green-500 to-teal-500",
              },
              {
                icon: Lock,
                title: "Fully Collateralized",
                description: "150%+ collateralization with FAssets ensures your payout is always guaranteed.",
                gradient: "from-red-500 to-pink-500",
              },
              {
                icon: TrendingUp,
                title: "Real-Time Monitoring",
                description: "Track your flight status and coverage with live updates and AI-powered delay predictions.",
                gradient: "from-indigo-500 to-purple-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="feature-card"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-primary mb-4">How it works</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Protected in <span className="gradient-text-static">60 seconds</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              Four simple steps to complete peace of mind
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-aeroshield-primary/50 via-aeroshield-secondary/50 to-aeroshield-accent/50" />
            
            {[
              { step: "01", title: "Enter Flight", description: "Input your flight details and instantly see AI risk assessment.", icon: Plane },
              { step: "02", title: "Choose Coverage", description: "Select your coverage amount and delay threshold. Get instant quote.", icon: Shield },
              { step: "03", title: "Pay & Activate", description: "Complete payment. Your NFT policy activates immediately.", icon: BadgeCheck },
              { step: "04", title: "Auto Payout", description: "Flight delayed? Receive automatic payout. That's it!", icon: Zap },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-aeroshield-primary/25 relative z-10">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-aeroshield-primary mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-primary mb-4">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Loved by <span className="gradient-text-static">travelers</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Got paid ₹3,000 within 5 minutes of my flight delay. No forms, no hassle. This is how insurance should work.",
                author: "Priya S.",
                role: "Frequent Flyer",
                rating: 5,
              },
              {
                quote: "The AI risk assessment helped me choose the right coverage. When my flight was cancelled, payout was instant!",
                author: "Rahul M.",
                role: "Business Traveler",
                rating: 5,
              },
              {
                quote: "Finally, insurance that's transparent and actually pays out. The blockchain verification gives me confidence.",
                author: "Anita K.",
                role: "Tech Professional",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="testimonial-card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">{testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aeroshield-primary/30 to-aeroshield-secondary/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Background glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-aeroshield-primary/20 via-aeroshield-secondary/20 to-aeroshield-accent/20 rounded-3xl blur-3xl" />
            
            <div className="card-glass p-12 md:p-16 text-center relative glow-effect">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center mx-auto mb-8 shadow-lg shadow-aeroshield-primary/30"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to fly with <span className="gradient-text-static">confidence?</span>
              </h2>
              <p className="text-gray-400 mb-10 max-w-lg mx-auto text-lg">
                Join thousands of travelers who never worry about delays again.
                Get protected in under 60 seconds.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/dashboard/buy" className="btn-primary group inline-flex items-center justify-center text-base py-4 px-8">
                  Protect Your Next Flight
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                No credit card required • Instant activation • Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">AeroShield</span>
                <p className="text-xs text-gray-500">Parametric Flight Insurance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span>Built on Flare Network</span>
              <span className="hidden md:inline">•</span>
              <span>Powered by Gemini AI</span>
              <span className="hidden md:inline">•</span>
              <span>© 2024 AeroShield</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
