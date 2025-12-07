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
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const api = useApi();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [policiesRes, poolRes] = await Promise.all([
          api.get("/policies"),
          api.get("/pool/stats"),
        ]);
        setPolicies(policiesRes.data || []);
        setPoolStats(poolRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  const activePolicies = policies.filter((p) => p.status === "active");
  const pendingPolicies = policies.filter((p) => p.status === "pending");

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: "bg-green-500/20 text-green-400", icon: <CheckCircle className="w-3 h-3" /> },
      pending: { color: "bg-yellow-500/20 text-yellow-400", icon: <Timer className="w-3 h-3" /> },
      expired: { color: "bg-gray-500/20 text-gray-400", icon: <Clock className="w-3 h-3" /> },
      claimed: { color: "bg-blue-500/20 text-blue-400", icon: <CheckCircle className="w-3 h-3" /> },
      paid: { color: "bg-purple-500/20 text-purple-400", icon: <CheckCircle className="w-3 h-3" /> },
    };
    return badges[status] || badges.pending;
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-400";
    if (score < 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.firstName || "Traveler"}! 👋
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your flight protection and track your coverage
            </p>
          </div>
          <Link
            href="/dashboard/buy"
            className="btn-primary mt-4 md:mt-0 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Protect New Flight
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Policies</p>
                <p className="text-2xl font-bold text-white mt-1">{activePolicies.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-glass p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Coverage</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ₹{activePolicies.reduce((acc, p) => acc + p.coverage_amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-glass p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pool TVL</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${poolStats?.total_value_locked?.toLocaleString() || "2.4M"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-glass p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Payout</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {poolStats?.average_payout_time_seconds
                    ? `${Math.round(poolStats.average_payout_time_seconds / 60)}min`
                    : "<3min"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Policies */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Policies</h2>
            <Link
              href="/dashboard/policies"
              className="text-sm text-aeroshield-primary hover:text-aeroshield-secondary flex items-center"
            >
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12">
              <Plane className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Policies Yet</h3>
              <p className="text-gray-400 mb-6">Protect your next flight with AeroShield</p>
              <Link href="/dashboard/buy" className="btn-primary inline-flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Get Your First Policy
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.slice(0, 5).map((policy, index) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-aeroshield-primary/20 to-aeroshield-secondary/20 flex items-center justify-center">
                      <Plane className="w-5 h-5 text-aeroshield-primary" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{policy.flight_number}</span>
                        <span className="text-gray-500">•</span>
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

                  <div className="flex items-center space-x-6">
                    <div className="text-right hidden md:block">
                      <div className="text-sm text-gray-400">Coverage</div>
                      <div className="font-semibold text-white">
                        ₹{policy.coverage_amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      <div className="text-sm text-gray-400">AI Risk</div>
                      <div className={`font-semibold ${getRiskColor(policy.ai_risk_score)}`}>
                        {policy.ai_risk_score}%
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                        getStatusBadge(policy.status).color
                      }`}
                    >
                      {getStatusBadge(policy.status).icon}
                      <span className="capitalize">{policy.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card-glass p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-aeroshield-primary" />
            <h2 className="text-xl font-semibold text-white">AI Insights</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium">Weather Alert</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Monsoon activity detected in DEL region. Consider higher coverage for flights tomorrow.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium">Route Insight</p>
                  <p className="text-gray-400 text-sm mt-1">
                    DEL-BOM route has 23% higher delays during evening slots. Morning flights recommended.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
