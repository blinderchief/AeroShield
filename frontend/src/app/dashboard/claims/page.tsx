"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plane, 
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  XCircle
} from "lucide-react";
import { usePolicies, useCreateClaim, useClaims } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type ClaimStatus = "all" | "pending" | "processing" | "approved" | "rejected" | "paid";

interface Claim {
  id: string;
  policy_id: string;
  flight_number: string;
  status: ClaimStatus;
  amount: number;
  delay_minutes?: number;
  is_cancelled?: boolean;
  created_at: string;
  processed_at?: string;
}

export default function ClaimsPage() {
  const { user } = useUser();
  const [statusFilter, setStatusFilter] = useState<ClaimStatus>("all");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string>("");
  
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const { data: claims, isLoading: claimsLoading, refetch } = useClaims();
  const createClaimMutation = useCreateClaim();

  const filteredClaims = claims?.filter((claim: Claim) => 
    statusFilter === "all" || claim.status === statusFilter
  ) || [];

  const eligiblePolicies = policies?.filter((p: any) => 
    p.status === "active" && new Date(p.arrival_time) < new Date()
  ) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "processing":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "approved":
      case "paid":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      approved: "bg-green-500/20 text-green-400 border-green-500/30",
      paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const handleSubmitClaim = async () => {
    if (!selectedPolicy) return;
    
    try {
      await createClaimMutation.mutateAsync({
        policy_id: selectedPolicy,
        evidence: "Flight delay/cancellation claim submission"
      });
      setShowSubmitModal(false);
      setSelectedPolicy("");
      refetch();
    } catch (error) {
      console.error("Failed to submit claim:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Claims</h1>
          <p className="text-gray-400 mt-1">
            Submit and track your insurance claims
          </p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          disabled={eligiblePolicies.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg font-medium text-white hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit New Claim
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Claims", value: claims?.length || 0, icon: FileText, color: "blue" },
          { label: "Pending", value: claims?.filter((c: Claim) => c.status === "pending").length || 0, icon: Clock, color: "yellow" },
          { label: "Approved", value: claims?.filter((c: Claim) => c.status === "approved" || c.status === "paid").length || 0, icon: CheckCircle2, color: "green" },
          { label: "Total Payouts", value: formatCurrency(claims?.reduce((acc: number, c: Claim) => c.status === "paid" ? acc + c.amount : acc, 0) || 0), icon: Download, color: "emerald" },
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Status:</span>
        </div>
        {["all", "pending", "processing", "approved", "paid", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as ClaimStatus)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === status
                ? "bg-violet-600 text-white"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {claimsLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300">No claims found</h3>
            <p className="text-gray-500 mt-1">
              {statusFilter === "all" 
                ? "Submit your first claim when you experience a flight delay"
                : `No ${statusFilter} claims at the moment`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredClaims.map((claim: Claim, index: number) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl hover:border-violet-500/30 transition-all cursor-pointer"
                  onClick={() => setSelectedClaim(claim)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-violet-500/20 rounded-lg">
                        <Plane className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{claim.flight_number}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusBadge(claim.status)}`}>
                            {claim.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Submitted {formatDate(claim.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {claim.amount > 0 ? formatCurrency(claim.amount) : "Pending"}
                      </p>
                      {claim.delay_minutes && (
                        <p className="text-sm text-gray-400">
                          {claim.is_cancelled ? "Cancelled" : `${claim.delay_minutes} min delay`}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Submit Claim Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Submit New Claim</h2>
              
              {eligiblePolicies.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-gray-300">No eligible policies</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Claims can only be submitted after your flight's arrival time
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-4">
                    Select a policy to submit a claim. Our AI-powered system will verify
                    your flight status automatically through Flare's Data Connector.
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {eligiblePolicies.map((policy: any) => (
                      <button
                        key={policy.id}
                        onClick={() => setSelectedPolicy(policy.id)}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          selectedPolicy === policy.id
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Plane className="w-5 h-5 text-violet-400" />
                            <div>
                              <p className="font-medium text-white">{policy.flight_number}</p>
                              <p className="text-sm text-gray-400">
                                Coverage: {formatCurrency(policy.coverage_amount)}
                              </p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            selectedPolicy === policy.id
                              ? "border-violet-500 bg-violet-500"
                              : "border-gray-600"
                          }`}>
                            {selectedPolicy === policy.id && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitClaim}
                  disabled={!selectedPolicy || createClaimMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createClaimMutation.isPending ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Details Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedClaim(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-violet-500/20 rounded-lg">
                  <Plane className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedClaim.flight_number}</h2>
                  <p className="text-gray-400 text-sm">Claim ID: {selectedClaim.id.slice(0, 8)}...</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                  <span className="text-gray-400">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm border ${getStatusBadge(selectedClaim.status)}`}>
                    {getStatusIcon(selectedClaim.status)}
                    <span className="ml-2">{selectedClaim.status}</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                  <span className="text-gray-400">Payout Amount</span>
                  <span className="text-white font-medium">
                    {selectedClaim.amount > 0 ? formatCurrency(selectedClaim.amount) : "TBD"}
                  </span>
                </div>
                
                {selectedClaim.delay_minutes !== undefined && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                    <span className="text-gray-400">Delay</span>
                    <span className="text-white">
                      {selectedClaim.is_cancelled ? "Flight Cancelled" : `${selectedClaim.delay_minutes} minutes`}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                  <span className="text-gray-400">Submitted</span>
                  <span className="text-white">{formatDate(selectedClaim.created_at)}</span>
                </div>
                
                {selectedClaim.processed_at && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                    <span className="text-gray-400">Processed</span>
                    <span className="text-white">{formatDate(selectedClaim.processed_at)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedClaim(null)}
                className="w-full mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
