import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Hook to get authenticated API client
export function useApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth interceptor
    instance.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get auth token:", error);
      }
      return config;
    });

    // Add response interceptor for error handling
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = "/sign-in";
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [getToken]);
}

// Types for API responses
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  flare_address: string | null;
  xrpl_address: string | null;
  smart_account_address: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_premium: boolean;
  kyc_status: string;
  risk_score: number | null;
  total_policies: number;
  total_claims: number;
  total_payouts_received: number;
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  policy_number: string;
  user_id: string;
  policy_type: string;
  status: string;
  flight_number: string;
  airline_code: string;
  airline_name: string | null;
  departure_airport: string;
  arrival_airport: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  coverage_amount: number;
  premium_amount: number;
  currency: string;
  delay_threshold_minutes: number;
  ai_risk_score: number | null;
  ai_delay_probability: number | null;
  ai_risk_factors: Record<string, unknown> | null;
  transaction_hash: string | null;
  actual_departure: string | null;
  actual_arrival: string | null;
  actual_delay_minutes: number | null;
  flight_status: string | null;
  payout_amount: number | null;
  payout_tx_hash: string | null;
  paid_at: string | null;
  coverage_start: string;
  coverage_end: string;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  claim_number: string;
  user_id: string;
  policy_id: string;
  claim_type: string;
  status: string;
  trigger_event: string;
  trigger_value: string | null;
  trigger_timestamp: string;
  fdc_request_id: string | null;
  fdc_verified: boolean;
  fdc_verification_timestamp: string | null;
  ftso_price_usd: number | null;
  ftso_timestamp: string | null;
  payout_amount: number;
  payout_currency: string;
  payout_address: string;
  payout_tx_hash: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoolStats {
  pool_id: string;
  name: string;
  symbol: string;
  total_value_locked: number;
  total_premiums_collected: number;
  total_payouts_made: number;
  stablecoin_reserve: number;
  fasset_reserve: number;
  collateralization_ratio: number;
  total_policies_issued: number;
  total_claims_paid: number;
  average_payout_time_seconds: number | null;
  lp_apy: number | null;
  utilization_rate: number;
  available_for_claims: number;
  is_active: boolean;
}

export interface PriceFeed {
  symbol: string;
  price: number;
  decimals: number;
  timestamp: string;
  source: string;
}

export interface DelayPrediction {
  delay_probability: number;
  risk_tier: string;
  risk_score: number;
  estimated_delay_minutes: number | null;
  risk_factors: Array<{
    name: string;
    score: number;
    weight: number;
    details: string;
    impact: string;
  }>;
  weather_summary: string;
  historical_analysis: string;
  confidence_score: number;
  recommendations: string[];
  suggested_premium: number;
}

// React Query hooks for data fetching
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// User hooks
export function useUser() {
  const api = useApi();
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const response = await api.get<User>("/users/me");
      return response.data;
    },
  });
}

// Policy hooks
export function usePolicies() {
  const api = useApi();
  return useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const response = await api.get<Policy[]>("/policies");
      return response.data;
    },
  });
}

export function usePolicy(policyId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["policies", policyId],
    queryFn: async () => {
      const response = await api.get<Policy>(`/policies/${policyId}`);
      return response.data;
    },
    enabled: !!policyId,
  });
}

export function useFlightQuote() {
  const api = useApi();
  return useMutation({
    mutationFn: async (data: {
      flight_number: string;
      flight_date: string;
      coverage_amount: number;
    }) => {
      const response = await api.post("/policies/quote", data);
      return response.data;
    },
  });
}

export function useCreatePolicy() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      flight_number: string;
      departure_airport: string;
      arrival_airport: string;
      departure_time: string;
      arrival_time: string;
      coverage_amount: number;
      premium_amount: number;
    }) => {
      const response = await api.post("/policies/create", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
}

// Claims hooks
export function useClaims() {
  const api = useApi();
  return useQuery({
    queryKey: ["claims"],
    queryFn: async () => {
      const response = await api.get<Claim[]>("/claims");
      return response.data;
    },
  });
}

export function useClaim(claimId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["claims", claimId],
    queryFn: async () => {
      const response = await api.get<Claim>(`/claims/${claimId}`);
      return response.data;
    },
    enabled: !!claimId,
  });
}

export function useCreateClaim() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      policy_id: string;
      evidence?: string;
    }) => {
      const response = await api.post("/claims/create", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
}

export function useVerifyClaim() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claimId: string) => {
      const response = await api.post(`/claims/${claimId}/verify`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });
}

// Pool hooks
export function usePoolStats() {
  const api = useApi();
  return useQuery({
    queryKey: ["pool", "stats"],
    queryFn: async () => {
      const response = await api.get<PoolStats>("/pool/stats");
      return response.data;
    },
  });
}

// AI hooks
export function usePredictDelay() {
  const api = useApi();
  return useMutation({
    mutationFn: async (data: {
      flight_number: string;
      flight_date: string;
      departure_airport: string;
      arrival_airport: string;
    }) => {
      const response = await api.post<DelayPrediction>("/ai/predict-delay", data);
      return response.data;
    },
  });
}

// Price feeds
export function usePriceFeeds() {
  const api = useApi();
  return useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const response = await api.get<PriceFeed[]>("/blockchain/ftso/prices");
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Dashboard stats
export function useDashboardStats() {
  const api = useApi();
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const [user, policies, claims, pool] = await Promise.all([
        api.get<User>("/users/me"),
        api.get<Policy[]>("/policies"),
        api.get<Claim[]>("/claims"),
        api.get<PoolStats>("/pool/stats"),
      ]);
      
      const activePolicies = policies.data.filter(p => p.status === "active");
      const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverage_amount, 0);
      const pendingClaims = claims.data.filter(c => c.status === "pending" || c.status === "processing");
      const totalPayouts = claims.data
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + c.payout_amount, 0);

      return {
        user: user.data,
        totalPolicies: policies.data.length,
        activePolicies: activePolicies.length,
        totalCoverage,
        totalClaims: claims.data.length,
        pendingClaims: pendingClaims.length,
        totalPayouts,
        poolStats: pool.data,
      };
    },
  });
}
