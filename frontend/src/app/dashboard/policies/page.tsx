"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Plane,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
  Filter,
  Search
} from "lucide-react";
import { usePolicies } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type PolicyStatus = "all" | "active" | "triggered" | "expired" | "claimed";

interface Policy {
  id: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  coverage_amount: number;
  premium_paid: number;
  status: PolicyStatus;
  created_at: string;
  risk_score?: number;
  delay_1h_payout: number;
  delay_2h_payout: number;
  delay_4h_payout: number;
  cancellation_payout: number;
}

export default function PoliciesPage() {
  const { user } = useUser();
  const [statusFilter, setStatusFilter] = useState<PolicyStatus>("all");
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: policies, isLoading, refetch } = usePolicies();

  const filteredPolicies = policies?.filter((policy: Policy) => {
    const matchesStatus = statusFilter === "all" || policy.status === statusFilter;
    const matchesSearch = policy.flight_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Shield className="w-4 h-4 text-green-500" />;
      case "triggered":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "claimed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "expired":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      triggered: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      claimed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      pending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const calculateTimeRemaining = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diff = arrival.getTime() - now.getTime();
    
    if (diff < 0) return "Completed";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Policies</h1>
          <p className="text-gray-400 mt-1">
            View and manage your flight insurance policies
          </p>
        </div>
        <a
          href="/dashboard/buy"
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg font-medium text-white hover:from-violet-500 hover:to-purple-500 transition-all text-center"
        >
          Buy New Policy
        </a>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Policies", 
            value: policies?.length || 0, 
            icon: Shield, 
            color: "violet" 
          },
          { 
            label: "Active Coverage", 
            value: formatCurrency(
              policies?.filter((p: Policy) => p.status === "active")
                .reduce((acc: number, p: Policy) => acc + p.coverage_amount, 0) || 0
            ), 
            icon: DollarSign, 
            color: "green" 
          },
          { 
            label: "Total Premiums", 
            value: formatCurrency(
              policies?.reduce((acc: number, p: Policy) => acc + p.premium_paid, 0) || 0
            ), 
            icon: Calendar, 
            color: "blue" 
          },
          { 
            label: "Active Policies", 
            value: policies?.filter((p: Policy) => p.status === "active").length || 0, 
            icon: CheckCircle2, 
            color: "emerald" 
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by flight number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {["all", "active", "triggered", "claimed", "expired"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as PolicyStatus)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-violet-600 text-white"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300">No policies found</h3>
            <p className="text-gray-500 mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Purchase your first flight insurance policy"
              }
            </p>
            {statusFilter === "all" && !searchQuery && (
              <a
                href="/dashboard/buy"
                className="inline-block mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
              >
                Buy Policy
              </a>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredPolicies.map((policy: Policy, index: number) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl hover:border-violet-500/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Flight Info */}
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-violet-500/20 rounded-lg">
                        <Plane className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {policy.flight_number}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusBadge(policy.status)}`}>
                            {policy.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(policy.departure_time)}
                          </span>
                          {policy.status === "active" && (
                            <span className="flex items-center gap-1 text-green-400">
                              <Clock className="w-4 h-4" />
                              {calculateTimeRemaining(policy.arrival_time)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coverage & Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Coverage</p>
                        <p className="text-lg font-semibold text-white">
                          {formatCurrency(policy.coverage_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Premium</p>
                        <p className="text-lg font-semibold text-green-400">
                          {formatCurrency(policy.premium_paid)}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPolicy(policy)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Payout Tiers Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-gray-400">
                        1h delay: <span className="text-green-400">{policy.delay_1h_payout}%</span>
                      </span>
                      <span className="text-gray-400">
                        2h delay: <span className="text-green-400">{policy.delay_2h_payout}%</span>
                      </span>
                      <span className="text-gray-400">
                        4h+ delay: <span className="text-green-400">{policy.delay_4h_payout}%</span>
                      </span>
                      <span className="text-gray-400">
                        Cancellation: <span className="text-green-400">{policy.cancellation_payout}%</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Policy Details Modal */}
      <AnimatePresence>
        {selectedPolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedPolicy(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-violet-500/20 rounded-xl">
                  <Shield className="w-8 h-8 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedPolicy.flight_number}</h2>
                  <p className="text-gray-400 text-sm">Policy ID: {selectedPolicy.id.slice(0, 12)}...</p>
                </div>
                <span className={`ml-auto px-3 py-1 rounded-full text-sm border ${getStatusBadge(selectedPolicy.status)}`}>
                  {selectedPolicy.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400">Coverage Amount</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(selectedPolicy.coverage_amount)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400">Premium Paid</p>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(selectedPolicy.premium_paid)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                  <h3 className="font-medium text-white">Flight Schedule</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Departure</span>
                    <span className="text-white">{formatDate(selectedPolicy.departure_time)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Arrival</span>
                    <span className="text-white">{formatDate(selectedPolicy.arrival_time)}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                  <h3 className="font-medium text-white">Payout Structure</h3>
                  <div className="space-y-2">
                    {[
                      { label: "1 Hour Delay", pct: selectedPolicy.delay_1h_payout },
                      { label: "2 Hour Delay", pct: selectedPolicy.delay_2h_payout },
                      { label: "4+ Hour Delay", pct: selectedPolicy.delay_4h_payout },
                      { label: "Cancellation", pct: selectedPolicy.cancellation_payout },
                    ].map((tier) => (
                      <div key={tier.label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{tier.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-400">{tier.pct}%</span>
                          <span className="text-sm text-white">
                            ({formatCurrency(selectedPolicy.coverage_amount * tier.pct / 100)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPolicy.risk_score !== undefined && (
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">AI Risk Score</span>
                      <span className={`font-medium ${
                        selectedPolicy.risk_score < 30 ? "text-green-400" :
                        selectedPolicy.risk_score < 60 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {selectedPolicy.risk_score}/100
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          selectedPolicy.risk_score < 30 ? "bg-green-500" :
                          selectedPolicy.risk_score < 60 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${selectedPolicy.risk_score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Created: {formatDate(selectedPolicy.created_at)}
                </div>
              </div>

              <button
                onClick={() => setSelectedPolicy(null)}
                className="w-full mt-6 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
