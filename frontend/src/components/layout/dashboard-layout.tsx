"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  Plane,
  ClipboardList,
  Wallet,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Bell,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & stats" },
  { href: "/dashboard/buy", label: "Buy Policy", icon: Plane, description: "Protect a flight" },
  { href: "/dashboard/policies", label: "My Policies", icon: ClipboardList, description: "View all policies" },
  { href: "/dashboard/claims", label: "Claims", icon: Shield, description: "Track claims" },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, description: "Manage funds" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, description: "Preferences" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 hero-gradient pointer-events-none opacity-50" />
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-20" />
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-2xl border-b border-gray-800/50">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center shadow-lg shadow-aeroshield-primary/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AeroShield</span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-aeroshield-primary rounded-full" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-gray-950/95 backdrop-blur-2xl border-r border-gray-800/50 transform transition-all duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 h-20 border-b border-gray-800/50">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center shadow-lg shadow-aeroshield-primary/25 group-hover:shadow-aeroshield-primary/40 transition-shadow">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">AeroShield</span>
                <p className="text-xs text-gray-500">Flight Insurance</p>
              </div>
            </Link>
          </div>

          {/* AI Quick Action */}
          <div className="px-4 pt-6 pb-4">
            <Link
              href="/dashboard/buy"
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-aeroshield-primary/10 to-aeroshield-secondary/10 border border-aeroshield-primary/20 hover:border-aeroshield-primary/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-aeroshield-primary to-aeroshield-secondary flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Quick Protect</div>
                <div className="text-xs text-gray-400">AI-powered quotes</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-aeroshield-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Menu
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const isHovered = hoveredItem === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-aeroshield-primary/15 to-aeroshield-secondary/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-aeroshield-primary to-aeroshield-secondary rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isActive 
                      ? "bg-gradient-to-br from-aeroshield-primary/20 to-aeroshield-secondary/20" 
                      : "bg-gray-800/50 group-hover:bg-gray-700/50"
                  }`}>
                    <item.icon className={`w-5 h-5 ${isActive ? "text-aeroshield-primary" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{item.label}</span>
                    {(isActive || isHovered) && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-gray-500 truncate"
                      >
                        {item.description}
                      </motion.p>
                    )}
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-aeroshield-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Help & User Section */}
          <div className="px-4 py-4 border-t border-gray-800/50 space-y-3">
            <Link
              href="/help"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center group-hover:bg-gray-700/50 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Help & Support</span>
            </Link>
            
            <SignedIn>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-800/50">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-gray-700",
                    },
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">My Account</p>
                  <p className="text-xs text-gray-500 truncate">Manage your profile</p>
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 relative">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 h-20 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-semibold text-white">
              {NAV_ITEMS.find(item => 
                pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              )?.label || "Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">
              {NAV_ITEMS.find(item => 
                pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              )?.description || "Welcome back"}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-aeroshield-primary rounded-full animate-pulse" />
            </button>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 ring-2 ring-gray-700 hover:ring-aeroshield-primary/50 transition-all",
                  },
                }}
              />
            </SignedIn>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
