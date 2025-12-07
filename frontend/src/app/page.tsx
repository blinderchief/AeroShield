"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">AeroShield</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-400 hover:text-white transition">Features</Link>
              <Link href="#how-it-works" className="text-gray-400 hover:text-white transition">How it Works</Link>
              <Link href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-gray-400 hover:text-white transition">Sign In</button>
                </SignInButton>
                <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">
                  Get Started
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 mb-6">
                <Sparkles className="w-4 h-4 text-aeroshield-primary mr-2" />
                <span className="text-sm text-gray-300">Powered by Flare Network & Gemini AI</span>
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="text-white">Get Paid </span>
              <span className="gradient-text">Before You</span>
              <br />
              <span className="text-white">Leave the Gate</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
            >
              AI-augmented parametric flight insurance with instant blockchain payouts.
              No claims, no paperwork, just protection.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link href="/dashboard/buy" className="btn-primary flex items-center justify-center">
                Protect Your Flight
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="#how-it-works" className="btn-secondary flex items-center justify-center">
                See How It Works
              </Link>
            </motion.div>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">$2.4M+</div>
                <div className="text-sm text-gray-500 mt-1">Pool TVL</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">&lt;3 min</div>
                <div className="text-sm text-gray-500 mt-1">Avg Payout</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">98.5%</div>
                <div className="text-sm text-gray-500 mt-1">AI Accuracy</div>
              </div>
            </motion.div>
          </div>
          
          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
            <div className="card-glass p-8 max-w-4xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-aeroshield-primary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-aeroshield-secondary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Flight Protection</div>
                    <div className="text-2xl font-bold text-white">6E-542 DEL → BOM</div>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-aeroshield-warning/20 text-aeroshield-warning text-sm font-medium">
                    AI Risk: High (72%)
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Coverage</div>
                    <div className="text-lg font-semibold text-white">₹5,000</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Premium</div>
                    <div className="text-lg font-semibold text-aeroshield-primary">₹65</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Threshold</div>
                    <div className="text-lg font-semibold text-white">2 hours</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="flex items-center">
                      <span className="pulse-dot mr-2" />
                      <span className="text-lg font-semibold text-aeroshield-success">Active</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center">
                    <Sparkles className="w-5 h-5 text-aeroshield-primary mr-3" />
                    <span className="text-gray-300">
                      🌧️ Heavy rain at DEL → +18% delay risk. Consider higher coverage.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose AeroShield?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We combine AI intelligence with blockchain transparency to deliver the fastest, most reliable flight protection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Payouts",
                description: "Get paid automatically within minutes of delay confirmation. No claims, no waiting.",
                color: "from-yellow-500 to-orange-500",
              },
              {
                icon: Sparkles,
                title: "AI-Powered Pricing",
                description: "Gemini AI analyzes 50+ factors to give you the fairest premium for your specific flight.",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Shield,
                title: "Blockchain Verified",
                description: "Flare Data Connector ensures trustless verification. Every payout is verifiable on-chain.",
                color: "from-cyan-500 to-blue-500",
              },
              {
                icon: Globe,
                title: "Gasless Experience",
                description: "Flare Smart Accounts let you transact without holding crypto. Just connect & protect.",
                color: "from-green-500 to-teal-500",
              },
              {
                icon: Lock,
                title: "Fully Collateralized",
                description: "150%+ collateralization with FAssets. Your payout is always guaranteed.",
                color: "from-red-500 to-pink-500",
              },
              {
                icon: TrendingUp,
                title: "Real-Time Monitoring",
                description: "Track your flight status and coverage in real-time with live updates.",
                color: "from-indigo-500 to-purple-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="card-glass p-6 hover:scale-105 transition-transform duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How AeroShield Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Four simple steps to complete flight protection
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Enter Flight",
                description: "Enter your flight details and see AI-calculated risk assessment.",
              },
              {
                step: "02",
                title: "Choose Coverage",
                description: "Select coverage amount and delay threshold. Get instant premium quote.",
              },
              {
                step: "03",
                title: "Pay & Activate",
                description: "Pay with crypto or fiat. Your policy activates immediately.",
              },
              {
                step: "04",
                title: "Auto Payout",
                description: "If your flight is delayed, receive payout automatically. Done!",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-gray-800 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
                {index < 3 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-gray-700" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="card-glass p-12 glow-effect"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Fly with Confidence?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join thousands of travelers who never worry about delays again.
              Start your protection in under 60 seconds.
            </p>
            <Link href="/dashboard/buy" className="btn-primary inline-flex items-center text-lg py-4 px-8">
              Protect Your Next Flight
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">AeroShield</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>Built on Flare Network</span>
              <span>•</span>
              <span>Powered by Gemini AI</span>
              <span>•</span>
              <span>© 2024 AeroShield</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
