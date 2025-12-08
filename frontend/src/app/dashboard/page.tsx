"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Plane,
  Plus,
  Clock,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Timer,
  Zap,
  BarChart3,
} from "lucide-react";
import { useApi } from "@/lib/api";

interface Policy {
  id: string;
  policy_number: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  scheduled_departure: string;
  status: string;
  coverage_amount: number;
  premium_amount: number;
  ai_risk_score: number;
}

interface PoolStats {
  total_value_locked: number;
  total_policies_issued: number;
  average_payout_time_seconds: number;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const api = useApi();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch policies - may fail if user not registered in backend yet
        const policiesRes = await api.get("/policies").catch(() => ({ data: [] }));
        setPolicies(policiesRes.data || []);
        
        // Try to fetch pool stats - may fail if no pool exists
        const poolRes = await api.get("/pool/stats").catch(() => ({ data: null }));
        setPoolStats(poolRes.data);
      } catch (error) {
        // Silently handle errors - show empty state instead
        console.warn("Dashboard data fetch failed (this is normal if backend is not running):", error);
        setPolicies([]);
        setPoolStats(null);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchData();
    } else if (isLoaded && !user) {
      // User not logged in, stop loading
      setLoading(false);
    }
  }, [isLoaded, user, api]);

  const activePolicies = policies.filter((p) => p.status === "active");
  const pendingPolicies = policies.filter((p) => p.status === "pending");

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
      active: { 
        color: "text-green-400", 
        bg: "bg-green-500/10 border-green-500/20",
        icon: <CheckCircle className="w-3.5 h-3.5" /> 
      },
      pending: { 
        color: "text-yellow-400", 
        bg: "bg-yellow-500/10 border-yellow-500/20",
        icon: <Timer className="w-3.5 h-3.5" /> 
      },
      expired: { 
        color: "text-gray-400", 
        bg: "bg-gray-500/10 border-gray-500/20",
        icon: <Clock className="w-3.5 h-3.5" /> 
      },
      claimed: { 
        color: "text-blue-400", 
        bg: "bg-blue-500/10 border-blue-500/20",
        icon: <CheckCircle className="w-3.5 h-3.5" /> 
      },
      paid: { 
        color: "text-purple-400", 
        bg: "bg-purple-500/10 border-purple-500/20",
        icon: <Zap className="w-3.5 h-3.5" /> 
      },
    };
    return badges[status] || badges.pending;
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-400";
    if (score < 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getRiskBg = (score: number) => {
    if (score < 30) return "bg-green-500/10";
    if (score < 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Welcome back, {user?.firstName || "Traveler"}! 
            <span className="ml-2 inline-block animate-bounce-subtle">👋</span>
          </h1>
          <p className="text-gray-400">
            Here's an overview of your flight protection
          </p>
        </div>
        <Link
          href="/dashboard/buy"
          className="btn-primary flex items-center justify-center gap-2 group"
        >
          <Plus className="w-5 h-5" />
          <span>Protect New Flight</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
        </Link>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {[
          {
            label: "Active Policies",
            value: activePolicies.length.toString(),
            icon: Shield,
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-500/10",
            trend: "+2 this week",
          },
          {
            label: "Total Coverage",
            value: `₹${activePolicies.reduce((acc, p) => acc + p.coverage_amount, 0).toLocaleString()}`,
            icon: TrendingUp,
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-500/10",
            trend: "Across all policies",
          },
          {
            label: "Pool TVL",
            value: `$${poolStats?.total_value_locked?.toLocaleString() || "2.4M"}`,
            icon: Activity,
            color: "from-purple-500 to-pink-500",
            bgColor: "bg-purple-500/10",
            trend: "Fully collateralized",
          },
          {
            label: "Avg Payout",
            value: poolStats?.average_payout_time_seconds
              ? `${Math.round(poolStats.average_payout_time_seconds / 60)}min`
              : "<3min",
            icon: Zap,
            color: "from-amber-500 to-orange-500",
            bgColor: "bg-amber-500/10",
            trend: "Instant verification",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={fadeInUp}
            className="card-glass p-5 md:p-6 group hover:border-gray-700/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} 
                  style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
              </div>
              <BarChart3 className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Policies */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card-glass p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Your Policies</h2>
              <p className="text-sm text-gray-500">Active flight protection</p>
            </div>
            <Link
              href="/dashboard/policies"
              className="text-sm text-aeroshield-primary hover:text-aeroshield-secondary flex items-center gap-1 group"
            >
              View All
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-800/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Policies Yet</h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                Protect your next flight with AI-powered parametric insurance
              </p>
              <Link href="/dashboard/buy" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Get Your First Policy
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {policies.slice(0, 5).map((policy, index) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="group flex items-center justify-between p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aeroshield-primary/10 to-aeroshield-secondary/10 flex items-center justify-center border border-aeroshield-primary/20 group-hover:border-aeroshield-primary/40 transition-colors">
                      <Plane className="w-5 h-5 text-aeroshield-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{policy.flight_number}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">
                          {policy.departure_airport} → {policy.arrival_airport}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(policy.scheduled_departure).toLocaleDateString("en-IN", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-gray-500 mb-0.5">Coverage</div>
                      <div className="font-semibold text-white">
                        ₹{policy.coverage_amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-gray-500 mb-0.5">AI Risk</div>
                      <div className={`font-semibold ${getRiskColor(policy.ai_risk_score)} flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getRiskBg(policy.ai_risk_score)}`} 
                          style={{ backgroundColor: policy.ai_risk_score < 30 ? '#10B981' : policy.ai_risk_score < 60 ? '#F59E0B' : '#EF4444' }} />
                        {policy.ai_risk_score}%
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${getStatusBadge(policy.status).bg} ${getStatusBadge(policy.status).color}`}>
                      {getStatusBadge(policy.status).icon}
                      <span className="capitalize hidden sm:inline">{policy.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* AI Insights Sidebar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* AI Insights Card */}
          <div className="card-glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aeroshield-primary/20 to-aeroshield-secondary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-aeroshield-primary" />
              </div>
              <h2 className="text-lg font-semibold text-white">AI Insights</h2>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Weather Alert</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Monsoon activity detected in DEL region. Consider higher coverage for flights tomorrow.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-400">Route Insight</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      DEL-BOM route has 23% higher delays during evening slots. Morning flights recommended.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Good News</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Your upcoming BLR-HYD flight has low delay probability (12%). You're well protected!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-glass p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                href="/dashboard/buy"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-aeroshield-primary/10 flex items-center justify-center group-hover:bg-aeroshield-primary/20 transition-colors">
                  <Plus className="w-4 h-4 text-aeroshield-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">New Policy</span>
                  <p className="text-xs text-gray-500">Protect a flight</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </Link>
              
              <Link 
                href="/dashboard/claims"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">View Claims</span>
                  <p className="text-xs text-gray-500">Track status</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
